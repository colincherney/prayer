import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/saint/Common';
import { HeartIcon, PenIcon, PrayingIcon, UsersIcon } from '@/components/saint/Icons';
import {
  FONTS,
  relativeLuminance,
  Theme,
  useTheme,
  useThemedStyles,
} from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

type CardProps = {
  variant?: 'dark' | 'light' | 'accent';
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
  verse?: string;
  onPress: () => void;
};

const LauncherCard: React.FC<CardProps> = ({ variant = 'light', icon, eyebrow, title, desc, verse, onPress }) => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const dark = variant === 'dark';
  const accent = variant === 'accent';
  const bg = accent ? THEME.accent : dark ? THEME.cardDark : THEME.surface;
  // accentInk adapts to whether THEME.accent is pale or saturated, so text
  // never lands the same light-on-light (or dark-on-dark) pairing as its card.
  const accentTextIsDark = accent && relativeLuminance(THEME.accentInk) < 0.5;
  const fg = dark ? THEME.cardDarkInk : accent ? THEME.accentInk : THEME.ink;
  const fgSoft = dark
    ? 'rgba(255,255,255,0.78)'
    : accent
      ? accentTextIsDark ? 'rgba(31,42,58,0.75)' : 'rgba(255,255,255,0.78)'
      : THEME.inkSoft;
  const fgMuted = dark
    ? 'rgba(255,255,255,0.5)'
    : accent
      ? accentTextIsDark ? 'rgba(31,42,58,0.55)' : 'rgba(255,255,255,0.5)'
      : THEME.muted;
  const chipBg = dark
    ? 'rgba(255,255,255,0.12)'
    : accent
      ? accentTextIsDark ? 'rgba(31,42,58,0.12)' : 'rgba(255,255,255,0.18)'
      : THEME.bgSoft;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderWidth: dark || accent ? 0 : StyleSheet.hairlineWidth,
          borderColor: THEME.line,
          shadowColor: '#1F2A44',
          shadowOpacity: dark || accent ? 0.18 : 0.06,
          shadowRadius: dark || accent ? 28 : 18,
          shadowOffset: { width: 0, height: dark || accent ? 8 : 4 },
          elevation: dark || accent ? 6 : 2,
        },
      ]}>
      <View style={[styles.cardChip, { backgroundColor: chipBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: fgMuted }]} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={[styles.cardTitle, { color: fg }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: fgSoft }]} numberOfLines={2}>
          {desc}
        </Text>
        {verse ? (
          <Text style={[styles.cardVerse, { color: fgMuted }]} numberOfLines={1}>
            {verse}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export default function PrayLauncherScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME, name } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  // Everything must fit without scrolling; on short screens the verse line
  // is the first thing to go.
  const short = height < 700;

  // Cream, forest, and pink are light-on-light palettes where the thin
  // display script reads faint — bold the title and darken the subtitle
  // there. Navy already has plenty of contrast and is left untouched.
  const needsContrastBoost = name === 'cream' || name === 'forest' || name === 'pink';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScreenHeader
        title="How will you pray?"
        subtitle="Choose where your heart is right now."
        titleFont={needsContrastBoost ? FONTS.displaySemi : undefined}
        titleColor={needsContrastBoost ? THEME.ink : undefined}
        subtitleColor={needsContrastBoost ? THEME.ink : undefined}
      />
      <View style={[styles.cards, { paddingBottom: insets.bottom + 64 }]}>
        <LauncherCard
          variant="dark"
          icon={<PenIcon size={20} color={THEME.cardDarkInk} />}
          eyebrow="LIFT UP"
          title="Share a prayer request"
          desc="Anonymous. Categorized. Held by strangers and by God."
          verse={short ? undefined : 'Phil 4:6 · By prayer and supplication, with thanksgiving'}
          onPress={() => router.push('/prayerRequest')}
        />
        <LauncherCard
          variant="light"
          icon={<PrayingIcon size={20} color={THEME.ink} />}
          eyebrow="BEAR ANOTHER'S BURDEN"
          title="Pray for others"
          desc="Read what's heavy on someone's heart. Lift it up. Tap when prayed."
          verse={short ? undefined : "Gal 6:2 · Bear one another's burdens"}
          onPress={() => router.push('/explore')}
        />
        <LauncherCard
          variant="accent"
          icon={<HeartIcon size={20} color={THEME.accentInk} />}
          eyebrow="TWO SOULS, IN REAL TIME"
          title="Pray right now"
          desc="Be paired with one other anonymous person. Pray for each other."
          verse={short ? undefined : 'Matt 18:20 · Where two or three gather, there am I'}
          onPress={() => router.push('/pair')}
        />
        <LauncherCard
          variant="light"
          icon={<UsersIcon size={20} color={THEME.ink} />}
          eyebrow="YOUR CHURCH, YOUR CIRCLE"
          title="Pray with your group"
          desc="Join your church's circle with a code. Known to God, anonymous to each other."
          verse={short ? undefined : 'Jas 5:16 · Pray for one another'}
          onPress={() => router.push('/groups')}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  // The four cards split whatever height remains under the header, so the
  // whole launcher always fits on one screen.
  cards: { flex: 1, paddingHorizontal: 22, gap: 10 },
  card: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 4,
  },
  cardVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 10.5,
  },
});
