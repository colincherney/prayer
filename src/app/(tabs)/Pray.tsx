import { router } from 'expo-router';
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

import { ScreenHeader } from '@/components/saint/Common';
import { HeartIcon, PenIcon, PrayingIcon } from '@/components/saint/Icons';
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
  verse: string;
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
        <Text style={[styles.eyebrow, { color: fgMuted }]}>{eyebrow}</Text>
        <Text style={[styles.cardTitle, { color: fg }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: fgSoft }]}>{desc}</Text>
        <Text style={[styles.cardVerse, { color: fgMuted }]}>{verse}</Text>
      </View>
    </Pressable>
  );
};

export default function PrayLauncherScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="How will you pray?"
          subtitle="Choose where your heart is right now."
        />
        <View style={styles.cards}>
          <LauncherCard
            variant="dark"
            icon={<PenIcon size={22} color={THEME.cardDarkInk} />}
            eyebrow="LIFT UP"
            title="Share a prayer request"
            desc="Anonymous. Categorized. Held by strangers and by God."
            verse="Phil 4:6 · By prayer and supplication, with thanksgiving"
            onPress={() => router.push('/prayerRequest')}
          />
          <LauncherCard
            variant="light"
            icon={<PrayingIcon size={22} color={THEME.ink} />}
            eyebrow="BEAR ANOTHER'S BURDEN"
            title="Pray for others"
            desc="Read what's heavy on someone's heart. Lift it up. Tap when prayed."
            verse="Gal 6:2 · Bear one another's burdens"
            onPress={() => router.push('/explore')}
          />
          <LauncherCard
            variant="accent"
            icon={<HeartIcon size={22} color={THEME.accentInk} />}
            eyebrow="TWO SOULS, IN REAL TIME"
            title="Pray right now"
            desc="Be paired with one other anonymous person. Pray for each other."
            verse="Matt 18:20 · Where two or three gather, there am I"
            onPress={() => router.push('/pair')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  cards: { paddingHorizontal: 22, gap: 12 },
  card: {
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  cardChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 10,
  },
  cardVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 11.5,
  },
});
