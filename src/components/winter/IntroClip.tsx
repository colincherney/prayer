import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Modal, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pauseBackgroundMotion } from '@/components/pets/anim';
import { realStart, shortDate, useWinterEvent } from '@/lib/winterEvent';

import { AuroraBackdrop, StageImage, W, WF, useWinterFonts } from './winterUi';

// "Face the Winter Lord": the event's 29-second intro clip (no audio track, so it never stops someone's music).
// Full screen, Skip after 1.5 s, and the moment the clip reaches its own title card (27 s) it fades into a page the
// app draws itself: the aurora, Snowcap and the Frost Lord, and one option, "Begin the winter" (replayed from the
// event screen, it just closes). Reduce Motion stops it playing by itself; a failed or slow load goes straight there.

const CLIP = require('../../../assets/video/face-the-winter-lord.mp4');
const END_AT = 26.9;
const LOAD_LIMIT_MS = 2000;

export type IntroMode = 'auto' | 'replay';

export function IntroClip({ visible, mode, onStarted, onBegin, onClose }: {
  visible: boolean;
  mode: IntroMode;
  /** Called once, when playback starts (that's when it counts as seen, so a crash mid-clip won't replay it). */
  onStarted?: () => void;
  /** "Begin the winter": close and open the event screen. */
  onBegin: () => void;
  /** "Begin the winter" when replayed, or the Android back button: back to where they were. */
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
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  /** Load failed, too slow, or skipped: show the still end card. */
  const [forcedStill, setStill] = useState(false);
  // With Reduce Motion on, the clip never plays by itself; replaying it from the event screen is asking for it.
  const still = forcedStill || (reduceMotion === true && mode === 'auto');
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const started = useRef(false);

  const player = useVideoPlayer(CLIP, p => {
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
        if (status === 'error') setStill(true);
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        if (currentTime > 0 && !started.current) {
          started.current = true;
          onStarted?.();
        }
        if (currentTime >= END_AT) setEnded(true);
      }),
      player.addListener('playToEnd', () => setEnded(true)),
    ];
    player.play();
    // Never a spinner for more than 2 s: show the still end card instead.
    const slow = setTimeout(() => {
      if (player.status !== 'readyToPlay') setStill(true);
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

  // The still counts as seen too (Reduce Motion or a failed load), so it never auto-plays later.
  useEffect(() => {
    if (still && !started.current) {
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
      {!showEndPage && !ready ? <ActivityIndicator style={styles.spinner} color={W.cream} /> : null}

      {fontsLoaded && showSkip && !showEndPage ? (
        <Animated.View entering={FadeIn.duration(400)} style={[styles.skipWrap, { top: insets.top + 12 }]}>
          <Pressable onPress={skipToEnd} accessibilityRole="button" accessibilityLabel="Skip the intro" hitSlop={8} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {showEndPage && fontsLoaded ? <EndPage onBegin={mode === 'auto' ? onBegin : onClose} /> : null}
    </View>
  );
}

/**
 * Where the clip lands (also on Skip, Reduce Motion or a failed load): the aurora sky, Snowcap with the Frost Lord he
 * can become standing behind him, and one option, "Begin the winter". Drawn by the app, so nothing in the video can
 * overlap it.
 */
function EndPage({ onBegin }: { onBegin: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  // Sized from the screen so the bears never climb into the title on a small phone.
  // lordH is the Frost Lord's body; his hat adds a quarter again above it.
  const lordH = Math.min(290, Math.round(screenH * 0.31));
  const cubH = Math.round(lordH * 0.8);
  const { state } = useWinterEvent();
  const dates = state ? `${shortDate(realStart(state.event)).toUpperCase()} TO ${shortDate(state.event.ends_on).toUpperCase()}` : null;
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[StyleSheet.absoluteFill, styles.page]}>
      <AuroraBackdrop hills />
      <View style={[styles.copy, { paddingTop: insets.top + 56 }]}>
        <Animated.Text entering={FadeInDown.delay(150).duration(500)} style={styles.kicker}>
          THE LONG WINTER{dates ? ` · ${dates}` : ''}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} accessibilityRole="header" style={styles.title}>
          Face the{'\n'}Winter Lord
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(350).duration(500)} style={styles.subtitle}>
          Complete the winter challenges{'\n'}to bring him home.
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
          <Text style={styles.ctaText}>Begin the winter</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: W.navyDeep },
  spinner: { position: 'absolute', alignSelf: 'center', top: '50%' },
  skipWrap: { position: 'absolute', right: 16 },
  skip: { height: 34, paddingHorizontal: 16, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(7,11,30,0.45)', alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: WF.semi, fontSize: 13, color: W.cream },
  page: { backgroundColor: W.navyDeep, justifyContent: 'space-between' },
  copy: { alignItems: 'center', paddingHorizontal: 24, gap: 10 },
  kicker: { fontFamily: WF.semi, fontSize: 11.5, letterSpacing: 2.4, color: W.ice, textAlign: 'center' },
  title: { fontFamily: WF.bold, fontSize: 44, lineHeight: 50, color: W.cream, textAlign: 'center' },
  subtitle: { fontFamily: WF.regular, fontSize: 17, lineHeight: 24, color: 'rgba(191,230,255,0.82)', textAlign: 'center', marginTop: 4 },
  bears: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  lord: { position: 'absolute', bottom: 0, right: '6%', opacity: 0.55 },
  cub: { position: 'absolute', bottom: 0, left: '10%' },
  ctaWrap: { paddingHorizontal: 24, paddingTop: 18 },
  cta: { height: 56, borderRadius: 28, backgroundColor: W.gold, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: WF.bold, fontSize: 19, color: W.navy },
});
