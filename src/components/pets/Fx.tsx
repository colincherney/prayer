import React, { createContext, useContext, useEffect } from 'react';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Defs, G, Line, Path, Polyline, RadialGradient, Stop } from 'react-native-svg';

import { frameSteps, keyframe, stepped, useLoop, useMotionEnabled } from './anim';

const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);

export type Pose = { o?: number; tx?: number; ty?: number; rot?: number; s?: number; sx?: number; sy?: number };
export type Preset = { dur: number; stops: number[]; poses: Pose[]; rest: number; linear?: boolean };

/** Lets a pet turn all of its loops off (thumbnails) without threading a prop through every layer. */
export const PetMotion = createContext(true);
/** Lifts the 30fps cap on loops inside it, for the page where a pet is the main event. */
export const SmoothMotion = createContext(false);

function lerpKeyframe(p: number, stops: readonly number[], vals: readonly number[]): number {
  'worklet';
  if (p <= stops[0]) return vals[0];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p <= stops[i + 1]) {
      const t = (p - stops[i]) / (stops[i + 1] - stops[i]);
      return vals[i] + (vals[i + 1] - vals[i]) * t;
    }
  }
  return vals[vals.length - 1];
}

const THREE = [0, 0.5, 1];

/** Loops from design/Me.dc.html, as keyframe poses. `rest` is the progress used when motion is off. */
const PRESETS = {
  // ---- The redesigned nook art ----
  artFlicker: { dur: 1300, stops: [0, 0.3, 0.6, 1], poses: [{ sx: 1, sy: 1 }, { sx: 0.88, sy: 1.1 }, { sx: 1.06, sy: 0.94 }, { sx: 1, sy: 1 }], rest: 0 },
  artSway: { dur: 4000, stops: THREE, poses: [{ rot: -1.5 }, { rot: 1.5 }, { rot: -1.5 }], rest: 0.25 },
  artSwing: { dur: 3000, stops: THREE, poses: [{ rot: -5 }, { rot: 5 }, { rot: -5 }], rest: 0.25 },
  artBulb: { dur: 2000, stops: THREE, poses: [{ o: 0.55 }, { o: 1 }, { o: 0.55 }], rest: 0.5 },
  artTwinkle: { dur: 2600, stops: THREE, poses: [{ o: 0.3 }, { o: 1 }, { o: 0.3 }], rest: 0.5 },
  twinkle: { dur: 2200, stops: THREE, poses: [{ o: 0.25, s: 0.7 }, { o: 1, s: 1.1 }, { o: 0.25, s: 0.7 }], rest: 0.5 },
  glow: { dur: 3000, stops: THREE, poses: [{ o: 0.1 }, { o: 0.28 }, { o: 0.1 }], rest: 0.25 },
  glowb: { dur: 2000, stops: THREE, poses: [{ o: 0.3 }, { o: 0.5 }, { o: 0.3 }], rest: 0.25 },
  bokeh: { dur: 5000, stops: THREE, poses: [{ o: 0.08 }, { o: 0.26 }, { o: 0.08 }], rest: 0.25 },
  bigglow: { dur: 4000, stops: THREE, poses: [{ o: 0.35 }, { o: 0.8 }, { o: 0.35 }], rest: 0.25 },
  shimmer: { dur: 4000, stops: THREE, poses: [{ o: 0.6 }, { o: 1 }, { o: 0.6 }], rest: 0.5 },
  flicker: { dur: 1400, stops: [0, 0.4, 0.7, 1], poses: [{ s: 1 }, { s: 0.94 }, { s: 1.03 }, { s: 1 }], rest: 0 },
  sway: { dur: 3400, stops: THREE, poses: [{ rot: -3 }, { rot: 3 }, { rot: -3 }], rest: 0.25 },
  swing: { dur: 4000, stops: THREE, poses: [{ rot: -4 }, { rot: 4 }, { rot: -4 }], rest: 0.25 },
  swingFast: { dur: 900, stops: THREE, poses: [{ rot: -4 }, { rot: 4 }, { rot: -4 }], rest: 0.25 },
  driftA: { dur: 18000, stops: THREE, poses: [{ tx: -24 }, { tx: 24 }, { tx: -24 }], rest: 0.25 },
  driftB: { dur: 24000, stops: THREE, poses: [{ tx: 24 }, { tx: -24 }, { tx: 24 }], rest: 0.25 },
  breathe: { dur: 3600, stops: THREE, poses: [{ s: 1 }, { s: 1.03 }, { s: 1 }], rest: 0 },
  smoke: { dur: 3300, stops: [0, 0.25, 1], poses: [{ o: 0, ty: 0 }, { o: 0.55, ty: -9 }, { o: 0, ty: -34 }], rest: 0 },
  mote: { dur: 4000, stops: THREE, poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.9, tx: 6, ty: -14 }, { o: 0, tx: 0, ty: 0 }], rest: 0 },
  spark: { dur: 3000, stops: [0, 0.2, 1], poses: [{ o: 0, ty: 0 }, { o: 1, ty: -18 }, { o: 0, ty: -90 }], rest: 0 },
  petal: { dur: 9000, stops: [0, 0.1, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 0.9, tx: 38, ty: 6, rot: 22 }, { o: 0.9, tx: 342, ty: 54, rot: 198 }, { o: 0, tx: 380, ty: 60, rot: 220 }], rest: 0 },
  blink: { dur: 4200, stops: [0, 0.91, 0.94, 1], poses: [{ sy: 1 }, { sy: 1 }, { sy: 0.1 }, { sy: 1 }], rest: 0 },
  bob5: { dur: 3200, stops: THREE, poses: [{ ty: 0 }, { ty: -5 }, { ty: 0 }], rest: 0 },
  bob6: { dur: 3200, stops: THREE, poses: [{ ty: 0 }, { ty: -6 }, { ty: 0 }], rest: 0 },
  bob7: { dur: 3200, stops: THREE, poses: [{ ty: 0 }, { ty: -7 }, { ty: 0 }], rest: 0 },
  fly: { dur: 2200, stops: THREE, poses: [{ ty: 0 }, { ty: -12 }, { ty: 0 }], rest: 0 },
  flap: { dur: 1000, stops: THREE, poses: [{ rot: 0 }, { rot: -16 }, { rot: 0 }], rest: 0 },
  flapR: { dur: 1000, stops: THREE, poses: [{ rot: 0 }, { rot: 16 }, { rot: 0 }], rest: 0 },
  flapFast: { dur: 550, stops: THREE, poses: [{ rot: 0 }, { rot: -16 }, { rot: 0 }], rest: 0 },
  flapRFast: { dur: 550, stops: THREE, poses: [{ rot: 0 }, { rot: 16 }, { rot: 0 }], rest: 0 },
  peck: { dur: 2600, stops: [0, 0.78, 0.84, 0.9, 1], poses: [{ tx: 0, ty: 0 }, { tx: 0, ty: 0 }, { tx: 3, ty: 5 }, { tx: 0, ty: 0 }, { tx: 0, ty: 0 }], rest: 0 },
  spin: { dur: 24000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  glowDove: { dur: 3000, stops: THREE, poses: [{ o: 0.08 }, { o: 0.22 }, { o: 0.08 }], rest: 0.25 },
  glowLion: { dur: 3000, stops: THREE, poses: [{ o: 0.08 }, { o: 0.24 }, { o: 0.08 }], rest: 0.25 },
  glowEmber: { dur: 2400, stops: THREE, poses: [{ o: 0.1 }, { o: 0.26 }, { o: 0.1 }], rest: 0.25 },
  glowDragon: { dur: 3000, stops: THREE, poses: [{ o: 0.08 }, { o: 0.2 }, { o: 0.08 }], rest: 0.25 },
  swish: { dur: 1800, stops: THREE, poses: [{ rot: 0 }, { rot: -16 }, { rot: 0 }], rest: 0 },
  tilt: { dur: 4000, stops: [0, 0.6, 0.7, 0.85, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -8 }, { rot: -8 }, { rot: 0 }], rest: 0 },
  breatheLion: { dur: 3000, stops: THREE, poses: [{ s: 1 }, { s: 1.04 }, { s: 1 }], rest: 0 },
  breatheRing: { dur: 3000, stops: THREE, poses: [{ s: 1, o: 0.35 }, { s: 1.08, o: 0.6 }, { s: 1, o: 0.35 }], rest: 0.5 },
  flickerEmber: { dur: 1600, stops: [0, 0.3, 0.6, 1], poses: [{ s: 1, rot: 0 }, { s: 1.01, rot: -3 }, { s: 0.99, rot: 3 }, { s: 1, rot: 0 }], rest: 0 },
  sparkE: { dur: 2400, stops: [0, 0.2, 1], poses: [{ o: 0, ty: 0 }, { o: 1, ty: -12 }, { o: 0, ty: -60 }], rest: 0 },
  swayDragon: { dur: 3600, stops: THREE, poses: [{ rot: 0 }, { rot: -4 }, { rot: 0 }], rest: 0 },
  flick: { dur: 2200, stops: THREE, poses: [{ rot: 0 }, { rot: 12 }, { rot: 0 }], rest: 0 },
  wobble: { dur: 2800, stops: [0, 0.8, 0.85, 0.9, 0.95, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -5 }, { rot: 5 }, { rot: -3 }, { rot: 0 }], rest: 0 },
  // ---- Idle extras from ANIMATIONS.md (evolution boards). Multi-stop ones are linear so their stop values match the CSS. ----
  grass: { dur: 3000, stops: THREE, poses: [{ rot: -6 }, { rot: 6 }, { rot: -6 }], rest: 0.5 },
  jingle: { dur: 3200, stops: [0, 0.7, 0.75, 0.85, 1], poses: [{ o: 0 }, { o: 0 }, { o: 1 }, { o: 1 }, { o: 0 }], rest: 0, linear: true },
  noteFloat: { dur: 4000, stops: [0, 0.55, 0.65, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0, tx: 0, ty: 0 }, { o: 1, tx: 2.2, ty: -7.6 }, { o: 0, tx: 10, ty: -34 }], rest: 0, linear: true },
  featherLamb: { dur: 6000, stops: [0, 0.15, 0.5, 0.85, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 0.9, tx: -3.6, ty: 15, rot: 7.5 }, { o: 0.9, tx: -12, ty: 50, rot: 25 }, { o: 0.9, tx: 2, ty: 85, rot: -3 }, { o: 0, tx: 8, ty: 100, rot: -15 }], rest: 0, linear: true },
  featherDove: { dur: 6000, stops: [0, 0.15, 0.5, 0.85, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 0.9, tx: -3.6, ty: 12, rot: 7.5 }, { o: 0.9, tx: -12, ty: 40, rot: 25 }, { o: 0.9, tx: 2, ty: 68, rot: -3 }, { o: 0, tx: 8, ty: 80, rot: -15 }], rest: 0, linear: true },
  haloFloat: { dur: 2400, stops: THREE, poses: [{ ty: 0 }, { ty: -4 }, { ty: 0 }], rest: 0 },
  leafFall: { dur: 5000, stops: [0, 0.4, 0.48, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 0, tx: 0, ty: 0, rot: 0 }, { o: 1, tx: -2.4, ty: 8, rot: 26.7 }, { o: 0, tx: -18, ty: 60, rot: 200 }], rest: 0, linear: true },
  trail: { dur: 2000, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.9, tx: -8, ty: 1.2 }, { o: 0, tx: -40, ty: 6 }], rest: 0 },
  flutter: { dur: 7000, stops: [0, 0.25, 0.5, 0.75, 1], poses: [{ tx: 0, ty: 0 }, { tx: 30, ty: -20 }, { tx: 60, ty: 4 }, { tx: 26, ty: 18 }, { tx: 0, ty: 0 }], rest: 0 },
  wingBeat: { dur: 300, stops: THREE, poses: [{ sx: 1 }, { sx: 0.25 }, { sx: 1 }], rest: 0 },
  yawn: { dur: 6000, stops: [0, 0.78, 0.84, 0.92, 1], poses: [{ sy: 0.05, o: 0 }, { sy: 0.05, o: 0 }, { sy: 1, o: 1 }, { sy: 1, o: 1 }, { sy: 0.05, o: 0 }], rest: 0 },
  moteLion: { dur: 4000, stops: THREE, poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.8, tx: 6, ty: -16 }, { o: 0, tx: 0, ty: 0 }], rest: 0 },
  flash: { dur: 3400, stops: [0, 0.7, 0.8, 0.9, 1], poses: [{ o: 0, s: 0.3 }, { o: 0, s: 0.3 }, { o: 1, s: 1.2 }, { o: 0, s: 0.6 }, { o: 0, s: 0.3 }], rest: 0.8 },
  wind: { dur: 4000, stops: [0, 0.3, 1], poses: [{ o: 0, tx: -20 }, { o: 0.5, tx: -2 }, { o: 0, tx: 40 }], rest: 0, linear: true },
  emberPop: { dur: 2600, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 1.6, ty: -9.2 }, { o: 0, tx: 8, ty: -46 }], rest: 0 },
  drip: { dur: 6000, stops: [0, 0.3, 0.4, 0.9, 1], poses: [{ o: 0, ty: 0 }, { o: 0, ty: 0 }, { o: 1, ty: 5.7 }, { o: 1, ty: 34 }, { o: 0, ty: 38 }], rest: 0, linear: true },
  smokeE: { dur: 4000, stops: [0, 0.25, 1], poses: [{ o: 0, ty: 0 }, { o: 0.4, ty: -7.5 }, { o: 0, ty: -30 }], rest: 0 },
  spin30: { dur: 30000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  rise: { dur: 4000, stops: [0, 0.15, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.8, tx: 0.9, ty: -13.5 }, { o: 0, tx: 6, ty: -90 }], rest: 0.15 },
  crack: { dur: 2800, stops: THREE, poses: [{ o: 0.15 }, { o: 1 }, { o: 0.15 }], rest: 0.5 },
  ripple: { dur: 3000, stops: [0, 1], poses: [{ o: 0.6, s: 0.5 }, { o: 0, s: 1.4 }], rest: 0.3 },
  // ---- Halloween: Gourdy the pumpkin and the All Hallows' Eve room ----
  hopP: { dur: 2400, stops: [0, 0.65, 0.72, 0.8, 0.88, 1], poses: [{ ty: 0, sx: 1, sy: 1 }, { ty: 0, sx: 1, sy: 1 }, { ty: 2, sx: 1.06, sy: 0.94 }, { ty: -14, sx: 0.96, sy: 1.04 }, { ty: 0, sx: 1, sy: 1 }, { ty: 0, sx: 1, sy: 1 }], rest: 0 },
  candle: { dur: 1300, stops: [0, 0.3, 0.55, 0.75, 1], poses: [{ o: 1 }, { o: 0.75 }, { o: 0.95 }, { o: 0.8 }, { o: 1 }], rest: 0 },
  leafSway: { dur: 2600, stops: THREE, poses: [{ rot: -8 }, { rot: 8 }, { rot: -8 }], rest: 0.25 },
  sheaf: { dur: 3400, stops: THREE, poses: [{ rot: -4 }, { rot: 4 }, { rot: -4 }], rest: 0.25 },
  firefly: { dur: 4000, stops: THREE, poses: [{ o: 0.15, tx: 0, ty: 0 }, { o: 1, tx: 6, ty: -12 }, { o: 0.15, tx: 0, ty: 0 }], rest: 0.5 },
  glowP: { dur: 2600, stops: THREE, poses: [{ o: 0.12 }, { o: 0.3 }, { o: 0.12 }], rest: 0.25 },
  spin28: { dur: 28000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  twinkleSoft: { dur: 2600, stops: THREE, poses: [{ o: 0.25 }, { o: 1 }, { o: 0.25 }], rest: 0.5 },
  glowMoon: { dur: 4000, stops: THREE, poses: [{ o: 0.7 }, { o: 1 }, { o: 0.7 }], rest: 0.5 },
  mist: { dur: 28000, stops: THREE, poses: [{ tx: -30 }, { tx: 30 }, { tx: -30 }], rest: 0.25 },
  mistB: { dur: 36000, stops: THREE, poses: [{ tx: 30 }, { tx: -30 }, { tx: 30 }], rest: 0.25 },
  birds: { dur: 26000, stops: [0, 1], poses: [{ tx: -80 }, { tx: 470 }], rest: 0.4, linear: true },
  leafFallH: { dur: 9000, stops: [0, 0.08, 0.92, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 1, tx: -3, ty: 69, rot: 34 }, { o: 1, tx: -37, ty: 791, rot: 386 }, { o: 0, tx: -40, ty: 860, rot: 420 }], rest: 0, linear: true },
  flutterH: { dur: 7000, stops: [0, 0.25, 0.5, 0.75, 1], poses: [{ tx: 0, ty: 0 }, { tx: 18, ty: -12 }, { tx: 34, ty: 4 }, { tx: 14, ty: 10 }, { tx: 0, ty: 0 }], rest: 0 },
  bobH: { dur: 3200, stops: THREE, poses: [{ ty: 0 }, { ty: -4 }, { ty: 0 }], rest: 0 },
  seed: { dur: 7000, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.8, tx: 6, ty: -30 }, { o: 0, tx: 30, ty: -150 }], rest: 0 },
  // ---- Group hearth (design/Group.dc.html) and the pet screens (Share, Pray Now, Vigil) ----
  fireH: { dur: 1200, stops: [0, 0.3, 0.6, 1], poses: [{ sx: 1, sy: 1 }, { sx: 0.94, sy: 1.08 }, { sx: 1.05, sy: 0.95 }, { sx: 1, sy: 1 }], rest: 0 },
  fglow: { dur: 1600, stops: [0, 0.4, 0.7, 1], poses: [{ o: 0.7 }, { o: 0.95 }, { o: 0.8 }, { o: 0.7 }], rest: 0.4 },
  sparkH: { dur: 2400, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 0.8, ty: -9 }, { o: 0, tx: 4, ty: -46 }], rest: 0 },
  snowH: { dur: 5000, stops: [0, 0.1, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 0.6, ty: 8.8 }, { o: 1, tx: 5.4, ty: 79 }, { o: 0, tx: 6, ty: 88 }], rest: 0, linear: true },
  zH: { dur: 3600, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0, s: 0.7 }, { o: 1, tx: 2, ty: -5, s: 0.8 }, { o: 0, tx: 10, ty: -26, s: 1.2 }], rest: 0.2, linear: true },
  moteV: { dur: 4500, stops: [0, 0.25, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.9, tx: -11, ty: 13 }, { o: 0, tx: -44, ty: 52 }], rest: 0 },
  shootStar: { dur: 8000, stops: [0, 0.04, 0.1, 0.12, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 6, ty: 3 }, { o: 1, tx: 48, ty: 24 }, { o: 0, tx: 56, ty: 28 }, { o: 0, tx: 56, ty: 28 }], rest: 0, linear: true },
  dust: { dur: 9000, stops: [0, 0.2, 0.8, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.7, tx: 3, ty: -5 }, { o: 0.7, tx: 11, ty: -19 }, { o: 0, tx: 14, ty: -24 }], rest: 0, linear: true },
  stoneFlick: { dur: 1700, stops: [0, 0.35, 0.7, 1], poses: [{ o: 0.05 }, { o: 0.16 }, { o: 0.09 }, { o: 0.05 }], rest: 0.4 },
  heartUp: { dur: 3600, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0, s: 0.6 }, { o: 1, tx: 2, ty: -8, s: 1 }, { o: 0, tx: 8, ty: -44, s: 1 }], rest: 0, linear: true },
  bubbleUp: { dur: 4000, stops: [0, 0.15, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.8, tx: 1, ty: -8 }, { o: 0, tx: 5, ty: -60 }], rest: 0, linear: true },
  // ---- Lying-down poses (LyingPets.tsx) ----
  breatheLie: { dur: 3600, stops: THREE, poses: [{ sx: 1, sy: 1 }, { sx: 1.015, sy: 1.05 }, { sx: 1, sy: 1 }], rest: 0 },
  breatheSlow: { dur: 5200, stops: THREE, poses: [{ sx: 1, sy: 1 }, { sx: 1.02, sy: 1.07 }, { sx: 1, sy: 1 }], rest: 0 },
  earFlop: { dur: 3000, stops: [0, 0.8, 0.88, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -14 }, { rot: 0 }], rest: 0 },
  earFlopR: { dur: 3400, stops: [0, 0.7, 0.78, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: 14 }, { rot: 0 }], rest: 0 },
  tailFlick: { dur: 2400, stops: [0, 0.5, 0.62, 0.74, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: 16 }, { rot: -6 }, { rot: 0 }], rest: 0 },
  tailWag: { dur: 900, stops: THREE, poses: [{ rot: -10 }, { rot: 10 }, { rot: -10 }], rest: 0.5 },
  headNod: { dur: 5000, stops: [0, 0.6, 0.7, 0.85, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -7 }, { rot: -7 }, { rot: 0 }], rest: 0 },
  undulate: { dur: 3200, stops: THREE, poses: [{ ty: 0, sx: 1 }, { ty: -2, sx: 1.02 }, { ty: 0, sx: 1 }], rest: 0 },
  wobbleLie: { dur: 3000, stops: [0, 0.25, 0.5, 0.75, 1], poses: [{ rot: 0 }, { rot: 3 }, { rot: 0 }, { rot: -3 }, { rot: 0 }], rest: 0 },
  flameLie: { dur: 1500, stops: [0, 0.3, 0.6, 1], poses: [{ sx: 1, sy: 1, rot: 0 }, { sx: 0.94, sy: 1.08, rot: -4 }, { sx: 1.05, sy: 0.96, rot: 4 }, { sx: 1, sy: 1, rot: 0 }], rest: 0 },
  flameDim: { dur: 3000, stops: THREE, poses: [{ sx: 0.7, sy: 0.6, o: 0.75 }, { sx: 0.75, sy: 0.68, o: 0.9 }, { sx: 0.7, sy: 0.6, o: 0.75 }], rest: 0 },
  ruffle: { dur: 4600, stops: [0, 0.78, 0.82, 0.86, 0.9, 1], poses: [{ sy: 1 }, { sy: 1 }, { sy: 1.08 }, { sy: 0.96 }, { sy: 1.04 }, { sy: 1 }], rest: 0 },
  sprout: { dur: 2600, stops: THREE, poses: [{ rot: -10 }, { rot: 10 }, { rot: -10 }], rest: 0.25 },
  // ---- Journal desk (JournalArt.tsx) ----
  pageTurn: { dur: 7000, stops: [0, 0.1, 0.74, 0.88, 0.94, 1], poses: [{ sx: 1, o: 0 }, { sx: 1, o: 1 }, { sx: 1, o: 1 }, { sx: -1, o: 1 }, { sx: -1, o: 0 }, { sx: -1, o: 0 }], rest: 0.3, linear: true },
  quill: { dur: 3500, stops: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1], poses: [{ tx: 0, ty: 0, rot: 0 }, { tx: 6, ty: -2, rot: -6 }, { tx: 12, ty: 0, rot: 2 }, { tx: 18, ty: -2, rot: -6 }, { tx: 24, ty: 0, rot: 2 }, { tx: 30, ty: -2, rot: -6 }, { tx: 36, ty: 0, rot: 0 }, { tx: 0, ty: 0, rot: 0 }], rest: 0 },
  petalDrift: { dur: 8000, stops: [0, 0.1, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 0.9, tx: 6, ty: 8, rot: 30 }, { o: 0.9, tx: 50, ty: 70, rot: 260 }, { o: 0, tx: 56, ty: 78, rot: 300 }], rest: 0, linear: true },
  sway4: { dur: 2800, stops: THREE, poses: [{ rot: -5 }, { rot: 6 }, { rot: -5 }], rest: 0.25 },
  // ---- Monthly companions (design/ZodiacEvo.dc.html, zodiacArt.tsx). Pivots come from each element's own box. ----
  zBabyHop: { dur: 2200, stops: [0, 0.62, 0.68, 0.78, 0.88, 1], poses: [{ ty: 0, sx: 1, sy: 1 }, { ty: 0, sx: 1, sy: 1 }, { ty: 2, sx: 1.06, sy: 0.94 }, { ty: -12, sx: 0.96, sy: 1.04 }, { ty: 0, sx: 1, sy: 1 }, { ty: 0, sx: 1, sy: 1 }], rest: 0 },
  zFloat: { dur: 3600, stops: THREE, poses: [{ ty: 0 }, { ty: -9 }, { ty: 0 }], rest: 0 },
  zSwish: { dur: 1800, stops: THREE, poses: [{ rot: 0 }, { rot: -14 }, { rot: 0 }], rest: 0 },
  zEar: { dur: 3000, stops: [0, 0.8, 0.86, 0.92, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -14 }, { rot: 6 }, { rot: 0 }], rest: 0 },
  zEarR: { dur: 3000, stops: [0, 0.8, 0.86, 0.92, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: 14 }, { rot: -6 }, { rot: 0 }], rest: 0 },
  zTwinkle: { dur: 1800, stops: THREE, poses: [{ o: 0.2, s: 0.6 }, { o: 1, s: 1.15 }, { o: 0.2, s: 0.6 }], rest: 0.5 },
  zRise: { dur: 4000, stops: [0, 0.2, 1], poses: [{ o: 0, ty: 0 }, { o: 1, ty: -12 }, { o: 0, ty: -60 }], rest: 0 },
  zFloaty: { dur: 3000, stops: THREE, poses: [{ rot: -6 }, { rot: 6 }, { rot: -6 }], rest: 0.25 },
  zSway: { dur: 2800, stops: THREE, poses: [{ rot: -6 }, { rot: 6 }, { rot: -6 }], rest: 0.25 },
  zNod: { dur: 3600, stops: [0, 0.6, 0.7, 0.8, 0.86, 0.92, 1], poses: [{ ty: 0 }, { ty: 0 }, { ty: 5 }, { ty: 0 }, { ty: 3 }, { ty: 0 }, { ty: 0 }], rest: 0 },
  zLglow: { dur: 1400, stops: THREE, poses: [{ o: 0.25 }, { o: 0.5 }, { o: 0.25 }], rest: 0.25 },
  zDrift: { dur: 16000, stops: THREE, poses: [{ tx: -8 }, { tx: 8 }, { tx: -8 }], rest: 0.25 },
  zMist: { dur: 12000, stops: THREE, poses: [{ tx: -10 }, { tx: 10 }, { tx: -10 }], rest: 0.25 },
  zWingL: { dur: 1400, stops: THREE, poses: [{ rot: 0 }, { rot: 14 }, { rot: 0 }], rest: 0 },
  zGlint: { dur: 2000, stops: THREE, poses: [{ o: 0.45 }, { o: 1 }, { o: 0.45 }], rest: 0.5 },
  zPearl: { dur: 2400, stops: THREE, poses: [{ o: 0.45 }, { o: 1 }, { o: 0.45 }], rest: 0.5 },
  zRays: { dur: 3000, stops: THREE, poses: [{ o: 0.55 }, { o: 1 }, { o: 0.55 }], rest: 0.5 },
  zTwitch: { dur: 1200, stops: [0, 0.7, 0.78, 0.86, 1], poses: [{ sx: 1, sy: 1 }, { sx: 1, sy: 1 }, { sx: 1.25, sy: 0.85 }, { sx: 0.9, sy: 1.1 }, { sx: 1, sy: 1 }], rest: 0 },
  zTilt: { dur: 4000, stops: [0, 0.6, 0.7, 0.85, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -8 }, { rot: -8 }, { rot: 0 }], rest: 0 },
  zFan: { dur: 2400, stops: THREE, poses: [{ rot: 0 }, { rot: -14 }, { rot: 0 }], rest: 0 },
  zSnow: { dur: 5000, stops: [0, 0.1, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 0.6, ty: 17 }, { o: 1, tx: 5.4, ty: 153 }, { o: 0, tx: 6, ty: 170 }], rest: 0, linear: true },
  zPetal: { dur: 5000, stops: [0, 0.1, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 1, tx: -1.4, ty: 14, rot: 20 }, { o: 1, tx: -12.6, ty: 126, rot: 180 }, { o: 0, tx: -14, ty: 140, rot: 200 }], rest: 0, linear: true },
  zWhisker: { dur: 1400, stops: [0, 0.6, 0.7, 0.8, 1], poses: [{ sx: 1 }, { sx: 1 }, { sx: 1.12 }, { sx: 0.94 }, { sx: 1 }], rest: 0 },
  zFlop: { dur: 3400, stops: [0, 0.65, 0.75, 0.88, 1], poses: [{ rot: 0 }, { rot: 0 }, { rot: -28 }, { rot: -28 }, { rot: 0 }], rest: 0 },
  zFlopL: { dur: 2600, stops: THREE, poses: [{ rot: 0 }, { rot: 10 }, { rot: 0 }], rest: 0 },
  zFlopR: { dur: 2600, stops: THREE, poses: [{ rot: 0 }, { rot: -10 }, { rot: 0 }], rest: 0 },
  // The tongue: hidden (not just squashed) between flicks so no sliver shows.
  zFlick: { dur: 2400, stops: [0, 0.7, 0.76, 0.84, 1], poses: [{ sy: 0.05, o: 0 }, { sy: 0.05, o: 0 }, { sy: 1, o: 1 }, { sy: 1, o: 1 }, { sy: 0.05, o: 0 }], rest: 0 },
  // The design skews the mane; a small lean about its base reads the same.
  zMane: { dur: 2600, stops: THREE, poses: [{ rot: 0 }, { rot: -4 }, { rot: 0 }], rest: 0 },
  zWave: { dur: 1600, stops: [0, 0.25, 0.5, 0.75, 1], poses: [{ rot: 0 }, { rot: -18 }, { rot: 4 }, { rot: -14 }, { rot: 0 }], rest: 0 },
  zComb: { dur: 1200, stops: THREE, poses: [{ rot: -5 }, { rot: 5 }, { rot: -5 }], rest: 0.25 },
  zWag: { dur: 500, stops: THREE, poses: [{ rot: -12 }, { rot: 12 }, { rot: -12 }], rest: 0.25 },
  zPant: { dur: 600, stops: THREE, poses: [{ sy: 0.8 }, { sy: 1.15 }, { sy: 0.8 }], rest: 0.5 },
  zCurly: { dur: 1000, stops: THREE, poses: [{ rot: -10 }, { rot: 14 }, { rot: -10 }], rest: 0.25 },
  zLantern: { dur: 2800, stops: THREE, poses: [{ rot: -9 }, { rot: 9 }, { rot: -9 }], rest: 0.25 },
  zYarn: { dur: 2400, stops: THREE, poses: [{ rot: -24, tx: -3 }, { rot: 24, tx: 3 }, { rot: -24, tx: -3 }], rest: 0.25 },
  zPound: { dur: 1100, stops: [0, 0.45, 0.7, 1], poses: [{ ty: 0 }, { ty: -12 }, { ty: 2 }, { ty: 0 }], rest: 0 },
  zOrbit: { dur: 9000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  // ---- Gobbles and Noel (design/Seasonal.dc.html, HolidayPets.tsx) ----
  fanT: { dur: 3000, stops: THREE, poses: [{ sx: 1, sy: 1 }, { sx: 1.06, sy: 1.08 }, { sx: 1, sy: 1 }], rest: 0 },
  gobble: { dur: 2400, stops: [0, 0.6, 0.66, 0.72, 0.78, 0.84, 1], poses: [{ ty: 0 }, { ty: 0 }, { ty: 4 }, { ty: -2 }, { ty: 4 }, { ty: 0 }, { ty: 0 }], rest: 0 },
  floatyN: { dur: 2400, stops: THREE, poses: [{ rot: -8 }, { rot: 8 }, { rot: -8 }], rest: 0.25 },
  swishN: { dur: 2000, stops: THREE, poses: [{ rot: 0 }, { rot: 10 }, { rot: 0 }], rest: 0 },
  earN: { dur: 3200, stops: [0, 0.75, 0.85, 1], poses: [{ rot: -6 }, { rot: -6 }, { rot: -22 }, { rot: -6 }], rest: 0 },
  earNR: { dur: 3200, stops: [0, 0.75, 0.85, 1], poses: [{ rot: 6 }, { rot: 6 }, { rot: 22 }, { rot: 6 }], rest: 0 },
  snowN: { dur: 6000, stops: [0, 0.1, 0.5, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 1.6, ty: 22 }, { o: 1, tx: 8, ty: 110 }, { o: 1, tx: -2.4, ty: 198 }, { o: 0, tx: -4, ty: 220 }], rest: 0, linear: true },
  // ---- Thanksgiving and Christmas home scenes ----
  birdsT: { dur: 30000, stops: [0, 1], poses: [{ tx: 470 }, { tx: -120 }], rest: 0.4, linear: true },
  glowC: { dur: 4000, stops: THREE, poses: [{ o: 0.65 }, { o: 1 }, { o: 0.65 }], rest: 0.5 },
  beam: { dur: 5000, stops: THREE, poses: [{ o: 0.04 }, { o: 0.11 }, { o: 0.04 }], rest: 0.5 },
  starPulse: { dur: 2600, stops: THREE, poses: [{ s: 0.92 }, { s: 1.08 }, { s: 0.92 }], rest: 0.5 },
  snowC: { dur: 10000, stops: [0, 0.06, 0.5, 0.94, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.95, tx: 1.7, ty: 52 }, { o: 0.95, tx: 14, ty: 430 }, { o: 0.95, tx: -3.6, ty: 817 }, { o: 0, tx: -6, ty: 870 }], rest: 0, linear: true },
  // ---- Prayer nook trinkets (design/Trinkets.dc.html, trinketArt.tsx) ----
  tFlicker: { dur: 1300, stops: [0, 0.3, 0.6, 1], poses: [{ sx: 1, sy: 1 }, { sx: 0.9, sy: 1.08 }, { sx: 1.06, sy: 0.94 }, { sx: 1, sy: 1 }], rest: 0 },
  tSwing: { dur: 3000, stops: THREE, poses: [{ rot: -7 }, { rot: 7 }, { rot: -7 }], rest: 0.25 },
  tGrow: { dur: 4000, stops: [0, 0.4, 0.85, 1], poses: [{ s: 0.2 }, { s: 1 }, { s: 1 }, { s: 0.2 }], rest: 0.5 },
  tSway: { dur: 3200, stops: THREE, poses: [{ rot: -4 }, { rot: 4 }, { rot: -4 }], rest: 0.25 },
  tBob: { dur: 2600, stops: THREE, poses: [{ ty: 0 }, { ty: -3 }, { ty: 0 }], rest: 0 },
  tNod: { dur: 3600, stops: [0, 0.6, 0.7, 0.8, 1], poses: [{ ty: 0 }, { ty: 0 }, { ty: 3 }, { ty: 0 }, { ty: 0 }], rest: 0 },
  tWrite: { dur: 1600, stops: [0, 0.25, 0.5, 0.75, 1], poses: [{ tx: 0, ty: 0, rot: 0 }, { tx: -3, ty: 1, rot: -4 }, { tx: -6, ty: 0, rot: 2 }, { tx: -3, ty: -1, rot: -3 }, { tx: 0, ty: 0, rot: 0 }], rest: 0 },
  tChime: { dur: 2400, stops: THREE, poses: [{ rot: -3 }, { rot: 3 }, { rot: -3 }], rest: 0.25 },
  tNote: { dur: 3000, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 1.2, ty: -6 }, { o: 0, tx: 6, ty: -30 }], rest: 0 },
  tSandT: { dur: 6000, stops: [0, 0.9, 1], poses: [{ sy: 1 }, { sy: 0.1 }, { sy: 1 }], rest: 0.4, linear: true },
  tSandB: { dur: 6000, stops: [0, 0.9, 1], poses: [{ sy: 0.15 }, { sy: 1 }, { sy: 0.15 }], rest: 0.4, linear: true },
  tSpinY: { dur: 3000, stops: [0, 0.25, 0.5, 0.75, 1], poses: [{ sx: 1 }, { sx: 0.2 }, { sx: -1 }, { sx: -0.2 }, { sx: 1 }], rest: 0, linear: true },
  tOrbit5: { dur: 5000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  tOrbit7: { dur: 7000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  tOrbit30: { dur: 30000, stops: [0, 1], poses: [{ rot: 0 }, { rot: 360 }], rest: 0, linear: true },
  tPluck: { dur: 1800, stops: [0, 0.7, 0.75, 0.8, 0.85, 1], poses: [{ sx: 1 }, { sx: 1 }, { sx: 2.4 }, { sx: 0.4 }, { sx: 1.6 }, { sx: 1 }], rest: 0 },
  tManna: { dur: 3000, stops: [0, 0.15, 0.85, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 0.6, ty: 7 }, { o: 1, tx: 3.4, ty: 39 }, { o: 0, tx: 4, ty: 46 }], rest: 0 },
  tBeam: { dur: 4000, stops: THREE, poses: [{ sx: 1 }, { sx: -1 }, { sx: 1 }], rest: 0 },
  tWave: { dur: 4000, stops: THREE, poses: [{ tx: -4 }, { tx: 4 }, { tx: -4 }], rest: 0.25 },
  tSwim: { dur: 7200, stops: THREE, poses: [{ tx: -8 }, { tx: 10 }, { tx: -8 }], rest: 0.25 },
  tGlass: { dur: 3000, stops: THREE, poses: [{ o: 0.85 }, { o: 0.55 }, { o: 0.85 }], rest: 0 },
  tRock: { dur: 3000, stops: THREE, poses: [{ rot: -5 }, { rot: 5 }, { rot: -5 }], rest: 0.25 },
  tTwinkle: { dur: 2400, stops: THREE, poses: [{ o: 0.3, s: 0.8 }, { o: 1, s: 1.1 }, { o: 0.3, s: 0.8 }], rest: 0.5 },
  tNebula: { dur: 12000, stops: THREE, poses: [{ tx: -3 }, { tx: 3 }, { tx: -3 }], rest: 0.25 },
  tFan: { dur: 3000, stops: THREE, poses: [{ sx: 0.92 }, { sx: 1.05 }, { sx: 0.92 }], rest: 0.5 },
  tEmber: { dur: 2400, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 1, tx: 0.8, ty: -3.6 }, { o: 0, tx: 4, ty: -18 }], rest: 0 },
  tClimb: { dur: 4500, stops: [0, 0.1, 0.85, 1], poses: [{ o: 0, ty: 0 }, { o: 1, ty: -8.4 }, { o: 1, ty: -71.4 }, { o: 0, ty: -84 }], rest: 0, linear: true },
  tClam: { dur: 4000, stops: [0, 0.2, 0.45, 0.75, 1], poses: [{ ty: 0, rot: 0 }, { ty: 0, rot: 0 }, { ty: -14, rot: -14 }, { ty: -14, rot: -14 }, { ty: 0, rot: 0 }], rest: 0 },
  // ---- 2027 monthly home scenes (design/saint-central-home-2027, monthlyScenes.tsx) ----
  hSnow: { dur: 8000, stops: [0, 0.08, 0.5, 0.92, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.95, tx: 1.6, ty: 35 }, { o: 0.95, tx: 10, ty: 220 }, { o: 0.95, tx: -3.4, ty: 405 }, { o: 0, tx: -6, ty: 440 }], rest: 0, linear: true },
  hRain: { dur: 1400, stops: [0, 0.1, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.9, tx: -3, ty: 42 }, { o: 0, tx: -30, ty: 420 }], rest: 0, linear: true },
  hLeaf: { dur: 9000, stops: [0, 0.08, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 1, tx: -3.2, ty: 35, rot: 34 }, { o: 1, tx: -36, ty: 396, rot: 378 }, { o: 0, tx: -40, ty: 440, rot: 420 }], rest: 0, linear: true },
  hRise: { dur: 7000, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 380 }, { o: 1, tx: 2, ty: 324 }, { o: 0, tx: 10, ty: 100 }], rest: 0 },
  hDrift: { dur: 28000, stops: THREE, poses: [{ tx: -14 }, { tx: 14 }, { tx: -14 }], rest: 0.25 },
  hBirds: { dur: 22000, stops: [0, 1], poses: [{ tx: -60 }, { tx: 280 }], rest: 0.4, linear: true },
  hStarPulse: { dur: 2600, stops: THREE, poses: [{ s: 0.9 }, { s: 1.1 }, { s: 0.9 }], rest: 0.5 },
  hBeam: { dur: 5000, stops: THREE, poses: [{ o: 0.04 }, { o: 0.1 }, { o: 0.04 }], rest: 0.5 },
  hGlow: { dur: 3400, stops: THREE, poses: [{ o: 0.75 }, { o: 1 }, { o: 0.75 }], rest: 0.5 },
  hRays: { dur: 3400, stops: THREE, poses: [{ o: 0.55 }, { o: 1 }, { o: 0.55 }], rest: 0.5 },
  hSteam: { dur: 2400, stops: THREE, poses: [{ ty: 0 }, { ty: -3 }, { ty: 0 }], rest: 0 },
  bob4: { dur: 3200, stops: THREE, poses: [{ ty: 0 }, { ty: -4 }, { ty: 0 }], rest: 0 },
  hKite: { dur: 3000, stops: THREE, poses: [{ rot: -8, ty: 0 }, { rot: 8, ty: -6 }, { rot: -8, ty: 0 }], rest: 0.25 },
  hFlap: { dur: 500, stops: THREE, poses: [{ sx: 1 }, { sx: 0.3 }, { sx: 1 }], rest: 0 },
  hWander: { dur: 12000, stops: THREE, poses: [{ tx: 0, ty: 0 }, { tx: 20, ty: -24 }, { tx: 0, ty: 0 }], rest: 0 },
  leafT: { dur: 7000, stops: [0, 0.1, 0.9, 1], poses: [{ o: 0, tx: 0, ty: 0, rot: 0 }, { o: 1, tx: -2.4, ty: 21, rot: 28 }, { o: 1, tx: -21.6, ty: 189, rot: 252 }, { o: 0, tx: -24, ty: 210, rot: 280 }], rest: 0, linear: true },
} satisfies Record<string, Preset>;

export type FxKind = keyof typeof PRESETS;

type FxProps = {
  kind: FxKind;
  delay?: number;
  /** Overrides the preset's loop length (ms), for the odd element the design slows down or speeds up. */
  dur?: number;
  /** Pivot for rotation and scale, in the parent's coordinate space. */
  ox?: number;
  oy?: number;
  children: React.ReactNode;
};

type Track = { prop: string; vals: number[] };
const POSE_PROPS: [keyof Pose, string, number][] = [
  ['o', 'opacity', 1],
  ['tx', 'translateX', 0],
  ['ty', 'translateY', 0],
  ['rot', 'rotation', 0],
  ['s', 'scale', 1],
  ['sx', 'scaleX', 1],
  ['sy', 'scaleY', 1],
];
const tracksByPreset = new Map<Preset, Track[]>();

/** The properties a preset animates, worked out once instead of on every frame. */
function tracksFor(preset: Preset): Track[] {
  let tracks = tracksByPreset.get(preset);
  if (!tracks) {
    tracks = POSE_PROPS
      .filter(([key]) => preset.poses.some(pose => pose[key] !== undefined))
      .map(([key, prop, fallback]) => ({ prop, vals: preset.poses.map(pose => pose[key] ?? fallback) }));
    tracksByPreset.set(preset, tracks);
  }
  return tracks;
}

/** A group that loops one of the Me-page CSS animations via Reanimated. */
export function Fx({ kind, ...props }: FxProps) {
  return <FxLoop preset={PRESETS[kind]} {...props} />;
}

/** The same loop as Fx, for art that brings its own preset (the converted nook collection and scenes). */
export function FxLoop({ preset, delay = 0, dur, ox = 0, oy = 0, children }: Omit<FxProps, 'kind'> & { preset: Preset }) {
  const allowed = useContext(PetMotion);
  const enabled = useMotionEnabled(allowed);
  const duration = dur ?? preset.dur;
  const p = useLoop(duration, delay, enabled, preset.rest);
  const { stops, linear } = preset;
  const tracks = tracksFor(preset);
  const steps = frameSteps(duration, useContext(SmoothMotion));
  const animatedProps = useAnimatedProps(() => {
    const at = stepped(p.get(), steps);
    const out: Record<string, number> = {};
    for (let i = 0; i < tracks.length; i++) {
      out[tracks[i].prop] = linear ? lerpKeyframe(at, stops, tracks[i].vals) : keyframe(at, stops, tracks[i].vals);
    }
    return out;
  });
  return (
    <AG animatedProps={animatedProps} originX={ox} originY={oy}>
      {children}
    </AG>
  );
}

/** A circle that twinkles in place (opacity and scale about its own center). */
export function TwinkleDot({
  cx,
  cy,
  r,
  delay = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  delay?: number;
}) {
  return (
    <Fx kind="twinkle" delay={delay} ox={cx} oy={cy}>
      <Circle cx={cx} cy={cy} r={r} />
    </Fx>
  );
}

const STAR_PATH = 'M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z';

/** A four-point sparkle star at (x, y), 20 units wide, twinkling. */
export function TwinkleStar({ x, y, fill, delay = 0 }: { x: number; y: number; fill: string; delay?: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Fx kind="twinkle" delay={delay} ox={10} oy={10}>
        <Path d={STAR_PATH} fill={fill} />
      </Fx>
    </G>
  );
}

/** Marching dashes along a line (the "flow" stroke in the prayer web). */
export function FlowPath({ d, stroke }: { d: string; stroke: string }) {
  const enabled = useMotionEnabled(true);
  const p = useLoop(1400, 0, enabled, 0);
  const steps = frameSteps(1400);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: -12 * stepped(p.get(), steps) }));
  return (
    <APath
      d={d}
      stroke={stroke}
      strokeWidth={1.5}
      strokeOpacity={0.65}
      strokeLinecap="round"
      fill="none"
      strokeDasharray="3 9"
      animatedProps={animatedProps}
    />
  );
}

type DashFlowSpec = {
  dur: number;
  dash?: string;
  /** Dash offset keyframes (linear), and optional opacity keyframes, at `stops`. */
  stops: number[];
  offset: number[];
  opacity?: number[];
};

const DASH_FLOWS = {
  // Ribbon the snake's gold stripe slides along her body.
  slither: { dur: 1600, stops: [0, 1], offset: [0, -28] },
  // Dash the horse's speed streaks.
  streak: { dur: 1400, dash: '18 40', stops: [0, 1], offset: [0, -58] },
  // 2027 home scenes: March's wind streaks, and July's shooting star (a dash that flies along and fades).
  streakH: { dur: 2000, dash: '20 60', stops: [0, 1], offset: [0, -80] },
  // Trinkets: the quill's line of ink writing itself, and the hourglass's falling stream of sand.
  inkT: { dur: 3200, dash: '30', stops: [0, 0.6, 1], offset: [30, 0, 0] },
  streamT: { dur: 400, dash: '3 4', stops: [0, 1], offset: [0, -7] },
  shootH: { dur: 4000, dash: '60 400', stops: [0, 0.05, 0.25, 1], offset: [60, 36, -60, -60], opacity: [0, 1, 0, 0] },
} satisfies Record<string, DashFlowSpec>;

/** A path whose dashes march along it (CSS stroke-dashoffset loops). Takes the usual Path props. */
export function DashFlow({ kind, ...props }: React.ComponentProps<typeof Path> & { kind: keyof typeof DASH_FLOWS }) {
  const flow: DashFlowSpec = DASH_FLOWS[kind];
  const enabled = useMotionEnabled(useContext(PetMotion));
  const p = useLoop(flow.dur, 0, enabled, 0);
  const steps = frameSteps(flow.dur, useContext(SmoothMotion));
  const animatedProps = useAnimatedProps(() => {
    const at = stepped(p.get(), steps);
    const out: Record<string, number> = { strokeDashoffset: lerpKeyframe(at, flow.stops, flow.offset) };
    if (flow.opacity) out.opacity = lerpKeyframe(at, flow.stops, flow.opacity);
    return out;
  });
  return <APath strokeDasharray={flow.dash} {...props} animatedProps={animatedProps} />;
}

const DASH_SHAPES = {
  path: APath,
  line: Animated.createAnimatedComponent(Line),
  circle: ACircle,
  polyline: Animated.createAnimatedComponent(Polyline),
} as const;

/** Marching dashes from a converted preset: `offset` holds the dash offset keyframes, `opacity` optional fades. */
export function DashLoop({ shape, preset, delay = 0, ...props }: Record<string, unknown> & {
  shape: keyof typeof DASH_SHAPES;
  preset: { dur: number; stops: number[]; offset: number[]; opacity?: number[]; linear?: boolean };
  delay?: number;
}) {
  const enabled = useMotionEnabled(useContext(PetMotion));
  const p = useLoop(preset.dur, delay, enabled, 0);
  const steps = frameSteps(preset.dur, useContext(SmoothMotion));
  const animatedProps = useAnimatedProps(() => {
    const at = stepped(p.get(), steps);
    const kf = preset.linear ? lerpKeyframe : keyframe;
    const out: Record<string, number> = { strokeDashoffset: kf(at, preset.stops, preset.offset) };
    if (preset.opacity) out.opacity = kf(at, preset.stops, preset.opacity);
    return out;
  });
  const Shape = DASH_SHAPES[shape] as React.ComponentType<Record<string, unknown>>;
  return <Shape {...props} animatedProps={animatedProps} />;
}

/** A gold dot that travels from (x0, y0) to (x1, y1) forever, fading in and out. */
export function TravelDot({
  from,
  to,
  delay = 0,
  fill,
}: {
  from: [number, number];
  to: [number, number];
  delay?: number;
  fill: string;
}) {
  const enabled = useMotionEnabled(true);
  const p = useLoop(3000, delay, enabled, 0.5);
  const steps = frameSteps(3000);
  const animatedProps = useAnimatedProps(() => {
    const at = stepped(p.get(), steps);
    return {
      cx: from[0] + (to[0] - from[0]) * at,
      cy: from[1] + (to[1] - from[1]) * at,
      opacity: keyframe(at, [0, 0.33, 0.66, 1], [0, 1, 1, 0]),
    };
  });
  return <ACircle r={3} fill={fill} animatedProps={animatedProps} />;
}

/** Fades its children in once, the stand-in for the web's stroke-draw reveal. */
export function FadeInG({ delay = 0, duration = 2600, children }: { delay?: number; duration?: number; children: React.ReactNode }) {
  const enabled = useMotionEnabled(true);
  const p: SharedValue<number> = useSharedValue(enabled ? 0 : 1);
  useEffect(() => {
    if (!enabled) {
      p.set(1);
      return;
    }
    p.set(withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) })));
  }, [p, enabled, delay, duration]);
  const animatedProps = useAnimatedProps(() => ({ opacity: p.get() }));
  return <AG animatedProps={animatedProps}>{children}</AG>;
}

/** A soft halo of light that fades out at the edge (a flat circle reads as a disk on the dark screens). */
export function SoftGlow({ cx, cy, r, color, kind = 'glowb' }: { cx: number; cy: number; r: number; color: string; kind?: FxKind }) {
  const id = `lieglow${color.slice(1)}`;
  return (
    <>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.9} />
          <Stop offset="0.55" stopColor={color} stopOpacity={0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Fx kind={kind}>
        <Circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      </Fx>
    </>
  );
}
