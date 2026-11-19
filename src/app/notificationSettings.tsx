import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from '@/components/saint/SafeArea';

import { BackIcon } from '@/components/saint/Icons';
import {
  FONTS,
  Theme,
  useTheme,
  useThemedStyles,
} from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import {
  DEFAULT_PREFS,
  enablePushNotifications,
  loadGroupNotificationPrefs,
  loadPrefs,
  type GroupNotificationPrefs,
  type NotificationPrefs,
  updateGroupPrayerNotificationPref,
  updatePrefs,
} from '@/lib/notifications';

const REMINDER_HOURS = [6, 7, 8, 9, 12, 17, 19, 21];

const formatHour = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
};

const formatTime = (h: number, m: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, '0')} ${period}`;
};

const dateFromHM = (h: number | null, m: number | null) => {
  const d = new Date();
  d.setHours(h ?? 9, m ?? 0, 0, 0);
  return d;
};

export default function NotificationSettingsScreen() {
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);
  const [groups, setGroups] = useState<GroupNotificationPrefs[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const prefsInFlight = useRef(false);
  const groupInFlight = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!session) { setLoading(false); return; }
      let cancelled = false;
      (async () => {
        setLoading(true);
        setLoadError(false);
        try {
          const [loaded, loadedGroups] = await Promise.all([
            loadPrefs(session.user.id), loadGroupNotificationPrefs(session.user.id),
          ]);
          if (!cancelled) {
            setPrefs(loaded);
            setGroups(loadedGroups);
          }
        } catch {
          if (!cancelled) setLoadError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    // The revision lets Try again reload settings without leaving the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, revision]),
  );

  const patchPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      if (!session || prefsInFlight.current) return;
      prefsInFlight.current = true;
      setSavingPrefs(true);
      try {
        const turningOnPush = Object.values(patch).some(v => v === true);
        if (turningOnPush && !await enablePushNotifications(session.user.id)) {
          Alert.alert('Notifications are off', 'Enable notifications for Saint Central in your device settings to receive reminders.');
          return;
        }
        await updatePrefs(session.user.id, patch);
        setPrefs(previous => ({ ...previous, ...patch }));
      } catch (e) {
        console.warn('updatePrefs failed', e);
        Alert.alert('Could not save setting', 'Please try again.');
      } finally {
        prefsInFlight.current = false;
        setSavingPrefs(false);
      }
    },
    [session],
  );

  const toggleGroup = async (groupId: string, enabled: boolean) => {
    if (!session || groupInFlight.current) return;
    groupInFlight.current = true;
    setSavingGroup(groupId);
    try {
      if (enabled && !await enablePushNotifications(session.user.id)) {
        Alert.alert('Notifications are off', 'Enable notifications for Saint Central in your device settings to receive group prayers.');
        return;
      }
      await updateGroupPrayerNotificationPref(session.user.id, groupId, enabled);
      setGroups(previous => previous.map(group => group.groupId === groupId ? { ...group, enabled } : group));
    } catch {
      Alert.alert('Could not save setting', 'Please try again.');
    } finally {
      groupInFlight.current = false;
      setSavingGroup(null);
    }
  };

  const togglePref = useCallback(
    (key: keyof NotificationPrefs, value: boolean | number | null) =>
      patchPrefs({ [key]: value } as Partial<NotificationPrefs>),
    [patchPrefs],
  );

  const onTimeChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      // Android fires a single 'set' (or 'dismissed') event then closes the dialog.
      // iOS streams continuous 'set' events while the user spins the wheels.
      if (Platform.OS === 'android') setAndroidPickerOpen(false);
      if (event.type === 'dismissed' || !selected) return;
      patchPrefs({
        daily_reminder_hour: selected.getHours(),
        daily_reminder_minute: selected.getMinutes(),
      });
    },
    [patchPrefs],
  );

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtnSurface}>
            <BackIcon size={15} color={THEME.ink} />
          </Pressable>
          <Text style={styles.brandText}>
            Saint <Text style={{ fontFamily: FONTS.body }}>Central</Text>
          </Text>
          <View style={styles.brandSpacer} />
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Notification{'\n'}
              <Text style={styles.titleItalic}>settings</Text>
            </Text>
            <Text style={styles.subtitle}>
              Choose when Saint Central reaches out.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={THEME.accent} />
          </View>
        ) : loadError ? (
          <View style={{ padding: 22, gap: 12 }}>
            <Text style={styles.prefSub}>Could not load your notification settings.</Text>
            <Pressable accessibilityRole="button" onPress={() => setRevision(value => value + 1)} style={styles.androidPickerBtn}>
              <Text style={styles.prefTitle}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 22, gap: 10, marginTop: 8 }}>
            <View style={styles.prefRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.prefTitle}>Notes of encouragement</Text>
                <Text style={styles.prefSub}>
                  When someone leaves a note on a prayer you shared.
                </Text>
              </View>
              <Switch
                disabled={savingPrefs}
                accessibilityLabel="Notes of encouragement"
                value={prefs.comments_enabled}
                onValueChange={(v) => togglePref('comments_enabled', v)}
                trackColor={{ true: THEME.accent, false: THEME.line }}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.prefTitle}>People praying for you</Text>
                <Text style={styles.prefSub}>
                  A gentle update an hour or two after you share, with how many have prayed.
                </Text>
              </View>
              <Switch
                disabled={savingPrefs}
                accessibilityLabel="People praying for you"
                value={prefs.social_proof_enabled}
                onValueChange={(v) => togglePref('social_proof_enabled', v)}
                trackColor={{ true: THEME.accent, false: THEME.line }}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.prefTitle}>Daily reminder</Text>
                <Text style={styles.prefSub}>
                  A quiet nudge each day to pause and pray.
                </Text>
              </View>
              <Switch
                disabled={savingPrefs}
                accessibilityLabel="Daily reminder"
                value={prefs.daily_reminder_enabled}
                onValueChange={(v) => patchPrefs({ daily_reminder_enabled: v, daily_reminder_hour: prefs.daily_reminder_hour ?? 9, daily_reminder_minute: prefs.daily_reminder_minute ?? 0 })}
                trackColor={{ true: THEME.accent, false: THEME.line }}
              />
            </View>

            {prefs.daily_reminder_enabled ? (
              <View style={styles.hourPickerWrap}>
                <Text style={styles.prefSub}>Remind me at</Text>
                <View style={styles.hourRow}>
                  {REMINDER_HOURS.map((h) => {
                    const active =
                      prefs.daily_reminder_hour === h &&
                      (prefs.daily_reminder_minute ?? 0) === 0;
                    return (
                      <Pressable
                        key={h}
                        disabled={savingPrefs}
                        onPress={() =>
                          patchPrefs({ daily_reminder_hour: h, daily_reminder_minute: 0 })
                        }
                        style={[
                          styles.hourChip,
                          {
                            backgroundColor: active ? THEME.cardDark : THEME.surface,
                            borderColor: active ? THEME.cardDark : THEME.line,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.hourChipText,
                            { color: active ? THEME.cardDarkInk : THEME.ink },
                          ]}>
                          {formatHour(h)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.customDivider} />
                <Text style={styles.prefSub}>Or pick a custom time</Text>
                {Platform.OS === 'ios' ? (
                  <View style={styles.iosPickerWrap}>
                    <DateTimePicker
                      value={dateFromHM(prefs.daily_reminder_hour, prefs.daily_reminder_minute)}
                      mode="time"
                      display="spinner"
                      minuteInterval={1}
                      disabled={savingPrefs}
                      onChange={onTimeChange}
                      themeVariant={THEME.bg === '#000000' ? 'dark' : 'light'}
                    />
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setAndroidPickerOpen(true)}
                      disabled={savingPrefs}
                      style={[
                        styles.androidPickerBtn,
                        { backgroundColor: THEME.surface, borderColor: THEME.line },
                      ]}>
                      <Text style={[styles.androidPickerText, { color: THEME.ink }]}>
                        {formatTime(
                          prefs.daily_reminder_hour ?? 9,
                          prefs.daily_reminder_minute ?? 0,
                        )}
                      </Text>
                    </Pressable>
                    {androidPickerOpen ? (
                      <DateTimePicker
                        value={dateFromHM(prefs.daily_reminder_hour, prefs.daily_reminder_minute)}
                        mode="time"
                        display="default"
                        is24Hour={false}
                        onChange={onTimeChange}
                      />
                    ) : null}
                  </>
                )}
              </View>
            ) : null}

            <View style={styles.prefRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.prefTitle}>Reflect on your prayers</Text>
                <Text style={styles.prefSub}>A quiet nudge to revisit what you&apos;ve shared. Only sent while you have prayers posted.</Text>
              </View>
              <Switch accessibilityLabel="Reflect on your prayers" disabled={savingPrefs}
                value={prefs.reflection_reminder_enabled}
                onValueChange={value => togglePref('reflection_reminder_enabled', value)}
                trackColor={{ true: THEME.accent, false: THEME.line }} />
            </View>

            {prefs.reflection_reminder_enabled ? (
              <View style={styles.hourPickerWrap}>
                <Text style={styles.prefSub}>How often?</Text>
                <View style={styles.hourRow}>
                  {[{ days: 2, label: 'Every 2 days' }, { days: 3, label: 'Every 3 days' }, { days: 7, label: 'Weekly' }].map(({ days, label }) => {
                    const active = prefs.reflection_reminder_interval_days === days;
                    return <Pressable key={days} accessibilityRole="button" accessibilityState={{ selected: active }}
                      disabled={savingPrefs} onPress={() => patchPrefs({ reflection_reminder_interval_days: days })}
                      style={[styles.hourChip, { backgroundColor: active ? THEME.cardDark : THEME.surface, borderColor: active ? THEME.cardDark : THEME.line }]}>
                      <Text style={[styles.hourChipText, { color: active ? THEME.cardDarkInk : THEME.ink }]}>{label}</Text>
                    </Pressable>;
                  })}
                </View>
                <Text style={styles.prefSub}>Remind me at (your local time)</Text>
                <View style={styles.hourRow}>
                  {REMINDER_HOURS.map(hour => {
                    const active = prefs.reflection_reminder_hour === hour;
                    return <Pressable key={hour} accessibilityRole="button" accessibilityLabel={`Reflection reminder at ${formatHour(hour)}`}
                      accessibilityState={{ selected: active }} disabled={savingPrefs}
                      onPress={() => patchPrefs({ reflection_reminder_hour: hour })}
                      style={[styles.hourChip, { backgroundColor: active ? THEME.cardDark : THEME.surface, borderColor: active ? THEME.cardDark : THEME.line }]}>
                      <Text style={[styles.hourChipText, { color: active ? THEME.cardDarkInk : THEME.ink }]}>{formatHour(hour)}</Text>
                    </Pressable>;
                  })}
                </View>
                <Text style={styles.prefSub}>Your first reminder arrives after the interval you choose.</Text>
              </View>
            ) : null}

            <Text style={[styles.prefTitle, { marginTop: 18 }]}>Group prayers</Text>
            <Text style={styles.prefSub}>Choose which groups can notify you when someone else shares a prayer.</Text>
            {groups.length === 0 ? <Text style={styles.prefSub}>Join a group to manage its prayer notifications here.</Text> : groups.map(group => (
              <View key={group.groupId} style={styles.prefRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.prefTitle}>{group.name}</Text>
                  <Text style={styles.prefSub}>New prayers in this group</Text>
                </View>
                {savingGroup === group.groupId ? <ActivityIndicator size="small" color={THEME.accent} /> : null}
                <Switch accessibilityLabel={`New prayers in ${group.name}`} disabled={savingGroup !== null}
                  value={group.enabled} onValueChange={enabled => toggleGroup(group.groupId, enabled)}
                  trackColor={{ true: THEME.accent, false: THEME.line }} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 6,
  },
  iconBtnSurface: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  brandSpacer: { width: 38, height: 38 },

  titleRow: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.3,
    color: THEME.ink,
  },
  titleItalic: {
    fontFamily: FONTS.display,
    color: THEME.accent,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: THEME.muted,
  },

  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  prefTitle: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: THEME.ink,
  },
  prefSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
    color: THEME.muted,
    marginTop: 3,
  },
  hourPickerWrap: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    gap: 10,
  },
  hourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hourChipText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12.5,
    letterSpacing: 0.4,
  },
  customDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.line,
    marginTop: 4,
    marginBottom: 2,
  },
  iosPickerWrap: {
    alignItems: 'center',
    marginTop: -4,
  },
  androidPickerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  androidPickerText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
