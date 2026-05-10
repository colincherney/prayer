// 'pink' must match the key under expo-dynamic-app-icon's plugin config in
// app.json. The 'DEFAULT' sentinel restores the primary icon defined by the
// top-level `icon` field — the native module maps it to setAlternateIconName(nil).
export type AppIconChoice = 'default' | 'pink';

// Loaded via require() inside try/catch because the package's top-level code
// calls requireNativeModule('ExpoDynamicAppIcon'), which throws synchronously
// when the binary doesn't have the native module compiled in (i.e. before a
// rebuild). With an ES import the throw happens at module-evaluation time,
// before any per-call try/catch can run.
type DynamicAppIconModule = {
  setAppIcon: (name: string | null) => Promise<unknown>;
  getAppIcon: () => string;
};

let mod: DynamicAppIconModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('expo-dynamic-app-icon') as DynamicAppIconModule;
} catch {
  mod = null;
}

export const APP_ICON_NATIVE_AVAILABLE = mod !== null;

export function getCurrentAppIcon(): AppIconChoice {
  if (!mod) return 'default';
  try {
    const current = mod.getAppIcon();
    return current === 'pink' ? 'pink' : 'default';
  } catch {
    return 'default';
  }
}

export async function setAppIconChoice(choice: AppIconChoice): Promise<AppIconChoice | null> {
  // Why: expo-dynamic-app-icon@1.2.0's null-handling on iOS is unreliable when
  // resetting from an alternate icon — the bridge sometimes drops the call.
  // Passing the literal "DEFAULT" string takes a path the native module always
  // honors, then we re-read getAppIcon() to return the truth (not the request).
  if (!mod) return null;
  try {
    const target = choice === 'default' ? 'DEFAULT' : choice;
    await mod.setAppIcon(target);
  } catch (e) {
    console.warn('setAppIcon failed', e);
    return null;
  }
  return getCurrentAppIcon();
}
