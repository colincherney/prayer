import React from 'react';
import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { DURATION, EASE_OUT } from './motion';

/** How long a load can take before it's worth showing a spinner at all. */
const SHOW_AFTER = 250;

/**
 * The spinner for a page or section that's loading. A load that finishes quickly shows nothing (no spinner blinking on
 * and off); a slower one fades the spinner in. Only opacity changes, so it plays the same under Reduce Motion.
 * Buttons that are busy keep a plain ActivityIndicator: the tap already asked for it, so it should appear at once.
 */
export function PageLoader({
  color,
  size = 'small',
  style,
  accessibilityLabel = 'Loading',
}: {
  color: string;
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Animated.View
      style={style}
      entering={FadeIn.delay(SHOW_AFTER).duration(DURATION.quick).easing(EASE_OUT).reduceMotion(ReduceMotion.Never)}>
      <ActivityIndicator size={size} color={color} accessibilityLabel={accessibilityLabel} />
    </Animated.View>
  );
}
