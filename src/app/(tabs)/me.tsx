import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
  HeartIcon,
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

type Reflection = {
  id: string;
  content: string;
  age: string;
};

type MyPrayer = {
  id: string;
  text: string;
  age: string;
  prayedCount: number;
  reflections: Reflection[];
};

type Stats = {
  offered: number;
  shared: number;
  sent: number;
  received: number;
};

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
  const [myPrayers, setMyPrayers] = useState<MyPrayer[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      (async () => {
        setLoading(true);
        const userId = session.user.id;
        const [offered, shared, sent, prayersRes] = await Promise.all([
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
            .from('prayers')
            .select(
              'id, body, created_at, prayer_interactions(action), reflections(id, content, created_at)',
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        ]);
        if (cancelled) return;

        const prayers: MyPrayer[] = (prayersRes.data ?? []).map(p => {
          const rawReflections =
            (p.reflections as { id: string; content: string; created_at: string }[] | null) ?? [];
          const reflections = rawReflections
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )
            .map(r => ({
              id: r.id,
              content: r.content,
              age: relativeTime(r.created_at),
            }));
          return {
            id: p.id as string,
            text: (p.body as string) ?? '',
            age: relativeTime(p.created_at as string),
            prayedCount: ((p.prayer_interactions as { action: string }[] | null) ?? []).filter(
              i => i.action === 'prayed',
            ).length,
            reflections,
          };
        });
        const received = prayers.reduce((acc, p) => acc + p.reflections.length, 0);

        setMyPrayers(prayers);
        setStats({
          offered: offered.count ?? 0,
          shared: shared.count ?? 0,
          sent: sent.count ?? 0,
          received,
        });
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [session]),
  );

  const onSignOut = async () => {
    await signOut();
    router.replace('/auth');
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
            {myPrayers.length === 0 ? (
              <View style={{ paddingHorizontal: 22 }}>
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    You haven&apos;t shared a prayer yet. When you do, it&apos;ll be held
                    here.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 22, gap: 10 }}>
                {myPrayers.map(r => (
                  <View key={r.id} style={styles.requestCard}>
                    <View style={styles.requestTop}>
                      <Text style={[styles.requestStatus, { color: THEME.muted }]}>
                        ACTIVE · {r.age.toUpperCase()}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <PrayingIcon size={13} color={THEME.muted} />
                        <Text style={styles.countText}>{r.prayedCount}</Text>
                      </View>
                    </View>
                    <Text style={styles.requestBody}>&ldquo;{r.text}&rdquo;</Text>
                    {r.reflections.length > 0 && (
                      <View style={styles.notesBlock}>
                        <View style={styles.notesHeading}>
                          <HeartIcon size={13} color={THEME.accent} />
                          <Text style={styles.notesText}>
                            {r.reflections.length}{' '}
                            {r.reflections.length === 1 ? 'note' : 'notes'} of encouragement
                          </Text>
                        </View>
                        <View style={{ marginTop: 10, gap: 8 }}>
                          {r.reflections.map(n => (
                            <View key={n.id} style={styles.noteCard}>
                              <Text style={styles.noteContent}>&ldquo;{n.content}&rdquo;</Text>
                              <Text style={styles.noteAge}>
                                Anonymous · {n.age}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

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
  requestCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestStatus: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.2 },
  countText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  requestBody: { fontFamily: FONTS.display, fontSize: 16, lineHeight: 22, color: THEME.ink },
  notesBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  notesHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.inkSoft },
  noteCard: {
    backgroundColor: THEME.bgSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteContent: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: THEME.ink,
  },
  noteAge: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: THEME.muted,
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  emptyText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: THEME.inkSoft,
    textAlign: 'center',
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
