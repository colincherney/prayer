import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';

import { NOOK_H, NOOK_W } from './NookScene';

const WALNUT = '#4A3222';
const FRAME_HIGHLIGHT = '#5E4130';
const FRAME = 16;
const HIGHLIGHT = 3;
const SILL_OVERHANG = 10;
const MEDALLION = 36;
/** The greeting bubble shows this long each time the page opens, then fades away. */
const BUBBLE_MS = 3000;
const CLOUD_H = 130;
/** How far the top of the cloud art sits above the bottom of the sill. */
const CLOUD_RISE = 74;
const CANDLES_H = 30;
const CLOUD_ART_W = 390;
/** How strong the clouds are over the middle of the nook, so the scene and top of the sill show through. */
const CLOUD_VEIL = 0.22;
/** How strong they are at the frame's outer edges and the bottom of the sill, so the nook still sinks into them. */
const CLOUD_EDGE = 0.96;

/** Height of the sill under the arch. */
export const ALCOVE_SILL_H = 14;
/** How far the medallion rises above the top of the arch. */
export const MEDALLION_RISE = 14;

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
/** One path, so the puffs merge into a single shape and share one gradient. */
const CLOUDS = [
  'M0 74V130H390V74Z',
  circle(8, 62, 40),
  circle(58, 70, 36),
  circle(104, 84, 30),
  circle(150, 88, 30),
  circle(195, 82, 32),
  circle(240, 88, 30),
  circle(286, 84, 30),
  circle(332, 70, 36),
  circle(382, 60, 42),
].join('');
const SPARKLE = 'M12 1 L14 10 L23 12 L14 14 L12 23 L10 14 L1 12 L10 10 Z';

function Candles() {
  return (
    <Svg width={38} height={CANDLES_H} viewBox="0 0 38 30">
      <Rect x={3} y={15} width={8} height={13} rx={1} fill="#F2E9D8" />
      <Rect x={15} y={8} width={9} height={20} rx={1} fill="#FBF4E6" />
      <Rect x={28} y={18} width={7} height={10} rx={1} fill="#E9DCC4" />
      <Ellipse cx={7} cy={11} rx={2.2} ry={3.6} fill="#F2A23B" />
      <Ellipse cx={19.5} cy={4} rx={2.4} ry={3.9} fill="#F2A23B" />
      <Ellipse cx={31.5} cy={14} rx={2} ry={3.3} fill="#F2A23B" />
      <Rect x={1} y={27} width={36} height={3} rx={1.5} fill="#C9A06A" />
    </Svg>
  );
}

type Props = {
  /** Outer width of the wooden arch, in dp. The sill overhangs it on both sides. */
  frameWidth: number;
  /** Height of the wooden arch, down to the top of the sill, in dp. */
  archHeight: number;
  /** Full width of the screen, which the clouds span. */
  screenWidth: number;
  /** The clouds' colour. They fade to clear at the bottom, so the page background shows through. */
  cloudColor: string;
  sparkleColor: string;
  /** What the pet says from inside the arch. */
  greeting: string;
  /** Draws the scene at this width, which is big enough to fill the opening. */
  children: (sceneWidth: number) => React.ReactNode;
};

/** The nook set into the wall as an arched window, resting on clouds in the page's colours. */
export function NookAlcove({ frameWidth, archHeight, screenWidth, cloudColor, sparkleColor, greeting, children }: Props) {
  const sceneWidth = frameWidth - FRAME * 2;
  const sceneHeight = archHeight - FRAME;
  // The scene keeps its proportions, so it is scaled to cover the opening and cropped evenly at the sides.
  const renderWidth = Math.max(sceneWidth, sceneHeight * (NOOK_W / NOOK_H));
  const renderHeight = renderWidth * (NOOK_H / NOOK_W);
  const woodInset = FRAME - HIGHLIGHT;
  const width = frameWidth + SILL_OVERHANG * 2;
  const reducedMotion = useReducedMotion();
  const bubble = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      const fade = reducedMotion ? 0 : 1;
      bubble.set(withSequence(
        withTiming(1, { duration: 200 * fade }),
        withDelay(BUBBLE_MS, withTiming(0, { duration: 400 * fade })),
      ));
      return () => {
        cancelAnimation(bubble);
        bubble.set(0);
      };
    }, [bubble, reducedMotion]),
  );
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: bubble.get() }));
  // The arch and sill in the cloud art's units, which are stretched to fit the screen.
  const unit = CLOUD_ART_W / screenWidth;
  const frameX = ((screenWidth - frameWidth) / 2) * unit;
  const border = FRAME * unit;
  const openingX = frameX + border;
  const sillMiddle = CLOUD_RISE - ALCOVE_SILL_H / 2;
  const clouds = (
    <>
      <Path d={CLOUDS} fill="url(#alcoveClouds)" opacity={0.45} transform="translate(-14 -14)" />
      <Path d={CLOUDS} fill="url(#alcoveClouds)" />
    </>
  );
  const sparkles = [
    { left: -2, top: archHeight * 0.1, size: 20 },
    { left: width - 20, top: archHeight * 0.06, size: 24 },
    { left: -10, top: archHeight * 0.62, size: 13 },
  ];

  return (
    <View style={{ width, alignSelf: 'center' }}>
      {sparkles.map(sparkle => (
        <View key={sparkle.left} pointerEvents="none" style={[styles.sparkle, { left: sparkle.left, top: sparkle.top }]}>
          <Svg width={sparkle.size} height={sparkle.size} viewBox="0 0 24 24">
            <Path d={SPARKLE} fill={sparkleColor} opacity={0.75} />
          </Svg>
        </View>
      ))}
      <View
        style={[
          styles.frame,
          { width: frameWidth, height: archHeight, borderTopLeftRadius: frameWidth / 2, borderTopRightRadius: frameWidth / 2 },
        ]}>
        <View style={[styles.highlight, { borderTopLeftRadius: (frameWidth - woodInset * 2) / 2, borderTopRightRadius: (frameWidth - woodInset * 2) / 2 }]}>
          <View style={[styles.opening, { borderTopLeftRadius: sceneWidth / 2, borderTopRightRadius: sceneWidth / 2 }]}>
            <View style={{ position: 'absolute', bottom: 0, left: (sceneWidth - renderWidth) / 2, width: renderWidth, height: renderHeight }}>
              {children(renderWidth)}
            </View>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg width={sceneWidth} height={sceneHeight}>
                <Defs>
                  <RadialGradient id="alcoveVignette" cx="50%" cy="48%" r="72%">
                    <Stop offset="0.5" stopColor="#000" stopOpacity={0} />
                    <Stop offset="1" stopColor="#000" stopOpacity={0.5} />
                  </RadialGradient>
                </Defs>
                <Rect width={sceneWidth} height={sceneHeight} fill="url(#alcoveVignette)" />
              </Svg>
            </View>
            <View
              pointerEvents="none"
              style={[styles.recess, { borderTopLeftRadius: sceneWidth / 2, borderTopRightRadius: sceneWidth / 2 }]}
            />
          </View>
        </View>
        <View pointerEvents="none" style={[styles.medallion, { left: frameWidth / 2 - MEDALLION / 2 }]}>
          <Svg width={MEDALLION} height={MEDALLION} viewBox="0 0 36 36">
            <Circle cx={18} cy={18} r={16.5} fill="#2A1C12" stroke="#C9A06A" strokeWidth={2} />
            <Path d="M18 9 V27 M12 15 H24" stroke="#F2C462" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </View>
      </View>
      <View style={styles.sill} />

      <Animated.View pointerEvents="none" style={[styles.bubble, { top: archHeight * 0.17 }, bubbleStyle]}>
        <Text style={styles.bubbleText}>{greeting}</Text>
        <Svg width={16} height={9} style={styles.bubbleTail}>
          <Path d="M0 0 H16 L8 9 Z" fill="#F2E9D8" />
        </Svg>
      </Animated.View>

      <View pointerEvents="none" style={[styles.clouds, { left: (width - screenWidth) / 2, top: archHeight + ALCOVE_SILL_H - CLOUD_RISE }]}>
        <Svg width={screenWidth} height={CLOUD_H} viewBox={`0 0 ${CLOUD_ART_W} ${CLOUD_H}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="alcoveClouds" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={cloudColor} />
              <Stop offset="0.55" stopColor={cloudColor} />
              <Stop offset="1" stopColor={cloudColor} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="alcoveFadeLeft" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#000" stopOpacity={1 - CLOUD_EDGE} />
              <Stop offset="1" stopColor="#000" stopOpacity={1 - CLOUD_VEIL} />
            </LinearGradient>
            <LinearGradient id="alcoveFadeRight" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="0" stopColor="#000" stopOpacity={1 - CLOUD_EDGE} />
              <Stop offset="1" stopColor="#000" stopOpacity={1 - CLOUD_VEIL} />
            </LinearGradient>
            <LinearGradient id="alcoveFadeDown" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity={1 - CLOUD_VEIL} />
              <Stop offset="1" stopColor="#000" stopOpacity={1 - CLOUD_EDGE} />
            </LinearGradient>
            {/* White keeps the clouds solid; black thins them out over the nook. */}
            <Mask id="alcoveCloudFade" maskUnits="userSpaceOnUse" x={0} y={0} width={CLOUD_ART_W} height={CLOUD_H}>
              <Rect width={CLOUD_ART_W} height={CLOUD_H} fill="#fff" />
              <Rect x={openingX} width={CLOUD_ART_W - openingX * 2} height={sillMiddle} fill="#000" fillOpacity={1 - CLOUD_VEIL} />
              <Rect x={frameX} width={border} height={sillMiddle} fill="url(#alcoveFadeLeft)" />
              <Rect x={CLOUD_ART_W - openingX} width={border} height={sillMiddle} fill="url(#alcoveFadeRight)" />
              <Rect x={frameX} y={sillMiddle} width={CLOUD_ART_W - frameX * 2} height={CLOUD_RISE - sillMiddle} fill="url(#alcoveFadeDown)" />
            </Mask>
          </Defs>
          <G mask="url(#alcoveCloudFade)">{clouds}</G>
        </Svg>
      </View>

      <View pointerEvents="none" style={[styles.candles, { left: width * 0.24, top: archHeight + 2 - CANDLES_H }]}>
        <Candles />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    paddingTop: FRAME - HIGHLIGHT,
    paddingHorizontal: FRAME - HIGHLIGHT,
    backgroundColor: WALNUT,
    boxShadow: '0px 6px 14px rgba(0, 0, 0, 0.18)',
  },
  highlight: { flex: 1, paddingTop: HIGHLIGHT, paddingHorizontal: HIGHLIGHT, backgroundColor: FRAME_HIGHLIGHT },
  opening: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
  recess: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderColor: 'rgba(0, 0, 0, 0.35)',
  },
  medallion: { position: 'absolute', top: -MEDALLION_RISE },
  sill: { height: ALCOVE_SILL_H, borderTopWidth: 4, borderTopColor: FRAME_HIGHLIGHT, backgroundColor: WALNUT },
  bubble: { position: 'absolute', right: 4, maxWidth: 156, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F2E9D8' },
  bubbleText: { fontFamily: FONTS.display, fontSize: 13, lineHeight: 18, color: '#1A2230' },
  bubbleTail: { position: 'absolute', left: 18, bottom: -8 },
  clouds: { position: 'absolute' },
  candles: { position: 'absolute' },
  sparkle: { position: 'absolute' },
});
