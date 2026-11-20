import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useMotionEnabled } from '@/components/pets/anim';

// Cheap scene motion. Anything that moves inside an SVG makes the whole SVG redraw, every frame, so a scene with a
// dozen falling flakes repaints the entire illustration 30-60 times a second. These pieces are plain views moved by
// native transforms instead (no redraw at all), and each layer runs off one shared clock rather than one animation
// per flake. The scene's still art goes in ordinary SVGs that are drawn once.

/** One looping 0..1 clock for a whole layer. Parks at `rest` when motion is off or the screen isn't showing. */
function useClock(durationMs: number, animated: boolean, rest = 0): SharedValue<number> {
  const enabled = useMotionEnabled(animated);
  const clock = useSharedValue(rest);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(clock);
      clock.set(rest);
      return;
    }
    clock.set(0);
    clock.set(withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(clock);
  }, [clock, durationMs, enabled, rest]);
  return clock;
}

function useBox() {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
  };
  return [box, onLayout] as const;
}

/** x (0..1 of the width), radius in dp, and where in the fall it starts (0..1). */
export type Flake = [x: number, r: number, phase: number];

function FallingFlake({ flake, clock, height, color, petal }: { flake: Flake; clock: SharedValue<number>; height: number; color: string; petal?: boolean }) {
  const [, r, phase] = flake;
  const style = useAnimatedStyle(() => {
    const p = (clock.get() + phase) % 1;
    const edges = Math.min(1, p / 0.06, (1 - p) / 0.06);
    return {
      opacity: 0.95 * edges,
      transform: petal
        ? [{ translateY: -12 + p * (height + 24) }, { translateX: Math.sin(p * Math.PI * 4 + phase * 6) * 14 }, { rotate: `${(p * 540 + phase * 360) % 360}deg` }]
        : [{ translateY: -12 + p * (height + 24) }, { translateX: Math.sin(p * Math.PI * 4 + phase * 6) * 7 }],
    };
  });
  // a rose petal: a leaf shape, two round corners and two pointed ones
  const shape = petal
    ? { width: r * 2.2, height: r * 1.6, borderTopLeftRadius: r * 1.6, borderBottomRightRadius: r * 1.6, borderTopRightRadius: r * 0.2, borderBottomLeftRadius: r * 0.2 }
    : { width: r * 2, height: r * 2, borderRadius: r };
  return <Animated.View style={[styles.dot, { left: `${flake[0] * 100}%`, backgroundColor: color }, shape, style]} />;
}

/**
 * Snow falling over the whole parent (or rose petals, with `petal`). One clock drives every flake; each starts at its
 * own point in the fall.
 */
export function SnowFall({ flakes, duration = 10000, color = '#FFFFFF', animated = true, petal }: { flakes: Flake[]; duration?: number; color?: string; animated?: boolean; petal?: boolean }) {
  const [box, onLayout] = useBox();
  const clock = useClock(duration, animated, 0.35);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {box.height > 0 ? flakes.map((f, i) => <FallingFlake key={i} flake={f} clock={clock} height={box.height} color={color} petal={petal} />) : null}
    </View>
  );
}

/** x, y (0..1 of the parent), radius in dp, and phase (0..1). */
export type Star = [x: number, y: number, r: number, phase: number];

function TwinklingStar({ star, clock, color }: { star: Star; clock: SharedValue<number>; color: string }) {
  const [x, y, r, phase] = star;
  const style = useAnimatedStyle(() => {
    const shine = 0.5 + 0.5 * Math.sin((clock.get() + phase) * Math.PI * 2);
    return { opacity: 0.25 + 0.75 * shine };
  });
  return <Animated.View style={[styles.dot, { left: `${x * 100}%`, top: `${y * 100}%`, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color }, style]} />;
}

/** Stars that twinkle (opacity only, the cheapest thing a view can animate). */
export function Twinkles({ stars, duration = 2600, color = '#FBF4E6', animated = true }: { stars: Star[]; duration?: number; color?: string; animated?: boolean }) {
  const clock = useClock(duration, animated, 0.25);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => <TwinklingStar key={i} star={s} clock={clock} color={color} />)}
    </View>
  );
}

/**
 * A full-size layer (usually an SVG of aurora ribbons or mist) that drifts side to side, and optionally breathes in
 * opacity. Moving the whole layer is a native transform, so the SVG inside is drawn once and never redrawn.
 */
export function DriftLayer({ children, reach = 24, duration = 28000, breathe, animated = true }: {
  children: React.ReactNode;
  /** How far it drifts each way, in dp. */
  reach?: number;
  duration?: number;
  /** [lowest, highest] opacity to breathe between, once per loop. */
  breathe?: [number, number];
  animated?: boolean;
}) {
  const clock = useClock(duration, animated, 0.25);
  const style = useAnimatedStyle(() => {
    const wave = Math.sin(clock.get() * Math.PI * 2);
    return {
      opacity: breathe ? breathe[0] + (breathe[1] - breathe[0]) * (0.5 + 0.5 * wave) : 1,
      transform: [{ translateX: wave * reach }],
    };
  });
  // A little wider than the screen, so the edges never show while it drifts (a negative reach drifts the other way).
  const pad = Math.abs(reach);
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: -pad, right: -pad }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 0 },
});
