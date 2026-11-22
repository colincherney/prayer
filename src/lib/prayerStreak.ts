import type { PrayerWidgetAppearanceProps } from './prayerWidgetAppearance';

const DAY_MS = 86_400_000;

/** A calendar day on the device, expressed as an ordinal so DST doesn't affect day counts. */
export function prayerDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function getPrayerStreak(days: ReadonlySet<number>, now = new Date()) {
  const today = prayerDay(now);
  const prayedToday = days.has(today);
  const lastDay = prayedToday ? today : today - 1;
  if (!days.has(lastDay)) return null;

  let firstDay = lastDay;
  while (days.has(firstDay - 1)) firstDay -= 1;

  // The streak survives the day after the most recent prayer, through local midnight.
  const expiresAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (prayedToday ? 2 : 1));
  return { count: lastDay - firstDay + 1, expiresAt };
}

export type PrayerStreakWidgetProps = PrayerWidgetAppearanceProps & {
  count?: number;
  prayedToday?: boolean;
  expiresAt?: number;
};

export function prayerStreakWidgetTimeline(days: ReadonlySet<number>, now: Date) {
  const streak = getPrayerStreak(days, now);
  const empty: PrayerStreakWidgetProps = { count: 0 };
  if (!streak) return [{ date: now, props: empty }];

  const prayedToday = days.has(prayerDay(now));
  const props = { count: streak.count, prayedToday, expiresAt: streak.expiresAt.getTime() };
  const entries: { date: Date; props: PrayerStreakWidgetProps }[] = [{ date: now, props }];
  if (prayedToday) {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    entries.push({ date: midnight, props: { ...props, prayedToday: false } });
  }
  entries.push({ date: streak.expiresAt, props: empty });
  return entries;
}
