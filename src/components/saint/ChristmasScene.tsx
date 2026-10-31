import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Fx } from '@/components/pets/Fx';

// God With Us — a snowy Christmas night: the star over a little chapel, its beam falling on the hill, snow-dusted
// pines and snow falling. Ported from the "Home · Christmas" design (390x844 artboard), without its mascot: the
// player's own companion sits on the snowy stump instead.

const STARS: [number, number, number, number][] = [
  [30, 40, 1.3, 0],
  [96, 118, 1.1, 900],
  [170, 50, 1.4, 1800],
  [214, 104, 1, 0],
  [360, 260, 1.3, 900],
  [20, 260, 1.1, 1800],
  [250, 300, 1.2, 0],
  [130, 350, 1, 1800],
  [236, 36, 1, 900],
  [64, 200, 1.1, 0],
];

// x, radius, delay (ms): two rows of flakes, a new one every 1.25 s
const SNOW: [number, number, number][] = [
  [20, 2.2, 0],
  [70, 1.8, 1250],
  [120, 2.4, 2500],
  [170, 1.8, 3750],
  [220, 2.2, 5000],
  [270, 1.8, 6250],
  [320, 2.4, 7500],
  [370, 2, 8750],
  [46, 1.6, 2500],
  [146, 1.6, 6250],
  [246, 1.6, 0],
  [346, 1.6, 8750],
];

function Pine({ x, top, color, big }: { x: number; top: number; color: string; big?: boolean }) {
  const w = big ? 28 : 20;
  const lower = big ? 34 : 24;
  return (
    <>
      <Polygon points={`${x},${top} ${x - w},${top + (big ? 52 : 38)} ${x + w},${top + (big ? 52 : 38)}`} fill={color} />
      <Polygon points={`${x},${top + (big ? 20 : 16)} ${x - lower},${top + (big ? 84 : 62)} ${x + lower},${top + (big ? 84 : 62)}`} fill={color} />
      <Rect x={x - 4} y={top + (big ? 84 : 62)} width={8} height={big ? 14 : 10} fill="#4A3426" />
      <Polygon points={`${x},${top} ${x - (big ? 8 : 6)},${top + (big ? 16 : 12)} ${x + (big ? 8 : 6)},${top + (big ? 16 : 12)}`} fill="#F2F5FA" />
      {big ? <Path d={`M${x - 24} ${top + 50} Q${x - 12} ${top + 44} ${x} ${top + 50} Q${x + 12} ${top + 44} ${x + 26} ${top + 50}`} stroke="#F2F5FA" strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
    </>
  );
}

export const ChristmasScene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1530" />
          <Stop offset="0.48" stopColor="#18284A" />
          <Stop offset="0.68" stopColor="#2B3F68" />
          <Stop offset="1" stopColor="#33486F" />
        </LinearGradient>
        <RadialGradient id="cstar" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F7DFA0" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#F7DFA0" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#csky)" />
      <G fill="#F2E9D8">
        {STARS.map(([x, y, r, d]) => (
          <Fx key={`${x}-${y}`} kind="twinkleSoft" delay={d}>
            <Circle cx={x} cy={y} r={r} />
          </Fx>
        ))}
      </G>

      {/* the star of Bethlehem and its beam */}
      <Fx kind="beam">
        <Polygon points="302,150 318,150 346,470 276,470" fill="#F2C462" />
      </Fx>
      <Fx kind="glowC">
        <Circle cx={310} cy={130} r={110} fill="url(#cstar)" />
      </Fx>
      <Fx kind="spin" ox={310} oy={130}>
        <Path
          d="M336 130 L362 130 M328.4 148.4 L346.8 166.8 M310 156 L310 182 M291.6 148.4 L273.2 166.8 M284 130 L258 130 M291.6 111.6 L273.2 93.2 M310 104 L310 78 M328.4 111.6 L346.8 93.2"
          stroke="#F7DFA0"
          strokeOpacity={0.4}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Fx>
      <Fx kind="starPulse" ox={310} oy={130}>
        <Path d="M310 104 L316 124 L336 130 L316 136 L310 156 L304 136 L284 130 L304 124 Z" fill="#FFF0C2" />
      </Fx>

      {/* far hill and the chapel with its wreath */}
      <Path d="M0 480 C80 450 170 466 240 456 C310 446 350 462 390 452 L390 844 L0 844 Z" fill="#8EA6C8" />
      <Rect x={292} y={430} width={36} height={28} fill="#5A6A8A" />
      <Polygon points="288,432 310,412 332,432" fill="#F2F5FA" />
      <Rect x={305} y={396} width={10} height={20} fill="#5A6A8A" />
      <Polygon points="303,398 310,380 317,398" fill="#F2F5FA" />
      <Path d="M310 364 L310 380 M305 369 L315 369" stroke="#F2C462" strokeWidth={2.4} strokeLinecap="round" />
      <Fx kind="candle">
        <Rect x={297} y={438} width={6} height={10} rx={3} fill="#F2C462" />
      </Fx>
      <Fx kind="candle" delay={500}>
        <Rect x={317} y={438} width={6} height={10} rx={3} fill="#F2C462" />
      </Fx>
      <Circle cx={310} cy={452} r={4} fill="none" stroke="#2F6B4A" strokeWidth={2} />
      <Circle cx={310} cy={456} r={1.4} fill="#C9433A" />

      {/* snowy hills and pines */}
      <Path d="M0 560 C100 524 190 548 270 530 C330 516 365 528 390 522 L390 844 L0 844 Z" fill="#C9D7EA" />
      <Pine x={40} top={516} color="#1E3A3A" big />
      <Pine x={84} top={560} color="#244242" />
      <Pine x={352} top={520} color="#1E3A3A" big />
      <Path d="M0 690 C120 672 260 684 390 670 L390 844 L0 844 Z" fill="#E8EEF7" />
      <Path d="M0 740 C140 722 250 734 390 720 L390 844 L0 844 Z" fill="#DCE5F1" />

      {/* the snowy stump the companion sits on, and a gift */}
      <Ellipse cx={290} cy={358} rx={62} ry={7} fill="#000" opacity={0.3} />
      <Rect x={252} y={318} width={76} height={38} rx={4} fill="#6B4A2A" />
      <Path d="M264 326 L264 352 M282 324 L282 354 M302 326 L302 352 M318 324 L318 354" stroke="#4A3426" strokeWidth={2} />
      <Ellipse cx={290} cy={318} rx={38} ry={8} fill="#8A6A45" />
      <Path d="M252 318 Q258 306 290 307 Q322 306 328 318 Q324 325 316 320 Q308 328 298 321 Q286 327 276 321 Q266 327 258 321 Z" fill="#F2F5FA" />
      <Rect x={334} y={336} width={22} height={18} rx={2} fill="#C9433A" />
      <Path d="M345 336 L345 354 M334 345 L356 345" stroke="#F2C462" strokeWidth={3} />
      <Path d="M345 336 Q338 328 341 334 M345 336 Q352 328 349 334" stroke="#F2C462" strokeWidth={2} fill="none" />

      {/* falling snow */}
      <G fill="#FFFFFF">
        {SNOW.map(([x, r, d]) => (
          <Fx key={`${x}-${d}`} kind="snowC" delay={d}>
            <Circle cx={x} cy={-10} r={r} />
          </Fx>
        ))}
      </G>
    </Svg>
  </View>
);
