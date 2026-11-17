import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics';
import { Platform } from 'react-native';

const ANDROID_EFFECTS = {
  press: AndroidHaptics.Virtual_Key,
  select: AndroidHaptics.Segment_Tick,
  success: AndroidHaptics.Confirm,
  error: AndroidHaptics.Reject,
} as const;

export function authHaptic(effect: keyof typeof ANDROID_EFFECTS) {
  const feedback = Platform.OS === 'android'
    ? performAndroidHapticsAsync(ANDROID_EFFECTS[effect])
    : effect === 'select'
      ? selectionAsync()
      : effect === 'press'
        ? impactAsync(ImpactFeedbackStyle.Light)
        : notificationAsync(effect === 'success' ? NotificationFeedbackType.Success : NotificationFeedbackType.Error);

  // An unavailable haptic engine should never interrupt an action.
  void feedback.catch(() => {});
}
