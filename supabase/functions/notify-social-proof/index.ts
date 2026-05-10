// Social-proof push: 1-2h after a prayer is posted, tell the author how many
// people are praying for them. Invoked by pg_cron every ~10 min.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MIN_AGE_MIN = 60;
const MAX_AGE_MIN = 180;
const BATCH = 200;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_CHUNK = 100;

type ExpoMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
};

async function sendExpoPush(messages: ExpoMessage[]): Promise<{ invalidTokens: string[] }> {
  const invalidTokens: string[] = [];
  for (let i = 0; i < messages.length; i += PUSH_CHUNK) {
    const batch = messages.slice(i, i + PUSH_CHUNK);
    let res: Response;
    try {
      res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
    } catch (e) {
      console.error('expo push fetch failed', e);
      continue;
    }
    if (!res.ok) {
      console.error('expo push error', res.status, await res.text());
      continue;
    }
    const json = await res.json().catch(() => null);
    const data: Array<{ status: string; details?: { error?: string } }> = Array.isArray(json?.data)
      ? json.data
      : [];
    data.forEach((ticket, idx) => {
      if (
        ticket.status === 'error' &&
        (ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials')
      ) {
        invalidTokens.push(batch[idx].to);
      }
    });
  }
  return { invalidTokens };
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const minCutoff = new Date(Date.now() - MAX_AGE_MIN * 60_000).toISOString();
  const maxCutoff = new Date(Date.now() - MIN_AGE_MIN * 60_000).toISOString();

  // Cleanup: prayers older than MAX_AGE_MIN with 0 interactions are no longer
  // re-evaluated (they fall out of the window below). Mark them notified so
  // they leave the partial index `prayers_social_proof_pending_idx`.
  await admin
    .from('prayers')
    .update({ social_proof_notified_at: new Date().toISOString() })
    .is('social_proof_notified_at', null)
    .lt('created_at', minCutoff);

  const { data: prayers, error: pErr } = await admin
    .from('prayers')
    .select('id, user_id, title, body')
    .is('social_proof_notified_at', null)
    .gte('created_at', minCutoff)
    .lte('created_at', maxCutoff)
    .order('created_at', { ascending: true })
    .limit(BATCH);

  if (pErr) {
    console.error('prayer lookup failed', pErr);
    return json({ error: pErr.message }, 500);
  }
  if (!prayers || prayers.length === 0) return json({ ok: true, sent: 0 });

  const messages: ExpoMessage[] = [];
  // Prayers we've decided to stop re-evaluating: either we sent a push, or
  // there's no point retrying (user opted out, no tokens, count error).
  // Prayers with 0 interactions are intentionally left unmarked so the next
  // cron run can pick them up once the synthetic-engagement schedule has
  // drained more rows into prayer_interactions.
  const concludedPrayerIds: string[] = [];
  let skippedNoCount = 0;

  for (const p of prayers) {
    const { data: prefs } = await admin
      .from('notification_preferences')
      .select('social_proof_enabled')
      .eq('user_id', p.user_id)
      .maybeSingle();
    if (prefs && prefs.social_proof_enabled === false) {
      concludedPrayerIds.push(p.id);
      continue;
    }

    const { count, error: cErr } = await admin
      .from('prayer_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('prayer_id', p.id)
      .eq('action', 'prayed')
      .neq('user_id', p.user_id);
    if (cErr) {
      console.error('interaction count failed', p.id, cErr);
      concludedPrayerIds.push(p.id);
      continue;
    }
    const n = count ?? 0;
    if (n < 1) {
      skippedNoCount++;
      continue;
    }

    const { data: tokens, error: tErr } = await admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', p.user_id);
    if (tErr) {
      console.error('token lookup failed', p.user_id, tErr);
      concludedPrayerIds.push(p.id);
      continue;
    }
    if (!tokens || tokens.length === 0) {
      concludedPrayerIds.push(p.id);
      continue;
    }

    const title = n === 1
      ? '1 person is praying for you'
      : `${n} people are praying for you`;
    const body = p.title?.trim()
      ? `For "${p.title.trim().slice(0, 80)}"`
      : 'Your prayer is being held by the community.';

    for (const t of tokens) {
      messages.push({
        to: t.token,
        title,
        body,
        sound: 'default',
        data: { type: 'social_proof', prayer_id: p.id },
        channelId: 'default',
      });
    }
    concludedPrayerIds.push(p.id);
  }

  if (concludedPrayerIds.length > 0) {
    const { error: uErr } = await admin
      .from('prayers')
      .update({ social_proof_notified_at: new Date().toISOString() })
      .in('id', concludedPrayerIds);
    if (uErr) console.error('mark notified failed', uErr);
  }

  if (messages.length === 0) {
    return json({
      ok: true,
      sent: 0,
      processed: prayers.length,
      concluded: concludedPrayerIds.length,
      retry_later: skippedNoCount,
    });
  }

  const { invalidTokens } = await sendExpoPush(messages);
  if (invalidTokens.length > 0) {
    await admin.from('push_tokens').delete().in('token', invalidTokens);
  }

  return json({
    ok: true,
    sent: messages.length,
    processed: prayers.length,
    concluded: concludedPrayerIds.length,
    retry_later: skippedNoCount,
  });
});
