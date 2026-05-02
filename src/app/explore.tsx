import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BackIcon, CheckIcon, HeartIcon } from '@/components/saint/Icons';
import { FONTS } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { relativeTime } from '@/lib/time';

type PrayerRequest = {
  id: string;
  category: string;
  prayedCount: number;
  age: string;
  text: string;
};

const NIGHT = {
  bg: '#0B1020',
  surface: 'rgba(255, 247, 232, 0.04)',
  ink: '#F1E7D2',
  inkSoft: '#C8BFAA',
  muted: '#7E7660',
  line: 'rgba(241, 231, 210, 0.10)',
  lineStrong: 'rgba(241, 231, 210, 0.18)',
  flame: '#F5C065',
  flameSoft: '#E0843A',
  ember: '#A85327',
};

const SCREEN = Dimensions.get('window');

/* -------------------- Vigil background (radial glow) -------------------- */
const VigilBackdrop: React.FC<{ glowIntensity: Animated.Value }> = ({ glowIntensity }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {/* base navy */}
    <View style={[StyleSheet.absoluteFill, { backgroundColor: NIGHT.bg }]} />
    {/* warm radial glow that pulses with the flame */}
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowIntensity }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="32%" rx="70%" ry="55%" fx="50%" fy="32%">
            <Stop offset="0%" stopColor="#7A4423" stopOpacity={0.55} />
            <Stop offset="35%" stopColor="#3D2519" stopOpacity={0.45} />
            <Stop offset="100%" stopColor="#0B1020" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </Animated.View>
  </View>
);

/* -------------------- Candle -------------------- */
const Candle: React.FC<{ lit: boolean; flicker: Animated.Value; lightUp: Animated.Value }> = ({
  lit,
  flicker,
  lightUp,
}) => {
  // Flicker drives flame opacity (0.82 → 1) and scaleY (0.94 → 1.06)
  const flameOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const flameScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const flameWidthScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [1.05, 0.96] });
  const haloOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });

  // lightUp drives the "ignite" reveal of the flame (0 → 1)
  const igniteOpacity = lightUp;
  const igniteScale = lightUp.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={styles.candleStage}>
      {/* halo */}
      {lit && (
        <Animated.View
          style={[
            styles.halo,
            { opacity: Animated.multiply(igniteOpacity, haloOpacity) },
          ]}>
          <Svg width={220} height={220} viewBox="0 0 220 220">
            <Defs>
              <RadialGradient id="halo" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={NIGHT.flame} stopOpacity={0.55} />
                <Stop offset="55%" stopColor={NIGHT.flameSoft} stopOpacity={0.18} />
                <Stop offset="100%" stopColor={NIGHT.flame} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="220" height="220" fill="url(#halo)" />
          </Svg>
        </Animated.View>
      )}

      {/* flame */}
      {lit && (
        <Animated.View
          style={{
            opacity: Animated.multiply(igniteOpacity, flameOpacity),
            transform: [{ scaleY: Animated.multiply(igniteScale, flameScale) }, { scaleX: flameWidthScale }],
            position: 'absolute',
            top: 8,
          }}>
          <Svg width={36} height={56} viewBox="0 0 36 56">
            <Defs>
              <RadialGradient id="flame" cx="50%" cy="65%" rx="55%" ry="55%">
                <Stop offset="0%" stopColor="#FFF1C2" stopOpacity={1} />
                <Stop offset="45%" stopColor={NIGHT.flame} stopOpacity={1} />
                <Stop offset="85%" stopColor={NIGHT.flameSoft} stopOpacity={0.95} />
                <Stop offset="100%" stopColor={NIGHT.ember} stopOpacity={0.5} />
              </RadialGradient>
            </Defs>
            <Path
              d="M18 4 C 16 14, 8 20, 8 32 C 8 44, 12 52, 18 52 C 24 52, 28 44, 28 32 C 28 24, 24 22, 24 16 C 24 11, 18 9, 18 4 Z"
              fill="url(#flame)"
            />
            {/* inner blue base */}
            <Path
              d="M18 38 C 15 38, 13 42, 14 46 C 15 49, 18 50, 18 50 C 18 50, 21 49, 22 46 C 23 42, 21 38, 18 38 Z"
              fill="#5C7AB8"
              opacity={0.55}
            />
          </Svg>
        </Animated.View>
      )}

      {/* wick */}
      <View style={styles.wick} />

      {/* candle body */}
      <View style={styles.candleBody}>
        {/* subtle wax highlight */}
        <View style={styles.candleHighlight} />
      </View>

      {/* candle base/holder */}
      <View style={styles.candleBase} />
    </View>
  );
};

/* -------------------- Wall of lights (session progress) -------------------- */
const WallOfLights: React.FC<{
  total: number;
  prayedIds: Set<string>;
  ids: string[];
  currentIndex: number;
  onJump: (i: number) => void;
}> = ({ total, prayedIds, ids, currentIndex, onJump }) => (
  <View style={styles.wall}>
    {ids.map((id, i) => {
      const lit = prayedIds.has(id);
      const isCurrent = i === currentIndex;
      return (
        <Pressable key={id} onPress={() => onJump(i)} style={styles.wallSlot} hitSlop={6}>
          {/* tiny candle */}
          <View
            style={[
              styles.tinyCandle,
              {
                backgroundColor: isCurrent ? NIGHT.ink : 'rgba(241,231,210,0.32)',
                opacity: lit || isCurrent ? 1 : 0.55,
              },
            ]}
          />
          {/* tiny flame */}
          <View
            style={[
              styles.tinyFlame,
              {
                backgroundColor: lit ? NIGHT.flame : 'transparent',
                shadowColor: lit ? NIGHT.flame : 'transparent',
                shadowOpacity: lit ? 0.8 : 0,
                shadowRadius: lit ? 6 : 0,
              },
            ]}
          />
        </Pressable>
      );
    })}
    <Text style={styles.wallCount}>
      {prayedIds.size}/{total}
    </Text>
  </View>
);

/* -------------------- Screen -------------------- */
export default function PrayForOthersScreen() {
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();

  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [notesSent, setNotesSent] = useState<Set<string>>(new Set());
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteSending, setNoteSending] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Animations
  const flicker = useRef(new Animated.Value(0.5)).current;
  const lightUp = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(1)).current;
  const cardLift = useRef(new Animated.Value(0)).current;
  const glowIntensity = useRef(new Animated.Value(0.55)).current;

  // Fetch the feed of approved prayers, excluding my own and any I've already prayed for.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFeed(true);
      setFeedError(null);
      const me = session?.user?.id;
      let query = supabase
        .from('prayers')
        .select('id, body, category, created_at, user_id, prayer_interactions(action, user_id)')
        .eq('approved', 'y')
        .order('created_at', { ascending: false })
        .limit(50);
      if (me) query = query.neq('user_id', me);

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        setFeedError(error.message);
        setRequests([]);
      } else {
        const mapped = (data ?? [])
          .map(p => {
            const interactions =
              (p.prayer_interactions as { action: string; user_id: string }[] | null) ?? [];
            const alreadyPrayed = me
              ? interactions.some(i => i.user_id === me && i.action === 'prayed')
              : false;
            return {
              id: p.id as string,
              text: (p.body as string) ?? '',
              category: (p.category as string | null) ?? 'Other',
              age: relativeTime(p.created_at as string),
              prayedCount: interactions.filter(i => i.action === 'prayed').length,
              alreadyPrayed,
            };
          })
          .filter(p => !p.alreadyPrayed)
          .map(({ alreadyPrayed: _alreadyPrayed, ...rest }) => rest)
          .slice(0, 30);
        setRequests(mapped);
      }
      setLoadingFeed(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const req = requests[index];
  const lit = req ? prayedIds.has(req.id) : false;

  // Flicker loop — runs always, but only visible when flame is lit
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0.35,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0.85,
          duration: 280,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0.5,
          duration: 200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  // When the current request becomes lit/unlit, animate the ignite reveal + glow
  useEffect(() => {
    Animated.parallel([
      Animated.timing(lightUp, {
        toValue: lit ? 1 : 0,
        duration: lit ? 750 : 250,
        easing: lit ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowIntensity, {
        toValue: lit ? 1 : 0.5,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [lit, lightUp, glowIntensity]);

  const advance = (next: number) => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardLift, {
        toValue: -16,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIndex(next);
      setNoteOpen(false);
      setNote('');
      cardLift.setValue(16);
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardLift, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: NIGHT.bg }} />;

  const onPray = async () => {
    if (!req || !session) return;
    // Optimistic light
    setPrayedIds(prev => {
      const next = new Set(prev);
      next.add(req.id);
      return next;
    });
    setRequests(prev =>
      prev.map(r => (r.id === req.id ? { ...r, prayedCount: r.prayedCount + 1 } : r)),
    );
    const { error } = await supabase.from('prayer_interactions').insert({
      prayer_id: req.id,
      user_id: session.user.id,
      action: 'prayed',
    });
    if (error) {
      // Roll back on failure
      setPrayedIds(prev => {
        const next = new Set(prev);
        next.delete(req.id);
        return next;
      });
      setRequests(prev =>
        prev.map(r =>
          r.id === req.id ? { ...r, prayedCount: Math.max(0, r.prayedCount - 1) } : r,
        ),
      );
    }
  };

  const onContinue = () => {
    const nextIdx = index + 1 < requests.length ? index + 1 : index;
    if (nextIdx === index) return; // last card — handled by completion CTA
    advance(nextIdx);
  };

  const onJump = (i: number) => {
    if (i === index) return;
    advance(i);
  };

  const onSendNote = async () => {
    if (!req || !note.trim() || !session || noteSending) return;
    Keyboard.dismiss();
    setNoteSending(true);
    setNoteError(null);
    const content = note.trim();
    const { error } = await supabase.from('reflections').insert({
      prayer_id: req.id,
      user_id: session.user.id,
      content,
    });
    setNoteSending(false);
    if (error) {
      setNoteError(error.message);
      return;
    }
    setNote('');
    setNotesSent(prev => {
      const next = new Set(prev);
      next.add(req.id);
      return next;
    });
    setNoteOpen(false);
  };

  const total = requests.length;
  const isLast = total > 0 && index === total - 1;
  const allDone = total > 0 && prayedIds.size === total;
  const noteSent = req ? notesSent.has(req.id) : false;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NIGHT.bg} />
      <VigilBackdrop glowIntensity={glowIntensity} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <BackIcon size={16} color={NIGHT.ink} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.kicker}>A QUIET VIGIL</Text>
            <Text style={styles.indexLabel}>
              {total > 0 ? index + 1 : 0}{' '}
              <Text style={{ color: NIGHT.muted }}>/ {total}</Text>
            </Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        {loadingFeed ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={NIGHT.flame} />
          </View>
        ) : !req ? (
          <View style={styles.centerFill}>
            <Text style={styles.emptyTitle}>
              {feedError ? 'Couldn’t load prayers' : 'Stillness tonight.'}
            </Text>
            <Text style={styles.emptyBody}>
              {feedError
                ? feedError
                : 'No requests are waiting right now. Be the first to share what weighs on your heart.'}
            </Text>
          </View>
        ) : (
          <>
        {/* Body */}
        <Animated.View
          style={[
            styles.body,
            { opacity: cardFade, transform: [{ translateY: cardLift }] },
          ]}>
          <ScrollView
            contentContainerStyle={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <Candle lit={lit} flicker={flicker} lightUp={lightUp} />

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{req.category.toUpperCase()}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{req.age.toUpperCase()}</Text>
            </View>

            <Text style={styles.prayer}>&ldquo;{req.text}&rdquo;</Text>

            <View style={styles.companionRow}>
              <View style={styles.tinyDot} />
              <Text style={styles.companionText}>
                <Text style={styles.companionStrong}>
                  {req.prayedCount + (lit ? 1 : 0)}
                </Text>{' '}
                {lit ? 'have lit a candle with you' : 'have lit a candle'}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Action area */}
        <View style={styles.actions}>
          {!lit ? (
            <Pressable onPress={onPray} style={({ pressed }) => [styles.lightBtn, pressed && { opacity: 0.85 }]}>
              <View style={styles.lightBtnDot} />
              <Text style={styles.lightBtnText}>Light a candle</Text>
            </Pressable>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={styles.litBanner}>
                <CheckIcon size={14} color={NIGHT.flame} />
                <Text style={styles.litBannerText}>Your candle is lit. Stay as long as you need.</Text>
              </View>

              {!noteSent && !noteOpen && (
                <Pressable onPress={() => setNoteOpen(true)} style={styles.noteCta}>
                  <HeartIcon size={13} color={NIGHT.inkSoft} />
                  <Text style={styles.noteCtaText}>Send anonymous encouragement</Text>
                </Pressable>
              )}
              {noteOpen && !noteSent && (
                <View style={styles.noteBox}>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="A short word of hope, anonymously…"
                    placeholderTextColor={NIGHT.muted}
                    multiline
                    maxLength={140}
                    style={styles.noteInput}
                  />
                  <View style={styles.noteFooter}>
                    <Text style={styles.noteCounter}>{note.length}/140</Text>
                    <Pressable
                      onPress={onSendNote}
                      disabled={!note.trim() || noteSending}
                      style={[
                        styles.sendNoteBtn,
                        {
                          backgroundColor:
                            note.trim() && !noteSending ? NIGHT.flame : NIGHT.line,
                        },
                      ]}>
                      {noteSending ? (
                        <ActivityIndicator size="small" color="#1A130A" />
                      ) : (
                        <Text
                          style={[
                            styles.sendNoteText,
                            { color: note.trim() ? '#1A130A' : NIGHT.muted },
                          ]}>
                          Send anonymously
                        </Text>
                      )}
                    </Pressable>
                  </View>
                  {noteError ? (
                    <Text style={styles.noteErrorText}>{noteError}</Text>
                  ) : null}
                </View>
              )}
              {noteSent && (
                <View style={styles.noteSent}>
                  <CheckIcon size={13} color={NIGHT.flame} />
                  <Text style={styles.noteSentText}>Your encouragement was delivered.</Text>
                </View>
              )}

              {!isLast ? (
                <Pressable onPress={onContinue} style={styles.continueBtn}>
                  <Text style={styles.continueBtnText}>Carry on to the next →</Text>
                </Pressable>
              ) : (
                <View style={styles.completeBox}>
                  <Text style={styles.completeKicker}>
                    {allDone ? 'EVERY CANDLE LIT' : 'END OF THE ROW'}
                  </Text>
                  <Text style={styles.completeText}>
                    {allDone
                      ? 'You held up every heart in this room tonight. Thank you.'
                      : `You lit ${prayedIds.size} of ${total}. Walk back through any candle below to stay longer.`}
                  </Text>
                  <Text style={styles.completeVerse}>
                    &ldquo;Bear one another&apos;s burdens, and so fulfill the law of Christ.&rdquo; — Galatians 6:2
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Wall of lights */}
        <WallOfLights
          total={total}
          prayedIds={prayedIds}
          ids={requests.map(r => r.id)}
          currentIndex={index}
          onJump={onJump}
        />
          </>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NIGHT.bg },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: NIGHT.line,
    backgroundColor: NIGHT.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 40,
    height: 40,
  },
  kicker: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10.5,
    letterSpacing: 2.4,
    color: NIGHT.muted,
  },
  indexLabel: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: NIGHT.ink,
    marginTop: 4,
    letterSpacing: 0.6,
  },

  /* Candle */
  candleStage: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  halo: {
    position: 'absolute',
    top: -40,
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wick: {
    width: 2,
    height: 8,
    backgroundColor: '#3a2f22',
    marginBottom: -1,
  },
  candleBody: {
    width: 36,
    height: 130,
    backgroundColor: '#F2E6CC',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
  },
  candleHighlight: {
    position: 'absolute',
    left: 5,
    top: 6,
    bottom: 6,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  candleBase: {
    width: 64,
    height: 8,
    backgroundColor: '#161A2A',
    borderRadius: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: NIGHT.lineStrong,
  },

  /* Body */
  body: {
    flex: 1,
  },
  bodyScroll: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 8,
    flexGrow: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 18,
  },
  metaText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 1.6,
    color: NIGHT.muted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: NIGHT.muted,
    opacity: 0.6,
  },
  prayer: {
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 30,
    color: NIGHT.ink,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: NIGHT.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyBody: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 21,
    color: NIGHT.inkSoft,
    textAlign: 'center',
  },
  companionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  tinyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: NIGHT.flame,
    opacity: 0.7,
  },
  companionText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: NIGHT.inkSoft,
  },
  companionStrong: {
    fontFamily: FONTS.bodySemi,
    color: NIGHT.ink,
  },

  /* Actions */
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  lightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: NIGHT.flame,
    backgroundColor: 'rgba(245, 192, 101, 0.08)',
  },
  lightBtnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NIGHT.flame,
    shadowColor: NIGHT.flame,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  lightBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    letterSpacing: 1.2,
    color: NIGHT.flame,
    textTransform: 'uppercase',
  },
  litBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 192, 101, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: NIGHT.line,
  },
  litBannerText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: NIGHT.inkSoft,
  },
  noteCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NIGHT.line,
    borderStyle: 'dashed',
  },
  noteCtaText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: NIGHT.inkSoft,
  },
  noteBox: {
    backgroundColor: 'rgba(241, 231, 210, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: NIGHT.line,
  },
  noteInput: {
    minHeight: 56,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: NIGHT.ink,
    textAlignVertical: 'top',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  noteCounter: { fontSize: 11, color: NIGHT.muted, fontFamily: FONTS.body },
  sendNoteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    minWidth: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendNoteText: { fontFamily: FONTS.bodySemi, fontSize: 12 },
  noteErrorText: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: NIGHT.flameSoft,
    marginTop: 8,
  },
  noteSent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  noteSentText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: NIGHT.inkSoft,
  },
  continueBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    letterSpacing: 1.4,
    color: NIGHT.ink,
    textTransform: 'uppercase',
  },

  /* Completion */
  completeBox: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  completeKicker: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10.5,
    letterSpacing: 2.4,
    color: NIGHT.flame,
    marginBottom: 8,
  },
  completeText: {
    fontFamily: FONTS.display,
    fontSize: 16,
    lineHeight: 24,
    color: NIGHT.ink,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  completeVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12.5,
    color: NIGHT.muted,
    textAlign: 'center',
    marginTop: 14,
  },

  /* Wall */
  wall: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: NIGHT.line,
    marginHorizontal: 22,
  },
  wallSlot: {
    alignItems: 'center',
    width: 14,
  },
  tinyCandle: {
    width: 5,
    height: 18,
    borderRadius: 1.5,
  },
  tinyFlame: {
    position: 'absolute',
    top: -5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  wallCount: {
    position: 'absolute',
    right: 22,
    bottom: 6,
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 1.4,
    color: NIGHT.muted,
  },
});
