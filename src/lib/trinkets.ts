// Prayer nook trinkets: 24 keepsakes from design/Trinkets.dc.html, all released Nov 7, 2026 (public.content_releases,
// id `trinket:<id>`, see src/lib/releases.ts). Once one is out, you earn it by its goal. Goals the app can see in your
// own activity are checked automatically; the rest (praying in a church, when anxious...) are on your honor, with an
// "I did this" button. Earned trinkets are kept in public.user_trinkets and sit on the shelf beside your companion.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COLLECTION_KEEPSAKE_GOALS, COLLECTION_KEEPSAKE_ORDER } from '@/components/pets/collectionData';
import { TRINKET_INFO, TrinketId } from '@/components/pets/trinketArt';
import { useAuth } from '@/lib/auth';
import { LOCAL_KEYS, readForUser, writeForUser } from '@/lib/localCache';
import type { QuestCategory } from '@/lib/questPool';
import { useReleases } from '@/lib/releases';
import { afterLaunch } from '@/lib/launch';
import { supabase } from '@/lib/supabase';

/** Display order, two per month of the original schedule, matched to the season where one fits. */
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
  // The nook collection: one or two a week from Nov 9, 2026, dates in public.content_releases.
  ...COLLECTION_KEEPSAKE_ORDER,
];

/** The quest counts a keepsake goal can be measured by. */
export type QuestGoalStat = 'quests' | 'prayerQuests' | 'scriptureQuests' | 'serviceQuests' | 'dailyQuests' | 'bonusQuests' | 'questDays' | 'journeys';

type Stats = {
  prayed: number;
  /** Different prayer requests prayed for. */
  people: number;
  shared: number;
  journal: number;
  /** Longest run of days with at least one prayer. */
  streak: number;
  /** The run going now. It still counts if you haven't prayed yet today. */
  currentStreak: number;
  dawn: number;
  night: number;
  /** Most days prayed in any one Advent (Nov 29 – Dec 24). */
  advent: number;
  /** Daily and bonus quests finished, not counting journey steps. */
  quests: number;
  prayerQuests: number;
  scriptureQuests: number;
  serviceQuests: number;
  dailyQuests: number;
  /** Bonus and Sabbath challenges finished. */
  bonusQuests: number;
  /** Different days with at least one quest or journey step. */
  questDays: number;
  /** Weekly journeys walked to their fifth step. */
  journeys: number;
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

/** Half the set is earned through quests, so finishing quests always has something to work toward. */
const QUEST_GOALS: Partial<Record<TrinketId, (s: Stats) => [number, number]>> = {
  shepherdLambPlush: s => [s.quests, 1],
  lilyOfTheField: s => [s.quests, 10],
  oliveBranchVase: s => [s.dailyQuests, 5],
  fishersNet: s => [s.serviceQuests, 15],
  roseWindowSuncatcher: s => [s.bonusQuests, 3],
  loavesFishesBasket: s => [s.serviceQuests, 5],
  psalmHarp: s => [s.scriptureQuests, 10],
  harborLighthouse: s => [s.prayerQuests, 15],
  hourglassOfStillness: s => [s.questDays, 7],
  arkInABottle: s => [s.journeys, 1],
  galaxyPromiseJar: s => [s.quests, 100],
  pearlOfGreatPrice: s => [s.journeys, 6],
};
// Every collection keepsake is a quest goal too.
for (const [id, [stat, target]] of Object.entries(COLLECTION_KEEPSAKE_GOALS)) {
  QUEST_GOALS[id as TrinketId] = (st: Stats) => [st[stat], target];
}
Object.assign(AUTO, QUEST_GOALS);

/** The trinket each kind of daily quest counts toward, nearest goal first. */
export const QUEST_TRINKETS: Record<QuestCategory, TrinketId[]> = {
  prayer: ['harborLighthouse'],
  scripture: ['psalmHarp'],
  service: ['loavesFishesBasket', 'fishersNet'],
  daily: ['oliveBranchVase'],
};
/** The keepsakes a bonus challenge counts toward. */
export const BONUS_TRINKETS: TrinketId[] = ['roseWindowSuncatcher'];
const GOAL_CATEGORY: Partial<Record<QuestGoalStat, QuestCategory>> = {
  prayerQuests: 'prayer',
  scriptureQuests: 'scripture',
  serviceQuests: 'service',
  dailyQuests: 'daily',
};
for (const id of COLLECTION_KEEPSAKE_ORDER) {
  const [stat] = COLLECTION_KEEPSAKE_GOALS[id];
  const category = GOAL_CATEGORY[stat];
  if (category) QUEST_TRINKETS[category].push(id);
  else if (stat === 'bonusQuests') BONUS_TRINKETS.push(id);
}

export type TrinketStatus = {
  id: TrinketId;
  earned: boolean;
  /** For goals the app checks: how far along you are. */
  progress?: [number, number];
  /** Goals on your honor: claimed with "I did this". */
  honor: boolean;
  /** Earned by finishing quests. */
  quest: boolean;
};

const JOURNEY_STEPS = 5;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function currentStreak(days: Set<string>): number {
  const day = new Date();
  if (!days.has(dayKey(day))) day.setDate(day.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(day))) {
    n += 1;
    day.setDate(day.getDate() - 1);
  }
  return n;
}

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
  const [prayed, shared, journal, questRows] = await Promise.all([
    supabase
      .from('prayer_interactions')
      .select('prayer_id, created_at')
      .eq('user_id', userId)
      .eq('action', 'prayed')
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase.from('prayers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('biography_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('quest_completions').select('quest_id, category, tier, day').eq('user_id', userId).limit(5000),
  ]);
  const completions = questRows.data ?? [];
  const quests = completions.filter(q => q.category !== 'journey');
  const inCategory = (category: string) => quests.filter(q => q.category === category).length;
  const journeySteps = new Map<string, number>();
  for (const q of completions) {
    if (q.category === 'journey') journeySteps.set(q.quest_id as string, (journeySteps.get(q.quest_id as string) ?? 0) + 1);
  }
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
    currentStreak: currentStreak(days),
    dawn: hours.filter(h => h >= 5 && h < 8).length,
    night: hours.filter(h => h >= 22).length,
    advent: Math.max(0, ...[...advent.values()].map(s => s.size)),
    quests: quests.length,
    prayerQuests: inCategory('prayer'),
    scriptureQuests: inCategory('scripture'),
    serviceQuests: inCategory('service'),
    dailyQuests: inCategory('daily'),
    bonusQuests: quests.filter(q => q.tier !== 'n').length,
    questDays: new Set(completions.map(q => q.day as string)).size,
    journeys: [...journeySteps.values()].filter(steps => steps >= JOURNEY_STEPS).length,
  };
}

/**
 * The trinkets that are out, with what you've earned and how close you are to the rest. Reloads when the screen
 * gains focus, and quietly awards any automatic goal you've reached.
 */
export function useTrinkets() {
  const { session } = useAuth();
  const { isReleased } = useReleases();
  const [cached] = useState(() => readForUser<{ earned: TrinketId[]; stats: Stats | null }>(LOCAL_KEYS.trinkets, session?.user.id));
  const [earned, setEarned] = useState<Set<TrinketId>>(() => new Set(cached?.earned));
  const [stats, setStats] = useState<Stats | null>(cached?.stats ?? null);
  const loadId = useRef(0);

  const released = useMemo(() => TRINKET_ORDER.filter(id => isReleased(`trinket:${id}`)), [isReleased]);

  /** Returns any trinkets this load awarded. */
  const reload = useCallback(async (): Promise<TrinketId[]> => {
    if (!session) return [];
    const id = ++loadId.current;
    const awarded: TrinketId[] = [];
    try {
      const [own, s] = await Promise.all([
        supabase.from('user_trinkets').select('trinket_id'),
        loadStats(session.user.id),
      ]);
      if (id !== loadId.current) return [];
      const have = new Set((own.data ?? []).map(r => r.trinket_id as TrinketId));
      // award automatic goals that are met
      const newly = released.filter(t => !have.has(t) && AUTO[t] && (() => { const [n, of] = AUTO[t]!(s); return n >= of; })());
      for (const t of newly) {
        const { error } = await supabase.rpc('earn_trinket', { p_trinket: t });
        if (!error) awarded.push(t);
        if (!error || own.error) have.add(t);
      }
      setEarned(have);
      setStats(s);
    } catch (e) {
      console.warn('Trinkets failed', e);
    }
    return awarded;
  }, [session, released]);

  useFocusEffect(
    useCallback(() => {
      // Saved copies cover the first moments after launch, so the refresh waits until the app has settled.
      const cancel = afterLaunch(() => {
        reload();
      });
      return () => {
        cancel();
        loadId.current += 1;
      };
    }, [reload]),
  );

  // Saved for the next launch, so the shelf and streak draw straight away.
  const userId = session?.user.id;
  useEffect(() => {
    if (userId && stats) writeForUser(LOCAL_KEYS.trinkets, userId, { earned: [...earned], stats });
  }, [userId, earned, stats]);

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
    quest: t in QUEST_GOALS,
    progress: AUTO[t] && stats ? (([n, of]) => [Math.min(n, of), of] as [number, number])(AUTO[t]!(stats)) : undefined,
  }));

  return { trinkets: list, claim, reload, info: TRINKET_INFO, currentStreak: stats?.currentStreak ?? 0 };
}
