import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Image, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { DriftLayer, Flake, SnowFall, Star, Twinkles } from './SceneParticles';

// The Long Winter: an arctic night under the aurora, where the Frost Lord rises over the mountains. Built from the
// winter-lord design pack (navy #0B1230 to #2C4A7A, aurora teal #5FE3C0, gold #E9C46A). The player's own companion
// stands on the ice rock at the same spot as the other seasonal rooms (390x844 artboard, feet at 290, 318).
//
// Built for speed: the sky and the land are two still SVGs that are drawn once. Everything that moves (the aurora
// drifting, the stars, the snow) is a plain view moved natively, so nothing ever makes the illustration redraw.

const FROST_LORD = require('../../../assets/images/winter-lord/frost-3-lord.png');

const W = 390;
const H = 844;
const STARS: Star[] = [
  [24, 34, 1.3, 0], [88, 96, 1.1, 0.35], [150, 30, 1.4, 0.7], [206, 84, 1, 0.1], [262, 22, 1.2, 0.45],
  [330, 64, 1.4, 0.8], [372, 138, 1, 0.2], [18, 180, 1.1, 0.55], [120, 210, 1, 0.9], [352, 250, 1.2, 0.3],
  [60, 300, 1, 0.65], [236, 150, 1.1, 0.15],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);
const SNOW: Flake[] = [
  [16, 2.2, 0], [64, 1.8, 0.125], [116, 2.4, 0.25], [166, 1.8, 0.375], [214, 2.2, 0.5], [262, 1.8, 0.625],
  [314, 2.4, 0.75], [366, 2, 0.875], [40, 1.6, 0.25], [140, 1.6, 0.625], [240, 1.6, 0], [340, 1.6, 0.875],
].map(([x, r, phase]) => [x / W, r, phase] as Flake);

/** A six-armed snowflake centred on (x, y). */
function Flake6({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) {
  const arms = [0, 60, 120].map(a => {
    const rad = (a * Math.PI) / 180;
    const dx = Math.cos(rad) * r;
    const dy = Math.sin(rad) * r;
    return `M${x - dx} ${y - dy} L${x + dx} ${y + dy}`;
  });
  return <Path d={arms.join(' ')} stroke="#DCEBFA" strokeOpacity={opacity} strokeWidth={1.6} strokeLinecap="round" />;
}

const Sky = React.memo(function Sky() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="wsky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1230" />
          <Stop offset="0.45" stopColor="#18285A" />
          <Stop offset="0.66" stopColor="#2C4A7A" />
          <Stop offset="1" stopColor="#3A5A88" />
        </LinearGradient>
        <RadialGradient id="wglow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#5FE3C0" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#5FE3C0" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#wsky)" />
      <Circle cx={90} cy={170} r={130} fill="url(#wglow)" />
    </Svg>
  );
});

/** One aurora ribbon on its own still SVG, so the whole ribbon can drift as a view. */
const Ribbon = React.memo(function Ribbon({ d, color, id, peak }: { d: string; color: string; id: string; peak: number }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.5" stopColor={color} stopOpacity={peak} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill={`url(#${id})`} />
    </Svg>
  );
});

const Land = React.memo(function Land() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="wfade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#18285A" stopOpacity={0} />
          <Stop offset="1" stopColor="#2C4A7A" stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Flake6 x={344} y={186} r={9} opacity={0.55} />
      <Flake6 x={30} y={252} r={7} opacity={0.4} />

      {/* the Winter Lord rising over the mountains, faint as a figure in the storm */}
      {/* (the image is 940x1400 with the full hat; same body size as before, feet on the same line) */}
      <Image href={FROST_LORD} x={-6} y={172} width={203} height={302} opacity={0.38} preserveAspectRatio="xMidYMax meet" />

      {/* mountains with snowcaps */}
      <Polygon points="-30,500 70,350 170,500" fill="#24396A" />
      <Polygon points="70,350 52,377 63,372 70,382 78,372 88,377" fill="#C9D9F0" />
      <Polygon points="230,500 330,330 440,500" fill="#24396A" />
      <Polygon points="330,330 310,364 322,358 330,370 338,358 352,364" fill="#C9D9F0" />
      <Polygon points="100,500 200,404 300,500" fill="#2E4880" />
      <Polygon points="200,404 186,418 196,416 200,424 205,416 214,418" fill="#C9D9F0" />
      <Rect y={440} width={W} height={70} fill="url(#wfade)" />

      {/* snow hills */}
      <Path d="M0 500 C90 470 180 490 260 474 C320 462 360 478 390 470 L390 844 L0 844 Z" fill="#7F9CC6" />
      <Path d="M0 560 C100 528 190 552 270 534 C330 520 365 532 390 526 L390 844 L0 844 Z" fill="#B7CBE6" />
      <Path d="M0 690 C120 672 260 684 390 670 L390 844 L0 844 Z" fill="#DCE7F5" />
      <Path d="M0 740 C140 722 250 734 390 720 L390 844 L0 844 Z" fill="#EAF1FA" />

      {/* the ice rock the companion stands on, with a crystal beside it */}
      <Ellipse cx={290} cy={358} rx={62} ry={7} fill="#000" opacity={0.3} />
      <Path d="M250 356 L256 324 L276 312 L306 312 L324 324 L330 356 Z" fill="#3E5E92" />
      <Path d="M256 324 L276 312 L306 312 L324 324 L306 330 L276 330 Z" fill="#9CC4EA" />
      <Path d="M252 322 Q262 308 290 309 Q318 308 328 322 Q320 328 312 323 Q302 330 292 324 Q280 330 270 324 Q260 329 252 322 Z" fill="#F2F7FD" />
      <Path d="M276 330 L272 354 M306 330 L310 354" stroke="#2C4A7A" strokeWidth={1.6} />
      <G>
        <Polygon points="344,354 336,334 344,306 352,334" fill="#9FDDF8" />
        <Polygon points="344,354 344,306 352,334" fill="#D6F2FF" />
        <Polygon points="356,354 351,340 356,326 361,340" fill="#9FDDF8" opacity={0.8} />
      </G>
      <Circle cx={344} cy={300} r={2.4} fill="#E9C46A" />
    </Svg>
  );
});

export const WinterLordScene: React.FC = () => (
  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
    <Sky />
    <View style={StyleSheet.absoluteFill}>
      <DriftLayer reach={26} duration={28000}>
        <Ribbon id="wauroraA" color="#5FE3C0" peak={0.5}
          d="M-40 150 C40 90 130 170 210 120 C290 70 350 130 430 90 L430 160 C350 200 290 140 210 190 C130 240 40 160 -40 220 Z" />
      </DriftLayer>
      <DriftLayer reach={-24} duration={36000} breathe={[0.6, 1]}>
        <Ribbon id="wauroraB" color="#6E8BFF" peak={0.35}
          d="M-40 230 C60 190 150 250 240 210 C320 175 370 220 430 200 L430 250 C370 270 320 225 240 260 C150 300 60 240 -40 280 Z" />
      </DriftLayer>
    </View>
    <Twinkles stars={STARS} />
    <View style={StyleSheet.absoluteFill}>
      <Land />
    </View>
    <SnowFall flakes={SNOW} duration={10000} />
  </View>
);
