import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { pipStageForLevel, PipStage } from '@/components/pets/PipLamb';
import { DEFAULT_PET, getPet, isPetId, PetId } from '@/components/pets/registry';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/** XP rules from design/README.md (share +20, pray for others +10, journal +5; 50 XP per level). */
export const XP = { share: 20, prayed: 10, journal: 5 } as const;
export const XP_PER_LEVEL = 50;

export type PetProgress = {
  xp: number;
  level: number;
  /** XP into the current level, 0..XP_PER_LEVEL-1. */
  xpInLevel: number;
  stage: PipStage;
};

export function petProgressFromXp(xp: number): PetProgress {
  const level = 1 + Math.floor(xp / XP_PER_LEVEL);
  return { xp, level, xpInLevel: xp % XP_PER_LEVEL, stage: pipStageForLevel(level) };
}

/** XP comes from rows the app already writes, plus whatever finished quests were worth (public.quest_completions). */
export function xpFromCounts(c: { prayed: number; shared: number; journal: number; quests?: number }): number {
  return c.prayed * XP.prayed + c.shared * XP.share + c.journal * XP.journal + (c.quests ?? 0);
}

const PET_KEY = 'pet.id';
const nameKey = (id: PetId) => (id === 'lamb' ? 'pet.name' : `pet.name.${id}`);
const LEVEL_KEY = 'pet.lastSeenLevel';

export async function loadPetId(): Promise<PetId> {
  try {
    const raw = await AsyncStorage.getItem(PET_KEY);
    return isPetId(raw) ? raw : DEFAULT_PET;
  } catch {
    return DEFAULT_PET;
  }
}

export async function savePetId(id: PetId): Promise<void> {
  try {
    await AsyncStorage.setItem(PET_KEY, id);
  } catch {}
}

export async function loadPetName(id: PetId): Promise<string> {
  try {
    return (await AsyncStorage.getItem(nameKey(id))) || getPet(id).name;
  } catch {
    return getPet(id).name;
  }
}

export async function savePetName(id: PetId, name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(nameKey(id), name.trim().slice(0, 16) || getPet(id).name);
  } catch {}
}

/** Returns true when `level` is higher than the last level shown on this device, then records it. */
async function consumeLevelUp(level: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LEVEL_KEY);
    await AsyncStorage.setItem(LEVEL_KEY, String(level));
    return raw !== null && level > Number(raw);
  } catch {
    return false;
  }
}

/** The chosen companion and its name, reloaded whenever the screen gains focus. */
export function usePetChoice() {
  const [petId, setPetIdState] = useState<PetId>(DEFAULT_PET);
  const [name, setName] = useState(getPet(DEFAULT_PET).name);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const id = await loadPetId();
        const n = await loadPetName(id);
        if (cancelled) return;
        setPetIdState(id);
        setName(n);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const setPetId = useCallback(async (id: PetId) => {
    setPetIdState(id);
    await savePetId(id);
    setName(await loadPetName(id));
  }, []);

  return { petId, name, setName, setPetId };
}

/** Loads the signed-in user's XP each time the screen gains focus. */
export function usePetProgress() {
  const { session } = useAuth();
  const choice = usePetChoice();
  const [progress, setProgress] = useState<PetProgress>(petProgressFromXp(0));
  const [leveledUp, setLeveledUp] = useState(false);

  // Bumped to throw away a load that finished after a newer one started (or after the screen lost focus).
  const loadId = useRef(0);

  const reload = useCallback(async () => {
    if (!session) return;
    const id = ++loadId.current;
    const userId = session.user.id;
    try {
      const [prayed, shared, journal, quests] = await Promise.all([
        supabase
          .from('prayer_interactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('action', 'prayed'),
        supabase.from('prayers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('biography_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('quest_completions').select('xp').eq('user_id', userId),
      ]);
      if (id !== loadId.current) return;
      const questXp = (quests.data ?? []).reduce((sum, r) => sum + ((r.xp as number) ?? 0), 0);
      const next = petProgressFromXp(
        xpFromCounts({
          prayed: prayed.count ?? 0,
          shared: shared.count ?? 0,
          journal: journal.count ?? 0,
          quests: questXp,
        }),
      );
      setProgress(next);
      const up = await consumeLevelUp(next.level);
      if (id === loadId.current && up) {
        setLeveledUp(true);
        setTimeout(() => setLeveledUp(false), 2200);
      }
    } catch (e) {
      console.warn('Pet progress failed', e);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        loadId.current += 1;
      };
    }, [reload]),
  );

  return { progress, leveledUp, reload, ...choice };
}
