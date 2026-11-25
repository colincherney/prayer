import { useSyncExternalStore } from 'react';

import { LOCAL_KEYS, readLocal, writeLocal } from './localCache';

/** The Bible translations the app reads from: the King James, and the Catholic Public Domain Version. */
export type BibleVersion = 'KJV' | 'CPVD';

export const BIBLE_VERSIONS: readonly { key: BibleVersion; label: string; name: string }[] = [
  { key: 'KJV', label: 'King James', name: 'King James Version' },
  { key: 'CPVD', label: 'Catholic', name: 'Catholic Public Domain Version' },
];

export const bibleVersionName = (version: BibleVersion) =>
  BIBLE_VERSIONS.find(v => v.key === version)?.name ?? 'King James Version';

const listeners = new Set<() => void>();
const saved = () => (readLocal<BibleVersion>(LOCAL_KEYS.bibleVersion) === 'CPVD' ? 'CPVD' : 'KJV');

/** The version you last picked, remembered on this phone and shared by every screen that shows scripture. */
export function useBibleVersion(): [BibleVersion, (version: BibleVersion) => void] {
  const version = useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    saved,
  );
  return [version, setBibleVersion];
}

export function setBibleVersion(version: BibleVersion) {
  if (version === saved()) return;
  writeLocal(LOCAL_KEYS.bibleVersion, version).catch(() => {});
  listeners.forEach(listener => listener());
}
