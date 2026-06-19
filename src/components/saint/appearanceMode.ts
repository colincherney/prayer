// Saint Central — appearance mode. Prayer rooms (illustrated scenes) and
// themes (flat color palettes) are mutually exclusive on the home screen:
// picking one turns the other off so they never visually overlap.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored === 'room' || stored === 'theme') {
          setModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<AppearanceModeCtx>(() => ({ mode, setMode }), [mode, setMode]);

  return React.createElement(AppearanceModeContext.Provider, { value }, children);
};

export const useAppearanceMode = () => useContext(AppearanceModeContext);
