import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { pipStageForLevel, PipStage } from '@/components/pets/PipLamb';
import { DEFAULT_PET, getPet, isPetId, PetId, PETS, useAvailablePets } from '@/components/pets/registry';
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
const levelKey = (id: PetId) => `pet.lastSeenLevel.${id}`;
const XP_CACHE_KEY = 'pet.xpCache';

type XpCache = { userId: string; xpByPet: Partial<Record<PetId, number>> };

// The last known pet and XP, kept in memory so every screen draws the right pet on its first frame.
let knownPet: { id: PetId; name: string } | null = null;
let knownXp: XpCache | null = null;

/** The last XP seen on this phone. Before the session has loaded there's no user to check it against yet. */
function cachedXp(userId?: string): XpCache['xpByPet'] {
  if (!knownXp || (userId && knownXp.userId !== userId)) return {};
  return knownXp.xpByPet;
}

function rememberXp(userId: string, xpByPet: Record<PetId, number>) {
  knownXp = { userId, xpByPet };
  AsyncStorage.setItem(XP_CACHE_KEY, JSON.stringify(knownXp)).catch(() => {});
}

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

/** Reads the saved pet and XP into memory. The app calls this behind the splash screen, before any screen mounts. */
export async function preloadPet(): Promise<void> {
  const id = await loadPetId();
  knownPet = { id, name: await loadPetName(id) };
  try {
    const raw = await AsyncStorage.getItem(XP_CACHE_KEY);
    if (raw) knownXp = JSON.parse(raw) as XpCache;
  } catch {}
}

/** Returns true when this pet's `level` is higher than the last level shown for it on this device, then records it. */
async function consumeLevelUp(id: PetId, level: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(levelKey(id));
    await AsyncStorage.setItem(levelKey(id), String(level));
    return raw !== null && level > Number(raw);
  } catch {
    return false;
  }
}

/** The chosen companion and its name, reloaded whenever the screen gains focus. */
export function usePetChoice() {
  const [petId, setPetIdState] = useState<PetId>(knownPet?.id ?? DEFAULT_PET);
  const [name, setNameState] = useState(knownPet?.name ?? getPet(DEFAULT_PET).name);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const id = await loadPetId();
        const n = await loadPetName(id);
        if (cancelled) return;
        knownPet = { id, name: n };
        setPetIdState(id);
        setNameState(n);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const setPetId = useCallback(async (id: PetId) => {
    setPetIdState(id);
    await savePetId(id);
    const n = await loadPetName(id);
    knownPet = { id, name: n };
    setNameState(n);
  }, []);

  const setName = useCallback((n: string) => {
    if (knownPet) knownPet = { ...knownPet, name: n };
    setNameState(n);
  }, []);

  // A companion that isn't out (e.g. its date was moved later) shows as the default until its date.
  const available = useAvailablePets();
  if (!available.some(p => p.id === petId)) {
    return { petId: DEFAULT_PET, name: getPet(DEFAULT_PET).name, setName, setPetId };
  }
  return { petId, name, setName, setPetId };
}

/**
 * Each pet's XP: what it banked in earlier turns as the active pet (public.pet_xp), plus, for the active pet, what the
 * account has earned since it became active (public.pet_state). Pets never share levels.
 * If those tables are not there yet, every pet falls back to the account's total, as before.
 */
async function loadXpByPet(
  localPet: PetId,
  total: number,
): Promise<{ xpByPet: Record<PetId, number>; activePet: PetId }> {
  const shared = Object.fromEntries(PETS.map(p => [p.id, total])) as Record<PetId, number>;
  const [state, banked] = await Promise.all([
    supabase.from('pet_state').select('active_pet, active_since_xp').maybeSingle(),
    supabase.from('pet_xp').select('pet_id, banked_xp'),
  ]);
  if (state.error || banked.error) return { xpByPet: shared, activePet: localPet };

  let activePet = localPet;
  let since = 0;
  if (state.data && isPetId(state.data.active_pet)) {
    activePet = state.data.active_pet;
    since = (state.data.active_since_xp as number) ?? 0;
  } else {
    // First load since per-pet levels: the current pet keeps everything earned so far.
    const { error } = await supabase.rpc('switch_pet', { p_from: localPet, p_to: localPet, p_total: total });
    if (error) return { xpByPet: shared, activePet: localPet };
  }

  const xpByPet = Object.fromEntries(PETS.map(p => [p.id, 0])) as Record<PetId, number>;
  for (const row of banked.data ?? []) {
    if (isPetId(row.pet_id)) xpByPet[row.pet_id] = (row.banked_xp as number) ?? 0;
  }
  xpByPet[activePet] += Math.max(total - since, 0);
  return { xpByPet, activePet };
}

/** Loads the signed-in user's XP each time the screen gains focus. `progress` is the chosen pet's own level. */
export function usePetProgress() {
  const { session } = useAuth();
  const choice = usePetChoice();
  const { setPetId: setChoice } = choice;
  const [progress, setProgress] = useState<PetProgress>(
    () => petProgressFromXp(cachedXp(session?.user.id)[knownPet?.id ?? DEFAULT_PET] ?? 0),
  );
  const [xpByPet, setXpByPet] = useState<Record<PetId, number>>(
    () => ({ ...Object.fromEntries(PETS.map(p => [p.id, 0])), ...cachedXp(session?.user.id) }) as Record<PetId, number>,
  );
  const [leveledUp, setLeveledUp] = useState(false);

  // Bumped to throw away a load that finished after a newer one started (or after the screen lost focus).
  const loadId = useRef(0);
  // The account's total XP and active pet from the last load, needed when switching pets.
  const lastTotal = useRef<number | null>(null);
  const activePetRef = useRef<PetId | null>(null);

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
      const total = xpFromCounts({
        prayed: prayed.count ?? 0,
        shared: shared.count ?? 0,
        journal: journal.count ?? 0,
        quests: questXp,
      });
      const localPet = await loadPetId();
      const { xpByPet: byPet, activePet } = await loadXpByPet(localPet, total);
      if (id !== loadId.current) return;
      lastTotal.current = total;
      activePetRef.current = activePet;
      // Another device may have switched pets; follow the account.
      if (activePet !== localPet) await setChoice(activePet);
      const next = petProgressFromXp(byPet[activePet]);
      rememberXp(userId, byPet);
      setXpByPet(byPet);
      setProgress(next);
      const up = await consumeLevelUp(activePet, next.level);
      if (id === loadId.current && up) {
        setLeveledUp(true);
        setTimeout(() => setLeveledUp(false), 2200);
      }
    } catch (e) {
      console.warn('Pet progress failed', e);
    }
  }, [session, setChoice]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        loadId.current += 1;
      };
    }, [reload]),
  );

  /** Switches companion. The old pet keeps the XP it earned; the new one picks up from its own level. */
  const setPetId = useCallback(
    async (next: PetId) => {
      const from = activePetRef.current ?? (await loadPetId());
      if (from === next) return;
      // Show the new pet's own level straight away.
      setProgress(petProgressFromXp(xpByPet[next] ?? 0));
      await setChoice(next);
      if (session && lastTotal.current !== null) {
        const { error } = await supabase.rpc('switch_pet', { p_from: from, p_to: next, p_total: lastTotal.current });
        if (error) console.warn('switch_pet failed', error.message);
      }
      await reload();
    },
    [reload, session, setChoice, xpByPet],
  );

  return { progress, xpByPet, leveledUp, reload, ...choice, setPetId };
}
