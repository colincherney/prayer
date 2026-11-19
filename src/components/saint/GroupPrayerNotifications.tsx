import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { enablePushNotifications, loadGroupPrayerNotificationPref, updateGroupPrayerNotificationPref } from '@/lib/notifications';
import { FONTS, Theme, useTheme, useThemedStyles } from './theme';

export function GroupPrayerNotifications({ userId, groupId }: { userId: string; groupId: string }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    loadGroupPrayerNotificationPref(userId, groupId).then(value => {
      if (!cancelled) setEnabled(value);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId, groupId]));

  const toggle = async (value: boolean) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (value && !await enablePushNotifications(userId)) {
        Alert.alert('Notifications are off', 'Enable notifications for Saint Central in your device settings to receive group prayers.');
        return;
      }
      await updateGroupPrayerNotificationPref(userId, groupId, value);
      setEnabled(value);
    } catch {
      Alert.alert('Could not save setting', 'Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title}>Group prayer notifications</Text>
        <Text style={styles.subtitle}>{failed ? 'Could not load this setting. Reopen the group to try again.' : 'When someone else shares a prayer in this group.'}</Text>
      </View>
      {loading || saving ? <ActivityIndicator size="small" color={theme.accent} /> : null}
      <Switch accessibilityLabel="Group prayer notifications" value={enabled} onValueChange={toggle}
        disabled={loading || saving || failed} trackColor={{ true: theme.accent, false: theme.line }} />
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 18, padding: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line, marginTop: 16 },
  title: { fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.ink },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 16, color: theme.muted, marginTop: 3 },
});
