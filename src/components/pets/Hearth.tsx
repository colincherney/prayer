import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInUp,
  FadeOut,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';

import { Fx, SoftGlow } from './Fx';
import { LyingPet, lyingFeetOffset, lyingHeight } from './LyingPets';
import { Acting, PetParticles } from './petActing';
import { PipStage } from './PipLamb';
import { Pet, PetId } from './registry';

// The group page's log cabin hearth (design/Group.dc.html). Every member's companion rests here, never a name.
// The scene is drawn on a 342x320 artboard; pets are real pet components placed on top of it.

const AG = Animated.createAnimatedComponent(G);
const W = 342;
const H = 320;
const FEET = 0.92; // pets are drawn on a 240x260 artboard with a little empty space under the feet

export type HearthMember = { petId: PetId; stage: PipStage };

/** Decor a group can place in its hearth. Free for every member; the list is mirrored in save_group_nook(). */
export const HEARTH_DECOR: { id: string; name: string; sw: string; where: string }[] = [
  { id: 'garland', name: 'Pine garland', sw: '#2F6B4A', where: 'Beam' },
  { id: 'stockings', name: 'Stockings', sw: '#C9433A', where: 'Chimney' },
  { id: 'wreath', name: 'Wreath', sw: '#4C8A5C', where: 'Wall' },
  { id: 'cross', name: 'Wooden cross', sw: '#9A6C42', where: 'Wall' },
  { id: 'candles', name: 'Mantle candles', sw: '#F3EBDD', where: 'Mantle' },
  { id: 'plant', name: 'Window plant', sw: '#6E8B4E', where: 'Windowsill' },
  { id: 'tree', name: 'Little tree', sw: '#2F6B4A', where: 'Floor' },
  { id: 'lantern', name: 'Floor lantern', sw: '#F2C462', where: 'Floor' },
];

/** Where each member's companion rests (feet position and width, in artboard units). Yours is first, by the fire. */
const SPOTS: { cx: number; feet: number; w: number; lie?: 'sleep' | 'open' }[] = [
  { cx: 176, feet: 289, w: 100 },
  // asleep on the rug, and stretched out on the cushion
  { cx: 104, feet: 284, w: 126, lie: 'sleep' },
  { cx: 44, feet: 302, w: 84, lie: 'open' },
  { cx: 228, feet: 150, w: 44 },
  { cx: 104, feet: 131, w: 40 },
  { cx: 296, feet: 252, w: 54 },
];

export const HEARTH_SEATS = SPOTS.length;

function Flare({ on, children }: { on: boolean; children: React.ReactNode }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.set(withTiming(on ? 1 : 0, { duration: 400 }));
  }, [on, s]);
  const animatedProps = useAnimatedProps(() => ({ scaleX: 1 + 0.28 * s.get(), scaleY: 1 + 0.45 * s.get() }));
  return (
    <AG animatedProps={animatedProps} originX={259} originY={244}>
      {children}
    </AG>
  );
}

/** Hops once each time `trigger` changes (after `delay`), the way the design's pets hop when the group shares. */
function HopView({ trigger, delay, style, children }: { trigger: number; delay: number; style: object; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!trigger || reduce) return;
    y.set(
      withDelay(
        delay,
        withSequence(
          withTiming(-12, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.bounce }),
        ),
      ),
    );
  }, [trigger, delay, reduce, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/* ------------------------------ the room ------------------------------ */

const LOGS = [2, 30, 58, 86, 114, 142, 170, 198];

function Room() {
  return (
    <>
      <Rect width={W} height={256} fill="#3E2816" />
      {LOGS.map((y, i) => (
        <Rect key={y} x={-12} y={y} width={366} height={24} rx={12} fill={i % 2 ? '#634026' : '#6A4529'} />
      ))}
      <Rect x={-12} y={226} width={366} height={28} rx={12} fill="#6A4529" />
      <Path
        d="M0 9 H342 M0 37 H342 M0 65 H342 M0 93 H342 M0 121 H342 M0 149 H342 M0 177 H342 M0 205 H342 M0 233 H342"
        stroke="#7C5534"
        strokeWidth={2}
        opacity={0.6}
      />
      <G fill="#4E321F">
        <Ellipse cx={150} cy={18} rx={5} ry={3} />
        <Ellipse cx={160} cy={130} rx={5} ry={3} />
        <Ellipse cx={60} cy={210} rx={5} ry={3} />
        <Ellipse cx={166} cy={72} rx={4} ry={2.5} />
      </G>
      {[14, 42, 70, 98, 126, 154, 182, 210, 238].map(cy => (
        <Circle key={cy} cx={2} cy={cy} r={11} fill="#B58A5A" stroke="#8A6440" strokeWidth={2} />
      ))}

      {/* snowy window */}
      <Rect x={22} y={34} width={104} height={98} rx={6} fill="#3A2414" />
      <Rect x={28} y={40} width={92} height={86} rx={3} fill="#1B2448" />
      <Circle cx={100} cy={58} r={10} fill="#F4E3B5" />
      <Fx kind="twinkleSoft"><Circle cx={42} cy={52} r={1.2} fill="#F2E9D8" /></Fx>
      <Fx kind="twinkleSoft" delay={800}><Circle cx={64} cy={66} r={1} fill="#F2E9D8" /></Fx>
      <Fx kind="twinkleSoft" delay={1500}><Circle cx={84} cy={48} r={1} fill="#F2E9D8" /></Fx>
      <Fx kind="shootStar" delay={2500}>
        <Path d="M36 46 L46 51" stroke="#FFF6D8" strokeWidth={1.6} strokeLinecap="round" />
        <Circle cx={46} cy={51} r={1.4} fill="#FFFFFF" />
      </Fx>
      <Path d="M28 116 C50 106 70 118 92 110 C104 106 112 112 120 108 L120 126 L28 126 Z" fill="#E8EEF7" />
      <Path d="M40 112 L48 92 L56 112 Z M58 116 L68 88 L78 116 Z" fill="#20353A" />
      {[
        { cx: 38, d: 0 },
        { cx: 58, d: 1200 },
        { cx: 80, d: 2500 },
        { cx: 104, d: 3700 },
        { cx: 48, d: 2500 },
      ].map((f, i) => (
        <Fx key={i} kind="snowH" delay={f.d}>
          <Circle cx={f.cx} cy={44} r={1.5} fill="#FFFFFF" />
        </Fx>
      ))}
      <Path d="M74 40 V126 M28 83 H120" stroke="#3A2414" strokeWidth={4} />
      <Rect x={16} y={130} width={116} height={8} rx={2} fill="#8A6440" />
      <Path d="M30 34 Q44 28 58 34 Q74 26 90 34 Q106 28 120 34" stroke="#2F6B4A" strokeWidth={5} fill="none" strokeLinecap="round" />
      <Circle cx={44} cy={31} r={2.5} fill="#C9433A" />
      <Circle cx={74} cy={30} r={2.5} fill="#C9433A" />
      <Circle cx={104} cy={31} r={2.5} fill="#C9433A" />

      {/* stone chimney */}
      <Rect x={196} y={0} width={126} height={256} fill="#5E5852" />
      <G fill="#8A837C">
        <Rect x={200} y={4} width={38} height={22} rx={6} />
        <Rect x={290} y={4} width={30} height={22} rx={6} />
        <Rect x={232} y={30} width={46} height={22} rx={6} />
        <Rect x={200} y={56} width={42} height={22} rx={6} />
        <Rect x={286} y={56} width={34} height={22} rx={6} />
        <Rect x={236} y={82} width={44} height={22} rx={6} />
        <Rect x={200} y={108} width={40} height={22} rx={6} />
        <Rect x={288} y={108} width={32} height={22} rx={6} />
        <Rect x={198} y={166} width={14} height={26} rx={5} />
        <Rect x={306} y={196} width={14} height={26} rx={5} />
        <Rect x={198} y={226} width={14} height={24} rx={5} />
      </G>
      <G fill="#7C766F">
        <Rect x={242} y={4} width={44} height={22} rx={6} />
        <Rect x={198} y={30} width={30} height={22} rx={6} />
        <Rect x={282} y={30} width={38} height={22} rx={6} />
        <Rect x={246} y={56} width={36} height={22} rx={6} />
        <Rect x={198} y={82} width={34} height={22} rx={6} />
        <Rect x={284} y={82} width={36} height={22} rx={6} />
        <Rect x={244} y={108} width={40} height={22} rx={6} />
        <Rect x={306} y={166} width={14} height={26} rx={5} />
        <Rect x={198} y={196} width={14} height={26} rx={5} />
        <Rect x={306} y={226} width={14} height={24} rx={5} />
      </G>
      <Fx kind="stoneFlick">
        <Rect x={196} y={0} width={126} height={256} fill="#F2A93B" />
      </Fx>
      <Path d="M214 252 V200 Q214 172 259 172 Q304 172 304 200 V252 Z" fill="#1A120C" />
      <Rect x={212} y={134} width={94} height={40} fill="#5E5852" />
      <G fill="#7C766F">
        <Rect x={214} y={136} width={28} height={12} rx={4} />
        <Rect x={246} y={136} width={30} height={12} rx={4} />
        <Rect x={280} y={136} width={24} height={12} rx={4} />
      </G>
      <Path d="M214 200 Q214 172 259 172 Q304 172 304 200" stroke="#8A837C" strokeWidth={6} fill="none" />
      <Ellipse cx={246} cy={245} rx={18} ry={5} fill="#6B4A2A" rotation={-8} originX={246} originY={245} />
      <Ellipse cx={272} cy={245} rx={18} ry={5} fill="#5A3A24" rotation={8} originX={272} originY={245} />
    </>
  );
}

function Fire({ flare }: { flare: boolean }) {
  return (
    <>
      <Flare on={flare}>
        <Fx kind="fireH" ox={259} oy={244}>
          <Path d="M259 244 C236 234 238 208 250 196 C250 210 256 212 258 204 C262 192 256 184 262 174 C272 188 284 204 280 224 C278 238 270 244 259 244 Z" fill="#E8873A" />
          <Path d="M259 244 C246 238 246 222 254 212 C256 222 262 222 262 214 C268 222 274 232 270 240 C268 244 264 244 259 244 Z" fill="#F2C462" />
          <Path d="M259 244 C253 240 254 232 258 226 C262 232 266 238 263 242 Z" fill="#FFF3C4" />
        </Fx>
      </Flare>
      <Fx kind="sparkH" delay={0}><Circle cx={254} cy={200} r={1.6} fill="#FFE08A" /></Fx>
      <Fx kind="sparkH" delay={800}><Circle cx={264} cy={196} r={1.4} fill="#FFE08A" /></Fx>
      <Fx kind="sparkH" delay={1600}><Circle cx={258} cy={190} r={1.5} fill="#FFE08A" /></Fx>
      <Rect x={186} y={146} width={146} height={12} rx={3} fill="#6B4A2A" />
      <Rect x={190} y={158} width={138} height={3} fill="#3E2816" />
      <Path d="M304 128 L304 146 M298 134 L310 134" stroke="#C9A24B" strokeWidth={3} strokeLinecap="round" />
      <Rect x={276} y={134} width={10} height={12} rx={2} fill="#2F4B7A" />
      <Rect x={278} y={128} width={6} height={6} rx={1} fill="#2F4B7A" />
    </>
  );
}

function Floor() {
  return (
    <>
      <Rect x={0} y={256} width={W} height={64} fill="#6E4A2E" />
      <Path d="M0 272 H342 M0 290 H342 M0 308 H342" stroke="#5A3A24" strokeWidth={1.5} />
      <Path d="M60 256 V272 M180 272 V290 M110 290 V308 M260 290 V308 M300 256 V272 M30 308 V320" stroke="#5A3A24" strokeWidth={1.5} />
      <Rect x={188} y={250} width={142} height={9} rx={3} fill="#8A837C" />
      <Ellipse cx={128} cy={290} rx={106} ry={22} fill="#8A3A2E" />
      <Ellipse cx={128} cy={290} rx={94} ry={17} fill="none" stroke="#E3B57A" strokeWidth={2} strokeDasharray="5 5" />
      <Ellipse cx={128} cy={290} rx={68} ry={11} fill="#9E4A36" />
      <Ellipse cx={42} cy={301} rx={26} ry={8} fill="#2F4B7A" />
      <Ellipse cx={42} cy={298} rx={22} ry={5} fill="#3A5A8E" />
    </>
  );
}

/* ------------------------------ decor ------------------------------ */

function Decor({ id }: { id: string }) {
  switch (id) {
    case 'garland':
      return (
        <>
          <Path d="M0 8 Q47 34 95 12 Q142 34 192 10" stroke="#2F6B4A" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M0 8 Q47 34 95 12 Q142 34 192 10" stroke="#3F8A5E" strokeWidth={2} fill="none" strokeDasharray="4 6" />
          <Circle cx={30} cy={22} r={2.6} fill="#C9433A" />
          <Circle cx={140} cy={22} r={2.6} fill="#C9433A" />
          <Fx kind="twinkle" ox={50} oy={24}><Circle cx={50} cy={24} r={2.4} fill="#FFE08A" /></Fx>
          <Fx kind="twinkle" delay={700} ox={95} oy={14}><Circle cx={95} cy={14} r={2.4} fill="#FFE08A" /></Fx>
          <Fx kind="twinkle" delay={1400} ox={170} oy={24}><Circle cx={170} cy={24} r={2.4} fill="#FFE08A" /></Fx>
        </>
      );
    case 'stockings':
      return (
        <>
          <Path d="M210 6 Q262 14 312 6" stroke="#8A6440" strokeWidth={2} fill="none" />
          {[
            { x: 228, c: '#C9433A', d: 0 },
            { x: 260, c: '#2F6B4A', d: 500 },
            { x: 292, c: '#C9433A', d: 1000 },
          ].map(s => (
            <Fx key={s.x} kind="sway4" delay={s.d} ox={s.x} oy={9}>
              <Path d={`M${s.x - 6} 9 h12 v22 q0 8 -8 8 h-9 q-6 0 -6 -6 q0 -5 6 -5 h5 z`} fill={s.c} />
              <Rect x={s.x - 7} y={7} width={14} height={5} rx={2} fill="#F2E9D8" />
            </Fx>
          ))}
        </>
      );
    case 'wreath':
      return (
        <>
          <Circle cx={160} cy={106} r={21} fill="none" stroke="#2F6B4A" strokeWidth={9} />
          <Circle cx={160} cy={106} r={21} fill="none" stroke="#4C8A5C" strokeWidth={3} strokeDasharray="3 6" />
          <Fx kind="twinkleSoft" ox={146} oy={92}><Circle cx={146} cy={92} r={2.6} fill="#C9433A" /></Fx>
          <Fx kind="twinkleSoft" delay={900} ox={176} oy={100}><Circle cx={176} cy={100} r={2.6} fill="#C9433A" /></Fx>
          <Circle cx={152} cy={122} r={2.6} fill="#C9433A" />
          <Path d="M160 126 l-9 8 l5 -9 z M160 126 l9 8 l-5 -9 z" fill="#C9433A" />
          <Circle cx={160} cy={126} r={3} fill="#A8322A" />
        </>
      );
    case 'cross':
      return (
        <>
          <SoftGlow cx={160} cy={52} r={30} color="#F2A93B" />
          <Rect x={156} y={30} width={8} height={44} rx={2} fill="#9A6C42" />
          <Rect x={144} y={42} width={32} height={8} rx={2} fill="#9A6C42" />
          <Rect x={158} y={32} width={2} height={40} fill="#B98B5E" />
        </>
      );
    case 'candles':
      return (
        <>
          {[
            { x: 255, d: 0 },
            { x: 266, d: 400 },
          ].map(c => (
            <G key={c.x}>
              <SoftGlow cx={c.x + 3} cy={124} r={13} color="#F2A93B" />
              <Rect x={c.x} y={130} width={6} height={16} rx={1.5} fill="#F3EBDD" />
              <Fx kind="candle" delay={c.d}>
                <Path d={`M${c.x + 3} 119 C${c.x + 7} 124 ${c.x + 7} 128 ${c.x + 3} 130 C${c.x - 1} 128 ${c.x - 1} 124 ${c.x + 3} 119 Z`} fill="#F2A93B" />
                <Path d={`M${c.x + 3} 123 C${c.x + 5} 126 ${c.x + 5} 128 ${c.x + 3} 129 C${c.x + 1} 128 ${c.x + 1} 126 ${c.x + 3} 123 Z`} fill="#FFE08A" />
              </Fx>
            </G>
          ))}
        </>
      );
    case 'plant':
      return (
        <>
          <Fx kind="leafSway" ox={40} oy={120}>
            <Path d="M40 120 C30 108 26 98 30 90 C38 96 42 108 40 120 Z" fill="#6E8B4E" />
            <Path d="M40 120 C44 106 52 98 60 98 C58 108 50 116 40 120 Z" fill="#8DAA62" />
            <Path d="M40 120 C38 104 40 94 46 88 C50 98 46 110 40 120 Z" fill="#7A9A56" />
          </Fx>
          <Path d="M29 120 h22 l-3 11 h-16 z" fill="#B5734A" />
        </>
      );
    case 'tree':
      return (
        <>
          <Rect x={27} y={246} width={6} height={14} fill="#6B4A2A" />
          <Path d="M30 178 L12 214 H48 Z" fill="#2F6B4A" />
          <Path d="M30 196 L8 236 H52 Z" fill="#3A7A55" />
          <Path d="M30 214 L4 258 H56 Z" fill="#2F6B4A" />
          <Fx kind="twinkle" ox={26} oy={206}><Circle cx={26} cy={206} r={2.2} fill="#FFE08A" /></Fx>
          <Fx kind="twinkle" delay={500} ox={38} oy={226}><Circle cx={38} cy={226} r={2.2} fill="#F2A9A0" /></Fx>
          <Fx kind="twinkle" delay={1000} ox={20} oy={240}><Circle cx={20} cy={240} r={2.2} fill="#FFE08A" /></Fx>
          <Fx kind="twinkle" delay={1500} ox={40} oy={250}><Circle cx={40} cy={250} r={2.2} fill="#9CD3F2" /></Fx>
          <Fx kind="twinkle" ox={30} oy={176}>
            <Path d="M30 168 L32 175 L39 177 L32 179 L30 186 L28 179 L21 177 L28 175 Z" fill="#F2C462" />
          </Fx>
        </>
      );
    case 'lantern':
      return (
        <>
          <SoftGlow cx={322} cy={292} r={30} color="#F2A93B" />
          <Path d="M314 276 Q322 266 330 276" stroke="#3A2A1E" strokeWidth={2} fill="none" />
          <Rect x={313} y={276} width={18} height={26} rx={3} fill="#2B2420" />
          <Rect x={316} y={279} width={12} height={20} rx={2} fill="#F7DFA0" opacity={0.85} />
          <Fx kind="candle">
            <Path d="M322 282 C326 287 326 292 322 295 C318 292 318 287 322 282 Z" fill="#F2A93B" />
          </Fx>
          <Rect x={311} y={301} width={22} height={4} rx={2} fill="#3A2A1E" />
        </>
      );
    default:
      return null;
  }
}

/* ------------------------------ the whole hearth ------------------------------ */

type HearthProps = {
  /** Rendered width in dp; height follows the artboard. */
  width: number;
  /** Everyone's companions, you first. Extra members past the seats are not shown. */
  members: HearthMember[];
  decor: string[];
  /** Change this number to make the fire flare, the pets hop and the toast appear (e.g. when someone shares a prayer). */
  flare?: number;
  /** Double-tapping the hearth calls this (used to open the decorate page). */
  onDoubleTap?: () => void;
  toastText?: string;
};

export function Hearth({ width, members, decor, flare = 0, onDoubleTap, toastText = 'Your circle is praying with you' }: HearthProps) {
  const k = width / W;
  const height = H * k;
  const [flaring, setFlaring] = useState(false);

  useEffect(() => {
    if (!flare) return;
    const on = setTimeout(() => setFlaring(true), 0);
    const off = setTimeout(() => setFlaring(false), 2600);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [flare]);

  const seated = members.slice(0, SPOTS.length);
  // Draw the pets that sit highest on the wall first, so the ones in front overlap them.
  const order = seated.map((m, i) => ({ m, i })).sort((a, b) => SPOTS[a.i].feet - SPOTS[b.i].feet);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (success && onDoubleTap) runOnJS(onDoubleTap)();
    });

  const body = (
    <View
      accessible
      accessibilityLabel={`The group's hearth, where ${seated.length} companion${seated.length === 1 ? '' : 's'} rest by a crackling fire`}
      style={[styles.frame, { width, height, borderRadius: 26 * Math.min(1, k + 0.2) }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
        <Room />
        <Fire flare={flaring} />
        <Floor />
        {HEARTH_DECOR.filter(d => decor.includes(d.id)).map(d => (
          <Decor key={d.id} id={d.id} />
        ))}
      </Svg>

      {order.map(({ m, i }) => {
        const spot = SPOTS[i];
        const size = spot.w * k;
        const petH = spot.lie ? lyingHeight(size) : (size * 260) / 240;
        const feetIn = spot.lie ? lyingFeetOffset(size) : FEET * petH;
        return (
          <HopView
            key={i}
            trigger={flare}
            delay={i * 120}
            style={{
              position: 'absolute',
              left: spot.cx * k - size / 2,
              top: spot.feet * k - feetIn,
              width: size,
              height: petH,
            }}>
            <View pointerEvents="none">
              {spot.lie ? (
                <LyingPet id={m.petId} stage={m.stage} size={size} eyes={spot.lie} />
              ) : (
                <Acting petId={m.petId} seat={i} size={size}>
                  <Pet id={m.petId} stage={m.stage} size={size} />
                  <PetParticles petId={m.petId} size={size} />
                </Acting>
              )}
            </View>
          </HopView>
        );
      })}

      {/* fire glow over everything, plus the sleepy z's by the rug */}
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="fireglow" cx={259} cy={214} r={200} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#F2A93B" stopOpacity={0.5} />
            <Stop offset="0.5" stopColor="#F2A93B" stopOpacity={0.12} />
            <Stop offset="1" stopColor="#F2A93B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Fx kind="fglow">
          <Rect width={W} height={H} fill="url(#fireglow)" />
        </Fx>
        {[
          { x: 196, y: 214, d: 0 },
          { x: 230, y: 190, d: 2200 },
          { x: 160, y: 200, d: 4400 },
          { x: 280, y: 222, d: 6600 },
          { x: 120, y: 176, d: 3300 },
        ].map(m => (
          <Fx key={m.d} kind="dust" delay={m.d}>
            <Circle cx={m.x} cy={m.y} r={1.3} fill="#FFE8B0" />
          </Fx>
        ))}
        {seated.length > 1 ? (
          <>
            <Fx kind="zH" delay={0}><SvgText x={84} y={214} fontSize={9} fontStyle="italic" fill="#B5DCC6" fontFamily={FONTS.displayItalic}>z</SvgText></Fx>
            <Fx kind="zH" delay={1200}><SvgText x={88} y={212} fontSize={11} fontStyle="italic" fill="#B5DCC6" fontFamily={FONTS.displayItalic}>z</SvgText></Fx>
            <Fx kind="zH" delay={2400}><SvgText x={92} y={210} fontSize={13} fontStyle="italic" fill="#B5DCC6" fontFamily={FONTS.displayItalic}>z</SvgText></Fx>
          </>
        ) : null}
      </Svg>

      {flaring ? (
        <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOut.duration(500)} style={styles.toastWrap} pointerEvents="none">
          <Text style={styles.toast}>{toastText}</Text>
        </Animated.View>
      ) : null}
    </View>
  );

  return onDoubleTap ? <GestureDetector gesture={doubleTap}>{body}</GestureDetector> : body;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderWidth: 1, borderColor: '#3A2A1E', backgroundColor: '#3E2816' },
  toastWrap: { position: 'absolute', left: 0, right: 0, top: 12, alignItems: 'center' },
  toast: {
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(242,233,216,0.95)',
    color: '#2A1A10',
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
  },
});

/* ------------------------------ decor icons (the decorate page's chips) ------------------------------ */

function HearthIconArt({ id }: { id: string }) {
  switch (id) {
    case 'garland':
      return (
        <>
          <Path d="M3 9 Q16 22 29 9" stroke="#2F6B4A" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M3 9 Q16 22 29 9" stroke="#3F8A5E" strokeWidth={1.4} fill="none" strokeDasharray="2 3" />
          <Circle cx={9} cy={14} r={2} fill="#FFE08A" />
          <Circle cx={16} cy={16.5} r={2} fill="#C9433A" />
          <Circle cx={23} cy={14} r={2} fill="#FFE08A" />
        </>
      );
    case 'stockings':
      return (
        <>
          <Path d="M4 6 Q16 9 28 6" stroke="#8A6440" strokeWidth={1.4} fill="none" />
          <Path d="M7 7 h7 v12 q0 5 -5 5 h-4 q-4 0 -4 -3.5 q0 -3 4 -3 h2 z" fill="#C9433A" />
          <Rect x={6} y={6} width={9} height={3.4} rx={1.4} fill="#F2E9D8" />
          <Path d="M19 7 h7 v12 q0 5 -5 5 h-4 q-4 0 -4 -3.5 q0 -3 4 -3 h2 z" fill="#2F6B4A" />
          <Rect x={18} y={6} width={9} height={3.4} rx={1.4} fill="#F2E9D8" />
        </>
      );
    case 'wreath':
      return (
        <>
          <Circle cx={16} cy={15} r={9} fill="none" stroke="#2F6B4A" strokeWidth={5} />
          <Circle cx={16} cy={15} r={9} fill="none" stroke="#4C8A5C" strokeWidth={1.4} strokeDasharray="2 3" />
          <Circle cx={10} cy={9} r={1.8} fill="#C9433A" />
          <Circle cx={23} cy={12} r={1.8} fill="#C9433A" />
          <Path d="M16 24 l-5 5 l3 -6 z M16 24 l5 5 l-3 -6 z" fill="#C9433A" />
          <Circle cx={16} cy={24} r={2} fill="#A8322A" />
        </>
      );
    case 'cross':
      return (
        <>
          <Circle cx={16} cy={16} r={13} fill="#F2A93B" opacity={0.18} />
          <Rect x={13.5} y={4} width={5} height={24} rx={1.4} fill="#9A6C42" />
          <Rect x={7} y={10} width={18} height={5} rx={1.4} fill="#9A6C42" />
          <Rect x={14.6} y={5} width={1.2} height={22} fill="#B98B5E" />
        </>
      );
    case 'candles':
      return (
        <>
          <Circle cx={16} cy={11} r={11} fill="#F2A93B" opacity={0.18} />
          <Rect x={9} y={14} width={5} height={14} rx={1.2} fill="#F3EBDD" />
          <Rect x={18} y={11} width={5} height={17} rx={1.2} fill="#F3EBDD" />
          <Path d="M11.5 6 C14 9 14 12 11.5 13.5 C9 12 9 9 11.5 6 Z" fill="#F2A93B" />
          <Path d="M20.5 3 C23 6 23 9 20.5 10.5 C18 9 18 6 20.5 3 Z" fill="#F2A93B" />
          <Rect x={6} y={27} width={20} height={2.6} rx={1.3} fill="#6B4A2A" />
        </>
      );
    case 'plant':
      return (
        <>
          <Path d="M16 20 C9 14 8 8 11 4 C16 8 18 14 16 20 Z" fill="#6E8B4E" />
          <Path d="M16 20 C19 12 24 9 29 9 C27 15 22 19 16 20 Z" fill="#8DAA62" />
          <Path d="M16 20 C14 13 15 7 19 3 C21 10 19 16 16 20 Z" fill="#7A9A56" />
          <Path d="M8 20 h16 l-2.4 9 h-11.2 z" fill="#B5734A" />
        </>
      );
    case 'tree':
      return (
        <>
          <Rect x={14} y={24} width={4} height={5} fill="#6B4A2A" />
          <Path d="M16 4 L8 14 H24 Z" fill="#2F6B4A" />
          <Path d="M16 9 L6 20 H26 Z" fill="#3A7A55" />
          <Path d="M16 14 L4 25 H28 Z" fill="#2F6B4A" />
          <Circle cx={13} cy={17} r={1.4} fill="#FFE08A" />
          <Circle cx={20} cy={21} r={1.4} fill="#F2A9A0" />
          <Circle cx={11} cy={23} r={1.4} fill="#9CD3F2" />
          <Path d="M16 1 L17 3.6 L19.6 4 L17 4.6 L16 7.2 L15 4.6 L12.4 4 L15 3.6 Z" fill="#F2C462" />
        </>
      );
    case 'lantern':
      return (
        <>
          <Circle cx={16} cy={18} r={13} fill="#F2A93B" opacity={0.18} />
          <Path d="M11 9 Q16 2 21 9" stroke="#3A2A1E" strokeWidth={1.8} fill="none" />
          <Rect x={10} y={9} width={12} height={18} rx={2} fill="#2B2420" />
          <Rect x={12} y={11} width={8} height={14} rx={1.4} fill="#F7DFA0" opacity={0.85} />
          <Path d="M16 13 C19 16.5 19 20 16 22 C13 20 13 16.5 16 13 Z" fill="#F2A93B" />
          <Rect x={8.5} y={26} width={15} height={3} rx={1.4} fill="#3A2A1E" />
        </>
      );
    default:
      return <Circle cx={16} cy={16} r={8} fill="#F2C462" />;
  }
}

/** A small picture of a hearth decoration, in the same style as the nook's decor icons. */
export function HearthIcon({ id, size = 30 }: { id: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <HearthIconArt id={id} />
    </Svg>
  );
}
