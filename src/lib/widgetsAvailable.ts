import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

/**
 * Whether this build has the widgets native code. Expo Go doesn't, so the widget modules are never loaded there:
 * importing them would throw "Cannot find native module 'ExpoWidgets'" on load.
 */
export const widgetsAvailable = Platform.OS === 'ios' && requireOptionalNativeModule('ExpoWidgets') != null;
