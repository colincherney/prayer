import { useIsFocused } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
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

/**
 * Whether pet animation should run: the caller wants it, the OS reduce-motion setting is off, and its screen is the
 * one showing. Tabs stay mounted, so without that last check every tab would keep animating out of sight.
 */
export function useMotionEnabled(animated: boolean): boolean {
  const reduce = useReducedMotion();
  const focused = useIsFocused();
  const paused = useSyncExternalStore(subscribePause, () => backgroundPaused);
  return animated && !reduce && focused && !paused;
}

// A full-screen moment (the winter intro clip) covers the screen underneath, which would otherwise keep animating
// behind it and compete with the video. While one is up, every loop that uses useMotionEnabled rests.
let backgroundPaused = false;
const pauseListeners = new Set<() => void>();
function subscribePause(fn: () => void) {
  pauseListeners.add(fn);
  return () => {
    pauseListeners.delete(fn);
  };
}

/** Pauses (or resumes) background motion app-wide. */
export function pauseBackgroundMotion(paused: boolean) {
  if (backgroundPaused === paused) return;
  backgroundPaused = paused;
  pauseListeners.forEach(fn => fn());
}

/** How many steps a loop of `durationMs` gets at 30 frames a second, or enough to run at the screen's full rate if `smooth`. */
export function frameSteps(durationMs: number, smooth = false): number {
  return Math.max(1, Math.round(durationMs / (smooth ? 1 : 33)));
}

/**
 * Rounds loop progress to one of `steps` values. Every change to an SVG redraws its whole canvas, and Reanimated skips
 * the update when nothing changed, so this halves those redraws.
 */
export function stepped(p: number, steps: number): number {
  'worklet';
  return Math.round(p * steps) / steps;
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
      p.set(rest);
      return;
    }
    p.set(0);
    p.set(withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false),
    ));
    return () => cancelAnimation(p);
  }, [p, durationMs, delayMs, enabled, rest]);
  return p;
}
