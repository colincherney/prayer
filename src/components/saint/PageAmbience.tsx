import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import type { PrayerRoomName } from './prayerRoom';
import type { ThemeName } from './theme';

type Shape =
  | 'glow' | 'star' | 'flake' | 'leaf' | 'petal' | 'heart' | 'bat' | 'bird'
  | 'dove' | 'cloud' | 'butterfly' | 'seed' | 'drop' | 'ring' | 'streak';
type Motion = 'fall' | 'rise' | 'wander' | 'cross' | 'twinkle' | 'ripple' | 'shoot';

type Layer = {
  shape: Shape;
  motion: Motion;
  colors: string[];
  count: number;
  /** Smallest and largest size, in dp. */
  size: [number, number];
  /** Shortest and longest loop, in seconds. */
  seconds: [number, number];
  /** Strongest opacity a piece reaches. */
  peak: number;
};

const layer = (shape: Shape, motion: Motion, colors: string[], count: number, size: [number, number], seconds: [number, number], peak: number): Layer =>
  ({ shape, motion, colors, count, size, seconds, peak });

/** Every theme and prayer room has its own effect, so a new room won't type-check until it gets one. */
const AMBIENCE: Record<PrayerRoomName | ThemeName, Layer[]> = {
  // Themes
  cream: [layer('glow', 'wander', ['#D9A066', '#E8C08A'], 14, [5, 9], [9, 15], 0.55)],
  navy: [
    layer('star', 'twinkle', ['#D4A574', '#F2E9D8'], 14, [6, 11], [4, 8], 0.8),
    layer('streak', 'shoot', ['#F2E9D8'], 1, [44, 44], [16, 16], 0.7),
  ],
  forest: [layer('leaf', 'fall', ['#7F9A6A', '#A3B57F', '#8B5A3C'], 10, [11, 16], [13, 20], 0.6)],
  pink: [layer('petal', 'fall', ['#E79AB0', '#F2BBC9', '#C04668'], 12, [9, 14], [12, 19], 0.6)],

  // Prayer rooms
  lamp: [
    layer('glow', 'rise', ['#F5CBA2', '#F2A93B'], 12, [4, 7], [10, 16], 0.7),
    layer('glow', 'wander', ['#F5CBA2'], 6, [4, 6], [10, 15], 0.35),
  ],
  window: [
    layer('glow', 'wander', ['#C9A36A', '#E2C493'], 12, [5, 8], [10, 15], 0.6),
    layer('leaf', 'fall', ['#C25A36', '#B98A4A'], 4, [11, 14], [16, 22], 0.5),
  ],
  stars: [
    layer('star', 'twinkle', ['#FDE2A8', '#FFFFFF'], 16, [6, 12], [3, 7], 0.9),
    layer('streak', 'shoot', ['#FDE2A8'], 2, [46, 46], [12, 19], 0.8),
  ],
  jungle: [
    layer('glow', 'wander', ['#B7E36A', '#7EC9A8'], 12, [5, 8], [7, 12], 0.85),
    layer('drop', 'fall', ['#7EC9A8'], 8, [6, 8], [5, 8], 0.3),
  ],
  halloween: [
    layer('bat', 'cross', ['#3A2A55', '#5A3E7A'], 4, [20, 28], [14, 22], 0.75),
    layer('glow', 'rise', ['#E8913A', '#F2C462'], 9, [4, 7], [10, 15], 0.65),
  ],
  thanksgiving: [layer('leaf', 'fall', ['#B5562E', '#D98A2B', '#8A3A1E', '#C9A02E'], 13, [12, 18], [12, 19], 0.75)],
  christmas: [
    layer('flake', 'fall', ['#FFFFFF', '#DCE6F2'], 14, [8, 13], [11, 18], 0.8),
    layer('star', 'twinkle', ['#F2C462'], 6, [7, 11], [4, 7], 0.85),
  ],

  // Monthly rooms, 2027
  m2027jan: [ // New year, new mercies: fresh snow and clear winter light.
    layer('flake', 'fall', ['#FFFFFF', '#8EC9F0'], 12, [8, 12], [13, 20], 0.75),
    layer('star', 'twinkle', ['#8EC9F0', '#FFFFFF'], 7, [6, 10], [4, 7], 0.8),
  ],
  m2027feb: [ // Love is patient.
    layer('heart', 'rise', ['#F7A7BC', '#D0587A', '#FFD9E2'], 11, [9, 15], [12, 19], 0.7),
  ],
  m2027mar: [ // Be strong and courageous: open sky and wind.
    layer('cloud', 'cross', ['#FFFFFF'], 4, [44, 66], [34, 50], 0.6),
    layer('bird', 'cross', ['#1F2633'], 4, [15, 20], [18, 26], 0.5),
  ],
  m2027apr: [ // He is risen: doves and Easter light.
    layer('dove', 'cross', ['#FFFFFF', '#D8CCFA'], 3, [20, 26], [18, 26], 0.8),
    layer('petal', 'fall', ['#FFFFFF', '#D8CCFA'], 7, [8, 12], [14, 20], 0.55),
    layer('star', 'twinkle', ['#F7E9B0'], 5, [6, 10], [4, 7], 0.75),
  ],
  m2027may: [ // Consider the lilies.
    layer('butterfly', 'wander', ['#B5562E', '#FFF2D8'], 5, [15, 20], [9, 14], 0.75),
    layer('petal', 'fall', ['#FFF2D8', '#FFFFFF'], 8, [8, 12], [14, 20], 0.65),
  ],
  m2027jun: [ // Be still: ripples on quiet water.
    layer('ring', 'ripple', ['#5FBF8A', '#E6FFF4'], 6, [36, 60], [7, 11], 0.4),
    layer('glow', 'wander', ['#5FBF8A'], 6, [4, 7], [9, 13], 0.65),
  ],
  m2027jul: [ // Wings like eagles.
    layer('bird', 'cross', ['#F2C462', '#F2F6FF'], 3, [20, 26], [18, 26], 0.7),
    layer('star', 'twinkle', ['#F2F6FF', '#F2C462'], 11, [6, 10], [3, 6], 0.85),
    layer('streak', 'shoot', ['#F2C462'], 1, [44, 44], [14, 14], 0.75),
  ],
  m2027aug: [ // The Lord is my shepherd: a warm evening at rest.
    layer('glow', 'wander', ['#F7D27A', '#FFE9B8'], 11, [5, 8], [9, 14], 0.8),
    layer('star', 'twinkle', ['#FFF5E6'], 6, [5, 9], [4, 7], 0.6),
  ],
  m2027sep: [ // Taste and see: seeds carried on a harvest breeze.
    layer('seed', 'cross', ['#FFFFFF', '#FFF2D8'], 7, [15, 20], [20, 30], 0.75),
    layer('leaf', 'fall', ['#B5562E', '#C9A02E'], 4, [11, 14], [15, 21], 0.55),
  ],
  m2027oct: [ // New every morning.
    layer('leaf', 'fall', ['#F7C86A', '#C9502E', '#E8826A'], 9, [11, 16], [13, 19], 0.7),
    layer('glow', 'rise', ['#F7C86A'], 7, [4, 6], [11, 16], 0.6),
  ],
  m2027nov: [ // Give thanks: leaves and the glow of a hearth.
    layer('leaf', 'fall', ['#E8A24B', '#C9702E', '#8A3A1E'], 8, [11, 16], [14, 20], 0.65),
    layer('glow', 'rise', ['#E8A24B', '#F2C462'], 8, [4, 7], [10, 15], 0.65),
  ],
  m2027dec: [ // Advent: candlelight waiting in the dark.
    layer('glow', 'rise', ['#F2C462', '#C9433A'], 8, [4, 7], [11, 16], 0.7),
    layer('flake', 'fall', ['#F7FAFF'], 8, [7, 11], [14, 20], 0.65),
    layer('star', 'twinkle', ['#F2C462'], 6, [7, 11], [4, 7], 0.85),
  ],
};

const FILLED: Partial<Record<Shape, string>> = {
  star: 'M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z',
  leaf: 'M12 2C18 6 19 14 12 22C5 14 6 6 12 2Z',
  petal: 'M12 4C18 7 18 17 12 20C8 16 8 8 12 4Z',
  heart: 'M12 20C5 15 3 11 3 8a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-2 7-9 12Z',
  bat: 'M12 9C11 8 11 7 11 6L10 7.5C8 6 5 6 2 9C5 9 6 11 6 13C8 11 10 12 12 15C14 12 16 11 18 13C18 11 19 9 22 9C19 6 16 6 14 7.5L13 6C13 7 13 8 12 9Z',
  dove: 'M3 13C7 9 10 9 12 11C13 7 17 5 21 6C19 9 17 12 14 14C11 16 7 16 3 13Z',
  cloud: 'M6 17h12a4 4 0 0 0 .6-8A6 6 0 0 0 7 8.5 4.3 4.3 0 0 0 6 17Z',
  butterfly: 'M12 12C9 5 4 5 3 8C2 11 6 13 12 12ZM12 12C15 5 20 5 21 8C22 11 18 13 12 12ZM12 12C9 14 6 18 8 19C10 20 12 16 12 12ZM12 12C15 14 18 18 16 19C14 20 12 16 12 12Z',
  drop: 'M12 3C16 9 18 12 18 15a6 6 0 0 1-12 0C6 12 8 9 12 3Z',
};

const STROKED: Partial<Record<Shape, string>> = {
  flake: 'M12 3V21 M4.2 7.5L19.8 16.5 M19.8 7.5L4.2 16.5',
  bird: 'M2 11C6 7 9 8 12 12C15 8 18 7 22 11',
  seed: 'M12 22V10 M12 10L6 4 M12 10V3 M12 10L18 4 M12 10L8 3 M12 10L16 3',
  streak: 'M1 12H23',
};

function Art({ shape, size, color }: { shape: Shape; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shape === 'glow' ? (
        <>
          <Circle cx={12} cy={12} r={11} fill={color} opacity={0.22} />
          <Circle cx={12} cy={12} r={5.5} fill={color} />
        </>
      ) : shape === 'ring' ? (
        <Circle cx={12} cy={12} r={10} fill="none" stroke={color} strokeWidth={0.6} />
      ) : FILLED[shape] ? (
        <Path d={FILLED[shape]} fill={color} />
      ) : (
        <Path d={STROKED[shape]} fill="none" stroke={color} strokeWidth={shape === 'streak' ? 0.8 : 1.4} strokeLinecap="round" />
      )}
    </Svg>
  );
}

type Piece = {
  id: string;
  shape: Shape;
  motion: Motion;
  color: string;
  size: number;
  duration: number;
  peak: number;
  /** Where the loop starts, 0 to 1, so the page is already populated when it opens. */
  phase: number;
  x: number;
  y: number;
  /** Side-to-side reach for falling and rising pieces, and how far a wandering one strays. */
  reach: number;
  turns: number;
  spin: number;
  direction: 1 | -1;
};

function seeded(text: string) {
  let s = 7;
  for (let i = 0; i < text.length; i++) s = (s * 31 + text.charCodeAt(i)) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * The nook covers the middle of the page, so most pieces go in the side margins and the bands above and below it,
 * where they can be seen.
 */
function pieces(name: string, layers: Layer[]): Piece[] {
  const rand = seeded(name);
  const between = ([low, high]: [number, number]) => low + rand() * (high - low);
  return layers.flatMap((l, layerIndex) => Array.from({ length: l.count }, (_, index) => {
    const side = index % 3;
    const x = side === 0 ? rand() * 0.09 : side === 1 ? 0.91 + rand() * 0.09 : rand();
    const y = l.motion === 'cross' || side === 2 ? (index % 2 ? rand() * 0.12 : 0.74 + rand() * 0.2) : rand();
    return {
      id: `${layerIndex}-${index}`,
      shape: l.shape,
      motion: l.motion,
      color: l.colors[index % l.colors.length],
      size: between(l.size),
      duration: between(l.seconds) * 1000,
      peak: l.peak * (0.7 + rand() * 0.3),
      phase: rand(),
      x,
      y,
      reach: 10 + rand() * 18,
      turns: 1 + rand() * 2,
      spin: (rand() - 0.5) * 540,
      direction: index % 2 ? 1 : -1,
    };
  }));
}

function Particle({ piece, width, height }: { piece: Piece; width: number; height: number }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(piece.phase);

  useEffect(() => {
    if (reducedMotion) return;
    const linear = Easing.linear;
    progress.set(withSequence(
      withTiming(1, { duration: piece.duration * (1 - piece.phase), easing: linear }),
      withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: piece.duration, easing: linear })), -1),
    ));
    return () => cancelAnimation(progress);
  }, [progress, piece.duration, piece.phase, reducedMotion]);

  const motionStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const { motion, size, peak, reach, turns, spin, direction, x, y } = piece;
    const wave = Math.sin(p * Math.PI * 2 * turns);
    const edges = Math.min(1, p / 0.1, (1 - p) / 0.1);
    const startX = x * width - size / 2;
    const startY = y * height - size / 2;
    if (motion === 'fall' || motion === 'rise') {
      const travel = (height + size * 2) * p - size;
      return {
        opacity: peak * edges,
        transform: [
          { translateX: startX + wave * reach },
          { translateY: motion === 'fall' ? travel : height - travel },
          { rotate: `${spin * p}deg` },
        ],
      };
    }
    if (motion === 'cross') {
      const travel = (width + size * 2) * p - size;
      return {
        opacity: peak * edges,
        transform: [
          { translateX: direction > 0 ? travel : width - travel },
          { translateY: startY + wave * 8 },
          { scaleX: direction > 0 ? 1 : -1 },
        ],
      };
    }
    if (motion === 'twinkle') {
      const shine = Math.sin(p * Math.PI);
      return {
        opacity: peak * shine * shine,
        transform: [{ translateX: startX }, { translateY: startY }, { scale: 0.7 + shine * 0.3 }],
      };
    }
    if (motion === 'ripple') {
      return {
        opacity: peak * (1 - p),
        transform: [{ translateX: startX }, { translateY: startY }, { scale: 0.3 + p * 1.2 }],
      };
    }
    if (motion === 'shoot') {
      const flight = Math.min(1, p / 0.1);
      return {
        opacity: p < 0.1 ? peak * Math.sin(flight * Math.PI) : 0,
        transform: [
          { translateX: width * (0.95 - flight * 0.6) },
          { translateY: height * (0.02 + flight * 0.14) },
          { rotate: '-22deg' },
        ],
      };
    }
    return {
      opacity: peak * (0.55 + 0.45 * Math.sin(p * Math.PI * 2 * turns)) * edges,
      transform: [
        { translateX: startX + Math.sin(p * Math.PI * 2) * reach },
        { translateY: startY + Math.cos(p * Math.PI * 2 * turns) * reach * 0.7 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.piece, motionStyle]}>
      <Art shape={piece.shape} size={piece.size} color={piece.color} />
    </Animated.View>
  );
}

/** Small moving touches for the page background, picked by the active theme or prayer room. Fills its parent. */
export function PageAmbience({ name }: { name: string }) {
  const [focused, setFocused] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const shown = useMemo(() => pieces(name, AMBIENCE[name as keyof typeof AMBIENCE] ?? []), [name]);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={e => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      style={styles.fill}>
      {focused && box.width > 0
        ? shown.map(piece => <Particle key={`${name}-${piece.id}`} piece={piece} width={box.width} height={box.height} />)
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  piece: { position: 'absolute', left: 0, top: 0 },
});
