import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      iconColor={{ default: '#FFFFFF', selected: '#FFFFFF' }}
      tintColor="#FFFFFF"
      labelStyle={{ default: { color: '#FFFFFF' }, selected: { color: '#FFFFFF' } }}>
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
