import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, SectionLabel } from '@/components/saint/Common';
import {
  ArrowIcon,
  PrayingIcon,
  ShieldIcon,
} from '@/components/saint/Icons';
import {
  FONTS,
  Theme,
  ThemeName,
  THEME_ORDER,
  THEMES,
  useTheme,
  useThemedStyles,
} from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import {
  type AppIconChoice,
  getCurrentAppIcon,
  setAppIconChoice,
} from '@/lib/appIcon';
import { useAuth } from '@/lib/auth';
import {
  DEFAULT_PREFS,
  loadPrefs,
  type NotificationPrefs,
  registerForPushNotifications,
  savePushToken,
  updatePrefs,
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { relativeTime } from '@/lib/time';

const APP_ICONS: { key: AppIconChoice; label: string; image: number }[] = [
  { key: 'default', label: 'Default', image: require('../../../assets/images/icon.png') },
  { key: 'pink', label: 'Pink', image: require('../../../assets/images/icon-pink.png') },
];

const REMINDER_HOURS = [6, 7, 8, 9, 12, 17, 19, 21];

const formatHour = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
};

type Stats = {
  offered: number;
  shared: number;
  sent: number;
  received: number;
};

type LatestPrayer = {
  age: string;
} | null;

const StatTile: React.FC<{ value: number; label: string; accent?: boolean }> = ({
  value,
  label,
  accent,
}) => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[
        styles.statTile,
        {
          backgroundColor: accent ? THEME.cardDark : THEME.surface,
          borderColor: accent ? THEME.cardDark : THEME.line,
        },
      ]}>
      <Text
        style={[
          styles.statValue,
          { color: accent ? THEME.cardDarkInk : THEME.ink },
        ]}>
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: accent ? THEME.cardDarkInk : THEME.ink, opacity: accent ? 0.78 : 0.65 },
        ]}>
        {label}
      </Text>
    </View>
  );
};

const ThemePicker: React.FC = () => {
  const { name, setTheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.themeRow}>
      {THEME_ORDER.map(key => {
        const t = THEMES[key];
        const active = key === name;
        return (
          <Pressable
            key={key}
            onPress={() => setTheme(key as ThemeName)}
            style={[
              styles.themeSwatch,
              { borderColor: active ? t.accent : t.line, backgroundColor: t.bg },
            ]}>
            <View style={[styles.themeDotMain, { backgroundColor: t.cardDark }]} />
            <View style={[styles.themeDotAccent, { backgroundColor: t.accent }]} />
            <Text style={[styles.themeName, { color: t.ink }]}>{t.name}</Text>
            {active ? <View style={[styles.themeCheck, { backgroundColor: t.accent }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const AppIconPicker: React.FC = () => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [active, setActive] = useState<AppIconChoice>('default');
  const [pending, setPending] = useState<AppIconChoice | null>(null);

  useEffect(() => {
    setActive(getCurrentAppIcon());
  }, []);

  const onSelect = useCallback(async (choice: AppIconChoice) => {
    if (pending || choice === active) return;
    setPending(choice);
    const ok = await setAppIconChoice(choice);
    setPending(null);
    if (!ok) {
      Alert.alert(
        'Couldn’t change icon',
        'Make sure the app was installed from a build that includes this version. Try reopening the app.',
      );
      return;
    }
    setActive(choice);
  }, [active, pending]);

  return (
    <View style={styles.iconRow}>
      {APP_ICONS.map(({ key, label, image }) => {
        const isActive = active === key;
        const isPending = pending === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            disabled={pending !== null}
            style={[
              styles.iconSwatch,
              {
                borderColor: isActive ? THEME.accent : THEME.line,
                backgroundColor: THEME.surface,
                opacity: pending && !isPending ? 0.5 : 1,
              },
            ]}>
            <Image source={image} style={styles.iconImage} contentFit="cover" />
            <Text style={[styles.iconLabel, { color: THEME.ink }]}>{label}</Text>
            {isActive ? <View style={[styles.iconCheck, { backgroundColor: THEME.accent }]} /> : null}
            {isPending ? (
              <View style={styles.iconPendingOverlay}>
                <ActivityIndicator size="small" color={THEME.accent} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

export default function MeScreen() {
  const fontsLoaded = useSaintFonts();
  const { session, isGuest, signOut } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [stats, setStats] = useState<Stats>({ offered: 0, shared: 0, sent: 0, received: 0 });
  const [latest, setLatest] = useState<LatestPrayer>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      (async () => {
        setLoading(true);
        const userId = session.user.id;
        const [offered, shared, sent, received, latestRow] = await Promise.all([
          supabase
            .from('prayer_interactions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', 'prayed'),
          supabase
            .from('prayers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('reflections')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('reflections')
            .select('id, prayers!inner(user_id)', { count: 'exact', head: true })
            .eq('prayers.user_id', userId),
          supabase
            .from('prayers')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (cancelled) return;

        setStats({
          offered: offered.count ?? 0,
          shared: shared.count ?? 0,
          sent: sent.count ?? 0,
          received: received.count ?? 0,
        });
        setLatest(
          latestRow.data?.created_at
            ? { age: relativeTime(latestRow.data.created_at as string) }
            : null,
        );

        const loaded = await loadPrefs(userId);
        if (!cancelled) setPrefs(loaded);

        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [session]),
  );

  const togglePref = useCallback(
    async (key: keyof NotificationPrefs, value: boolean | number | null) => {
      if (!session) return;
      const next = { ...prefs, [key]: value } as NotificationPrefs;
      setPrefs(next);

      // If enabling anything, make sure we have a token registered.
      if (typeof value === 'boolean' && value === true) {
        const token = await registerForPushNotifications();
        if (!token) {
          Alert.alert(
            'Notifications are off',
            'Enable notifications for Saint Central in your device settings to receive reminders.',
          );
          setPrefs((p) => ({ ...p, [key]: false }));
          return;
        }
        await savePushToken(session.user.id, token);
      }

      try {
        await updatePrefs(session.user.id, { [key]: value } as Partial<NotificationPrefs>);
      } catch (e) {
        console.warn('updatePrefs failed', e);
        setPrefs(prefs); // revert
      }
    },
    [prefs, session],
  );

  const [deleting, setDeleting] = useState(false);

  const onSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your account, your prayers, the notes you sent, and the prayers others sent in response. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { data, error } = await supabase.functions.invoke('delete-account');
            if (error || data?.ok === false) {
              setDeleting(false);
              Alert.alert(
                'Could not delete account',
                error?.message || data?.error || 'Please try again in a moment.',
              );
              return;
            }
            await signOut();
            setDeleting(false);
            router.replace('/auth');
          },
        },
      ],
    );
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
          <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
            {isGuest ? 'Anonymous session' : 'Always anonymous'}
          </Pill>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>walk</Text>
          </Text>
          <Text style={styles.subtitle}>A quiet record of prayers held — yours and theirs.</Text>

          {isGuest ? (
            <View style={styles.guestNotice}>
              <Text style={styles.guestNoticeText}>
                You&apos;re signed in without an account. Signing out will mean these
                prayers can&apos;t be reached again.
              </Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={THEME.accent} />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatTile value={stats.offered} label="prayers offered for others" />
              <StatTile value={stats.shared} label="requests you've shared" />
              <StatTile value={stats.sent} label="notes of encouragement sent" />
              <StatTile value={stats.received} label="notes received on your prayers" accent />
            </View>

            <SectionLabel style={{ paddingHorizontal: 22 }}>Your requests</SectionLabel>
            <View style={{ paddingHorizontal: 22 }}>
              <Pressable
                onPress={() => router.push('/myPrayers')}
                style={({ pressed }) => [
                  styles.requestsCta,
                  pressed && { opacity: 0.85 },
                ]}>
                <View style={styles.requestsCtaIcon}>
                  <PrayingIcon size={18} color={THEME.cardDarkInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestsCtaTitle}>
                    {stats.shared === 0
                      ? 'No prayers yet'
                      : `${stats.shared} ${stats.shared === 1 ? 'prayer' : 'prayers'} held`}
                  </Text>
                  <Text style={styles.requestsCtaSub}>
                    {stats.shared === 0
                      ? 'When you share one, it will be held here.'
                      : latest
                      ? `Most recent · ${latest.age} · open the calendar to revisit`
                      : 'Open to reflect on each one.'}
                  </Text>
                </View>
                <ArrowIcon size={16} color={THEME.muted} />
              </Pressable>
            </View>

            <SectionLabel style={{ paddingHorizontal: 22 }}>Notifications</SectionLabel>
            <View style={{ paddingHorizontal: 22, gap: 10 }}>
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
                      const active = prefs.daily_reminder_hour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => togglePref('daily_reminder_hour', h)}
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
                </View>
              ) : null}
            </View>

            <SectionLabel style={{ paddingHorizontal: 22 }}>Theme</SectionLabel>
            <View style={{ paddingHorizontal: 22 }}>
              <ThemePicker />
            </View>

            <SectionLabel style={{ paddingHorizontal: 22 }}>App icon</SectionLabel>
            <View style={{ paddingHorizontal: 22 }}>
              <AppIconPicker />
            </View>

            <View style={styles.signOutWrap}>
              <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
              {session?.user?.email ? (
                <Text style={styles.signOutFootnote}>Signed in as {session.user.email}</Text>
              ) : null}
              <Pressable
                onPress={onDeleteAccount}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  (pressed || deleting) && { opacity: 0.6 },
                ]}>
                {deleting ? (
                  <ActivityIndicator size="small" color={THEME.accent} />
                ) : (
                  <Text style={styles.deleteText}>Delete account</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  title: {
    fontFamily: FONTS.display,
    fontSize: 48,
    lineHeight: 50,
    color: THEME.ink,
    marginTop: 18,
    letterSpacing: -0.6,
  },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    marginTop: 8,
  },
  guestNotice: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: THEME.pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  guestNoticeText: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: THEME.pillInk,
  },
  statsGrid: {
    paddingHorizontal: 22,
    paddingTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    width: '48%',
    flexGrow: 1,
    minWidth: '48%',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  statLabel: { fontFamily: FONTS.body, fontSize: 11.5, lineHeight: 16, marginTop: 8 },

  requestsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  requestsCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsCtaTitle: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: THEME.ink,
  },
  requestsCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
    lineHeight: 16,
  },

  signOutWrap: {
    paddingHorizontal: 22,
    marginTop: 32,
    alignItems: 'center',
  },
  signOutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    backgroundColor: THEME.surface,
  },
  signOutText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    letterSpacing: 0.6,
    color: THEME.ink,
  },
  signOutFootnote: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: THEME.muted,
    marginTop: 10,
  },
  deleteBtn: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12.5,
    letterSpacing: 0.5,
    color: THEME.accent,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeSwatch: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  themeDotMain: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  themeDotAccent: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeName: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  themeCheck: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 3,
    borderRadius: 2,
  },

  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconSwatch: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  iconImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  iconLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  iconCheck: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  iconPendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
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
});
