// Prayer nook trinkets: 24 keepsakes from design/Trinkets.dc.html, two released each month (public.content_releases,
// id `trinket:<id>`, see src/lib/releases.ts). Once one is out, you earn it by its goal. Goals the app can see in your
// own activity are checked automatically; the rest (praying in a church, when anxious...) are on your honor, with an
// "I did this" button. Earned trinkets are kept in public.user_trinkets and sit on the shelf beside your companion.

import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { TRINKET_INFO, TrinketId } from '@/components/pets/trinketArt';
import { useAuth } from '@/lib/auth';
import { useReleases } from '@/lib/releases';
import { supabase } from '@/lib/supabase';

/** Release order: two a month from the Thanksgiving update, matched to the season where one fits. */
export const TRINKET_ORDER: TrinketId[] = [
  'firstLightCandle', 'loavesFishesBasket', // Nov 14, 2026
  'chapelSnowGlobe', 'shepherdLambPlush', // Dec 2026 (Advent)
  'olivewoodRosary', 'mustardSeedJar', // Jan 2027
  'oliveBranchVase', 'quillPrayerJournal', // Feb
  'lilyOfTheField', 'sevenbellChime', // Mar
  'hourglassOfStillness', 'doveMusicBox', // Apr
  'goldenPotOfManna', 'psalmHarp', // May
  'nightWatchLantern', 'harborLighthouse', // Jun
  'fishersNet', 'galaxyPromiseJar', // Jul (the starry night)
  'arkInABottle', 'roseWindowSuncatcher', // Aug
  'covenantPrism', 'jacobsLadderMobile', // Sep
  'unburntBushBonsai', 'pearlOfGreatPrice', // Oct
];

type Stats = {
  prayed: number;
  /** Different prayer requests prayed for. */
  people: number;
  shared: number;
  journal: number;
  /** Longest run of days with at least one prayer. */
  streak: number;
  dawn: number;
  night: number;
  /** Most days prayed in any one Advent (Nov 29 – Dec 24). */
  advent: number;
};

/** Goals the app can check: current progress and the target. Everything else is on the honor system. */
const AUTO: Partial<Record<TrinketId, (s: Stats) => [number, number]>> = {
  firstLightCandle: s => [s.prayed, 1],
  olivewoodRosary: s => [s.streak, 7],
  mustardSeedJar: s => [s.shared, 1],
  quillPrayerJournal: s => [s.journal, 5],
  sevenbellChime: s => [s.dawn, 3],
  doveMusicBox: s => [s.prayed, 5],
  nightWatchLantern: s => [s.night, 3],
  goldenPotOfManna: s => [s.streak, 7],
  chapelSnowGlobe: s => [s.advent, 20],
  covenantPrism: s => [s.streak, 30],
  unburntBushBonsai: s => [s.prayed, 100],
  jacobsLadderMobile: s => [s.people, 50],
};

export type TrinketStatus = {
  id: TrinketId;
  earned: boolean;
  /** For goals the app checks: how far along you are. */
  progress?: [number, number];
  /** Goals on your honor: claimed with "I did this". */
  honor: boolean;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function longestStreak(days: Set<string>, dates: Date[]): number {
  let best = 0;
  for (const d of dates) {
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    if (days.has(dayKey(prev))) continue; // not the start of a run
    let n = 1;
    const next = new Date(d);
    for (;;) {
      next.setDate(next.getDate() + 1);
      if (!days.has(dayKey(next))) break;
      n += 1;
    }
    best = Math.max(best, n);
  }
  return best;
}

async function loadStats(userId: string): Promise<Stats> {
  const [prayed, shared, journal] = await Promise.all([
    supabase
      .from('prayer_interactions')
      .select('prayer_id, created_at')
      .eq('user_id', userId)
      .eq('action', 'prayed')
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase.from('prayers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('biography_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  const rows = prayed.data ?? [];
  const dates = rows.map(r => new Date(r.created_at as string));
  const days = new Set(dates.map(dayKey));
  const hours = dates.map(d => d.getHours());
  const advent = new Map<number, Set<string>>();
  for (const d of dates) {
    const inAdvent = (d.getMonth() === 10 && d.getDate() >= 29) || (d.getMonth() === 11 && d.getDate() <= 24);
    if (!inAdvent) continue;
    const set = advent.get(d.getFullYear()) ?? new Set<string>();
    set.add(dayKey(d));
    advent.set(d.getFullYear(), set);
  }
  return {
    prayed: rows.length,
    people: new Set(rows.map(r => r.prayer_id as string)).size,
    shared: shared.count ?? 0,
    journal: journal.count ?? 0,
    streak: longestStreak(days, dates),
    dawn: hours.filter(h => h >= 5 && h < 8).length,
    night: hours.filter(h => h >= 22).length,
    advent: Math.max(0, ...[...advent.values()].map(s => s.size)),
  };
}

/**
 * The trinkets that are out, with what you've earned and how close you are to the rest. Reloads when the screen
 * gains focus, and quietly awards any automatic goal you've reached.
 */
export function useTrinkets() {
  const { session } = useAuth();
  const { isReleased } = useReleases();
  const [earned, setEarned] = useState<Set<TrinketId>>(new Set());
  const [stats, setStats] = useState<Stats | null>(null);
  const loadId = useRef(0);

  const released = useMemo(() => TRINKET_ORDER.filter(id => isReleased(`trinket:${id}`)), [isReleased]);

  const reload = useCallback(async () => {
    if (!session) return;
    const id = ++loadId.current;
    try {
      const [own, s] = await Promise.all([
        supabase.from('user_trinkets').select('trinket_id'),
        loadStats(session.user.id),
      ]);
      if (id !== loadId.current) return;
      const have = new Set((own.data ?? []).map(r => r.trinket_id as TrinketId));
      // award automatic goals that are met
      const newly = released.filter(t => !have.has(t) && AUTO[t] && (() => { const [n, of] = AUTO[t]!(s); return n >= of; })());
      for (const t of newly) {
        const { error } = await supabase.rpc('earn_trinket', { p_trinket: t });
        if (!error || own.error) have.add(t);
      }
      setEarned(have);
      setStats(s);
    } catch (e) {
      console.warn('Trinkets failed', e);
    }
  }, [session, released]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        loadId.current += 1;
      };
    }, [reload]),
  );

  /** Claims an honor-system trinket. */
  const claim = useCallback(async (t: TrinketId) => {
    setEarned(prev => new Set(prev).add(t));
    const { error } = await supabase.rpc('earn_trinket', { p_trinket: t });
    if (error) console.warn('earn_trinket failed', error.message);
  }, []);

  const list: TrinketStatus[] = released.map(t => ({
    id: t,
    earned: earned.has(t),
    honor: !AUTO[t],
    progress: AUTO[t] && stats ? (([n, of]) => [Math.min(n, of), of] as [number, number])(AUTO[t]!(stats)) : undefined,
  }));

  return { trinkets: list, claim, reload, info: TRINKET_INFO };
}
