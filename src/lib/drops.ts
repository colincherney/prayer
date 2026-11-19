// "What's new": the companions, home wallpapers, nook scenes, keepsakes and nook decorations that have just come out
// (keepsakes and decorations drop most weeks, so there's something new nearly every week), shown once per account
// (src/components/drops/DropShowcase.tsx). Release times come from public.content_releases, the same rows that
// unlock the content, so the showcase and the unlock always agree. The Long Winter's two pieces (Snowcap and its
// wallpaper) come from the event's own start date.
//
// In dev builds, the winter screen's "pretend today is…" date also previews drops: it reads the app's built-in copy
// of the schedule, since the database won't hand out rows whose date hasn't come.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLLECTION_SCENES } from '@/components/pets/collectionData';
import { isCollectionDecor } from '@/components/pets/collectionDecor';
import { TRINKET_INFO } from '@/components/pets/trinketArt';
import { isPetId } from '@/components/pets/registry';
import { PRAYER_ROOMS } from '@/components/saint/prayerRoom';
import { RELEASE_SCHEDULE } from '@/lib/releases';
import { supabase } from '@/lib/supabase';
import { addDays, eventDayFor, realStart, WinterState } from '@/lib/winterEvent';

/** Companions, home wallpapers, nook scenes, and the weekly keepsakes ('trinket') and nook decorations ('item'). */
export type DropKind = 'pet' | 'room' | 'scene' | 'trinket' | 'item';
export type DropItem = { key: string; kind: DropKind; id: string; day: string };

/** How long after a drop it still counts as new. Anything older is quietly skipped. */
const WINDOW_DAYS = 10;
const ORDER: Record<DropKind, number> = { pet: 0, room: 1, scene: 2, trinket: 3, item: 4 };
const seenKey = (userId: string) => `drops.seen.${userId}`;

function valid(kind: string, id: string): kind is DropKind {
  if (kind === 'pet') return isPetId(id);
  if (kind === 'room') return id in PRAYER_ROOMS;
  if (kind === 'scene') return COLLECTION_SCENES.some(s => s.id === id);
  if (kind === 'trinket') return id in TRINKET_INFO;
  if (kind === 'item') return isCollectionDecor(id);
  return false;
}

/** Release times (UTC) of everything that's out, from the database; the built-in schedule if that fails or in a dev preview. */
async function releaseTimes(previewDay: string | null): Promise<[string, string][]> {
  if (!previewDay) {
    const { data, error } = await supabase.from('content_releases').select('id, release_at');
    if (!error && data) return data.map(r => [r.id as string, r.release_at as string]);
  }
  const now = Date.now();
  return Object.entries(RELEASE_SCHEDULE).filter(([, at]) => previewDay || Date.parse(at) <= now);
}

/** The drops from the last WINDOW_DAYS days (up to `today`) that this account hasn't seen yet, in showing order. */
export async function loadNewDrops(userId: string, today: string, winter: WinterState | null, previewDay: string | null): Promise<DropItem[]> {
  const from = addDays(today, -WINDOW_DAYS);
  const items: DropItem[] = [];
  for (const [key, at] of await releaseTimes(previewDay)) {
    const [kind, id] = key.split(':');
    if (!kind || !id || !valid(kind, id)) continue;
    // Drops are scheduled at midnight US Eastern, so that's the calendar their day is on.
    const day = eventDayFor(new Date(at), 'America/New_York');
    if (day <= today && day > from) items.push({ key, kind, id, day });
  }
  if (winter?.event.is_active) {
    const day = realStart(winter.event);
    if (day <= today && day > from) {
      items.push({ key: 'pet:frostLord', kind: 'pet', id: 'frostLord', day });
      items.push({ key: 'room:winter', kind: 'room', id: 'winter', day });
    }
  }
  let seen: string[] = [];
  try {
    seen = JSON.parse((await AsyncStorage.getItem(seenKey(userId))) ?? '[]') as string[];
  } catch {}
  return items
    .filter(item => !seen.includes(item.key))
    .sort((a, b) => (a.day === b.day ? ORDER[a.kind] - ORDER[b.kind] : a.day < b.day ? -1 : 1));
}

/** Records drops as shown, so they never show again for this account on this phone. */
export async function markDropsSeen(userId: string, keys: string[]): Promise<void> {
  try {
    const seen = JSON.parse((await AsyncStorage.getItem(seenKey(userId))) ?? '[]') as string[];
    const next = [...new Set([...seen, ...keys])];
    await AsyncStorage.setItem(seenKey(userId), JSON.stringify(next));
  } catch {}
}

/** Dev builds: forget what's been shown, so the showcase can be seen again. */
export async function resetDropsSeen(userId: string): Promise<void> {
  if (!__DEV__) return;
  await AsyncStorage.removeItem(seenKey(userId)).catch(() => {});
}
