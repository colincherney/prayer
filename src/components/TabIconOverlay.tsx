import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon, PrayingIcon, UserIcon } from './saint/Icons';
import { useTheme } from './saint/theme';

export function TabIconOverlay() {
  const insets = useSafeAreaInsets();
  // Read through the hook rather than the mutable `THEME` singleton so the icons
  // recolor when the theme or prayer room changes instead of keeping whichever
  // palette happened to be active on first render.
  const { theme: THEME } = useTheme();
  // `ink` is the token guaranteed to read against the bar's background in every
  // palette; `cardDark` is near-invisible on the dark ones.
  const iconColor = THEME.ink;

  return (
    <View
      style={[
        styles.container,
        { bottom: (insets.bottom || 0) + 15 } // Position right above the tab labels
      ]}
      pointerEvents="none" // Don't block touches to the actual tabs
    >
      <View style={[styles.iconWrapper, { paddingLeft: 60 }]}>
        <HomeIcon size={22} color={iconColor} />
      </View>
      <View style={styles.iconWrapper}>
        <PrayingIcon size={22} color={iconColor} />
      </View>
      <View style={[styles.iconWrapper, { paddingRight: 58 }]}>
        <UserIcon size={22} color={iconColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
