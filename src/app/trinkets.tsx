import { router } from 'expo-router';
import React, { memo, useCallback, useRef, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/saint/HapticPressable';
import { SafeAreaView } from '@/components/saint/SafeArea';

import { RARITY_COLOR, TapTrinket, TrinketArt } from '@/components/pets/Trinket';
import { TRINKET_INFO, TrinketId } from '@/components/pets/trinketArt';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { TrinketStatus, useTrinkets } from '@/lib/trinkets';

// The keepsake gallery. Every trinket is an SVG with its own looping animations, and each animated frame redraws its
// whole canvas, so with every keepsake earned (90+) a plain ScrollView ran ~190 loops at once, off-screen ones included,
// and dropped to under 20fps. Now the grid is a virtualized list (cards far off-screen aren't mounted), and only the
// cards actually on screen animate; the rest hold their resting pose. Cards are memoized, so scrolling only re-renders
// the few whose on-screen state changed.

const ART_SIZE = 104;

type CardProps = { t: TrinketStatus; animated: boolean; onClaim: (id: TrinketId) => void };

function TrinketCardBase({ t, animated, onClaim }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  const info = TRINKET_INFO[t.id];
  const color = RARITY_COLOR[info.rarity];
  return (
    <View style={[styles.card, info.rarity === 'legendary' && t.earned && { borderColor: color }]}>
      <Text style={[styles.rarity, { color }]}>{info.rarity.toUpperCase()}</Text>
      {t.earned ? (
        <TapTrinket id={t.id} size={ART_SIZE}>
          <TrinketArt id={t.id} size={ART_SIZE} animated={animated} />
        </TapTrinket>
      ) : (
        <TrinketArt id={t.id} size={ART_SIZE} dim />
      )}
      <Text style={styles.name}>{info.name}</Text>
      <Text style={styles.goal}>{info.goal}</Text>
      {t.earned ? (
        <Text style={[styles.status, { color }]}>On your shelf</Text>
      ) : t.honor ? (
        <Pressable onPress={() => onClaim(t.id)} accessibilityRole="button" style={({ pressed }) => [styles.claim, pressed && { opacity: 0.8 }]}>
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
      {t.quest && !t.earned ? (
        <Pressable onPress={() => router.push('/quests')} hitSlop={6} accessibilityRole="link" accessibilityLabel={`Go to quests to earn ${info.name}`}>
          <Text style={styles.questLink}>Go to quests →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// useTrinkets builds fresh status objects on every render, so compare what the card shows rather than identity.
const TrinketCard = memo(TrinketCardBase, (a, b) =>
  a.animated === b.animated &&
  a.onClaim === b.onClaim &&
  a.t.id === b.t.id &&
  a.t.earned === b.t.earned &&
  a.t.honor === b.t.honor &&
  a.t.quest === b.t.quest &&
  a.t.progress?.[0] === b.t.progress?.[0] &&
  a.t.progress?.[1] === b.t.progress?.[1],
);

const VIEWABILITY = { itemVisiblePercentThreshold: 15, minimumViewTime: 0 };
const keyOf = (t: TrinketStatus) => t.id;

export default function TrinketsScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { trinkets, claim } = useTrinkets();
  // The cards on screen right now: the only ones whose loops run.
  const [onScreen, setOnScreen] = useState<ReadonlySet<TrinketId>>(() => new Set());
  // Must be the same function for the list's whole life (FlatList refuses a new one).
  const onViewable = useRef(({ viewableItems }: { viewableItems: { item: TrinketStatus }[] }) => {
    const next = new Set(viewableItems.map(v => v.item.id));
    setOnScreen(prev => (prev.size === next.size && [...next].every(id => prev.has(id)) ? prev : next));
  }).current;
  const onClaim = useCallback((id: TrinketId) => {
    claim(id);
  }, [claim]);

  const renderItem = useCallback(
    ({ item }: { item: TrinketStatus }) => <TrinketCard t={item} animated={onScreen.has(item.id)} onClaim={onClaim} />,
    [onScreen, onClaim],
  );

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;
  const earned = trinkets.filter(t => t.earned).length;

  const header = (
    <>
      <View style={styles.brandRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <BackIcon size={15} color={THEME.ink} />
        </Pressable>
      </View>
      <View style={styles.intro}>
        <Text style={styles.title}>
          Nook <Text style={styles.titleItalic}>trinkets</Text>
        </Text>
        <Text style={styles.subtitle}>
          Keepsakes earned through prayer and quests, set on the shelf beside your companion.
          {trinkets.length ? ` You have ${earned} of ${trinkets.length}.` : ''}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={THEME.isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        data={trinkets}
        keyExtractor={keyOf}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={[styles.subtitle, styles.empty]}>The first trinkets arrive with the Thanksgiving update.</Text>}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={VIEWABILITY}
        // A screen and a bit: mount little ahead, keep little behind.
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  content: { paddingBottom: 60 },
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
  intro: { paddingHorizontal: 22, marginBottom: 18 },
  title: { fontFamily: FONTS.display, fontSize: 40, lineHeight: 44, color: THEME.ink, marginTop: 14 },
  titleItalic: { fontFamily: FONTS.display, color: THEME.accent },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.muted, marginTop: 8 },
  empty: { paddingHorizontal: 22, marginTop: 6 },
  row: { paddingHorizontal: 16, gap: 12, marginBottom: 12, justifyContent: 'center' },
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
  questLink: { marginTop: 6, fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 16, color: THEME.accent },
  claim: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: THEME.accent },
  claimText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.accentInk },
  track: { marginTop: 6, width: '90%', height: 18, borderRadius: 9, backgroundColor: THEME.line, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.7 },
  trackText: { fontFamily: FONTS.bodySemi, fontSize: 11, color: THEME.ink, textAlign: 'center' },
});
