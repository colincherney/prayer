// Content that unlocks on a date: seasonal home scenes and the seasonal and monthly companions. Their art ships in
// the app, hidden; the database decides when each appears. public.content_releases only lets the app read rows
// whose release time has passed (by the server's clock), so nothing shows early and no app update is needed on the
// day. Ids are `pet:<pet id>`, `room:<room name>` and `trinket:<trinket id>`. See supabase/migrations/20261030_content_releases.sql.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

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
  'trinket:firstLightCandle': '2026-11-14T05:00:00Z',
  'trinket:loavesFishesBasket': '2026-11-14T05:00:00Z',
  'trinket:chapelSnowGlobe': '2026-12-01T05:00:00Z',
  'trinket:shepherdLambPlush': '2026-12-01T05:00:00Z',
  'trinket:olivewoodRosary': '2027-01-01T05:00:00Z',
  'trinket:mustardSeedJar': '2027-01-01T05:00:00Z',
  'trinket:oliveBranchVase': '2027-02-01T05:00:00Z',
  'trinket:quillPrayerJournal': '2027-02-01T05:00:00Z',
  'trinket:lilyOfTheField': '2027-03-01T05:00:00Z',
  'trinket:sevenbellChime': '2027-03-01T05:00:00Z',
  'trinket:hourglassOfStillness': '2027-04-01T04:00:00Z',
  'trinket:doveMusicBox': '2027-04-01T04:00:00Z',
  'trinket:goldenPotOfManna': '2027-05-01T04:00:00Z',
  'trinket:psalmHarp': '2027-05-01T04:00:00Z',
  'trinket:nightWatchLantern': '2027-06-01T04:00:00Z',
  'trinket:harborLighthouse': '2027-06-01T04:00:00Z',
  'trinket:fishersNet': '2027-07-01T04:00:00Z',
  'trinket:galaxyPromiseJar': '2027-07-01T04:00:00Z',
  'trinket:arkInABottle': '2027-08-01T04:00:00Z',
  'trinket:roseWindowSuncatcher': '2027-08-01T04:00:00Z',
  'trinket:covenantPrism': '2027-09-01T04:00:00Z',
  'trinket:jacobsLadderMobile': '2027-09-01T04:00:00Z',
  'trinket:unburntBushBonsai': '2027-10-01T04:00:00Z',
  'trinket:pearlOfGreatPrice': '2027-10-01T04:00:00Z',
};

const CACHE_KEY = 'releases.released';

type ReleasesCtx = {
  /** Whether scheduled content `id` (e.g. `pet:turkey`) is out. */
  isReleased: (id: string) => boolean;
};

const bundledNow = () => new Set(Object.keys(BUNDLED).filter(id => Date.parse(BUNDLED[id]) <= Date.now()));

const ReleasesContext = createContext<ReleasesCtx>({ isReleased: () => false });

export const ReleasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [released, setReleased] = useState<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('content_releases').select('id');
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
    () => ({ isReleased: id => (released ?? bundledNow()).has(id) }),
    [released],
  );

  return React.createElement(ReleasesContext.Provider, { value }, children);
};

export const useReleases = () => useContext(ReleasesContext);
