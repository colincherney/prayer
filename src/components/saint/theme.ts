// Saint Central — design tokens. Cream is the reference default; navy and forest
// are alternates the user can pick from on the Me page.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { saveEntryToCloud, useCloudVersion } from '@/lib/cloudProgress';
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

/** Blends two 6-digit hex colors: 0 gives `from`, 1 gives `to`. */
export function mixColors(from: string, to: string, amount: number): string {
  const channel = (hex: string, index: number) => parseInt(hex.replace('#', '').substring(index * 2, index * 2 + 2), 16);
  const mixed = [0, 1, 2].map(index => Math.round(channel(from, index) + (channel(to, index) - channel(from, index)) * amount));
  return `#${mixed.map(value => value.toString(16).padStart(2, '0')).join('')}`;
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

  const cloudVersion = useCloudVersion();
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
    // Runs again when the account's copy arrives (a new phone), which may have a different look.
  }, [cloudVersion]);

  const setTheme = useCallback((next: ThemeName) => {
    Object.assign(THEME, THEMES[next]);
    setName(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    saveEntryToCloud('appearance', 'theme', next);
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

/** The whole app uses Playfair Display, upright. The names only set the weight. */
export const FONTS = {
  display: 'PlayfairDisplay_500Medium',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  body: 'PlayfairDisplay_500Medium',
  bodyMed: 'PlayfairDisplay_500Medium',
  bodySemi: 'PlayfairDisplay_600SemiBold',
  bodyBold: 'PlayfairDisplay_700Bold',
};

/** Light-themed verses for the All Hallows' Eve room's scripture tickers. */
export const HALLOWEEN_VERSES = [
  { text: 'Your word is a lamp to my feet', ref: 'Psalm 119:105' },
  { text: 'The light shines in the darkness', ref: 'John 1:5' },
  { text: 'Let your light shine', ref: 'Matthew 5:16' },
  { text: 'Even the darkness is not dark to You', ref: 'Psalm 139:12' },
  { text: 'I am the light of the world', ref: 'John 8:12' },
  { text: 'The Lord is my light and my salvation', ref: 'Psalm 27:1' },
  { text: 'Where two or three gather, there am I', ref: 'Matthew 18:20' },
];

/** Verses for the Give Thanks room: three for the top ticker, two for the middle, two for the bottom. */
export const THANKSGIVING_VERSES = [
  { text: 'Give thanks to the Lord, for He is good', ref: 'Psalm 107:1' },
  { text: 'In everything give thanks', ref: '1 Thessalonians 5:18' },
  { text: 'Enter His gates with thanksgiving', ref: 'Psalm 100:4' },
  { text: 'Every good and perfect gift is from above', ref: 'James 1:17' },
  { text: 'Come before Him with thanksgiving', ref: 'Psalm 95:2' },
  { text: 'This is the day the Lord has made', ref: 'Psalm 118:24' },
  { text: 'Where two or three gather, there am I', ref: 'Matthew 18:20' },
];

/** Verses for the God With Us room, laid out the same way. */
export const CHRISTMAS_VERSES = [
  { text: 'For unto us a child is born', ref: 'Isaiah 9:6' },
  { text: 'Glory to God in the highest', ref: 'Luke 2:14' },
  { text: 'The people in darkness have seen a great light', ref: 'Isaiah 9:2' },
  { text: 'They shall call His name Emmanuel', ref: 'Matthew 1:23' },
  { text: 'The Word became flesh', ref: 'John 1:14' },
  { text: 'Sing to the Lord a new song', ref: 'Psalm 98:1' },
  { text: 'Where two or three gather, there am I', ref: 'Matthew 18:20' },
];

export const VERSES = [
  { text: 'Pray without ceasing', ref: '1 Thessalonians 5:17' },
  { text: 'Be still, and know that I am God', ref: 'Psalm 46:10' },
  { text: 'Where two or three gather, there am I', ref: 'Matthew 18:20' },
  { text: 'Cast your cares on Him', ref: '1 Pet 5:7' },
  { text: "Bear one another's burdens", ref: 'Gal 6:2' },
];
