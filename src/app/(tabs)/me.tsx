import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Pill, SectionLabel } from '@/components/saint/Common';
import { MeDawnHero } from '@/components/saint/DawnLandscape';
import {
  ArrowIcon,
  BellIcon,
  PrayingIcon,
  ShieldIcon,
  SparkleIcon,
} from '@/components/saint/Icons';
import {
  FONTS,
  Theme,
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

type LatestPrayer = { age: string } | null;

const SEASON_GREEN = '#8aa978';
const SEASON_GREEN_INK = '#3f5728';

// ── HeroStatCard — big serif number, sun halo, italic kicker ───────────────
const HeroStatCard: React.FC<{ value: number; sub: string }> = ({ value, sub }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={['#f0e2c9', '#efe4d0', '#ead7be']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* sun halo (top right) */}
      <Svg
        width={220}
        height={220}
        style={{ position: 'absolute', top: -60, right: -60 }}>
        <Circle cx={110} cy={110} r={110} fill="rgba(245,210,160,0.55)" />
        <Circle cx={110} cy={110} r={75} fill="rgba(245,210,160,0.35)" />
        <Circle cx={110} cy={110} r={40} fill="rgba(255,232,196,0.45)" />
      </Svg>
      {/* mountain silhouette — bottom right */}
      <Svg
        width={120}
        height={60}
        viewBox="0 0 100 50"
        style={{ position: 'absolute', right: 0, bottom: 0, opacity: 0.2 }}>
        <Path
          d="M0 42 L15 22 L28 34 L48 12 L68 28 L88 18 L100 24 L100 50 L0 50 Z"
          fill="#a08d7a"
        />
      </Svg>

      <View style={{ position: 'relative' }}>
        <Text style={styles.eyebrowTerra}>This walk · all-time</Text>
        <Text style={styles.heroNum}>{value}</Text>
        <Text style={styles.heroLabel}>
          <Text style={styles.heroLabelItalic}>prayers offered</Text> for others
        </Text>
        <Text style={styles.heroSub}>{sub}</Text>
      </View>
    </View>
  );
};

// ── MiniStatCard — half-width with accent dot ──────────────────────────────
const MiniStatCard: React.FC<{ value: number; label: string; accent: 'terra' | 'olive' }> = ({
  value,
  label,
  accent,
}) => {
  const styles = useThemedStyles(makeStyles);
  const accentBg = accent === 'terra' ? '#ecdfc4' : '#e6e0d0';
  const accentDot = accent === 'terra' ? '#c5613b' : '#9a907a';
  return (
    <View style={[styles.miniStat, { backgroundColor: accentBg }]}>
      <View style={[styles.miniDot, { backgroundColor: accentDot }]} />
      <Text style={styles.miniNum}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
};

// ── NightStatCard — starry navy mirror of dawn theme ───────────────────────
const NightStatCard: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.nightCard}>
      <LinearGradient
        colors={['#1d2a44', '#2a3a52', '#3a4868']}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* moon */}
      <View style={styles.moon}>
        <Svg width={44} height={44}>
          <Circle cx={22} cy={22} r={22} fill="#f5e3c1" />
          <Circle cx={28} cy={26} r={20} fill="#d6c19a" />
          <Circle cx={32} cy={30} r={18} fill="#b8a17a" opacity={0.55} />
        </Svg>
      </View>
      {/* stars */}
      <Svg
        width="100%"
        height={130}
        viewBox="0 0 360 130"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        {[
          [40, 26, 1.2],
          [80, 18, 0.8],
          [120, 34, 1.1],
          [180, 22, 0.9],
          [220, 48, 1.3],
          [50, 60, 0.9],
          [100, 80, 1.0],
          [160, 90, 1.2],
          [220, 96, 0.8],
          [280, 76, 1.0],
          [320, 50, 0.9],
        ].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="#fdf6e7" opacity={0.55 + (i % 3) * 0.15} />
        ))}
        <Path
          d="M 300 30 L 340 18"
          stroke="#fdf6e7"
          strokeWidth={0.8}
          opacity={0.45}
          strokeLinecap="round"
        />
      </Svg>
      {/* horizon glow */}
      <LinearGradient
        colors={['rgba(255,180,120,0)', 'rgba(255,180,120,0.18)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 36 }}
      />

      <View style={{ position: 'relative' }}>
        <Text style={[styles.heroNum, { color: '#fdf6e7' }]}>{value}</Text>
        <Text style={styles.nightLabel}>{label}</Text>
      </View>
    </View>
  );
};

// ── RightNowCard — pulsing dot + avatar stack ──────────────────────────────
const RightNowCard: React.FC = () => {
  const styles = useThemedStyles(makeStyles);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.rightNowCard}>
      <LinearGradient
        colors={['#efe4d0', '#f4ebde']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 12, height: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
          <View style={styles.pulseDot} />
        </View>
        <Text style={styles.eyebrowTerra}>Right now</Text>
      </View>
      <Text style={styles.rightNowBody}>
        <Text style={styles.rightNowItalicOlive}>Three people</Text> are praying for your{' '}
        <Text style={styles.rightNowItalicTerra}>most recent</Text> request.
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          {['#a8b88a', '#c19090', '#9a82b0'].map((c, i) => (
            <View
              key={i}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: c,
                borderWidth: 2,
                borderColor: '#efe4d0',
                marginLeft: i === 0 ? 0 : -10,
              }}
            />
          ))}
        </View>
        <Text style={styles.smallMuted}>quietly · anonymously · with you</Text>
      </View>
    </View>
  );
};

// ── JourneyEntryCard — taps into Journey Map ───────────────────────────────
const JourneyEntryCard: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.journeyCard, pressed && { opacity: 0.92 }]}>
      <LinearGradient
        colors={['#f0e5d2', '#e6d6b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* landscape illustration band */}
      <View style={{ height: 92, overflow: 'hidden' }}>
        <Svg width="100%" height={92} viewBox="0 0 360 92" preserveAspectRatio="none">
          <Rect width={360} height={92} fill="#ecdfc8" />
          <Rect width={360} height={92} fill="#e6d3b0" opacity={0.4} />
          <Circle cx={280} cy={36} r={14} fill="#e8a771" opacity={0.55} />
          <Path
            d="M0 70 L40 50 L80 62 L130 42 L180 58 L230 46 L290 60 L340 48 L360 56 L360 92 L0 92 Z"
            fill="#bda58a"
            opacity={0.6}
          />
          <Path
            d="M0 82 L60 56 L120 72 L190 52 L260 70 L320 60 L360 70 L360 92 L0 92 Z"
            fill="#7e7563"
            opacity={0.55}
          />
          <Path
            d="M30 90 C 80 80, 120 88, 170 78 S 280 68, 340 60"
            stroke="#28394f"
            strokeWidth={1.4}
            fill="none"
            strokeDasharray="2 4"
            strokeLinecap="round"
          />
          <Circle cx={340} cy={60} r={3.5} fill="#28394f" />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.journeyTitle}>
            Your <Text style={styles.titleItalic}>journey</Text>
          </Text>
          <Text style={styles.smallMuted}>6 seasons · 1,247 moments · still walking</Text>
        </View>
        <View style={styles.journeyArrow}>
          <ArrowIcon size={16} color="#fdf6e7" />
        </View>
      </View>
    </Pressable>
  );
};

// ── VerseCard — typeset scripture ──────────────────────────────────────────
const VerseCard: React.FC = () => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.verseCard}>
      <LinearGradient
        colors={['#f5ecdf', '#ecdfc4']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.verseQuote}>&ldquo;</Text>
      <View>
        <Text style={styles.eyebrowTerra}>Verse for today</Text>
        <Text style={styles.verseBody}>
          I remain confident of this: I will see the goodness of the Lord in the land of the living.
        </Text>
        <Text style={styles.verseRef}>— Psalm 27 : 13</Text>
      </View>
    </View>
  );
};

export default function MeScreen() {
  const fontsLoaded = useSaintFonts();
  const { session, isGuest, signOut } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats>({ offered: 0, shared: 0, sent: 0, received: 0 });
  const [latest, setLatest] = useState<LatestPrayer>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: 0 }}>
        {/* Dawn hero — landscape header */}
        <View style={{ position: 'relative' }}>
          <MeDawnHero height={360 + insets.top} />
          <View style={[styles.heroOverlay, { top: insets.top + 16 }]}>
            <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
              {isGuest ? 'Anonymous session' : 'Always anonymous'}
            </Pill>
            <Text style={styles.title}>
              Your <Text style={styles.titleItalic}>walk</Text>
            </Text>
            <Text style={styles.subtitle}>
              A quiet record of prayers held — yours and theirs.
            </Text>
            {/* Season badge — ties Me to Journey */}
            <View style={styles.seasonBadge}>
              <View style={[styles.seasonBadgeDot, { backgroundColor: SEASON_GREEN }]} />
              <Text style={styles.seasonBadgeText}>
                In a season of <Text style={styles.seasonBadgeItalic}>growth</Text> · day 47
              </Text>
            </View>
            {isGuest ? (
              <View style={styles.guestNotice}>
                <Text style={styles.guestNoticeText}>
                  You&apos;re signed in without an account. Signing out will mean these prayers
                  can&apos;t be reached again.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ paddingHorizontal: 22, marginTop: -40 }}>
          {loading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={THEME.accent} />
            </View>
          ) : (
            <>
              {/* HERO STAT */}
              <HeroStatCard
                value={stats.offered}
                sub="The quietest kind of work. It still counts."
              />

              {/* MINI STATS GRID */}
              <View style={styles.miniGrid}>
                <MiniStatCard value={stats.shared} label="requests you've shared" accent="terra" />
                <MiniStatCard
                  value={stats.sent}
                  label="notes of encouragement sent"
                  accent="olive"
                />
              </View>

              {/* NIGHT-SKY STAT */}
              <NightStatCard value={stats.received} label="notes received on your prayers" />

              {/* RIGHT NOW */}
              <RightNowCard />

              {/* JOURNEY ENTRY */}
              <SectionLabel>Your journey</SectionLabel>
              <JourneyEntryCard onPress={() => router.push('/journey')} />

              {/* VERSE */}
              <VerseCard />

              {/* REQUESTS */}
              <SectionLabel>Your requests</SectionLabel>
              <Pressable
                onPress={() => router.push('/myPrayers')}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                <View style={styles.ctaIcon}>
                  <PrayingIcon size={18} color={THEME.cardDarkInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>
                    {stats.shared === 0
                      ? 'No prayers yet'
                      : `${stats.shared} ${stats.shared === 1 ? 'prayer' : 'prayers'} held`}
                  </Text>
                  <Text style={styles.ctaSub}>
                    {stats.shared === 0
                      ? 'When you share one, it will be held here.'
                      : latest
                      ? `Most recent · ${latest.age} · open the calendar to revisit`
                      : 'Open to reflect on each one.'}
                  </Text>
                </View>
                <ArrowIcon size={16} color={THEME.muted} />
              </Pressable>

              {/* SETTINGS */}
              <SectionLabel>Settings</SectionLabel>
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={() => router.push('/notificationSettings')}
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                  <View style={styles.ctaIcon}>
                    <BellIcon size={18} color={THEME.cardDarkInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ctaTitle}>Notification settings</Text>
                    <Text style={styles.ctaSub}>
                      Notes, social-proof updates, and your daily reminder.
                    </Text>
                  </View>
                  <ArrowIcon size={16} color={THEME.muted} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/customization')}
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                  <View style={styles.ctaIcon}>
                    <SparkleIcon size={14} color={THEME.cardDarkInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ctaTitle}>Customization</Text>
                    <Text style={styles.ctaSub}>Theme and app icon.</Text>
                  </View>
                  <ArrowIcon size={16} color={THEME.muted} />
                </Pressable>
              </View>

              <View style={styles.signOutWrap}>
                <Pressable
                  onPress={onSignOut}
                  style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}>
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
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (THEME: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },

    heroOverlay: {
      position: 'absolute',
      left: 22,
      right: 22,
    },
    title: {
      fontFamily: FONTS.display,
      fontSize: 52,
      lineHeight: 54,
      color: THEME.ink,
      marginTop: 28,
      letterSpacing: -0.7,
    },
    titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
    subtitle: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      fontSize: 16,
      lineHeight: 22,
      color: THEME.muted,
      marginTop: 14,
      maxWidth: 320,
    },
    seasonBadge: {
      marginTop: 18,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(255,253,247,0.78)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,253,247,0.95)',
    },
    seasonBadgeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: 'rgba(255,253,247,0.85)',
    },
    seasonBadgeText: {
      fontFamily: FONTS.bodySemi,
      fontSize: 12,
      color: THEME.ink,
    },
    seasonBadgeItalic: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      color: SEASON_GREEN_INK,
    },

    guestNotice: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(255,253,247,0.7)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: THEME.line,
    },
    guestNoticeText: {
      fontFamily: FONTS.body,
      fontSize: 12.5,
      lineHeight: 18,
      color: THEME.pillInk,
    },

    eyebrowTerra: {
      fontFamily: FONTS.bodySemi,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: '#c5613b',
    },

    // HERO STAT CARD
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      padding: 24,
      borderRadius: 24,
      backgroundColor: '#efe4d0',
    },
    heroNum: {
      fontFamily: FONTS.display,
      fontSize: 92,
      lineHeight: 92,
      letterSpacing: -2.5,
      color: THEME.ink,
      marginTop: 6,
    },
    heroLabel: {
      marginTop: 8,
      fontFamily: FONTS.display,
      fontSize: 20,
      lineHeight: 24,
      color: THEME.ink,
      letterSpacing: -0.2,
    },
    heroLabelItalic: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      color: '#5e7b48',
    },
    heroSub: {
      marginTop: 14,
      maxWidth: 240,
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      fontSize: 13.5,
      lineHeight: 19,
      color: '#7d745f',
    },

    // MINI STATS
    miniGrid: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 14,
    },
    miniStat: {
      flex: 1,
      padding: 18,
      borderRadius: 22,
      position: 'relative',
      overflow: 'hidden',
    },
    miniDot: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    miniNum: {
      fontFamily: FONTS.display,
      fontSize: 46,
      lineHeight: 46,
      letterSpacing: -1.4,
      color: THEME.ink,
    },
    miniLabel: {
      marginTop: 8,
      fontFamily: FONTS.body,
      fontSize: 12.5,
      lineHeight: 17,
      color: '#7d745f',
    },

    // NIGHT CARD
    nightCard: {
      marginTop: 14,
      borderRadius: 24,
      padding: 24,
      paddingBottom: 22,
      overflow: 'hidden',
      minHeight: 140,
    },
    moon: {
      position: 'absolute',
      top: 18,
      right: 24,
      width: 44,
      height: 44,
    },
    nightLabel: {
      marginTop: 12,
      fontFamily: FONTS.body,
      fontSize: 14.5,
      lineHeight: 19,
      color: 'rgba(253,246,231,0.78)',
      maxWidth: '72%',
    },

    // RIGHT NOW
    rightNowCard: {
      marginTop: 14,
      borderRadius: 24,
      padding: 18,
      overflow: 'hidden',
      backgroundColor: '#efe4d0',
    },
    pulseRing: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#c5613b',
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#c5613b',
    },
    rightNowBody: {
      marginTop: 12,
      fontFamily: FONTS.display,
      fontSize: 17.5,
      lineHeight: 23,
      color: THEME.ink,
    },
    rightNowItalicOlive: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      color: '#5e7b48',
    },
    rightNowItalicTerra: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      color: '#c5613b',
    },
    smallMuted: {
      fontFamily: FONTS.body,
      fontSize: 12,
      lineHeight: 16,
      color: '#9a907a',
    },

    // JOURNEY CARD
    journeyCard: {
      marginTop: 14,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#f0e5d2',
    },
    journeyTitle: {
      fontFamily: FONTS.display,
      fontSize: 26,
      lineHeight: 30,
      color: THEME.ink,
      letterSpacing: -0.6,
    },
    journeyArrow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#2a3a52',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // VERSE
    verseCard: {
      marginTop: 28,
      borderRadius: 24,
      padding: 24,
      overflow: 'hidden',
    },
    verseQuote: {
      position: 'absolute',
      top: -16,
      left: 16,
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      fontSize: 120,
      lineHeight: 120,
      color: 'rgba(197,97,59,0.2)',
    },
    verseBody: {
      marginTop: 10,
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      fontSize: 21,
      lineHeight: 28,
      color: THEME.ink,
      letterSpacing: -0.1,
    },
    verseRef: {
      marginTop: 14,
      fontFamily: FONTS.bodySemi,
      fontSize: 12.5,
      letterSpacing: 0.6,
      color: '#7d745f',
    },

    // CTA rows (requests / settings)
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: THEME.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: THEME.line,
    },
    ctaIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: THEME.cardDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaTitle: {
      fontFamily: FONTS.bodySemi,
      fontSize: 14,
      color: THEME.ink,
    },
    ctaSub: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: THEME.muted,
      marginTop: 3,
      lineHeight: 16,
    },

    // SIGN OUT
    signOutWrap: { marginTop: 32, alignItems: 'center' },
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
  });
