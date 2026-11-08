import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'right' | 'bottom' | 'left';

/**
 * A drop-in for react-native-safe-area-context's SafeAreaView that pads from the insets the app already knows at
 * launch. That one measures natively after the first frame, so screens drew under the status bar, then dropped into
 * place. Like it, the insets are added to any padding the style already has.
 */
export function SafeAreaView({
  edges = ['top', 'right', 'bottom', 'left'],
  style,
  ...props
}: ViewProps & { edges?: readonly Edge[] }) {
  const insets = useSafeAreaInsets();
  const flat = StyleSheet.flatten(style) ?? {};
  const base = (side: 'Top' | 'Right' | 'Bottom' | 'Left') => {
    const axis = side === 'Top' || side === 'Bottom' ? flat.paddingVertical : flat.paddingHorizontal;
    const value = flat[`padding${side}`] ?? axis ?? flat.padding ?? 0;
    return typeof value === 'number' ? value : 0;
  };
  const pad = {
    ...(edges.includes('top') ? { paddingTop: base('Top') + insets.top } : null),
    ...(edges.includes('right') ? { paddingRight: base('Right') + insets.right } : null),
    ...(edges.includes('bottom') ? { paddingBottom: base('Bottom') + insets.bottom } : null),
    ...(edges.includes('left') ? { paddingLeft: base('Left') + insets.left } : null),
  };
  return <View {...props} style={[style, pad]} />;
}
