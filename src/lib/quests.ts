import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { Quest, QuestCategory, questsIn } from '@/lib/questPool';
import { supabase } from '@/lib/supabase';

// Daily quests from the guide, the week's journey, and the spiritual rhythm rings. Finished quests are saved through
// public.complete_quest(), which sets the XP and the daily limits; everything else here is picked on the phone.

export const CATEGORIES: QuestCategory[] = ['prayer', 'scripture', 'service', 'daily'];

export const CATEGORY_INFO: Record<QuestCategory, { ring: string; label: string; color: string; tint: string }> = {
  // Mid-tone colors so they read on both the light and the dark themes.
  prayer: { ring: 'Prayer', label: 'Prayer & worship', color: '#D9A441', tint: 'rgba(217,164,65,0.16)' },
  scripture: { ring: 'Scripture', label: 'Scripture & learning', color: '#4F9C7A', tint: 'rgba(79,156,122,0.16)' },
  service: { ring: 'Service', label: 'Love & service', color: '#D9735F', tint: 'rgba(217,115,95,0.16)' },
  daily: { ring: 'Daily faith', label: 'Faith & daily life', color: '#7C86D6', tint: 'rgba(124,134,214,0.16)' },
};

export const QUEST_XP = { n: 10, A: 30, S: 60 } as const;

/* ------------------------------ dates ------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');
/** The phone's local date as YYYY-MM-DD. */
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Monday of this week, local. */
function weekStart(d = new Date()): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

/** ISO week id, e.g. "2026-W43". */
export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}

/* ------------------------------ picking ------------------------------ */

/** Small stable hash, so everyone gets their own quests and they stay the same all day. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type DailyQuest = Quest & { slot: QuestCategory | 'bonus' };

/**
 * Today's four quests (one per category) and a bonus challenge. Asking the guide for "another path" bumps that slot's
 * reroll count, which picks a different quest from the same pool.
 */
export function pickDaily(seed: string, day: string, rerolls: Partial<Record<QuestCategory | 'bonus', number>>): DailyQuest[] {
  const regular = CATEGORIES.map(cat => {
    const pool = questsIn(cat, 'n');
    const q = pool[hash(`${seed}|${day}|${cat}|${rerolls[cat] ?? 0}`) % pool.length];
    return { ...q, slot: cat };
  });
  // The bonus rotates through the categories; Sundays bring a special (S) challenge.
  const date = new Date(`${day}T12:00:00`);
  const cat = CATEGORIES[(date.getDay() + hash(seed)) % CATEGORIES.length];
  const pool = questsIn(cat, 'bonus');
  const sunday = date.getDay() === 0;
  const preferred = pool.filter(q => (sunday ? q.tier === 'S' : q.tier === 'A'));
  const from = preferred.length ? preferred : pool;
  const bonus = from[hash(`${seed}|${day}|bonus|${rerolls.bonus ?? 0}`) % from.length];
  return [...regular, { ...bonus, slot: 'bonus' }];
}

/* ------------------------------ weekly journeys ------------------------------ */

export type Journey = { title: string; blurb: string; ref: string; prompts: [string, string, string, string, string] };

export const JOURNEYS: Journey[] = [
  {
    title: 'The Road to Emmaus',
    blurb: 'Five evenings of noticing where God walked beside you.',
    ref: 'Luke 24:13–35',
    prompts: [
      'Where did you see God today?',
      'When did your heart feel warm today?',
      'Who walked beside you today, even quietly?',
      'What did you understand today that you missed before?',
      'Who could you tell about what you have seen?',
    ],
  },
  {
    title: 'Songs of Ascent',
    blurb: 'Climb toward God one psalm a night, the way pilgrims did on the road to Jerusalem.',
    ref: 'Psalms 120–134',
    prompts: [
      'Read Psalm 121. Where do you need help tonight?',
      'Read Psalm 122. What made you glad today?',
      'Read Psalm 126. What would joy after sorrow look like?',
      'Read Psalm 130. What are you waiting on God for?',
      'Read Psalm 133. Where did you see unity today?',
    ],
  },
  {
    title: 'Fruit of the Spirit',
    blurb: 'Each evening, look for one fruit growing in your day.',
    ref: 'Galatians 5:22–23',
    prompts: [
      'Where did love show up in your day?',
      'What gave you joy, even a small one?',
      'When did you choose peace over worry?',
      'Where were you patient, or wish you had been?',
      'What kindness did you give or receive?',
    ],
  },
  {
    title: 'Lost and Found',
    blurb: 'Three parables of things that were lost, and the joy of finding them.',
    ref: 'Luke 15',
    prompts: [
      'Read about the lost sheep. Who might feel left out right now?',
      'Read about the lost coin. What small thing did God care about today?',
      'Read about the son who left. Where do you need to come home?',
      'Read about the older brother. Where is it hard to celebrate others?',
      'Thank God for one way He found you.',
    ],
  },
  {
    title: 'Salt and Light',
    blurb: 'Five evenings with the Sermon on the Mount.',
    ref: 'Matthew 5–7',
    prompts: [
      'Read Matthew 5:13–16. Where did you shine today?',
      'Read Matthew 6:9–13. Pray it slowly, one line at a time.',
      'Read Matthew 6:25–34. Hand one worry to God.',
      'Read Matthew 7:7–12. What are you asking God for?',
      'Read Matthew 7:24–27. What is your life built on?',
    ],
  },
  {
    title: 'Where You Go',
    blurb: 'Walk with Ruth: loyalty, kindness, and a home made new.',
    ref: 'Ruth 1–4',
    prompts: [
      'Read Ruth 1. Who has stayed beside you?',
      'Read Ruth 2. Where did you find kindness today?',
      'Read Ruth 3. What step of faith is in front of you?',
      'Read Ruth 4. How has God restored something for you?',
      'Who could you be faithful to this week?',
    ],
  },
];

export function journeyForWeek(week: string): Journey {
  return JOURNEYS[hash(week) % JOURNEYS.length];
}

/* ------------------------------ the hook ------------------------------ */

type Completion = { quest_id: string; category: QuestCategory | 'journey'; tier: string; xp: number; day: string };

export type QuestStatus = 'new' | 'active' | 'done';
export type CompleteResult = { ok: true; xp: number; journeySteps: number; rewarded: boolean } | { ok: false; message: string };

const acceptedKey = (day: string) => `quests.accepted.${day}`;
const rerollKey = (day: string) => `quests.rerolls.${day}`;
/** How many times a day the guide will offer another path for one slot. */
export const MAX_REROLLS = 2;

const ERRORS: Record<string, string> = {
  already_done_today: 'You already finished one of these today. A new path opens tomorrow.',
  journey_complete: 'You walked the whole road this week.',
  not_signed_in: 'Sign in to keep your quests.',
};

/** Today's quests, what you have finished this week, and the actions to accept, finish or swap a quest. */
export function useQuests() {
  const { session } = useAuth();
  const day = localDay();
  const week = isoWeek();
  const seed = session?.user.id ?? 'guest';

  const [completions, setCompletions] = useState<Completion[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [rerolls, setRerolls] = useState<Partial<Record<QuestCategory | 'bonus', number>>>({});
  const [loaded, setLoaded] = useState(false);
  const loadId = useRef(0);

  const load = useCallback(async () => {
    // Without a session the quests still show; they just can't be saved yet.
    if (!session) {
      setLoaded(true);
      return;
    }
    const id = ++loadId.current;
    const since = localDay(weekStart());
    const [{ data }, acc, rr] = await Promise.all([
      supabase
        .from('quest_completions')
        .select('quest_id, category, tier, xp, day')
        .eq('user_id', session.user.id)
        .or(`day.gte.${since},quest_id.eq.j:${week}`),
      AsyncStorage.getItem(acceptedKey(day)).catch(() => null),
      AsyncStorage.getItem(rerollKey(day)).catch(() => null),
    ]);
    if (id !== loadId.current) return;
    setCompletions((data ?? []) as Completion[]);
    try {
      setAccepted(acc ? JSON.parse(acc) : []);
      setRerolls(rr ? JSON.parse(rr) : {});
    } catch {
      setAccepted([]);
      setRerolls({});
    }
    setLoaded(true);
  }, [session, day, week]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        loadId.current += 1;
      };
    }, [load]),
  );

  const quests = useMemo(() => pickDaily(seed, day, rerolls), [seed, day, rerolls]);

  const today = useMemo(() => completions.filter(c => c.day === day), [completions, day]);
  const statusOf = useCallback(
    (q: DailyQuest): QuestStatus => {
      const done =
        q.slot === 'bonus'
          ? today.some(c => c.tier !== 'n' && c.category !== 'journey')
          : today.some(c => c.category === q.slot && c.tier === 'n');
      if (done) return 'done';
      return accepted.includes(q.id) ? 'active' : 'new';
    },
    [today, accepted],
  );

  /** Days this week (out of 7) with a finished quest in each category. Only ever grows during the week. */
  const rings = useMemo(() => {
    const since = localDay(weekStart());
    const out = {} as Record<QuestCategory, number>;
    for (const cat of CATEGORIES) {
      out[cat] = new Set(completions.filter(c => c.category === cat && c.day >= since).map(c => c.day)).size;
    }
    return out;
  }, [completions]);

  const journey = journeyForWeek(week);
  const journeySteps = completions.filter(c => c.quest_id === `j:${week}`).length;
  const reflectedToday = today.some(c => c.category === 'journey');

  const accept = useCallback(
    async (q: DailyQuest) => {
      const next = Array.from(new Set([...accepted, q.id]));
      setAccepted(next);
      try {
        await AsyncStorage.setItem(acceptedKey(day), JSON.stringify(next));
      } catch {}
    },
    [accepted, day],
  );

  const reroll = useCallback(
    async (q: DailyQuest) => {
      const n = (rerolls[q.slot] ?? 0) + 1;
      if (n > MAX_REROLLS) return false;
      const next = { ...rerolls, [q.slot]: n };
      setRerolls(next);
      try {
        await AsyncStorage.setItem(rerollKey(day), JSON.stringify(next));
      } catch {}
      return true;
    },
    [rerolls, day],
  );

  const record = useCallback(
    async (questId: string, category: QuestCategory | 'journey', tier: string): Promise<CompleteResult> => {
      const { data, error } = await supabase.rpc('complete_quest', {
        p_quest_id: questId,
        p_category: category,
        p_tier: tier,
        p_day: day,
      });
      if (error) {
        const code = Object.keys(ERRORS).find(k => error.message.includes(k));
        return { ok: false, message: code ? ERRORS[code] : 'Could not save that. Please try again.' };
      }
      const res = data as { xp: number; journey_steps: number; rewarded: boolean };
      setCompletions(prev => [...prev, { quest_id: questId, category, tier, xp: res.xp, day }]);
      return { ok: true, xp: res.xp, journeySteps: res.journey_steps, rewarded: res.rewarded };
    },
    [day],
  );

  const complete = useCallback(
    (q: DailyQuest) => record(q.id, q.slot === 'bonus' ? q.category : q.slot, q.tier),
    [record],
  );
  const reflect = useCallback(() => record(`j:${week}`, 'journey', 'n'), [record, week]);

  return {
    loaded,
    quests,
    statusOf,
    rings,
    rerolls,
    journey,
    journeySteps,
    reflectedToday,
    accept,
    reroll,
    complete,
    reflect,
  };
}
