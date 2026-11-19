// The Long Winter event, on the phone. Everything about the event (dates, chapters, challenges, rewards) is data in
// public.events, and all progress is worked out in the database (supabase/migrations/20261118_long_winter_event.sql)
// from prayers, Vigil candles and partner sessions. This file reads it, caches it, and does the date maths the
// screens need. The phone never writes progress: it can only ask the server to claim a reward or mark something seen.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

import { deviceTimeZone, eventDayFor, phaseFor } from './winterDates';

export * from './winterDates';

export const WINTER_EVENT_ID = 'long-winter-2026';

// ---------------------------------------------------------------------------------------------------------------------
// Types (the shapes public.winter_event_state returns)

export type ChallengeRule =
  | { type: 'prayers' | 'candles' | 'partner' | 'streak' | 'people'; min: number }
  /** Weeks of the event (7-day blocks from its start) with `days` prayed (3 by default). */
  | { type: 'weeks'; min: number; days?: number }
  /** Days with a prayer between from_hour (inclusive) and to_hour (exclusive), local time. */
  | { type: 'hours'; from_hour: number; to_hour: number; min: number }
  | { type: 'wreath' }
  | { type: 'days_in_range'; from: string; to: string; min: number };

export type WinterConfig = {
  pal_line: string;
  real_starts_on?: string;
  weeks_start?: string;
  allow_test_dates?: boolean;
  claim_grace_days?: number;
  chapters: { key: string; title: string; starts_on: string; ends_on: string }[];
  evolutions: { stage: number; name: string; unlock: { min_event_prayers?: number; min_challenges?: number; not_before?: string; claim?: boolean } }[];
  advent_wreath: { candle: number; color: 'purple' | 'pink'; starts_on: string; ends_on: string; days_needed: number }[];
  weeks: { week: number; title: string; chapter: string }[];
  /** Keepsakes per event week (no longer used: every keepsake now comes with finishing all the challenges). */
  weekly_rewards?: { week: number; keepsake: string; days_needed?: number }[];
  /** Keepsakes given the moment every challenge is done, straight onto the shelf. */
  completion_rewards?: string[];
  community_goal: { key: string; title?: string; target: number; reward: string; reward_name?: string };
  challenges: { key: string; title: string; detail: string; rule: ChallengeRule }[];
};

export type WinterEventRow = { id: string; title: string; starts_on: string; ends_on: string; is_active: boolean; config: WinterConfig };

export type WinterProgress = {
  tz: string;
  prayer_days: string[];
  event_prayer_count: number;
  candles_lit: number;
  partner_sessions: number;
  longest_streak: number;
  stage_unlocked: number;
  stage_seen: number;
  frost_lord_ready: boolean;
  wreath_candles_lit: number;
  challenges_completed: string[];
  challenges_closed: string[];
  rewards_available: string[];
  rewards_claimed: string[];
  intro_seen_at: string | null;
  event_notifications: boolean;
  evaluated_on: string | null;
};

export type WinterState = {
  event: WinterEventRow;
  progress: WinterProgress | null;
  community: { value: number; target: number; rewarded: boolean };
};

// ---------------------------------------------------------------------------------------------------------------------
// Dev-only "pretend today is…" (never in production builds: __DEV__ is false there, and the server ignores test dates
// unless config.allow_test_dates is on).

const DEV_DAY_KEY = 'winter.devToday';
let devToday: string | null = null;

// ---------------------------------------------------------------------------------------------------------------------
// The shared store

const CACHE_KEY = 'winter.state';
const COMMUNITY_TTL = 60_000;

let current: WinterState | null = null;
let lastFetch = 0;
let inFlight: Promise<WinterState | null> | null = null;
const listeners = new Set<() => void>();
let snapshot: { state: WinterState | null; devToday: string | null } = { state: current, devToday };

function emit() {
  snapshot = { state: current, devToday };
  listeners.forEach(fn => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reads the cached event and the dev date into memory (behind the splash screen). */
export async function preloadWinter(): Promise<void> {
  try {
    const [cached, dev] = await Promise.all([AsyncStorage.getItem(CACHE_KEY), __DEV__ ? AsyncStorage.getItem(DEV_DAY_KEY) : null]);
    if (cached) current = JSON.parse(cached) as WinterState;
    if (__DEV__ && dev) devToday = dev;
    emit();
  } catch {}
}

/**
 * Asks the server for the event and this person's progress (re-evaluated there). Cached for a minute unless `force`,
 * so the community count is never fetched more than once a minute and nobody holds a realtime subscription.
 */
export function refreshWinter(force = false): Promise<WinterState | null> {
  if (!force && current && Date.now() - lastFetch < COMMUNITY_TTL) return Promise.resolve(current);
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data, error } = await supabase.rpc('winter_event_state', {
        p_event: WINTER_EVENT_ID,
        p_tz: deviceTimeZone() ?? null,
        p_today: __DEV__ ? devToday : null,
      });
      if (error || !data?.found) return current;
      current = { event: data.event, progress: data.progress ?? null, community: data.community };
      lastFetch = Date.now();
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(current)).catch(() => {});
      emit();
      return current;
    } catch {
      return current;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Forget the cached copy (sign-out). */
export function clearWinter() {
  current = null;
  lastFetch = 0;
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
  emit();
}

function applyProgress(progress: WinterProgress) {
  if (!current) return;
  current = { ...current, progress };
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(current)).catch(() => {});
  emit();
}

/** Claims a weekly keepsake, or 'frost_lord' to crown the Frost Lord. Returns an error message, or null. */
export async function claimWinterReward(reward: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('claim_event_reward', {
    p_event: WINTER_EVENT_ID,
    p_reward: reward,
    p_today: __DEV__ ? devToday : null,
  });
  if (error) {
    if (error.message.includes('event_closed')) return 'The Long Winter has ended.';
    if (error.message.includes('not_ready') || error.message.includes('not_earned')) return 'Not earned yet.';
    return 'Could not claim that. Please try again.';
  }
  if (data) applyProgress(data as WinterProgress);
  return null;
}

/** Marks the intro clip as started, or an evolution celebration as shown, on the account (so it never repeats). */
export async function markWinterSeen(what: 'intro' | 'stage', stage?: number): Promise<void> {
  if (current?.progress) {
    applyProgress(
      what === 'intro'
        ? { ...current.progress, intro_seen_at: current.progress.intro_seen_at ?? new Date().toISOString() }
        : { ...current.progress, stage_seen: Math.max(current.progress.stage_seen, stage ?? 0) },
    );
  }
  await supabase.rpc('mark_event_seen', { p_event: WINTER_EVENT_ID, p_what: what, p_stage: stage ?? null });
}

export async function setWinterNotifications(on: boolean): Promise<void> {
  if (current?.progress) applyProgress({ ...current.progress, event_notifications: on });
  const { error } = await supabase.rpc('set_event_notifications', { p_event: WINTER_EVENT_ID, p_on: on });
  if (error) refreshWinter(true);
}

/** Dev builds only: pretend today is `day` (or null for the real date). */
export async function setDevToday(day: string | null): Promise<void> {
  if (!__DEV__) return;
  devToday = day;
  emit();
  if (day) await AsyncStorage.setItem(DEV_DAY_KEY, day).catch(() => {});
  else await AsyncStorage.removeItem(DEV_DAY_KEY).catch(() => {});
  await refreshWinter(true);
}

/** Today for the event: the dev date when one is set (dev builds), otherwise the local calendar day. */
export function winterToday(): string {
  return (__DEV__ && devToday) || eventDayFor(new Date(), deviceTimeZone());
}

/** The event, your progress and today's date, kept fresh: on mount, when the app comes back, and every minute. */
export function useWinterEvent(options: { poll?: boolean } = {}) {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  const { poll } = options;
  useEffect(() => {
    refreshWinter();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') refreshWinter();
    });
    const timer = poll ? setInterval(() => refreshWinter(), COMMUNITY_TTL) : null;
    return () => {
      sub.remove();
      if (timer) clearInterval(timer);
    };
  }, [poll]);
  const refresh = useCallback(() => refreshWinter(true), []);
  const state = snap.state;
  const today = (__DEV__ && snap.devToday) || eventDayFor(new Date(), deviceTimeZone());
  const phase = state ? phaseFor(state.event, today) : null;
  /**
   * Shown at all (the banner, the Pray page pill, the Prayer Pals row): only while the event is running and switched
   * on. From Feb 1 the Long Winter is in the vault: nothing about it appears or pops up any more, and whoever earned the
   * Frost Lord and the keepsakes keeps them.
   */
  const visible = !!state && state.event.is_active && phase === 'live';
  return { state, today, phase, visible, devToday: snap.devToday, refresh };
}

/** The Frost Lord's stage for this account (0 until Snowcap arrives). Any screen, no network. */
export function useFrostLordStage(): number {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  return snap.state?.progress?.stage_unlocked ?? 0;
}

/** The same, outside React. */
export function frostLordStage(): number {
  return current?.progress?.stage_unlocked ?? 0;
}
