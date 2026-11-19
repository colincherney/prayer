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

import { setWinterLookOff, useWinterLordActive } from './winterLord';

export type AppearanceMode = 'room' | 'theme';

const STORAGE_KEY = 'saint.appearanceMode';

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
  const [mode, setModeState] = useState<AppearanceMode>('room');

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

  const setMode = useCallback((next: AppearanceMode) => {
    // Choosing a theme during the Long Winter switches the winter look off.
    if (next === 'theme') setWinterLookOff(true);
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    saveEntryToCloud('appearance', 'mode', next);
  }, []);

  // The Winter Lord look is a room, so it overrides a theme pick while the event is on.
  const winterLord = useWinterLordActive();
  const effectiveMode: AppearanceMode = winterLord ? 'room' : mode;
  const value = useMemo<AppearanceModeCtx>(() => ({ mode: effectiveMode, setMode }), [effectiveMode, setMode]);

  return React.createElement(AppearanceModeContext.Provider, { value }, children);
};

export const useAppearanceMode = () => useContext(AppearanceModeContext);
