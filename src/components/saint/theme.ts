// Saint Central — design tokens. Cream is the reference default; navy and forest
// are alternates the user can pick from on the Me page.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  PrayerRoomName,
  PrayerRoomPalette,
  PRAYER_ROOM_LABELS,
  usePrayerRoom,
} from './prayerRoom';

export type Theme = {
  name: string;
  bg: string;
  bgSoft: string;
  surface: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  cardDark: string;
  cardDarkInk: string;
  accent: string;
  accentSoft: string;
  pillBg: string;
  pillInk: string;
};

const CREAM: Theme = {
  name: 'Cream',
  bg: '#F5EFE6',
  bgSoft: '#EDE5D7',
  surface: '#FBF7EF',
  ink: '#1F2A44',
  inkSoft: '#3A4663',
  muted: '#8A8470',
  line: 'rgba(31,42,68,0.10)',
  cardDark: '#3A4860',
  cardDarkInk: '#F5EFE6',
  accent: '#C8643C',
  accentSoft: '#E5B697',
  pillBg: '#EFE5D2',
  pillInk: '#A4582C',
};

const NAVY: Theme = {
  name: 'Navy',
  bg: '#0F1A33',
  bgSoft: '#172645',
  surface: '#1C2D52',
  ink: '#EAEFFA',
  inkSoft: '#BCC9E2',
  muted: '#7A88A8',
  line: 'rgba(234,239,250,0.12)',
  cardDark: '#0A1224',
  cardDarkInk: '#EAEFFA',
  accent: '#D4A574',
  accentSoft: '#9F7B54',
  pillBg: '#1C2D52',
  pillInk: '#D4A574',
};

const FOREST: Theme = {
  name: 'Forest',
  bg: '#EDF1E5',
  bgSoft: '#DCE3CF',
  surface: '#F5F8EC',
  ink: '#1F3A2E',
  inkSoft: '#3D5A4A',
  muted: '#7A8B72',
  line: 'rgba(31,58,46,0.10)',
  cardDark: '#3A584A',
  cardDarkInk: '#EDF1E5',
  accent: '#8B5A3C',
  accentSoft: '#C5A88B',
  pillBg: '#E1E7D2',
  pillInk: '#5A4030',
};

const PINK: Theme = {
  name: 'Pink',
  bg: '#FBE9EC',
  bgSoft: '#F4D6DC',
  surface: '#FEF3F5',
  ink: '#3B1F2A',
  inkSoft: '#5C3744',
  muted: '#9C7884',
  line: 'rgba(59,31,42,0.10)',
  cardDark: '#5A3340',
  cardDarkInk: '#FBE9EC',
  accent: '#C04668',
  accentSoft: '#E8A2B4',
  pillBg: '#F4D6DC',
  pillInk: '#8E2A4A',
};

export const THEMES = {
  cream: CREAM,
  navy: NAVY,
  forest: FOREST,
  pink: PINK,
} as const;

export type ThemeName = keyof typeof THEMES;
export const THEME_ORDER: ThemeName[] = ['cream', 'navy', 'forest', 'pink'];

// Lightens a solid hex colour by adding `amt` to each RGB channel.
// Used to derive a slightly elevated surface from a dark prayer-room bg.
function lightenHex(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Maps a prayer room palette to the Theme shape so every screen picks up
// the room's atmospheric bg and matching text colours automatically.
//
// 'none' → returns the base app theme unchanged (user deselected the room).
// Dark rooms (lamp/stars/jungle): surface is derived by lightening bg so the
// room's light ink stays readable on both the background AND card surfaces.
// Window Seat is the only light room; cardLight is used as surface with its
// own dark ink, keeping text readable there too.
// accent maps to cardLightPillInk (the richer, darker accent) so it stays
// legible when used as a card background with light text on top.
function prayerRoomToTheme(
  room: PrayerRoomName,
  palette: PrayerRoomPalette,
  base: Theme,
): Theme {
  if (room === 'none') return base;
  const isDark = room !== 'window';
  return {
    name: PRAYER_ROOM_LABELS[room],
    bg: palette.bg,
    bgSoft: isDark ? lightenHex(palette.bg, 8) : palette.bg,
    surface: isDark ? lightenHex(palette.bg, 22) : palette.cardLight,
    ink: palette.ink,
    inkSoft: palette.inkSoft,
    muted: palette.muted,
    line: palette.divider,
    cardDark: palette.cardDark,
    cardDarkInk: palette.cardDarkInk,
    accent: palette.cardLightPillInk,
    accentSoft: palette.accent,
    pillBg: palette.pillBg,
    pillInk: palette.pillInk,
  };
}

// `THEME` is the legacy static reference. We mutate it in place so any code that
// reads `THEME.x` at render time picks up the active theme on re-render. Module-
// level StyleSheet.create snapshots are stale once switched — those screens use
// `useThemedStyles` to recompute on theme change.
export const THEME: Theme = { ...CREAM };

const STORAGE_KEY = 'saint.theme';

type ThemeCtx = {
  name: ThemeName;
  theme: Theme;
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  name: 'cream',
  theme: CREAM,
  setTheme: () => {},
});

export const SaintThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [name, setName] = useState<ThemeName>('cream');
  const { name: roomName, palette: roomPalette } = usePrayerRoom();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored && stored in THEMES) {
          setName(stored as ThemeName);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setName(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const effectiveTheme = useMemo(
    () => prayerRoomToTheme(roomName, roomPalette, THEMES[name]),
    [name, roomName, roomPalette],
  );

  useEffect(() => {
    Object.assign(THEME, effectiveTheme);
  }, [effectiveTheme]);

  const value = useMemo<ThemeCtx>(
    () => ({ name, theme: effectiveTheme, setTheme }),
    [name, effectiveTheme, setTheme],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = () => useContext(ThemeContext);

export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}

export const FONTS = {
  display: 'PlayfairDisplay_500Medium',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  displayItalic: 'PlayfairDisplay_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const VERSES = [
  { text: 'Pray without ceasing', ref: '1 Thessalonians 5:17' },
  { text: 'Be still, and know that I am God', ref: 'Psalm 46:10' },
  { text: 'Where two or three gather, there am I', ref: 'Matthew 18:20' },
  { text: 'Cast your cares on Him', ref: '1 Pet 5:7' },
  { text: "Bear one another's burdens", ref: 'Gal 6:2' },
];
