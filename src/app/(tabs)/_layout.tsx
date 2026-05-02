import React from 'react';
import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { TabIconOverlay } from '@/components/TabIconOverlay';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <TabIconOverlay />
    </View>
  );
}
