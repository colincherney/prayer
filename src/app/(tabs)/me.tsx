import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
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
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { relativeTime } from '@/lib/time';

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

export default function MeScreen() {
  const fontsLoaded = useSaintFonts();
  const { session, isGuest, signOut } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [stats, setStats] = useState<Stats>({ offered: 0, shared: 0, sent: 0, received: 0 });
  const [latest, setLatest] = useState<LatestPrayer>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [session]),
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

            <SectionLabel style={{ paddingHorizontal: 22 }}>Theme</SectionLabel>
            <View style={{ paddingHorizontal: 22 }}>
              <ThemePicker />
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
});
