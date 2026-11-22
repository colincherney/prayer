import { Platform } from 'react-native';

import type { Theme } from '@/components/saint/theme';

import { clearLocal, LOCAL_KEYS, readLocal, writeForUser } from './localCache';
import { fetchOfferedPrayerHistory } from './prayerHistory';
import { prayerDay, prayerStreakWidgetTimeline, type PrayerStreakWidgetProps } from './prayerStreak';
import type { PrayerWidgetAppearance } from './prayerWidgetAppearance';

const key = LOCAL_KEYS.prayerStreakWidget;
const layoutVersion = 3;
type SavedStreak = PrayerStreakWidgetProps & { layoutVersion?: number };
let signedInId: string | null | undefined;
let pending: AbortController | undefined;
let appearance: PrayerWidgetAppearance | undefined;
let appearanceKey: string | undefined;

export function setPrayerWidgetTheme(theme: Theme, design: PrayerWidgetAppearance['design']) {
  if (Platform.OS !== 'ios') return;
  const next = {
    background: theme.surface,
    ink: theme.ink,
    secondary: theme.inkSoft,
    accent: theme.pillInk,
    badge: theme.pillBg,
    line: theme.line,
    design,
    backgroundSoft: theme.bgSoft,
    accentSoft: theme.accentSoft,
    isDark: theme.isDark,
  };
  const nextKey = JSON.stringify(next);
  if (nextKey === appearanceKey) return;
  appearance = next;
  appearanceKey = nextKey;

  void Promise.all([
    import('@/widgets/SharePrayerRequest'),
    import('@/widgets/QuietPrayerWidget'),
  ].map(async module => {
    const widget = await module.then(module => module.default, () => null);
    if (widget && appearance === next) widget.updateSnapshot({ appearance: next });
  })).catch(error => console.warn('Prayer widget appearance update failed', error));

  if (signedInId !== undefined) refreshPrayerStreakWidget(signedInId);
}

export function setPrayerStreakWidgetUser(userId: string | null) {
  signedInId = userId;
  refreshPrayerStreakWidget(userId);
}

export function refreshPrayerStreakWidget(userId: string | null) {
  if (Platform.OS !== 'ios' || userId !== signedInId) return;
  pending?.abort();
  const request = new AbortController();
  pending = request;
  void publish(userId, request.signal).catch(error => {
    if (!request.signal.aborted) console.warn('Prayer streak widget refresh failed', error);
  }).finally(() => {
    if (pending === request) pending = undefined;
  });
}

async function publish(userId: string | null, signal: AbortSignal) {
  const widget = await import('@/widgets/PrayerStreakWidget').then(module => module.default, () => null);
  if (!widget || signal.aborted) return;

  const previous = readLocal<{ userId: string; data: SavedStreak }>(key);
  let last = previous?.userId === userId ? previous.data : undefined;
  const style = appearance ? { appearance } : {};
  const appearanceChanged = appearance && JSON.stringify(last?.appearance) !== appearanceKey;
  if (!userId || !last) {
    widget.updateSnapshot(style);
    if (previous) void clearLocal(key).catch(() => {});
  } else if (appearanceChanged) {
    // Restyle the existing timeline before fetching so theme changes also work offline.
    const entries = await widget.getTimeline();
    if (signal.aborted) return;
    if (entries.length) {
      widget.updateTimeline(entries.map(({ date, props }) => ({ date, props: { ...props, ...style } })));
      writeForUser(key, userId, { ...last, ...style, layoutVersion });
    } else {
      widget.updateSnapshot(style);
      void clearLocal(key).catch(() => {});
      last = undefined;
    }
  } else if (last.layoutVersion !== layoutVersion) {
    widget.reload();
    writeForUser(key, userId, { ...last, layoutVersion });
  }
  if (!userId) return;

  const { data, error } = await fetchOfferedPrayerHistory(userId).abortSignal(signal);
  if (signal.aborted) return;
  if (error) throw error;
  const days = new Set((data ?? []).map(row => prayerDay(new Date(row.created_at))));
  const timeline = prayerStreakWidgetTimeline(days, new Date());
  const next = timeline[0].props;
  if (last?.count === next.count && last?.prayedToday === next.prayedToday && last?.expiresAt === next.expiresAt) return;
  widget.updateTimeline(timeline.map(({ date, props }) => ({ date, props: { ...props, ...style } })));
  writeForUser(key, userId, { ...next, ...style, layoutVersion });
}
