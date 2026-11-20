// Event looks: while an event's look window is open, every screen uses that event's room (the Long Winter's aurora,
// the Beloved's rose garden, the Swamp King's fen) by default, set in Playfair Display. It's a default, not a lock:
// picking any other wallpaper or theme in Customization turns that look off for the person, and picking the event's
// room turns it back on.
//
// The dates live in the database (public.content_windows): `event:winterLord` (midnight US Eastern Dec 1, 2026 to
// Feb 1, 2027), `event:beloved` (Feb 1 to Mar 1, 2027) and `event:swampKing` (Mar 1 to May 2, 2027). src/lib/releases.ts has the same dates as a fallback for a
// phone that has never reached the database.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { isEventOnAtLaunch, useReleases } from '@/lib/releases';

export const WINTER_LORD_EVENT = 'event:winterLord';
export const BELOVED_EVENT = 'event:beloved';
export const SWAMP_KING_EVENT = 'event:swampKing';

/** Each event's look: its content window and its room (see prayerRoom.ts). */
export const EVENT_LOOKS = [
  { window: WINTER_LORD_EVENT, room: 'winter' },
  { window: BELOVED_EVENT, room: 'beloved' },
  { window: SWAMP_KING_EVENT, room: 'swamp' },
] as const;
export type EventLookRoom = (typeof EVENT_LOOKS)[number]['room'];

// The Long Winter kept its original switch-off key.
const offKey = (window: string) => (window === WINTER_LORD_EVENT ? 'saint.winterLookOff' : `saint.lookOff.${window}`);
const off = new Map<string, boolean>(EVENT_LOOKS.map(l => [l.window, false]));
let version = 0;
const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reads whether this person switched each look off (behind the splash screen, before fonts are picked). */
export async function preloadWinterLook(): Promise<void> {
  try {
    const values = await Promise.all(EVENT_LOOKS.map(l => AsyncStorage.getItem(offKey(l.window))));
    EVENT_LOOKS.forEach((l, i) => off.set(l.window, values[i] === '1'));
    version += 1;
  } catch {}
}

function setLookOff(window: string, value: boolean) {
  if (off.get(window) === value) return;
  off.set(window, value);
  version += 1;
  listeners.forEach(fn => fn());
  AsyncStorage.setItem(offKey(window), value ? '1' : '0').catch(() => {});
}

/**
 * Called when someone picks a room (or a theme, with `room` null). Only the looks whose windows are open now are
 * affected: picking that event's room keeps its look on, anything else turns it off.
 */
export function setLookChoice(room: string | null, openWindows: string[]) {
  for (const look of EVENT_LOOKS) {
    if (openWindows.includes(look.window)) setLookOff(look.window, room !== look.room);
  }
}

/** The room of the look that's on right now (window open and not switched off), or null. Turns over live at midnight. */
export function useEventLookRoom(): EventLookRoom | null {
  useSyncExternalStore(subscribe, () => version);
  const { isEventOn } = useReleases();
  return EVENT_LOOKS.find(l => isEventOn(l.window) && !off.get(l.window))?.room ?? null;
}

/** Whether any event look is on right now. */
export function useWinterLordActive(): boolean {
  return useEventLookRoom() !== null;
}

/** Whether one is on at launch. Fonts are chosen once per launch, so the font change waits for the next open. */
export function winterLordActiveAtLaunch(): boolean {
  return EVENT_LOOKS.some(l => isEventOnAtLaunch(l.window) && !off.get(l.window));
}
