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

import { useAppearanceMode } from './appearanceMode';
import {
  PRAYER_ROOM_LABELS,
  PrayerRoomName,
  PrayerRoomPalette,
  usePrayerRoom,
} from './prayerRoom';

export type Theme = {
  name: string;
  isDark: boolean;
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
  accentInk: string;
  accentSoft: string;
  pillBg: string;
  pillInk: string;
};

// Relative luminance of a 6-digit hex color, 0 (black) to 1 (white).
// Used to pick a readable ink color for content placed on top of `accent`,
// since some palettes use a light/pale accent and some use a dark/saturated one.
export function relativeLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const CREAM: Theme = {
  name: 'Cream',
  isDark: false,
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
  accentInk: '#F5EFE6',
  accentSoft: '#E5B697',
  pillBg: '#EFE5D2',
  pillInk: '#A4582C',
};

const NAVY: Theme = {
  name: 'Navy',
  isDark: true,
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
  accentInk: '#EAEFFA',
  accentSoft: '#9F7B54',
  pillBg: '#1C2D52',
  pillInk: '#D4A574',
};

const FOREST: Theme = {
  name: 'Forest',
  isDark: false,
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
  accentInk: '#EDF1E5',
  accentSoft: '#C5A88B',
  pillBg: '#E1E7D2',
  pillInk: '#5A4030',
};

const PINK: Theme = {
  name: 'Pink',
  isDark: false,
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
  accentInk: '#FBE9EC',
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored && stored in THEMES) {
          const next = stored as ThemeName;
          Object.assign(THEME, THEMES[next]);
          setName(next);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    Object.assign(THEME, THEMES[next]);
    setName(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ name, theme: THEMES[name], setTheme }),
    [name, setTheme],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
};

// Room palettes tune `muted`/`divider` opacity for text sitting over the
// illustrated scene art (with its own glow/contrast). Reused as flat solid
// page backgrounds elsewhere in the app, that same opacity reads too faint —
// so we boost it here rather than in the palette itself.
function boostAlpha(rgba: string, alpha: number): string {
  return rgba.replace(/[\d.]+\)$/, `${alpha})`);
}

// Maps a prayer-room's scene palette into the same shape as a Theme, so the
// whole app (not just the home screen) can render in room colors.
function roomToTheme(name: PrayerRoomName, p: PrayerRoomPalette): Theme {
  return {
    name: PRAYER_ROOM_LABELS[name],
    isDark: p.statusBar === 'light-content',
    bg: p.bg,
    bgSoft: p.bgSoft,
    surface: p.surface,
    ink: p.ink,
    inkSoft: p.inkSoft,
    muted: boostAlpha(p.muted, 0.78),
    line: boostAlpha(p.divider, 0.3),
    cardDark: p.cardDark,
    cardDarkInk: p.cardDarkInk,
    accent: p.accent,
    // Some rooms (Lamplit Corner, Starlit Garden) use a pale accent meant as a
    // highlight against a dark scene, not as a solid card fill — cardDarkInk
    // (also light) would blend into it. Pick whichever ink reads against it.
    accentInk: relativeLuminance(p.accent) > 0.6 ? p.cardLightInk : p.cardDarkInk,
    accentSoft: p.accentSoft,
    pillBg: p.pillBg,
    pillInk: p.pillInk,
  };
}

export const useTheme = (): { name: string; theme: Theme; setTheme: (name: ThemeName) => void } => {
  const ctx = useContext(ThemeContext);
  const { mode } = useAppearanceMode();
  const { name: roomName, palette } = usePrayerRoom();

  const effectiveName = mode === 'room' ? roomName : ctx.name;
  const effectiveTheme = mode === 'room' ? roomToTheme(roomName, palette) : ctx.theme;

  // Keep the legacy mutable singleton in sync so components that read THEME
  // directly (rather than via this hook) still match the active room/theme.
  Object.assign(THEME, effectiveTheme);

  return useMemo(
    () => ({ name: effectiveName, theme: effectiveTheme, setTheme: ctx.setTheme }),
    [effectiveName, effectiveTheme, ctx.setTheme],
  );
};

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
