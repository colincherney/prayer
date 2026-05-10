import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
  loadPrefs,
  type NotificationPrefs,
  registerForPushNotifications,
  savePushToken,
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

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      (async () => {
        setLoading(true);
        const loaded = await loadPrefs(session.user.id);
        if (!cancelled) {
          setPrefs(loaded);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [session]),
  );

  const patchPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      if (!session) return;
      const previous = prefs;
      const next = { ...prefs, ...patch } as NotificationPrefs;
      setPrefs(next);

      const turningOnPush = Object.entries(patch).some(
        ([, v]) => typeof v === 'boolean' && v === true,
      );
      if (turningOnPush) {
        const token = await registerForPushNotifications();
        if (!token) {
          Alert.alert(
            'Notifications are off',
            'Enable notifications for Saint Central in your device settings to receive reminders.',
          );
          const reverted: Partial<NotificationPrefs> = {};
          for (const [k, v] of Object.entries(patch)) {
            if (typeof v === 'boolean' && v === true) {
              reverted[k as keyof NotificationPrefs] = false as never;
            }
          }
          setPrefs((p) => ({ ...p, ...reverted }));
          return;
        }
        await savePushToken(session.user.id, token);
      }

      try {
        await updatePrefs(session.user.id, patch);
      } catch (e) {
        console.warn('updatePrefs failed', e);
        setPrefs(previous);
      }
    },
    [prefs, session],
  );

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
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
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
                value={prefs.daily_reminder_enabled}
                onValueChange={(v) => togglePref('daily_reminder_enabled', v)}
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
                      onChange={onTimeChange}
                      themeVariant={THEME.bg === '#000000' ? 'dark' : 'light'}
                    />
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setAndroidPickerOpen(true)}
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
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
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
