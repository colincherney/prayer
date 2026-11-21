// The Beloved's two looks. Her final stage comes in two forms you can switch between any time once you have it: the
// marble statue, or the Seraph, her neon spirit form. It's only a look (the database just knows stage 3), saved on the
// phone and on the account with the rest of the appearance (src/lib/cloudProgress.ts), so it follows you to a new phone.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

import { saveEntryToCloud, useCloudVersion } from '@/lib/cloudProgress';
import { supabase } from '@/lib/supabase';

export type BelovedForm = 'marble' | 'spirit';
/** Must match APPEARANCE_KEYS.belovedForm in src/lib/cloudProgress.ts. */
export const BELOVED_FORM_KEY = 'pet.form.beloved';

let form: BelovedForm = 'marble';
const listeners = new Set<() => void>();

function apply(next: BelovedForm) {
  if (form === next) return;
  form = next;
  listeners.forEach(fn => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function load() {
  try {
    apply((await AsyncStorage.getItem(BELOVED_FORM_KEY)) === 'spirit' ? 'spirit' : 'marble');
  } catch {}
}
load();

// Another account never sees this one's pick: back to marble on sign-out; the next account's own copy arrives with its
// cloud sync (useCloudVersion below reloads it).
supabase.auth.onAuthStateChange(event => {
  if (event === 'SIGNED_OUT') apply('marble');
});

/** Which look the Beloved's final stage wears. */
export function useBelovedForm(): BelovedForm {
  const cloudVersion = useCloudVersion();
  useEffect(() => {
    load();
  }, [cloudVersion]);
  return useSyncExternalStore(subscribe, () => form);
}

export function belovedForm(): BelovedForm {
  return form;
}

export function setBelovedForm(next: BelovedForm) {
  apply(next);
  AsyncStorage.setItem(BELOVED_FORM_KEY, next).catch(() => {});
  saveEntryToCloud('appearance', 'belovedForm', next);
}
