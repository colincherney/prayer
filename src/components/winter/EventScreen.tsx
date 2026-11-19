import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrinketArt } from '@/components/pets/Trinket';
import { TRINKET_INFO, TrinketId } from '@/components/pets/trinketArt';
import { EvolutionMoment } from './EvolutionMoment';
import { IntroClip } from './IntroClip';
import { EventSkin, Palette, ProgressBar, StageImage, useSkin, WF, useWinterFonts } from './winterUi';
import { useAuth } from '@/lib/auth';
import { resetDropsSeen } from '@/lib/drops';
import {
  addDays,
  chapterFor,
  communityTitle,
  daysBetween,
  daysLeft,
  markEventSeen,
  nextStep,
  setDevToday,
  setEventNotifications,
  shortDate,
  useEvent,
  WinterState,
} from '@/lib/winterEvent';

// A seasonal event's screen (designs: in-app-winter-hub@3x.png, in-app-swamp-hub@3x.png), drawn from the skin of the
// event it's shown for (see winterUi.tsx). The goal is the companion: its first stage arrives with your first prayer
// of the season, the second with four challenges, and the final form when every challenge is done.

export function EventScreen() {
  const skin = useSkin();
  const W = skin.palette;
  const styles = useMemo(() => makeStyles(W), [W]);
  const Backdrop = skin.Backdrop;
  const fontsLoaded = useWinterFonts();
  const insets = useSafeAreaInsets();
  const { state, today, phase, devToday } = useEvent(skin.id, { poll: true });
  const { session } = useAuth();
  const [challengesOpen, setChallengesOpen] = useState(true);
  const [replay, setReplay] = useState(false);
  const [moment, setMoment] = useState<number | null>(null);

  if (!fontsLoaded || !state) {
    return <View style={[styles.root, { justifyContent: 'center' }]}><StatusBar barStyle="light-content" /></View>;
  }
  if (!state.event.is_active) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.title}>{state.event.title}</Text>
        <Text style={styles.muted}>This event isn&apos;t running right now.</Text>
        <Pressable onPress={() => router.back()} style={[styles.cta, { alignSelf: 'stretch', marginTop: 24 }]}>
          <Text style={styles.ctaText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const { event, progress, community } = state;
  const c = event.config;
  const stage = progress?.stage_unlocked ?? 0;
  const done = progress?.challenges_completed ?? [];
  const closed = progress?.challenges_closed ?? [];
  const prayedToday = !!progress?.prayer_days.includes(today);
  const chapterNow = chapterFor(c, today);
  // Finishing all 10 challenges is the whole reward, received straight away: the Frost Lord and these keepsakes.
  const keepsakes = (c.completion_rewards ?? []) as TrinketId[];
  const allDone = stage >= 3;
  const STAGE_NAMES = [1, 2, 3].map(n => c.evolutions.find(e => e.stage === n)?.name ?? '');
  const Season = skin.season.charAt(0).toUpperCase() + skin.season.slice(1);
  // As big as fits under the top row: the whole picture, including the Frost Mage's and Frost Lord's tall hats.
  const heroFrame = skin.frames[(Math.min(3, Math.max(1, stage)) as 1 | 2 | 3)];
  const heroH = Math.min(240, Math.round((250 * heroFrame.body) / heroFrame.h));

  const caption =
    phase === 'before' ? `${skin.kicker} · STARTS ${shortDate(event.starts_on).toUpperCase()}`
    : phase === 'live' ? `${skin.kicker} · ${daysLeft(event, today)} DAY${daysLeft(event, today) === 1 ? '' : 'S'} LEFT`
    : `${event.title.toUpperCase()} HAS ENDED`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Header: the sky, and the companion as it is now */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Backdrop />
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={styles.back}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.caption}>{caption}</Text>
            {phase === 'live' ? (
              <Pressable onPress={() => setReplay(true)} accessibilityRole="button" accessibilityLabel="Play the intro clip" style={styles.clipPill}>
                <Text style={styles.clipText}>▶ Play clip</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.heroArt}>
            <StageImage stage={stage} height={heroH} />
            {stage === 0 ? <Text style={styles.heroHint}>{skin.heroHint}</Text> : null}
          </View>
        </View>

        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.title}>{event.title}</Text>

          {/* The goal: the companion line */}
          <Text style={styles.sectionLabel}>YOUR COMPANION</Text>
          <View style={styles.pathRow}>
            {STAGE_NAMES.map((name, i) => {
              const s = i + 1;
              const have = stage >= s;
              const next = !have && (s === stage + 1 || (s === 3 && progress?.frost_lord_ready));
              const need = s === 1 ? `First ${skin.season} prayer`
                : s === 2 ? `${c.evolutions[1]?.unlock.min_challenges ?? 4} challenges`
                : `All ${c.challenges.length} challenges`;
              return (
                <View key={name} style={[styles.pathCard, have && styles.pathHave, next && styles.pathNext]}>
                  <StageImage stage={s} height={s === 3 ? 74 : 64} dim={!have} />
                  <Text numberOfLines={1} style={[styles.pathName, !have && { color: W.muted }]}>{name}</Text>
                  <Text numberOfLines={2} style={styles.pathNeed}>{have ? 'With you' : need}</Text>
                </View>
              );
            })}
          </View>
          {/* Once it ends the event is in the vault: only a look back at how it went, nothing left to do or play. */}
          {phase === 'ended' || phase === 'grace' ? (
            <Summary state={state} skin={skin} styles={styles} stageNames={STAGE_NAMES} />
          ) : (
            <>
              {/* Where we are in the season (just a guide: every challenge is open the whole time) */}
              <View style={styles.chapters}>
                {c.chapters.map(ch => {
                  const isDone = today > ch.ends_on;
                  const isNow = ch.key === chapterNow;
                  return (
                    <View key={ch.key} style={[styles.chapter, isNow && styles.chapterSelected, !isDone && !isNow && { opacity: 0.55 }]}>
                      <View style={styles.chapterTop}>
                        <Text numberOfLines={1} style={styles.chapterName}>{ch.title}</Text>
                        <View style={[styles.dot, { backgroundColor: isDone ? W.gold : isNow ? W.teal : W.track }]} />
                      </View>
                      <Text numberOfLines={1} style={styles.chapterDates}>{shortDate(ch.starts_on)} to {shortDate(ch.ends_on)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Challenges */}
              <View style={styles.countRow}>
                <Text style={styles.bigNumber}>{done.length}</Text>
                <Text style={styles.countOf}> of {c.challenges.length} challenges</Text>
              </View>
              <ProgressBar value={done.length / c.challenges.length} color={W.gold} />
              <Text style={styles.nextStep}>{nextStep(state, today)}</Text>
              <Pressable onPress={() => setChallengesOpen(o => !o)} accessibilityRole="button" accessibilityState={{ expanded: challengesOpen }} style={styles.toggle}>
                <Text style={styles.toggleText}>{challengesOpen ? 'Hide the challenges ▴' : 'Show the challenges ▾'}</Text>
              </Pressable>
              {challengesOpen ? (
                <View style={{ marginBottom: 6 }}>
                  {closed.length > 0 && phase === 'live' ? (
                    <Text style={styles.closedNote}>
                      {closed.length === 1 ? 'One challenge has' : `${closed.length} challenges have`} closed for this season, so {STAGE_NAMES[2]} can&apos;t be crowned this time. Your companion still grows.
                    </Text>
                  ) : null}
                  {c.challenges.map(ch => {
                    const isDone = done.includes(ch.key);
                    const isClosed = closed.includes(ch.key);
                    return (
                      <View key={ch.key} style={styles.row}>
                        <View style={[styles.mark, isDone ? styles.markDone : isClosed ? styles.markClosed : styles.markOpen]}>
                          {isDone ? <Text style={styles.markText}>✓</Text> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowTitle, isClosed && { color: W.faint }]}>{ch.title}</Text>
                          <Text style={[styles.rowSub, isClosed && { color: W.faint }]}>
                            {isClosed ? 'Closed for this season' : ch.detail}{!isDone && !isClosed ? challengeCount(ch.rule, state) : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* The reward: everything at once for finishing all 10 */}
              <View style={[styles.rewardCard, allDone && styles.rewardCardDone]}>
                <Text style={styles.sectionLabel}>{allDone ? 'YOURS NOW' : `FINISH ALL ${c.challenges.length} TO RECEIVE`}</Text>
                <View style={styles.rewardRow}>
                  <StageImage stage={3} height={64} dim={!allDone} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, !allDone && { color: W.muted }]}>{STAGE_NAMES[2]}</Text>
                    <Text style={styles.rowSub}>{allDone ? 'Walking with you' : `${STAGE_NAMES[0]} grows into his final form`}</Text>
                  </View>
                </View>
                <View style={styles.keepsakeRow}>
                  {keepsakes.map(id => (
                    <View key={id} style={styles.keepsake}>
                      <TrinketArt id={id} size={48} animated={false} dim={!allDone} />
                      <Text numberOfLines={2} style={[styles.keepsakeName, allDone && { color: W.cream }]}>{TRINKET_INFO[id]?.name ?? id}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.rowSub}>
                  {allDone ? `All five ${skin.season} keepsakes are on your shelf.` : `Plus all five ${skin.season} keepsakes, straight onto your shelf. Nothing to claim.`}
                </Text>
              </View>
            </>
          )}

          {/* Everyone together */}
          <View style={styles.community}>
            <Text style={styles.communityTitle}>{communityTitle(c.community_goal)}</Text>
            <Text style={styles.rowSub}>
              {community.value.toLocaleString('en-US')} candles lit together · {community.rewarded ? `${c.community_goal.reward_name ?? 'the reward'} unlocked for everyone who prayed` : `unlocks ${c.community_goal.reward_name ?? 'a reward'}`}
            </Text>
            <View style={{ marginTop: 10 }}>
              <ProgressBar value={community.target ? community.value / community.target : 0} color={W.teal} height={7} />
            </View>
          </View>

          {phase === 'before' ? (
            <View style={[styles.cta, styles.ctaOutline]}><Text style={[styles.ctaText, { color: W.cream }]}>Starts {shortDate(event.starts_on)}</Text></View>
          ) : phase === 'live' ? (
            prayedToday ? (
              <View style={[styles.cta, styles.ctaOutline]} accessibilityState={{ disabled: true }}><Text style={[styles.ctaText, { color: W.cream }]}>Prayed today ✓</Text></View>
            ) : (
              <Pressable onPress={() => router.push('/explore')} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}>
                <Text style={styles.ctaText}>Pray today&apos;s prayer</Text>
              </Pressable>
            )
          ) : null}

          {phase === 'live' || phase === 'before' ? (
            <View style={styles.reminder}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{Season} reminders</Text>
                <Text style={styles.rowSub}>At most one a day, at 9am: when it starts, when your companion grows, halfway, and the last days.</Text>
              </View>
              <Switch value={!!progress?.event_notifications} onValueChange={on => setEventNotifications(skin.id, on)}
                trackColor={{ false: W.track, true: W.teal }} thumbColor={W.cream} accessibilityLabel={`${Season} reminders`} />
            </View>
          ) : null}

          {__DEV__ ? (
            <View style={styles.dev}>
              <Text style={styles.sectionLabel}>DEV · PRETEND TODAY IS {devToday ? shortDate(devToday).toUpperCase() : 'THE REAL DATE'}</Text>
              <View style={styles.devRow}>
                {skin.devDates.map(d => (
                  <Pressable key={d} onPress={() => setDevToday(d)} style={[styles.devChip, devToday === d && { borderColor: W.teal }]}>
                    <Text style={styles.devText}>{shortDate(d)}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setDevToday(null)} style={[styles.devChip, !devToday && { borderColor: W.teal }]}>
                  <Text style={styles.devText}>Real date</Text>
                </Pressable>
                <Pressable onPress={() => setMoment(Math.max(1, stage))} style={styles.devChip}>
                  <Text style={styles.devText}>Replay celebration</Text>
                </Pressable>
                <Pressable onPress={() => session && resetDropsSeen(session.user.id)} style={styles.devChip}>
                  <Text style={styles.devText}>Reset &quot;What&apos;s new&quot;</Text>
                </Pressable>
              </View>
              <Text style={styles.rowSub}>
                &quot;What&apos;s new&quot; follows the date too: pick a date, then go to the home screen to see that drop.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <IntroClip visible={replay} mode="replay" onBegin={() => setReplay(false)} onClose={() => setReplay(false)} />
      <EvolutionMoment visible={moment !== null} stage={moment ?? 0} onDone={() => {
        const s = moment ?? 0;
        setMoment(null);
        markEventSeen(skin.id, 'stage', s).catch(() => {});
      }} />
    </View>
  );
}

/** "· 12 of 15" for the challenges that count something. */
function challengeCount(rule: WinterState['event']['config']['challenges'][number]['rule'], state: WinterState): string {
  const p = state.progress;
  if (!p) return '';
  switch (rule.type) {
    case 'prayers': return ` · ${Math.min(p.event_prayer_count, rule.min)} of ${rule.min}`;
    case 'candles': return ` · ${Math.min(p.candles_lit, rule.min)} of ${rule.min}`;
    case 'partner': return ` · ${Math.min(p.partner_sessions, rule.min)} of ${rule.min}`;
    case 'streak': return ` · best ${Math.min(p.longest_streak, rule.min)} of ${rule.min}`;
    case 'wreath': return ` · ${p.wreath_candles_lit} of 4`;
    case 'weeks': {
      // the same weeks the database counts: 7-day blocks from the event's start, 3 days each (2 in a short last one)
      let full = 0;
      for (let from = state.event.starts_on; from <= state.event.ends_on; from = addDays(from, 7)) {
        const to = addDays(from, 6) > state.event.ends_on ? state.event.ends_on : addDays(from, 6);
        const need = rule.days ?? (daysBetween(from, to) + 1 < 5 ? 2 : 3);
        if (p.prayer_days.filter(d => d >= from && d <= to).length >= need) full += 1;
      }
      return ` · ${Math.min(full, rule.min)} of ${rule.min} weeks`;
    }
    // nights, mornings and different people are counted by the server and not sent down one by one
    case 'hours':
    case 'people':
    case 'shared':
    case 'journal':
    case 'notes':
    case 'quests':
      return '';
    case 'days_in_range': {
      const n = p.prayer_days.filter(d => d >= rule.from && d <= rule.to).length;
      return rule.min > 1 ? ` · ${Math.min(n, rule.min)} of ${rule.min}` : '';
    }
  }
}

/** After the event: how it went. */
function Summary({ state, skin, styles, stageNames }: { state: WinterState; skin: EventSkin; styles: ReturnType<typeof makeStyles>; stageNames: string[] }) {
  const p = state.progress;
  const kept = useMemo(() => (p?.rewards_claimed ?? []).filter(r => r !== 'frost_lord') as TrinketId[], [p]);
  return (
    <View style={styles.summary}>
      <Text style={styles.communityTitle}>{skin.summaryTitle}</Text>
      <Text style={styles.rowSub}>
        {stageNames[Math.max(0, (p?.stage_unlocked ?? 1) - 1)]} · {p?.event_prayer_count ?? 0} {skin.season} prayers · {p?.challenges_completed.length ?? 0} of {state.event.config.challenges.length} challenges
      </Text>
      {kept.length ? (
        <View style={styles.keptRow}>
          {kept.map(id => <TrinketArt key={id} id={id} size={52} animated={false} />)}
        </View>
      ) : null}
      <Text style={[styles.rowSub, { marginTop: 8 }]}>
        Together: {state.community.value.toLocaleString('en-US')} candles lit{state.community.rewarded ? `, and ${state.event.config.community_goal.reward_name ?? 'the reward'} was unlocked.` : '.'}
      </Text>
    </View>
  );
}

const makeStyles = (W: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: W.sheet },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  header: { height: 400, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(251,244,230,0.12)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: W.cream, fontSize: 28, lineHeight: 30, marginTop: -3, fontFamily: WF.medium },
  caption: { flex: 1, fontFamily: WF.semi, fontSize: 11, letterSpacing: 2, color: W.ice },
  clipPill: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(15,24,52,0.55)', justifyContent: 'center' },
  clipText: { fontFamily: WF.semi, fontSize: 12, color: W.cream },
  heroArt: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 34 },
  heroHint: { position: 'absolute', bottom: 120, fontFamily: WF.semi, fontSize: 15, color: W.cream },
  sheet: { marginTop: -28, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: W.sheet, paddingHorizontal: 20, paddingTop: 22, borderTopWidth: 1, borderColor: 'rgba(191,230,255,0.12)' },
  title: { fontFamily: WF.bold, fontSize: 34, lineHeight: 40, color: W.cream },
  muted: { fontFamily: WF.regular, fontSize: 15, color: W.muted, textAlign: 'center' },
  sectionLabel: { fontFamily: WF.semi, fontSize: 11, letterSpacing: 2, color: W.ice, marginTop: 16, marginBottom: 8 },
  pathRow: { flexDirection: 'row', gap: 8 },
  pathCard: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, backgroundColor: W.card, borderWidth: 1.5, borderColor: 'transparent' },
  pathHave: { borderColor: W.gold },
  pathNext: { borderColor: W.teal, backgroundColor: W.cardOn },
  pathName: { fontFamily: WF.semi, fontSize: 13, color: W.cream, marginTop: 6 },
  pathNeed: { fontFamily: WF.regular, fontSize: 11, lineHeight: 14, color: W.muted, textAlign: 'center', marginTop: 2 },
  chapters: { flexDirection: 'row', gap: 8, marginTop: 20 },
  chapter: { flex: 1, padding: 11, borderRadius: 16, backgroundColor: W.card, borderWidth: 2, borderColor: 'transparent' },
  chapterSelected: { borderColor: W.teal, backgroundColor: W.cardOn },
  chapterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  chapterName: { flexShrink: 1, fontFamily: WF.semi, fontSize: 14, color: W.cream },
  dot: { width: 9, height: 9, borderRadius: 5 },
  chapterDates: { fontFamily: WF.regular, fontSize: 11.5, color: W.muted, marginTop: 6 },
  countRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 22, marginBottom: 10 },
  bigNumber: { fontFamily: WF.semi, fontSize: 38, color: W.cream },
  countOf: { fontFamily: WF.regular, fontSize: 18, color: W.muted },
  nextStep: { fontFamily: WF.medium, fontSize: 14, color: W.gold, marginTop: 10 },
  toggle: { paddingVertical: 10 },
  toggleText: { fontFamily: WF.semi, fontSize: 13, color: W.ice },
  closedNote: { fontFamily: WF.regular, fontSize: 13, lineHeight: 19, color: W.muted, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: W.line },
  mark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  markDone: { backgroundColor: W.gold },
  markOpen: { borderWidth: 2, borderColor: W.teal },
  markClosed: { borderWidth: 2, borderColor: W.track },
  markText: { color: W.navy, fontFamily: WF.bold, fontSize: 14 },
  rowTitle: { fontFamily: WF.semi, fontSize: 16, color: W.cream },
  rowSub: { fontFamily: WF.regular, fontSize: 13, lineHeight: 18, color: W.muted, marginTop: 2 },
  community: { marginTop: 22 },
  rewardCard: { marginTop: 18, padding: 14, borderRadius: 18, backgroundColor: W.card, borderWidth: 1.5, borderColor: 'transparent', gap: 10 },
  rewardCardDone: { borderColor: W.gold },
  rewardRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  keepsakeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  keepsake: { alignItems: 'center', width: '19%' },
  keepsakeName: { fontFamily: WF.regular, fontSize: 10.5, lineHeight: 13, color: W.muted, textAlign: 'center', marginTop: 2 },
  communityTitle: { fontFamily: WF.bold, fontSize: 20, color: W.cream },
  cta: { height: 56, borderRadius: 28, backgroundColor: W.gold, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  ctaOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(251,244,230,0.35)' },
  ctaText: { fontFamily: WF.bold, fontSize: 20, color: W.navy },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  summary: { marginTop: 22, padding: 16, borderRadius: 18, backgroundColor: W.card },
  keptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  dev: { marginTop: 26, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(95,227,192,0.35)', borderStyle: 'dashed' },
  devRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  devChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: W.track },
  devText: { fontFamily: WF.medium, fontSize: 12, color: W.cream },
});
