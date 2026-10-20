import React from 'react';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { keyframe, useLoop } from './anim';
import { Fx, SoftGlow } from './Fx';
import type { PetId } from './registry';

// Per-pet personality: how each companion moves when it is just living somewhere (the group hearth, the peek over
// the groups card), the little things floating off it, and the pet-specific art that goes with it (paws, tails,
// blankets, a candle in its paws). Everything is drawn on the shared 240x260 pet artboard.

type Track = {
  dur: number;
  stops: number[];
  tx?: number[];
  ty?: number[];
  rot?: number[];
  sx?: number[];
  sy?: number[];
};

/** `main` loops all the time; `action` is a rarer signature move. Amounts are for a pet drawn 100 wide. */
type Personality = { main: Track; action: Track };

export const PERSONALITY: Record<PetId, Personality> = {
  // Lamb: bouncy. Little squash-and-hops, then every so often a double hop.
  lamb: {
    main: { dur: 4200, stops: [0, 0.4, 0.46, 0.52, 0.58, 0.64, 1], ty: [0, 0, -12, 0, -8, 0, 0], sy: [1, 1, 1.07, 0.93, 1.04, 0.97, 1], sx: [1, 1, 0.97, 1.05, 0.98, 1.02, 1] },
    action: { dur: 9500, stops: [0, 0.8, 0.84, 0.88, 0.92, 0.96, 1], ty: [0, 0, -22, 0, -22, 0, 0], rot: [0, 0, -8, 0, 8, 0, 0] },
  },
  // Dove: airy. Hovers and drifts, and now and then flutters up and circles back down.
  dove: {
    main: { dur: 3600, stops: [0, 0.25, 0.5, 0.75, 1], ty: [0, -8, -3, -9, 0], rot: [0, -3, 0, 3, 0], tx: [0, 2, 0, -2, 0] },
    action: { dur: 10500, stops: [0, 0.78, 0.84, 0.9, 0.96, 1], ty: [0, 0, -30, -34, -4, 0], tx: [0, 0, 6, -6, 0, 0], rot: [0, 0, 10, -10, 0, 0] },
  },
  // Lion: stately. Slow breath and a big stretch, then a roar (puffs up).
  lion: {
    main: { dur: 6000, stops: [0, 0.5, 0.6, 0.7, 0.8, 1], sx: [1, 1, 1.07, 1.07, 1, 1], sy: [1, 1, 0.96, 0.96, 1, 1], rot: [0, 0, -3, -3, 0, 0] },
    action: { dur: 12500, stops: [0, 0.82, 0.86, 0.9, 0.94, 1], sx: [1, 1, 1.16, 1.12, 1, 1], sy: [1, 1, 1.16, 1.12, 1, 1], ty: [0, 0, -6, -4, 0, 0] },
  },
  // Candle: flickers constantly and flares up now and then.
  ember: {
    main: { dur: 1800, stops: [0, 0.3, 0.6, 1], sy: [1, 1.05, 0.97, 1], sx: [1, 0.98, 1.02, 1], rot: [0, -1.5, 1.5, 0] },
    action: { dur: 8500, stops: [0, 0.8, 0.86, 0.94, 1], sy: [1, 1, 1.22, 1.05, 1], sx: [1, 1, 0.92, 0.98, 1], ty: [0, 0, -4, -1, 0] },
  },
  // Sea dragon: swims. Rocks side to side, and splashes in a spin.
  dragon: {
    main: { dur: 5000, stops: [0, 0.25, 0.5, 0.75, 1], tx: [0, 5, 0, -5, 0], rot: [0, 3, 0, -3, 0], ty: [0, -3, 0, -3, 0] },
    action: { dur: 11500, stops: [0, 0.8, 0.86, 0.92, 1], ty: [0, 0, -20, 0, 0], rot: [0, 0, -14, 14, 0], sx: [1, 1, 1.08, 0.95, 1] },
  },
  // Pumpkin: wobbly. Rocks like a round gourd, and rolls a full turn.
  pumpkin: {
    main: { dur: 3000, stops: [0, 0.25, 0.5, 0.75, 1], rot: [0, 4, 0, -4, 0], sy: [1, 0.97, 1, 0.97, 1] },
    action: { dur: 10000, stops: [0, 0.8, 0.9, 1], rot: [0, 0, 360, 360], tx: [0, 0, 6, 0], ty: [0, 0, -8, 0] },
  },
};

function TrackView({ track, offset, scale, enabled, children }: { track: Track; offset: number; scale: number; enabled: boolean; children: React.ReactNode }) {
  const p = useLoop(track.dur, offset % track.dur, enabled, 0);
  const style = useAnimatedStyle(() => {
    const { stops } = track;
    const v = (a: number[] | undefined, d: number) => (a ? keyframe(p.get(), stops, a) : d);
    return {
      transform: [
        { translateX: v(track.tx, 0) * scale },
        { translateY: v(track.ty, 0) * scale },
        { rotate: `${v(track.rot, 0)}deg` },
        { scaleX: v(track.sx, 1) },
        { scaleY: v(track.sy, 1) },
      ],
      transformOrigin: '50% 100%',
    };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Wraps a pet so it behaves like itself. `seat` offsets the timing so a room full of pets is never in step. */
export function Acting({ petId, seat = 0, size, children }: { petId: PetId; seat?: number; size: number; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { main, action } = PERSONALITY[petId];
  const scale = size / 100;
  return (
    <TrackView track={action} offset={seat * 2300 + 1200} scale={scale} enabled={!reduce}>
      <TrackView track={main} offset={seat * 733} scale={scale} enabled={!reduce}>
        {children}
      </TrackView>
    </TrackView>
  );
}

/* ------------------------------ things floating off each pet ------------------------------ */

const HEART = 'M12 21 C5 15 2 11.5 2 8.5 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8.5 C22 11.5 19 15 12 21 Z';

function Heart({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  return <Path d={HEART} fill={fill} transform={`translate(${x} ${y}) scale(${size / 24})`} />;
}

/** Small things that drift off the pet: hearts and notes, feathers, dust, sparks, bubbles, embers. */
export function PetParticles({ petId, size }: { petId: PetId; size: number }) {
  const h = (size * 260) / 240;
  let art: React.ReactNode = null;
  switch (petId) {
    case 'lamb':
      art = (
        <>
          <Fx kind="heartUp" delay={0}><Heart x={150} y={86} size={20} fill="#F2A9A0" /></Fx>
          <Fx kind="heartUp" delay={1800}><Heart x={62} y={96} size={16} fill="#F7DFA0" /></Fx>
          <Fx kind="noteFloat" delay={900}><Path d="M170 70 v-22 l14 -4 v20" stroke="#B5DCC6" strokeWidth={3} fill="none" strokeLinecap="round" /></Fx>
        </>
      );
      break;
    case 'dove':
      art = (
        <>
          <Fx kind="featherDove" delay={0}><Ellipse cx={170} cy={96} rx={4} ry={11} fill="#F7F5F0" rotation={30} originX={170} originY={96} /></Fx>
          <Fx kind="featherDove" delay={3000}><Ellipse cx={62} cy={88} rx={3.5} ry={10} fill="#E6E1D7" rotation={-25} originX={62} originY={88} /></Fx>
          <Fx kind="trail" delay={0}><Circle cx={60} cy={150} r={3} fill="#F7DFA0" /></Fx>
          <Fx kind="trail" delay={700}><Circle cx={60} cy={162} r={2.4} fill="#F7DFA0" /></Fx>
        </>
      );
      break;
    case 'lion':
      art = (
        <>
          <Fx kind="moteLion" delay={0}><Circle cx={62} cy={150} r={3} fill="#F7DFA0" /></Fx>
          <Fx kind="moteLion" delay={1300}><Circle cx={178} cy={140} r={2.6} fill="#F7DFA0" /></Fx>
          <Fx kind="moteLion" delay={2600}><Circle cx={150} cy={190} r={2.4} fill="#F2C462" /></Fx>
          <Fx kind="wind" delay={600}><Path d="M170 120 q12 -6 24 0" stroke="#F7E3B5" strokeWidth={3} fill="none" strokeLinecap="round" /></Fx>
        </>
      );
      break;
    case 'ember':
      art = (
        <>
          <Fx kind="sparkE" delay={0}><Circle cx={104} cy={90} r={3} fill="#FFE08A" /></Fx>
          <Fx kind="sparkE" delay={800}><Circle cx={136} cy={96} r={2.6} fill="#F2A93B" /></Fx>
          <Fx kind="sparkE" delay={1600}><Circle cx={120} cy={84} r={2.8} fill="#FFE08A" /></Fx>
        </>
      );
      break;
    case 'dragon':
      art = (
        <>
          <Fx kind="bubbleUp" delay={0}><Circle cx={88} cy={110} r={5} fill="none" stroke="#BDEBE6" strokeWidth={2} /></Fx>
          <Fx kind="bubbleUp" delay={1300}><Circle cx={150} cy={120} r={4} fill="none" stroke="#BDEBE6" strokeWidth={2} /></Fx>
          <Fx kind="bubbleUp" delay={2600}><Circle cx={118} cy={104} r={3} fill="none" stroke="#F7DFA0" strokeWidth={2} /></Fx>
        </>
      );
      break;
    case 'pumpkin':
      art = (
        <>
          <Fx kind="emberPop" delay={0}><Circle cx={96} cy={96} r={3} fill="#F2A93B" /></Fx>
          <Fx kind="emberPop" delay={900}><Circle cx={146} cy={104} r={2.6} fill="#FFE08A" /></Fx>
          <Fx kind="leafFall" delay={400}><Path d="M60 70 q10 -10 18 0 q-8 10 -18 0 z" fill="#C9692E" /></Fx>
        </>
      );
      break;
  }
  return (
    <Svg pointerEvents="none" width={size} height={h} viewBox="0 0 240 260" style={{ position: 'absolute', left: 0, top: 0 }}>
      {art}
    </Svg>
  );
}

/* ------------------------------ pet-specific art ------------------------------ */

/** A pair of front paws/hands/hooves for each pet, drawn in a 68x18 box (left paw at x=14, right at x=54). */
export function PawArt({ petId }: { petId: PetId }) {
  switch (petId) {
    case 'lamb':
      return (
        <>
          <Circle cx={14} cy={7} r={8} fill="#FBF7EC" />
          <Rect x={7} y={7} width={14} height={10} rx={5} fill="#4A4038" />
          <Circle cx={54} cy={7} r={8} fill="#FBF7EC" />
          <Rect x={47} y={7} width={14} height={10} rx={5} fill="#4A4038" />
        </>
      );
    case 'dove':
      return (
        <>
          <Ellipse cx={14} cy={9} rx={13} ry={7} fill="#F7F5F0" />
          <Path d="M5 11 q4 5 8 1 M13 12 q4 5 8 1 M20 11 q3 4 6 0" stroke="#D8D2C6" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Ellipse cx={54} cy={9} rx={13} ry={7} fill="#F7F5F0" />
          <Path d="M45 11 q4 5 8 1 M53 12 q4 5 8 1 M60 11 q3 4 6 0" stroke="#D8D2C6" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </>
      );
    case 'ember':
      return (
        <>
          <Ellipse cx={14} cy={9} rx={11} ry={8} fill="#F3EBDD" />
          <Ellipse cx={14} cy={4} rx={5} ry={3} fill="#F2A93B" />
          <Ellipse cx={54} cy={9} rx={11} ry={8} fill="#F3EBDD" />
          <Ellipse cx={54} cy={4} rx={5} ry={3} fill="#F2A93B" />
        </>
      );
    case 'dragon':
      return (
        <>
          <Ellipse cx={14} cy={9} rx={12} ry={8} fill="#4FA3A5" />
          <Path d="M7 14 l-1 4 M13 15 l0 4 M19 14 l1 4" stroke="#BDEBE6" strokeWidth={2} strokeLinecap="round" />
          <Ellipse cx={54} cy={9} rx={12} ry={8} fill="#4FA3A5" />
          <Path d="M47 14 l-1 4 M53 15 l0 4 M59 14 l1 4" stroke="#BDEBE6" strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case 'pumpkin':
      return (
        <>
          <Ellipse cx={14} cy={9} rx={11} ry={7} fill="#6E8B4E" />
          <Path d="M5 5 q-5 -3 -2 -6 M24 8 q5 -1 4 -5" stroke="#8DAA62" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Ellipse cx={54} cy={9} rx={11} ry={7} fill="#6E8B4E" />
          <Path d="M45 8 q-5 -1 -4 -5 M63 5 q5 -3 2 -6" stroke="#8DAA62" strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      );
    default:
      // lion
      return (
        <>
          <Ellipse cx={14} cy={9} rx={12} ry={8} fill="#EDB565" />
          <Path d="M9 13 L9 16 M14 14 L14 17 M19 13 L19 16" stroke="#C99A5A" strokeWidth={1.5} strokeLinecap="round" />
          <Ellipse cx={54} cy={9} rx={12} ry={8} fill="#EDB565" />
          <Path d="M49 13 L49 16 M54 14 L54 17 M59 13 L59 16" stroke="#C99A5A" strokeWidth={1.5} strokeLinecap="round" />
        </>
      );
  }
}

/** What hangs over the front edge of the prayer box where the pet sits: each pet's own tail or feet. */
function Dangle({ petId }: { petId: PetId }) {
  switch (petId) {
    case 'lamb':
      return (
        <Fx kind="sway4" ox={162} oy={228}>
          <Circle cx={162} cy={238} r={9} fill="#FBF7EC" />
          <Circle cx={170} cy={248} r={7} fill="#F1ECE0" />
          <Circle cx={158} cy={252} r={6} fill="#FBF7EC" />
        </Fx>
      );
    case 'dove':
      return (
        <Fx kind="sway4" ox={150} oy={226}>
          <Ellipse cx={150} cy={246} rx={6} ry={20} fill="#F7F5F0" rotation={-12} originX={150} originY={226} />
          <Ellipse cx={162} cy={246} rx={6} ry={22} fill="#E6E1D7" rotation={4} originX={162} originY={226} />
          <Ellipse cx={174} cy={244} rx={6} ry={19} fill="#F7F5F0" rotation={20} originX={174} originY={226} />
        </Fx>
      );
    case 'ember':
      return (
        <>
          <Path d="M104 234 q-2 14 2 22 q4 -8 2 -22 z" fill="#F3EBDD" />
          <Fx kind="drip" ox={135} oy={236}>
            <Path d="M135 236 q-4 8 0 12 q4 -4 0 -12 z" fill="#F3EBDD" />
          </Fx>
        </>
      );
    case 'dragon':
      return (
        <Fx kind="sway4" ox={150} oy={226}>
          <Path d="M150 226 C168 232 176 248 164 262 C158 268 150 262 156 256" stroke="#4FA3A5" strokeWidth={9} fill="none" strokeLinecap="round" />
          <Path d="M156 256 l-10 -2 l6 8 z" fill="#F2C462" />
        </Fx>
      );
    case 'pumpkin':
      return (
        <Fx kind="sway4" ox={150} oy={226}>
          <Path d="M150 226 C166 230 170 246 160 252 C152 256 148 248 156 246" stroke="#6E8B4E" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M158 238 q12 -6 14 4 q-10 6 -14 -4 z" fill="#8DAA62" />
        </Fx>
      );
    default:
      // lion: front paws hanging over the edge
      return (
        <>
          <Ellipse cx={103} cy={246} rx={11} ry={9} fill="#EDB565" />
          <Ellipse cx={137} cy={246} rx={11} ry={9} fill="#EDB565" />
          <Path d="M99 250 L99 256 M103 251 L103 257 M107 250 L107 256 M133 250 L133 256 M137 251 L137 257 M141 250 L141 256" stroke="#C99A5A" strokeWidth={1.5} strokeLinecap="round" />
        </>
      );
  }
}

const BLANKET: Record<PetId, [string, string]> = {
  lamb: ['#7FA4D8', '#B5CDEE'],
  dove: ['#F2D98B', '#FBEFC4'],
  lion: ['#B8433A', '#E08A7E'],
  ember: ['#8A93A6', '#C3CAD8'],
  dragon: ['#2F8F93', '#8FD3D3'],
  pumpkin: ['#7A55A8', '#B79BD8'],
};

/** A little quilt tucked over the sleeping pet. */
function Blanket({ petId }: { petId: PetId }) {
  const [a, b] = BLANKET[petId];
  return (
    <>
      <Path d="M62 214 Q120 196 178 214 L184 246 Q120 258 56 246 Z" fill={a} opacity={0.94} />
      <Path d="M62 214 Q120 196 178 214" stroke={b} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M80 226 L96 238 M104 224 L120 236 M128 224 L144 236 M152 226 L168 238" stroke={b} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="4 5" />
    </>
  );
}

export type OverlayKind = 'perch' | 'doze' | 'vigil';

/** Pet-specific art drawn over a pet in a given scene. */
export function PetOverlay({ petId, kind, size, warm }: { petId: PetId; kind: OverlayKind; size: number; warm?: boolean }) {
  const h = (size * 260) / 240;
  return (
    <Svg pointerEvents="none" width={size} height={h} viewBox="0 0 240 260" style={{ position: 'absolute', left: 0, top: 0 }}>
      {kind === 'perch' ? <Dangle petId={petId} /> : kind === 'doze' ? <Blanket petId={petId} /> : <PrayingPaws petId={petId} warm={warm} />}
    </Svg>
  );
}

/** Folded paws holding a tiny candle, for keeping vigil. */
function PrayingPaws({ petId, warm }: { petId: PetId; warm?: boolean }) {
  return (
    <>
      {warm ? <SoftGlow cx={120} cy={192} r={40} color="#F2A93B" /> : null}
      <Rect x={115} y={196} width={10} height={22} rx={2.5} fill="#F3EBDD" />
      {warm ? (
        <Fx kind="candle">
          <Path d="M120 178 C127 187 126 194 120 197 C114 194 113 187 120 178 Z" fill="#F2A93B" />
          <Path d="M120 185 C123 189 123 193 120 195 C117 193 117 189 120 185 Z" fill="#FFE08A" />
        </Fx>
      ) : null}
      <G transform="translate(86 212)">
        <PawArt petId={petId} />
      </G>
    </>
  );
}
