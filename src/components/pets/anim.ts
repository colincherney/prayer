import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Piecewise-linear keyframes with an ease-in-out curve between stops, the way the
 * CSS keyframes in design/*.dc.html behave. `p` is loop progress in 0..1.
 */
export function keyframe(p: number, stops: readonly number[], vals: readonly number[]): number {
  'worklet';
  if (p <= stops[0]) return vals[0];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p <= stops[i + 1]) {
      const t = (p - stops[i]) / (stops[i + 1] - stops[i]);
      const e = (1 - Math.cos(Math.PI * t)) / 2;
      return vals[i] + (vals[i + 1] - vals[i]) * e;
    }
  }
  return vals[vals.length - 1];
}

/** Whether pet animation should run: the caller wants it and the OS reduce-motion setting is off. */
export function useMotionEnabled(animated: boolean): boolean {
  const reduce = useReducedMotion();
  return animated && !reduce;
}

/**
 * A looping 0..1 progress value (like one CSS animation with `infinite`).
 * When disabled it parks at `rest`, the progress whose pose looks right when still.
 */
export function useLoop(durationMs: number, delayMs: number, enabled: boolean, rest = 0) {
  const p = useSharedValue(rest);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(p);
      p.value = rest;
      return;
    }
    p.value = 0;
    p.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(p);
  }, [p, durationMs, delayMs, enabled, rest]);
  return p;
}
