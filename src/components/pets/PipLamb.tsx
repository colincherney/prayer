import React from 'react';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { keyframe, useLoop, useMotionEnabled } from './anim';
import { PetMotion } from './Fx';
import { LambExtras } from './PetExtras';

/** Pip the Lamb, ported from design/Lamb.dc.html. Stages: 1 = Lambkin, 2 = Little Lamb, 3 = Lamb of Light. */
export type PipStage = 1 | 2 | 3;

/** Evolution levels from design/README.md: 1-4, 5-9, 10+. */
export function pipStageForLevel(level: number): PipStage {
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}

const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);

const COLORS = {
  mint: '#8FC6A9',
  gold: '#F2C462',
  ear: '#E9D3BA',
  face: '#F1E2CC',
  hoof: '#4A3F3A',
  ink: '#2B2420',
  cheek: '#E8998A',
};

const LABELS: Record<PipStage, string> = {
  1: 'Pip as a small lambkin',
  2: 'Pip as a little lamb with a halo and bell',
  3: 'Pip as the lamb of light with wings and a halo',
};

// Per-stage differences. Everything else about the art is shared.
const STAGE = {
  1: { fleece: '#F7F2E8', eyeR: 4.4, cheekY: 98, cheekR: 4.5, collar: false, flecks: false },
  2: { fleece: '#F7F2E8', eyeR: 3.6, cheekY: 97, cheekR: 4, collar: true, flecks: false },
  3: { fleece: '#FFFBF2', eyeR: 3.6, cheekY: 97, cheekR: 4, collar: true, flecks: true },
} as const;

// Keyframes lifted from the CSS in the mockup.
const HOP = { stops: [0, 0.7, 0.78, 0.86, 0.92, 1], vals: [0, 0, -14, 0, -5, 0] };
const BOB = { stops: [0, 0.5, 1], vals: [0, -7, 0] };
const WIGGLE = { stops: [0, 0.78, 0.86, 1], vals: [0, 0, 16, 0] };
const BLINK = { stops: [0, 0.91, 0.94, 1], vals: [1, 1, 0.1, 1] };
const FLAP = { stops: [0, 0.5, 1], vals: [0, -16, 0] };
const HALO = { stops: [0, 0.5, 1], vals: [0, -4, 0] };
const GLOW = { stops: [0, 0.5, 1], vals: [0.08, 0.22, 0.08] };
const TWINKLE_OPACITY = { stops: [0, 0.5, 1], vals: [0.2, 1, 0.2] };
const TWINKLE_SCALE = { stops: [0, 0.5, 1], vals: [0.6, 1.1, 0.6] };

const WING_PATH =
  'M66 112 C36 96 18 108 8 84 C26 88 30 74 46 84 C40 66 56 60 74 98 Z';
const STAR_PATH = 'M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z';

function Ear({ side, p }: { side: 'l' | 'r'; p: SharedValue<number> }) {
  const sign = side === 'l' ? -1 : 1;
  const animatedProps = useAnimatedProps(() => ({
    rotation: sign * keyframe(p.value, WIGGLE.stops, WIGGLE.vals),
  }));
  const left = side === 'l';
  return (
    <AG animatedProps={animatedProps} originX={left ? 83 : 117} originY={76}>
      <Ellipse
        cx={left ? 72 : 128}
        cy={80}
        rx={14}
        ry={7}
        fill={COLORS.ear}
        transform={`rotate(${left ? -22 : 22} ${left ? 72 : 128} 80)`}
      />
    </AG>
  );
}

function Wing({ p, mirror }: { p: SharedValue<number>; mirror?: boolean }) {
  const animatedProps = useAnimatedProps(() => ({
    rotation: keyframe(p.value, FLAP.stops, FLAP.vals),
  }));
  const wing = (
    <AG animatedProps={animatedProps} originX={67} originY={107}>
      <Path
        d={WING_PATH}
        fill="#FFF6DE"
        stroke={COLORS.gold}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </AG>
  );
  return mirror ? <G transform="translate(200 0) scale(-1 1)">{wing}</G> : wing;
}

function Sparkle({
  x,
  y,
  fill,
  p,
}: {
  x: number;
  y: number;
  fill: string;
  p: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    opacity: keyframe(p.value, TWINKLE_OPACITY.stops, TWINKLE_OPACITY.vals),
    scale: keyframe(p.value, TWINKLE_SCALE.stops, TWINKLE_SCALE.vals),
  }));
  return (
    <G transform={`translate(${x} ${y})`}>
      <AG animatedProps={animatedProps} originX={10} originY={10}>
        <Path d={STAR_PATH} fill={fill} />
      </AG>
    </G>
  );
}

export type PipLambProps = {
  stage: PipStage;
  /** Rendered width in dp; height follows the 240x260 artboard. */
  size?: number;
  /** Set false for a still pet (e.g. thumbnails). The OS reduce-motion setting also stops it. */
  animated?: boolean;
};

export function PipLamb({ stage, size = 220, animated = true }: PipLambProps) {
  const enabled = useMotionEnabled(animated);
  const s = STAGE[stage];

  // Stage 1 hops; the others bob, staggered so side-by-side pets don't move in unison.
  const move = useLoop(stage === 1 ? 2600 : 3200, stage === 3 ? 1200 : stage === 2 ? 600 : 0, enabled);
  const ear = useLoop(2800, 0, enabled);
  const blink = useLoop(4200, 0, enabled);
  const halo = useLoop(2400, 0, enabled);
  const wing = useLoop(1100, 0, enabled && stage === 3);
  const glow = useLoop(3000, 0, enabled && stage === 3, 0.5);
  const tw1 = useLoop(1800, 0, enabled && stage === 3, 0.5);
  const tw2 = useLoop(1800, 600, enabled && stage === 3, 0.5);
  const tw3 = useLoop(1800, 1200, enabled && stage === 3, 0.5);

  const moveStyle = useAnimatedStyle(() => {
    const k = stage === 1 ? HOP : BOB;
    return { transform: [{ translateY: keyframe(move.value, k.stops, k.vals) }] };
  });
  const blinkProps = useAnimatedProps(() => ({
    scaleY: keyframe(blink.value, BLINK.stops, BLINK.vals),
  }));
  const haloProps = useAnimatedProps(() => ({
    y: keyframe(halo.value, HALO.stops, HALO.vals),
  }));
  const glowProps = useAnimatedProps(() => ({
    opacity: keyframe(glow.value, GLOW.stops, GLOW.vals),
  }));

  const art = (
    <>
      {stage === 3 && (
        <>
          <Wing p={wing} />
          <Wing p={wing} mirror />
        </>
      )}
      <Ellipse cx={100} cy={184} rx={52} ry={8} fill="#000" opacity={0.35} />
      <Rect x={72} y={140} width={11} height={38} rx={5.5} fill={COLORS.hoof} />
      <Rect x={117} y={140} width={11} height={38} rx={5.5} fill={COLORS.hoof} />
      <G fill={s.fleece}>
        <Circle cx={66} cy={122} r={26} />
        <Circle cx={100} cy={114} r={34} />
        <Circle cx={134} cy={122} r={26} />
        <Circle cx={82} cy={142} r={24} />
        <Circle cx={118} cy={142} r={24} />
      </G>
      {s.flecks && (
        <G fill={COLORS.gold} opacity={0.5}>
          <Circle cx={58} cy={104} r={3} />
          <Circle cx={140} cy={108} r={3} />
          <Circle cx={96} cy={86} r={2} />
          <Circle cx={120} cy={150} r={3} />
          <Circle cx={74} cy={152} r={2.5} />
        </G>
      )}
      {s.collar && (
        <>
          <Path
            d="M80 106 Q100 118 120 106"
            stroke={stage === 3 ? COLORS.gold : COLORS.mint}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx={100} cy={115} r={5.5} fill={COLORS.gold} />
        </>
      )}
      <Ear side="l" p={ear} />
      <Ear side="r" p={ear} />
      <Ellipse cx={100} cy={88} rx={25} ry={23} fill={COLORS.face} />
      <G fill={s.fleece}>
        <Circle cx={90} cy={66} r={9} />
        <Circle cx={100} cy={62} r={10} />
        <Circle cx={110} cy={66} r={9} />
      </G>
      <AG animatedProps={blinkProps} originX={100} originY={88}>
        <Circle cx={91} cy={88} r={s.eyeR} fill={COLORS.ink} />
        <Circle cx={109} cy={88} r={s.eyeR} fill={COLORS.ink} />
      </AG>
      <Circle cx={85} cy={s.cheekY} r={s.cheekR} fill={COLORS.cheek} opacity={0.6} />
      <Circle cx={115} cy={s.cheekY} r={s.cheekR} fill={COLORS.cheek} opacity={0.6} />
      <Path
        d="M96 99 Q100 103 104 99"
        stroke={COLORS.ink}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {stage !== 1 && (
        <AG animatedProps={haloProps}>
          <Ellipse
            cx={100}
            cy={stage === 3 ? 44 : 46}
            rx={stage === 3 ? 22 : 20}
            ry={stage === 3 ? 6 : 5}
            fill="none"
            stroke={COLORS.gold}
            strokeWidth={4}
          />
        </AG>
      )}
    </>
  );

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={LABELS[stage]}
      style={[{ width: size, height: (size * 260) / 240 }, moveStyle]}>
      <PetMotion.Provider value={animated}>
      <Svg viewBox="0 0 240 260" width="100%" height="100%">
        {stage === 3 && <ACircle animatedProps={glowProps} cx={120} cy={150} r={104} fill={COLORS.gold} />}
        {stage === 1 ? (
          <G transform="translate(50 110) scale(0.7)">{art}</G>
        ) : (
          <G transform="translate(20 56)">{art}</G>
        )}
        {stage === 3 && (
          <>
            <Sparkle x={26} y={70} fill={COLORS.gold} p={tw1} />
            <Sparkle x={196} y={92} fill="#F7E3B5" p={tw2} />
            <Sparkle x={176} y={40} fill={COLORS.gold} p={tw3} />
          </>
        )}
        <LambExtras stage={stage} />
      </Svg>
      </PetMotion.Provider>
    </Animated.View>
  );
}
