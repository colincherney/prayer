import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';

import { keyframe } from './anim';
import { PipStage } from './PipLamb';
import type { PetId } from './registry';

// Tap reactions from design ANIMATIONS.md: the pet squashes and springs, a speech bubble and particles pop out,
// and some stages add expanding burst rings. Positions are in the design's 220-wide, 260-tall card space.

type ParticleKind = 'heart' | 'note' | 'wave' | 'spark' | 'drops' | 'zig';
type Particle = {
  kind: ParticleKind;
  color: string;
  w: number;
  h: number;
  left: number; // percent of the width
  top: number; // design px, out of 260
  delay?: number;
  /** Spark particles use three dots in these colors. */
  dots?: [string, string, string];
};
type Burst = { color: string; width: number; delay?: number; top?: number };
type Reaction = {
  text: string;
  bubble: { left: number; top: number };
  particles: Particle[];
  bursts: Burst[];
};

const heart = (color: string, w: number, left: number, top: number, delay?: number): Particle => ({
  kind: 'heart',
  color,
  w,
  h: w,
  left,
  top,
  delay,
});
const note = (color: string, w: number, h: number, left: number, top: number, delay?: number): Particle => ({
  kind: 'note',
  color,
  w,
  h,
  left,
  top,
  delay,
});
const wave = (w: number, left: number, top: number): Particle => ({ kind: 'wave', color: '#F2C462', w, h: w, left, top });
const spark = (dots: [string, string, string], left: number, top: number, delay?: number): Particle => ({
  kind: 'spark',
  color: dots[1],
  w: 34,
  h: 30,
  left,
  top,
  delay,
  dots,
});
const drops = (color: string, w: number, h: number, left: number, top: number, delay?: number): Particle => ({
  kind: 'drops',
  color,
  w,
  h,
  left,
  top,
  delay,
});

export const REACTIONS: Record<PetId, [Reaction, Reaction, Reaction]> = {
  lamb: [
    { text: 'Baa!', bubble: { left: 18, top: 60 }, bursts: [], particles: [heart('#E8998A', 26, 66, 70), heart('#E8998A', 18, 74, 104, 150)] },
    {
      text: 'Baa!',
      bubble: { left: 16, top: 40 },
      bursts: [],
      particles: [heart('#E8998A', 26, 68, 44), heart('#F2C462', 18, 76, 80, 150), heart('#E8998A', 16, 22, 96, 300)],
    },
    {
      text: 'Baa!',
      bubble: { left: 14, top: 36 },
      bursts: [{ color: '#F2C462', width: 3 }, { color: '#FFF6DE', width: 2, delay: 200 }],
      particles: [heart('#F2C462', 26, 70, 40), heart('#E8998A', 18, 78, 78, 150)],
    },
  ],
  dove: [
    { text: 'Peep!', bubble: { left: 16, top: 70 }, bursts: [], particles: [note('#B5DCC6', 22, 26, 68, 74), note('#F2C462', 16, 20, 76, 110, 150)] },
    { text: 'Coo!', bubble: { left: 14, top: 50 }, bursts: [], particles: [note('#B5DCC6', 22, 26, 70, 50), note('#8DAA62', 16, 20, 80, 88, 150)] },
    {
      text: 'Coo!',
      bubble: { left: 12, top: 30 },
      bursts: [{ color: '#F2C462', width: 3 }, { color: '#FFFFFF', width: 2, delay: 200 }],
      particles: [note('#F2C462', 22, 26, 72, 36), note('#B5DCC6', 16, 20, 18, 120, 150)],
    },
  ],
  lion: [
    { text: 'Rawr!', bubble: { left: 16, top: 70 }, bursts: [], particles: [wave(30, 68, 70)] },
    { text: 'Roar!', bubble: { left: 12, top: 40 }, bursts: [{ color: '#E3A957', width: 3 }], particles: [wave(34, 70, 50)] },
    {
      text: 'ROAR!',
      bubble: { left: 10, top: 30 },
      bursts: [{ color: '#F2C462', width: 3 }, { color: '#D98F3A', width: 2, delay: 200 }],
      particles: [wave(38, 72, 36)],
    },
  ],
  ember: [
    { text: 'Hi!', bubble: { left: 18, top: 90 }, bursts: [{ color: '#F2A93B', width: 3, top: 66 }], particles: [spark(['#FFE08A', '#F2A93B', '#FFE08A'], 64, 96)] },
    { text: 'Amen!', bubble: { left: 14, top: 50 }, bursts: [{ color: '#F2A93B', width: 3, top: 46 }], particles: [spark(['#FFE08A', '#F2A93B', '#FFE08A'], 66, 50)] },
    {
      text: 'Amen!',
      bubble: { left: 10, top: 30 },
      bursts: [{ color: '#F2C462', width: 3, top: 30 }, { color: '#FFE08A', width: 2, delay: 200, top: 30 }],
      particles: [spark(['#FFE08A', '#F2C462', '#FFE08A'], 70, 24), spark(['#FFF3C4', '#F2A93B', '#FFE08A'], 22, 90, 150)],
    },
  ],
  dragon: [
    { text: 'Crack!', bubble: { left: 16, top: 60 }, bursts: [], particles: [{ kind: 'zig', color: '#F2C462', w: 34, h: 30, left: 66, top: 64 }] },
    { text: 'Splash!', bubble: { left: 14, top: 50 }, bursts: [{ color: '#86E6D9', width: 3, top: 66 }], particles: [drops('#86E6D9', 40, 30, 64, 60)] },
    {
      text: 'Splash!',
      bubble: { left: 10, top: 30 },
      bursts: [{ color: '#86E6D9', width: 3 }, { color: '#F2C462', width: 2, delay: 200 }],
      particles: [drops('#86E6D9', 40, 30, 70, 36), drops('#1C9C98', 30, 24, 18, 120, 150)],
    },
  ],
};

const POP_MS = 1500;
const SHOW_MS = 1600;

/** A bubble or particle that pops in, drifts up and fades (design `.pop`). With reduced motion it just shows. */
function Pop({ delay = 0, reduced, style, children }: { delay?: number; reduced: boolean; style: object; children: React.ReactNode }) {
  const p = useSharedValue(reduced ? 0.2 : 0);
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(delay, withTiming(1, { duration: POP_MS, easing: Easing.out(Easing.quad) }));
  }, [p, delay, reduced]);
  const anim = useAnimatedStyle(() => ({
    opacity: reduced ? 1 : keyframe(p.value, [0, 0.2, 0.7, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: keyframe(p.value, [0, 0.2, 0.7, 1], [10, 0, -14, -40]) },
      { scale: keyframe(p.value, [0, 0.2, 0.7, 1], [0.6, 1.1, 1, 1]) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style, anim]}>
      {children}
    </Animated.View>
  );
}

/** A ring that expands from 0.3x to 1.8x while fading (design `.burst`). */
function BurstRing({ color, width, delay = 0, size, top }: { color: string; width: number; delay?: number; size: number; top: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
  }, [p, delay]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value === 0 && delay > 0 ? 0 : 0.9 * (1 - p.value),
    transform: [{ scale: 0.3 + 1.5 * p.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: top as `${number}%`,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: width,
        },
        anim,
      ]}
    />
  );
}

function ParticleArt({ p, k }: { p: Particle; k: number }) {
  const common = { width: p.w * k, height: p.h * k };
  switch (p.kind) {
    case 'heart':
      return (
        <Svg {...common} viewBox="0 0 24 24">
          <Path d="M12 21 C5 15 2 11.5 2 8.5 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8.5 C22 11.5 19 15 12 21 Z" fill={p.color} />
        </Svg>
      );
    case 'note':
      return (
        <Svg {...common} viewBox="0 0 22 26">
          <Path d="M8 20 L8 4 L20 1 L20 17" stroke={p.color} strokeWidth={2.4} fill="none" />
          <Circle cx={5} cy={20} r={4} fill={p.color} />
          <Circle cx={17} cy={17} r={4} fill={p.color} />
        </Svg>
      );
    case 'wave':
      return (
        <Svg {...common} viewBox="0 0 30 30">
          <Path d="M6 8 Q12 15 6 22 M14 4 Q22 15 14 26" stroke={p.color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'spark': {
      const [a, b, c] = p.dots ?? ['#FFE08A', '#F2A93B', '#FFE08A'];
      return (
        <Svg {...common} viewBox="0 0 34 30">
          <Circle cx={6} cy={20} r={3} fill={a} />
          <Circle cx={17} cy={8} r={3.5} fill={b} />
          <Circle cx={28} cy={18} r={2.5} fill={c} />
        </Svg>
      );
    }
    case 'drops':
      return (
        <Svg {...common} viewBox="0 0 40 30">
          <Path
            d="M8 4 C12 10 12 14 8 16 C4 14 4 10 8 4 Z M22 0 C26 7 26 11 22 13 C18 11 18 7 22 0 Z M34 8 C37 13 37 16 34 18 C31 16 31 13 34 8 Z"
            fill={p.color}
          />
        </Svg>
      );
    case 'zig':
      return (
        <Svg {...common} viewBox="0 0 34 30">
          <Path d="M4 18 L10 10 L16 18 L22 8 L30 16" stroke={p.color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
}

type Props = {
  id: PetId;
  stage: PipStage;
  /** Rendered width of the pet in dp; the reaction scales with it. */
  size: number;
  /** The pet art itself. */
  children: React.ReactNode;
  onTap?: () => void;
};

/**
 * Wraps a pet so tapping it plays its reaction. Retapping restarts it; it clears after 1.6s.
 * The squash-and-spring: down 4 and 1.08x0.9 at 20%, up 26 and 0.95x1.06 at 45%, land 1.04x0.96 at 75%, settle.
 */
export function TapPet({ id, stage, size, children, onTap }: Props) {
  const reduced = useReducedMotion();
  const k = size / 220;
  const height = (size * 260) / 240;
  const cardH = height; // popups use the 260-tall design card, scaled to the pet's box
  const r = REACTIONS[id][stage - 1];
  const [shown, setShown] = useState(0); // 0 hidden, otherwise a counter so a retap remounts the pops
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sq = useSharedValue(1);
  const squash = useAnimatedStyle(() => ({
    transform: [
      { translateY: keyframe(sq.value, [0, 0.2, 0.45, 0.75, 1], [0, 4 * k, -26 * k, 0, 0]) },
      { scaleX: keyframe(sq.value, [0, 0.2, 0.45, 0.75, 1], [1, 1.08, 0.95, 1.04, 1]) },
      { scaleY: keyframe(sq.value, [0, 0.2, 0.45, 0.75, 1], [1, 0.9, 1.06, 0.96, 1]) },
    ],
  }));

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    [],
  );

  const tap = () => {
    onTap?.();
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setShown(n => n + 1);
    if (!reduced) {
      sq.set(0);
      sq.set(withTiming(1, { duration: 800, easing: Easing.linear }));
    }
    clearTimer.current = setTimeout(() => setShown(0), SHOW_MS);
  };

  const px = (designPx: number) => (designPx * cardH) / 260;

  return (
    <View style={{ width: size, height }}>
      <Pressable
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel="Tap your companion"
        style={{ width: size, height }}>
        <Animated.View style={[{ width: size, height, transformOrigin: '50% 100%' }, squash]}>{children}</Animated.View>
      </Pressable>
      {shown > 0 ? (
        <View key={shown} pointerEvents="none" style={StyleSheet.absoluteFill}>
          {reduced
            ? null
            : r.bursts.map((b, i) => (
                <BurstRing
                  key={i}
                  color={b.color}
                  width={b.width}
                  delay={b.delay}
                  size={140 * k}
                  top={`${b.top ?? 50}%`}
                />
              ))}
          <Pop reduced={reduced} style={{ left: `${r.bubble.left}%`, top: px(r.bubble.top) }}>
            <View style={styles.bubble}>
              <Text style={[styles.bubbleText, { fontSize: 13 * Math.max(k, 0.8) }]}>{r.text}</Text>
            </View>
          </Pop>
          {r.particles.map((p, i) => (
            <Pop key={i} reduced={reduced} delay={p.delay} style={{ left: `${p.left}%`, top: px(p.top) }}>
              <ParticleArt p={p} k={k} />
            </Pop>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#F2E9D8' },
  bubbleText: { color: '#1A2230', fontFamily: FONTS.bodyBold },
});
