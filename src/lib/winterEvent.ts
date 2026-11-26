// The seasonal events (the Long Winter, the Swamp King, ...), on the phone. Everything about an event (dates, chapters,
// challenges, rewards) is data in public.events, and all progress is worked out in the database
// (supabase/migrations/20261118_long_winter_event.sql and later) from the records the app already writes. This file
// reads each event, caches it, and does the date maths the screens need. The phone never writes progress: it can only
// mark something seen or switch reminders. The "winter" names are kept for the Long Winter, which came first.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

import { deviceTimeZone, eventDayFor, phaseFor } from './winterDates';

export * from './winterDates';

export const WINTER_EVENT_ID = 'long-winter-2026';
export const BELOVED_EVENT_ID = 'beloved-2027';
export const SWAMP_EVENT_ID = 'swamp-king-2027';
export const SWORD_EVENT_ID = 'sword-2027';
/** Every event the app knows how to show, oldest first. */
export const EVENT_IDS = [WINTER_EVENT_ID, BELOVED_EVENT_ID, SWAMP_EVENT_ID, SWORD_EVENT_ID] as const;
export type EventId = (typeof EVENT_IDS)[number];
/** Which event each event-only companion belongs to. */
export const PAL_EVENTS: Record<string, EventId> = { frostLord: WINTER_EVENT_ID, beloved: BELOVED_EVENT_ID, vesper: SWAMP_EVENT_ID, gladi: SWORD_EVENT_ID };

// ---------------------------------------------------------------------------------------------------------------------
// Types (the shapes public.winter_event_state returns)

export type ChallengeRule =
  | { type: 'prayers' | 'candles' | 'partner' | 'streak' | 'people' | 'shared' | 'journal' | 'notes' | 'quests'; min: number }
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
  /** Testing mode on any build: the day the event pretends it is (with allow_test_dates), e.g. "2027-02-01". */
  test_today?: string;
  claim_grace_days?: number;
  chapters: { key: string; title: string; starts_on: string; ends_on: string }[];
  evolutions: { stage: number; name: string; unlock: { min_event_prayers?: number; min_challenges?: number; not_before?: string; claim?: boolean } }[];
  advent_wreath?: { candle: number; color: 'purple' | 'pink'; starts_on: string; ends_on: string; days_needed: number }[];
  weeks?: { week: number; title: string; chapter: string }[];
  /** Keepsakes per event week (no longer used: every keepsake now comes with finishing all the challenges). */
  weekly_rewards?: { week: number; keepsake: string; days_needed?: number }[];
  /** Keepsakes given the moment every challenge is done, straight onto the shelf. */
  completion_rewards?: string[];
  /** Looks the final stage can switch between once it's reached (the Beloved: marble, or her Seraph spirit form). */
  forms?: { key: string; name: string; kind?: string }[];
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
// unless config.allow_test_dates is on). One date for every event.

const DEV_DAY_KEY = 'winter.devToday';
let devToday: string | null = null;

// ---------------------------------------------------------------------------------------------------------------------
// The shared store: one entry per event.

const COMMUNITY_TTL = 60_000;
/** The Long Winter kept its original cache key, so phones that already have it don't start empty. */
const cacheKey = (id: EventId) => (id === WINTER_EVENT_ID ? 'winter.state' : `event.state.${id}`);

type Entry = { current: WinterState | null; lastFetch: number; inFlight: Promise<WinterState | null> | null };
const entries = new Map<EventId, Entry>(EVENT_IDS.map(id => [id, { current: null, lastFetch: 0, inFlight: null }]));
const entry = (id: EventId) => entries.get(id)!;
/** Bumped when the account changes (clearWinter), so a request started for the last account is thrown away. */
let generation = 0;

type Snapshot = { states: Record<EventId, WinterState | null>; devToday: string | null };
const listeners = new Set<() => void>();
let snapshot: Snapshot = makeSnapshot();

function makeSnapshot(): Snapshot {
  return { states: Object.fromEntries(EVENT_IDS.map(id => [id, entry(id).current])) as Record<EventId, WinterState | null>, devToday };
}
function emit() {
  snapshot = makeSnapshot();
  listeners.forEach(fn => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reads every cached event and the dev date into memory (behind the splash screen). */
export async function preloadWinter(): Promise<void> {
  try {
    const cached = await Promise.all(EVENT_IDS.map(id => AsyncStorage.getItem(cacheKey(id))));
    EVENT_IDS.forEach((id, i) => {
      if (cached[i]) entry(id).current = JSON.parse(cached[i]!) as WinterState;
    });
    if (__DEV__) {
      const dev = await AsyncStorage.getItem(DEV_DAY_KEY);
      if (dev) devToday = dev;
    }
    emit();
  } catch {}
}

/**
 * Asks the server for an event and this person's progress (re-evaluated there). Cached for a minute unless `force`,
 * so the community count is never fetched more than once a minute and nobody holds a realtime subscription.
 */
export function refreshEvent(id: EventId, force = false): Promise<WinterState | null> {
  const en = entry(id);
  if (!force && en.current && Date.now() - en.lastFetch < COMMUNITY_TTL) return Promise.resolve(en.current);
  if (en.inFlight) return en.inFlight;
  const gen = generation;
  en.inFlight = (async () => {
    try {
      const { data, error } = await supabase.rpc('winter_event_state', {
        p_event: id,
        p_tz: deviceTimeZone() ?? null,
        p_today: __DEV__ ? devToday : null,
      });
      // Started for the account before a sign-out or switch: not this account's.
      if (gen !== generation) return en.current;
      if (error || !data?.found) return en.current;
      en.current = { event: data.event, progress: data.progress ?? null, community: data.community };
      en.lastFetch = Date.now();
      AsyncStorage.setItem(cacheKey(id), JSON.stringify(en.current)).catch(() => {});
      emit();
      // A dev date left on the phone after testing ends: once every event has loaded and none is in testing mode,
      // go back to the real date.
      if (__DEV__ && devToday && EVENT_IDS.every(e => entry(e).current && !entry(e).current!.event.config.allow_test_dates)) {
        setDevToday(null).catch(() => {});
      }
      return en.current;
    } catch {
      return en.current;
    } finally {
      // after a clear, a newer request may be the one in flight now: leave it
      if (gen === generation) en.inFlight = null;
    }
  })();
  return en.inFlight;
}

export function refreshAllEvents(force = false): Promise<unknown> {
  return Promise.all(EVENT_IDS.map(id => refreshEvent(id, force)));
}

export function refreshWinter(force = false): Promise<WinterState | null> {
  return refreshEvent(WINTER_EVENT_ID, force);
}

/** Forget the cached copies (sign-out). */
export function clearWinter() {
  generation += 1;
  for (const id of EVENT_IDS) {
    const en = entry(id);
    en.current = null;
    en.lastFetch = 0;
    en.inFlight = null;
    AsyncStorage.removeItem(cacheKey(id)).catch(() => {});
  }
  emit();
}

function applyProgress(id: EventId, progress: WinterProgress) {
  const en = entry(id);
  if (!en.current) return;
  en.current = { ...en.current, progress };
  AsyncStorage.setItem(cacheKey(id), JSON.stringify(en.current)).catch(() => {});
  emit();
}

/** Marks an event's intro clip as started, or an evolution celebration as shown, on the account (so it never repeats). */
export async function markEventSeen(id: EventId, what: 'intro' | 'stage', stage?: number): Promise<void> {
  const cur = entry(id).current;
  if (cur?.progress) {
    applyProgress(
      id,
      what === 'intro'
        ? { ...cur.progress, intro_seen_at: cur.progress.intro_seen_at ?? new Date().toISOString() }
        : { ...cur.progress, stage_seen: Math.max(cur.progress.stage_seen, stage ?? 0) },
    );
  }
  await supabase.rpc('mark_event_seen', { p_event: id, p_what: what, p_stage: stage ?? null });
}

export function markWinterSeen(what: 'intro' | 'stage', stage?: number): Promise<void> {
  return markEventSeen(WINTER_EVENT_ID, what, stage);
}

export async function setEventNotifications(id: EventId, on: boolean): Promise<void> {
  const cur = entry(id).current;
  if (cur?.progress) applyProgress(id, { ...cur.progress, event_notifications: on });
  const { error } = await supabase.rpc('set_event_notifications', { p_event: id, p_on: on });
  if (error) refreshEvent(id, true);
}

export function setWinterNotifications(on: boolean): Promise<void> {
  return setEventNotifications(WINTER_EVENT_ID, on);
}

/** Dev builds only: pretend today is `day` (or null for the real date), for every event. */
export async function setDevToday(day: string | null): Promise<void> {
  if (!__DEV__) return;
  devToday = day;
  emit();
  if (day) await AsyncStorage.setItem(DEV_DAY_KEY, day).catch(() => {});
  else await AsyncStorage.removeItem(DEV_DAY_KEY).catch(() => {});
  await refreshAllEvents(true);
}

/** Today for the events: the dev date when one is set (dev builds), otherwise the local calendar day. */
export function winterToday(): string {
  return (__DEV__ && devToday) || eventDayFor(new Date(), deviceTimeZone());
}

/**
 * The day an event is shown for: the dev date (dev builds), or its testing-mode pretend day (config.test_today, any
 * build, only while allow_test_dates is on), or the real local day.
 */
export function eventToday(state: WinterState | null, devDay: string | null): string {
  const c = state?.event.config;
  // Only while the event is in testing mode: the server ignores test dates otherwise, so the app does too (a dev
  // date left on the phone from testing can't keep a finished test showing).
  if (__DEV__ && devDay && c?.allow_test_dates) return devDay;
  if (c?.allow_test_dates && c.test_today) return c.test_today;
  return eventDayFor(new Date(), deviceTimeZone());
}

/** Keeps every event fresh: on mount, when the app comes back, and every minute if `poll` (the event screen, which
 * also skips the one-minute cache when it opens, so a prayer you just prayed shows straight away). */
function useRefreshing(ids: readonly EventId[], poll?: boolean) {
  const key = ids.join(',');
  useEffect(() => {
    const list = key.split(',') as EventId[];
    list.forEach(id => refreshEvent(id, !!poll));
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') list.forEach(id => refreshEvent(id));
    });
    const timer = poll ? setInterval(() => list.forEach(id => refreshEvent(id)), COMMUNITY_TTL) : null;
    return () => {
      sub.remove();
      if (timer) clearInterval(timer);
    };
  }, [key, poll]);
}

function view(state: WinterState | null, today: string) {
  const phase = state ? phaseFor(state.event, today) : null;
  /**
   * Shown at all (the banner, the Pray page pill, the Prayer Pals row): only while the event is running and switched
   * on. Afterwards it's in the vault: nothing about it appears or pops up any more, and whoever earned the companion and
   * the keepsakes keeps them.
   */
  const visible = !!state && state.event.is_active && phase === 'live';
  return { phase, visible };
}

/** One event, your progress in it and today's date, kept fresh. */
export function useEvent(id: EventId, options: { poll?: boolean } = {}) {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  useRefreshing([id], options.poll);
  const refresh = useCallback(() => refreshEvent(id, true), [id]);
  const state = snap.states[id];
  const today = eventToday(state, snap.devToday);
  /** The real calendar day, which prayers are recorded on (differs from `today` while testing a pretend day). */
  const realToday = eventDayFor(new Date(), deviceTimeZone());
  return { id, state, today, realToday, ...view(state, today), devToday: snap.devToday, refresh };
}

export function useWinterEvent(options: { poll?: boolean } = {}) {
  return useEvent(WINTER_EVENT_ID, options);
}

/** Every event at once (for "What's new"), and the one that's running today, if any (for the banner, the gate, the pills). */
export function useEvents() {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  useRefreshing(EVENT_IDS);
  const today = (__DEV__ && snap.devToday) || eventDayFor(new Date(), deviceTimeZone());
  const live = EVENT_IDS.find(id => view(snap.states[id], eventToday(snap.states[id], snap.devToday)).visible) ?? null;
  return { states: snap.states, today, devToday: snap.devToday, liveId: live };
}

/** An event's companion stage for this account (0 until the first stage arrives). Any screen, no network. */
export function useEventStage(id: EventId): number {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  return snap.states[id]?.progress?.stage_unlocked ?? 0;
}

export function useFrostLordStage(): number {
  return useEventStage(WINTER_EVENT_ID);
}

/** The stage of an event-only companion ('frostLord', 'vesper'), 0 if not met; null for any other pet. */
export function usePalStage(petId: string): number | null {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  const id = PAL_EVENTS[petId];
  return id ? snap.states[id]?.progress?.stage_unlocked ?? 0 : null;
}

/** Every event companion's stage, by pet id ({ frostLord: 2, vesper: 0 }). */
export function usePalStages(): Record<string, number> {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  return Object.fromEntries(Object.entries(PAL_EVENTS).map(([pet, id]) => [pet, snap.states[id]?.progress?.stage_unlocked ?? 0]));
}

/** The same, outside React. */
export function frostLordStage(): number {
  return entry(WINTER_EVENT_ID).current?.progress?.stage_unlocked ?? 0;
}
