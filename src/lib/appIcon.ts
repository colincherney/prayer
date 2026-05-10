// 'pink' must match the key under expo-dynamic-app-icon's plugin config in
// app.json. Pass null/'default' to restore the primary icon defined by the
// top-level `icon` field.
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

export async function setAppIconChoice(choice: AppIconChoice): Promise<boolean> {
  if (!mod) return false;
  try {
    await mod.setAppIcon(choice === 'default' ? null : choice);
    return true;
  } catch (e) {
    console.warn('setAppIcon failed', e);
    return false;
  }
}
