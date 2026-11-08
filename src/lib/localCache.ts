// Small things saved on the phone and read into memory behind the splash screen, so screens can draw them on their
// first frame instead of starting empty and filling in. The server stays the source of truth wherever there is one.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCAL_KEYS = {
  nook: 'nook.v1',
  nookStats: 'nook.stats',
  shelfPicks: 'keepsakes.shelf.v1',
  trinkets: 'trinkets.cache.v3',
  owned: 'cosmetics.owned',
  companionsMet: 'companions.met',
  cloudPending: 'cloud.pending',
  cloudOwner: 'cloud.owner',
} as const;

type LocalKey = (typeof LOCAL_KEYS)[keyof typeof LOCAL_KEYS];

const memory = new Map<LocalKey, unknown>();

/** Reads everything into memory. Runs once, before any screen mounts. */
export async function preloadLocal(): Promise<void> {
  try {
    const rows = await AsyncStorage.multiGet(Object.values(LOCAL_KEYS));
    for (const [key, raw] of rows) {
      if (!raw) continue;
      try {
        memory.set(key as LocalKey, JSON.parse(raw));
      } catch {}
    }
  } catch {}
}

export function readLocal<T>(key: LocalKey): T | undefined {
  return memory.get(key) as T | undefined;
}

export function writeLocal(key: LocalKey, value: unknown): Promise<void> {
  memory.set(key, value);
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Saved data that belongs to one account. Before the session has loaded there's no user to check it against yet. */
export function readForUser<T>(key: LocalKey, userId?: string): T | undefined {
  const saved = readLocal<{ userId: string; data: T }>(key);
  if (!saved || (userId && saved.userId !== userId)) return undefined;
  return saved.data;
}

export function writeForUser(key: LocalKey, userId: string, data: unknown) {
  writeLocal(key, { userId, data }).catch(() => {});
}
