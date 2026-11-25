import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { authHaptic } from '@/components/saint/authHaptics';
import { FONTS } from '@/components/saint/theme';
import { useAppDisplay } from '@/components/saint/appDisplay';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const { simple } = useAppDisplay();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // A light tick each time you switch tabs (not on screens pushed over them, and not on launch).
  const segments = useSegments();
  const tab = segments[0] === '(tabs)' ? segments[1] ?? 'index' : null;
  const lastTab = useRef(tab);
  useEffect(() => {
    if (!tab) return;
    if (lastTab.current && lastTab.current !== tab) authHaptic('select');
    lastTab.current = tab;
  }, [tab]);

  return (
    <NativeTabs
      hidden={simple}
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      iconColor={{ default: '#FFFFFF', selected: '#FFFFFF' }}
      tintColor="#FFFFFF"
      labelStyle={{
        default: { color: '#FFFFFF', fontFamily: FONTS.display },
        selected: { color: '#FFFFFF', fontFamily: FONTS.display },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/tab-home.png')} renderingMode="original" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Pray">
        <NativeTabs.Trigger.Label>Pray</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/tab-pray.png')} renderingMode="original" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/tab-me.png')} renderingMode="original" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
