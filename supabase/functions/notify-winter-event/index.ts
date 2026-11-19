// Seasonal event reminders (the Long Winter, the Swamp King, ...). Called hourly by pg_cron through
// private.dispatch_winter_event_if_due(), which only calls it when someone is due. Opt-in only
// (user_event_progress.event_notifications), at 9am in the person's timezone, never more than one a day
// (last_notified_on), and each reminder at most once (user_event_progress.notified). The wording for each event is in
// its config.reminders; the reminders follow each person's own progress rather than holidays:
//
//   start       first day of the event
//   mage        the morning after stage 2
//   lord        the morning after all 10 challenges
//   halfway     the event's middle day, if unfinished
//   last-<day>  the last 3 days, if still possible

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_CHUNK = 100;
const SEND_HOUR = 9;

type ExpoMessage = { to: string; title: string; body: string; data: Record<string, unknown>; sound: 'default'; channelId: string };

type EventRow = { id: string; title: string; starts_on: string; ends_on: string; config: Record<string, any> };
type ProgressRow = {
  user_id: string;
  event_id: string;
  tz: string;
  stage_unlocked: number;
  frost_lord_ready: boolean;
  challenges_completed: string[];
  challenges_closed: string[];
  notified: string[] | null;
  last_notified_on: string | null;
};
type Reminder = { key: string; title: string; body: string };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function local(tz: string, now: Date): { date: string; hour: number } | null {
  try {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now)) % 24;
    return { date, hour };
  } catch {
    return null;
  }
}

const toUtc = (day: string) => Date.parse(`${day}T12:00:00Z`);
const addDays = (day: string, n: number) => new Date(toUtc(day) + n * 86400000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / 86400000);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Each event's wording lives in its config.reminders ('{n}' becomes "3 challenges"); these are the Long Winter's. */
const DEFAULT_WORDING = {
  start: 'The Long Winter has begun. Meet Snowcap.',
  mage: 'Your Frost Mage is ready. {n} to the Frost Lord.',
  lord: 'The Frost Lord is crowned, and five winter keepsakes are on your shelf.',
  halfway: 'Halfway through the Long Winter. {n} to go.',
  last: '{n} left to the Frost Lord.',
};

/** The one reminder for this person today, if any. The most personal one wins. */
export function reminderFor(e: EventRow, p: ProgressRow, today: string): Reminder | null {
  const c = e.config ?? {};
  const words = { ...DEFAULT_WORDING, ...(c.reminders ?? {}) } as typeof DEFAULT_WORDING;
  const sent = new Set(p.notified ?? []);
  const first: string = c.real_starts_on ?? e.starts_on;
  const total: number = (c.challenges ?? []).length;
  const left = Math.max(0, total - (p.challenges_completed?.length ?? 0));
  const say = (text: string) => text.replace('{n}', plural(left, 'challenge'));
  const finished = p.stage_unlocked >= 3 || p.frost_lord_ready;
  const halfway = addDays(first, Math.ceil(daysBetween(first, e.ends_on) / 2)); // Jan 1 for Dec 1 - Jan 31

  if (finished && !sent.has('lord')) return { key: 'lord', title: e.title, body: say(words.lord) };
  if (!finished && p.stage_unlocked >= 2 && !sent.has('mage')) return { key: 'mage', title: e.title, body: say(words.mage) };
  if (today === first && !sent.has('start')) return { key: 'start', title: e.title, body: say(words.start) };
  if (finished) return null;
  if (today === halfway && !sent.has('halfway')) return { key: 'halfway', title: e.title, body: say(words.halfway) };
  const lastThree = today >= addDays(e.ends_on, -2) && today <= e.ends_on;
  if (lastThree && (p.challenges_closed ?? []).length === 0 && !sent.has(`last-${today}`)) {
    return { key: `last-${today}`, title: e.title, body: say(words.last) };
  }
  return null;
}

Deno.serve(async req => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'server_misconfigured' }, 500);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date();

  const { data: events, error: eErr } = await admin.from('events').select('id, title, starts_on, ends_on, config').eq('is_active', true);
  if (eErr) return json({ error: eErr.message }, 500);
  const byId = new Map((events ?? []).map(e => [e.id as string, e as EventRow]));
  if (byId.size === 0) return json({ ok: true, sent: 0 });

  const { data: rows, error: pErr } = await admin
    .from('user_event_progress')
    .select('user_id, event_id, tz, stage_unlocked, frost_lord_ready, challenges_completed, challenges_closed, notified, last_notified_on')
    .eq('event_notifications', true)
    .in('event_id', [...byId.keys()]);
  if (pErr) return json({ error: pErr.message }, 500);

  // One reminder per person per day, whatever the event.
  const due = new Map<string, { date: string; reminder: Reminder; eventId: string; notified: string[] }>();
  for (const p of (rows ?? []) as ProgressRow[]) {
    const e = byId.get(p.event_id);
    const t = local(p.tz, now);
    if (!e || !t || t.hour !== SEND_HOUR || p.last_notified_on === t.date) continue;
    if (t.date < e.starts_on || t.date > e.ends_on || due.has(p.user_id)) continue;
    const reminder = reminderFor(e, p, t.date);
    if (reminder) due.set(p.user_id, { date: t.date, reminder, eventId: e.id, notified: p.notified ?? [] });
  }
  if (due.size === 0) return json({ ok: true, sent: 0 });

  const { data: tokens, error: tErr } = await admin.from('push_tokens').select('user_id, token').in('user_id', [...due.keys()]);
  if (tErr) return json({ error: tErr.message }, 500);

  const messages: ExpoMessage[] = [];
  const reached = new Set<string>();
  for (const t of tokens ?? []) {
    const d = due.get(t.user_id as string);
    if (!d) continue;
    reached.add(t.user_id as string);
    messages.push({
      to: t.token as string,
      title: d.reminder.title,
      body: d.reminder.body,
      sound: 'default',
      channelId: 'default',
      data: { type: 'winter_event', event_id: d.eventId },
    });
  }

  // Stamp first, so an overlapping run can't send twice; only people we can actually reach are stamped.
  for (const userId of reached) {
    const d = due.get(userId)!;
    await admin
      .from('user_event_progress')
      .update({ last_notified_on: d.date, notified: [...new Set([...d.notified, d.reminder.key])] })
      .eq('user_id', userId)
      .eq('event_id', d.eventId);
  }

  const invalid: string[] = [];
  for (let i = 0; i < messages.length; i += PUSH_CHUNK) {
    const batch = messages.slice(i, i + PUSH_CHUNK);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      const out = await res.json().catch(() => null);
      (Array.isArray(out?.data) ? out.data : []).forEach((ticket: { status: string; details?: { error?: string } }, idx: number) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') invalid.push(batch[idx].to);
      });
    } catch (e) {
      console.error('expo push failed', e);
    }
  }
  if (invalid.length) await admin.from('push_tokens').delete().in('token', invalid);

  return json({ ok: true, sent: messages.length, users: reached.size, invalid_tokens_purged: invalid.length });
});
