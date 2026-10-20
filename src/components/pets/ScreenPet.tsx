import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { usePetProgress } from '@/lib/pet';

import { keyframe, useLoop } from './anim';
import { Fx } from './Fx';
import { LieEyes, LyingPet, lyingFeetOffset, lyingHeight } from './LyingPets';
import { OverlayKind, PetOverlay } from './petActing';
import { Pet } from './registry';

// The player's companion on the prayer screens (design: Share, Pray Now, Vigil, Together).
// Each screen positions it; the pet reacts to what the person is doing there.

const FEET = 0.92;
const HEART = 'M12 21 C5 15 2 11.5 2 8.5 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8.5 C22 11.5 19 15 12 21 Z';

export const petHeight = (size: number) => (size * 260) / 240;
/** How far down the pet's feet are from its top, so a screen can set them on an edge. */
export const petFeetOffset = (size: number) => FEET * petHeight(size);

type Props = {
  size: number;
  /** Leans toward the text box while the person types (Share). */
  lean?: boolean;
  /** Dozing: sinks a little and breathes z's. Turns false when the person starts typing, and the pet perks up. */
  sleepy?: boolean;
  /** Looks up hopefully (waiting for a prayer partner). */
  watching?: boolean;
  /** Warm candlelight on the pet, with motes of light drifting down onto it (the vigil). */
  warm?: boolean;
  /** Hops each time this number changes. */
  hop?: number;
  /** Tapping the pet plays its reaction. */
  interactive?: boolean;
  /** Where the z's float, in dp from the pet's left and top. */
  zAt?: { x: number; y: number };
  /** Pet-specific art for this screen: its tail hanging over the box, a blanket while it dozes, paws holding a candle. */
  scene?: OverlayKind;
  /** 'lie' draws the pet lying down (Pray Now's button); its eyes close while sleepy and look up while watching. */
  pose?: 'sit' | 'lie';
};

/** One floating "z". */
function Zed({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  const reduce = useReducedMotion();
  const p = useLoop(3600, delay, !reduce, 0.2);
  const style = useAnimatedStyle(() => ({
    opacity: keyframe(p.get(), [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateX: keyframe(p.get(), [0, 1], [0, 14]) },
      { translateY: keyframe(p.get(), [0, 1], [0, -38]) },
      { scale: keyframe(p.get(), [0, 1], [0.7, 1.15]) },
    ],
  }));
  return (
    <Animated.Text
      pointerEvents="none"
      style={[{ position: 'absolute', left: x, top: y, fontSize: size, color: '#B5DCC6', fontStyle: 'italic', fontWeight: '500' }, style]}>
      z
    </Animated.Text>
  );
}

/** Light motes drifting down-left onto the pet, from the candle (Vigil). */
function Motes({ size }: { size: number }) {
  const s = size / 240;
  return (
    <Svg
      pointerEvents="none"
      width={size}
      height={petHeight(size)}
      viewBox="0 0 240 260"
      style={StyleSheet.absoluteFill}>
      {[0, 1500, 3000].map((d, i) => (
        <G key={d}>
          <Fx kind="moteV" delay={d}>
            <Circle cx={196 - i * 14} cy={70 + i * 18} r={3.2 / Math.max(s, 0.5)} fill="#F7DFA0" />
          </Fx>
        </G>
      ))}
    </Svg>
  );
}

export function ScreenPet({ size, lean, sleepy, watching, warm, hop, interactive, zAt, scene, pose = 'sit' }: Props) {
  const { petId, progress } = usePetProgress();
  const reduce = useReducedMotion();
  const lying = pose === 'lie';
  // A lying pet has no tap reaction of its own, so tapping it makes it hop.
  const [tapHops, setTapHops] = useState(0);
  const hops = (hop ?? 0) + tapHops;

  const sink = useSharedValue(0); // 1 = dozing
  const leanP = useSharedValue(0);
  const look = useSharedValue(0);
  const hopY = useSharedValue(0);
  const perk = useSharedValue(0);

  useEffect(() => {
    sink.set(withTiming(sleepy ? 1 : 0, { duration: reduce ? 0 : 500 }));
    if (!sleepy && !reduce) {
      // Waking up: a little bounce, like the design's "perk".
      perk.set(withSequence(withTiming(4, { duration: 0 }), withTiming(-5, { duration: 300, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 200 })));
    }
  }, [sleepy, reduce, sink, perk]);

  useEffect(() => {
    leanP.set(withTiming(lean ? 1 : 0, { duration: reduce ? 0 : 400 }));
  }, [lean, reduce, leanP]);

  useEffect(() => {
    cancelAnimation(look);
    if (watching && !reduce) {
      // Looks up and back down, repeating on the UI thread until it stops watching.
      look.set(0);
      look.set(
        withRepeat(
          withSequence(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
        ),
      );
      return () => cancelAnimation(look);
    }
    look.set(withTiming(0, { duration: 200 }));
  }, [watching, reduce, look]);

  useEffect(() => {
    if (!hops || reduce) return;
    hopY.set(
      withSequence(
        withTiming(-18, { duration: 280, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 6, stiffness: 160 }),
      ),
    );
  }, [hops, reduce, hopY]);

  const h = lying ? lyingHeight(size) : petHeight(size);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: hopY.get() + perk.get() + sink.get() * 5 - look.get() * 4 },
      { translateX: -3 * leanP.get() },
      { rotate: `${-12 * leanP.get() - 6 * look.get()}deg` },
    ],
    transformOrigin: '50% 100%',
    opacity: 1 - 0.12 * sink.get(),
  }));

  return (
    <View style={{ width: size, height: h }} pointerEvents={interactive ? 'box-none' : 'none'}>
      <Animated.View style={style}>
        {lying ? (
          <Pressable disabled={!interactive} onPress={() => setTapHops(n => n + 1)} accessibilityRole="button" accessibilityLabel="Your companion">
            <LyingPet id={petId} stage={progress.stage} size={size} eyes={sleepy ? 'sleep' : watching ? 'up' : 'open'} />
          </Pressable>
        ) : (
          <Pet id={petId} stage={progress.stage} size={size} interactive={interactive} />
        )}
        {!lying && scene && (scene !== 'doze' || sleepy) ? <PetOverlay petId={petId} kind={scene} size={size} warm={warm} /> : null}
        {warm ? <Motes size={size} /> : null}
      </Animated.View>
      {sleepy ? (
        <>
          <Zed delay={0} size={14} x={zAt?.x ?? size * 0.78} y={zAt?.y ?? 4} />
          <Zed delay={1200} size={18} x={(zAt?.x ?? size * 0.78) - 4} y={(zAt?.y ?? 4) - 4} />
          <Zed delay={2400} size={22} x={(zAt?.x ?? size * 0.78) - 8} y={(zAt?.y ?? 4) - 8} />
        </>
      ) : null}
    </View>
  );
}

function heartStyle(v: number, reduce: boolean, on: number) {
  'worklet';
  return {
    opacity: reduce ? (on ? 1 : 0) : keyframe(v, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: keyframe(v, [0, 0.2, 1], [8, 0, -36]) },
      { scale: keyframe(v, [0, 0.2, 1], [0.6, 1.1, 1]) },
    ],
  };
}

/** A couple of hearts that pop up and fade each time `trigger` changes (a tapped category, a lifted prayer). */
export function PopHearts({ trigger, style }: { trigger: number; style?: object }) {
  const reduce = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  useEffect(() => {
    if (!trigger) return;
    a.set(0);
    b.set(0);
    const run = reduce ? 0 : 1600;
    a.set(withTiming(1, { duration: run }));
    b.set(withDelay(180, withTiming(1, { duration: run })));
  }, [trigger, reduce, a, b]);
  const s1 = useAnimatedStyle(() => heartStyle(a.get(), reduce, trigger));
  const s2 = useAnimatedStyle(() => heartStyle(b.get(), reduce, trigger));
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: 40, height: 50 }, style]}>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 10 }, s1]}>
        <Svg width={20} height={20} viewBox="0 0 24 24"><Path d={HEART} fill="#E8998A" /></Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 20, top: 30 }, s2]}>
        <Svg width={14} height={14} viewBox="0 0 24 24"><Path d={HEART} fill="#F7DFA0" /></Svg>
      </Animated.View>
    </View>
  );
}

/**
 * The companion living behind a card (Together). It climbs up from behind the card and lies along its top edge
 * (never higher than that), looks around, does its own little move, dozes off for a bit, wakes, and slips back down.
 * Place it so its resting line is on the card's top edge, and render it BEFORE the card so the card hides it.
 */
type PeekPhase = 'hidden' | 'rise' | 'awake' | 'show' | 'doze' | 'wake' | 'sink';
const PEEK_PHASES: [PeekPhase, number][] = [
  ['hidden', 1800],
  ['rise', 700],
  ['awake', 3200],
  ['show', 1200],
  ['doze', 4600],
  ['wake', 1800],
  ['sink', 700],
];

export function PeekingPet({ size = 120 }: { size?: number }) {
  const reduce = useReducedMotion();
  const { petId, progress } = usePetProgress();
  const f = lyingFeetOffset(size);
  const [phase, setPhase] = useState<PeekPhase>('awake');
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);

  // Step through the phases on a timer (it simply lies there when reduce motion is on).
  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      const [ph, ms] = PEEK_PHASES[i % PEEK_PHASES.length];
      setPhase(ph);
      i += 1;
      t = setTimeout(step, ms);
    };
    t = setTimeout(step, 0);
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (reduce) {
      y.set(0);
      return;
    }
    const out = { duration: 220, easing: Easing.out(Easing.quad) };
    switch (phase) {
      case 'hidden':
        y.set(f + 4);
        break;
      case 'rise':
        // climbs up and settles on the edge, with a little squash
        y.set(withSequence(withTiming(-5, { duration: 440, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 240 })));
        sy.set(withSequence(withTiming(1.06, { duration: 300 }), withTiming(0.94, { duration: 180 }), withTiming(1, { duration: 200 })));
        break;
      case 'show':
        // each pet's own move, kept small so it stays lying on the card
        if (petId === 'lamb') y.set(withSequence(withTiming(-8, out), withTiming(0, out), withTiming(-6, out), withTiming(0, out)));
        else if (petId === 'dove') sy.set(withSequence(withTiming(1.12, out), withTiming(0.94, out), withTiming(1.04, out), withTiming(1, out)));
        else if (petId === 'lion') {
          sx.set(withSequence(withTiming(1.1, { duration: 300 }), withTiming(1.1, { duration: 300 }), withTiming(1, { duration: 300 })));
          sy.set(withSequence(withTiming(1.1, { duration: 300 }), withTiming(1.1, { duration: 300 }), withTiming(1, { duration: 300 })));
        } else if (petId === 'ember') {
          sy.set(withSequence(withTiming(1.14, out), withTiming(0.96, out), withTiming(1.08, out), withTiming(1, out)));
          sx.set(withSequence(withTiming(0.95, out), withTiming(1.02, out), withTiming(0.98, out), withTiming(1, out)));
        } else if (petId === 'dragon') rot.set(withSequence(withTiming(-6, out), withTiming(6, out), withTiming(-3, out), withTiming(0, out)));
        else rot.set(withSequence(withTiming(8, out), withTiming(-8, out), withTiming(5, out), withTiming(0, out)));
        break;
      case 'wake':
        y.set(withSequence(withTiming(-5, { duration: 160 }), withTiming(0, { duration: 220 })));
        break;
      case 'sink':
        y.set(withTiming(f + 4, { duration: 600, easing: Easing.in(Easing.quad) }));
        break;
      default:
        break;
    }
  }, [phase, reduce, petId, f, y, rot, sx, sy]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }, { rotate: `${rot.get()}deg` }, { scaleX: sx.get() }, { scaleY: sy.get() }],
    transformOrigin: '50% 92%',
  }));
  const eyes: LieEyes = phase === 'doze' ? 'sleep' : phase === 'rise' ? 'up' : 'open';
  return (
    <View pointerEvents="none" style={{ width: size, height: lyingHeight(size) }}>
      <Animated.View style={style}>
        <LyingPet id={petId} stage={progress.stage} size={size} eyes={eyes} />
      </Animated.View>
      {phase === 'doze' ? (
        <>
          <Zed delay={0} size={12} x={size * 0.36} y={-2} />
          <Zed delay={1200} size={15} x={size * 0.36 - 3} y={-6} />
          <Zed delay={2400} size={18} x={size * 0.36 - 6} y={-10} />
        </>
      ) : null}
    </View>
  );
}
