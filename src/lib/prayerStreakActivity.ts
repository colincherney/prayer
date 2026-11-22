import { Alert, Platform } from 'react-native';

import { clearLocal, LOCAL_KEYS, readLocal, writeLocal } from './localCache';
import { fetchOfferedPrayerHistory } from './prayerHistory';
import { getPrayerStreak, prayerDay } from './prayerStreak';

type TrackedActivity = { id: string; userId: string };
type Command = 'start' | 'refresh' | 'stop';
type Status = 'active' | 'inactive' | 'no-streak' | 'unavailable';

const storageKey = LOCAL_KEYS.prayerStreakActivity;
let account = { userId: null as string | null, controller: new AbortController() };
let queue: Promise<unknown> = Promise.resolve();

export function setPrayerStreakActivityUser(userId: string | null) {
  if (userId !== account.userId) {
    account.controller.abort();
    account = { userId, controller: new AbortController() };
  }
  refreshPrayerStreakActivity(userId);
}

export function refreshPrayerStreakActivity(userId: string | null) {
  void manage(userId, 'refresh').catch(error => console.warn('Prayer streak Live Activity refresh failed', error));
}

function manage(userId: string | null, command: Command): Promise<Status> {
  if (Platform.OS !== 'ios' || userId !== account.userId) return Promise.resolve('unavailable');
  const { signal } = account.controller;

  // Serialize mutations so rapid taps and account changes cannot duplicate an activity.
  const result = queue.then(async (): Promise<Status> => {
    if (signal.aborted) return 'unavailable';
    const factory = await import('@/widgets/PrayerStreakActivity').then(mod => mod.default, () => null);
    if (!factory || signal.aborted) return 'unavailable';

    const saved = readLocal<TrackedActivity>(storageKey);
    const instances = factory.getInstances();
    const own = saved && saved.userId === userId && instances.find(item => item.getId() === saved.id);

    await Promise.all(instances.filter(item => item !== own).map(async item => {
      try {
        await item.end('immediate');
      } catch (error) {
        // The system can dismiss an activity between enumeration and ending it.
        if (factory.getInstances().some(active => active.getId() === item.getId())) throw error;
      }
    }));
    if (saved && !own) await clearLocal(storageKey).catch(() => {});
    if (signal.aborted) return 'unavailable';

    if (command === 'stop') {
      if (own) {
        await own.end('immediate');
        await clearLocal(storageKey).catch(() => {});
      }
      return 'inactive';
    }
    if (!userId || (!own && command !== 'start')) return 'inactive';

    const { data, error } = await fetchOfferedPrayerHistory(userId).abortSignal(signal);
    if (signal.aborted) return 'unavailable';
    if (error) throw error;
    const now = new Date();
    const days = new Set((data ?? []).map(row => prayerDay(new Date(row.created_at))));
    const streak = getPrayerStreak(days, now);
    if (!streak) {
      if (own) {
        await own.end('immediate');
        await clearLocal(storageKey).catch(() => {});
      }
      return 'no-streak';
    }

    const daysSinceMonday = (now.getDay() + 6) % 7;
    const monday = prayerDay(now) - daysSinceMonday;
    const props = {
      count: streak.count,
      updatedAt: now.getTime(),
      expiresAt: streak.expiresAt.getTime(),
      prayerWeek: {
        days: Array.from({ length: 7 }, (_, day) => days.has(monday + day)),
        endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7 - daysSinceMonday).getTime(),
      },
    };
    if (own) {
      await own.update(props, streak.expiresAt);
    } else {
      const started = factory.start(props, 'prayer:///explore', streak.expiresAt);
      await writeLocal(storageKey, { id: started.getId(), userId }).catch(() => {});
    }
    return 'active';
  });
  queue = result.catch(() => {});
  return result;
}

export function showPrayerStreakActivityControls(userId: string) {
  const unavailable = () => Alert.alert('Live Activity unavailable', 'Check that Live Activities are allowed for Saint Central in Settings, then try again.');
  const run = (command: 'start' | 'stop') => {
    void manage(userId, command).then(result => {
      if (result === 'unavailable') unavailable();
      if (result === 'no-streak') Alert.alert('Start a prayer streak', 'Pray for someone to start tracking your streak.');
    }).catch(error => {
      if (error?.code === 'ERR_LIVE_ACTIVITIES_NOT_SUPPORTED') unavailable();
      else Alert.alert('Couldn’t change the Live Activity', 'Please try again.');
    });
  };

  // Present the menu before doing any ActivityKit work. Its actions resolve the current activity when selected.
  Alert.alert('Prayer streak', 'See your streak and time left on the Lock Screen and Dynamic Island for up to 8 hours.', [
    { text: 'Start Live Activity', onPress: () => run('start') },
    { text: 'End Live Activity', onPress: () => run('stop') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
