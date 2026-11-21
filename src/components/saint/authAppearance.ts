import { createContext, useContext } from 'react';

import { useTheme, type Theme } from './theme';

export const AUTH_SCENE_THEME: Theme = {
  name: 'Chapel at dusk',
  isDark: true,
  bg: '#0B1220',
  bgSoft: '#141E30',
  surface: '#1B263A',
  ink: '#F9F0E3',
  inkSoft: '#BABFCC',
  muted: '#8B95AA',
  line: '#E7C59830',
  cardDark: '#0E1626',
  cardDarkInk: '#F9F0E3',
  accent: '#F0CB91',
  accentInk: '#302015',
  accentSoft: '#AF8C61',
  pillBg: '#242737',
  pillInk: '#F0CB91',
};

export const AuthAppearance = createContext<Theme | null>(null);

/** Whether the screen is the full-bleed sign-in scene (the welcome, log in, sign up and recovery screens). */
export const AuthImmersive = createContext(false);

export function useAuthTheme() {
  const authTheme = useContext(AuthAppearance);
  const { theme } = useTheme();
  return authTheme ?? theme;
}
