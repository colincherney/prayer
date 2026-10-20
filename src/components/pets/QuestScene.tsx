import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';

import { keyframe, useLoop, useMotionEnabled } from './anim';
import { Fx, SoftGlow, TwinkleDot } from './Fx';
import { lightingForHour, Lighting } from './nookData';
import { PilgrimPet } from './PilgrimPets';
import { PipStage } from './PipLamb';
import type { PetId } from './registry';

// The top of the Quests page (design/Quests.dc.html): your guide at the start of a glowing path that winds up to a
// hilltop chapel. The sky follows the time of day. Finishing a quest makes the guide hop in a burst of sparkles.

const APath = Animated.createAnimatedComponent(Path);
const W = 346;
const H = 330;
const ROAD = 'M120 330 C150 300 210 296 220 262 C228 236 196 222 230 196 C252 180 268 160 280 136';
const STAR = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';

const SKIES: Record<Lighting, { sky: [string, string, string]; far: string; near: string; road: string; chapel: string }> = {
  night: { sky: ['#121733', '#26285A', '#3A2F5A'], far: '#2B2A50', near: '#232246', road: '#3A3866', chapel: '#1A1838' },
  sunset: { sky: ['#2B2050', '#6A3E66', '#C9765A'], far: '#4A3458', near: '#3A2848', road: '#5A4468', chapel: '#2A1A34' },
  morning: { sky: ['#5E7FB8', '#E8A98A', '#F6D3A0'], far: '#7A8A5E', near: '#5E7048', road: '#C9B48A', chapel: '#4A3E52' },
  afternoon: { sky: ['#4E86C8', '#8FB9E6', '#CFE3F2'], far: '#6E9A5A', near: '#55804A', road: '#D9C49A', chapel: '#4A4258' },
};

/** The dashes along the path, marching toward the chapel. */
function MarchingRoad({ color }: { color: string }) {
  const enabled = useMotionEnabled(true);
  const p = useLoop(2400, 0, enabled, 0);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: -24 * p.get() }));
  return (
    <APath d={ROAD} stroke={color} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="4 8" fill="none" strokeLinecap="round" animatedProps={animatedProps} />
  );
}

/** Three sparkles bursting around the guide each time `trigger` changes. */
function Sparkle({ trigger, x, y, delay, k }: { trigger: number; x: number; y: number; delay: number; k: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(1);
  useEffect(() => {
    if (!trigger || reduce) return;
    p.set(0);
    p.set(withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) })));
  }, [trigger, delay, reduce, p]);
  const style = useAnimatedStyle(() => ({
    opacity: keyframe(p.get(), [0, 0.3, 1], [0, 1, 0]),
    transform: [{ translateY: keyframe(p.get(), [0, 1], [0, -20]) }, { scale: keyframe(p.get(), [0, 0.3, 1], [0.3, 1.2, 0.6]) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (x - 10) * k, top: (y - 10) * k }, style]}>
      <Svg width={20 * k} height={20 * k} viewBox="-10 -10 20 20">
        <Path d={STAR} fill="#F7DFA0" />
      </Svg>
    </Animated.View>
  );
}

type Props = {
  width: number;
  petId: PetId;
  stage: PipStage;
  /** Who is speaking ("ELDER JUDAH"). */
  speaker: string;
  line: string;
  /** Change it to make the guide hop with sparkles. */
  celebrate: number;
  /** Shown as a toast while set, e.g. "Judah reached Level 5!". */
  toast?: string | null;
};

export function QuestScene({ width, petId, stage, speaker, line, celebrate, toast }: Props) {
  const reduce = useReducedMotion();
  const k = width / W;
  const lighting = lightingForHour(new Date().getHours());
  const sky = SKIES[lighting];
  const dark = lighting === 'night' || lighting === 'sunset';

  const hop = useSharedValue(0);
  useEffect(() => {
    if (!celebrate || reduce) return;
    hop.set(withSequence(withTiming(-22, { duration: 280, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 7, stiffness: 170 })));
  }, [celebrate, reduce, hop]);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.get() * k }] }));

  const guideW = 240 * 0.86 * k;
  return (
    <View style={[styles.frame, { width, height: H * k }]}>
      <Svg width={width} height={H * k} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="qsky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.sky[0]} />
            <Stop offset="0.6" stopColor={sky.sky[1]} />
            <Stop offset="1" stopColor={sky.sky[2]} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#qsky)" />
        {dark ? (
          <G fill="#F2E9D8">
            <TwinkleDot cx={240} cy={30} r={1.4} />
            <TwinkleDot cx={300} cy={62} r={1.2} delay={800} />
            <TwinkleDot cx={200} cy={80} r={1} delay={1600} />
            <TwinkleDot cx={320} cy={20} r={1.1} />
            <TwinkleDot cx={262} cy={98} r={1} delay={800} />
            <TwinkleDot cx={160} cy={40} r={1.2} delay={1600} />
          </G>
        ) : null}
        {lighting === 'night' ? (
          <>
            <Circle cx={316} cy={40} r={11} fill="#F4E3B5" />
            <Circle cx={321} cy={36} r={10} fill={sky.sky[0]} />
            <Fx kind="shootStar" delay={3000}>
              <Path d="M180 24 L196 32" stroke="#FFF6D8" strokeWidth={1.6} strokeLinecap="round" />
            </Fx>
          </>
        ) : (
          <>
            <SoftGlow cx={lighting === 'sunset' ? 300 : 70} cy={lighting === 'sunset' ? 128 : 54} r={46} color="#FFE9A8" kind="glowMoon" />
            <Circle cx={lighting === 'sunset' ? 300 : 70} cy={lighting === 'sunset' ? 128 : 54} r={14} fill="#FFE9A8" />
            {lighting !== 'sunset' ? (
              <>
                <Fx kind="driftA">
                  <Path d="M150 46 q8 -12 20 -4 q12 -8 20 4 z" fill="#FFFFFF" opacity={0.85} />
                </Fx>
                <Fx kind="birds">
                  <Path d="M0 70 q5 -5 10 0 q5 -5 10 0 M26 62 q4 -4 8 0 q4 -4 8 0" stroke="#3A3A5A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
                </Fx>
              </>
            ) : null}
          </>
        )}
        <Path d="M0 214 C60 190 120 170 180 168 C230 166 260 140 300 134 C320 132 336 136 346 140 L346 330 L0 330 Z" fill={sky.far} />
        <Path d="M0 252 C80 236 150 232 220 222 C280 214 320 220 346 216 L346 330 L0 330 Z" fill={sky.near} />
        {/* the hilltop chapel */}
        <Rect x={270} y={112} width={26} height={22} fill={sky.chapel} />
        <Polygon points="267,113 283,98 299,113" fill={sky.chapel} />
        <Path d="M283 84 L283 98 M278 89 L288 89" stroke={sky.chapel} strokeWidth={2.4} strokeLinecap="round" />
        <SoftGlow cx={283} cy={122} r={14} color="#F2C462" />
        <Fx kind="candle">
          <Rect x={280} y={118} width={6} height={9} rx={3} fill="#F2C462" />
        </Fx>
        {/* the road there */}
        <Path d={ROAD} stroke={sky.road} strokeWidth={16} fill="none" strokeLinecap="round" />
        <MarchingRoad color="#F7DFA0" />
        {dark ? (
          <>
            <Fx kind="firefly" delay={0}><Circle cx={60} cy={250} r={1.8} fill="#E9F59A" /></Fx>
            <Fx kind="firefly" delay={1500}><Circle cx={250} cy={240} r={1.6} fill="#E9F59A" /></Fx>
            <Fx kind="firefly" delay={2800}><Circle cx={300} cy={190} r={1.4} fill="#E9F59A" /></Fx>
          </>
        ) : null}
      </Svg>

      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -14 * k, top: 96 * k }, hopStyle]}>
        <PilgrimPet id={petId} stage={stage} size={guideW} />
      </Animated.View>
      <Sparkle trigger={celebrate} x={40} y={174} delay={0} k={k} />
      <Sparkle trigger={celebrate} x={178} y={170} delay={120} k={k} />
      <Sparkle trigger={celebrate} x={110} y={160} delay={240} k={k} />

      <View style={[styles.bubbleWrap, { width: 214 * k }]} pointerEvents="none">
        <Animated.View key={line} entering={reduce ? undefined : FadeInDown.duration(450)} style={styles.bubble}>
          <Text style={styles.speaker}>{speaker}</Text>
          <Text style={styles.line}>{line}</Text>
          <Svg style={styles.tail} width={18} height={11} viewBox="0 0 18 11">
            <Path d="M0 0 L18 0 L4 11 Z" fill="#F3E6C8" />
          </Svg>
        </Animated.View>
      </View>

      {toast ? (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(500)} style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#262C4A', backgroundColor: '#121733' },
  bubbleWrap: { position: 'absolute', left: 14, top: 14 },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3E6C8',
    shadowColor: '#C9B48A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  speaker: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 1.6, color: '#8A5A3C' },
  line: { marginTop: 4, fontFamily: FONTS.display, fontSize: 15, lineHeight: 21, color: '#2A2016' },
  tail: { position: 'absolute', left: 40, bottom: -10 },
  toast: {
    position: 'absolute',
    right: 14,
    top: 150,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#8FC6A9',
  },
  toastText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: '#10231A' },
});
