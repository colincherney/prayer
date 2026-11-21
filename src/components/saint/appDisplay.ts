import { createContext, createElement, useContext, useState, type ReactNode } from 'react';

import { LOCAL_KEYS, readLocal, writeLocal } from '@/lib/localCache';

type SimpleColor = 'light' | 'dark';
type AppDisplay = { simple: boolean; simpleColor: SimpleColor };

function readDisplay(): AppDisplay {
  const saved = readLocal<Partial<AppDisplay>>(LOCAL_KEYS.appDisplay);
  return {
    simple: saved?.simple === true,
    simpleColor: saved?.simpleColor === 'dark' ? 'dark' : 'light',
  };
}

const AppDisplayContext = createContext<AppDisplay & { updateDisplay: (change: Partial<AppDisplay>) => void }>({
  simple: false,
  simpleColor: 'light',
  updateDisplay: () => {},
});

export function AppDisplayProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState(readDisplay);

  function updateDisplay(change: Partial<AppDisplay>) {
    const next = { ...readDisplay(), ...change };
    setDisplay(next);
    writeLocal(LOCAL_KEYS.appDisplay, next).catch(() => {});
  }

  return createElement(AppDisplayContext.Provider, { value: { ...display, updateDisplay } }, children);
}

export const useAppDisplay = () => useContext(AppDisplayContext);
