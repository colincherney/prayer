import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Modal, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pressable } from '@/components/saint/HapticPressable';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pauseBackgroundMotion } from '@/components/pets/anim';
import { realStart, shortDate, useEvent } from '@/lib/winterEvent';

import { clipSource, glass, Palette, StageImage, useSkin, WF, useWinterFonts } from './winterUi';

// An event's ~30-second intro clip, streamed from the event-clips storage bucket ("Face the Winter Lord", "Face the Swamp King"), from the skin of the event it's
// shown for (no audio track, so it never stops someone's music). Full screen, Skip after 1.5 s, and the moment the clip
// reaches its own title card (27 s) it fades into a page the app draws itself: the event's sky, its first and final
// stages, and one option ("Begin the winter", "Enter the fen"; replayed from the event screen, it just closes).
// Reduce Motion stops it playing by itself; a failed or slow load goes straight to that page.

const END_AT = 26.9;
/** Streamed from storage now, so a little longer than a bundled file needed before giving up on a slow connection. */
const LOAD_LIMIT_MS = 6000;

export type IntroMode = 'auto' | 'replay';

export function IntroClip({ visible, mode, onStarted, onBegin, onClose }: {
  visible: boolean;
  mode: IntroMode;
  /** Called once, when playback starts (that's when it counts as seen, so a crash mid-clip won't replay it). */
  onStarted?: () => void;
  /** The one button: close and open the event screen. */
  onBegin: () => void;
  /** The same button when replayed, or the Android back button: back to where they were. */
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      {visible ? <ClipBody mode={mode} onStarted={onStarted} onBegin={onBegin} onClose={onClose} /> : null}
    </Modal>
  );
}

function ClipBody({ mode, onStarted, onBegin, onClose }: { mode: IntroMode; onStarted?: () => void; onBegin: () => void; onClose: () => void }) {
  const fontsLoaded = useWinterFonts();
  const insets = useSafeAreaInsets();
  const skin = useSkin();
  const styles = useMemo(() => makeStyles(skin.palette), [skin.palette]);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  /** Load failed, too slow, or skipped: show the end page. */
  const [forcedStill, setStill] = useState(false);
  // With Reduce Motion on, the clip never plays by itself; replaying it from the event screen is asking for it.
  const still = forcedStill || (reduceMotion === true && mode === 'auto');
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const started = useRef(false);
  const loadFailed = useRef(false);

  const source = useMemo(() => clipSource(skin.clip), [skin.clip]);
  const player = useVideoPlayer(source, p => {
    p.muted = true;
    p.loop = false;
    p.audioMixingMode = 'mixWithOthers';
    p.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => setReduceMotion(false));
    // Nothing underneath needs to move while the clip covers it; let the video have the frame budget.
    pauseBackgroundMotion(true);
    return () => pauseBackgroundMotion(false);
  }, []);

  useEffect(() => {
    if (reduceMotion === null || (reduceMotion && mode === 'auto')) return;
    const subs = [
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') setReady(true);
        if (status === 'error' && !started.current) {
          loadFailed.current = true;
          setStill(true);
        }
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        if (currentTime > 0 && !started.current) {
          started.current = true;
          onStarted?.();
        }
        if (currentTime >= (skin.clipEndAt ?? END_AT)) setEnded(true);
      }),
      player.addListener('playToEnd', () => setEnded(true)),
    ];
    player.play();
    // Never a long spinner: on a slow or failed load, show the end page instead.
    const slow = setTimeout(() => {
      if (player.status !== 'readyToPlay') {
        loadFailed.current = true;
        setStill(true);
      }
    }, LOAD_LIMIT_MS);
    const skip = setTimeout(() => setShowSkip(true), 1500);
    return () => {
      subs.forEach(s => s.remove());
      clearTimeout(slow);
      clearTimeout(skip);
    };
    // onStarted is a fresh closure each render; the listeners only need the first
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, reduceMotion, mode]);

  // The still counts as seen too with Reduce Motion or Skip, so it never auto-plays later. A clip that couldn't load
  // (it streams from storage, so no signal or a slow connection) doesn't: it tries again on the next open.
  useEffect(() => {
    if (still && !started.current && !loadFailed.current) {
      started.current = true;
      onStarted?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  const skipToEnd = () => {
    try {
      player.pause();
    } catch {}
    setEnded(true);
    setStill(true);
  };

  const showEndPage = ended || still;

  // The video is done with the screen, so the page underneath may move again (the end page's own sky needs it too).
  useEffect(() => {
    if (showEndPage) pauseBackgroundMotion(false);
  }, [showEndPage]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {!showEndPage ? <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} /> : null}
      {!showEndPage && !ready ? <ActivityIndicator style={styles.spinner} color={skin.palette.cream} /> : null}

      {fontsLoaded && showSkip && !showEndPage ? (
        <Animated.View entering={FadeIn.duration(400)} style={[styles.skipWrap, { top: insets.top + 12 }]}>
          <Pressable onPress={skipToEnd} accessibilityRole="button" accessibilityLabel="Skip the intro" hitSlop={8} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {showEndPage && fontsLoaded ? <EndPage styles={styles} onBegin={mode === 'auto' ? onBegin : onClose} /> : null}
    </View>
  );
}

/**
 * Where the clip lands (also on Skip, Reduce Motion or a failed load): the event's sky, its first stage with the
 * final stage it can become standing behind, and one option. Drawn by the app, so nothing in the video can overlap it.
 */
function EndPage({ onBegin, styles }: { onBegin: () => void; styles: ReturnType<typeof makeStyles> }) {
  const insets = useSafeAreaInsets();
  const skin = useSkin();
  const Backdrop = skin.Backdrop;
  const { height: screenH } = useWindowDimensions();
  // Sized from the screen so the figures never climb into the title on a small phone. lordH is the final stage's
  // figure; the Frost Lord's hat adds a quarter again above it.
  const lordH = Math.min(290, Math.round(screenH * 0.31));
  const cubH = Math.round(lordH * 0.8);
  const { state } = useEvent(skin.id);
  const dates = state ? `${shortDate(realStart(state.event)).toUpperCase()} TO ${shortDate(state.event.ends_on).toUpperCase()}` : null;
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[StyleSheet.absoluteFill, styles.page]}>
      <Backdrop hills />
      <View style={[styles.copy, { paddingTop: insets.top + 56 }]}>
        <Animated.Text entering={FadeInDown.delay(150).duration(500)} style={styles.kicker}>
          {(state?.event.title ?? '').toUpperCase()}{dates ? ` · ${dates}` : ''}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} accessibilityRole="header" style={styles.title}>
          {skin.clipTitle}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(350).duration(500)} style={styles.subtitle}>
          {skin.clipSubtitle}
        </Animated.Text>
      </View>

      <View style={styles.bears} pointerEvents="none">
        <Animated.View entering={FadeIn.delay(300).duration(700)} style={styles.lord}>
          <StageImage stage={3} height={lordH} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(500).springify().damping(14)} style={styles.cub}>
          <StageImage stage={1} height={cubH} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(700).duration(450)} style={[styles.ctaWrap, { paddingBottom: insets.bottom + 36 }]}>
        <Pressable onPress={onBegin} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}>
          <Text style={styles.ctaText}>{skin.beginLabel}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (W: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: W.navyDeep },
  spinner: { position: 'absolute', alignSelf: 'center', top: '50%' },
  skipWrap: { position: 'absolute', right: 16 },
  skip: { height: 34, paddingHorizontal: 16, borderRadius: 17, borderWidth: 1, borderColor: glass(W).line, backgroundColor: W.light ? glass(W).bg : 'rgba(7,11,30,0.45)', alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: WF.semi, fontSize: 13, color: W.cream },
  page: { backgroundColor: W.navyDeep, justifyContent: 'space-between' },
  copy: { alignItems: 'center', paddingHorizontal: 24, gap: 10 },
  kicker: { fontFamily: WF.semi, fontSize: 11.5, letterSpacing: 2.4, color: W.ice, textAlign: 'center' },
  title: { fontFamily: WF.bold, fontSize: 44, lineHeight: 50, color: W.cream, textAlign: 'center' },
  subtitle: { fontFamily: WF.regular, fontSize: 17, lineHeight: 24, color: W.ice, opacity: 0.85, textAlign: 'center', marginTop: 4 },
  bears: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  lord: { position: 'absolute', bottom: 0, right: '6%', opacity: 0.55 },
  cub: { position: 'absolute', bottom: 0, left: '10%' },
  ctaWrap: { paddingHorizontal: 24, paddingTop: 18 },
  cta: { height: 56, borderRadius: 28, backgroundColor: W.gold, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: WF.bold, fontSize: 19, color: W.navy },
});
