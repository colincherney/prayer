import { router as expoRouter } from 'expo-router';

/**
 * expo-router's `router`, with a guard against double taps. A second tap that lands before the first screen has
 * appeared would otherwise open the same page twice (and need closing twice), or a quick double tap on X would close
 * two pages. So a push or back that follows another one within GUARD_MS is ignored. Screens import `router` from
 * here instead of from 'expo-router'.
 */
const GUARD_MS = 600;
let lastPush = 0;
let lastBack = 0;

function allow(kind: 'push' | 'back'): boolean {
  const now = Date.now();
  if (kind === 'push') {
    if (now - lastPush < GUARD_MS) return false;
    lastPush = now;
  } else {
    if (now - lastBack < GUARD_MS) return false;
    lastBack = now;
  }
  return true;
}

type Router = typeof expoRouter;

// A wrapper object, not a copy: expo-router rebinds its router after the first render, so every call reads it fresh.
export const router: Router = new Proxy(expoRouter, {
  get(target, prop, receiver) {
    const kind = prop === 'push' || prop === 'navigate' ? 'push' : prop === 'back' || prop === 'dismiss' ? 'back' : null;
    if (kind) {
      const fn = Reflect.get(target, prop, receiver) as (...args: unknown[]) => unknown;
      return (...args: unknown[]) => (allow(kind) ? fn(...args) : undefined);
    }
    return Reflect.get(target, prop, receiver);
  },
});
