import { router } from 'expo-router';
import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroIllustration } from '@/components/saint/Hero';
import {
  ArrowIcon,
  PenIcon,
  PrayingIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
} from '@/components/saint/Icons';
import {
  Pill,
  RoundIcon,
  ScriptureTicker,
  Squiggle,
} from '@/components/saint/Common';
import { FONTS, THEME, VERSES } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

export default function HomeScreen() {
  const fontsLoaded = useSaintFonts();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      {/* Top scripture ticker */}
      <View style={{ marginTop: 8, marginBottom: 14 }}>
        <ScriptureTicker verses={VERSES.slice(0, 3)} speed={26} />
      </View>

      {/* Anonymous Prayer pill */}
      <View style={styles.pillRow}>
        <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
          Anonymous Prayer
        </Pill>
        <View style={styles.sparkles}>
          <SparkleIcon size={10} color={THEME.muted} />
          <SparkleIcon size={7} color={THEME.muted} />
        </View>
      </View>

      {/* Hero — title + illustration. flex:1 absorbs remaining vertical space */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroTitle}>Saint{'\n'}Central</Text>
          <View style={{ marginTop: 12 }}>
            <Squiggle color={THEME.accent} w={68} />
          </View>
          <Text style={styles.heroSubtitle}>
            Pray anonymously.{'\n'}
            Lift others. Find <Text style={styles.heroHope}>hope</Text>.
          </Text>
          <View style={{ marginTop: 8 }}>
            <Squiggle color={THEME.accent} w={36} opacity={0.5} />
          </View>
        </View>
        <View style={styles.heroIllustration} pointerEvents="none">
          <HeroIllustration width={200} height={220} />
        </View>
      </View>

      {/* Mid scripture ticker */}
      <View style={{ marginTop: 14, marginBottom: 14 }}>
        <ScriptureTicker verses={VERSES.slice(1, 4)} speed={22} />
      </View>

      {/* Two cards */}
      <View style={styles.cardsRow}>
        <Pressable
          onPress={() => router.push('/explore')}
          style={[styles.card, styles.cardDark]}>
          <View style={styles.cardLightChip}>
            <PrayingIcon size={22} color={THEME.cardDark} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: THEME.cardDarkInk }]}>
              Pray for{'\n'}Others
            </Text>
            <Text style={[styles.cardBody, { color: THEME.cardDarkInk, opacity: 0.85 }]}>
              Lift someone up today
            </Text>
            <Text style={[styles.cardVerse, { color: THEME.cardDarkInk, opacity: 0.5 }]}>
              Gal 6:2 · Bear one another{"'"}s burdens
            </Text>
          </View>
          <View style={styles.cardFooterRow}>
            <View style={styles.cardSparkles}>
              <SparkleIcon size={8} color={THEME.cardDarkInk} />
              <SparkleIcon size={6} color={THEME.cardDarkInk} />
            </View>
            <RoundIcon bg={THEME.accent} size={36}>
              <ArrowIcon size={16} color="#FFF" />
            </RoundIcon>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/pair')}
          style={[styles.card, styles.cardLight]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardSoftChip}>
              <PenIcon size={18} color={THEME.ink} />
            </View>
            <View style={{ opacity: 0.5 }}>
              <StarIcon size={16} color={THEME.muted} />
            </View>
          </View>
          <View>
            <Text style={styles.cardCite}>1 Pet 5:7 · Cast your cares on Him</Text>
            <Text style={[styles.cardTitle, { color: THEME.ink }]}>
              Pray{'\n'}Right Now
            </Text>
            <Text style={[styles.cardBody, { color: THEME.inkSoft }]}>
              Share what{"'"}s on your heart
            </Text>
          </View>
          <Pill
            icon={<SparkleIcon size={10} color={THEME.pillInk} />}
            bg={THEME.pillBg}
            fg={THEME.pillInk}
            style={{ alignSelf: 'center' }}>
            Paired anonymously
          </Pill>
        </Pressable>
      </View>

      {/* Bottom scripture ticker — sits right under the cards */}
      <View style={{ marginTop: 14 }}>
        <ScriptureTicker verses={VERSES.slice(2, 5)} speed={24} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg, paddingBottom: 90 },
  pillRow: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sparkles: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.4 },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 220,
  },
  heroLeft: { flex: 1, paddingRight: 4, zIndex: 2, justifyContent: 'flex-start' },
  heroTitle: {
    fontFamily: FONTS.displaySemi,
    fontSize: 46,
    lineHeight: 46,
    letterSpacing: -1,
    color: THEME.ink,
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 21,
    color: THEME.inkSoft,
    marginTop: 14,
    maxWidth: 220,
  },
  heroHope: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  heroIllustration: {
    position: 'absolute',
    right: -6,
    top: 8,
    width: 200,
    height: 220,
  },
  cardsRow: {
    flex: 1,
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 210,
    justifyContent: 'space-between',
  },
  cardDark: {
    backgroundColor: THEME.cardDark,
    shadowColor: '#1F2A44',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardLight: {
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    shadowColor: '#1F2A44',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLightChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSoftChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  cardBody: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  cardVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 10.5,
    marginTop: 8,
  },
  cardCite: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 10.5,
    color: THEME.muted,
    marginBottom: 6,
  },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardSparkles: { flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.4 },
});
