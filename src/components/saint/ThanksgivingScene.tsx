import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Fx } from '@/components/pets/Fx';

// Give Thanks — a golden harvest evening: a low sun over rolling fields and a distant chapel, wheat swaying, birds
// heading south and leaves drifting down. Ported from the "Home · Thanksgiving" design (390x844 artboard), without
// its mascot: the player's own companion sits on the hay bale instead.

function Wheat({ stalks, heads, delay }: { stalks: string; heads: [number, number][]; delay: number }) {
  // each bunch sways about the bottom of its stalks
  const xs = heads.map(h => h[0]);
  const ox = (Math.min(...xs) + Math.max(...xs)) / 2;
  return (
    <Fx kind="sheaf" delay={delay} ox={ox} oy={790}>
      <Path d={stalks} stroke="#C9A24B" strokeWidth={2.4} strokeLinecap="round" />
      <G fill="#E8C462">
        {heads.map(([x, y]) => (
          <Ellipse key={`${x}-${y}`} cx={x} cy={y} rx={3.5} ry={8} />
        ))}
      </G>
    </Fx>
  );
}

export const ThanksgivingScene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="tsky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F3DDB2" />
          <Stop offset="0.42" stopColor="#EEC08E" />
          <Stop offset="0.6" stopColor="#E39A66" />
          <Stop offset="1" stopColor="#7A4428" />
        </LinearGradient>
        <RadialGradient id="tsun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FBE3A6" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FBE3A6" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#tsky)" />
      <Fx kind="glowMoon">
        <Circle cx={200} cy={470} r={180} fill="url(#tsun)" />
      </Fx>
      <Circle cx={200} cy={470} r={60} fill="#FBE3A6" />

      {/* a skein of birds flying south */}
      <G transform="translate(0 196)">
        <Fx kind="birdsT">
          <G stroke="#6E4630" strokeWidth={2} fill="none" strokeLinecap="round">
            <Path d="M0 0 Q5 -6 10 0 Q15 -6 20 0" />
            <Path d="M18 -12 Q23 -18 28 -12 Q33 -18 38 -12" />
            <Path d="M18 12 Q23 6 28 12 Q33 6 38 12" />
            <Path d="M36 -24 Q41 -30 46 -24 Q51 -30 56 -24" />
            <Path d="M36 24 Q41 18 46 24 Q51 18 56 24" />
          </G>
        </Fx>
      </G>

      {/* far hill and the chapel */}
      <Path d="M0 480 C80 446 160 466 240 452 C310 440 350 458 390 450 L390 844 L0 844 Z" fill="#C9784A" />
      <G fill="#A85A3A">
        <Rect x={306} y={428} width={34} height={26} />
        <Polygon points="303,429 323,412 343,429" />
        <Rect x={318} y={394} width={10} height={22} />
        <Polygon points="317,395 323,378 329,395" />
      </G>
      <Path d="M323 364 L323 378 M318 369 L328 369" stroke="#A85A3A" strokeWidth={2.4} strokeLinecap="round" />
      <Fx kind="candle">
        <Rect x={320} y={435} width={6} height={10} rx={3} fill="#FBE3A6" />
      </Fx>

      {/* fields */}
      <Path d="M0 560 C100 520 190 548 270 528 C330 514 365 528 390 522 L390 844 L0 844 Z" fill="#A85F38" />
      <Path d="M0 620 C120 596 260 606 390 592 L390 844 L0 844 Z" fill="#8A4E2E" />
      <Path d="M0 650 C120 630 260 638 390 626 M0 678 C120 660 260 668 390 656" stroke="#7A4428" strokeWidth={2} fill="none" />
      <Path d="M0 700 C120 684 260 694 390 682 L390 844 L0 844 Z" fill="#6E3E24" />

      <Wheat stalks="M14 780 L18 712 M24 780 L26 708 M34 780 L32 714" heads={[[18, 706], [26, 702], [32, 708]]} delay={0} />
      <Wheat stalks="M48 790 L50 726 M58 790 L62 722" heads={[[50, 720], [62, 716]]} delay={1100} />
      <Wheat stalks="M352 790 L350 720 M362 790 L364 716 M372 790 L376 722" heads={[[350, 714], [364, 710], [376, 716]]} delay={2200} />

      {/* the hay bale the companion sits on, a pumpkin and a cornucopia */}
      <Ellipse cx={290} cy={360} rx={70} ry={7} fill="#000" opacity={0.2} />
      <Rect x={236} y={318} width={108} height={38} rx={8} fill="#D9B25A" />
      <Path d="M240 330 L340 330 M240 344 L340 344 M262 318 L262 356 M318 318 L318 356" stroke="#B8903A" strokeWidth={2} />
      <Path d="M244 318 L248 312 M270 318 L268 311 M300 318 L304 312 M330 318 L328 311" stroke="#E8C462" strokeWidth={2} strokeLinecap="round" />
      <G transform="translate(352 346)">
        <Ellipse cx={-8} cy={0} rx={10} ry={12} fill="#C9672A" />
        <Ellipse cx={8} cy={0} rx={10} ry={12} fill="#C9672A" />
        <Ellipse cx={0} cy={0} rx={11} ry={13} fill="#E07E34" />
        <Rect x={-2} y={-17} width={4} height={6} fill="#4A2E1A" />
      </G>
      <G transform="translate(222 350)">
        <Path d="M-14 6 C-12 -10 6 -14 16 -4 C8 -8 -2 -6 -4 8 Z" fill="#C9A06A" stroke="#8A6A45" strokeWidth={1} />
        <Circle cx={-12} cy={4} r={4} fill="#C9433A" />
        <Circle cx={-18} cy={6} r={2.6} fill="#7A4E8A" />
        <Circle cx={-16} cy={2} r={2.6} fill="#7A4E8A" />
      </G>

      {/* a butterfly */}
      <G transform="translate(236 252)">
        <Fx kind="flutterH">
          <Fx kind="wingBeat" ox={6} oy={0}>
            <Ellipse cx={0} cy={0} rx={4.5} ry={6} fill="#8FC6A9" />
            <Ellipse cx={9} cy={0} rx={4.5} ry={6} fill="#9C84E8" />
          </Fx>
        </Fx>
      </G>

      {/* leaves drifting down */}
      <G>
        <Fx kind="leafFallH" ox={50} oy={-10}>
          <Ellipse cx={50} cy={-10} rx={6} ry={3.5} fill="#C9433A" />
        </Fx>
        <Fx kind="leafFallH" delay={2200} ox={170} oy={-10}>
          <Ellipse cx={170} cy={-10} rx={6} ry={3.5} fill="#E8913A" />
        </Fx>
        <Fx kind="leafFallH" delay={4400} ox={290} oy={-10}>
          <Ellipse cx={290} cy={-10} rx={6} ry={3.5} fill="#B8864A" />
        </Fx>
        <Fx kind="leafFallH" delay={6600} ox={370} oy={-10}>
          <Ellipse cx={370} cy={-10} rx={5} ry={3} fill="#C9433A" />
        </Fx>
      </G>
    </Svg>
  </View>
);
