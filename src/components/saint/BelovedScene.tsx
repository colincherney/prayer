import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Image, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { heartPath } from '@/components/winter/winterUi';

import { DriftLayer, Flake, SnowFall, Star, Twinkles } from './SceneParticles';

// The Beloved: a rose garden by day around a marble temple, where The Beloved stands faintly between the columns.
// From the beloved design pack (sheet #FFF8F5, wine #4A2232, rose #C2546F, blush #E8879B, gold #C9A35A). The only
// light event room. The player's own companion stands on a marble column at the same spot as the other seasonal rooms
// (390x844 artboard, feet at 290, 318).
//
// Built like the other event scenes: the sky and the garden are still SVGs drawn once, and everything that moves (the
// drifting haze, the sparkles, the falling petals) is a plain view moved natively, so nothing redraws them.

const BELOVED = require('../../../assets/images/beloved/beloved-3-the-beloved.png');

const W = 390;
const H = 844;
const SPARKLES: Star[] = [
  [30, 60, 1.6, 0], [110, 120, 1.2, 0.35], [180, 40, 1.4, 0.7], [250, 96, 1.2, 0.1], [330, 50, 1.6, 0.45],
  [366, 170, 1.2, 0.8], [60, 210, 1.3, 0.2], [210, 190, 1.1, 0.55],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);
const PETALS: Flake[] = [
  [14, 3.2, 0], [64, 2.6, 0.14], [118, 3, 0.29], [170, 2.6, 0.43], [222, 3.2, 0.57], [276, 2.6, 0.71], [330, 3, 0.86], [372, 2.6, 0.5],
].map(([x, r, phase]) => [x / W, r, phase] as Flake);
// roses glowing a little in the hedges
const ROSE_GLINTS: Star[] = [
  [40, 560, 2, 0.1], [130, 600, 1.8, 0.5], [230, 575, 2, 0.85], [340, 610, 1.8, 0.3], [90, 690, 1.8, 0.65], [300, 700, 2, 0.2],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);

const Sky = React.memo(function Sky() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="bsSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F2C2CE" />
          <Stop offset="0.35" stopColor="#F7D6DD" />
          <Stop offset="0.6" stopColor="#FBE6E6" />
          <Stop offset="1" stopColor="#FFF4EF" />
        </LinearGradient>
        <RadialGradient id="bsSun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#bsSky)" />
      <Circle cx={160} cy={380} r={190} fill="url(#bsSun)" />
      {[[48, 150, 9, '#E8879B'], [342, 120, 7, '#FFFFFF'], [300, 250, 6, '#E8879B'], [84, 290, 6, '#FFFFFF'], [200, 110, 5, '#F4B6C4']].map(([x, y, s, c], i) => (
        <Path key={i} d={heartPath(x as number, y as number, s as number)} fill={c as string} opacity={0.7} />
      ))}
    </Svg>
  );
});

const Haze = React.memo(function Haze({ y, opacity }: { y: number; opacity: number }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Path d={`M-40 ${y} C60 ${y - 22} 160 ${y + 14} 250 ${y - 8} C320 ${y - 26} 370 ${y} 430 ${y - 14} L430 ${y + 30} C350 ${y + 44} 260 ${y + 20} 170 ${y + 38} C90 ${y + 52} 20 ${y + 26} -40 ${y + 42} Z`} fill="#FFFFFF" opacity={opacity} />
    </Svg>
  );
});

/** A round rose bush with a few roses. */
function Bush({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#8FA872" />
      <Circle cx={x - r * 0.45} cy={y + r * 0.2} r={r * 0.7} fill="#7E9A64" />
      {[[-0.4, -0.3], [0.35, -0.45], [0.1, 0.25], [-0.6, 0.35], [0.6, 0.2]].map(([dx, dy], i) => (
        <G key={i}>
          <Circle cx={x + dx * r} cy={y + dy * r} r={r * 0.2} fill="#E07C93" />
          <Circle cx={x + dx * r} cy={y + dy * r} r={r * 0.09} fill="#C2546F" />
        </G>
      ))}
    </G>
  );
}

const Garden = React.memo(function Garden() {
  const cols = [70, 128, 186, 244, 302];
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      {/* the marble temple, faint, with The Beloved between its columns */}
      <G opacity={0.8}>
        <Polygon points="30,250 186,176 342,250" fill="#F2E7DF" />
        <Polygon points="58,244 186,186 314,244" fill="#EDE0D6" />
        <Rect x={24} y={250} width={324} height={18} fill="#EBDDD2" />
        {cols.map(x => (
          <G key={x}>
            <Rect x={x - 12} y={268} width={24} height={232} fill="#F4EBE4" />
            <Rect x={x - 4} y={272} width={2} height={224} fill="#E3D4C8" />
            <Rect x={x + 3} y={272} width={2} height={224} fill="#E3D4C8" />
            <Rect x={x - 16} y={268} width={32} height={8} fill="#EBDDD2" />
          </G>
        ))}
      </G>
      <Image href={BELOVED} x={96} y={300} width={180} height={229} opacity={0.4} preserveAspectRatio="xMidYMax meet" />

      {/* the garden floor and the hedges */}
      <Path d="M0 500 L390 500 L390 844 L0 844 Z" fill="#E9E0CF" />
      <Path d="M0 520 Q60 494 120 514 Q170 494 220 516 Q270 494 320 514 Q360 498 390 508 L390 600 L0 600 Z" fill="#8FA872" />
      <Bush x={30} y={540} r={36} />
      <Bush x={120} y={556} r={30} />
      <Bush x={212} y={546} r={34} />
      <Bush x={360} y={548} r={38} />
      {/* the path through the roses */}
      <Path d="M150 844 Q170 700 186 600 L200 600 Q216 700 250 844 Z" fill="#F4EDE2" />
      <Path d="M0 640 Q90 620 150 640 L150 844 L0 844 Z" fill="#7E9A64" />
      <Path d="M250 640 Q320 620 390 636 L390 844 L250 844 Z" fill="#7E9A64" />
      <Bush x={40} y={680} r={40} />
      <Bush x={118} y={720} r={32} />
      <Bush x={300} y={690} r={40} />
      <Bush x={370} y={740} r={30} />
      <Path d="M0 790 Q100 770 190 790 Q290 770 390 784 L390 844 L0 844 Z" fill="#6E8A56" />

      {/* the marble column the companion stands on, roses climbing it */}
      <Ellipse cx={290} cy={604} rx={44} ry={6} fill="#000" opacity={0.12} />
      <Rect x={262} y={330} width={56} height={272} fill="#F7F0EA" />
      <Rect x={272} y={334} width={3} height={264} fill="#E6D8CC" />
      <Rect x={286} y={334} width={3} height={264} fill="#E6D8CC" />
      <Rect x={300} y={334} width={3} height={264} fill="#E6D8CC" />
      <Rect x={252} y={318} width={76} height={14} rx={3} fill="#EFE5DC" />
      <Rect x={256} y={330} width={68} height={6} fill="#E3D6CA" />
      <Path d="M266 600 Q280 560 270 520 Q262 480 280 440 Q292 410 284 380" stroke="#7E9A64" strokeWidth={3} fill="none" strokeLinecap="round" />
      {[[270, 520], [279, 446], [266, 572], [286, 392]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={6} fill="#E07C93" />
          <Circle cx={x} cy={y} r={2.6} fill="#C2546F" />
        </G>
      ))}
    </Svg>
  );
});

export const BelovedScene: React.FC = () => (
  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
    <Sky />
    <Twinkles stars={SPARKLES} duration={3200} color="#FFFFFF" />
    <View style={StyleSheet.absoluteFill}>
      <DriftLayer reach={20} duration={30000} breathe={[0.4, 0.9]}>
        <Haze y={210} opacity={0.35} />
      </DriftLayer>
    </View>
    <View style={StyleSheet.absoluteFill}>
      <Garden />
    </View>
    <Twinkles stars={ROSE_GLINTS} duration={2600} color="#FFE3EA" />
    <SnowFall flakes={PETALS} duration={12000} color="#E8879B" petal />
  </View>
);
