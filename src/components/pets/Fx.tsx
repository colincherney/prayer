import React, { createContext, useContext, useEffect } from 'react';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Circle, G, Path } from 'react-native-svg';

import { keyframe, useLoop, useMotionEnabled } from './anim';

const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);

type Pose = { o?: number; tx?: number; ty?: number; rot?: number; s?: number; sx?: number; sy?: number };
type Preset = { dur: number; stops: number[]; poses: Pose[]; rest: number; linear?: boolean };

/** Lets a pet turn all of its loops off (thumbnails) without threading a prop through every layer. */
export const PetMotion = createContext(true);

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
  yawn: { dur: 6000, stops: [0, 0.78, 0.84, 0.92, 1], poses: [{ sy: 0 }, { sy: 0 }, { sy: 1 }, { sy: 1 }, { sy: 0 }], rest: 0 },
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
  seed: { dur: 7000, stops: [0, 0.2, 1], poses: [{ o: 0, tx: 0, ty: 0 }, { o: 0.8, tx: 6, ty: -30 }, { o: 0, tx: 30, ty: -150 }], rest: 0 },
} satisfies Record<string, Preset>;

export type FxKind = keyof typeof PRESETS;

type FxProps = {
  kind: FxKind;
  delay?: number;
  /** Pivot for rotation and scale, in the parent's coordinate space. */
  ox?: number;
  oy?: number;
  children: React.ReactNode;
};

/** A group that loops one of the Me-page CSS animations via Reanimated. */
export function Fx({ kind, delay = 0, ox = 0, oy = 0, children }: FxProps) {
  const allowed = useContext(PetMotion);
  const enabled = useMotionEnabled(allowed);
  const preset: Preset = PRESETS[kind];
  const p = useLoop(preset.dur, delay, enabled, preset.rest);
  const animatedProps = useAnimatedProps(() => {
    const out: Record<string, number> = {};
    const { stops, poses } = preset;
    const kf = preset.linear ? lerpKeyframe : keyframe;
    const has = (k: keyof Pose) => poses.some(q => q[k] !== undefined);
    const vals = (k: keyof Pose, d: number) => poses.map(q => q[k] ?? d);
    if (has('o')) out.opacity = kf(p.value, stops, vals('o', 1));
    if (has('tx')) out.translateX = kf(p.value, stops, vals('tx', 0));
    if (has('ty')) out.translateY = kf(p.value, stops, vals('ty', 0));
    if (has('rot')) out.rotation = kf(p.value, stops, vals('rot', 0));
    if (has('s')) out.scale = kf(p.value, stops, vals('s', 1));
    if (has('sx')) out.scaleX = kf(p.value, stops, vals('sx', 1));
    if (has('sy')) out.scaleY = kf(p.value, stops, vals('sy', 1));
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
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: -12 * p.value }));
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
  const animatedProps = useAnimatedProps(() => ({
    cx: from[0] + (to[0] - from[0]) * p.value,
    cy: from[1] + (to[1] - from[1]) * p.value,
    opacity: keyframe(p.value, [0, 0.33, 0.66, 1], [0, 1, 1, 0]),
  }));
  return <ACircle r={3} fill={fill} animatedProps={animatedProps} />;
}

/** Fades its children in once, the stand-in for the web's stroke-draw reveal. */
export function FadeInG({ delay = 0, duration = 2600, children }: { delay?: number; duration?: number; children: React.ReactNode }) {
  const enabled = useMotionEnabled(true);
  const p: SharedValue<number> = useSharedValue(enabled ? 0 : 1);
  useEffect(() => {
    if (!enabled) {
      p.value = 1;
      return;
    }
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
  }, [p, enabled, delay, duration]);
  const animatedProps = useAnimatedProps(() => ({ opacity: p.value }));
  return <AG animatedProps={animatedProps}>{children}</AG>;
}
