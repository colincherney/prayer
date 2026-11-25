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

function safely(feedback: Promise<unknown>) {
  void feedback.catch(() => {});
}

/** The softest touch: a card settling, a thumb crossing a line. */
export function softHaptic() {
  safely(Platform.OS === 'android'
    ? performAndroidHapticsAsync(AndroidHaptics.Clock_Tick)
    : impactAsync(ImpactFeedbackStyle.Soft));
}

/**
 * Offering a prayer: a soft press as the finger lands, then a warm two-beat as the candle catches. It should feel like
 * something was given, not like a button was clicked.
 */
export function prayerHaptic() {
  if (Platform.OS === 'android') {
    safely(performAndroidHapticsAsync(AndroidHaptics.Confirm));
    return;
  }
  safely(impactAsync(ImpactFeedbackStyle.Soft));
  setTimeout(() => safely(notificationAsync(NotificationFeedbackType.Success)), 180);
}
