// Daily prayer reminder. Invoked by pg_cron every 5 min.
// For each opted-in user, compute the current local hour in their timezone.
// If it matches their reminder hour AND we haven't notified them today,
// send a single push and stamp daily_reminder_last_sent_date.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROMPTS = [
  { title: 'A quiet moment', body: 'Open the app to lift up someone who needs it.' },
  { title: 'Time to pray', body: 'Three people in your community are waiting to be prayed for.' },
  { title: 'Pause and pray', body: 'A few minutes of stillness — who is on your heart today?' },
  { title: 'Hold someone up', body: 'Tap in to pray over a request, or share one of your own.' },
];

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

function localHourFor(tz: string, now: Date): number | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const h = fmt.formatToParts(now).find((p) => p.type === 'hour')?.value;
    if (h == null) return null;
    const n = parseInt(h, 10);
    return Number.isFinite(n) ? n % 24 : null;
  } catch {
    return null;
  }
}

function localDateFor(tz: string, now: Date): string | null {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // YYYY-MM-DD
  } catch {
    return null;
  }
}

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

  const now = new Date();

  const { data: rows, error } = await admin
    .from('notification_preferences')
    .select('user_id, daily_reminder_hour, timezone, daily_reminder_last_sent_date')
    .eq('daily_reminder_enabled', true);

  if (error) {
    console.error('prefs lookup failed', error);
    return json({ error: error.message }, 500);
  }
  if (!rows || rows.length === 0) return json({ ok: true, sent: 0 });

  const dueUserIds: string[] = [];
  const dueDateByUser: Record<string, string> = {};

  for (const r of rows) {
    if (r.daily_reminder_hour == null || !r.timezone) continue;
    const localHour = localHourFor(r.timezone, now);
    const localDate = localDateFor(r.timezone, now);
    if (localHour == null || localDate == null) continue;
    if (localHour !== r.daily_reminder_hour) continue;
    if (r.daily_reminder_last_sent_date === localDate) continue;
    dueUserIds.push(r.user_id);
    dueDateByUser[r.user_id] = localDate;
  }

  if (dueUserIds.length === 0) return json({ ok: true, sent: 0 });

  const { data: tokens, error: tErr } = await admin
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', dueUserIds);

  if (tErr) {
    console.error('token lookup failed', tErr);
    return json({ error: tErr.message }, 500);
  }

  const messages: ExpoMessage[] = [];
  for (const t of tokens ?? []) {
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    messages.push({
      to: t.token,
      title: prompt.title,
      body: prompt.body,
      sound: 'default',
      data: { type: 'daily_reminder' },
      channelId: 'default',
    });
  }

  for (const userId of dueUserIds) {
    const { error: uErr } = await admin
      .from('notification_preferences')
      .update({ daily_reminder_last_sent_date: dueDateByUser[userId] })
      .eq('user_id', userId);
    if (uErr) console.error('stamp failed', userId, uErr);
  }

  if (messages.length === 0) return json({ ok: true, sent: 0, due: dueUserIds.length });

  const { invalidTokens } = await sendExpoPush(messages);
  if (invalidTokens.length > 0) {
    await admin.from('push_tokens').delete().in('token', invalidTokens);
  }

  return json({ ok: true, sent: messages.length, due: dueUserIds.length });
});
