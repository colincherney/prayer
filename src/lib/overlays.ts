// Full-screen moments that open by themselves (the winter intro and celebrations, the "What's new" drop showcase)
// take turns: each one marks itself busy while it's up, and the others wait until nothing else is showing.

import { useSyncExternalStore } from 'react';

const busy = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: ReadonlySet<string> = new Set();

export function setOverlayBusy(name: string, on: boolean) {
  if (busy.has(name) === on) return;
  if (on) busy.add(name);
  else busy.delete(name);
  snapshot = new Set(busy);
  listeners.forEach(fn => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Whether a self-opening moment other than `self` is showing. */
export function useOtherOverlayBusy(self: string): boolean {
  const now = useSyncExternalStore(subscribe, () => snapshot);
  for (const name of now) if (name !== self) return true;
  return false;
}
