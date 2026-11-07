import { router } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pet, PetDef, PetId, useAvailablePets } from '@/components/pets/registry';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { petProgressFromXp, usePetProgress } from '@/lib/pet';

/**
 * Size of each companion's picture (dp), and of the evolution stages under it. ART_SIZE is also the width of the
 * picture column on every card, so the text lines up. Gourdy is drawn a little larger because its artwork sits
 * smaller on its canvas; it is centered in the same column.
 */
const ART_COLUMN = 130; // width of the picture column; unchanged, so the text stays exactly where it was
const ART_SIZE = 176; // the main picture, 0.3 inch (about 46 dp) larger than before; it spills evenly past the column
const EVO_SIZE = 92;
const PUMPKIN_ART_SIZE = 202; // Gourdy, also 46 dp larger than before
const PUMPKIN_EVO_SIZE = 102;
const LEVELS = ['Levels 1–4', 'Levels 5–9', 'Level 10+'] as const;

/**
 * The three evolution stages. The row opens at full size straight away, then the pets arrive one per frame, because
 * mounting three animated pets in one go is what froze the screen for a moment.
 */
function EvolutionRow({ def, size }: { def: PetDef; size: number }) {
  const styles = useThemedStyles(makeStyles);
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    if (mounted >= 3) return;
    const frame = requestAnimationFrame(() => setMounted(count => count + 1));
    return () => cancelAnimationFrame(frame);
  }, [mounted]);
  return (
    <View style={styles.evoRow}>
      {([1, 2, 3] as const).map(st => (
        <View key={st} style={styles.evoCol}>
          <View style={{ minHeight: Math.round((size * 260) / 240) }}>
            {st <= mounted ? <Pet id={def.id} stage={st} size={size} interactive /> : null}
          </View>
          <Text style={styles.evoName}>{def.stages[st - 1]}</Text>
          <Text style={styles.evoLevel}>{LEVELS[st - 1]}</Text>
        </View>
      ))}
    </View>
  );
}

/** Memoized so opening one card doesn't re-render every other animated pet on the page. */
const PetCard = memo(function PetCard({
  def,
  selected,
  stage,
  level,
  onPick,
  expanded,
  onToggle,
}: {
  def: PetDef;
  selected: boolean;
  stage: 1 | 2 | 3;
  /** This pet's own level; pets level up separately. */
  level: number;
  onPick: (id: PetId) => void;
  /** Whether this card shows all three evolution stages. The chosen companion's card is always open. */
  expanded: boolean;
  onToggle: (id: PetId) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const artSize = def.id === 'pumpkin' ? PUMPKIN_ART_SIZE : ART_SIZE;
  const evoSize = def.id === 'pumpkin' ? PUMPKIN_EVO_SIZE : EVO_SIZE;
  return (
    <Pressable
      onPress={() => onPick(def.id)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${def.name} the ${def.species}${selected ? ', your companion' : ''}`}
      style={({ pressed }) => [styles.card, selected && styles.cardOn, pressed && { opacity: 0.9 }]}>
      <View style={styles.cardTop}>
        <View style={[styles.artBox, { width: ART_COLUMN, height: Math.round((artSize * 260) / 240) }]}>
          <View style={{ position: 'absolute', bottom: 0, left: (ART_COLUMN - artSize) / 2, width: artSize }}>
            <Pet id={def.id} stage={stage} size={artSize} interactive={selected} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.petName}>{def.name}</Text>
          <Text style={styles.species}>
            {def.species.toUpperCase()}
            {def.season ? `  ·  ${def.season.toUpperCase()}` : ''}
          </Text>
          <Text style={styles.tagline}>{def.tagline}</Text>
          <Text style={styles.badge}>
            {selected ? 'YOUR COMPANION  ·  ' : ''}LEVEL {level}
          </Text>
        </View>
      </View>
      {expanded ? (
        <EvolutionRow def={def} size={evoSize} />
      ) : (
        <Text style={styles.stageLine}>{def.stages.join('  ·  ')}</Text>
      )}
      {selected ? null : (
        <Pressable onPress={() => onToggle(def.id)} hitSlop={8} accessibilityRole="button" style={styles.evoToggle}>
          <Text style={styles.evoToggleText}>{expanded ? 'Hide evolution' : 'See evolution'}</Text>
        </Pressable>
      )}
    </Pressable>
  );
});

export default function PetsScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { petId, setPetId, xpByPet } = usePetProgress();
  const pets = useAvailablePets();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggleOpen = useCallback((id: PetId) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <BackIcon size={15} color={THEME.ink} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>companion</Text>
          </Text>
          <Text style={styles.subtitle}>
            Pick who walks with you. Praying grows whoever is with you, each at their own pace, and each one evolves at levels 5 and 10.
          </Text>
        </View>
        <View style={styles.list}>
          {pets.map(def => {
            const own = petProgressFromXp(xpByPet[def.id] ?? 0);
            return (
            <PetCard
              key={def.id}
              def={def}
              selected={def.id === petId}
              expanded={def.id === petId || open.has(def.id)}
              onToggle={toggleOpen}
              stage={own.stage}
              level={own.level}
              onPick={setPetId}
            />
            );
          })}
        </View>
      </ScrollView>
    </View>
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
  titleItalic: { fontFamily: FONTS.display, color: THEME.accent },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.muted, marginTop: 8 },
  list: { paddingHorizontal: 22, marginTop: 22, gap: 12 },
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.line,
    gap: 12,
  },
  cardOn: { borderColor: THEME.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  artBox: { overflow: 'visible' },
  petName: { fontFamily: FONTS.displaySemi, fontSize: 24, color: THEME.ink },
  species: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.4, color: THEME.muted, marginTop: 2 },
  tagline: { fontFamily: FONTS.display, fontSize: 14, lineHeight: 19, color: THEME.inkSoft, marginTop: 8 },
  badge: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.4, color: THEME.accent, marginTop: 10 },
  stageLine: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  evoToggle: { alignSelf: 'flex-start' },
  evoToggleText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.accent },
  evoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  evoCol: { flex: 1, alignItems: 'center', gap: 2 },
  evoName: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.ink, textAlign: 'center' },
  evoLevel: { fontFamily: FONTS.body, fontSize: 11, color: THEME.muted },
});
