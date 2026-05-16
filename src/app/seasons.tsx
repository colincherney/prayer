import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { SectionLabel } from '@/components/saint/Common';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

type SeasonName = 'Growth' | 'Healing' | 'Waiting' | 'Doubt' | 'Discipline' | 'Community';
type IconKind = 'leaf' | 'heart' | 'cloud' | 'sparkle' | 'hands';

type Season = {
  name: SeasonName;
  period: string;
  days: number;
  moments: number;
  note: string;
  current?: boolean;
};

const SEASON_VIBE: Record<
  SeasonName,
  { hue: string; hue2: string; ink: string; icon: IconKind }
> = {
  Growth: { hue: '#cfddb5', hue2: '#b8c995', ink: '#3f5728', icon: 'leaf' },
  Healing: { hue: '#eccfcf', hue2: '#d8a8a8', ink: '#6b2e3a', icon: 'heart' },
  Waiting: { hue: '#c8d4e2', hue2: '#a8b8d0', ink: '#2c4566', icon: 'cloud' },
  Doubt: { hue: '#ddd0b2', hue2: '#c5b48f', ink: '#5a4b30', icon: 'cloud' },
  Discipline: { hue: '#d6c4e3', hue2: '#b5a0cf', ink: '#4a3270', icon: 'sparkle' },
  Community: { hue: '#d8e2c4', hue2: '#bfd0a8', ink: '#3a5a32', icon: 'hands' },
};

const SEASONS: Season[] = [
  { name: 'Growth', period: 'April – Now', days: 47, moments: 38, current: true,
    note: 'Forgiveness, peace, returning to scripture daily.' },
  { name: 'Discipline', period: 'Feb – Mar 2025', days: 58, moments: 64,
    note: 'Daily prayer rhythm. 6am quiet before the kids wake.' },
  { name: 'Community', period: 'Nov 2024 – Jan 2025', days: 73, moments: 41,
    note: 'Small group started. New friendships, harder honesty.' },
  { name: 'Waiting', period: 'Aug – Oct 2024', days: 92, moments: 56,
    note: 'Dad’s diagnosis. Holding things you cannot fix.' },
  { name: 'Healing', period: 'Mar – Jul 2024', days: 124, moments: 78,
    note: 'Therapy. Naming old wounds for the first time.' },
  { name: 'Doubt', period: 'Dec 2023 – Feb 2024', days: 76, moments: 29,
    note: 'The hard winter. Asking honest questions.' },
];

const THEMES_WORDS: { word: string; count: number }[] = [
  { word: 'peace', count: 87 },
  { word: 'gratitude', count: 64 },
  { word: 'family', count: 52 },
  { word: 'rest', count: 41 },
  { word: 'trust', count: 38 },
  { word: 'fear', count: 22 },
];

const VibeIcon: React.FC<{ kind: IconKind; color: string; size?: number }> = ({
  kind,
  color,
  size = 20,
}) => {
  const s = size;
  if (kind === 'leaf')
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3c-3.5 0-6 2.5-6 6v6c0 3.5 2.5 6 6 6s6-2.5 6-6V9c0-3.5-2.5-6-6-6zM12 3v18"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    );
  if (kind === 'heart')
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    );
  if (kind === 'cloud')
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 0117 18H7z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    );
  if (kind === 'sparkle')
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    );
  // hands
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 13V6a1.5 1.5 0 013 0v5M12 11V4a1.5 1.5 0 013 0v8M15 12V7a1.5 1.5 0 013 0v8a5 5 0 01-5 5h-2a5 5 0 01-5-5v-3a1.5 1.5 0 013 0v1"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

const SeasonHero: React.FC<{ season: Season }> = ({ season }) => {
  const styles = useThemedStyles(makeStyles);
  const v = SEASON_VIBE[season.name];
  return (
    <View style={[styles.heroCard, { backgroundColor: v.hue }]}>
      <LinearGradient
        colors={[v.hue, '#efe4d0']}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* artwork band */}
      <View style={styles.heroArt}>
        <Svg width="100%" height={140} viewBox="0 0 400 140" preserveAspectRatio="none">
          <Rect width={400} height={140} fill={v.hue} opacity={0.85} />
          <Circle cx={320} cy={42} r={28} fill="rgba(255,253,247,0.18)" />
          <Circle cx={320} cy={42} r={22} fill="rgba(255,253,247,0.78)" />
          <Path
            d="M0 100 Q 80 70, 160 88 T 320 78 T 400 90 L400 140 L0 140 Z"
            fill={v.hue2}
            opacity={0.6}
          />
          <Path
            d="M0 115 Q 100 92, 200 108 T 400 108 L400 140 L0 140 Z"
            fill={v.hue2}
            opacity={0.85}
          />
          {/* birds */}
          <Path
            d="M50 50 q 4 -4, 8 0 q 4 -4, 8 0"
            stroke={v.ink}
            strokeWidth={1.2}
            fill="none"
            opacity={0.4}
          />
          <Path
            d="M90 38 q 4 -4, 8 0 q 4 -4, 8 0"
            stroke={v.ink}
            strokeWidth={1.2}
            fill="none"
            opacity={0.4}
          />
        </Svg>
        <View style={styles.currentlyChip}>
          <VibeIcon kind={v.icon} color={v.ink} size={12} />
          <Text style={[styles.currentlyChipText, { color: v.ink }]}>Currently</Text>
        </View>
      </View>

      <View style={styles.heroBody}>
        <Text style={styles.heroTitle}>
          Season of{' '}
          <Text style={[styles.heroTitleItalic, { color: v.ink }]}>
            {season.name.toLowerCase()}
          </Text>
        </Text>
        <Text style={styles.heroPeriod}>
          {season.period} · day {season.days}
        </Text>
        <Text style={styles.heroNote}>{season.note}</Text>

        <View style={styles.heroStatsRow}>
          <HeroStat n={String(season.moments)} label="moments" />
          <HeroStat n="14" label="prayers" />
          <HeroStat n="3" label="answered" />
          <HeroStat n="8" label="verses" />
        </View>
      </View>
    </View>
  );
};

const HeroStat: React.FC<{ n: string; label: string }> = ({ n, label }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <Text style={styles.heroStatNum}>{n}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
};

const SeasonRow: React.FC<{ s: Season }> = ({ s }) => {
  const styles = useThemedStyles(makeStyles);
  const v = SEASON_VIBE[s.name];
  return (
    <View style={styles.seasonRow}>
      <View style={[styles.seasonRowIcon, { backgroundColor: v.hue }]}>
        <VibeIcon kind={v.icon} color={v.ink} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={styles.seasonRowName}>{s.name}</Text>
          <Text style={styles.seasonRowDays}>· {s.days} days</Text>
        </View>
        <Text style={styles.seasonRowNote} numberOfLines={1}>
          {s.note}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.seasonRowMoments}>{s.moments}</Text>
        <Text style={styles.seasonRowMomentsLabel}>moments</Text>
      </View>
    </View>
  );
};

export default function SeasonsScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const current = SEASONS.find(s => s.current) || SEASONS[0];
  const past = SEASONS.filter(s => !s.current);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <BackIcon size={18} color={THEME.ink} />
          </Pressable>
          <Text style={styles.eyebrow}>Six seasons recorded</Text>
        </View>

        <View style={{ paddingHorizontal: 22 }}>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>seasons</Text>
          </Text>
          <Text style={styles.subtitle}>
            Chapters you&apos;ve walked through. Some you chose. Some chose you.
          </Text>

          <SeasonHero season={current} />

          <SectionLabel>Past seasons</SectionLabel>
          <View style={{ gap: 12 }}>
            {past.map((s, i) => (
              <SeasonRow key={i} s={s} />
            ))}
          </View>

          <SectionLabel>Time across seasons</SectionLabel>
          <View style={styles.distroCard}>
            <View style={styles.distroBar}>
              {SEASONS.map((s, i) => {
                const v = SEASON_VIBE[s.name];
                return (
                  <View
                    key={i}
                    style={{
                      flex: s.days,
                      backgroundColor: v.hue2,
                      borderRightWidth: i < SEASONS.length - 1 ? 1.5 : 0,
                      borderRightColor: '#efe4d0',
                    }}
                  />
                );
              })}
            </View>
            <View style={styles.distroLegend}>
              {SEASONS.map((s, i) => {
                const v = SEASON_VIBE[s.name];
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: v.hue2 }} />
                    <Text style={styles.distroName}>{s.name}</Text>
                    <Text style={styles.distroDays}>{s.days}d</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <SectionLabel>Recurring themes</SectionLabel>
          <View style={styles.themesCard}>
            <Text style={styles.themesSmall}>
              Words you&apos;ve returned to most across every season.
            </Text>
            <View style={styles.themesWrap}>
              {THEMES_WORDS.map((r, i) => {
                const scale = 1 + Math.min(0.9, r.count / 60);
                return (
                  <View key={i} style={styles.themePair}>
                    <Text
                      style={[
                        styles.themeWord,
                        {
                          fontSize: 16 * scale,
                          lineHeight: 16 * scale * 1.15,
                          color: i === 0 ? THEME.ink : `rgba(40,57,79,${0.95 - i * 0.1})`,
                        },
                      ]}>
                      {r.word}
                    </Text>
                    <Text style={styles.themeCount}>{r.count}</Text>
                    {i < THEMES_WORDS.length - 1 ? (
                      <Text style={styles.themeSep}>·</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    topBar: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#ece1cb',
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyebrow: {
      fontFamily: FONTS.bodySemi,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      color: '#9a907a',
    },
    title: {
      fontFamily: FONTS.display,
      fontSize: 52,
      lineHeight: 56,
      color: THEME.ink,
      letterSpacing: -0.7,
    },
    titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
    subtitle: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      fontSize: 16,
      lineHeight: 22,
      color: THEME.muted,
      marginTop: 12,
    },

    // HERO
    heroCard: {
      marginTop: 28,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#efe4d0',
    },
    heroArt: { height: 140, position: 'relative', overflow: 'hidden' },
    currentlyChip: {
      position: 'absolute',
      top: 16,
      left: 18,
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: 999,
      backgroundColor: 'rgba(255,253,247,0.92)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    currentlyChipText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    heroBody: { padding: 22, paddingBottom: 22 },
    heroTitle: {
      fontFamily: FONTS.display,
      fontSize: 30,
      lineHeight: 34,
      color: THEME.ink,
      letterSpacing: -0.6,
    },
    heroTitleItalic: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
    },
    heroPeriod: {
      marginTop: 4,
      fontFamily: FONTS.bodySemi,
      fontSize: 12.5,
      color: '#7d745f',
    },
    heroNote: {
      marginTop: 12,
      fontFamily: FONTS.body,
      fontSize: 14.5,
      lineHeight: 20,
      color: '#7d745f',
    },
    heroStatsRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: THEME.line,
    },
    heroStatNum: {
      fontFamily: FONTS.display,
      fontSize: 22,
      lineHeight: 22,
      color: THEME.ink,
      letterSpacing: -0.4,
    },
    heroStatLabel: {
      marginTop: 4,
      fontFamily: FONTS.body,
      fontSize: 11,
      color: '#7d745f',
    },

    // SEASON ROW
    seasonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: '#efe4d0',
      borderRadius: 18,
      padding: 14,
    },
    seasonRowIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seasonRowName: {
      fontFamily: FONTS.display,
      fontSize: 19,
      color: THEME.ink,
      letterSpacing: -0.3,
    },
    seasonRowDays: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: '#9a907a',
    },
    seasonRowNote: {
      marginTop: 2,
      fontFamily: FONTS.body,
      fontSize: 12.5,
      color: '#9a907a',
    },
    seasonRowMoments: {
      fontFamily: FONTS.display,
      fontSize: 19,
      lineHeight: 20,
      color: THEME.ink,
      letterSpacing: -0.3,
    },
    seasonRowMomentsLabel: {
      marginTop: 2,
      fontFamily: FONTS.body,
      fontSize: 10,
      color: '#9a907a',
    },

    // DISTRIBUTION
    distroCard: {
      backgroundColor: '#efe4d0',
      borderRadius: 18,
      padding: 18,
    },
    distroBar: {
      flexDirection: 'row',
      height: 18,
      borderRadius: 10,
      overflow: 'hidden',
    },
    distroLegend: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    distroName: {
      fontFamily: FONTS.bodySemi,
      fontSize: 12,
      color: THEME.ink,
    },
    distroDays: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: '#9a907a',
    },

    // THEMES
    themesCard: {
      backgroundColor: '#efe4d0',
      borderRadius: 18,
      padding: 22,
    },
    themesSmall: {
      fontFamily: FONTS.body,
      fontSize: 12.5,
      color: '#9a907a',
      marginBottom: 14,
    },
    themesWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
    },
    themePair: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    themeWord: {
      fontFamily: FONTS.display,
      letterSpacing: -0.4,
    },
    themeCount: {
      fontFamily: FONTS.body,
      fontSize: 10.5,
      color: '#9a907a',
      marginLeft: 3,
    },
    themeSep: {
      color: '#b0a890',
      marginHorizontal: 8,
    },
  });
