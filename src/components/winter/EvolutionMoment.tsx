import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackdrop, StageImage, W, WF, useWinterFonts } from './winterUi';

// The full-screen moments of the Long Winter: Snowcap arriving, the Frost Mage on Christmas Day, and the Frost Lord
// crowned at the end. Shown once each (the account remembers, user_event_progress.stage_seen).

const MOMENTS: Record<1 | 2 | 3, { kicker: string; title: string; body: string; verse: string }> = {
  1: {
    kicker: 'THE LONG WINTER',
    title: 'Snowcap has arrived',
    body: 'A little apprentice of the snow walks with you now. Finish the winter challenges and he will grow.',
    verse: 'He giveth snow like wool. Psalm 147:16',
  },
  2: {
    kicker: 'FOUR CHALLENGES DONE',
    title: 'Your Frost Mage is ready',
    body: 'Snowcap has grown into the Frost Mage. Finish all ten challenges to crown the Frost Lord.',
    verse: 'The people that walked in darkness have seen a great light. Isaiah 9:2',
  },
  3: {
    kicker: 'ALL TEN CHALLENGES DONE',
    title: 'The Frost Lord is crowned',
    body: 'You faced the long winter and brought him home. He is yours to keep, and all five winter keepsakes are on your shelf.',
    verse: 'He sendeth out his word, and melteth them. Psalm 147:18',
  },
};

export function EvolutionMoment({ stage, visible, onDone }: { stage: number; visible: boolean; onDone: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onDone}>
      {visible && stage >= 1 ? <MomentBody stage={Math.min(3, stage) as 1 | 2 | 3} onDone={onDone} /> : null}
    </Modal>
  );
}

function MomentBody({ stage, onDone }: { stage: 1 | 2 | 3; onDone: () => void }) {
  const fontsLoaded = useWinterFonts();
  const insets = useSafeAreaInsets();
  const rise = useSharedValue(0);
  const glow = useSharedValue(0);
  const text = useSharedValue(0);

  useEffect(() => {
    rise.set(withDelay(250, withSpring(1, { damping: 11, stiffness: 90 })));
    glow.set(withDelay(150, withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), withTiming(0.55, { duration: 1600 })), -1)));
    text.set(withDelay(700, withTiming(1, { duration: 600 })));
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [rise, glow, text]);

  const artStyle = useAnimatedStyle(() => ({ opacity: rise.get(), transform: [{ translateY: (1 - rise.get()) * 60 }, { scale: 0.7 + 0.3 * rise.get() }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.25 + 0.45 * glow.get(), transform: [{ scale: 0.9 + 0.15 * glow.get() }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: text.get(), transform: [{ translateY: (1 - text.get()) * 12 }] }));
  const m = MOMENTS[stage];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <AuroraBackdrop hills />
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <View style={styles.artWrap}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={artStyle}>
            {/* Sized so the Mage's and Lord's full hats fit the 360pt space. */}
            <StageImage stage={stage} height={stage === 3 ? 270 : stage === 2 ? 290 : 300} />
          </Animated.View>
        </View>
        {fontsLoaded ? (
          <Animated.View style={[styles.copy, textStyle]}>
            <Text style={styles.kicker}>{m.kicker}</Text>
            <Text accessibilityRole="header" style={styles.title}>{m.title}</Text>
            <Text style={styles.body}>{m.body}</Text>
            <Text style={styles.verse}>{m.verse}</Text>
          </Animated.View>
        ) : null}
      </View>
      {fontsLoaded ? (
        <Pressable onPress={onDone} accessibilityRole="button" style={({ pressed }) => [styles.cta, { marginBottom: insets.bottom + 32 }, pressed && { opacity: 0.88 }]}>
          <Text style={styles.ctaText}>{stage === 3 ? 'Amen' : 'Continue'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: W.navyDeep, justifyContent: 'space-between' },
  center: { alignItems: 'center', paddingHorizontal: 28 },
  artWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 360 },
  glow: { position: 'absolute', bottom: 40, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(95,227,192,0.28)' },
  copy: { alignItems: 'center', marginTop: 18, gap: 8 },
  kicker: { fontFamily: WF.semi, fontSize: 12, letterSpacing: 2.4, color: W.ice },
  title: { fontFamily: WF.bold, fontSize: 32, lineHeight: 38, color: W.cream, textAlign: 'center' },
  body: { fontFamily: WF.regular, fontSize: 16, lineHeight: 23, color: W.muted, textAlign: 'center' },
  verse: { fontFamily: WF.medium, fontSize: 13, lineHeight: 19, color: W.gold, textAlign: 'center', marginTop: 4 },
  cta: { marginHorizontal: 24, height: 54, borderRadius: 27, backgroundColor: W.gold, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: WF.bold, fontSize: 18, color: W.navy },
});
