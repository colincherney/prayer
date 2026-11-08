// Personal progress that used to live only on the phone (the nook, shelf picks, pet names, when you met each
// companion, celebrated level-ups, today's quests) is kept in public.user_progress too, so it follows the account to
// a new phone or a reinstall. The phone copy still loads first; the account copy wins at launch, except for changes
// the phone hasn't managed to upload yet, which go up first.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { LOCAL_KEYS, readLocal, writeLocal } from '@/lib/localCache';
import { supabase } from '@/lib/supabase';

export type CloudField = 'nook' | 'shelf_picks' | 'pet_names' | 'companions_met' | 'levels_seen' | 'quest_day' | 'appearance';
type Row = Partial<Record<CloudField, unknown>>;
export type QuestDay = { day: string; accepted: string[]; rerolls: Record<string, number> };

const FLUSH_MS = 800;
/** These keys must match the ones in src/lib/pet.ts and src/lib/quests.ts. */
const petNameKey = (id: string) => (id === 'lamb' ? 'pet.name' : `pet.name.${id}`);
const levelKey = (id: string) => `pet.lastSeenLevel.${id}`;
const acceptedKey = (day: string) => `quests.accepted.${day}`;
const rerollKey = (day: string) => `quests.rerolls.${day}`;
/** The look of the app: these keys must match theme.ts, prayerRoom.ts and appearanceMode.ts. */
const APPEARANCE_KEYS = { theme: 'saint.theme', room: 'saint.prayerRoom', mode: 'saint.appearanceMode' } as const;

/** The last copy the account had, so a merged field (names, levels) adds to it instead of replacing it. */
let known: Row = {};
let timer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------- telling screens to reload
let version = 0;
const listeners = new Set<() => void>();
function bump() {
  version += 1;
  listeners.forEach(fn => fn());
}
/** Changes when progress arrives from the account, so a screen holding its own copy can start over. */
export function useCloudVersion(): number {
  return useSyncExternalStore(
    fn => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => version,
  );
}

// ---------------------------------------------------------------- saving
function pending(): Row {
  return readLocal<Row>(LOCAL_KEYS.cloudPending) ?? {};
}

/** Saves one field to the account soon. Kept on the phone until it's uploaded, so nothing is lost offline. */
export function saveToCloud(field: CloudField, value: unknown) {
  writeLocal(LOCAL_KEYS.cloudPending, { ...pending(), [field]: value }).catch(() => {});
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    flush().catch(() => {});
  }, FLUSH_MS);
}

/** For fields keyed by pet: changes one entry and keeps the rest. */
export function saveEntryToCloud(field: 'pet_names' | 'levels_seen' | 'appearance', key: string, value: unknown) {
  const base = (pending()[field] ?? known[field] ?? {}) as Record<string, unknown>;
  saveToCloud(field, { ...base, [key]: value });
}

async function flush() {
  const changes = pending();
  if (!Object.keys(changes).length) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  const { error } = await supabase
    .from('user_progress')
    .upsert({ user_id: userId, ...changes, updated_at: new Date().toISOString() });
  if (error) return;
  known = { ...known, ...changes };
  // Only clear what was sent; a change made while uploading stays pending.
  const now = pending();
  for (const field of Object.keys(changes) as CloudField[]) {
    if (JSON.stringify(now[field]) === JSON.stringify(changes[field])) delete now[field];
  }
  await writeLocal(LOCAL_KEYS.cloudPending, now);
}

// ---------------------------------------------------------------- loading
async function localSnapshot(today: string, petIds: readonly string[]): Promise<Row> {
  const nameRows = await AsyncStorage.multiGet(petIds.map(petNameKey));
  const levelRows = await AsyncStorage.multiGet(petIds.map(levelKey));
  const [acc, rr] = await AsyncStorage.multiGet([acceptedKey(today), rerollKey(today)]);
  const looks = await AsyncStorage.multiGet(Object.values(APPEARANCE_KEYS));
  const names = Object.fromEntries(petIds.map((id, i) => [id, nameRows[i][1]]).filter(([, v]) => v));
  const levels = Object.fromEntries(petIds.map((id, i) => [id, Number(levelRows[i][1])]).filter(([, v]) => Number(v) > 0));
  const appearance = Object.fromEntries(Object.keys(APPEARANCE_KEYS).map((k, i) => [k, looks[i][1]]).filter(([, v]) => v));
  return {
    nook: readLocal(LOCAL_KEYS.nook) ?? null,
    shelf_picks: readLocal(LOCAL_KEYS.shelfPicks) ?? null,
    companions_met: readLocal(LOCAL_KEYS.companionsMet) ?? null,
    pet_names: Object.keys(names).length ? names : null,
    levels_seen: Object.keys(levels).length ? levels : null,
    quest_day: acc[1] || rr[1] ? { day: today, accepted: JSON.parse(acc[1] ?? '[]'), rerolls: JSON.parse(rr[1] ?? '{}') } : null,
    appearance: Object.keys(appearance).length ? appearance : null,
  };
}

async function applyLocally(row: Row, today: string) {
  if (row.nook) await writeLocal(LOCAL_KEYS.nook, row.nook);
  if (row.shelf_picks) await writeLocal(LOCAL_KEYS.shelfPicks, row.shelf_picks);
  if (row.companions_met) await writeLocal(LOCAL_KEYS.companionsMet, row.companions_met);
  const pairs: [string, string][] = [];
  for (const [id, name] of Object.entries((row.pet_names ?? {}) as Record<string, string>)) pairs.push([petNameKey(id), name]);
  for (const [id, level] of Object.entries((row.levels_seen ?? {}) as Record<string, number>)) pairs.push([levelKey(id), String(level)]);
  for (const [k, v] of Object.entries((row.appearance ?? {}) as Record<string, string>)) {
    const key = APPEARANCE_KEYS[k as keyof typeof APPEARANCE_KEYS];
    if (key && v) pairs.push([key, v]);
  }
  const quest = row.quest_day as QuestDay | null | undefined;
  if (quest?.day === today) {
    pairs.push([acceptedKey(today), JSON.stringify(quest.accepted)], [rerollKey(today), JSON.stringify(quest.rerolls)]);
  }
  if (pairs.length) await AsyncStorage.multiSet(pairs);
}

/**
 * At launch, once signed in: uploads anything still pending, then takes the account's copy. The first time an
 * account syncs from this phone, the phone's progress is uploaded. A different account never inherits it.
 */
export async function syncCloudProgress(userId: string, today: string, petIds: readonly string[]) {
  try {
    await flush();
    const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle();
    if (error) return;
    const owner = readLocal<string>(LOCAL_KEYS.cloudOwner);
    const fields: CloudField[] = ['nook', 'shelf_picks', 'pet_names', 'companions_met', 'levels_seen', 'quest_day', 'appearance'];
    const row = (data ?? {}) as Row;
    known = Object.fromEntries(fields.map(f => [f, row[f] ?? null]));
    const waiting = pending();
    const local = await localSnapshot(today, petIds);
    // Only what differs from the phone is applied, so an ordinary launch doesn't reload anything.
    const fromCloud: Row = {};
    for (const f of fields) {
      if (row[f] != null && waiting[f] === undefined && JSON.stringify(row[f]) !== JSON.stringify(local[f])) fromCloud[f] = row[f];
    }
    if (owner === undefined || owner === userId) {
      // This phone's progress belongs to this account: fill in whatever the account doesn't have yet.
      const missing: Row = {};
      for (const f of fields) if (row[f] == null && local[f] != null) missing[f] = local[f];
      if (Object.keys(missing).length) {
        for (const [f, v] of Object.entries(missing)) saveToCloud(f as CloudField, v);
      }
    }
    await writeLocal(LOCAL_KEYS.cloudOwner, userId);
    if (Object.keys(fromCloud).length) {
      await applyLocally(fromCloud, today);
      bump();
    }
  } catch (e) {
    console.warn('Progress sync failed', e);
  }
}
