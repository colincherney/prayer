import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Image, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { DriftLayer, Star, Twinkles } from './SceneParticles';

// The Swamp King: a fen at dusk, where the Old King rises faintly out of the mire behind the hills. From the
// swamp-king design pack (dusk violet sky, gold #C9A35A, wisp blue #6FC3FF). The player's own companion stands on the
// mossy stump at the same spot as the other seasonal rooms (390x844 artboard, feet at 290, 318).
//
// Built like the winter scene: the sky and the land are still SVGs drawn once, and everything that moves (the mist,
// the stars, the wisps over the water, the fireflies) is a plain view moved natively, so nothing ever redraws them.

const OLD_KING = require('../../../assets/images/swamp-king/vesper-3-old-king.png');

const W = 390;
const H = 844;
const STARS: Star[] = [
  [30, 40, 1.2, 0], [96, 90, 1, 0.35], [160, 28, 1.3, 0.7], [214, 76, 1, 0.1], [268, 30, 1.2, 0.45],
  [336, 60, 1.3, 0.8], [372, 140, 1, 0.2], [20, 170, 1.1, 0.55], [130, 190, 1, 0.9], [350, 230, 1.1, 0.3],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);
// will-o'-the-wisps drifting over the water
const WISPS: Star[] = [
  [60, 520, 2.6, 0], [150, 545, 2.2, 0.4], [230, 515, 2.8, 0.75], [330, 560, 2.2, 0.2], [100, 600, 2, 0.6],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);
// fireflies in the reeds
const FIREFLIES: Star[] = [
  [40, 640, 1.8, 0.1], [120, 680, 1.6, 0.5], [210, 650, 1.8, 0.85], [300, 700, 1.6, 0.3], [360, 660, 1.8, 0.65],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);

/** A bare, crooked swamp tree. */
function DeadTree({ x, base, h, flip = 1 }: { x: number; base: number; h: number; flip?: number }) {
  const top = base - h;
  return (
    <Path
      d={`M${x} ${base} L${x} ${top} M${x} ${base - h * 0.55} L${x - 22 * flip} ${base - h * 0.85} M${x} ${base - h * 0.7} L${x + 18 * flip} ${base - h * 0.95}`}
      stroke="#141820"
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
  );
}

/** A clump of reeds. */
function Reeds({ x, base }: { x: number; base: number }) {
  return (
    <Path
      d={`M${x} ${base} q-2 -22 -6 -34 M${x + 5} ${base} q1 -28 4 -40 M${x + 10} ${base} q3 -18 9 -28`}
      stroke="#2E3A2C"
      strokeWidth={2.5}
      strokeLinecap="round"
      fill="none"
    />
  );
}

const Sky = React.memo(function Sky() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="skSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1E2033" />
          <Stop offset="0.38" stopColor="#3A3350" />
          <Stop offset="0.58" stopColor="#6A5260" />
          <Stop offset="0.7" stopColor="#8A6A5E" />
          <Stop offset="1" stopColor="#2A3040" />
        </LinearGradient>
        <RadialGradient id="skSun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#E8B97A" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#E8B97A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#skSky)" />
      <Circle cx={200} cy={440} r={150} fill="url(#skSun)" />
    </Svg>
  );
});

const Mist = React.memo(function Mist({ y, opacity }: { y: number; opacity: number }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Path d={`M-40 ${y} C60 ${y - 26} 160 ${y + 16} 250 ${y - 10} C320 ${y - 30} 370 ${y} 430 ${y - 16} L430 ${y + 34} C350 ${y + 50} 260 ${y + 24} 170 ${y + 44} C90 ${y + 60} 20 ${y + 30} -40 ${y + 48} Z`} fill="#C9B8D8" opacity={opacity} />
    </Svg>
  );
});

const Land = React.memo(function Land() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      {/* the Old King rising out of the mire, faint, behind the hills */}
      <Image href={OLD_KING} x={-14} y={236} width={200} height={254} opacity={0.32} preserveAspectRatio="xMidYMax meet" />

      {/* hills */}
      <Polygon points="-30,500 80,380 200,500" fill="#3B3348" />
      <Polygon points="180,500 300,360 430,500" fill="#3B3348" />
      <Polygon points="90,500 200,430 310,500" fill="#2E2A3C" />
      <DeadTree x={92} base={470} h={120} />
      <DeadTree x={330} base={480} h={90} flip={-1} />

      {/* the mire: still water with lily pads */}
      <Rect y={492} width={W} height={90} fill="#2A3644" />
      <Rect y={492} width={W} height={4} fill="#8A7A7E" opacity={0.45} />
      <Ellipse cx={70} cy={540} rx={18} ry={5} fill="#3E6B4A" />
      <Ellipse cx={210} cy={560} rx={14} ry={4} fill="#3E6B4A" />
      <Circle cx={214} cy={557} r={3} fill="#F2B6C6" />
      <Ellipse cx={320} cy={530} rx={16} ry={4.5} fill="#3E6B4A" />

      {/* banks and reeds */}
      <Path d="M0 580 C100 560 190 586 270 568 C330 556 365 566 390 560 L390 844 L0 844 Z" fill="#2E3A2C" />
      <Path d="M0 690 C120 672 260 684 390 670 L390 844 L0 844 Z" fill="#253024" />
      <Path d="M0 760 C140 742 250 754 390 740 L390 844 L0 844 Z" fill="#1C251C" />
      <Reeds x={18} base={584} />
      <Reeds x={150} base={578} />
      <Reeds x={360} base={566} />

      {/* the mossy stump the companion stands on, with a little lantern */}
      <Ellipse cx={290} cy={358} rx={62} ry={7} fill="#000" opacity={0.3} />
      <Rect x={252} y={318} width={76} height={38} rx={4} fill="#4A3A2C" />
      <Path d="M264 326 L264 352 M282 324 L282 354 M302 326 L302 352 M318 324 L318 354" stroke="#36291F" strokeWidth={2} />
      <Ellipse cx={290} cy={318} rx={38} ry={8} fill="#6A5440" />
      <Path d="M252 318 Q258 306 290 307 Q322 306 328 318 Q324 325 316 320 Q308 328 298 321 Q286 327 276 321 Q266 327 258 321 Z" fill="#5E8A4E" />
      <G>
        <Rect x={338} y={330} width={14} height={20} rx={3} fill="#2A2A32" />
        <Circle cx={345} cy={340} r={5} fill="#6FC3FF" opacity={0.85} />
      </G>
    </Svg>
  );
});

export const SwampKingScene: React.FC = () => (
  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
    <Sky />
    <Twinkles stars={STARS} />
    <View style={StyleSheet.absoluteFill}>
      <DriftLayer reach={22} duration={30000} breathe={[0.5, 1]}>
        <Mist y={300} opacity={0.18} />
      </DriftLayer>
    </View>
    <View style={StyleSheet.absoluteFill}>
      <Land />
    </View>
    <View style={StyleSheet.absoluteFill}>
      <DriftLayer reach={-18} duration={24000} breathe={[0.4, 0.9]}>
        <Mist y={500} opacity={0.2} />
      </DriftLayer>
    </View>
    <Twinkles stars={WISPS} duration={3400} color="#6FC3FF" />
    <Twinkles stars={FIREFLIES} duration={2200} color="#F2D27A" />
  </View>
);
