import { router } from 'expo-router';
import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DustMotes } from '@/components/saint/DustMotes';
import {
  ArrowIcon,
  PenIcon,
  PrayingIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
} from '@/components/saint/Icons';
import { LamplitScene } from '@/components/saint/LamplitScene';
import {
  Pill,
  RoundIcon,
  ScriptureTicker,
  Squiggle,
} from '@/components/saint/Common';
import { FONTS, VERSES } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

// Lamplit Corner palette — independent of the user-selected theme so the
// dusky reading-nook reads correctly regardless of cream/navy/forest/pink.
const ROOM = {
  bg: '#14182a',
  ink: '#f4ead5',
  inkSoft: 'rgba(244,234,213,0.82)',
  muted: 'rgba(244,234,213,0.55)',
  divider: 'rgba(244,234,213,0.18)',
  accent: '#f5cba2',
  pillBg: 'rgba(244,234,213,0.16)',
  pillInk: '#f4ead5',
  cardDark: 'rgba(20,28,44,0.72)',
  cardDarkInk: '#f4ead5',
  cardLight: 'rgba(244,234,213,0.86)',
  cardLightInk: '#1f2a3a',
  cardLightInkSoft: 'rgba(31,42,58,0.7)',
  cardLightPillBg: 'rgba(194,90,54,0.14)',
  cardLightPillInk: '#c25a36',
};

export default function HomeScreen() {
  const fontsLoaded = useSaintFonts();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: ROOM.bg }} />;
  }

  return (
    <View style={styles.root}>
      <LamplitScene />
      <DustMotes count={26} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Top scripture ticker */}
        <View style={{ marginTop: 8, marginBottom: 14 }}>
          <ScriptureTicker
            verses={VERSES.slice(0, 3)}
            speed={26}
            theme={{ ...EMPTY_THEME, muted: ROOM.muted }}
          />
        </View>

        {/* Anonymous Prayer pill */}
        <View style={styles.pillRow}>
          <Pill
            bg={ROOM.pillBg}
            fg={ROOM.pillInk}
            icon={<ShieldIcon size={11} color={ROOM.accent} />}>
            Anonymous Prayer
          </Pill>
          <View style={styles.sparkles}>
            <SparkleIcon size={10} color={ROOM.muted} />
            <SparkleIcon size={7} color={ROOM.muted} />
          </View>
        </View>

        {/* Hero — title + tagline. The room IS the illustration. */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Saint{'\n'}Central</Text>
          <View style={{ marginTop: 12 }}>
            <Squiggle color={ROOM.accent} w={68} />
          </View>
          <Text style={styles.heroSubtitle}>
            Pray anonymously.{'\n'}
            Lift others. Find <Text style={styles.heroHope}>hope</Text>.
          </Text>
          <View style={{ marginTop: 8 }}>
            <Squiggle color={ROOM.accent} w={36} opacity={0.5} />
          </View>
        </View>

        {/* Mid scripture ticker — bracketed by hairline dividers like the
            mock's mid marquee. */}
        <View style={styles.midTickerWrap}>
          <ScriptureTicker
            verses={VERSES.slice(1, 4)}
            speed={22}
            theme={{ ...EMPTY_THEME, muted: ROOM.muted }}
          />
        </View>

        {/* Two cards */}
        <View style={styles.cardsRow}>
          <Pressable
            onPress={() => router.push('/explore')}
            style={[styles.card, styles.cardDark]}>
            <View style={styles.cardLightChip}>
              <PrayingIcon size={22} color="#1f2a3a" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: ROOM.cardDarkInk }]}>
                Pray for{'\n'}Others
              </Text>
              <Text style={[styles.cardBody, { color: ROOM.cardDarkInk, opacity: 0.85 }]}>
                Lift someone up today
              </Text>
              <Text
                style={[styles.cardVerse, { color: ROOM.cardDarkInk, opacity: 0.5 }]}>
                Gal 6:2 · Bear one another{"'"}s burdens
              </Text>
            </View>
            <View style={styles.cardFooterRow}>
              <View style={styles.cardSparkles}>
                <SparkleIcon size={8} color={ROOM.cardDarkInk} />
                <SparkleIcon size={6} color={ROOM.cardDarkInk} />
              </View>
              <RoundIcon bg="#c25a36" size={36}>
                <ArrowIcon size={16} color="#FFF" />
              </RoundIcon>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/pair')}
            style={[styles.card, styles.cardLight]}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardSoftChip}>
                <PenIcon size={18} color={ROOM.cardLightInk} />
              </View>
              <View style={{ opacity: 0.5 }}>
                <StarIcon size={16} color={ROOM.cardLightInkSoft} />
              </View>
            </View>
            <View>
              <Text style={styles.cardCite}>1 Pet 5:7 · Cast your cares on Him</Text>
              <Text style={[styles.cardTitle, { color: ROOM.cardLightInk }]}>
                Pray{'\n'}Right Now
              </Text>
              <Text style={[styles.cardBody, { color: ROOM.cardLightInkSoft }]}>
                Share what{"'"}s on your heart
              </Text>
            </View>
            <Pill
              icon={<SparkleIcon size={10} color={ROOM.cardLightPillInk} />}
              bg={ROOM.cardLightPillBg}
              fg={ROOM.cardLightPillInk}
              style={{ alignSelf: 'center' }}>
              Paired anonymously
            </Pill>
          </Pressable>
        </View>

        {/* Bottom scripture ticker */}
        <View style={{ marginTop: 14 }}>
          <ScriptureTicker
            verses={VERSES.slice(2, 5)}
            speed={24}
            theme={{ ...EMPTY_THEME, muted: ROOM.muted }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

// Stub theme passed to ScriptureTicker — only `muted` is read for color.
const EMPTY_THEME = {
  name: '',
  bg: '',
  bgSoft: '',
  surface: '',
  ink: '',
  inkSoft: '',
  muted: '',
  line: '',
  cardDark: '',
  cardDarkInk: '',
  accent: '',
  accentSoft: '',
  pillBg: '',
  pillInk: '',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ROOM.bg },
  safe: { flex: 1, paddingBottom: 90 },
  pillRow: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sparkles: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.6 },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 14,
    minHeight: 220,
  },
  heroTitle: {
    fontFamily: FONTS.displaySemi,
    fontSize: 56,
    lineHeight: 54,
    letterSpacing: -1,
    color: ROOM.ink,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 2 },
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: ROOM.inkSoft,
    marginTop: 14,
    maxWidth: 240,
  },
  heroHope: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: ROOM.accent,
  },
  midTickerWrap: {
    marginTop: 14,
    marginBottom: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: ROOM.divider,
  },
  cardsRow: {
    flex: 1,
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 26,
    padding: 18,
    minHeight: 230,
    justifyContent: 'space-between',
  },
  cardDark: {
    backgroundColor: ROOM.cardDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,234,213,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  cardLight: {
    backgroundColor: ROOM.cardLight,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardLightChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244,234,213,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSoftChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31,42,58,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 28,
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
    fontSize: 11,
    marginTop: 8,
  },
  cardCite: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 11,
    color: ROOM.cardLightInkSoft,
    marginBottom: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardSparkles: { flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.5 },
});
