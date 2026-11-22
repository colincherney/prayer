import { Platform } from 'react-native';

import { clearLocal, LOCAL_KEYS, readLocal, writeForUser } from './localCache';
import { fetchOfferedPrayerHistory } from './prayerHistory';
import { prayerDay, prayerStreakWidgetTimeline, type PrayerStreakWidgetProps } from './prayerStreak';

const key = LOCAL_KEYS.prayerStreakWidget;
let signedInId: string | null = null;
let pending: AbortController | undefined;

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

  const previous = readLocal<{ userId: string; data: PrayerStreakWidgetProps }>(key);
  if (!userId || previous?.userId !== userId) {
    widget.updateSnapshot({});
    if (previous) void clearLocal(key).catch(() => {});
  }
  if (!userId) return;

  const { data, error } = await fetchOfferedPrayerHistory(userId).abortSignal(signal);
  if (signal.aborted) return;
  if (error) throw error;
  const days = new Set((data ?? []).map(row => prayerDay(new Date(row.created_at))));
  const timeline = prayerStreakWidgetTimeline(days, new Date());
  const next = timeline[0].props;
  const last = previous?.userId === userId ? previous.data : undefined;
  if (last?.count === next.count && last?.prayedToday === next.prayedToday && last?.expiresAt === next.expiresAt) return;
  widget.updateTimeline(timeline);
  writeForUser(key, userId, next);
}
