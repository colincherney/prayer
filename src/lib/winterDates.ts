// The Long Winter's date maths and wording, kept free of React Native so the tests can run it in Node
// (tests/winter-event.test.cjs). src/lib/winterEvent.ts re-exports all of it.

import type { WinterConfig, WinterEventRow, WinterState } from './winterEvent';

// Dates. Every day is a local calendar day as 'YYYY-MM-DD', the same rule as the app's streak and the database.

/** The local calendar day of `date` in timezone `tz`, as 'YYYY-MM-DD'. The one place days are worked out. */
export function eventDayFor(date: Date, tz?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}

/** The phone's timezone name, for the server. */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

const toUtc = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));

export function addDays(day: string, n: number): string {
  return new Date(toUtc(day) + n * 86400000).toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 'Dec 25' */
export function shortDate(day: string): string {
  return `${MONTHS[Number(day.slice(5, 7)) - 1]} ${Number(day.slice(8, 10))}`;
}

const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** 'December 1' */
export function longDate(day: string): string {
  return `${LONG_MONTHS[Number(day.slice(5, 7)) - 1]} ${Number(day.slice(8, 10))}`;
}

/** Event weeks run in blocks of 7 days from config.weeks_start; the last one stops at the event's end. */
export function weekRange(event: Pick<WinterEventRow, 'starts_on' | 'ends_on' | 'config'>, week: number): [string, string] {
  const start = addDays(event.config.weeks_start ?? event.starts_on, 7 * (week - 1));
  const end = addDays(start, 6);
  return [start, end > event.ends_on ? event.ends_on : end];
}

/** The event week `day` falls in, or 0 before the first week. */
export function weekForDay(event: Pick<WinterEventRow, 'starts_on' | 'ends_on' | 'config'>, day: string): number {
  const from = event.config.weeks_start ?? event.starts_on;
  if (day < from) return 0;
  return Math.floor(daysBetween(from, day) / 7) + 1;
}

/** Days of prayer a week's keepsake needs: 3, or 2 in a week shorter than 5 days (matches the database). */
export function daysNeededForWeek(event: Pick<WinterEventRow, 'starts_on' | 'ends_on' | 'config'>, week: number): number {
  const reward = event.config.weekly_rewards?.find(r => r.week === week);
  if (reward?.days_needed) return reward.days_needed;
  const [from, to] = weekRange(event, week);
  return daysBetween(from, to) + 1 < 5 ? 2 : 3;
}

export function chapterFor(config: WinterConfig, day: string): string | null {
  return config.chapters.find(c => day >= c.starts_on && day <= c.ends_on)?.key ?? null;
}

export type WinterPhase = 'before' | 'live' | 'grace' | 'ended';

/** Before it starts, while it runs, the claim week after it, and after that (read-only). */
export function phaseFor(event: Pick<WinterEventRow, 'starts_on' | 'ends_on' | 'config'>, day: string): WinterPhase {
  if (day < event.starts_on) return 'before';
  if (day <= event.ends_on) return 'live';
  if (day <= addDays(event.ends_on, event.config.claim_grace_days ?? 0)) return 'grace';
  return 'ended';
}

/** Days left including today, counted to the last day of the event. */
export function daysLeft(event: Pick<WinterEventRow, 'ends_on'>, day: string): number {
  return Math.max(0, daysBetween(day, event.ends_on) + 1);
}

/** The first real day of the event (the configured start can be moved earlier for testing). */
export function realStart(event: Pick<WinterEventRow, 'starts_on' | 'config'>): string {
  return event.config.real_starts_on ?? event.starts_on;
}

/** What an event's prayers are called: "winter prayers", "Valentine prayers", "spring prayers". */
export function seasonNoun(palLine: string): string {
  return palLine === 'frostLord' ? 'winter' : palLine === 'beloved' ? 'Valentine' : 'spring';
}

/** The line under the challenge bar: what to do next for the Frost Lord. */
export function nextStep(state: WinterState, day: string): string {
  const { event, progress } = state;
  const c = event.config;
  const total = c.challenges.length;
  const done = progress?.challenges_completed.length ?? 0;
  const stage = progress?.stage_unlocked ?? 0;
  const names = [1, 2, 3].map(s => c.evolutions.find(e => e.stage === s)?.name ?? '');
  const [first, middle, last] = names;
  // "the Frost Lord", but "The Old King" is already a full name
  const lastName = /^the /i.test(last) ? last.replace(/^The /, 'the ') : `the ${last}`;
  const mage = c.evolutions.find(e => e.stage === 2);
  const mageFrom = mage?.unlock.not_before;
  const mageNeeds = mage?.unlock.min_challenges ?? 4;
  const noun = seasonNoun(c.pal_line);
  const all = total === 10 ? 'ten' : total === 6 ? 'six' : String(total);

  if (stage >= 3) return `${lastName.charAt(0).toUpperCase()}${lastName.slice(1)} walks with you`;
  if (progress?.frost_lord_ready) return `All ${all} done. Crown your ${last.replace(/^The /, '')}`;
  if (stage === 0) return `Pray your first ${noun} prayer to meet ${first}`;
  if ((progress?.challenges_closed.length ?? 0) > 0) {
    return stage >= 2 ? `Your ${middle} is yours to keep` : `Keep praying to grow ${first}`;
  }
  if (stage === 1 && done >= mageNeeds && mageFrom && day < mageFrom) return `${middle} unlocks ${shortDate(mageFrom)}`;
  if (stage === 1 && done < mageNeeds) {
    const n = mageNeeds - done;
    return `${n} more challenge${n === 1 ? '' : 's'} to ${middle}`;
  }
  const n = total - done;
  return `${n} more challenge${n === 1 ? '' : 's'} to ${lastName}`;
}

/** Title for the community card: "A million winter lights" for a million, otherwise the configured title. */
export function communityTitle(goal: WinterConfig['community_goal']): string {
  if (goal.target === 1_000_000) return 'A million winter lights';
  return goal.title ?? `${goal.target.toLocaleString('en-US')} winter lights`;
}

