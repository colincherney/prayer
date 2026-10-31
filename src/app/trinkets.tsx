import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PreviewUpcoming } from '@/components/PreviewUpcoming';
import { RARITY_COLOR, TapTrinket, TrinketArt } from '@/components/pets/Trinket';
import { TRINKET_INFO } from '@/components/pets/trinketArt';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { TrinketStatus, useTrinkets } from '@/lib/trinkets';

function TrinketCard({ t, onClaim }: { t: TrinketStatus; onClaim: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const info = TRINKET_INFO[t.id];
  const color = RARITY_COLOR[info.rarity];
  return (
    <View style={[styles.card, info.rarity === 'legendary' && t.earned && { borderColor: color }]}>
      <Text style={[styles.rarity, { color }]}>{info.rarity.toUpperCase()}</Text>
      {t.earned ? <TapTrinket id={t.id} size={104} /> : <TrinketArt id={t.id} size={104} dim />}
      <Text style={styles.name}>{info.name}</Text>
      <Text style={styles.goal}>{info.goal}</Text>
      {t.earned ? (
        <Text style={[styles.status, { color }]}>On your shelf</Text>
      ) : t.honor ? (
        <Pressable onPress={onClaim} accessibilityRole="button" style={({ pressed }) => [styles.claim, pressed && { opacity: 0.8 }]}>
          <Text style={styles.claimText}>I did this</Text>
        </Pressable>
      ) : t.progress ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(t.progress[0] / t.progress[1]) * 100}%`, backgroundColor: color }]} />
          <Text style={styles.trackText}>
            {t.progress[0]} / {t.progress[1]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TrinketsScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { trinkets, claim } = useTrinkets();
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;
  const earned = trinkets.filter(t => t.earned).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={THEME.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <BackIcon size={15} color={THEME.ink} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={styles.title}>
            Nook <Text style={styles.titleItalic}>trinkets</Text>
          </Text>
          <Text style={styles.subtitle}>
            Keepsakes earned through prayer, set on the shelf beside your companion. New ones arrive each month.
            {trinkets.length ? ` You have ${earned} of ${trinkets.length}.` : ''}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 22, marginTop: 18 }}>
          <PreviewUpcoming />
        </View>
        {trinkets.length === 0 ? (
          <Text style={[styles.subtitle, { paddingHorizontal: 22, marginTop: 24 }]}>The first trinkets arrive with the Thanksgiving update.</Text>
        ) : (
          <View style={styles.grid}>
            {trinkets.map(t => (
              <TrinketCard key={t.id} t={t} onClaim={() => claim(t.id)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  brandRow: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.display, fontSize: 40, lineHeight: 44, color: THEME.ink, marginTop: 14 },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.muted, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 18, gap: 12, justifyContent: 'center' },
  card: {
    width: '46%',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 14,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  rarity: { alignSelf: 'flex-start', fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 1.6 },
  name: { fontFamily: FONTS.displaySemi, fontSize: 16, lineHeight: 19, color: THEME.ink, textAlign: 'center' },
  goal: { fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 17, color: THEME.muted, textAlign: 'center' },
  status: { fontFamily: FONTS.bodySemi, fontSize: 12, marginTop: 4 },
  claim: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: THEME.accent },
  claimText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.accentInk },
  track: { marginTop: 6, width: '90%', height: 18, borderRadius: 9, backgroundColor: THEME.line, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.7 },
  trackText: { fontFamily: FONTS.bodySemi, fontSize: 11, color: THEME.ink, textAlign: 'center' },
});
