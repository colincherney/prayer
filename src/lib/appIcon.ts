// 'pink' must match the key under @howincodes/expo-dynamic-app-icon's plugin
// config in app.json. Pass null/'default' to restore the primary icon defined
// by the top-level `icon` field — the v3 native module accepts null and maps
// it to setAlternateIconName(nil) on iOS / disabling all aliases on Android.
export type AppIconChoice = 'default' | 'pink';

// Loaded via require() inside try/catch because the package's top-level code
// calls requireNativeModule(...), which throws synchronously when the binary
// doesn't have the native module compiled in (i.e. before a rebuild). With an
// ES import the throw happens at module-evaluation time, before any per-call
// try/catch can run.
type DynamicAppIconModule = {
  setAppIcon: (name: string | null, isInBackground?: boolean) => Promise<string | false>;
  getAppIcon: () => Promise<string>;
};

let mod: DynamicAppIconModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('@howincodes/expo-dynamic-app-icon') as DynamicAppIconModule;
} catch {
  mod = null;
}

export const APP_ICON_NATIVE_AVAILABLE = mod !== null;

function normalize(name: string): AppIconChoice {
  return name === 'pink' ? 'pink' : 'default';
}

export async function getCurrentAppIcon(): Promise<AppIconChoice> {
  if (!mod) return 'default';
  try {
    const current = await mod.getAppIcon();
    return normalize(current);
  } catch {
    return 'default';
  }
}

export async function setAppIconChoice(choice: AppIconChoice): Promise<AppIconChoice | null> {
  if (!mod) return null;
  try {
    const result = await mod.setAppIcon(choice === 'default' ? null : choice);
    if (result === false) return null;
    return normalize(result);
  } catch (e) {
    console.warn('setAppIcon failed', e);
    return null;
  }
}
