// Saint Central — appearance mode. Prayer rooms (illustrated scenes) and
// themes (flat color palettes) are mutually exclusive on the home screen:
// picking one turns the other off so they never visually overlap.

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

import { useReleases } from '@/lib/releases';

import { EVENT_LOOKS, setLookChoice, useWinterLordActive } from './winterLord';

export type AppearanceMode = 'room' | 'theme';

const STORAGE_KEY = 'saint.appearanceMode';

// The saved mode, read behind the splash screen so a theme pick doesn't flash the room first on launch.
let savedMode: AppearanceMode | null = null;
export async function preloadAppearanceMode(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'room' || stored === 'theme') savedMode = stored;
  } catch {}
}

type AppearanceModeCtx = {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
};

const AppearanceModeContext = createContext<AppearanceModeCtx>({
  mode: 'room',
  setMode: () => {},
});

export const AppearanceModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<AppearanceMode>(() => savedMode ?? 'room');

  const cloudVersion = useCloudVersion();
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored === 'room' || stored === 'theme') {
          setModeState(stored);
        }
      })
      .catch(() => {});
    // Runs again when the account's copy arrives (a new phone), which may have a different look.
  }, [cloudVersion]);

  const { isEventOn } = useReleases();
  const setMode = useCallback((next: AppearanceMode) => {
    // Choosing a theme during an event switches its look off.
    if (next === 'theme') setLookChoice(null, EVENT_LOOKS.map(l => l.window).filter(w => isEventOn(w)));
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    saveEntryToCloud('appearance', 'mode', next);
  }, [isEventOn]);

  // An event look is a room, so it overrides a theme pick while it's on.
  const winterLord = useWinterLordActive();
  const effectiveMode: AppearanceMode = winterLord ? 'room' : mode;
  const value = useMemo<AppearanceModeCtx>(() => ({ mode: effectiveMode, setMode }), [effectiveMode, setMode]);

  return React.createElement(AppearanceModeContext.Provider, { value }, children);
};

export const useAppearanceMode = () => useContext(AppearanceModeContext);
