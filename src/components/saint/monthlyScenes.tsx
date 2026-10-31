import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { DashFlow, Fx } from '@/components/pets/Fx';

// The 2027 monthly home scenes, converted from design/saint-central-home-2027 (Home2027Jan…Dec.dc.html, 390x844).
// Each design shows that month's companion on its perch at the upper right; the companion is left out here and the
// player's own sits on the perch instead (HomePet's spot for these rooms).

/** January 2027: NEW YEAR · NEW MERCIES */
export const Jan2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1630" />
          <Stop offset="0.6" stopColor="#1F3360" />
          <Stop offset="1" stopColor="#3E5A8A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs1)" />
      <G transform="scale(1.625)">
        <Fx kind="twinkleSoft">
          <Circle cx={90} cy={46} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={174} cy={20} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={218} cy={145} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={101} cy={157} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={137} cy={62} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={30} cy={119} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={25} cy={69} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={149} cy={116} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={219} cy={152} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={65} cy={169} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={155} cy={157} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={20} cy={64} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={150} cy={42} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={115} cy={44} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={154} cy={86} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={34} cy={156} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={103} cy={32} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={152} cy={23} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={135} cy={182} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={206} cy={88} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={157} cy={124} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={84} cy={71} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={186} cy={70} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={155} cy={84} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={232} cy={95} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={81} cy={163} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={38} cy={139} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={50} cy={95} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={133} cy={115} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={179} cy={27} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Path d="M0 400 Q60 370 120 392 Q180 368 240 390 L240 520 L0 520 Z" fill="#DCE6F4" />
        <Path d="M0 440 Q80 418 240 444 L240 520 L0 520 Z" fill="#F2F6FC" />
        <G transform="translate(196 356)">
          <Path d="M0 0 L-14 30 L14 30 Z" fill="#2E5A4A" />
          <Path d="M0 14 L-18 46 L18 46 Z" fill="#2E5A4A" />
          <Path d="M-6 6 L6 6 L0 0 Z M-8 22 L8 22" stroke="#F2F6FC" strokeWidth={3} />
        </G>
        <G transform="translate(28 370)">
          <Path d="M0 0 L-10 22 L10 22 Z" fill="#2E5A4A" />
          <Path d="M0 10 L-13 34 L13 34 Z" fill="#2E5A4A" />
        </G>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Rect x={248} y={330} width={106} height={26} rx={13} fill="#6B4A2A" />
      <Ellipse cx={350} cy={343} rx={9} ry={13} fill="#A8784E" />
      <Ellipse cx={350} cy={343} rx={5} ry={8} fill="none" stroke="#6B4A2A" strokeWidth={1.4} />
      <Path d="M250 334 Q256 322 300 324 Q344 322 352 332 Q346 338 334 334 Q322 340 310 335 Q296 340 284 335 Q270 340 258 336 Z" fill="#F2F6FC" />
      <G transform="scale(1.625)">
        <G transform="translate(93 59)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(158 97)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(154 86)">
          <Fx kind="hSnow" delay={6000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(23 -7)">
          <Fx kind="hSnow" delay={5000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(75 91)">
          <Fx kind="hSnow" delay={4000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(184 -14)">
          <Fx kind="hSnow" delay={3000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(21 49)">
          <Fx kind="hSnow" delay={2000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(171 117)">
          <Fx kind="hSnow" delay={1000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(180 84)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(78 68)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(233 58)">
          <Fx kind="hSnow" delay={6000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(11 88)">
          <Fx kind="hSnow" delay={5000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(96 13)">
          <Fx kind="hSnow" delay={4000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(162 -1)">
          <Fx kind="hSnow" delay={3000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(132 -15)">
          <Fx kind="hSnow" delay={2000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(61 43)">
          <Fx kind="hSnow" delay={1000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(39 33)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(107 70)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(229 97)">
          <Fx kind="hSnow" delay={6000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(26 12)">
          <Fx kind="hSnow" delay={5000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(120 72)">
          <Fx kind="hSnow" delay={4000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(146 41)">
          <Fx kind="hSnow" delay={3000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(232 5)">
          <Fx kind="hSnow" delay={2000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(215 80)">
          <Fx kind="hSnow" delay={1000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(227 110)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(77 76)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.8} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** February 2027: LOVE IS PATIENT */
export const Feb2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A1A3A" />
          <Stop offset="0.55" stopColor="#6A3A5A" />
          <Stop offset="1" stopColor="#E8A0A0" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs2)" />
      <G transform="scale(1.625)">
        <Fx kind="twinkleSoft">
          <Circle cx={99} cy={95} r={1.6} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={67} cy={27} r={0.8} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={53} cy={27} r={1} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={176} cy={37} r={0.8} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={132} cy={114} r={1} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={75} cy={44} r={0.8} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={45} cy={61} r={1.2} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={164} cy={80} r={1.2} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={40} cy={96} r={0.8} fill="#F7D6E0" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={124} cy={119} r={1.6} fill="#F7D6E0" />
        </Fx>
        <Path d="M0 404 Q120 380 240 404 L240 520 L0 520 Z" fill="#E8D4DC" />
        <Path d="M0 446 Q120 430 240 452 L240 520 L0 520 Z" fill="#F7EAF0" />
        <Path d="M20 520 L20 420 M60 520 L60 424 M100 520 L100 420 M140 520 L140 424 M180 520 L180 420 M220 520 L220 424" stroke="#B88A70" strokeWidth={3} />
        <Path d="M10 434 H230 M10 456 H230" stroke="#B88A70" strokeWidth={2.5} />
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Rect x={252} y={336} width={100} height={8} rx={3} fill="#8A5A3C" />
      <Path d="M262 344 L258 362 M342 344 L346 362" stroke="#6B4A2A" strokeWidth={5} strokeLinecap="round" />
      <G transform="translate(340 330) scale(1.3)">
        <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#D0587A" />
      </G>
      <G transform="scale(1.625)">
        <G transform="translate(107 72)">
          <Fx kind="hRise">
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(106 -4)">
          <Fx kind="hRise" delay={6000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(129 72)">
          <Fx kind="hRise" delay={5000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(21 18)">
          <Fx kind="hRise" delay={4000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(23 23)">
          <Fx kind="hRise" delay={3000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(118 11)">
          <Fx kind="hRise" delay={2000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(34 57)">
          <Fx kind="hRise" delay={1000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(159 -17)">
          <Fx kind="hRise">
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(32 -30)">
          <Fx kind="hRise">
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#F7A7BC" opacity={0.8} />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** March 2027: BE STRONG & COURAGEOUS */
export const Mar2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5AA8D6" />
          <Stop offset="0.6" stopColor="#9CD3EA" />
          <Stop offset="1" stopColor="#DDF0E4" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs3)" />
      <G transform="scale(1.625)">
        <Fx kind="hDrift">
          <G>
            <Ellipse cx={50} cy={90} rx={34} ry={11} fill="#FFFFFF" opacity={0.85} />
            <Ellipse cx={62} cy={82} rx={18} ry={10} fill="#FFFFFF" opacity={0.85} />
            <Ellipse cx={180} cy={150} rx={38} ry={11} fill="#FFFFFF" opacity={0.8} />
          </G>
        </Fx>
        <Path d="M0 380 L50 300 L90 350 L140 270 L190 340 L240 300 L240 520 L0 520 Z" fill="#6E8FB0" />
        <Path d="M140 270 L126 296 L140 290 L152 298 Z M50 300 L40 318 L52 314 L60 320 Z" fill="#FFFFFF" />
        <Path d="M0 420 Q120 396 240 420 L240 520 L0 520 Z" fill="#7FBF6A" />
        <Path d="M0 460 Q120 444 240 466 L240 520 L0 520 Z" fill="#5FA454" />
        <Fx kind="hKite" ox={191.0} oy={40.0}>
          <G>
            <Path d="M190 40 L204 56 L190 78 L176 56 Z" fill="#F2934A" />
            <Path d="M190 40 L190 78 M176 56 L204 56" stroke="#FFF1C4" strokeWidth={1} />
            <Path d="M190 78 Q180 100 194 118 Q206 140 186 160" stroke="#FFF1C4" strokeWidth={1} fill="none" />
          </G>
        </Fx>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Path d="M246 358 Q248 330 276 326 Q300 318 326 326 Q354 330 356 358 Z" fill="#7C766F" />
      <Path d="M256 334 Q280 322 300 326 Q320 320 344 332" stroke="#8DAA62" strokeWidth={5} fill="none" strokeLinecap="round" />
      <G transform="scale(1.625)">
        <G stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
          <DashFlow kind="streakH" d="M10 200 L70 194" />
          <DashFlow kind="streakH" d="M150 230 L220 222" />
          <DashFlow kind="streakH" d="M30 250 L80 246" />
        </G>
      </G>
    </Svg>
  </View>
);

/** April 2027: HE IS RISEN · EASTERTIDE */
export const Apr2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs4" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A3A66" />
          <Stop offset="0.6" stopColor="#8A86C0" />
          <Stop offset="1" stopColor="#D8D2F0" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs4)" />
      <G transform="scale(1.625)">
        <G fill="#F2F5FA" opacity={0.5}>
          <Ellipse cx={60} cy={60} rx={50} ry={18} />
          <Ellipse cx={190} cy={40} rx={56} ry={18} />
        </G>
        <Path d="M0 420 Q120 400 240 420 L240 520 L0 520 Z" fill="#8FC69A" />
        <Circle cx={20.0} cy={436.0} r={3.4} fill="#F2B6B8" />
        <Circle cx={23.8} cy={438.8} r={3.4} fill="#F2B6B8" />
        <Circle cx={22.4} cy={443.2} r={3.4} fill="#F2B6B8" />
        <Circle cx={17.6} cy={443.2} r={3.4} fill="#F2B6B8" />
        <Circle cx={16.2} cy={438.8} r={3.4} fill="#F2B6B8" />
        <Circle cx={20} cy={440} r={2.4} fill="#E8913A" />
        <Circle cx={50.0} cy={456.0} r={3.4} fill="#FFFFFF" />
        <Circle cx={53.8} cy={458.8} r={3.4} fill="#FFFFFF" />
        <Circle cx={52.4} cy={463.2} r={3.4} fill="#FFFFFF" />
        <Circle cx={47.6} cy={463.2} r={3.4} fill="#FFFFFF" />
        <Circle cx={46.2} cy={458.8} r={3.4} fill="#FFFFFF" />
        <Circle cx={50} cy={460} r={2.4} fill="#E8913A" />
        <Circle cx={88.0} cy={440.0} r={3.4} fill="#F2C462" />
        <Circle cx={91.8} cy={442.8} r={3.4} fill="#F2C462" />
        <Circle cx={90.4} cy={447.2} r={3.4} fill="#F2C462" />
        <Circle cx={85.6} cy={447.2} r={3.4} fill="#F2C462" />
        <Circle cx={84.2} cy={442.8} r={3.4} fill="#F2C462" />
        <Circle cx={88} cy={444} r={2.4} fill="#E8913A" />
        <Circle cx={150.0} cy={452.0} r={3.4} fill="#F2B6B8" />
        <Circle cx={153.8} cy={454.8} r={3.4} fill="#F2B6B8" />
        <Circle cx={152.4} cy={459.2} r={3.4} fill="#F2B6B8" />
        <Circle cx={147.6} cy={459.2} r={3.4} fill="#F2B6B8" />
        <Circle cx={146.2} cy={454.8} r={3.4} fill="#F2B6B8" />
        <Circle cx={150} cy={456} r={2.4} fill="#E8913A" />
        <Circle cx={190.0} cy={436.0} r={3.4} fill="#FFFFFF" />
        <Circle cx={193.8} cy={438.8} r={3.4} fill="#FFFFFF" />
        <Circle cx={192.4} cy={443.2} r={3.4} fill="#FFFFFF" />
        <Circle cx={187.6} cy={443.2} r={3.4} fill="#FFFFFF" />
        <Circle cx={186.2} cy={438.8} r={3.4} fill="#FFFFFF" />
        <Circle cx={190} cy={440} r={2.4} fill="#E8913A" />
        <Circle cx={222.0} cy={458.0} r={3.4} fill="#F2C462" />
        <Circle cx={225.8} cy={460.8} r={3.4} fill="#F2C462" />
        <Circle cx={224.4} cy={465.2} r={3.4} fill="#F2C462" />
        <Circle cx={219.6} cy={465.2} r={3.4} fill="#F2C462" />
        <Circle cx={218.2} cy={460.8} r={3.4} fill="#F2C462" />
        <Circle cx={222} cy={462} r={2.4} fill="#E8913A" />
        <Circle cx={120.0} cy={474.0} r={3.4} fill="#F2B6B8" />
        <Circle cx={123.8} cy={476.8} r={3.4} fill="#F2B6B8" />
        <Circle cx={122.4} cy={481.2} r={3.4} fill="#F2B6B8" />
        <Circle cx={117.6} cy={481.2} r={3.4} fill="#F2B6B8" />
        <Circle cx={116.2} cy={476.8} r={3.4} fill="#F2B6B8" />
        <Circle cx={120} cy={478} r={2.4} fill="#E8913A" />
        <Circle cx={34.0} cy={486.0} r={3.4} fill="#FFFFFF" />
        <Circle cx={37.8} cy={488.8} r={3.4} fill="#FFFFFF" />
        <Circle cx={36.4} cy={493.2} r={3.4} fill="#FFFFFF" />
        <Circle cx={31.6} cy={493.2} r={3.4} fill="#FFFFFF" />
        <Circle cx={30.2} cy={488.8} r={3.4} fill="#FFFFFF" />
        <Circle cx={34} cy={490} r={2.4} fill="#E8913A" />
        <Circle cx={200.0} cy={490.0} r={3.4} fill="#F2C462" />
        <Circle cx={203.8} cy={492.8} r={3.4} fill="#F2C462" />
        <Circle cx={202.4} cy={497.2} r={3.4} fill="#F2C462" />
        <Circle cx={197.6} cy={497.2} r={3.4} fill="#F2C462" />
        <Circle cx={196.2} cy={492.8} r={3.4} fill="#F2C462" />
        <Circle cx={200} cy={494} r={2.4} fill="#E8913A" />
        <Path d="M196 300 Q212 250 236 236" stroke="#5A3A24" strokeWidth={4} fill="none" />
        <Circle cx={208.0} cy={261.0} r={4.2} fill="#F7C6D6" />
        <Circle cx={212.8} cy={264.4} r={4.2} fill="#F7C6D6" />
        <Circle cx={210.9} cy={270.1} r={4.2} fill="#F7C6D6" />
        <Circle cx={205.1} cy={270.1} r={4.2} fill="#F7C6D6" />
        <Circle cx={203.2} cy={264.4} r={4.2} fill="#F7C6D6" />
        <Circle cx={208} cy={266} r={3.0} fill="#F2A7C0" />
        <Circle cx={226.0} cy={239.0} r={4.2} fill="#F7C6D6" />
        <Circle cx={230.8} cy={242.4} r={4.2} fill="#F7C6D6" />
        <Circle cx={228.9} cy={248.1} r={4.2} fill="#F7C6D6" />
        <Circle cx={223.1} cy={248.1} r={4.2} fill="#F7C6D6" />
        <Circle cx={221.2} cy={242.4} r={4.2} fill="#F7C6D6" />
        <Circle cx={226} cy={244} r={3.0} fill="#F2A7C0" />
        <Circle cx={196.0} cy={287.0} r={4.2} fill="#F7C6D6" />
        <Circle cx={200.8} cy={290.4} r={4.2} fill="#F7C6D6" />
        <Circle cx={198.9} cy={296.1} r={4.2} fill="#F7C6D6" />
        <Circle cx={193.1} cy={296.1} r={4.2} fill="#F7C6D6" />
        <Circle cx={191.2} cy={290.4} r={4.2} fill="#F7C6D6" />
        <Circle cx={196} cy={292} r={3.0} fill="#F2A7C0" />
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Path d="M262 358 L266 334 L336 334 L340 358 Z" fill="#8A5A3C" />
      <Ellipse cx={301} cy={334} rx={35} ry={7} fill="#C9944E" />
      <Ellipse cx={301} cy={334} rx={22} ry={4} fill="none" stroke="#A8784E" strokeWidth={1.4} />
      <Circle cx={258.0} cy={349.0} r={4.2} fill="#F7C6D6" />
      <Circle cx={262.8} cy={352.4} r={4.2} fill="#F7C6D6" />
      <Circle cx={260.9} cy={358.1} r={4.2} fill="#F7C6D6" />
      <Circle cx={255.1} cy={358.1} r={4.2} fill="#F7C6D6" />
      <Circle cx={253.2} cy={352.4} r={4.2} fill="#F7C6D6" />
      <Circle cx={258} cy={354} r={3.0} fill="#F2C462" />
      <Circle cx={346.0} cy={347.0} r={4.2} fill="#FFFFFF" />
      <Circle cx={350.8} cy={350.4} r={4.2} fill="#FFFFFF" />
      <Circle cx={348.9} cy={356.1} r={4.2} fill="#FFFFFF" />
      <Circle cx={343.1} cy={356.1} r={4.2} fill="#FFFFFF" />
      <Circle cx={341.2} cy={350.4} r={4.2} fill="#FFFFFF" />
      <Circle cx={346} cy={352} r={3.0} fill="#F2C462" />
      <Circle cx={336.0} cy={356.0} r={3.4} fill="#F2C462" />
      <Circle cx={339.8} cy={358.8} r={3.4} fill="#F2C462" />
      <Circle cx={338.4} cy={363.2} r={3.4} fill="#F2C462" />
      <Circle cx={333.6} cy={363.2} r={3.4} fill="#F2C462" />
      <Circle cx={332.2} cy={358.8} r={3.4} fill="#F2C462" />
      <Circle cx={336} cy={360} r={2.4} fill="#E8913A" />
      <G transform="scale(1.625)">
        <G transform="translate(151 8)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(143 -5)">
          <Fx kind="hRain" delay={400}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(99 -24)">
          <Fx kind="hRain" delay={800}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(24 23)">
          <Fx kind="hRain" delay={1200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(163 66)">
          <Fx kind="hRain" delay={200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(44 34)">
          <Fx kind="hRain" delay={600}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(94 63)">
          <Fx kind="hRain" delay={1000}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(127 1)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(35 94)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(125 92)">
          <Fx kind="hRain" delay={400}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(129 49)">
          <Fx kind="hRain" delay={800}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(27 6)">
          <Fx kind="hRain" delay={1200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(32 57)">
          <Fx kind="hRain" delay={200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(195 37)">
          <Fx kind="hRain" delay={600}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(128 11)">
          <Fx kind="hRain" delay={1000}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(138 -25)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(58 105)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(98 7)">
          <Fx kind="hRain" delay={400}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(182 109)">
          <Fx kind="hRain" delay={800}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(12 105)">
          <Fx kind="hRain" delay={1200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(82 -7)">
          <Fx kind="hRain" delay={200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(184 36)">
          <Fx kind="hRain" delay={600}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(138 63)">
          <Fx kind="hRain" delay={1000}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(48 61)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(203 27)">
          <Fx kind="hRain">
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(142 108)">
          <Fx kind="hRain" delay={400}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(205 98)">
          <Fx kind="hRain" delay={800}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(90 27)">
          <Fx kind="hRain" delay={1200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(162 19)">
          <Fx kind="hRain" delay={200}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
        <G transform="translate(212 31)">
          <Fx kind="hRain" delay={600}>
            <G>
              <Path d="M0 0 L-2 9" stroke="#E6EEF8" strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** May 2027: CONSIDER THE LILIES */
export const May2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs5" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F2B66A" />
          <Stop offset="0.5" stopColor="#F7D69A" />
          <Stop offset="1" stopColor="#E8F0C0" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs5)" />
      <G transform="scale(1.625)">
        <Fx kind="hDrift">
          <G fill="#FFFFFF" opacity={0.7}>
            <Ellipse cx={70} cy={70} rx={40} ry={12} />
            <Ellipse cx={190} cy={120} rx={34} ry={10} />
          </G>
        </Fx>
        <Path d="M0 400 Q120 372 240 400 L240 520 L0 520 Z" fill="#9CC66A" />
        <Path d="M0 440 Q120 424 240 446 L240 520 L0 520 Z" fill="#7FB054" />
        <Path d="M14 520 L14 430" stroke="#5E8B3E" strokeWidth={2} />
        <Ellipse cx={14} cy={430} rx={4} ry={7} fill="#FFFFFF" />
        <Ellipse cx={14} cy={433} rx={2} ry={3.5} fill="#F2C462" />
        <Path d="M40 520 L40 452" stroke="#5E8B3E" strokeWidth={2} />
        <Ellipse cx={40} cy={452} rx={4} ry={7} fill="#FFFFFF" />
        <Ellipse cx={40} cy={455} rx={2} ry={3.5} fill="#F2C462" />
        <Path d="M196 520 L196 436" stroke="#5E8B3E" strokeWidth={2} />
        <Ellipse cx={196} cy={436} rx={4} ry={7} fill="#FFFFFF" />
        <Ellipse cx={196} cy={439} rx={2} ry={3.5} fill="#F2C462" />
        <Path d="M226 520 L226 456" stroke="#5E8B3E" strokeWidth={2} />
        <Ellipse cx={226} cy={456} rx={4} ry={7} fill="#FFFFFF" />
        <Ellipse cx={226} cy={459} rx={2} ry={3.5} fill="#F2C462" />
        <Path d="M110 520 L110 470" stroke="#5E8B3E" strokeWidth={2} />
        <Ellipse cx={110} cy={470} rx={4} ry={7} fill="#FFFFFF" />
        <Ellipse cx={110} cy={473} rx={2} ry={3.5} fill="#F2C462" />
        <Path d="M160 520 L160 478" stroke="#5E8B3E" strokeWidth={2} />
        <Ellipse cx={160} cy={478} rx={4} ry={7} fill="#FFFFFF" />
        <Ellipse cx={160} cy={481} rx={2} ry={3.5} fill="#F2C462" />
      </G>
      <Fx kind="bob4">
        <G>
          <G fill="#FFFFFF">
            <Circle cx={266} cy={344} r={16} />
            <Circle cx={290} cy={336} r={20} />
            <Circle cx={316} cy={336} r={20} />
            <Circle cx={338} cy={344} r={16} />
            <Rect x={252} y={342} width={100} height={18} rx={9} />
          </G>
          <Path d="M262 356 Q300 364 342 356" stroke="#F2E2C8" strokeWidth={3} fill="none" />
        </G>
      </Fx>
      <G transform="scale(1.625)">
        <G transform="translate(40 250)">
          <Fx kind="hWander" delay={1000}>
            <Fx kind="hFlap" delay={200} ox={0.0} oy={2.0}>
              <G>
                <Path d="M0 0 C-8 -8 -12 2 -2 3 C-10 8 -4 12 0 3 C4 12 10 8 2 3 C12 2 8 -8 0 0 Z" fill="#E8735F" />
              </G>
            </Fx>
          </Fx>
        </G>
        <G transform="translate(200 210)">
          <Fx kind="hWander" delay={1000}>
            <Fx kind="hFlap" delay={200} ox={0.0} oy={2.0}>
              <G>
                <Path d="M0 0 C-8 -8 -12 2 -2 3 C-10 8 -4 12 0 3 C4 12 10 8 2 3 C12 2 8 -8 0 0 Z" fill="#B9A6F0" />
              </G>
            </Fx>
          </Fx>
        </G>
        <G transform="translate(180 380)">
          <Fx kind="hWander" delay={2000}>
            <Fx kind="hFlap" delay={100} ox={0.0} oy={2.0}>
              <G>
                <Path d="M0 0 C-8 -8 -12 2 -2 3 C-10 8 -4 12 0 3 C4 12 10 8 2 3 C12 2 8 -8 0 0 Z" fill="#F2A7C0" />
              </G>
            </Fx>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** June 2027: BE STILL */
export const Jun2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs6" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0E2A30" />
          <Stop offset="0.55" stopColor="#1E5A54" />
          <Stop offset="1" stopColor="#3E8A72" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs6)" />
      <G transform="scale(1.625)">
        <Fx kind="twinkleSoft">
          <Circle cx={217} cy={110} r={1} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={59} cy={140} r={1.6} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={99} cy={15} r={0.8} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={210} cy={79} r={1.6} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={74} cy={57} r={1.2} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={122} cy={97} r={1.2} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={28} cy={64} r={0.8} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={66} cy={128} r={1} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={94} cy={60} r={1.6} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={167} cy={8} r={1.6} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={175} cy={96} r={0.8} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={221} cy={38} r={1.6} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={208} cy={59} r={1.6} fill="#B5F0D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={53} cy={119} r={1.2} fill="#B5F0D8" />
        </Fx>
        <Ellipse cx={120} cy={450} rx={150} ry={60} fill="#14424A" />
        <Ellipse cx={120} cy={450} rx={130} ry={44} fill="#1E5A62" opacity={0.6} />
        <G fill="#2F6B4A">
          <Ellipse cx={40} cy={430} rx={22} ry={7} />
          <Ellipse cx={196} cy={470} rx={26} ry={8} />
          <Ellipse cx={80} cy={486} rx={18} ry={6} />
        </G>
        <G transform="translate(196 462)">
          <Ellipse cx={0} cy={-6} rx={4} ry={8} fill="#F4C2D0" />
          <Ellipse cx={-6} cy={-3} rx={4} ry={7} fill="#F2A7C0" transform="rotate(-35 -6 -3)" />
          <Ellipse cx={6} cy={-3} rx={4} ry={7} fill="#F2A7C0" transform="rotate(35 6 -3)" />
        </G>
        <Path d="M0 520 L6 380 M12 520 L22 396 M228 520 L230 384 M220 520 L212 400" stroke="#2F6B4A" strokeWidth={3} />
      </G>
      <Ellipse cx={301} cy={350} rx={80} ry={16} fill="#14424A" />
      <Path d="M301 340 L360 346 A56 12 0 1 1 301 338 Z" fill="#2F6B4A" />
      <Path d="M301 344 L260 350 M301 344 L340 354" stroke="#1E5A3A" strokeWidth={1.6} />
      <G transform="scale(1.625)">
        <Fx kind="firefly">
          <Circle cx={42} cy={405} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={204} cy={301} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={138} cy={302} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly">
          <Circle cx={210} cy={221} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={205} cy={240} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={63} cy={232} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly">
          <Circle cx={27} cy={238} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={171} cy={319} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={187} cy={237} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly">
          <Circle cx={176} cy={411} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={172} cy={321} r={2} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={188} cy={289} r={2} fill="#F7F2A0" />
        </Fx>
      </G>
    </Svg>
  </View>
);

/** July 2027: WINGS LIKE EAGLES */
export const Jul2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs7" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#070D24" />
          <Stop offset="0.6" stopColor="#15214A" />
          <Stop offset="1" stopColor="#2E3A6A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs7)" />
      <G transform="scale(1.625)">
        <Fx kind="twinkleSoft">
          <Circle cx={47} cy={288} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={13} cy={15} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={142} cy={79} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={231} cy={107} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={15} cy={136} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={82} cy={264} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={203} cy={308} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={74} cy={286} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={221} cy={75} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={197} cy={189} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={177} cy={306} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={219} cy={264} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={144} cy={85} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={231} cy={233} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={163} cy={10} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={52} cy={80} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={166} cy={69} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={91} cy={273} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={208} cy={62} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={71} cy={105} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={18} cy={58} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={151} cy={22} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={121} cy={174} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={185} cy={149} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={138} cy={281} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={137} cy={134} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={151} cy={111} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={43} cy={221} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={108} cy={234} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={26} cy={131} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={26} cy={116} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={208} cy={70} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={191} cy={337} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={44} cy={137} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={127} cy={120} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={109} cy={257} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={178} cy={122} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={188} cy={228} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={94} cy={223} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={99} cy={171} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={192} cy={195} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={94} cy={291} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={120} cy={17} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={92} cy={272} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={139} cy={40} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={209} cy={125} r={0.8} fill="#F2E9D8" />
        </Fx>
        <DashFlow kind="shootH" d="M200 40 L150 70" stroke="#FFF1C4" strokeWidth={2} strokeLinecap="round" />
        <Path d="M0 420 Q60 400 120 414 Q180 396 240 416 L240 520 L0 520 Z" fill="#1A2A3A" />
        <Path d="M0 460 Q120 446 240 464 L240 520 L0 520 Z" fill="#22384A" />
        <Path d="M30 430 L30 470 M24 470 H36 M60 434 L60 470" stroke="#3A5068" strokeWidth={2} />
      </G>
      <Path d="M220 368 Q260 324 301 330 Q344 326 384 368 Z" fill="#1E3A3A" />
      <Path d="M262 332 L264 322 M280 330 L284 320 M330 330 L326 320 M346 334 L350 324" stroke="#2F5A4A" strokeWidth={2.4} strokeLinecap="round" />
      <G transform="scale(1.625)">
        <Fx kind="firefly">
          <Circle cx={41} cy={413} r={1.6} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={89} cy={385} r={1.6} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={219} cy={403} r={1.6} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly">
          <Circle cx={89} cy={396} r={1.6} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={128} cy={466} r={1.6} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={86} cy={431} r={1.6} fill="#F7F2A0" />
        </Fx>
        <Fx kind="firefly">
          <Circle cx={58} cy={448} r={1.6} fill="#F7F2A0" />
        </Fx>
      </G>
    </Svg>
  </View>
);

/** August 2027: THE LORD IS MY SHEPHERD */
export const Aug2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs8" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2A5A" />
          <Stop offset="0.45" stopColor="#C9605A" />
          <Stop offset="0.8" stopColor="#F2A65A" />
          <Stop offset="1" stopColor="#F7D27A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs8)" />
      <G transform="scale(1.625)">
        <Fx kind="hDrift">
          <G fill="#F7C6A0" opacity={0.6}>
            <Ellipse cx={60} cy={140} rx={44} ry={8} />
            <Ellipse cx={190} cy={100} rx={40} ry={7} />
            <Ellipse cx={160} cy={200} rx={50} ry={8} />
          </G>
        </Fx>
        <Path d="M0 380 Q60 340 130 370 Q190 344 240 360 L240 520 L0 520 Z" fill="#5A4A6A" />
        <Path d="M0 420 Q100 390 240 416 L240 520 L0 520 Z" fill="#6E8B4E" />
        <Path d="M0 470 Q120 450 240 474 L240 520 L0 520 Z" fill="#5A7A3E" />
        <G fill="#F2F5FA">
          <Ellipse cx={44} cy={408} rx={8} ry={5} />
          <Circle cx={38} cy={404} r={3} />
          <Ellipse cx={198} cy={398} rx={7} ry={4.5} />
          <Circle cx={204} cy={394} r={3} />
        </G>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Path d="M250 358 Q252 334 278 330 Q302 322 328 330 Q352 334 354 358 Z" fill="#6A5A6E" />
      <Path d="M262 336 Q286 326 306 330" stroke="#8A7A8E" strokeWidth={3} fill="none" strokeLinecap="round" />
      <G transform="scale(1.625)">
        <Fx kind="hBirds">
          <G>
            <Path d="M0 0 Q5 -5 10 0 Q15 -5 20 0" stroke="#3A2A3A" strokeWidth={1.5} fill="none" transform="translate(30 90)" />
            <Path d="M0 0 Q4 -4 8 0 Q12 -4 16 0" stroke="#3A2A3A" strokeWidth={1.4} fill="none" transform="translate(56 110)" />
          </G>
        </Fx>
      </G>
    </Svg>
  </View>
);

/** September 2027: TASTE AND SEE */
export const Sep2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs9" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6AA8B8" />
          <Stop offset="0.6" stopColor="#C9DDB0" />
          <Stop offset="1" stopColor="#F2E2B0" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs9)" />
      <G transform="scale(1.625)">
        <G>
          <Path d="M30 420 L30 300" stroke="#6B4A2A" strokeWidth={8} />
          <Circle cx={30} cy={280} r={46} fill="#5E8B3E" />
          <Circle cx={8} cy={300} r={30} fill="#6E9B4E" />
          <Path d="M214 420 L214 320" stroke="#6B4A2A" strokeWidth={8} />
          <Circle cx={214} cy={296} r={44} fill="#5E8B3E" />
          <Circle cx={236} cy={320} r={28} fill="#6E9B4E" />
          <G fill="#F7A68A">
            <Circle cx={16} cy={270} r={6} />
            <Circle cx={44} cy={292} r={6} />
            <Circle cx={24} cy={306} r={5} />
            <Circle cx={200} cy={286} r={6} />
            <Circle cx={226} cy={306} r={6} />
            <Circle cx={214} cy={270} r={5} />
          </G>
        </G>
        <Path d="M0 420 Q120 404 240 420 L240 520 L0 520 Z" fill="#C9B06A" />
        <Path d="M0 460 Q120 450 240 466 L240 520 L0 520 Z" fill="#B0964E" />
        <G transform="translate(176 446)">
          <Path d="M0 0 L32 0 L28 22 L4 22 Z" fill="#8A5A3C" />
          <Circle cx={8} cy={-2} r={6} fill="#F7A68A" />
          <Circle cx={20} cy={-4} r={6} fill="#F7B49A" />
          <Circle cx={30} cy={-1} r={5} fill="#F7A68A" />
        </G>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Rect x={256} y={332} width={90} height={26} rx={2} fill="#B5824A" />
      <Path d="M256 342 H346 M256 350 H346" stroke="#8A5A3C" strokeWidth={2} />
      <Path d="M270 332 V358 M301 332 V358 M332 332 V358" stroke="#8A5A3C" strokeWidth={1.6} />
      <G fill="#F7A68A">
        <Circle cx={350} cy={328} r={7} />
        <Circle cx={356} cy={338} r={6} />
      </G>
      <Path d="M350 321 Q356 316 360 320" stroke="#6E8B4E" strokeWidth={2} fill="none" />
      <G transform="scale(1.625)">
        <G transform="translate(137 116)">
          <Fx kind="hLeaf" ox={0.0} oy={0.0}>
            <G>
              <Ellipse rx={3} ry={2} fill="#E8C462" />
            </G>
          </Fx>
        </G>
        <G transform="translate(132 53)">
          <Fx kind="hLeaf" delay={8000} ox={0.0} oy={0.0}>
            <G>
              <Ellipse rx={3} ry={2} fill="#E8C462" />
            </G>
          </Fx>
        </G>
        <G transform="translate(28 41)">
          <Fx kind="hLeaf" delay={7000} ox={0.0} oy={0.0}>
            <G>
              <Ellipse rx={3} ry={2} fill="#E8C462" />
            </G>
          </Fx>
        </G>
        <G transform="translate(20 16)">
          <Fx kind="hLeaf" delay={6000} ox={0.0} oy={0.0}>
            <G>
              <Ellipse rx={3} ry={2} fill="#E8C462" />
            </G>
          </Fx>
        </G>
        <G transform="translate(114 -12)">
          <Fx kind="hLeaf" delay={5000} ox={0.0} oy={0.0}>
            <G>
              <Ellipse rx={3} ry={2} fill="#E8C462" />
            </G>
          </Fx>
        </G>
        <G transform="translate(74 -26)">
          <Fx kind="hLeaf" delay={4000} ox={0.0} oy={0.0}>
            <G>
              <Ellipse rx={3} ry={2} fill="#E8C462" />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** October 2027: NEW EVERY MORNING */
export const Oct2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs10" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A2050" />
          <Stop offset="0.45" stopColor="#A04A50" />
          <Stop offset="0.8" stopColor="#F2934A" />
          <Stop offset="1" stopColor="#F7C86A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs10)" />
      <G transform="scale(1.625)">
        <Fx kind="hRays">
          <G stroke="#FFE2A0" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round">
            <Path d="M120 420 L20 220 M120 420 L70 190 M120 420 L120 170 M120 420 L170 190 M120 420 L220 220" />
          </G>
        </Fx>
        <Path d="M0 410 Q120 390 240 410 L240 520 L0 520 Z" fill="#5A2E1E" />
        <Path d="M0 450 Q120 436 240 456 L240 520 L0 520 Z" fill="#7A3E22" />
        <G transform="translate(26 404)">
          <Path d="M0 0 L0 -70" stroke="#3A2214" strokeWidth={5} />
          <Circle cx={0} cy={-80} r={24} fill="#C9502E" />
          <Circle cx={-14} cy={-66} r={16} fill="#E8733A" />
        </G>
        <G transform="translate(212 410)">
          <Path d="M0 0 L0 -60" stroke="#3A2214" strokeWidth={5} />
          <Circle cx={0} cy={-70} r={22} fill="#E8913A" />
          <Circle cx={12} cy={-58} r={14} fill="#C9502E" />
        </G>
        <G fill="#E8913A">
          <Ellipse cx={60} cy={470} rx={5} ry={3} />
          <Ellipse cx={170} cy={480} rx={5} ry={3} fill="#C9502E" />
          <Ellipse cx={120} cy={496} rx={5} ry={3} />
        </G>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Rect x={250} y={330} width={104} height={28} rx={6} fill="#D9B25A" />
      <Path d="M254 340 H350 M254 350 H350 M276 330 V358 M326 330 V358" stroke="#B8903A" strokeWidth={2} />
      <Path d="M256 330 L260 324 M286 330 L284 323 M316 330 L320 324 M344 330 L342 323" stroke="#E8C462" strokeWidth={2} strokeLinecap="round" />
      <Path d="M354 356 L360 348 L366 356 L362 362 Z" fill="#C9502E" />
      <Path d="M240 360 L246 352 L252 360 L248 366 Z" fill="#E8913A" />
      <G transform="scale(1.625)">
        <G transform="translate(168 -8)">
          <Fx kind="hLeaf" ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(211 36)">
          <Fx kind="hLeaf" delay={8000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(27 26)">
          <Fx kind="hLeaf" delay={7000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(23 37)">
          <Fx kind="hLeaf" delay={6000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(226 1)">
          <Fx kind="hLeaf" delay={5000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(122 -28)">
          <Fx kind="hLeaf" delay={4000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(92 111)">
          <Fx kind="hLeaf" delay={3000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(112 38)">
          <Fx kind="hLeaf" delay={2000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(165 3)">
          <Fx kind="hLeaf" ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
        <G transform="translate(17 104)">
          <Fx kind="hLeaf" delay={8000} ox={0.0} oy={0.0}>
            <G>
              <Path d="M0 -4 Q4 0 0 4 Q-4 0 0 -4 Z" fill="#E8733A" />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** November 2027: GIVE THANKS */
export const Nov2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs11" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1A1A30" />
          <Stop offset="0.55" stopColor="#3A2E48" />
          <Stop offset="1" stopColor="#6A4A44" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs11)" />
      <G transform="scale(1.625)">
        <Fx kind="twinkleSoft">
          <Circle cx={189} cy={69} r={0.8} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={49} cy={75} r={0.8} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={54} cy={59} r={1.2} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={168} cy={86} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={82} cy={122} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={77} cy={96} r={0.8} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={72} cy={17} r={0.8} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={12} cy={195} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={139} cy={129} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={122} cy={35} r={1.6} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={176} cy={134} r={1.6} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={137} cy={86} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={66} cy={95} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={221} cy={188} r={1} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={111} cy={96} r={0.8} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={222} cy={41} r={0.8} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={26} cy={168} r={1.2} fill="#F7E3B5" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={118} cy={49} r={0.8} fill="#F7E3B5" />
        </Fx>
        <G transform="translate(176 300)">
          <Rect x={0} y={0} width={56} height={120} fill="#4A3020" />
          <Path d="M-8 2 L28 -26 L64 2 Z" fill="#3A2214" />
          <Fx kind="hGlow">
            <Rect x={12} y={20} width={32} height={28} rx={2} fill="#F2C462" />
          </Fx>
          <Path d="M28 20 V48 M12 34 H44" stroke="#4A3020" strokeWidth={2.5} />
        </G>
        <Path d="M0 420 Q120 404 240 420 L240 520 L0 520 Z" fill="#5A3A24" />
        <Path d="M0 456 Q120 444 240 462 L240 520 L0 520 Z" fill="#6E4A2E" />
        <G fill="#C9702E">
          <Ellipse cx={30} cy={452} rx={6} ry={3} />
          <Ellipse cx={90} cy={476} rx={6} ry={3} fill="#E8A24B" />
          <Ellipse cx={200} cy={470} rx={6} ry={3} fill="#A04A2A" />
          <Ellipse cx={150} cy={500} rx={6} ry={3} />
        </G>
        <G transform="translate(36 456)">
          <Path d="M-12 0 L12 0 L8 -26 L-8 -26 Z" fill="#E8913A" />
          <Ellipse cx={0} cy={-26} rx={8} ry={3} fill="#C9702E" />
        </G>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Rect x={256} y={334} width={90} height={24} rx={3} fill="#6B4A2A" />
      <Path d="M252 334 L350 334 L350 346 Q326 352 300 346 Q276 352 252 346 Z" fill="#C9433A" />
      <Path d="M266 334 V348 M286 334 V350 M316 334 V350 M336 334 V348 M252 340 H350" stroke="#F2C462" strokeWidth={1.4} opacity={0.6} />
      <G transform="translate(358 346)">
        <Rect x={-7} y={-10} width={14} height={14} rx={2} fill="#F3EBDD" />
        <Path d="M7 -7 Q12 -6 12 -2 Q12 2 7 1" stroke="#F3EBDD" strokeWidth={2} fill="none" />
        <Fx kind="hSteam">
          <Path d="M-2 -14 Q-5 -18 -2 -22 M3 -14 Q0 -18 3 -22" stroke="#F3EBDD" strokeWidth={1.4} fill="none" opacity={0.6} />
        </Fx>
      </G>
      <G transform="scale(1.625)">
        <G transform="translate(27 67)">
          <Fx kind="hRise">
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#8FB4F2" opacity={0.7} />
            </G>
          </Fx>
        </G>
        <G transform="translate(228 99)">
          <Fx kind="hRise" delay={6000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#8FB4F2" opacity={0.7} />
            </G>
          </Fx>
        </G>
        <G transform="translate(177 42)">
          <Fx kind="hRise" delay={5000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#8FB4F2" opacity={0.7} />
            </G>
          </Fx>
        </G>
        <G transform="translate(159 32)">
          <Fx kind="hRise" delay={4000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#8FB4F2" opacity={0.7} />
            </G>
          </Fx>
        </G>
        <G transform="translate(183 45)">
          <Fx kind="hRise" delay={3000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#8FB4F2" opacity={0.7} />
            </G>
          </Fx>
        </G>
        <G transform="translate(17 87)">
          <Fx kind="hRise" delay={2000}>
            <G>
              <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill="#8FB4F2" opacity={0.7} />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

/** December 2027: ADVENT · COME, EMMANUEL */
export const Dec2027Scene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="hs12" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#070B1E" />
          <Stop offset="0.6" stopColor="#14203E" />
          <Stop offset="1" stopColor="#26385A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={844} fill="url(#hs12)" />
      <G transform="scale(1.625)">
        <Fx kind="twinkleSoft">
          <Circle cx={55} cy={88} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={122} cy={9} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={101} cy={176} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={70} cy={25} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={63} cy={190} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={8} cy={179} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={29} cy={251} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={136} cy={110} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={137} cy={10} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={75} cy={53} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={110} cy={29} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={13} cy={161} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={169} cy={127} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={157} cy={278} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={176} cy={207} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={192} cy={261} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={80} cy={82} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={219} cy={270} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={195} cy={266} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={142} cy={266} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={219} cy={125} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={15} cy={29} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={171} cy={192} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={104} cy={239} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={168} cy={17} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={133} cy={143} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={124} cy={43} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={176} cy={277} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={198} cy={250} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={215} cy={46} r={1.2} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={68} cy={113} r={1} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={197} cy={243} r={1.6} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={224} cy={203} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft">
          <Circle cx={130} cy={155} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={900}>
          <Circle cx={165} cy={109} r={0.8} fill="#F2E9D8" />
        </Fx>
        <Fx kind="twinkleSoft" delay={1800}>
          <Circle cx={161} cy={83} r={1.2} fill="#F2E9D8" />
        </Fx>
        <G transform="translate(200 70)">
          <Fx kind="hStarPulse" ox={0.0} oy={3.0}>
            <Path d="M0 -14 L2.6 -2.6 L14 0 L2.6 2.6 L0 20 L-2.6 2.6 L-14 0 L-2.6 -2.6 Z" fill="#FFF1C4" />
          </Fx>
        </G>
        <Fx kind="hBeam">
          <Path d="M200 84 L176 214 L224 214 Z" fill="#FFF1C4" />
        </Fx>
        <Path d="M0 410 Q120 386 240 410 L240 520 L0 520 Z" fill="#E6EEF8" />
        <Path d="M0 456 Q120 440 240 462 L240 520 L0 520 Z" fill="#F7FAFF" />
        <G transform="translate(30 410)">
          <Path d="M0 -50 L-16 -16 L16 -16 Z M0 -34 L-20 6 L20 6 Z" fill="#2E5A4A" />
          <Circle cx={-6} cy={-20} r={2} fill="#E8735F" />
          <Circle cx={8} cy={-6} r={2} fill="#F2C462" />
          <Circle cx={0} cy={-52} r={2.5} fill="#F2C462" />
        </G>
      </G>
      <Ellipse cx={301} cy={358} rx={62} ry={7} fill="#000" opacity={0.25} />
      <Rect x={254} y={330} width={58} height={28} rx={2} fill="#C9433A" />
      <Path d="M283 330 V358 M254 344 H312" stroke="#F2C462" strokeWidth={3} />
      <Rect x={306} y={338} width={44} height={20} rx={2} fill="#2E5A4A" />
      <Path d="M328 338 V358 M306 348 H350" stroke="#F2F5FA" strokeWidth={3} />
      <Path d="M328 338 Q320 330 323 336 M328 338 Q336 330 333 336" stroke="#F2F5FA" strokeWidth={2} fill="none" />
      <G transform="scale(1.625)">
        <G transform="translate(71 47)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(165 115)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(40 -27)">
          <Fx kind="hSnow" delay={6000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(129 -15)">
          <Fx kind="hSnow" delay={5000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(130 38)">
          <Fx kind="hSnow" delay={4000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(178 -5)">
          <Fx kind="hSnow" delay={3000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(183 25)">
          <Fx kind="hSnow" delay={2000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(178 95)">
          <Fx kind="hSnow" delay={1000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(80 102)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(79 88)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(125 89)">
          <Fx kind="hSnow" delay={6000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(202 0)">
          <Fx kind="hSnow" delay={5000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(234 110)">
          <Fx kind="hSnow" delay={4000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(57 49)">
          <Fx kind="hSnow" delay={3000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(27 91)">
          <Fx kind="hSnow" delay={2000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(10 44)">
          <Fx kind="hSnow" delay={1000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(123 -11)">
          <Fx kind="hSnow">
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(215 99)">
          <Fx kind="hSnow" delay={7000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(121 38)">
          <Fx kind="hSnow" delay={6000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(105 23)">
          <Fx kind="hSnow" delay={5000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(59 -11)">
          <Fx kind="hSnow" delay={4000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
        <G transform="translate(154 -7)">
          <Fx kind="hSnow" delay={3000}>
            <G>
              <Circle r={1.6} fill="#FFFFFF" />
            </G>
          </Fx>
        </G>
      </G>
    </Svg>
  </View>
);

export const MONTHLY_SCENES = {
  m2027jan: Jan2027Scene,
  m2027feb: Feb2027Scene,
  m2027mar: Mar2027Scene,
  m2027apr: Apr2027Scene,
  m2027may: May2027Scene,
  m2027jun: Jun2027Scene,
  m2027jul: Jul2027Scene,
  m2027aug: Aug2027Scene,
  m2027sep: Sep2027Scene,
  m2027oct: Oct2027Scene,
  m2027nov: Nov2027Scene,
  m2027dec: Dec2027Scene,
} as const;
