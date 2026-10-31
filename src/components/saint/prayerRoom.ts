// Prayer-room scene preference: which dawn-lit scene backs the home screen.
// Independent of the user-selected app Theme — the rooms have their own
// palettes because the scene illustrations dictate readable contrast.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useReleases } from '@/lib/releases';

import { MONTHLY_ROOM_NAMES, MONTHLY_ROOMS, MonthlyRoomName } from './monthlyRooms';

export type PrayerRoomName =
  | 'lamp'
  | 'window'
  | 'stars'
  | 'jungle'
  | 'halloween'
  | 'thanksgiving'
  | 'christmas'
  | MonthlyRoomName;

const monthly = <T,>(pick: (name: MonthlyRoomName) => T) =>
  Object.fromEntries(MONTHLY_ROOM_NAMES.map(n => [n, pick(n)])) as Record<MonthlyRoomName, T>;

export type PrayerRoomPalette = {
  bg: string;
  bgSoft: string;
  surface: string;
  ink: string;
  inkSoft: string;
  muted: string;
  divider: string;
  accent: string;
  accentSoft: string;
  pillBg: string;
  pillInk: string;
  cardDark: string;
  cardDarkInk: string;
  cardLight: string;
  cardLightInk: string;
  cardLightInkSoft: string;
  cardLightPillBg: string;
  cardLightPillInk: string;
  statusBar: 'light-content' | 'dark-content';
  /** Color of the bottom scripture ticker when the scene's foreground differs from its sky (default `muted`). */
  lowMuted?: string;
};

// Lamplit Corner — dusky navy room, cream text. Matches design variant 3.
const LAMP: PrayerRoomPalette = {
  bg: '#14182a',
  bgSoft: '#1b2138',
  surface: '#20273f',
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(244,234,213,0.55)',
  divider: 'rgba(244,234,213,0.18)',
  accent: '#f5cba2',
  accentSoft: '#caa57e',
  pillBg: 'rgba(244,234,213,0.16)',
  pillInk: '#f4ead5',
  cardDark: 'rgba(20,28,44,0.72)',
  cardDarkInk: '#f4ead5',
  cardLight: 'rgba(244,234,213,0.86)',
  cardLightInk: '#1f2a3a',
  cardLightInkSoft: 'rgba(31,42,58,0.7)',
  cardLightPillBg: 'rgba(194,90,54,0.14)',
  cardLightPillInk: '#c25a36',
  statusBar: 'light-content',
};

// Window Seat — cream wall, dark ink. Matches design variant 2.
const WINDOW: PrayerRoomPalette = {
  bg: '#e8d8be',
  bgSoft: '#ddc7a8',
  surface: '#f3e6cc',
  ink: '#1f2a3a',
  inkSoft: 'rgba(31,42,58,0.85)',
  muted: 'rgba(31,42,58,0.55)',
  divider: 'rgba(31,42,58,0.22)',
  accent: '#c25a36',
  accentSoft: '#dba087',
  pillBg: 'rgba(31,42,58,0.10)',
  pillInk: '#27384e',
  // Cards keep their dark/light duality so the two CTAs stay distinct.
  cardDark: 'rgba(31,42,58,0.82)',
  cardDarkInk: '#f4ead5',
  cardLight: 'rgba(255,247,232,0.92)',
  cardLightInk: '#1f2a3a',
  cardLightInkSoft: 'rgba(31,42,58,0.7)',
  cardLightPillBg: 'rgba(194,90,54,0.14)',
  cardLightPillInk: '#c25a36',
  statusBar: 'dark-content',
};

// Starlit Garden — outside under a deep-indigo sky, dawn cracking the horizon,
// distant lit chapel, lampposts on a path. Matches design variant 6.
const STARS: PrayerRoomPalette = {
  bg: '#0a0e22',
  bgSoft: '#10142c',
  surface: '#161b38',
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(244,234,213,0.55)',
  divider: 'rgba(244,234,213,0.18)',
  accent: '#fde2a8',
  accentSoft: '#cdb47f',
  pillBg: 'rgba(244,234,213,0.14)',
  pillInk: '#f4ead5',
  cardDark: 'rgba(10,14,34,0.75)',
  cardDarkInk: '#f4ead5',
  cardLight: 'rgba(244,234,213,0.9)',
  cardLightInk: '#1f2a3a',
  cardLightInkSoft: 'rgba(31,42,58,0.7)',
  cardLightPillBg: 'rgba(253,226,168,0.22)',
  cardLightPillInk: '#a86d2e',
  statusBar: 'light-content',
};

// Rainforest Vigil — deep teal-emerald sky with stars, fog mountains, fireflies.
// Matches design variant 7.
const JUNGLE: PrayerRoomPalette = {
  bg: '#08111c',
  bgSoft: '#0d1c28',
  surface: '#122433',
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(166,222,196,0.55)',
  divider: 'rgba(166,222,196,0.22)',
  accent: '#7ec9a8',
  accentSoft: '#4f8f72',
  pillBg: 'rgba(166,222,196,0.14)',
  pillInk: '#dff3e6',
  cardDark: 'rgba(8,17,28,0.78)',
  cardDarkInk: '#dff3e6',
  cardLight: 'rgba(223,243,230,0.92)',
  cardLightInk: '#0e2230',
  cardLightInkSoft: 'rgba(14,34,48,0.72)',
  cardLightPillBg: 'rgba(126,201,168,0.18)',
  cardLightPillInk: '#1d5448',
  statusBar: 'light-content',
};

// All Hallows' Eve — a moonlit autumn hillside: deep plum sky, pumpkin-orange accent, cream text.
// Matches the "Home · Halloween" design.
const HALLOWEEN: PrayerRoomPalette = {
  bg: '#140f2a',
  bgSoft: '#1d1538',
  surface: '#251a40',
  ink: '#f2e9d8',
  inkSoft: 'rgba(242,233,216,0.82)',
  muted: 'rgba(242,233,216,0.55)',
  divider: 'rgba(242,233,216,0.18)',
  accent: '#e8913a',
  accentSoft: '#b8702c',
  pillBg: 'rgba(255,255,255,0.1)',
  pillInk: '#f2e9d8',
  cardDark: 'rgba(22,14,34,0.9)',
  cardDarkInk: '#f2e9d8',
  cardLight: 'rgba(246,234,214,0.95)',
  cardLightInk: '#1f2633',
  cardLightInkSoft: '#4a4f5a',
  cardLightPillBg: '#f0cfae',
  cardLightPillInk: '#b5562e',
  statusBar: 'light-content',
};

// Give Thanks — a golden harvest evening: cream sky, dark ink, harvest-orange accent; the fields below are dark, so
// the bottom ticker is light. Matches the "Home · Thanksgiving" design.
const THANKSGIVING: PrayerRoomPalette = {
  bg: '#F3DDB2',
  bgSoft: '#EEC08E',
  surface: '#FAF0E0',
  ink: '#1F2633',
  inkSoft: 'rgba(31,38,51,0.85)',
  muted: 'rgba(31,38,51,0.55)',
  divider: 'rgba(31,38,51,0.14)',
  accent: '#B5562E',
  accentSoft: '#C8643C',
  pillBg: 'rgba(31,38,51,0.08)',
  pillInk: '#1F2633',
  cardDark: 'rgba(43,40,46,0.92)',
  cardDarkInk: '#F2E9D8',
  cardLight: 'rgba(250,240,224,0.96)',
  cardLightInk: '#1F2633',
  cardLightInkSoft: '#4A4F5A',
  cardLightPillBg: '#F0CFAE',
  cardLightPillInk: '#B5562E',
  statusBar: 'dark-content',
  lowMuted: 'rgba(246,230,206,0.7)',
};

// God With Us — a snowy Christmas night: deep navy sky, star-gold accent, cream text. Matches "Home · Christmas".
const CHRISTMAS: PrayerRoomPalette = {
  bg: '#0B1530',
  bgSoft: '#18284A',
  surface: '#1C2B4C',
  ink: '#F2E9D8',
  inkSoft: 'rgba(242,233,216,0.82)',
  muted: 'rgba(242,233,216,0.55)',
  divider: 'rgba(242,233,216,0.18)',
  accent: '#F2C462',
  accentSoft: '#C9A24B',
  pillBg: 'rgba(255,255,255,0.1)',
  pillInk: '#F2E9D8',
  cardDark: 'rgba(12,22,44,0.92)',
  cardDarkInk: '#F2E9D8',
  cardLight: 'rgba(246,243,236,0.96)',
  cardLightInk: '#1F2633',
  cardLightInkSoft: '#4A4F5A',
  cardLightPillBg: 'rgba(201,67,58,0.14)',
  cardLightPillInk: '#C9433A',
  statusBar: 'light-content',
  // the snowy foreground is pale, so the bottom ticker goes dark
  lowMuted: 'rgba(31,38,51,0.55)',
};

export const PRAYER_ROOMS: Record<PrayerRoomName, PrayerRoomPalette> = {
  lamp: LAMP,
  window: WINDOW,
  stars: STARS,
  jungle: JUNGLE,
  halloween: HALLOWEEN,
  thanksgiving: THANKSGIVING,
  christmas: CHRISTMAS,
  ...monthly(n => MONTHLY_ROOMS[n].palette),
};

export const PRAYER_ROOM_ORDER: PrayerRoomName[] = [
  'lamp',
  'window',
  'stars',
  'jungle',
  'halloween',
  'thanksgiving',
  'christmas',
  ...MONTHLY_ROOM_NAMES,
];

export const PRAYER_ROOM_LABELS: Record<PrayerRoomName, string> = {
  lamp: 'Lamplit Corner',
  window: 'Window Seat',
  stars: 'Starlit Garden',
  jungle: 'Rainforest Vigil',
  halloween: "All Hallows' Eve",
  thanksgiving: 'Give Thanks',
  christmas: 'God With Us',
  ...monthly(n => MONTHLY_ROOMS[n].label),
};

/** Rooms that unlock on a date (database id `room:<name>`), oldest first; see src/lib/releases.ts. */
const SCHEDULED_ROOMS: PrayerRoomName[] = ['thanksgiving', 'christmas', ...MONTHLY_ROOM_NAMES];

/** The rooms that can be picked right now: everything except seasonal rooms whose date hasn't come. */
export function useAvailableRooms(): PrayerRoomName[] {
  const { isReleased } = useReleases();
  return PRAYER_ROOM_ORDER.filter(r => !SCHEDULED_ROOMS.includes(r) || isReleased(`room:${r}`));
}

const STORAGE_KEY = 'saint.prayerRoom';

/**
 * The room everyone sees until they pick one themselves: the newest seasonal room that is out, so the home screen
 * turns to Thanksgiving and then Christmas on their dates. It never overrides a choice: a room is saved only when
 * the person picks it.
 */
const SEASONAL_FALLBACK: PrayerRoomName = 'halloween';

function useSeasonalDefault(): PrayerRoomName {
  const { isReleased } = useReleases();
  const newest = [...SCHEDULED_ROOMS].reverse().find(r => isReleased(`room:${r}`));
  return newest ?? SEASONAL_FALLBACK;
}

type PrayerRoomCtx = {
  name: PrayerRoomName;
  palette: PrayerRoomPalette;
  setRoom: (name: PrayerRoomName) => void;
};

const PrayerRoomContext = createContext<PrayerRoomCtx>({
  name: SEASONAL_FALLBACK,
  palette: PRAYER_ROOMS[SEASONAL_FALLBACK],
  setRoom: () => {},
});

export const PrayerRoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const seasonal = useSeasonalDefault();
  const available = useAvailableRooms();
  // The room the person picked, if any; until then the seasonal default shows.
  const [chosen, setChosen] = useState<PrayerRoomName | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored && stored in PRAYER_ROOMS) {
          setChosen(stored as PrayerRoomName);
        }
      })
      .catch(() => {});
  }, []);

  const setRoom = useCallback((next: PrayerRoomName) => {
    setChosen(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  // A room that isn't out (e.g. picked while previewing) falls back to the seasonal default.
  const name = chosen && available.includes(chosen) ? chosen : seasonal;

  const value = useMemo<PrayerRoomCtx>(
    () => ({ name, palette: PRAYER_ROOMS[name], setRoom }),
    [name, setRoom],
  );

  return React.createElement(PrayerRoomContext.Provider, { value }, children);
};

export const usePrayerRoom = () => useContext(PrayerRoomContext);
