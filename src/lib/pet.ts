import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { pipStageForLevel, PipStage } from '@/components/pets/PipLamb';
import { DEFAULT_PET, getPet, isPetId, PetId, PETS, useAvailablePets } from '@/components/pets/registry';
import { useAuth } from '@/lib/auth';
import { saveEntryToCloud, saveToCloud } from '@/lib/cloudProgress';
import { afterLaunch } from '@/lib/launch';
import { LOCAL_KEYS, readLocal, writeLocal } from '@/lib/localCache';
import { supabase } from '@/lib/supabase';
import { usePalStage, usePalStages } from '@/lib/winterEvent';

/** XP rules from design/README.md (share +20, pray for others +10, journal +5; 50 XP per level), plus the Bible:
 * +3 for each chapter read through (once per chapter a day) and +5 for each note taken on it. */
export const XP = { share: 20, prayed: 10, journal: 5, bibleRead: 3, bibleNote: 5 } as const;
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
/** Keep in step with public.account_xp() in the database, which switch_pet uses (supabase/SQL_CHANGES.md #15). */
export function xpFromCounts(c: {
  prayed: number;
  shared: number;
  journal: number;
  quests?: number;
  bibleReads?: number;
  bibleNotes?: number;
}): number {
  return (
    c.prayed * XP.prayed +
    c.shared * XP.share +
    c.journal * XP.journal +
    (c.quests ?? 0) +
    (c.bibleReads ?? 0) * XP.bibleRead +
    (c.bibleNotes ?? 0) * XP.bibleNote
  );
}

const PET_KEY = 'pet.id';
const nameKey = (id: PetId) => (id === 'lamb' ? 'pet.name' : `pet.name.${id}`);
const levelKey = (id: PetId) => `pet.lastSeenLevel.${id}`;
const XP_CACHE_KEY = 'pet.xpCache';

/** `claimed`: every companion this account has ever walked with (a public.pet_xp row, or the active one), even at 0 XP. */
type XpCache = { userId: string; xpByPet: Partial<Record<PetId, number>>; claimed?: PetId[]; total?: number };

// The current pet and XP, shared by every screen. A change here (switching pets, new XP) reaches every screen that
// shows a pet at once, instead of each one catching up when it's next opened.
let knownPet: { id: PetId; name: string } | null = null;
let knownXp: XpCache | null = null;
/** The account's total XP and active pet from the last load, needed when switching pets. */
let lastTotal: number | null = null;
let activePet: PetId | null = null;

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function setKnownPet(next: { id: PetId; name: string }) {
  if (knownPet?.id === next.id && knownPet.name === next.name) return;
  knownPet = next;
  listeners.forEach(fn => fn());
}

// A different account (signed out, a guest, someone else logging in) never inherits the last one's companion: forget
// the current pet, its levels and the claimed list, so the next load takes the new account's (from public.pet_state),
// or the default companion for a brand-new account. Names and the rest are reset by syncCloudProgress.
let authUserId: string | null | undefined;
supabase.auth.onAuthStateChange((_event, next) => {
  const nextId = next?.user.id ?? null;
  if (authUserId !== undefined && nextId !== authUserId) {
    knownXp = null;
    lastTotal = null;
    activePet = null;
    knownPet = { id: DEFAULT_PET, name: getPet(DEFAULT_PET).name };
    listeners.forEach(fn => fn());
    AsyncStorage.multiRemove([PET_KEY, XP_CACHE_KEY, ...PETS.map(p => nameKey(p.id)), ...PETS.map(p => levelKey(p.id))]).catch(() => {});
  }
  authUserId = nextId;
});

function rememberXp(userId: string, xpByPet: Record<PetId, number>, claimed: PetId[], total?: number) {
  knownXp = { userId, xpByPet, claimed, total: total ?? knownXp?.total };
  listeners.forEach(fn => fn());
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
    const saved = name.trim().slice(0, 16) || getPet(id).name;
    await AsyncStorage.setItem(nameKey(id), saved);
    saveEntryToCloud('pet_names', id, saved);
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
    if (raw === null || level > Number(raw)) saveEntryToCloud('levels_seen', id, level);
    return raw !== null && level > Number(raw);
  } catch {
    return false;
  }
}

/** The day each companion first walked with you on this phone, as an ISO date. */
export function metDates(): Partial<Record<PetId, string>> {
  return readLocal<Partial<Record<PetId, string>>>(LOCAL_KEYS.companionsMet) ?? {};
}

function recordMet(id: PetId) {
  const met = metDates();
  if (met[id]) return;
  const next = { ...met, [id]: new Date().toISOString() };
  writeLocal(LOCAL_KEYS.companionsMet, next).catch(() => {});
  saveToCloud('companions_met', next);
}

/** The chosen companion and its name, reloaded whenever the screen gains focus. */
export function usePetChoice() {
  const current = useSyncExternalStore(subscribe, () => knownPet);
  const petId = current?.id ?? DEFAULT_PET;
  const name = current?.name ?? getPet(DEFAULT_PET).name;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const id = await loadPetId();
        const n = await loadPetName(id);
        if (cancelled) return;
        recordMet(id);
        setKnownPet({ id, name: n });
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const setPetId = useCallback(async (id: PetId) => {
    // Every screen switches now; the saved name follows a moment later if it's been renamed.
    setKnownPet({ id, name: knownPet?.id === id ? knownPet.name : getPet(id).name });
    recordMet(id);
    await savePetId(id);
    const n = await loadPetName(id);
    if (knownPet?.id === id) setKnownPet({ id, name: n });
  }, []);

  const setName = useCallback((n: string) => {
    if (knownPet) setKnownPet({ ...knownPet, name: n });
  }, []);

  // A companion that isn't out (e.g. its date was moved later) shows as the default until its date, unless this
  // account has already had it: then it's theirs for good.
  const available = useAvailablePets();
  const xpSnap = useSyncExternalStore(subscribe, () => knownXp);
  const { session } = useAuth();
  const claimedHere = xpSnap && session && xpSnap.userId === session.user.id ? xpSnap.claimed ?? [] : [];
  if (!available.some(p => p.id === petId) && !claimedHere.includes(petId)) {
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
): Promise<{ xpByPet: Record<PetId, number>; activePet: PetId; claimed: PetId[] | null }> {
  const shared = Object.fromEntries(PETS.map(p => [p.id, total])) as Record<PetId, number>;
  const [state, banked] = await Promise.all([
    supabase.from('pet_state').select('active_pet, active_since_xp').maybeSingle(),
    supabase.from('pet_xp').select('pet_id, banked_xp'),
  ]);
  if (state.error || banked.error) return { xpByPet: shared, activePet: localPet, claimed: null };

  let activePet = localPet;
  let since = 0;
  if (state.data && isPetId(state.data.active_pet)) {
    activePet = state.data.active_pet;
    since = (state.data.active_since_xp as number) ?? 0;
  } else {
    // First load since per-pet levels: the current pet keeps everything earned so far.
    const { error } = await supabase.rpc('switch_pet', { p_from: localPet, p_to: localPet, p_total: total });
    if (error) return { xpByPet: shared, activePet: localPet, claimed: null };
  }

  const xpByPet = Object.fromEntries(PETS.map(p => [p.id, 0])) as Record<PetId, number>;
  for (const row of banked.data ?? []) {
    if (isPetId(row.pet_id)) xpByPet[row.pet_id] = (row.banked_xp as number) ?? 0;
  }
  xpByPet[activePet] += Math.max(total - since, 0);
  // Walked with at some point (a banked row, even at 0 XP) or walking now: this account's for good.
  const claimed = [...new Set([activePet, ...(banked.data ?? []).map(row => row.pet_id).filter(isPetId)])];
  return { xpByPet, activePet, claimed };
}

/** Loads the signed-in user's XP each time the screen gains focus. `progress` is the chosen pet's own level. */
export function usePetProgress() {
  const { session } = useAuth();
  const choice = usePetChoice();
  const { setPetId: setChoice } = choice;
  // Shared with every screen, so a switch or new XP shows everywhere at once.
  const xpSnapshot = useSyncExternalStore(subscribe, () => knownXp);
  const userId = session?.user.id;
  const xpByPet = useMemo(
    () => ({ ...Object.fromEntries(PETS.map(p => [p.id, 0])), ...(xpSnapshot && (!userId || xpSnapshot.userId === userId) ? xpSnapshot.xpByPet : {}) }) as Record<PetId, number>,
    [xpSnapshot, userId],
  );
  // Yours for good once claimed or earned, whatever the season or the vault says: walked with at any time, any XP, or
  // an event companion met in its event.
  const palStages = usePalStages();
  const claimedList = xpSnapshot && (!userId || xpSnapshot.userId === userId) ? xpSnapshot.claimed : undefined;
  const owned = useMemo(() => {
    const set = new Set<PetId>(claimedList ?? []);
    set.add(choice.petId);
    for (const p of PETS) {
      if ((xpByPet[p.id] ?? 0) > 0 || (palStages[p.id] ?? 0) >= 1) set.add(p.id);
    }
    return set as ReadonlySet<PetId>;
  }, [claimedList, choice.petId, xpByPet, palStages]);
  // Event companions grow through their event, not XP (Snowcap → Frost Mage → Frost Lord; Vesper → Fen Warden → Old King).
  const palStage = usePalStage(choice.petId);
  const progress = useMemo(() => {
    const own = petProgressFromXp(xpByPet[choice.petId] ?? 0);
    return palStage !== null ? { ...own, stage: Math.min(3, Math.max(1, palStage)) as PipStage } : own;
  }, [xpByPet, choice.petId, palStage]);
  const [leveledUp, setLeveledUp] = useState(false);

  // Bumped to throw away a load that finished after a newer one started (or after the screen lost focus).
  const loadId = useRef(0);

  const reload = useCallback(async () => {
    if (!session) return;
    const id = ++loadId.current;
    const userId = session.user.id;
    try {
      const [prayed, shared, journal, quests, bibleReads, bibleNotes] = await Promise.all([
        supabase
          .from('prayer_interactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('action', 'prayed'),
        supabase.from('prayers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('biography_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('quest_completions').select('xp').eq('user_id', userId),
        // Until these tables exist the counts come back empty, which counts as 0.
        supabase.from('bible_reads').select('book', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('bible_notes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      if (id !== loadId.current) return;
      const questXp = (quests.data ?? []).reduce((sum, r) => sum + ((r.xp as number) ?? 0), 0);
      const total = xpFromCounts({
        prayed: prayed.count ?? 0,
        shared: shared.count ?? 0,
        journal: journal.count ?? 0,
        quests: questXp,
        bibleReads: bibleReads.count ?? 0,
        bibleNotes: bibleNotes.count ?? 0,
      });
      const localPet = await loadPetId();
      const { xpByPet: byPet, activePet: active, claimed } = await loadXpByPet(localPet, total);
      if (id !== loadId.current) return;
      lastTotal = total;
      activePet = active;
      // Another device may have switched pets; follow the account.
      if (active !== localPet) await setChoice(active);
      const next = petProgressFromXp(byPet[active]);
      rememberXp(userId, byPet, claimed ?? knownXp?.claimed ?? [], total);
      const up = await consumeLevelUp(active, next.level);
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

  // Something just earned XP somewhere (a Bible chapter, a note): catch up without waiting for the next focus.
  useEffect(() => onXpRefresh(() => { reload(); }), [reload]);

  /** Switches companion. The old pet keeps the XP it earned; the new one picks up from its own level. */
  const setPetId = useCallback(
    async (next: PetId) => {
      const from = activePet ?? (await loadPetId());
      if (from === next) return;
      // Every screen shows the new pet, at its own level, straight away.
      await setChoice(next);
      if (session && lastTotal !== null) {
        activePet = next;
        const { error } = await supabase.rpc('switch_pet', { p_from: from, p_to: next, p_total: lastTotal });
        if (error) console.warn('switch_pet failed', error.message);
      }
      await reload();
    },
    [reload, session, setChoice],
  );

  return { progress, xpByPet, owned, leveledUp, reload, ...choice, setPetId };
}

/**
 * The account's own level, from everything it has ever earned across every companion. Each level asks a little more
 * than the last: level 1 → 2 takes 100 XP, 2 → 3 takes 200, and so on.
 */
export function accountLevelFromXp(xp: number) {
  const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2));
  const start = 50 * level * (level - 1);
  const need = 100 * level;
  return { xp, level, xpInLevel: Math.max(0, xp - start), xpForLevel: need };
}

/** The signed-in account's level, shared by every screen; null until the first load. */
export function useAccountLevel() {
  const { session } = useAuth();
  const snap = useSyncExternalStore(subscribe, () => knownXp);
  const total = snap && snap.userId === session?.user.id ? snap.total : undefined;
  return useMemo(() => (total === undefined ? null : accountLevelFromXp(total)), [total]);
}

/** Asks every screen showing XP to load it again, after something that earns XP (a chapter read, a note). */
export function refreshXpSoon() {
  xpRefreshers.forEach(fn => fn());
}
const xpRefreshers = new Set<() => void>();
export function onXpRefresh(fn: () => void) {
  xpRefreshers.add(fn);
  return () => {
    xpRefreshers.delete(fn);
  };
}
