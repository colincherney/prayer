import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { COMPANION_INFO, companionGroup, STAGE_LEVELS } from '@/components/pets/companionInfo';
import { Acting } from '@/components/pets/petActing';
import { Pet, PetId, PETS, isPetId } from '@/components/pets/registry';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, mixColors, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { metDates, petProgressFromXp, usePetProgress, XP_PER_LEVEL } from '@/lib/pet';
import { useReleases } from '@/lib/releases';

type Tab = 'about' | 'evolution' | 'together';
const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'evolution', label: 'Evolution' },
  { id: 'together', label: 'Together' },
];
const HERO_H = 330;
const HERO_PET = 210;
const EVO = 74;
const GROUP_BADGE = { core: 'CORE', seasonal: 'SEASONAL', monthly: 'MONTHLY' } as const;

function Chevron({ left, color }: { left?: boolean; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={left ? 'M15 5L8 12L15 19' : 'M9 5L16 12L9 19'} />
    </Svg>
  );
}

/** The three stages, joined by lines, with the current one marked. Arrive one per frame to keep opening smooth. */
function EvolutionTab({ id, stage, name, styles }: { id: PetId; stage: 1 | 2 | 3; name: string; styles: ReturnType<typeof makeStyles> }) {
  const def = PETS.find(p => p.id === id)!;
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    if (mounted >= 3) return;
    const frame = requestAnimationFrame(() => setMounted(count => count + 1));
    return () => cancelAnimationFrame(frame);
  }, [mounted]);
  return (
    <View>
      <View style={styles.evoRow}>
        {([1, 2, 3] as const).map(st => (
          <React.Fragment key={st}>
            {st > 1 ? <View style={styles.evoLine} /> : null}
            <View style={[styles.evoCol, st === stage && styles.evoNow]}>
              {st === stage ? <Text style={styles.nowPill}>NOW</Text> : null}
              <View style={{ height: (EVO * 260) / 240, opacity: st > stage ? 0.45 : 1 }}>
                {st <= mounted ? <Pet id={id} stage={st} size={EVO} /> : null}
              </View>
              <Text style={styles.evoLevel}>LV {STAGE_LEVELS[st - 1]}</Text>
              <Text numberOfLines={2} style={styles.evoName}>{def.stages[st - 1]}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.body}>
        {stage === 3
          ? <><Text style={styles.bold}>Radiant.</Text> {name} has reached their final form.</>
          : <>{name} becomes <Text style={styles.bold}>{def.stages[stage]}</Text> at level {STAGE_LEVELS[stage]}.</>}
      </Text>
    </View>
  );
}

export default function CompanionScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { petId, name: currentName, xpByPet, setPetId } = usePetProgress();
  const { isReleased } = useReleases();
  const [tab, setTab] = useState<Tab>('about');
  const [walking, setWalking] = useState(false);
  const [now] = useState(() => Date.now());

  const out = PETS.filter(def => !def.scheduled || isReleased(`pet:${def.id}`));
  const id: PetId = isPetId(params.id) ? params.id : petId;
  const def = PETS.find(p => p.id === id) ?? PETS[0];
  const index = out.findIndex(p => p.id === id);
  const info = COMPANION_INFO[id];
  const xp = xpByPet[id] ?? 0;
  const own = petProgressFromXp(xp);
  const isCurrent = id === petId;
  const name = isCurrent ? currentName : def.name;
  const metOn = metDates()[id];
  const daysWalked = metOn ? Math.max(1, Math.ceil((now - Date.parse(metOn)) / 86400000)) : null;
  const group = companionGroup(id);

  const go = (step: number) => {
    if (out.length < 2) return;
    const next = out[(Math.max(index, 0) + step + out.length) % out.length];
    router.setParams({ id: next.id });
  };
  const walk = async () => {
    if (isCurrent || walking) return;
    setWalking(true);
    await setPetId(id);
    setWalking(false);
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: HERO_H + insets.top }]}>
          <LinearGradient colors={[mixColors(info.hue, '#FFFFFF', 0.12), mixColors(info.hue, '#000000', 0.45)]} style={StyleSheet.absoluteFill} />
          {/* Soft beams of light across the scene. */}
          <View pointerEvents="none" style={[styles.beam, { left: '42%', top: -60 }]} />
          <View pointerEvents="none" style={[styles.beam, { left: '72%', top: -40, width: 34, opacity: 0.06 }]} />
          <View pointerEvents="none" style={[styles.pedestal, { top: insets.top + HERO_H - 70 }]} />
          <View style={[styles.heroBar, { top: insets.top + 10 }]}>
            <Pressable onPress={() => router.back()} style={styles.heroBtn} accessibilityRole="button" accessibilityLabel="Back">
              <BackIcon size={15} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroNo}>No. {String(PETS.findIndex(p => p.id === id) + 1).padStart(3, '0')}</Text>
          </View>
          <View style={[styles.heroPet, { top: insets.top + HERO_H - 52 - (HERO_PET * 260) / 240 }]}>
            <Acting petId={id} size={HERO_PET}>
              <Pet id={id} stage={own.stage} size={HERO_PET} />
            </Acting>
          </View>
          {out.length > 1 ? (
            <>
              <Pressable onPress={() => go(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous companion"
                style={[styles.arrow, { left: 12, top: insets.top + HERO_H / 2 }]}>
                <Chevron left color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={() => go(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next companion"
                style={[styles.arrow, { right: 12, top: insets.top + HERO_H / 2 }]}>
                <Chevron color="#FFFFFF" />
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" numberOfLines={1} style={styles.name}>{name}</Text>
            <View style={styles.badges}>
              <Text style={styles.badge}>{GROUP_BADGE[group]}</Text>
              {own.stage === 3 ? <Text style={[styles.badge, styles.badgeGold]}>✦ RADIANT</Text> : null}
            </View>
          </View>
          <Text style={styles.species}>{def.species.toUpperCase()}</Text>

          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map(t => (
              <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }}
                style={[styles.tab, tab === t.id && styles.tabOn]}>
                <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'about' ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.tagline}>{def.tagline}</Text>
              <View style={styles.pair}>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>HABITAT</Text>
                  <Text style={styles.factValue}>{info.habitat}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>LOVES</Text>
                  <Text style={styles.factValue}>{info.loves}</Text>
                </View>
              </View>
              <View style={[styles.verse, { backgroundColor: mixColors(theme.surface, info.hue, 0.18) }]}>
                <Text style={styles.factLabel}>FAVORITE VERSE</Text>
                <Text style={styles.verseText}>&ldquo;{info.verse.text}&rdquo;</Text>
                <Text style={styles.verseRef}>{info.verse.ref.toUpperCase()}</Text>
              </View>
            </View>
          ) : tab === 'evolution' ? (
            <EvolutionTab key={id} id={id} stage={own.stage} name={name} styles={styles} />
          ) : (
            <View style={{ gap: 14 }}>
              <View style={styles.pair}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{own.level}</Text>
                  <Text style={styles.statLabel}>LEVEL</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{xp}</Text>
                  <Text style={styles.statLabel}>XP TOGETHER</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{daysWalked ?? '—'}</Text>
                  <Text style={styles.statLabel}>DAYS WALKED</Text>
                </View>
              </View>
              <View style={styles.growthHead}>
                <Text style={styles.growthLabel}>Growth</Text>
                <Text style={styles.growthLabel}>Level {own.level + 1} next</Text>
              </View>
              <View style={styles.growthTrack}>
                <View style={[styles.growthFill, { width: `${(own.xpInLevel / XP_PER_LEVEL) * 100}%` }]} />
              </View>
              <Text style={styles.body}>
                {metOn
                  ? <>Met on <Text style={styles.bold}>{new Date(metOn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text> · every prayer you offer helps {name} grow.</>
                  : xp > 0
                    ? `You've walked together before. Every prayer you offer helps ${name} grow.`
                    : `You haven't walked together yet. Choose ${name} to start.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={walk} disabled={isCurrent || walking} accessibilityRole="button"
          accessibilityState={{ disabled: isCurrent || walking }}
          style={({ pressed }) => [styles.walk, isCurrent && styles.walkCurrent, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Text style={[styles.walkText, isCurrent && styles.walkTextCurrent]}>{isCurrent ? `${name} is walking with you` : `Walk with ${name}`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  hero: { overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  beam: { position: 'absolute', width: 70, height: 520, backgroundColor: '#FFFFFF', opacity: 0.08, transform: [{ rotate: '24deg' }] },
  pedestal: { position: 'absolute', alignSelf: 'center', width: 230, height: 46, borderRadius: 115, backgroundColor: 'rgba(0,0,0,0.25)' },
  heroBar: { position: 'absolute', left: 16, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroNo: { fontFamily: FONTS.display, fontSize: 15, letterSpacing: 1, fontVariant: ['lining-nums'], color: 'rgba(255,255,255,0.9)' },
  heroPet: { position: 'absolute', alignSelf: 'center', width: HERO_PET },
  arrow: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  content: { paddingHorizontal: 22, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { flexShrink: 1, fontFamily: FONTS.display, fontSize: 34, lineHeight: 40, color: theme.ink },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: theme.line, fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 1.2, color: theme.inkSoft },
  badgeGold: { borderColor: '#C9A24B', color: '#E8C27A' },
  species: { marginTop: 4, fontFamily: FONTS.bodyBold, fontSize: 11, letterSpacing: 2, color: theme.muted },
  tabs: { flexDirection: 'row', marginTop: 18, marginBottom: 18, padding: 4, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
  tab: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: mixColors(theme.surface, theme.accent, 0.25) },
  tabText: { fontFamily: FONTS.display, fontSize: 14, color: theme.inkSoft },
  tabTextOn: { color: theme.ink },
  tagline: { fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 16, lineHeight: 23, color: theme.inkSoft },
  pair: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, gap: 4 },
  factLabel: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 1.6, color: theme.muted },
  factValue: { fontFamily: FONTS.display, fontSize: 15, color: theme.ink },
  verse: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.line, gap: 6 },
  verseText: { fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 17, lineHeight: 24, color: theme.ink },
  verseRef: { fontFamily: FONTS.bodyBold, fontSize: 11, letterSpacing: 1.4, color: theme.muted },
  evoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  evoLine: { width: 14, height: 1.5, backgroundColor: theme.line },
  evoCol: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 16, gap: 2 },
  evoNow: { borderWidth: 1, borderColor: theme.accent, backgroundColor: mixColors(theme.surface, theme.accent, 0.1) },
  nowPill: { position: 'absolute', top: -9, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, backgroundColor: theme.accent, fontFamily: FONTS.bodyBold, fontSize: 9, color: '#2A1A0C' },
  evoLevel: { overflow: 'hidden', paddingHorizontal: 6, borderRadius: 6, backgroundColor: theme.surface, fontFamily: FONTS.bodyBold, fontSize: 9.5, fontVariant: ['lining-nums'], color: theme.inkSoft },
  evoName: { fontFamily: FONTS.display, fontSize: 13, color: theme.ink, textAlign: 'center' },
  body: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: theme.inkSoft },
  bold: { fontFamily: FONTS.bodyBold, color: theme.ink },
  stat: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: FONTS.display, fontSize: 24, fontVariant: ['lining-nums'], color: theme.ink },
  statLabel: { fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 1.2, color: theme.muted, textAlign: 'center' },
  growthHead: { flexDirection: 'row', justifyContent: 'space-between' },
  growthLabel: { fontFamily: FONTS.body, fontSize: 13, color: theme.inkSoft },
  growthTrack: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: theme.line },
  growthFill: { height: '100%', backgroundColor: theme.accent },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, backgroundColor: theme.bg },
  walk: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent, borderBottomWidth: 3, borderBottomColor: 'rgba(0,0,0,0.2)' },
  walkCurrent: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderBottomWidth: 1 },
  walkText: { fontFamily: FONTS.displaySemi, fontSize: 18, color: '#2A1A0C' },
  walkTextCurrent: { fontSize: 15, color: theme.inkSoft },
});
