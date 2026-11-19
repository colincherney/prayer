// Content that unlocks on a date: seasonal home scenes and the seasonal and monthly companions. Their art ships in
// the app, hidden; the database decides when each appears. public.content_releases only lets the app read rows
// whose release time has passed (by the server's clock), so nothing shows early and no app update is needed on the
// day. Ids are `pet:<pet id>`, `room:<room name>`, `trinket:<trinket id>`, `scene:<scene id>` and `item:<decoration id>`. See supabase/migrations/20261030_content_releases.sql.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { COLLECTION_RELEASES } from '@/components/pets/collectionData';
import { supabase } from '@/lib/supabase';

/**
 * The same schedule as the database (midnight US Eastern), used only on a phone that has never reached it.
 * Change dates in the database, not here: once the app has loaded them, the database wins.
 */
const BUNDLED: Record<string, string> = {
  'room:thanksgiving': '2026-11-14T05:00:00Z',
  'pet:turkey': '2026-11-14T05:00:00Z',
  'room:christmas': '2026-12-01T05:00:00Z',
  'pet:donkey': '2026-12-01T05:00:00Z',
  'pet:rat': '2027-01-01T05:00:00Z',
  'pet:ox': '2027-02-01T05:00:00Z',
  'pet:tiger': '2027-03-01T05:00:00Z',
  'pet:rabbit': '2027-04-01T04:00:00Z',
  'pet:loong': '2027-05-01T04:00:00Z',
  'pet:snake': '2027-06-01T04:00:00Z',
  'pet:horse': '2027-07-01T04:00:00Z',
  'pet:goat': '2027-08-01T04:00:00Z',
  'pet:monkey': '2027-09-01T04:00:00Z',
  'pet:rooster': '2027-10-01T04:00:00Z',
  'pet:dog': '2027-11-01T04:00:00Z',
  'pet:pig': '2027-12-01T05:00:00Z',
  'room:m2027jan': '2027-01-01T05:00:00Z',
  'room:m2027feb': '2027-02-01T05:00:00Z',
  'room:m2027mar': '2027-03-01T05:00:00Z',
  'room:m2027apr': '2027-04-01T04:00:00Z',
  'room:m2027may': '2027-05-01T04:00:00Z',
  'room:m2027jun': '2027-06-01T04:00:00Z',
  'room:m2027jul': '2027-07-01T04:00:00Z',
  'room:m2027aug': '2027-08-01T04:00:00Z',
  'room:m2027sep': '2027-09-01T04:00:00Z',
  'room:m2027oct': '2027-10-01T04:00:00Z',
  'room:m2027nov': '2027-11-01T04:00:00Z',
  'room:m2027dec': '2027-12-01T05:00:00Z',
  'trinket:firstLightCandle': '2026-11-07T05:00:00Z',
  'trinket:loavesFishesBasket': '2026-11-07T05:00:00Z',
  'trinket:chapelSnowGlobe': '2026-11-07T05:00:00Z',
  'trinket:shepherdLambPlush': '2026-11-07T05:00:00Z',
  'trinket:olivewoodRosary': '2026-11-07T05:00:00Z',
  'trinket:mustardSeedJar': '2026-11-07T05:00:00Z',
  'trinket:oliveBranchVase': '2026-11-07T05:00:00Z',
  'trinket:quillPrayerJournal': '2026-11-07T05:00:00Z',
  'trinket:lilyOfTheField': '2026-11-07T05:00:00Z',
  'trinket:sevenbellChime': '2026-11-07T05:00:00Z',
  'trinket:hourglassOfStillness': '2026-11-07T05:00:00Z',
  'trinket:doveMusicBox': '2026-11-07T05:00:00Z',
  'trinket:goldenPotOfManna': '2026-11-07T05:00:00Z',
  'trinket:psalmHarp': '2026-11-07T05:00:00Z',
  'trinket:nightWatchLantern': '2026-11-07T05:00:00Z',
  'trinket:harborLighthouse': '2026-11-07T05:00:00Z',
  'trinket:fishersNet': '2026-11-07T05:00:00Z',
  'trinket:galaxyPromiseJar': '2026-11-07T05:00:00Z',
  'trinket:arkInABottle': '2026-11-07T05:00:00Z',
  'trinket:roseWindowSuncatcher': '2026-11-07T05:00:00Z',
  'trinket:covenantPrism': '2026-11-07T05:00:00Z',
  'trinket:jacobsLadderMobile': '2026-11-07T05:00:00Z',
  'trinket:unburntBushBonsai': '2026-11-07T05:00:00Z',
  'trinket:pearlOfGreatPrice': '2026-11-07T05:00:00Z',
  ...COLLECTION_RELEASES,
};

/** The built-in copy of the release schedule (ids to UTC times), for previewing future drops in dev builds. */
export const RELEASE_SCHEDULE: Readonly<Record<string, string>> = BUNDLED;

/**
 * When seasonal content can be claimed (public.content_windows). Outside every window it's in the vault: whoever
 * claimed it keeps it, but nobody new can. Same schedule as the database, for a phone that has never reached it.
 */
const BUNDLED_WINDOWS: Record<string, [string, string][]> = {
  // Out until Jan 7, 2027; then back for one month each: October, Thanksgiving to December, December.
  'pet:pumpkin': [['2026-01-01T05:00:00Z', '2027-01-07T05:00:00Z'], ['2027-10-01T04:00:00Z', '2027-11-01T04:00:00Z']],
  'pet:turkey': [['2026-11-14T05:00:00Z', '2027-01-07T05:00:00Z'], ['2027-11-14T05:00:00Z', '2027-12-01T05:00:00Z']],
  'pet:donkey': [['2026-12-01T05:00:00Z', '2027-01-07T05:00:00Z'], ['2027-12-01T05:00:00Z', '2028-01-01T05:00:00Z']],
  // The Winter Lord look: midnight US Eastern Dec 1, 2026 through the end of Jan 31, 2027.
  'event:winterLord': [['2026-12-01T05:00:00Z', '2027-02-01T05:00:00Z']],
  // The Swamp King look: midnight US Eastern Mar 1, 2027 through the end of May 1.
  'event:swampKing': [['2027-03-01T05:00:00Z', '2027-05-02T04:00:00Z']],
};

const inWindow = (list: [string, string][] | undefined, now = Date.now()) =>
  !!list && list.some(([open, close]) => Date.parse(open) <= now && now < Date.parse(close));

/**
 * Whether a timed event (`event:<id>` in public.content_windows) is on at launch, from the copy saved on the phone.
 * For things that can only be decided once per launch, such as which font files to load. Off when it has no window.
 */
export function isEventOnAtLaunch(id: string): boolean {
  return inWindow((preloadedWindows ?? BUNDLED_WINDOWS)[id]);
}

const CACHE_KEY = 'releases.released';
const WINDOWS_KEY = 'releases.windows';

let preloaded: Set<string> | null = null;
let preloadedWindows: Record<string, [string, string][]> | null = null;

/** Reads the saved release list into memory, so a seasonal pet doesn't start as the default. Runs behind the splash screen. */
export async function preloadReleases(): Promise<void> {
  try {
    const [cached, windows] = await Promise.all([AsyncStorage.getItem(CACHE_KEY), AsyncStorage.getItem(WINDOWS_KEY)]);
    if (cached) preloaded = new Set(JSON.parse(cached) as string[]);
    if (windows) preloadedWindows = JSON.parse(windows) as Record<string, [string, string][]>;
  } catch {}
}

type ReleasesCtx = {
  /** Whether scheduled content `id` (e.g. `pet:turkey`) is out. */
  isReleased: (id: string) => boolean;
  /** True for anything not on a release schedule, and for scheduled content once it's out. */
  isAvailable: (id: string) => boolean;
  /** Whether content with claim windows (seasonal companions) can be claimed right now. True if it has none. */
  isClaimable: (id: string) => boolean;
  /** When it can next be claimed, if it's in the vault and a window is coming. */
  nextWindow: (id: string) => Date | null;
  /** Whether a timed event (`event:<id>`) is on right now. Unlike isClaimable, false when it has no window. */
  isEventOn: (id: string) => boolean;
  /** Whether a timed event (`event:<id>`) has started at some point, even if it has ended since. */
  hasOpened: (id: string) => boolean;
  /**
   * A dev account (public.account_unlocks 'dev'): everything on a schedule counts as out and nothing is in the vault,
   * for that one account. Event looks still only switch on by themselves during their events.
   */
  isDev: boolean;
  /** Whether scheduled content is out for everyone, ignoring a dev account's unlocks (for defaults that follow the calendar). */
  isOutForEveryone: (id: string) => boolean;
};

const bundledNow = () => new Set(Object.keys(BUNDLED).filter(id => Date.parse(BUNDLED[id]) <= Date.now()));

const ReleasesContext = createContext<ReleasesCtx>({
  isReleased: () => false,
  isAvailable: id => !(id in BUNDLED),
  isClaimable: () => true,
  nextWindow: () => null,
  isEventOn: () => false,
  hasOpened: () => false,
  isDev: false,
  isOutForEveryone: () => false,
});

export const ReleasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [released, setReleased] = useState<Set<string> | null>(preloaded);
  const [windows, setWindows] = useState<Record<string, [string, string][]>>(preloadedWindows ?? BUNDLED_WINDOWS);
  /**
   * Per-account unlocks (public.account_unlocks, only ever added in the database): 'all_pets' gives every companion
   * whatever the schedule or the vault says; 'dev' gives everything.
   */
  const [unlocks, setUnlocks] = useState<{ allPets: boolean; dev: boolean }>({ allPets: false, dev: false });

  const refresh = useCallback(async () => {
    const [{ data, error }, win, own] = await Promise.all([
      supabase.from('content_releases').select('id'),
      supabase.from('content_windows').select('id, opens_at, closes_at'),
      // only the signed-in account's own rows come back
      supabase.from('account_unlocks').select('unlock'),
    ]);
    if (!own.error) {
      const has = (u: string) => !!own.data?.some(row => row.unlock === u);
      const dev = has('dev');
      setUnlocks(prev => (prev.dev === dev && prev.allPets === has('all_pets') ? prev : { allPets: has('all_pets'), dev }));
    }
    if (!win.error && win.data) {
      const byId: Record<string, [string, string][]> = {};
      for (const row of win.data) (byId[row.id as string] ??= []).push([row.opens_at as string, row.closes_at as string]);
      setWindows(byId);
      AsyncStorage.setItem(WINDOWS_KEY, JSON.stringify(byId)).catch(() => {});
    }
    if (error || !data) return;
    const ids = data.map(r => r.id as string);
    setReleased(new Set(ids));
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(ids)).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        setReleased(prev => prev ?? (cached ? new Set(JSON.parse(cached) as string[]) : bundledNow()));
      } catch {
        setReleased(prev => prev ?? bundledNow());
      }
      refresh();
    })();
    // Check again whenever the app comes back to the front, so a release shows up on the day without a restart.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    // And on sign-in or sign-out, since what an account has unlocked is per account.
    const auth = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') refresh();
    });
    return () => {
      sub.remove();
      auth.data.subscription.unsubscribe();
    };
  }, [refresh]);

  // Re-check when the next window opens or closes (within a day), so an event starts at midnight even with the app open.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const now = Date.now();
    const next = Object.values(windows)
      .flat()
      .flatMap(([open, close]) => [Date.parse(open), Date.parse(close)])
      .filter(t => t > now && t - now < 24 * 60 * 60 * 1000)
      .sort((a, b) => a - b)[0];
    if (!next) return;
    const timer = setTimeout(() => setTick(t => t + 1), next - now + 1000);
    return () => clearTimeout(timer);
  }, [windows, tick]);

  const value = useMemo<ReleasesCtx>(
    () => {
      const { allPets, dev } = unlocks;
      const unlocked = (id: string) => dev || (allPets && id.startsWith('pet:'));
      const isReleased = (id: string) => unlocked(id) || (released ?? bundledNow()).has(id);
      const isClaimable = (id: string) => {
        if (unlocked(id)) return true;
        const list = windows[id];
        const now = Date.now();
        return !list || list.some(([open, close]) => Date.parse(open) <= now && now < Date.parse(close));
      };
      const nextWindow = (id: string) => {
        const now = Date.now();
        const next = (windows[id] ?? []).map(([open]) => Date.parse(open)).filter(t => t > now).sort((a, b) => a - b)[0];
        return next ? new Date(next) : null;
      };
      const isEventOn = (id: string) => inWindow(windows[id]);
      const hasOpened = (id: string) => dev || (windows[id] ?? []).some(([open]) => Date.parse(open) <= Date.now());
      return { isReleased, isAvailable: (id: string) => !(id in BUNDLED) || isReleased(id), isClaimable, nextWindow, isEventOn, hasOpened, isDev: dev,
        isOutForEveryone: (id: string) => (released ?? bundledNow()).has(id) };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick rebuilds the checks when a window opens or closes
    [released, windows, tick, unlocks],
  );

  return React.createElement(ReleasesContext.Provider, { value }, children);
};

export const useReleases = () => useContext(ReleasesContext);
