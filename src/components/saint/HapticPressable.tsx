import React from 'react';
import { type GestureResponderEvent, Pressable as RNPressable, type PressableProps } from 'react-native';

import { authHaptic } from './authHaptics';

type Props = PressableProps & {
  /** The tap you feel: a light tick by default, a firmer press for a main action, or none. */
  haptic?: 'select' | 'press' | 'success' | null;
};

/**
 * React Native's Pressable with a light tick of haptics on every tap, so the whole app answers your finger. Drop-in:
 * screens import it as `Pressable`. Only a real press is felt: disabled buttons and ones with no onPress stay quiet.
 */
export const Pressable = React.forwardRef<React.ComponentRef<typeof RNPressable>, Props>(function HapticPressable({ haptic = 'select', onPress, ...rest }, ref) {
  return (
    <RNPressable
      ref={ref}
      {...rest}
      onPress={
        onPress
          ? (e: GestureResponderEvent) => {
              if (haptic) authHaptic(haptic);
              onPress(e);
            }
          : undefined
      }
    />
  );
});
