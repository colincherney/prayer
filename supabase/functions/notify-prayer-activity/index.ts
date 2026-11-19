// eslint-disable-next-line import/no-unresolved -- Deno resolves URL imports.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';
import { type PrayerPushMessage, readPrayerPushReceipts, sendPrayerPushes } from '../_shared/prayerNotifications.ts';

type GroupAlert = { id: string; user_id: string; group_id: string; group_name: string; claimed_at: string };
type ReflectionReminder = { user_id: string; previous_date: string | null; sent_date: string };
type Token = { user_id: string; token: string };
const json = (value: unknown, status = 200) => Response.json(value, { status });

function hasServiceRoleClaim(token: string): boolean {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role';
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'server_misconfigured' }, 500);
  const authorization = req.headers.get('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  // A signed-in account must never be able to trigger other people's alerts.
  if (token !== serviceKey && !hasServiceRoleClaim(token)) return json({ error: 'unauthorized' }, 401);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  if (token !== serviceKey) {
    // Existing cron can hold a different, still-valid legacy service JWT.
    // The role claim alone never authorizes: require an exact match with the
    // private scheduler credential, in addition to gateway JWT verification.
    const configured = await admin.from('notifications_config').select('service_role_key').eq('id', 1).maybeSingle();
    if (configured.error) return json({ error: 'scheduler_auth_unavailable' }, 500);
    if (token !== configured.data?.service_role_key) return json({ error: 'unauthorized' }, 401);
  }

  try {
    const receiptRows = await admin.from('prayer_notification_receipts').select('ticket_id, token')
      .lt('created_at', new Date(Date.now() - 15 * 60000).toISOString()).order('created_at').limit(100);
    if (receiptRows.error) throw receiptRows.error;
    const rows = (receiptRows.data ?? []) as { ticket_id: string; token: string }[];
    const results = await readPrayerPushReceipts(rows.map(row => row.ticket_id));
    const invalidIds = new Set(results.invalid);
    const invalidTokens = rows.filter(row => invalidIds.has(row.ticket_id)).map(row => row.token);
    if (invalidTokens.length) {
      const removed = await admin.from('push_tokens').delete().in('token', invalidTokens);
      if (removed.error) throw removed.error;
    }
    if (results.checked.length) {
      const removed = await admin.from('prayer_notification_receipts').delete().in('ticket_id', results.checked);
      if (removed.error) throw removed.error;
    }
    const expired = await admin.from('prayer_notification_receipts').delete()
      .lt('created_at', new Date(Date.now() - 24 * 3600000).toISOString());
    if (expired.error) throw expired.error;
  } catch (error) {
    // A receipt outage must not delay today's new notifications.
    console.error('Prayer receipt check failed', error);
  }

  const groupResult = await admin.rpc('claim_group_prayer_notifications');
  if (groupResult.error) return json({ error: 'group_claim_failed' }, 500);
  const groups = (groupResult.data ?? []) as GroupAlert[];
  const reflectionResult = await admin.rpc('claim_prayer_reflection_reminders');
  if (reflectionResult.error) return json({ error: 'reflection_claim_failed' }, 500);
  const reflections = (reflectionResult.data ?? []) as ReflectionReminder[];

  const restoreReflection = async (reminder: ReflectionReminder) => {
    const result = await admin.from('notification_preferences')
      .update({ reflection_reminder_last_sent_date: reminder.previous_date })
      .eq('user_id', reminder.user_id).eq('reflection_reminder_last_sent_date', reminder.sent_date);
    if (result.error) console.error('Could not release reflection reminder', result.error);
  };

  try {
    const userIds = [...new Set([...groups, ...reflections].map(row => row.user_id))];
    if (!userIds.length) return json({ ok: true, accepted: 0 });
    const tokenResult = await admin.from('push_tokens').select('user_id, token').in('user_id', userIds);
    if (tokenResult.error) throw tokenResult.error;
    const tokensByUser = new Map<string, string[]>();
    for (const row of (tokenResult.data ?? []) as Token[]) {
      tokensByUser.set(row.user_id, [...(tokensByUser.get(row.user_id) ?? []), row.token]);
    }
    const messages: PrayerPushMessage[] = [];
    for (const group of groups) {
      for (const token of tokensByUser.get(group.user_id) ?? []) {
        messages.push({ key: group.id, to: token, title: 'New group prayer',
          body: `Someone shared a prayer in ${group.group_name}. Take a moment to pray together.`,
          data: { type: 'group_prayer', group_id: group.group_id }, sound: 'default', channelId: 'default' });
      }
    }
    for (const reminder of reflections) {
      for (const token of tokensByUser.get(reminder.user_id) ?? []) {
        messages.push({ key: `reflect:${reminder.user_id}`, to: token, title: 'A moment to reflect',
          body: 'Take a quiet moment to reflect on your prayers.',
          data: { type: 'prayer_reflection_reminder' }, sound: 'default', channelId: 'default' });
      }
    }
    const result = await sendPrayerPushes(messages);
    if (result.receipts.length) {
      const saved = await admin.from('prayer_notification_receipts').upsert(result.receipts, { onConflict: 'ticket_id' });
      if (saved.error) console.error('Could not save prayer push receipts', saved.error);
    }
    if (result.invalidTokens.length) {
      const removed = await admin.from('push_tokens').delete().in('token', result.invalidTokens);
      if (removed.error) console.error('Could not remove unregistered devices', removed.error);
    }
    for (const group of groups) {
      // Tokenless users do not accumulate stale group alerts. Temporary failures
      // retain their lease and retry in five minutes, for up to one day.
      if (result.accepted.has(group.id) || !tokensByUser.has(group.user_id) ||
          (tokensByUser.get(group.user_id) ?? []).every(token => result.invalidTokens.includes(token))) {
        const delivered = await admin.from('group_prayer_notification_queue')
          .update({ delivered_at: new Date().toISOString() }).eq('id', group.id).eq('claimed_at', group.claimed_at);
        if (delivered.error) console.error('Could not acknowledge group prayer', delivered.error);
      }
    }
    for (const reminder of reflections) {
      if (!result.accepted.has(`reflect:${reminder.user_id}`)) await restoreReflection(reminder);
    }
    return json({ ok: true, accepted: result.accepted.size });
  } catch (error) {
    console.error('Prayer notification delivery failed', error);
    for (const reminder of reflections) await restoreReflection(reminder);
    return json({ error: 'delivery_failed' }, 500);
  }
});
