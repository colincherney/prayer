import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { COMPANION_INFO, CompanionGroup, companionGroup, GROUP_LABELS, STAGE_LEVELS } from '@/components/pets/companionInfo';
import { Pet, PetDef, PetId, PETS } from '@/components/pets/registry';
import { BackIcon, LockIcon } from '@/components/saint/Icons';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, mixColors, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { petProgressFromXp, usePetProgress, XP_PER_LEVEL } from '@/lib/pet';
import { useReleases } from '@/lib/releases';

type Filter = 'all' | CompanionGroup;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'monthly', label: 'Monthly' },
];
const GROUPS: CompanionGroup[] = ['core', 'seasonal', 'monthly'];
const CARD_ART = 92;

export const dexNumber = (id: PetId) => String(PETS.findIndex(p => p.id === id) + 1).padStart(3, '0');

function SearchGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="M16 16 L21 21" />
    </Svg>
  );
}

/** One companion's card in the grid: met, not met yet (a silhouette), or not out yet. */
const DexCard = memo(function DexCard({ def, level, stage, met, released, current }: {
  def: PetDef;
  level: number;
  stage: 1 | 2 | 3;
  met: boolean;
  released: boolean;
  current: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { theme } = useTheme();
  const hue = COMPANION_INFO[def.id].hue;
  const tint = met && released ? [mixColors(hue, '#000000', 0.15), mixColors(hue, '#000000', 0.55)] as const : [theme.surface, theme.surface] as const;
  return (
    <Pressable
      disabled={!released}
      onPress={() => router.push({ pathname: '/companion/[id]', params: { id: def.id } })}
      accessibilityRole="button"
      accessibilityLabel={!released ? `Companion ${dexNumber(def.id)}, coming soon` : met ? `${def.name}, level ${level}${current ? ', walking with you' : ''}` : `Companion ${dexNumber(def.id)}, not met yet`}
      style={({ pressed }) => [styles.card, current && styles.cardCurrent, pressed && { opacity: 0.85 }]}>
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.cardTop}>
        <Text style={styles.cardNumber}>{dexNumber(def.id)}</Text>
        {!released ? (
          <Text style={styles.soon}>SOON</Text>
        ) : met ? (
          <Text style={styles.cardLevel}>LV {level}</Text>
        ) : (
          <LockIcon size={11} color={theme.muted} />
        )}
      </View>
      <View style={[styles.cardArt, !met && styles.silhouette]}>
        {released ? <Pet id={def.id} stage={met ? stage : 1} size={CARD_ART} animated={false} /> : null}
      </View>
      <Text numberOfLines={1} style={styles.cardName}>{released && met ? def.name : '???'}</Text>
      {current ? <View style={styles.ribbon}><Text style={styles.ribbonText}>WITH YOU</Text></View> : null}
    </Pressable>
  );
});

export default function CompanionDexScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { petId, name, progress, xpByPet } = usePetProgress();
  const { isReleased } = useReleases();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState<string | null>(null);

  const released = (def: PetDef) => !def.scheduled || isReleased(`pet:${def.id}`);
  const met = (id: PetId) => id === petId || (xpByPet[id] ?? 0) > 0;
  const metCount = PETS.filter(def => released(def) && met(def.id)).length;

  const shown = useMemo(() => {
    const q = (query ?? '').trim().toLowerCase();
    return PETS.filter(def => (filter === 'all' || companionGroup(def.id) === filter)
      && (!q || (met(def.id) && (def.name.toLowerCase().includes(q) || def.species.toLowerCase().includes(q)))));
  // met reads xpByPet and petId, both listed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, xpByPet, petId]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const current = PETS.find(def => def.id === petId) ?? PETS[0];
  const upcoming = progress.stage === 3 ? null : (progress.stage as 1 | 2);
  const nextStage = upcoming ? STAGE_LEVELS[upcoming] : null;
  const nextXp = nextStage ? (nextStage - 1) * XP_PER_LEVEL : 1;
  const towardNext = nextStage ? Math.min(1, progress.xp / nextXp) : 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.circleBtn} accessibilityRole="button" accessibilityLabel="Back">
            <BackIcon size={15} color={theme.ink} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Companion <Text style={styles.titleAccent}>Dex</Text>
          </Text>
          <Pressable onPress={() => setQuery(q => (q === null ? '' : null))} style={styles.circleBtn}
            accessibilityRole="button" accessibilityLabel={query === null ? 'Search companions' : 'Close search'}>
            <SearchGlyph color={theme.ink} />
          </Pressable>
        </View>
        {query !== null ? (
          <TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Search by name or kind"
            placeholderTextColor={theme.muted} style={styles.search} accessibilityLabel="Search companions" />
        ) : null}

        <Pressable onPress={() => router.push({ pathname: '/companion/[id]', params: { id: current.id } })}
          accessibilityRole="button" accessibilityLabel={`${name}, level ${progress.level}, walking with you`} style={styles.hero}>
          <LinearGradient colors={[mixColors(COMPANION_INFO[current.id].hue, '#FFFFFF', 0.12), mixColors(COMPANION_INFO[current.id].hue, '#000000', 0.35)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.heroArt}>
            <Pet id={current.id} stage={progress.stage} size={112} animated={false} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.eyebrow}>WALKING WITH YOU</Text>
            <Text numberOfLines={1} style={styles.heroName}>{name} <Text style={styles.heroLevel}>LV {progress.level}</Text></Text>
            <Text style={styles.heroStage}>{current.stages[progress.stage - 1]}</Text>
            <View style={styles.heroTrack}><View style={[styles.heroFill, { width: `${towardNext * 100}%` }]} /></View>
            <Text style={styles.heroNote}>
              {upcoming && nextStage ? <>Becomes <Text style={styles.bold}>{current.stages[upcoming]}</Text> at level {nextStage}</> : 'Fully grown and radiant'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.metRow}>
          <Text style={styles.metCount}>{metCount}<Text style={styles.metOf}> / {PETS.length} met</Text></Text>
          <View style={styles.dots}>
            {PETS.map(def => (
              <View key={def.id} style={[styles.dot, released(def) && met(def.id) && { backgroundColor: def.id === petId ? theme.accent : mixColors(COMPANION_INFO[def.id].hue, '#FFFFFF', 0.35) }]} />
            ))}
          </View>
        </View>

        {GROUPS.filter(g => filter === 'all' || filter === g).map(group => {
          const pets = shown.filter(def => companionGroup(def.id) === group);
          if (!pets.length) return null;
          const all = PETS.filter(def => companionGroup(def.id) === group);
          const groupMet = all.filter(def => released(def) && met(def.id)).length;
          return (
            <View key={group} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>{GROUP_LABELS[group]}</Text>
                <Text style={styles.sectionCount}>{groupMet} / {all.length}</Text>
              </View>
              <View style={styles.sectionTrack}><View style={[styles.sectionFill, { width: `${(groupMet / all.length) * 100}%` }]} /></View>
              <View style={styles.grid}>
                {pets.map(def => {
                  const own = petProgressFromXp(xpByPet[def.id] ?? 0);
                  return (
                    <DexCard key={def.id} def={def} level={own.level} stage={own.stage}
                      met={met(def.id)} released={released(def)} current={def.id === petId} />
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.filters} accessibilityRole="tablist">
        {FILTERS.map(f => (
          <Pressable key={f.id} onPress={() => setFilter(f.id)} accessibilityRole="tab" accessibilityState={{ selected: filter === f.id }}
            style={[styles.filter, filter === f.id && styles.filterOn]}>
            <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>{f.label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  circleBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  title: { flex: 1, fontFamily: FONTS.display, fontSize: 28, lineHeight: 34, color: theme.ink },
  titleAccent: { color: theme.accent },
  search: { marginHorizontal: 20, marginTop: 12, paddingHorizontal: 16, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, fontFamily: FONTS.body, fontSize: 14, color: theme.ink },
  hero: { marginHorizontal: 20, marginTop: 16, padding: 16, minHeight: 148, borderRadius: 24, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  heroArt: { width: 112, alignItems: 'center' },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 1.6, color: '#F7E3B5' },
  heroName: { fontFamily: FONTS.display, fontSize: 26, lineHeight: 32, color: '#FFFFFF' },
  heroLevel: { fontFamily: FONTS.bodyBold, fontSize: 12, color: '#F7E3B5' },
  heroStage: { fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  heroTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.25)', marginTop: 4 },
  heroFill: { height: '100%', backgroundColor: '#F2C462' },
  heroNote: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.85)' },
  bold: { fontFamily: FONTS.bodyBold, color: '#FFFFFF' },
  metRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginTop: 18 },
  metCount: { fontFamily: FONTS.display, fontSize: 22, color: theme.ink },
  metOf: { fontSize: 13, color: theme.muted },
  dots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dot: { width: 10, height: 6, borderRadius: 2, backgroundColor: theme.line },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 19, color: theme.ink },
  sectionCount: { fontFamily: FONTS.bodySemi, fontSize: 12, color: theme.muted },
  sectionTrack: { height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: theme.line, marginTop: 8 },
  sectionFill: { height: '100%', backgroundColor: theme.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  card: { width: '31.5%', aspectRatio: 0.72, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: theme.line, padding: 8, justifyContent: 'space-between' },
  cardCurrent: { borderWidth: 2, borderColor: theme.accent, paddingBottom: 24 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { fontFamily: FONTS.bodyBold, fontSize: 11, fontVariant: ['lining-nums'], color: theme.inkSoft },
  cardLevel: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', fontFamily: FONTS.bodyBold, fontSize: 9.5, fontVariant: ['lining-nums'], color: '#F7E3B5' },
  soon: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: theme.line, fontFamily: FONTS.bodyBold, fontSize: 9, color: theme.muted },
  cardArt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  silhouette: { opacity: 0.18 },
  cardName: { textAlign: 'center', fontFamily: FONTS.display, fontSize: 14, color: theme.ink },
  ribbon: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 3, backgroundColor: theme.accent },
  ribbonText: { textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 1.2, color: '#2A1A0C' },
  filters: { position: 'absolute', left: 20, right: 20, bottom: 28, flexDirection: 'row', padding: 5, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  filter: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  filterOn: { backgroundColor: theme.accent },
  filterText: { fontFamily: FONTS.bodyBold, fontSize: 11, letterSpacing: 1.2, color: theme.inkSoft },
  filterTextOn: { color: '#2A1A0C' },
});
