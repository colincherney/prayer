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

export type PrayerRoomName = 'lamp' | 'window' | 'stars' | 'jungle';

export type PrayerRoomPalette = {
  bg: string;
  ink: string;
  inkSoft: string;
  muted: string;
  divider: string;
  accent: string;
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
};

// Lamplit Corner — dusky navy room, cream text. Matches design variant 3.
const LAMP: PrayerRoomPalette = {
  bg: '#14182a',
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(244,234,213,0.55)',
  divider: 'rgba(244,234,213,0.18)',
  accent: '#f5cba2',
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
  ink: '#1f2a3a',
  inkSoft: 'rgba(31,42,58,0.85)',
  muted: 'rgba(31,42,58,0.55)',
  divider: 'rgba(31,42,58,0.22)',
  accent: '#c25a36',
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
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(244,234,213,0.55)',
  divider: 'rgba(244,234,213,0.18)',
  accent: '#fde2a8',
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
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(166,222,196,0.55)',
  divider: 'rgba(166,222,196,0.22)',
  accent: '#7ec9a8',
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

export const PRAYER_ROOMS: Record<PrayerRoomName, PrayerRoomPalette> = {
  lamp: LAMP,
  window: WINDOW,
  stars: STARS,
  jungle: JUNGLE,
};

export const PRAYER_ROOM_ORDER: PrayerRoomName[] = ['lamp', 'window', 'stars', 'jungle'];

export const PRAYER_ROOM_LABELS: Record<PrayerRoomName, string> = {
  lamp: 'Lamplit Corner',
  window: 'Window Seat',
  stars: 'Starlit Garden',
  jungle: 'Rainforest Vigil',
};

const STORAGE_KEY = 'saint.prayerRoom';

type PrayerRoomCtx = {
  name: PrayerRoomName;
  palette: PrayerRoomPalette;
  setRoom: (name: PrayerRoomName) => void;
};

const PrayerRoomContext = createContext<PrayerRoomCtx>({
  name: 'lamp',
  palette: LAMP,
  setRoom: () => {},
});

export const PrayerRoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [name, setName] = useState<PrayerRoomName>('lamp');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored && stored in PRAYER_ROOMS) {
          setName(stored as PrayerRoomName);
        }
      })
      .catch(() => {});
  }, []);

  const setRoom = useCallback((next: PrayerRoomName) => {
    setName(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<PrayerRoomCtx>(
    () => ({ name, palette: PRAYER_ROOMS[name], setRoom }),
    [name, setRoom],
  );

  return React.createElement(PrayerRoomContext.Provider, { value }, children);
};

export const usePrayerRoom = () => useContext(PrayerRoomContext);
