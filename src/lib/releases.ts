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

/**
 * When seasonal content can be claimed (public.content_windows). Outside every window it's in the vault: whoever
 * claimed it keeps it, but nobody new can. Same schedule as the database, for a phone that has never reached it.
 */
const BUNDLED_WINDOWS: Record<string, [string, string][]> = {
  // Out until Jan 7, 2027; then back for one month each: October, Thanksgiving to December, December.
  'pet:pumpkin': [['2026-01-01T05:00:00Z', '2027-01-07T05:00:00Z'], ['2027-10-01T04:00:00Z', '2027-11-01T04:00:00Z']],
  'pet:turkey': [['2026-11-14T05:00:00Z', '2027-01-07T05:00:00Z'], ['2027-11-14T05:00:00Z', '2027-12-01T05:00:00Z']],
  'pet:donkey': [['2026-12-01T05:00:00Z', '2027-01-07T05:00:00Z'], ['2027-12-01T05:00:00Z', '2028-01-01T05:00:00Z']],
};

const CACHE_KEY = 'releases.released';
const WINDOWS_KEY = 'releases.windows';
/** TEST BRANCH ONLY (test-all-releases): shows all upcoming content for testing. */
const PREVIEW_ALL = true;

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
};

const bundledNow = () => new Set(Object.keys(BUNDLED).filter(id => Date.parse(BUNDLED[id]) <= Date.now()));

const ReleasesContext = createContext<ReleasesCtx>({
  isReleased: () => false,
  isAvailable: id => !(id in BUNDLED),
  isClaimable: () => true,
  nextWindow: () => null,
});

export const ReleasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [released, setReleased] = useState<Set<string> | null>(preloaded);
  const [windows, setWindows] = useState<Record<string, [string, string][]>>(preloadedWindows ?? BUNDLED_WINDOWS);

  const refresh = useCallback(async () => {
    const [{ data, error }, win] = await Promise.all([
      supabase.from('content_releases').select('id'),
      supabase.from('content_windows').select('id, opens_at, closes_at'),
    ]);
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
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<ReleasesCtx>(
    () => {
      // TEST BRANCH ONLY: every scheduled pet, room, trinket, scene and decoration shows now, whatever its date.
      // Never merge this into a release branch.
      const isReleased = (id: string) => PREVIEW_ALL || (released ?? bundledNow()).has(id);
      const isClaimable = (id: string) => {
        const list = windows[id];
        const now = Date.now();
        return !list || list.some(([open, close]) => Date.parse(open) <= now && now < Date.parse(close));
      };
      const nextWindow = (id: string) => {
        const now = Date.now();
        const next = (windows[id] ?? []).map(([open]) => Date.parse(open)).filter(t => t > now).sort((a, b) => a - b)[0];
        return next ? new Date(next) : null;
      };
      return { isReleased, isAvailable: (id: string) => !(id in BUNDLED) || isReleased(id), isClaimable, nextWindow };
    },
    [released, windows],
  );

  return React.createElement(ReleasesContext.Provider, { value }, children);
};

export const useReleases = () => useContext(ReleasesContext);
