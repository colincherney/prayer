import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PETS, Pet, PetDef } from '@/components/pets/registry';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { usePetProgress } from '@/lib/pet';

const LEVELS = ['Levels 1–4', 'Levels 5–9', 'Level 10+'] as const;

function PetCard({
  def,
  selected,
  stage,
  onPick,
  expanded,
  onToggle,
}: {
  def: PetDef;
  selected: boolean;
  stage: 1 | 2 | 3;
  onPick: () => void;
  /** Whether this card shows all three evolution stages. The chosen companion's card is always open. */
  expanded: boolean;
  onToggle: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${def.name} the ${def.species}${selected ? ', your companion' : ''}`}
      style={({ pressed }) => [styles.card, selected && styles.cardOn, pressed && { opacity: 0.9 }]}>
      <View style={styles.cardTop}>
        <View style={styles.artBox}>
          <Pet id={def.id} stage={stage} size={104} interactive={selected} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.petName}>{def.name}</Text>
          <Text style={styles.species}>{def.species.toUpperCase()}</Text>
          <Text style={styles.tagline}>{def.tagline}</Text>
          {selected ? <Text style={styles.badge}>YOUR COMPANION</Text> : null}
        </View>
      </View>
      {expanded ? (
        <View style={styles.evoRow}>
          {([1, 2, 3] as const).map(st => (
            <View key={st} style={styles.evoCol}>
              <Pet id={def.id} stage={st} size={84} interactive />
              <Text style={styles.evoName}>{def.stages[st - 1]}</Text>
              <Text style={styles.evoLevel}>{LEVELS[st - 1]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.stageLine}>{def.stages.join('  ·  ')}</Text>
      )}
      {selected ? null : (
        <Pressable onPress={onToggle} hitSlop={8} accessibilityRole="button" style={styles.evoToggle}>
          <Text style={styles.evoToggleText}>{expanded ? 'Hide evolution' : 'See evolution'}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export default function PetsScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { petId, setPetId, progress } = usePetProgress();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
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
            Pick who walks with you. Praying grows them, and each one evolves at levels 5 and 10.
          </Text>
        </View>
        <View style={styles.list}>
          {PETS.map(def => (
            <PetCard
              key={def.id}
              def={def}
              selected={def.id === petId}
              expanded={def.id === petId || open.has(def.id)}
              onToggle={() =>
                setOpen(prev => {
                  const next = new Set(prev);
                  if (next.has(def.id)) next.delete(def.id);
                  else next.add(def.id);
                  return next;
                })
              }
              stage={progress.stage}
              onPick={() => setPetId(def.id)}
            />
          ))}
        </View>
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
  artBox: { width: 104, height: 112, alignItems: 'center', justifyContent: 'flex-end' },
  petName: { fontFamily: FONTS.displaySemi, fontSize: 24, color: THEME.ink },
  species: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.4, color: THEME.muted, marginTop: 2 },
  tagline: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 14, lineHeight: 19, color: THEME.inkSoft, marginTop: 8 },
  badge: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.4, color: THEME.accent, marginTop: 10 },
  stageLine: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  evoToggle: { alignSelf: 'flex-start' },
  evoToggleText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.accent },
  evoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  evoCol: { flex: 1, alignItems: 'center', gap: 2 },
  evoName: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.ink, textAlign: 'center' },
  evoLevel: { fontFamily: FONTS.body, fontSize: 11, color: THEME.muted },
});
