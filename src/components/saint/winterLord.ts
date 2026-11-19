// The Winter Lord look: while the event is on, every screen uses the Long Winter room (aurora scene with its navy,
// gold and aurora-teal palette, set in Playfair Display) by default. It's a default, not a lock: picking any other
// wallpaper or theme in Customization turns it off for that person, and picking The Long Winter turns it back on.
//
// The dates live in the database: public.content_windows, id `event:winterLord` (midnight US Eastern Dec 1, 2026
// to midnight Feb 1, 2027, i.e. through the end of January). src/lib/releases.ts has the same dates as a fallback
// for a phone that has never reached the database.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { isEventOnAtLaunch, useReleases } from '@/lib/releases';

export const WINTER_LORD_EVENT = 'event:winterLord';

const OFF_KEY = 'saint.winterLookOff';
let lookOff = false;
const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reads whether this person switched the winter look off (behind the splash screen, before fonts are picked). */
export async function preloadWinterLook(): Promise<void> {
  try {
    lookOff = (await AsyncStorage.getItem(OFF_KEY)) === '1';
  } catch {}
}

/** Called by the room, theme and mode pickers: another pick turns the winter look off; The Long Winter turns it on. */
export function setWinterLookOff(off: boolean) {
  if (lookOff === off) return;
  lookOff = off;
  listeners.forEach(fn => fn());
  AsyncStorage.setItem(OFF_KEY, off ? '1' : '0').catch(() => {});
}

/** Whether the Winter Lord look is on right now. Turns on and off live, at midnight, without a restart. */
export function useWinterLordActive(): boolean {
  const off = useSyncExternalStore(subscribe, () => lookOff);
  return useReleases().isEventOn(WINTER_LORD_EVENT) && !off;
}

/** The same, fixed for this launch. Fonts are chosen once per launch, so the font change waits for the next open. */
export function winterLordActiveAtLaunch(): boolean {
  return isEventOnAtLaunch(WINTER_LORD_EVENT) && !lookOff;
}
