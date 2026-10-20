import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { QuestScene } from '@/components/pets/QuestScene';
import { petStageName } from '@/components/pets/registry';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { usePetProgress, XP_PER_LEVEL } from '@/lib/pet';
import { QuestCategory } from '@/lib/questPool';
import { CATEGORIES, CATEGORY_INFO, DailyQuest, MAX_REROLLS, QUEST_XP, QuestStatus, useQuests } from '@/lib/quests';

const ACircle = Animated.createAnimatedComponent(Circle);
const RING_R = 23;
const RING_LEN = 2 * Math.PI * RING_R;

function greeting(h: number): string {
  if (h < 12) return 'Good morning, traveler. Choose a path, and I will walk it with you.';
  if (h < 18) return 'Peace to you, traveler. The road is open; pick one step for today.';
  return 'The lamps are lit, traveler. There is still light enough for one more step.';
}

const CHEERS = [
  'Well done, faithful one. Your light grows brighter.',
  'That is how roads are walked: one faithful step.',
  'I saw that. Heaven did too.',
  'Small and steady. The lantern burns a little brighter.',
];

/* ------------------------------ icons ------------------------------ */

function CategoryIcon({ cat, color }: { cat: QuestCategory; color: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      {cat === 'prayer' ? (
        <>
          <Path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10Z" {...p} />
          <Path d="M12 9v11" {...p} />
        </>
      ) : cat === 'scripture' ? (
        <>
          <Path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1Z" {...p} />
          <Path d="M12 6v14" {...p} />
        </>
      ) : cat === 'service' ? (
        <Path d="M12 21 C5 15 2 11.5 2 8.5 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8.5 C22 11.5 19 15 12 21 Z" {...p} />
      ) : (
        <>
          <Path d="M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4-1.4" {...p} />
          <Circle cx={12} cy={12} r={4} {...p} />
        </>
      )}
    </Svg>
  );
}

/* ------------------------------ rings ------------------------------ */

function RhythmRing({ value, color, track, ink, label }: { value: number; color: string; track: string; ink: string; label: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withTiming(Math.min(value, 7) / 7, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [value, v]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: RING_LEN * (1 - v.get()) }));
  return (
    <Svg width={58} height={58} viewBox="0 0 58 58" accessibilityLabel={`${label}: ${value} of 7 days this week`}>
      <Circle cx={29} cy={29} r={RING_R} fill="none" stroke={track} strokeWidth={6} />
      <ACircle
        cx={29}
        cy={29}
        r={RING_R}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${RING_LEN} ${RING_LEN}`}
        animatedProps={animatedProps}
        rotation={-90}
        originX={29}
        originY={29}
      />
      <SvgText x={29} y={34} textAnchor="middle" fontFamily={FONTS.bodySemi} fontSize={13} fill={ink}>
        {`${Math.min(value, 7)}/7`}
      </SvgText>
    </Svg>
  );
}

/* ------------------------------ page ------------------------------ */

export default function QuestsScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width: screenW } = useWindowDimensions();
  const { petId, name, progress, reload } = usePetProgress();
  const q = useQuests();

  const [line, setLine] = useState(() => greeting(new Date().getHours()));
  const [celebrate, setCelebrate] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const cheer = useRef(0);

  const xpW = useSharedValue(0);
  useEffect(() => {
    xpW.set(withTiming(progress.xpInLevel / XP_PER_LEVEL, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [progress.xpInLevel, xpW]);
  const xpStyle = useAnimatedStyle(() => ({ width: `${Math.round(xpW.get() * 100)}%` }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const elder = progress.stage === 1 ? `${name} the Pilgrim` : `Elder ${name}`;
  const regular = q.quests.filter(x => x.slot !== 'bonus');
  const bonus = q.quests.find(x => x.slot === 'bonus');
  const doneCount = regular.filter(x => q.statusOf(x) === 'done').length;

  const afterGain = async (xp: number, extraLine?: string) => {
    const before = progress.level;
    setCelebrate(c => c + 1);
    await reload();
    // reload() updates progress on the next render; work out the new level from the XP that was just added.
    const after = 1 + Math.floor((progress.xp + xp) / XP_PER_LEVEL);
    if (after > before) {
      setToast(`${name} reached Level ${after}!`);
      setLine(`We have grown together! Level ${after}. The road ahead shines brighter.`);
    } else if (extraLine) setLine(extraLine);
  };

  const onQuest = async (quest: DailyQuest, status: QuestStatus) => {
    if (status === 'done' || busy) return;
    if (status === 'new') {
      await q.accept(quest);
      setLine(`A worthy path. ${quest.text} Go gently; I will keep the lantern lit.`);
      return;
    }
    setBusy(quest.id);
    const res = await q.complete(quest);
    setBusy(null);
    if (!res.ok) {
      setLine(res.message);
      return;
    }
    const left = regular.filter(x => x.id !== quest.id && q.statusOf(x) !== 'done').length;
    const msg =
      quest.slot === 'bonus'
        ? 'A hard road, bravely walked. That one counts for a great deal.'
        : left === 0
          ? 'Every quest is complete. Rest now, faithful one; tomorrow brings a new road.'
          : CHEERS[cheer.current++ % CHEERS.length];
    await afterGain(res.xp, msg);
  };

  const onSwap = async (quest: DailyQuest) => {
    const ok = await q.reroll(quest);
    setLine(ok ? 'Then take this road instead. Every path leads home.' : 'Let us keep to this road today.');
  };

  const onReflect = async () => {
    if (busy || q.reflectedToday || q.journeySteps >= 5) return;
    setBusy('journey');
    const res = await q.reflect();
    setBusy(null);
    if (!res.ok) {
      setLine(res.message);
      return;
    }
    await afterGain(
      res.xp,
      res.rewarded
        ? "You walked the whole road. Were not our hearts burning within us? The Pilgrim's lantern is yours."
        : 'Another evening on the road. He walks beside us, even unseen.',
    );
  };

  const prompt = q.journey.prompts[Math.min(q.journeySteps, 4)];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={THEME.isDark ? 'light-content' : 'dark-content'} backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <BackIcon size={16} color={THEME.ink} />
          </Pressable>
          <View style={styles.countPill}>
            <Svg width={13} height={13} viewBox="0 0 24 24">
              <Path d="M4 20 L12 4 L20 20 M8 13h8" stroke={THEME.accent} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.countText}>{doneCount} OF 4 TODAY</Text>
          </View>
        </View>
        <Text style={styles.title}>Quests</Text>
        <Text style={styles.subtitle}>Your guide has a path for you today.</Text>

        <View style={{ marginTop: 20 }}>
          <QuestScene
            width={screenW - 44}
            petId={petId}
            stage={progress.stage}
            speaker={elder.toUpperCase()}
            line={line}
            celebrate={celebrate}
            toast={toast}
          />
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.levelName}>
            {elder} · Lv {progress.level}
          </Text>
          <Text style={styles.levelXp}>
            {progress.xpInLevel} / {XP_PER_LEVEL} XP
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <Animated.View style={[styles.xpFill, xpStyle]} />
        </View>
        <Text style={styles.stageNote}>{petStageName(petId, progress.stage)}</Text>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>SPIRITUAL RHYTHMS</Text>
          <Text style={styles.sectionMeta}>This week</Text>
        </View>
        <View style={styles.ringsCard}>
          {CATEGORIES.map(cat => (
            <View key={cat} style={styles.ringCell}>
              <RhythmRing value={q.rings[cat] ?? 0} color={CATEGORY_INFO[cat].color} track={THEME.line} ink={THEME.ink} label={CATEGORY_INFO[cat].ring} />
              <Text style={styles.ringName}>{CATEGORY_INFO[cat].ring}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.ringNote}>Rhythms only grow. Missing a day never takes anything away.</Text>

        <Text style={[styles.section, { marginTop: 28 }]}>TODAY&apos;S QUESTS</Text>
        {!q.loaded ? (
          <ActivityIndicator color={THEME.accent} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ marginTop: 14, gap: 12 }}>
            {regular.map(quest => (
              <QuestCard
                key={quest.slot}
                quest={quest}
                status={q.statusOf(quest)}
                busy={busy === quest.id}
                canSwap={(q.rerolls[quest.slot] ?? 0) < MAX_REROLLS}
                onPress={onQuest}
                onSwap={onSwap}
              />
            ))}
            {bonus ? (
              <>
                <Text style={[styles.section, { marginTop: 16 }]}>
                  {bonus.tier === 'S' ? "SABBATH CHALLENGE" : 'BONUS CHALLENGE'}
                </Text>
                <QuestCard
                  quest={bonus}
                  status={q.statusOf(bonus)}
                  busy={busy === bonus.id}
                  canSwap={(q.rerolls.bonus ?? 0) < MAX_REROLLS}
                  onPress={onQuest}
                  onSwap={onSwap}
                  featured
                />
              </>
            ) : null}
          </View>
        )}

        <Text style={[styles.section, { marginTop: 28 }]}>THIS WEEK&apos;S JOURNEY</Text>
        <View style={styles.journey}>
          <View style={styles.journeyHead}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.journeyTitle}>{q.journey.title}</Text>
              <Text style={styles.cardDesc}>{q.journey.blurb}</Text>
              <Text style={styles.cardRef}>{q.journey.ref}</Text>
            </View>
            <View style={styles.xpChip}>
              <Text style={styles.xpChipText}>+80 XP</Text>
            </View>
          </View>
          <View style={styles.steps}>
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} style={[styles.step, { backgroundColor: i < q.journeySteps ? THEME.accent : THEME.line }]} />
            ))}
          </View>
          {q.journeySteps < 5 ? (
            <Text style={styles.prompt}>
              Tonight: <Text style={styles.promptItalic}>{prompt}</Text>
            </Text>
          ) : null}
          <View style={styles.journeyFoot}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M9 3h6l-1 3h-4Z M12 10v5" stroke="#C9A24B" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Rect x={7} y={6} width={10} height={14} rx={2} stroke="#C9A24B" strokeWidth={2} fill="none" />
              </Svg>
              <Text style={styles.reward}>
                {q.journeySteps >= 5 ? "Pilgrim's lantern unlocked for your nook" : `Reward: Pilgrim's lantern for your nook · ${q.journeySteps}/5`}
              </Text>
            </View>
            <Pressable
              onPress={onReflect}
              disabled={q.reflectedToday || q.journeySteps >= 5 || busy === 'journey'}
              style={({ pressed }) => [
                styles.btn,
                q.reflectedToday || q.journeySteps >= 5 ? styles.btnDone : styles.btnGo,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}>
              {busy === 'journey' ? (
                <ActivityIndicator size="small" color={THEME.accentInk} />
              ) : (
                <Text style={[styles.btnText, q.reflectedToday || q.journeySteps >= 5 ? styles.btnDoneText : styles.btnGoText]}>
                  {q.journeySteps >= 5 ? 'Complete' : q.reflectedToday ? 'Reflected' : 'Reflect tonight'}
                </Text>
              )}
            </Pressable>
          </View>
          <Pressable onPress={() => router.push('/biography')} hitSlop={6}>
            <Text style={styles.journalLink}>Write your reflection in your journal →</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>&ldquo;Your word is a lamp to my feet and a light to my path.&rdquo; — Psalm 119:105</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------ quest card ------------------------------ */

function QuestCard({
  quest,
  status,
  busy,
  canSwap,
  onPress,
  onSwap,
  featured,
}: {
  quest: DailyQuest;
  status: QuestStatus;
  busy: boolean;
  canSwap: boolean;
  onPress: (q: DailyQuest, s: QuestStatus) => void;
  onSwap: (q: DailyQuest) => void;
  featured?: boolean;
}) {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const info = CATEGORY_INFO[quest.category];
  const xp = QUEST_XP[quest.tier];
  return (
    <View
      style={[
        styles.card,
        featured && { borderColor: '#C9A24B', borderWidth: 1.5 },
        status === 'active' && { borderColor: THEME.accent, borderWidth: 1.5 },
        status === 'done' && { opacity: 0.85 },
      ]}>
      <View style={[styles.iconTile, { backgroundColor: info.tint }]}>
        <CategoryIcon cat={quest.category} color={info.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={[styles.cardTitle, status === 'done' && styles.strike]}>{quest.text}</Text>
        <Text style={styles.cardDesc}>{info.label}</Text>
        {quest.ref ? <Text style={styles.cardRef}>{quest.ref}</Text> : null}
        <View style={styles.cardFoot}>
          <View style={{ flexDirection: 'row', gap: 6, flexShrink: 1, flexWrap: 'wrap' }}>
            <View style={styles.xpChip}>
              <Text style={styles.xpChipText}>+{xp} XP</Text>
            </View>
            <View style={[styles.xpChip, { backgroundColor: info.tint }]}>
              <Text style={[styles.xpChipText, { color: info.color }]}>+1 {info.ring}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => onPress(quest, status)}
            disabled={status === 'done' || busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.btn,
              status === 'new' ? styles.btnNew : status === 'active' ? styles.btnGo : styles.btnDone,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}>
            {busy ? (
              <ActivityIndicator size="small" color={THEME.accentInk} />
            ) : (
              <Text style={[styles.btnText, status === 'new' ? styles.btnNewText : status === 'active' ? styles.btnGoText : styles.btnDoneText]}>
                {status === 'new' ? 'Accept' : status === 'active' ? 'Complete' : 'Done'}
              </Text>
            )}
          </Pressable>
        </View>
        {status === 'new' && canSwap ? (
          <Pressable onPress={() => onSwap(quest)} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.swap}>Ask for another path</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (THEME: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: THEME.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: THEME.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: THEME.pillBg },
    countText: { fontFamily: FONTS.bodySemi, fontSize: 11.5, letterSpacing: 1.4, color: THEME.pillInk },
    title: { marginTop: 14, fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 40, color: THEME.accent },
    subtitle: { marginTop: 6, fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 15, color: THEME.inkSoft },
    levelRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
    levelName: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.ink },
    levelXp: { fontFamily: FONTS.body, fontSize: 13, color: THEME.muted },
    xpTrack: { marginTop: 8, height: 10, borderRadius: 999, backgroundColor: THEME.line, overflow: 'hidden' },
    xpFill: { height: 10, borderRadius: 999, backgroundColor: THEME.accent },
    stageNote: { marginTop: 6, fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 12, color: THEME.muted },
    sectionRow: { marginTop: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    section: { fontFamily: FONTS.bodySemi, fontSize: 12, letterSpacing: 2, color: THEME.ink },
    sectionMeta: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
    ringsCard: {
      marginTop: 14,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      paddingHorizontal: 6,
      borderRadius: 24,
      backgroundColor: THEME.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: THEME.line,
    },
    ringCell: { alignItems: 'center', gap: 8 },
    ringName: { fontFamily: FONTS.bodySemi, fontSize: 11.5, color: THEME.ink },
    ringNote: { marginTop: 10, marginHorizontal: 2, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: THEME.muted },
    card: {
      flexDirection: 'row',
      gap: 14,
      padding: 16,
      borderRadius: 22,
      backgroundColor: THEME.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: THEME.line,
    },
    iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: FONTS.display, fontSize: 17, lineHeight: 23, color: THEME.ink },
    strike: { textDecorationLine: 'line-through', color: THEME.muted },
    cardDesc: { fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 18, color: THEME.inkSoft },
    cardRef: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 12, color: THEME.muted },
    cardFoot: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    xpChip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: THEME.accent + '22' },
    xpChipText: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 0.4, color: THEME.accent },
    btn: { height: 36, minWidth: 84, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    btnNew: { borderWidth: 1, borderColor: THEME.inkSoft },
    btnGo: { backgroundColor: THEME.accent },
    btnDone: { backgroundColor: 'rgba(143,198,169,0.2)' },
    btnText: { fontFamily: FONTS.bodySemi, fontSize: 13 },
    btnNewText: { color: THEME.ink },
    btnGoText: { color: THEME.accentInk },
    btnDoneText: { color: '#4F9C7A' },
    swap: { marginTop: 6, fontFamily: FONTS.body, fontSize: 12, color: THEME.muted, textDecorationLine: 'underline' },
    journey: {
      marginTop: 14,
      padding: 18,
      borderRadius: 24,
      backgroundColor: THEME.surface,
      borderWidth: 1,
      borderColor: THEME.accent + '55',
    },
    journeyHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    journeyTitle: { fontFamily: FONTS.display, fontSize: 21, color: THEME.ink },
    steps: { marginTop: 14, flexDirection: 'row', gap: 6 },
    step: { flex: 1, height: 8, borderRadius: 4 },
    prompt: { marginTop: 12, fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: THEME.inkSoft },
    promptItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.ink },
    journeyFoot: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    reward: { flex: 1, fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: THEME.inkSoft },
    journalLink: { marginTop: 12, fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.accent },
    footer: { marginTop: 32, textAlign: 'center', fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 13, lineHeight: 19, color: THEME.muted },
  });
