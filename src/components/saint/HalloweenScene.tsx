import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Fx } from '@/components/pets/Fx';

// All Hallows' Eve — a moonlit autumn hillside with a chapel, jack-o'-lanterns, drifting mist, fireflies and
// falling leaves. Ported from the "Home · Halloween" design (390x844 artboard), without its mascot: the player's
// own companion sits on the big pumpkin instead.

const STARS: [number, number, number, number][] = [
  [30, 40, 1.3, 0],
  [96, 118, 1.1, 900],
  [170, 50, 1.4, 1800],
  [214, 104, 1, 0],
  [360, 40, 1.3, 900],
  [356, 250, 1.1, 1800],
  [20, 260, 1.2, 0],
  [250, 290, 1, 1800],
  [130, 350, 1, 900],
  [370, 340, 1.2, 0],
];

/** A stacked-lobe pumpkin centered on (0, 0). `lit` adds a flickering carved face. */
function Pumpkin({ s, lit }: { s: number; lit?: boolean }) {
  return (
    <G scale={s}>
      <Ellipse cx={-10} cy={0} rx={11} ry={13} fill="#C9672A" />
      <Ellipse cx={10} cy={0} rx={11} ry={13} fill="#C9672A" />
      <Ellipse cx={0} cy={0} rx={13} ry={14} fill="#E07E34" />
      <Rect x={-2} y={-18} width={4} height={6} fill="#4A2E1A" />
      {lit ? (
        <Fx kind="candle">
          <Path d="M-8 -4 L-4 -8 L0 -4 Z M8 -4 L4 -8 L0 -4 Z" fill="#FFE08A" />
          <Path d="M-8 5 Q0 11 8 5 Q0 8 -8 5 Z" fill="#FFE08A" />
        </Fx>
      ) : null}
    </G>
  );
}

export const HalloweenScene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#140F2A" />
          <Stop offset="0.45" stopColor="#2B1C44" />
          <Stop offset="0.62" stopColor="#5A2F4A" />
          <Stop offset="1" stopColor="#1A1024" />
        </LinearGradient>
        <RadialGradient id="hmoon" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
          <Stop offset="0" stopColor="#F6E2B0" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#F6E2B0" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect width={390} height={844} fill="url(#hsky)" />

      <G fill="#F2E9D8">
        {STARS.map(([x, y, r, d], i) => (
          <Fx key={i} kind="twinkleSoft" delay={d}>
            <Circle cx={x} cy={y} r={r} />
          </Fx>
        ))}
      </G>

      {/* moon */}
      <Fx kind="glowMoon">
        <Circle cx={300} cy={160} r={120} fill="url(#hmoon)" />
      </Fx>
      <Circle cx={300} cy={160} r={46} fill="#F4E3B5" />
      <G fill="#E3CC92" opacity={0.6}>
        <Circle cx={286} cy={148} r={8} />
        <Circle cx={312} cy={176} r={6} />
        <Circle cx={314} cy={146} r={4} />
      </G>

      {/* birds crossing the sky */}
      <G transform="translate(0 176)">
        <Fx kind="birds">
          <G stroke="#140F2A" strokeWidth={2} fill="none" strokeLinecap="round">
            <Path d="M0 0 Q5 -6 10 0 Q15 -6 20 0" />
            <Path d="M26 -12 Q30 -17 34 -12 Q38 -17 42 -12" />
            <Path d="M18 12 Q22 7 26 12 Q30 7 34 12" />
          </G>
        </Fx>
      </G>

      {/* far hill, chapel and its warm windows */}
      <Path d="M0 470 C80 432 150 452 220 442 C300 430 340 452 390 442 L390 844 L0 844 Z" fill="#2A1B3A" />
      <G fill="#1E1430">
        <Rect x={58} y={430} width={34} height={26} />
        <Polygon points="55,431 75,414 95,431" />
        <Rect x={70} y={396} width={10} height={22} />
        <Polygon points="69,397 75,380 81,397" />
      </G>
      <Path d="M75 366 L75 380 M70 371 L80 371" stroke="#1E1430" strokeWidth={2.4} strokeLinecap="round" />
      <Fx kind="candle">
        <Rect x={72} y={437} width={6} height={10} rx={3} fill="#F2C462" />
      </Fx>
      <Fx kind="candle" delay={400}>
        <Rect x={83} y={437} width={6} height={10} rx={3} fill="#F2C462" />
      </Fx>
      <Fx kind="mist">
        <Ellipse cx={120} cy={500} rx={170} ry={16} fill="#8A6FA6" opacity={0.14} />
      </Fx>

      {/* mid hill */}
      <Path d="M0 560 C90 522 170 542 250 522 C320 506 360 522 390 516 L390 844 L0 844 Z" fill="#22162F" />
      <Fx kind="mistB">
        <Ellipse cx={290} cy={560} rx={190} ry={18} fill="#8A6FA6" opacity={0.12} />
      </Fx>

      {/* bare trees either side */}
      <G stroke="#120C1C" strokeLinecap="round" fill="none">
        <Path d="M18 844 C26 700 14 640 30 560" strokeWidth={16} />
        <Path d="M28 600 C50 580 70 586 90 566 M26 640 C10 620 -4 624 -12 610 M30 580 C40 556 34 540 46 520 M60 588 C68 572 80 570 88 556" strokeWidth={5} />
        <Path d="M372 844 C364 700 376 650 360 576" strokeWidth={16} />
        <Path d="M362 612 C340 594 322 600 304 582 M364 650 C380 630 392 634 400 622 M360 592 C350 568 356 552 346 536" strokeWidth={5} />
      </G>

      {/* foreground */}
      <Path d="M0 700 C120 680 260 690 390 680 L390 844 L0 844 Z" fill="#1A1024" />

      <G fill="#E8873A">
        <Fx kind="firefly">
          <Circle cx={60} cy={470} r={2} />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={200} cy={420} r={2.2} />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={340} cy={480} r={2} />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={120} cy={560} r={1.8} />
        </Fx>
      </G>

      {/* jack-o'-lanterns */}
      <G transform="translate(46 752)">
        <Pumpkin s={1.15} lit />
      </G>
      <G transform="translate(350 766)">
        <Pumpkin s={1} />
      </G>

      {/* the big pumpkin the companion sits on */}
      <G transform="translate(290 342)">
        <Ellipse cx={0} cy={34} rx={58} ry={7} fill="#000" opacity={0.4} />
        <Ellipse cx={-26} cy={4} rx={28} ry={30} fill="#C9672A" />
        <Ellipse cx={26} cy={4} rx={28} ry={30} fill="#C9672A" />
        <Ellipse cx={0} cy={4} rx={32} ry={32} fill="#E07E34" />
        <Path d="M0 -28 Q-7 4 0 36 M0 -28 Q7 4 0 36" stroke="#B5582A" strokeWidth={2} fill="none" opacity={0.5} />
        <Fx kind="candle">
          <Path d="M-14 6 L-8 0 L-2 6 Z M14 6 L8 0 L2 6 Z" fill="#FFE08A" />
          <Path d="M-14 14 Q0 24 14 14 Q0 19 -14 14 Z" fill="#FFE08A" />
        </Fx>
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
        <Fx kind="leafFallH" ox={60} oy={-10}>
          <Ellipse cx={60} cy={-10} rx={6} ry={3.5} fill="#D9762E" />
        </Fx>
        <Fx kind="leafFallH" delay={2200} ox={180} oy={-10}>
          <Ellipse cx={180} cy={-10} rx={6} ry={3.5} fill="#C9433A" />
        </Fx>
        <Fx kind="leafFallH" delay={4400} ox={300} oy={-10}>
          <Ellipse cx={300} cy={-10} rx={6} ry={3.5} fill="#E8B04A" />
        </Fx>
        <Fx kind="leafFallH" delay={6600} ox={370} oy={-10}>
          <Ellipse cx={370} cy={-10} rx={5} ry={3} fill="#D9762E" />
        </Fx>
      </G>
    </Svg>
  </View>
);

