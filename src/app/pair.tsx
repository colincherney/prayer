import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Pill,
  PrimaryButton,
  ScreenHeader,
  SectionLabel,
  Squiggle,
} from '@/components/saint/Common';
import {
  ArrowIcon,
  HeartIcon,
  MicIcon,
  PrayingIcon,
  SparkleIcon,
  UserIcon,
} from '@/components/saint/Icons';
import { FONTS, THEME } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

type Phase = 'intent' | 'searching' | 'paired' | 'praying' | 'blessing';

const PARTNER_INTENT =
  'Carrying my father — his health, his fear, his stubborn faith. Lord meet him where he is.';
const PARTNER_LOC = 'A friend in Ohio';

export default function PairingScreen() {
  const fontsLoaded = useSaintFonts();
  const [phase, setPhase] = useState<Phase>('intent');
  const [intent, setIntent] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  const [timer, setTimer] = useState(120);

  // searching animation + auto-advance
  useEffect(() => {
    if (phase !== 'searching') return;
    const tick = setInterval(() => setSearchProgress(p => Math.min(100, p + 4)), 100);
    const done = setTimeout(() => setPhase('paired'), 2800);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'praying') return;
    const tick = setInterval(() => {
      setTimer(s => {
        if (s <= 1) {
          clearInterval(tick);
          setPhase('blessing');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  if (phase === 'intent') return <IntentPhase intent={intent} setIntent={setIntent} onNext={() => setPhase('searching')} />;
  if (phase === 'searching') return <SearchingPhase progress={searchProgress} />;
  if (phase === 'paired')
    return (
      <PairedPhase
        intent={intent}
        onBegin={() => {
          setTimer(120);
          setPhase('praying');
        }}
      />
    );
  if (phase === 'praying') return <PrayingPhase timer={timer} onEnd={() => setPhase('blessing')} />;
  return <BlessingPhase onAgain={() => setPhase('intent')} onDone={() => router.dismissAll()} />;
}

/* -------------------- Phase 1: write intent -------------------- */
const IntentPhase: React.FC<{ intent: string; setIntent: (s: string) => void; onNext: () => void }> = ({
  intent,
  setIntent,
  onNext,
}) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Pray Right Now"
        subtitle="You'll be paired with one anonymous soul."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 22 }}>
        <View style={styles.howCard}>
          <SparkleIcon size={16} color={THEME.pillInk} />
          <View style={{ flex: 1 }}>
            <Text style={styles.howTitle}>HOW THIS WORKS</Text>
            <Text style={styles.howBody}>
              You and one other person share a short intention, then pray for each other for two minutes. Both anonymous. Both equal.
            </Text>
          </View>
        </View>

        <SectionLabel>What should they pray for?</SectionLabel>
        <View style={styles.intentCard}>
          <TextInput
            value={intent}
            onChangeText={setIntent}
            placeholder="One or two sentences. They'll see only this — never your name."
            placeholderTextColor={THEME.muted}
            multiline
            maxLength={240}
            style={styles.intentInput}
          />
          <View style={styles.intentFoot}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MicIcon size={13} color={THEME.inkSoft} />
              <Text style={styles.intentFootText}>Speak instead</Text>
            </View>
            <Text style={styles.intentFootText}>{intent.length}/240</Text>
          </View>
        </View>

        <PrimaryButton
          label="Find a prayer partner"
          rightIcon={<ArrowIcon size={16} color="#FFF" />}
          disabled={!intent.trim()}
          onPress={onNext}
          style={{ marginTop: 24 }}
        />
        <Text style={styles.endVerse}>
          &ldquo;Where two or three gather in my name, there am I.&rdquo; — Matthew 18:20
        </Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);

/* -------------------- Phase 2: searching -------------------- */
const SearchingPhase: React.FC<{ progress: number }> = ({ progress }) => {
  const ripples = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const loops = ripples.map((v, i) => {
      v.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(i * 800),
          Animated.timing(v, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <View style={styles.searchRoot}>
        <View style={styles.searchRippleWrap}>
          {ripples.map((v, i) => (
            <Animated.View
              key={i}
              style={[
                styles.searchRipple,
                {
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                  transform: [
                    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) },
                  ],
                },
              ]}
            />
          ))}
          <View style={styles.searchCore}>
            <PrayingIcon size={36} color={THEME.cardDarkInk} />
          </View>
        </View>
        <Text style={styles.searchTitle}>
          Finding your <Text style={styles.searchTitleItalic}>partner</Text>…
        </Text>
        <Text style={styles.searchBody}>
          Somewhere on earth, another soul is opening their heart at this exact moment.
        </Text>
        <View style={styles.searchTrack}>
          <View style={[styles.searchFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  );
};

/* -------------------- Phase 3: paired exchange -------------------- */
const PairedPhase: React.FC<{ intent: string; onBegin: () => void }> = ({ intent, onBegin }) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingTop: 20, paddingHorizontal: 22, alignItems: 'center' }}>
        <Pill icon={<SparkleIcon size={11} color={THEME.pillInk} />}>Paired anonymously</Pill>
        <Text style={styles.pairedTitle}>You're holding{'\n'}each other up.</Text>
        <Text style={styles.pairedSubtitle}>Read their heart. Then pray together.</Text>
      </View>

      <View style={{ paddingHorizontal: 22, gap: 14, marginTop: 4 }}>
        {/* Partner card */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerHead}>
            <View style={styles.partnerAvatar}>
              <UserIcon size={20} color={THEME.muted} />
            </View>
            <View>
              <Text style={styles.partnerLoc}>{PARTNER_LOC}</Text>
              <Text style={styles.partnerLabel}>YOUR PARTNER</Text>
            </View>
          </View>
          <Text style={styles.partnerBody}>&ldquo;{PARTNER_INTENT}&rdquo;</Text>
        </View>

        {/* You card */}
        <View style={styles.youCard}>
          <View style={styles.partnerHead}>
            <View style={[styles.partnerAvatar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <HeartIcon size={18} color={THEME.cardDarkInk} />
            </View>
            <View>
              <Text style={[styles.partnerLoc, { color: THEME.cardDarkInk }]}>You</Text>
              <Text style={[styles.partnerLabel, { color: 'rgba(255,255,255,0.7)' }]}>SHARED ANONYMOUSLY</Text>
            </View>
          </View>
          <Text style={[styles.partnerBody, { color: THEME.cardDarkInk }]}>&ldquo;{intent}&rdquo;</Text>
        </View>

        <PrimaryButton
          label="Begin praying — 2 min"
          rightIcon={<ArrowIcon size={16} color="#FFF" />}
          onPress={onBegin}
          style={{ marginTop: 8 }}
        />
      </View>
    </ScrollView>
  </SafeAreaView>
);

/* -------------------- Phase 4: praying together -------------------- */
const PrayingPhase: React.FC<{ timer: number; onEnd: () => void }> = ({ timer, onEnd }) => {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const mm = String(Math.floor(timer / 60));
  const ss = String(timer % 60).padStart(2, '0');
  const pct = (1 - timer / 120) * 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: THEME.cardDark }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.cardDark} />
      <View style={styles.prayingRoot}>
        <Animated.View
          style={[
            styles.breathe,
            {
              opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
              transform: [
                { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) },
              ],
            },
          ]}
        />
        <View style={styles.prayingTop}>
          <Pill bg="rgba(255,255,255,0.1)" fg={THEME.cardDarkInk} icon={<SparkleIcon size={11} color={THEME.cardDarkInk} />}>
            Praying together
          </Pill>
          <Text style={{ color: THEME.cardDarkInk, opacity: 0.7, fontSize: 12 }}>{PARTNER_LOC}</Text>
        </View>

        <View style={styles.prayingMid}>
          <Text style={styles.breatheText}>Breathe in. Hold them up.</Text>
          <Text style={styles.timerText}>
            {mm}:{ss}
          </Text>
          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.partnerSnippet}>&ldquo;{PARTNER_INTENT.slice(0, 80)}…&rdquo;</Text>
        </View>

        <Pressable onPress={onEnd} style={styles.endEarly}>
          <Text style={styles.endEarlyText}>End early — say amen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

/* -------------------- Phase 5: blessing -------------------- */
const BlessingPhase: React.FC<{ onAgain: () => void; onDone: () => void }> = ({ onAgain, onDone }) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
    <View style={styles.blessRoot}>
      <View style={styles.blessInner}>
        <View style={styles.blessIconWrap}>
          <HeartIcon size={38} color={THEME.pillInk} filled />
        </View>
        <Squiggle color={THEME.accent} w={56} />
        <Text style={styles.blessTitle}>
          <Text style={styles.confirmTitleItalic}>Amen</Text>.
        </Text>
        <Text style={styles.blessBody}>
          You've held a stranger up. They've held you up. The Lord knows both your names.
        </Text>
        <Text style={styles.blessVerse}>
          &ldquo;And the peace of God, which surpasses all understanding, will guard your hearts.&rdquo;
        </Text>
        <Text style={[styles.blessVerse, { fontSize: 11.5, marginTop: 4 }]}>— Philippians 4:7</Text>
      </View>
      <View style={styles.blessActions}>
        <Pressable onPress={onAgain} style={styles.blessSecondary}>
          <Text style={{ fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.ink }}>
            Pray with another
          </Text>
        </Pressable>
        <Pressable onPress={onDone} style={styles.blessPrimary}>
          <Text style={{ fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.cardDarkInk }}>
            Return home
          </Text>
        </Pressable>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  howCard: {
    backgroundColor: THEME.pillBg,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  howTitle: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: THEME.pillInk,
    marginBottom: 4,
  },
  howBody: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: THEME.pillInk },
  intentCard: {
    backgroundColor: THEME.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  intentInput: {
    minHeight: 110,
    fontFamily: FONTS.display,
    fontSize: 17,
    lineHeight: 25,
    color: THEME.ink,
    textAlignVertical: 'top',
  },
  intentFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  intentFootText: { fontSize: 12, color: THEME.inkSoft, fontFamily: FONTS.body },
  endVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12.5,
    color: THEME.muted,
    textAlign: 'center',
    marginTop: 14,
  },

  /* searching */
  searchRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  searchRippleWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  searchRipple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: THEME.accent,
  },
  searchCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTitle: {
    fontFamily: FONTS.display,
    fontSize: 30,
    color: THEME.ink,
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  searchTitleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  searchBody: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 21,
  },
  searchTrack: {
    marginTop: 28,
    width: 200,
    height: 3,
    backgroundColor: THEME.bgSoft,
    borderRadius: 2,
    overflow: 'hidden',
  },
  searchFill: { height: '100%', backgroundColor: THEME.accent },

  /* paired */
  pairedTitle: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 34,
    color: THEME.ink,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  pairedSubtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    marginBottom: 22,
  },
  partnerCard: {
    backgroundColor: THEME.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    shadowColor: '#1F2A44',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  youCard: { backgroundColor: THEME.cardDark, borderRadius: 22, padding: 20 },
  partnerHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLoc: { fontFamily: FONTS.display, fontSize: 16, color: THEME.ink },
  partnerLabel: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.2, color: THEME.muted },
  partnerBody: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 26,
    color: THEME.ink,
  },

  /* praying */
  prayingRoot: { flex: 1, padding: 22, paddingBottom: 40 },
  breathe: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 280,
    height: 280,
    marginLeft: -140,
    marginTop: -154,
    borderRadius: 140,
    backgroundColor: 'rgba(229,182,151,0.20)',
  },
  prayingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayingMid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  breatheText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.cardDarkInk,
    opacity: 0.75,
    marginBottom: 14,
  },
  timerText: {
    fontFamily: FONTS.display,
    fontSize: 96,
    color: THEME.cardDarkInk,
    letterSpacing: -2,
    lineHeight: 96,
  },
  timerTrack: {
    marginTop: 24,
    width: 220,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
  },
  timerFill: { height: '100%', backgroundColor: THEME.accent, borderRadius: 2 },
  partnerSnippet: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    color: THEME.cardDarkInk,
    opacity: 0.85,
    marginTop: 40,
    maxWidth: 280,
    textAlign: 'center',
  },
  endEarly: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  endEarlyText: { fontFamily: FONTS.body, color: THEME.cardDarkInk, fontSize: 13 },

  /* blessing */
  blessRoot: { flex: 1, justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 22, paddingBottom: 24 },
  blessInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blessIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  blessTitle: {
    fontFamily: FONTS.display,
    fontSize: 38,
    color: THEME.ink,
    marginTop: 18,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  confirmTitleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.ink },
  blessBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 23,
    color: THEME.inkSoft,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 24,
  },
  blessVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: THEME.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  blessActions: { flexDirection: 'row', gap: 10 },
  blessSecondary: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  blessPrimary: {
    flex: 1,
    backgroundColor: THEME.cardDark,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
