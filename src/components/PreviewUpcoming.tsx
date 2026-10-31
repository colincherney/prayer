import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { FONTS, useTheme } from '@/components/saint/theme';
import { useReleases } from '@/lib/releases';

/**
 * Development builds only (Expo Go, `expo start`): a switch that shows every scheduled home scene and companion as
 * if its release date had passed. Store builds never render it, and never honor the setting.
 */
export function PreviewUpcoming() {
  const { preview, setPreview } = useReleases();
  const { theme: THEME } = useTheme();
  if (!__DEV__) return null;
  return (
    <View style={[styles.row, { borderColor: THEME.line, backgroundColor: THEME.surface }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: THEME.ink }]}>Preview upcoming</Text>
        <Text style={[styles.body, { color: THEME.muted }]}>
          Dev builds only. Shows every scheduled home scene, companion and trinket now.
        </Text>
      </View>
      <Switch value={preview} onValueChange={setPreview} trackColor={{ true: THEME.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  title: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  body: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, marginTop: 2 },
});
