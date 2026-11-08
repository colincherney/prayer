import React from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { DashFlow, Fx } from './Fx';

import { COLLECTION_KEEPSAKE_INFO } from './collectionData';
import { COLLECTION_KEEPSAKE_ART } from './collectionKeepsakes';

// The 24 prayer nook trinkets' artwork, converted from design/Trinkets.dc.html (Prayer nook trinkets). Each piece
// is drawn on a 120x120 artboard; Trinket.tsx frames them and trinkets.ts says when each unlocks and how it's earned.

function FirstLightCandle() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={28} ry={4} fill="#000" opacity={0.35} />
      <Circle cx={60} cy={42} r={20} fill="#F2A93B" opacity={0.12} />
      <Ellipse cx={60} cy={102} rx={28} ry={7} fill="#C9A24B" />
      <Ellipse cx={60} cy={100} rx={22} ry={5} fill="#E8C27A" />
      <Rect x={48} y={56} width={24} height={44} rx={3} fill="#F3EBDD" />
      <Path d="M48 60 Q52 70 54 62 Q56 74 60 62 L72 60 L72 56 L48 56 Z" fill="#FFFFFF" />
      <Path d="M60 56 L60 50" stroke="#3A2E24" strokeWidth={1.6} />
      <Fx kind="tFlicker" ox={60.0} oy={52.0}>
        <G>
          <Path d="M60 28 Q70 42 60 52 Q50 42 60 28 Z" fill="#F2A93B" />
          <Path d="M60 38 Q64 45 60 50 Q56 45 60 38 Z" fill="#FFF1C4" />
        </G>
      </Fx>
    </>
  );
}

function OlivewoodRosary() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={18} ry={4} fill="#000" opacity={0.35} />
      <Path d="M60 4 Q66 4 66 10" stroke="#9A9AA6" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Rect x={54} y={2} width={12} height={4} rx={2} fill="#7A7A86" />
      <Fx kind="tSwing" ox={60} oy={8}>
        <G>
          <Circle cx={60.0} cy={12.0} r={3.2} fill="#9A6646" />
          <Circle cx={69.5} cy={14.8} r={3.2} fill="#9A6646" />
          <Circle cx={77.2} cy={22.5} r={3.2} fill="#9A6646" />
          <Circle cx={81.4} cy={33.8} r={3.2} fill="#9A6646" />
          <Circle cx={81.4} cy={46.2} r={3.2} fill="#9A6646" />
          <Circle cx={77.2} cy={57.5} r={3.2} fill="#9A6646" />
          <Circle cx={69.5} cy={65.2} r={3.2} fill="#9A6646" />
          <Circle cx={60.0} cy={68.0} r={3.2} fill="#9A6646" />
          <Circle cx={50.5} cy={65.2} r={3.2} fill="#9A6646" />
          <Circle cx={42.8} cy={57.5} r={3.2} fill="#9A6646" />
          <Circle cx={38.6} cy={46.2} r={3.2} fill="#9A6646" />
          <Circle cx={38.6} cy={33.8} r={3.2} fill="#9A6646" />
          <Circle cx={42.8} cy={22.5} r={3.2} fill="#9A6646" />
          <Circle cx={50.5} cy={14.8} r={3.2} fill="#9A6646" />
          <Circle cx={60} cy={76} r={3.6} fill="#C9A24B" />
          <Circle cx={60} cy={84} r={2.8} fill="#9A6646" />
          <Circle cx={60} cy={90} r={2.8} fill="#9A6646" />
          <Path d="M60 94 L60 112 M53 100 L67 100" stroke="#E8C27A" strokeWidth={3.4} strokeLinecap="round" />
        </G>
      </Fx>
    </>
  );
}

function MustardSeedJar() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={26} ry={4} fill="#000" opacity={0.35} />
      <Rect x={38} y={36} width={44} height={72} rx={10} fill="#BFE0F0" opacity={0.28} stroke="#DCEFF7" strokeWidth={2} />
      <Rect x={40} y={84} width={40} height={22} rx={8} fill="#6B4A2A" />
      <Path d="M44 88 Q60 82 76 88" stroke="#8A6040" strokeWidth={2} fill="none" />
      <Fx kind="tGrow" ox={58.2} oy={86.0}>
        <G>
          <Path d="M60 86 Q58 70 60 56" stroke="#7FBF6A" strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Ellipse cx={53} cy={62} rx={7} ry={3.6} fill="#8FD08A" transform="rotate(-30 53 62)" />
          <Ellipse cx={67} cy={58} rx={7} ry={3.6} fill="#8FD08A" transform="rotate(30 67 58)" />
        </G>
      </Fx>
      <Rect x={42} y={26} width={36} height={12} rx={3} fill="#C9A06A" />
      <Path d="M46 30 H74 M46 34 H74" stroke="#A88050" strokeWidth={1} />
      <Path d="M44 44 L44 70" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    </>
  );
}

function OliveBranchVase() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={22} ry={4} fill="#000" opacity={0.35} />
      <Fx kind="tSway" ox={61.0} oy={70.0}>
        <G>
          <Path d="M60 70 Q50 40 34 22 M60 70 Q66 40 84 18 M60 70 Q62 46 58 26" stroke="#7A6A4A" strokeWidth={2} fill="none" />
          <Ellipse cx={42} cy={34} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(-40 42 34)" />
          <Ellipse cx={38} cy={26} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(20 38 26)" />
          <Ellipse cx={50} cy={50} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(30 50 50)" />
          <Ellipse cx={76} cy={30} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(40 76 30)" />
          <Ellipse cx={82} cy={22} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(-20 82 22)" />
          <Ellipse cx={70} cy={46} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(-30 70 46)" />
          <Ellipse cx={56} cy={32} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(70 56 32)" />
          <Ellipse cx={60} cy={40} rx={7} ry={2.8} fill="#8DAA62" transform="rotate(-60 60 40)" />
          <Circle cx={46} cy={40} r={2.6} fill="#4A5A2A" />
          <Circle cx={74} cy={38} r={2.6} fill="#4A5A2A" />
        </G>
      </Fx>
      <Path d="M46 66 Q42 88 50 108 L70 108 Q78 88 74 66 Z" fill="#5A7A9A" />
      <Path d="M44 66 H76" stroke="#7A9ABA" strokeWidth={4} strokeLinecap="round" />
      <Path d="M50 82 Q60 88 70 82" stroke="#E6EEF8" strokeWidth={1.6} fill="none" opacity={0.6} />
    </>
  );
}

function LoavesFishesBasket() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={34} ry={4} fill="#000" opacity={0.35} />
      <Fx kind="tBob">
        <G>
          <Ellipse cx={44} cy={68} rx={18} ry={11} fill="#D9A04E" />
          <Path d="M34 64 L38 72 M42 62 L46 70 M50 62 L54 70" stroke="#A8702E" strokeWidth={2} strokeLinecap="round" />
          <Ellipse cx={74} cy={64} rx={16} ry={10} fill="#E8B862" />
          <Path d="M66 60 L70 68 M74 58 L78 66" stroke="#A8702E" strokeWidth={2} strokeLinecap="round" />
          <G transform="rotate(-30 88 60)">
            <Ellipse cx={88} cy={60} rx={12} ry={5} fill="#8EC9F0" />
            <Path d="M100 60 L106 55 L106 65 Z" fill="#8EC9F0" />
            <Circle cx={82} cy={59} r={1.3} fill="#1A2230" />
          </G>
          <G transform="rotate(30 30 60)">
            <Ellipse cx={30} cy={60} rx={11} ry={4.6} fill="#B5DCF0" />
            <Path d="M19 60 L13 55 L13 65 Z" fill="#B5DCF0" />
          </G>
        </G>
      </Fx>
      <Path d="M22 72 L98 72 L90 106 L30 106 Z" fill="#B5824A" />
      <Path d="M24 80 H96 M26 88 H94 M28 96 H92" stroke="#8A5A3C" strokeWidth={2} />
      <Path d="M40 72 V106 M60 72 V106 M80 72 V106" stroke="#8A5A3C" strokeWidth={1.4} />
      <Rect x={20} y={68} width={80} height={7} rx={3.5} fill="#C9944E" />
    </>
  );
}

function ShepherdLambPlush() {
  return (
    <>
      <Ellipse cx={64} cy={110} rx={30} ry={4} fill="#000" opacity={0.35} />
      <Path d="M30 108 L30 30 Q30 14 44 14 Q56 14 56 26" stroke="#8A5A3C" strokeWidth={4} fill="none" strokeLinecap="round" />
      <G fill="#F7F2E8">
        <Circle cx={60} cy={84} r={12} />
        <Circle cx={72} cy={78} r={13} />
        <Circle cx={84} cy={84} r={12} />
        <Circle cx={66} cy={94} r={12} />
        <Circle cx={80} cy={94} r={12} />
        <Circle cx={72} cy={88} r={14} />
      </G>
      <Rect x={62} y={100} width={5} height={9} rx={2} fill="#3A3030" />
      <Rect x={78} y={100} width={5} height={9} rx={2} fill="#3A3030" />
      <Fx kind="tNod">
        <G>
          <Ellipse cx={94} cy={68} rx={9} ry={10} fill="#3A3030" />
          <G fill="#F7F2E8">
            <Circle cx={90} cy={58} r={5} />
            <Circle cx={96} cy={57} r={5} />
          </G>
          <Ellipse cx={84} cy={66} rx={5} ry={3} fill="#3A3030" transform="rotate(-20 84 66)" />
          <Fx kind="blink" ox={91.0} oy={68.0}>
            <Circle cx={91} cy={68} r={1.4} fill="#FFFFFF" />
          </Fx>
          <Fx kind="blink" ox={97.0} oy={68.0}>
            <Circle cx={97} cy={68} r={1.4} fill="#FFFFFF" />
          </Fx>
        </G>
      </Fx>
      <Path d="M64 76 Q72 82 80 76" stroke="#E86A8A" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  );
}

function QuillPrayerJournal() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={40} ry={4} fill="#000" opacity={0.35} />
      <Path d="M14 96 L58 104 L58 64 L18 58 Z" fill="#F3EBDD" />
      <Path d="M106 96 L62 104 L62 64 L102 58 Z" fill="#FAF6EE" />
      <Path d="M58 64 L62 64 L62 104 L58 104 Z" fill="#C9B89A" />
      <Path d="M22 70 L52 74 M22 78 L52 82 M22 86 L46 89 M68 74 L96 70 M68 82 L94 78" stroke="#B5A88A" strokeWidth={1.4} />
      <DashFlow kind="inkT" d="M68 90 Q74 86 78 90 T88 88" stroke="#3E4A7A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Fx kind="tWrite" ox={89.0} oy={92.0}>
        <G>
          <Path d="M90 86 Q100 50 112 22 Q104 50 92 86 Z" fill="#F2F5FA" stroke="#C9C0AF" strokeWidth={1} />
          <Path d="M91 86 L89 92" stroke="#C9A24B" strokeWidth={2} />
          <Path d="M96 70 L104 64 M98 62 L106 54 M100 54 L108 44" stroke="#C9C0AF" strokeWidth={1} />
        </G>
      </Fx>
      <Rect x={22} y={94} width={14} height={12} rx={3} fill="#2A3460" />
      <Rect x={25} y={90} width={8} height={5} fill="#4A4A54" />
    </>
  );
}

function SevenbellChime() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={20} ry={4} fill="#000" opacity={0.35} />
      <Path d="M60 4 L60 14" stroke="#9A9AA6" strokeWidth={1.6} />
      <Rect x={26} y={14} width={68} height={7} rx={3.5} fill="#8A5A3C" />
      <Fx kind="tChime" ox={60} oy={21}>
        <G>
          <Path d="M32 21 L32 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={29} y={30} width={6} height={46} rx={3} fill="#C9D7EA" />
        </G>
      </Fx>
      <Fx kind="tChime" delay={300} ox={60} oy={21}>
        <G>
          <Path d="M41 21 L41 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={38} y={30} width={6} height={54} rx={3} fill="#E6EEF8" />
        </G>
      </Fx>
      <Fx kind="tChime" delay={600} ox={60} oy={21}>
        <G>
          <Path d="M50 21 L50 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={47} y={30} width={6} height={62} rx={3} fill="#C9D7EA" />
        </G>
      </Fx>
      <Fx kind="tChime" ox={60} oy={21}>
        <G>
          <Path d="M60 21 L60 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={57} y={30} width={6} height={70} rx={3} fill="#E6EEF8" />
        </G>
      </Fx>
      <Fx kind="tChime" delay={300} ox={60} oy={21}>
        <G>
          <Path d="M70 21 L70 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={67} y={30} width={6} height={62} rx={3} fill="#C9D7EA" />
        </G>
      </Fx>
      <Fx kind="tChime" delay={600} ox={60} oy={21}>
        <G>
          <Path d="M79 21 L79 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={76} y={30} width={6} height={54} rx={3} fill="#E6EEF8" />
        </G>
      </Fx>
      <Fx kind="tChime" ox={60} oy={21}>
        <G>
          <Path d="M88 21 L88 30" stroke="#C9C0AF" strokeWidth={1} />
          <Rect x={85} y={30} width={6} height={46} rx={3} fill="#C9D7EA" />
        </G>
      </Fx>
      <Fx kind="tChime" delay={300} ox={60} oy={21}>
        <G>
          <Path d="M60 21 L60 76" stroke="#C9C0AF" strokeWidth={1} />
          <Circle cx={60} cy={80} r={4} fill="#C9A24B" />
          <Path d="M56 88 L64 88 L60 100 Z" fill="#8FC6A9" />
        </G>
      </Fx>
      <G transform="translate(18 56)">
        <Fx kind="tNote">
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#C9D7EA" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#C9D7EA" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#C9D7EA" />
          </G>
        </Fx>
      </G>
      <G transform="translate(100 46)">
        <Fx kind="tNote" delay={1000}>
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#C9D7EA" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#C9D7EA" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#C9D7EA" />
          </G>
        </Fx>
      </G>
    </>
  );
}

function LilyOfTheField() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={20} ry={4} fill="#000" opacity={0.35} />
      <Fx kind="tSway" ox={61.0} oy={84.0}>
        <G>
          <Path d="M60 84 Q58 56 62 32" stroke="#6E9B4E" strokeWidth={3} fill="none" />
          <Path d="M58 76 Q40 66 36 50 Q50 60 60 72 Z M62 70 Q80 60 86 46 Q72 54 60 66 Z" fill="#7FBF6A" />
          <G transform="translate(62 30)">
            <Path d="M0 0 Q-16 -6 -20 -20 Q-8 -14 0 -6 Z" fill="#FFFFFF" />
            <Path d="M0 0 Q16 -6 20 -20 Q8 -14 0 -6 Z" fill="#F7F2E8" />
            <Path d="M0 2 Q-6 -16 0 -28 Q6 -16 0 2 Z" fill="#FFFFFF" />
            <Path d="M0 -4 L-3 -14 M0 -4 L3 -14" stroke="#F2A93B" strokeWidth={1.4} />
            <Circle cx={-3} cy={-15} r={1.6} fill="#E8913A" />
            <Circle cx={3} cy={-15} r={1.6} fill="#E8913A" />
          </G>
        </G>
      </Fx>
      <Path d="M42 84 L78 84 L72 108 L48 108 Z" fill="#C9702E" />
      <Rect x={40} y={80} width={40} height={8} rx={3} fill="#D9824A" />
    </>
  );
}

function HourglassOfStillness() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={26} ry={4} fill="#000" opacity={0.35} />
      <Rect x={34} y={12} width={52} height={8} rx={3} fill="#8A5A3C" />
      <Rect x={34} y={100} width={52} height={8} rx={3} fill="#8A5A3C" />
      <Path d="M38 20 L38 100 M82 20 L82 100" stroke="#A8784E" strokeWidth={4} />
      <Path d="M44 20 Q44 48 58 60 Q44 72 44 100 L76 100 Q76 72 62 60 Q76 48 76 20 Z" fill="#E6F4FF" opacity={0.22} stroke="#E6F4FF" strokeWidth={1.4} />
      <Fx kind="tSandT" ox={60.0} oy={58.0}>
        <G>
          <Path d="M47 30 L73 30 Q72 46 60 58 Q48 46 47 30 Z" fill="#E8C27A" />
        </G>
      </Fx>
      <DashFlow kind="streamT" d="M60 58 L60 98" stroke="#E8C27A" strokeWidth={1.6} />
      <Fx kind="tSandB" ox={60.0} oy={98.0}>
        <G>
          <Path d="M46 98 Q60 76 74 98 Z" fill="#E8C27A" />
        </G>
      </Fx>
    </>
  );
}

function DoveMusicBox() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={34} ry={4} fill="#000" opacity={0.35} />
      <Rect x={28} y={70} width={64} height={36} rx={4} fill="#8E2A24" />
      <Rect x={28} y={70} width={64} height={7} fill="#A8382E" />
      <Path d="M28 88 H92" stroke="#C9A24B" strokeWidth={2} />
      <Circle cx={60} cy={96} r={3} fill="#C9A24B" />
      <Ellipse cx={60} cy={70} rx={22} ry={4} fill="#C9A24B" />
      <Fx kind="tSpinY" ox={61.5} oy={51.0}>
        <G>
          <Path d="M60 66 L60 60" stroke="#C9A24B" strokeWidth={2} />
          <Path d="M44 50 Q52 40 62 46 Q68 36 80 36 Q72 44 72 50 Q70 60 56 60 Q48 60 44 50 Z" fill="#F7F5F0" />
          <Path d="M62 48 Q70 40 84 46 Q74 50 66 54 Z" fill="#E6E1D7" />
          <Circle cx={50} cy={50} r={1.4} fill="#1A2230" />
          <Path d="M44 50 L39 51 L44 53 Z" fill="#E8913A" />
        </G>
      </Fx>
      <G transform="translate(18 50)">
        <Fx kind="tNote">
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#F2C462" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#F2C462" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#F2C462" />
          </G>
        </Fx>
      </G>
      <G transform="translate(98 40)">
        <Fx kind="tNote" delay={1000}>
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#F2C462" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#F2C462" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#F2C462" />
          </G>
        </Fx>
      </G>
      <G transform="translate(26 30)">
        <Fx kind="tNote" delay={2000}>
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#F2C462" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#F2C462" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#F2C462" />
          </G>
        </Fx>
      </G>
    </>
  );
}

function NightWatchLantern() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={22} ry={4} fill="#000" opacity={0.35} />
      <Path d="M60 4 L60 12" stroke="#9A9AA6" strokeWidth={1.6} />
      <Circle cx={60} cy={16} r={5} fill="none" stroke="#4A4A54" strokeWidth={2.4} />
      <Path d="M44 24 L76 24 L70 18 L50 18 Z" fill="#3A3A44" />
      <Rect x={42} y={24} width={36} height={58} rx={4} fill="#FFE2A0" opacity={0.35} />
      <Fx kind="tFlicker" ox={60.0} oy={68.0}>
        <G>
          <Path d="M60 40 Q70 56 60 68 Q50 56 60 40 Z" fill="#F2A93B" />
          <Path d="M60 52 Q64 60 60 66 Q56 60 60 52 Z" fill="#FFF1C4" />
        </G>
      </Fx>
      <Path d="M42 24 V82 M78 24 V82 M60 24 V36 M60 72 V82" stroke="#3A3A44" strokeWidth={3} />
      <Path d="M38 82 L82 82 L78 92 L42 92 Z" fill="#3A3A44" />
      <Fx kind="tOrbit5" ox={60} oy={54}>
        <G>
          <Circle cx={60} cy={24} r={2} fill="#F7F2E8" />
          <Circle cx={88} cy={54} r={1.6} fill="#F7F2E8" />
        </G>
      </Fx>
    </>
  );
}

function PsalmHarp() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={26} ry={4} fill="#000" opacity={0.35} />
      <Path d="M36 104 L36 22 Q36 10 50 14 Q76 22 88 52 Q92 64 84 72 L44 104 Z" fill="none" stroke="#C9A24B" strokeWidth={6} strokeLinejoin="round" />
      <Path d="M36 22 Q36 10 50 14" stroke="#F2C462" strokeWidth={3} fill="none" />
      <Fx kind="tPluck" ox={44.0} oy={58.0}>
        <Path d="M44 18 L44 98" stroke="#F7F2E8" strokeWidth={1.3} />
      </Fx>
      <Fx kind="tPluck" delay={300} ox={52.0} oy={55.0}>
        <Path d="M52 18 L52 92" stroke="#F7F2E8" strokeWidth={1.3} />
      </Fx>
      <Fx kind="tPluck" delay={600} ox={60.0} oy={54.0}>
        <Path d="M60 22 L60 86" stroke="#F7F2E8" strokeWidth={1.3} />
      </Fx>
      <Fx kind="tPluck" ox={68.0} oy={53.5}>
        <Path d="M68 28 L68 79" stroke="#F7F2E8" strokeWidth={1.3} />
      </Fx>
      <Fx kind="tPluck" delay={300} ox={76.0} oy={54.5}>
        <Path d="M76 36 L76 73" stroke="#F7F2E8" strokeWidth={1.3} />
      </Fx>
      <Fx kind="tPluck" delay={600} ox={83.0} oy={58.0}>
        <Path d="M83 48 L83 68" stroke="#F7F2E8" strokeWidth={1.3} />
      </Fx>
      <G transform="translate(98 30)">
        <Fx kind="tNote">
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#F7F2E8" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#F7F2E8" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#F7F2E8" />
          </G>
        </Fx>
      </G>
      <G transform="translate(14 40)">
        <Fx kind="tNote" delay={1000}>
          <G>
            <Path d="M0 0 L0 -10 L6 -12 L6 -2" stroke="#F7F2E8" strokeWidth={1.6} fill="none" />
            <Ellipse cx={-2} cy={0} rx={2.6} ry={2} fill="#F7F2E8" />
            <Ellipse cx={4} cy={-2} rx={2.6} ry={2} fill="#F7F2E8" />
          </G>
        </Fx>
      </G>
    </>
  );
}

function GoldenPotOfManna() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={24} ry={4} fill="#000" opacity={0.35} />
      <G transform="translate(40 6)">
        <Fx kind="tManna">
          <Circle r={2.2} fill="#FFFFFF" />
        </Fx>
      </G>
      <G transform="translate(60 0)">
        <Fx kind="tManna" delay={750}>
          <Circle r={2.2} fill="#FFFFFF" />
        </Fx>
      </G>
      <G transform="translate(78 8)">
        <Fx kind="tManna" delay={1500}>
          <Circle r={2.2} fill="#FFFFFF" />
        </Fx>
      </G>
      <G transform="translate(50 14)">
        <Fx kind="tManna" delay={2250}>
          <Circle r={2.2} fill="#FFFFFF" />
        </Fx>
      </G>
      <G transform="translate(70 2)">
        <Fx kind="tManna">
          <Circle r={2.2} fill="#FFFFFF" />
        </Fx>
      </G>
      <G transform="translate(88 12)">
        <Fx kind="tManna" delay={750}>
          <Circle r={2.2} fill="#FFFFFF" />
        </Fx>
      </G>
      <Path d="M38 56 Q34 92 48 106 L72 106 Q86 92 82 56 Z" fill="#E8B862" />
      <Path d="M38 56 Q34 92 48 106 L54 106 Q42 90 46 56 Z" fill="#F2C462" opacity={0.7} />
      <Rect x={32} y={50} width={56} height={8} rx={4} fill="#C9A24B" />
      <Ellipse cx={60} cy={50} rx={24} ry={4} fill="#F7F2E8" />
      <Path d="M42 74 Q60 82 78 74" stroke="#C9A24B" strokeWidth={2} fill="none" />
      <G transform="translate(84 70) scale(0.8)">
        <Fx kind="tTwinkle" delay={800} ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFF1C4" />
        </Fx>
      </G>
    </>
  );
}

function HarborLighthouse() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={30} ry={4} fill="#000" opacity={0.35} />
      <Fx kind="tBeam" ox={60} oy={26}>
        <G>
          <Path d="M60 26 L4 14 L4 40 Z" fill="#FFF1C4" opacity={0.35} />
          <Path d="M60 26 L116 14 L116 40 Z" fill="#FFF1C4" opacity={0.35} />
        </G>
      </Fx>
      <Path d="M46 100 L52 38 L68 38 L74 100 Z" fill="#F3EBDD" />
      <Path d="M49 72 L71 72 L72 84 L48 84 Z M51 50 L69 50 L70 60 L50 60 Z" fill="#C9433A" />
      <Rect x={48} y={32} width={24} height={6} fill="#3A3A44" />
      <Rect x={52} y={20} width={16} height={12} fill="#FFE2A0" />
      <Path d="M50 20 L60 10 L70 20 Z" fill="#C9433A" />
      <Fx kind="tWave">
        <Path d="M10 104 Q22 98 34 104 T58 104 T82 104 T110 104 L110 112 L10 112 Z" fill="#3E6FC8" />
      </Fx>
    </>
  );
}

function FishersNet() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={34} ry={4} fill="#000" opacity={0.35} />
      <Path d="M20 12 L100 12" stroke="#8A5A3C" strokeWidth={5} strokeLinecap="round" />
      <Path d="M24 14 Q20 60 34 104 Q60 112 86 104 Q100 60 96 14" fill="#1A3A5A" opacity={0.35} />
      <Path d="M28 14 Q24 60 44 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M37 14 Q34 60 48 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M46 14 Q44 60 53 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M55 14 Q54 60 57 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M64 14 Q64 60 62 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M73 14 Q74 60 66 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M82 14 Q84 60 71 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M91 14 Q94 60 75 106" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M24 24 Q60 30 95 24" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M25 36 Q60 42 94 36" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M26 48 Q60 54 93 48" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M26 60 Q60 66 93 60" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M27 72 Q60 78 92 72" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M28 84 Q60 90 91 84" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Path d="M28 96 Q60 102 91 96" stroke="#C9B89A" strokeWidth={1} fill="none" />
      <Fx kind="tSwim">
        <G>
          <Path d="M40 60 Q50 54 58 60 Q50 66 40 60 Z M58 60 L64 56 L64 64 Z" fill="#F2A93B" />
        </G>
      </Fx>
      <Fx kind="tSwim" dur={8400} delay={2400}>
        <G>
          <Path d="M60 84 Q70 78 78 84 Q70 90 60 84 Z M78 84 L84 80 L84 88 Z" fill="#8EC9F0" />
        </G>
      </Fx>
      <Fx kind="tSwim" dur={6000} delay={4000}>
        <G>
          <Path d="M44 36 Q52 32 58 36 Q52 40 44 36 Z M58 36 L62 33 L62 39 Z" fill="#F7C6D6" />
        </G>
      </Fx>
    </>
  );
}

function ChapelSnowGlobe() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={34} ry={4} fill="#000" opacity={0.35} />
      <Defs>
        <ClipPath id="tgClip">
          <Circle cx={60} cy={54} r={36} />
        </ClipPath>
      </Defs>
      <Circle cx={60} cy={54} r={38} fill="#1A2A4A" />
      <G clipPath="url(#tgClip)">
        <Ellipse cx={60} cy={88} rx={40} ry={10} fill="#F2F6FC" />
        <Rect x={48} y={58} width={24} height={26} fill="#F3EBDD" />
        <Path d="M44 60 L60 46 L76 60 Z" fill="#8E2A24" />
        <Rect x={55} y={70} width={10} height={14} rx={5} fill="#F2C462" />
        <Path d="M60 32 L60 46 M55 37 L65 37" stroke="#F2C462" strokeWidth={2} />
        <Path d="M30 84 L36 66 L42 84 Z M80 84 L86 68 L92 84 Z" fill="#2E5A4A" />
        <Fx kind="tOrbit7" ox={60} oy={54}>
          <G fill="#FFFFFF">
            <Circle cx={36} cy={30} r={1.6} />
            <Circle cx={52} cy={22} r={1.6} />
            <Circle cx={78} cy={28} r={1.6} />
            <Circle cx={88} cy={46} r={1.6} />
            <Circle cx={30} cy={52} r={1.6} />
            <Circle cx={70} cy={40} r={1.6} />
            <Circle cx={44} cy={44} r={1.6} />
            <Circle cx={84} cy={66} r={1.6} />
            <Circle cx={36} cy={70} r={1.6} />
            <Circle cx={64} cy={24} r={1.6} />
          </G>
        </Fx>
      </G>
      <Circle cx={60} cy={54} r={37} fill="none" stroke="#E6F4FF" strokeWidth={2} opacity={0.7} />
      <Path d="M34 36 Q40 24 52 20" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M30 90 L90 90 L96 108 L24 108 Z" fill="#6B4A2A" />
      <Rect x={40} y={96} width={40} height={6} rx={2} fill="#C9A24B" />
    </>
  );
}

function RoseWindowSuncatcher() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={24} ry={4} fill="#000" opacity={0.35} />
      <Path d="M60 2 L60 16" stroke="#C9C0AF" strokeWidth={1.2} />
      <Fx kind="tOrbit30" ox={60} oy={56}>
        <G>
          <Fx kind="tGlass">
            <Path d="M60 56 L98.0 56.0 A38 38 0 0 1 86.9 82.9 Z" fill="#C9433A" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass" delay={1000}>
            <Path d="M60 56 L86.9 82.9 A38 38 0 0 1 60.0 94.0 Z" fill="#3E6FC8" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass" delay={2000}>
            <Path d="M60 56 L60.0 94.0 A38 38 0 0 1 33.2 82.9 Z" fill="#F2C462" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass">
            <Path d="M60 56 L33.2 82.9 A38 38 0 0 1 22.0 56.1 Z" fill="#5FBF8A" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass" delay={1000}>
            <Path d="M60 56 L22.0 56.1 A38 38 0 0 1 33.1 29.2 Z" fill="#C9433A" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass" delay={2000}>
            <Path d="M60 56 L33.1 29.2 A38 38 0 0 1 59.9 18.0 Z" fill="#3E6FC8" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass">
            <Path d="M60 56 L59.9 18.0 A38 38 0 0 1 86.8 29.1 Z" fill="#F2C462" opacity={0.85} />
          </Fx>
          <Fx kind="tGlass" delay={1000}>
            <Path d="M60 56 L86.8 29.1 A38 38 0 0 1 98.0 55.9 Z" fill="#B98AF0" opacity={0.85} />
          </Fx>
          <Path d="M60 56 L98.0 56.0" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L86.9 82.9" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L60.0 94.0" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L33.2 82.9" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L22.0 56.1" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L33.1 29.2" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L59.9 18.0" stroke="#2A2A30" strokeWidth={2.4} />
          <Path d="M60 56 L86.8 29.1" stroke="#2A2A30" strokeWidth={2.4} />
        </G>
      </Fx>
      <Circle cx={60} cy={56} r={38} fill="none" stroke="#C9A24B" strokeWidth={4} />
      <Circle cx={60} cy={56} r={22} fill="none" stroke="#2A2A30" strokeWidth={2.4} />
      <Circle cx={60} cy={56} r={9} fill="#FFF1C4" stroke="#2A2A30" strokeWidth={2.4} />
      <G transform="translate(96 22) scale(1)">
        <Fx kind="tTwinkle" ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFF1C4" />
        </Fx>
      </G>
      <G transform="translate(22 92) scale(0.8)">
        <Fx kind="tTwinkle" delay={800} ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#F7C6D6" />
        </Fx>
      </G>
    </>
  );
}

function ArkInABottle() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={46} ry={4} fill="#000" opacity={0.35} />
      <Ellipse cx={56} cy={70} rx={46} ry={30} fill="#BFE0F0" opacity={0.2} stroke="#DCEFF7" strokeWidth={2} />
      <Path d="M102 62 L112 62 L112 78 L102 78 Z" fill="#C9A06A" />
      <Path d="M14 80 Q24 74 34 80 T54 80 T74 80 T98 80 Q96 94 56 98 Q18 96 14 80 Z" fill="#3E6FC8" opacity={0.85} />
      <Fx kind="tRock" ox={63.0} oy={90.0}>
        <G>
          <Path d="M32 78 L80 78 L74 90 L38 90 Z" fill="#8A5A3C" />
          <Rect x={42} y={66} width={28} height={12} fill="#B5824A" />
          <Path d="M40 66 L56 56 L72 66 Z" fill="#6B4A2A" />
          <Rect x={52} y={70} width={6} height={5} fill="#FFE2A0" />
          <Path d="M76 54 Q80 50 84 53 Q88 50 90 52 Q86 56 82 57 Z" fill="#FFFFFF" />
          <Path d="M88 52 Q92 48 94 52" stroke="#6E9B4E" strokeWidth={1.4} fill="none" />
        </G>
      </Fx>
      <Path d="M24 54 Q36 44 54 42" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d="M24 50 A30 30 0 0 1 88 50" stroke="#F2A7C0" strokeWidth={1.6} fill="none" opacity={0.6} />
    </>
  );
}

function GalaxyPromiseJar() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={26} ry={4} fill="#000" opacity={0.35} />
      <Rect x={34} y={28} width={52} height={80} rx={12} fill="#151A40" />
      <Fx kind="tNebula">
        <Path d="M38 84 Q60 60 82 72 Q70 50 40 58 Z" fill="#B98AF0" opacity={0.4} />
      </Fx>
      <Path d="M40 44 Q62 54 80 40" stroke="#6E9BEA" strokeWidth={6} fill="none" opacity={0.35} />
      <Fx kind="tTwinkle" ox={44.0} oy={40.0}>
        <Circle cx={44} cy={40} r={1.4} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" delay={800} ox={70.0} oy={36.0}>
        <Circle cx={70} cy={36} r={1} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" delay={1600} ox={52.0} oy={60.0}>
        <Circle cx={52} cy={60} r={1.8} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" ox={76.0} oy={58.0}>
        <Circle cx={76} cy={58} r={1.2} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" delay={800} ox={46.0} oy={82.0}>
        <Circle cx={46} cy={82} r={1} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" delay={1600} ox={66.0} oy={92.0}>
        <Circle cx={66} cy={92} r={1.6} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" ox={78.0} oy={86.0}>
        <Circle cx={78} cy={86} r={1} fill="#FFF1C4" />
      </Fx>
      <Fx kind="tTwinkle" delay={800} ox={58.0} oy={74.0}>
        <Circle cx={58} cy={74} r={1} fill="#FFF1C4" />
      </Fx>
      <G transform="translate(62 48) scale(0.9)">
        <Fx kind="tTwinkle" ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFF1C4" />
        </Fx>
      </G>
      <Rect x={34} y={28} width={52} height={80} rx={12} fill="none" stroke="#DCEFF7" strokeWidth={2} opacity={0.7} />
      <Rect x={38} y={18} width={44} height={12} rx={3} fill="#C9D7EA" />
      <Path d="M42 22 H78 M42 26 H78" stroke="#9AA8BA" strokeWidth={1} />
      <Path d="M40 40 L40 70" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
    </>
  );
}

function CovenantPrism() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={30} ry={4} fill="#000" opacity={0.35} />
      <Path d="M4 64 L48 60" stroke="#FFFFFF" strokeWidth={3} opacity={0.8} />
      <Fx kind="tFan" ox={64.0} oy={54.0}>
        <G>
          <Path d="M64 60 L116 30 L116 38 Z" fill="#E8735F" opacity={0.75} />
          <Path d="M64 60 L116 38 L116 46 Z" fill="#F2934A" opacity={0.75} />
          <Path d="M64 60 L116 46 L116 54 Z" fill="#F2C462" opacity={0.75} />
          <Path d="M64 60 L116 54 L116 62 Z" fill="#8FD08A" opacity={0.75} />
          <Path d="M64 60 L116 62 L116 70 Z" fill="#6E9BEA" opacity={0.75} />
          <Path d="M64 60 L116 70 L116 78 Z" fill="#B98AF0" opacity={0.75} />
        </G>
      </Fx>
      <Path d="M60 30 L88 90 L32 90 Z" fill="#E6F4FF" opacity={0.4} stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M60 38 L48 80" stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />
      <Rect x={28} y={90} width={64} height={16} rx={3} fill="#8A5A3C" />
    </>
  );
}

function UnburntBushBonsai() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={30} ry={4} fill="#000" opacity={0.35} />
      <Circle cx={60} cy={48} r={34} fill="#F2934A" opacity={0.1} />
      <Path d="M60 86 Q56 72 62 62 Q52 56 48 48 M62 62 Q70 56 74 50" stroke="#6B4A2A" strokeWidth={5} fill="none" strokeLinecap="round" />
      <G fill="#5E8B3E">
        <Ellipse cx={46} cy={46} rx={16} ry={10} />
        <Ellipse cx={76} cy={46} rx={16} ry={10} />
        <Ellipse cx={60} cy={36} rx={18} ry={11} />
      </G>
      <G transform="translate(40 42)">
        <Fx kind="tFlicker" ox={0.0} oy={2.0}>
          <G>
            <Path d="M0 -18 Q8 -6 0 2 Q-8 -6 0 -18 Z" fill="#F2934A" />
            <Path d="M0 -10 Q4 -4 0 0 Q-4 -4 0 -10 Z" fill="#FFF1C4" />
          </G>
        </Fx>
      </G>
      <G transform="translate(60 32)">
        <Fx kind="tFlicker" delay={400} ox={0.0} oy={2.0}>
          <G>
            <Path d="M0 -18 Q8 -6 0 2 Q-8 -6 0 -18 Z" fill="#F2934A" />
            <Path d="M0 -10 Q4 -4 0 0 Q-4 -4 0 -10 Z" fill="#FFF1C4" />
          </G>
        </Fx>
      </G>
      <G transform="translate(80 42)">
        <Fx kind="tFlicker" delay={800} ox={0.0} oy={2.0}>
          <G>
            <Path d="M0 -18 Q8 -6 0 2 Q-8 -6 0 -18 Z" fill="#F2934A" />
            <Path d="M0 -10 Q4 -4 0 0 Q-4 -4 0 -10 Z" fill="#FFF1C4" />
          </G>
        </Fx>
      </G>
      <G transform="translate(50 30)">
        <Fx kind="tFlicker" ox={0.0} oy={2.0}>
          <G>
            <Path d="M0 -18 Q8 -6 0 2 Q-8 -6 0 -18 Z" fill="#F2934A" />
            <Path d="M0 -10 Q4 -4 0 0 Q-4 -4 0 -10 Z" fill="#FFF1C4" />
          </G>
        </Fx>
      </G>
      <G transform="translate(70 30)">
        <Fx kind="tFlicker" delay={400} ox={0.0} oy={2.0}>
          <G>
            <Path d="M0 -18 Q8 -6 0 2 Q-8 -6 0 -18 Z" fill="#F2934A" />
            <Path d="M0 -10 Q4 -4 0 0 Q-4 -4 0 -10 Z" fill="#FFF1C4" />
          </G>
        </Fx>
      </G>
      <Fx kind="tEmber">
        <Circle cx={46} cy={20} r={1.4} fill="#F2C462" />
      </Fx>
      <Fx kind="tEmber" delay={800}>
        <Circle cx={62} cy={20} r={1.4} fill="#F2C462" />
      </Fx>
      <Fx kind="tEmber" delay={1600}>
        <Circle cx={76} cy={20} r={1.4} fill="#F2C462" />
      </Fx>
      <Path d="M36 86 L84 86 L78 106 L42 106 Z" fill="#3E5A7A" />
      <Rect x={32} y={82} width={56} height={7} rx={3} fill="#5A7A9A" />
    </>
  );
}

function JacobsLadderMobile() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={20} ry={4} fill="#000" opacity={0.35} />
      <G fill="#F2F5FA" opacity={0.85}>
        <Ellipse cx={60} cy={14} rx={30} ry={8} />
        <Ellipse cx={46} cy={10} rx={14} ry={7} />
        <Ellipse cx={74} cy={9} rx={14} ry={7} />
      </G>
      <Path d="M44 108 L52 18 M76 108 L68 18" stroke="#C9A24B" strokeWidth={3} />
      <Path d="M44.7 100 L75.3 100" stroke="#E8C27A" strokeWidth={2.4} />
      <Path d="M45.8 88 L74.2 88" stroke="#E8C27A" strokeWidth={2.4} />
      <Path d="M46.8 76 L73.2 76" stroke="#E8C27A" strokeWidth={2.4} />
      <Path d="M47.9 64 L72.1 64" stroke="#E8C27A" strokeWidth={2.4} />
      <Path d="M49.0 52 L71.0 52" stroke="#E8C27A" strokeWidth={2.4} />
      <Path d="M50.1 40 L69.9 40" stroke="#E8C27A" strokeWidth={2.4} />
      <Path d="M51.1 28 L68.9 28" stroke="#E8C27A" strokeWidth={2.4} />
      <G transform="translate(60 104)">
        <Fx kind="tClimb">
          <G>
            <Circle r={3.4} fill="#FFF1C4" />
            <Path d="M-6 -1 Q-3 -5 0 -2 Q3 -5 6 -1" stroke="#FFFFFF" strokeWidth={1.2} fill="none" />
          </G>
        </Fx>
      </G>
      <G transform="translate(60 104)">
        <Fx kind="tClimb" delay={1500}>
          <G>
            <Circle r={3.4} fill="#FFF1C4" />
            <Path d="M-6 -1 Q-3 -5 0 -2 Q3 -5 6 -1" stroke="#FFFFFF" strokeWidth={1.2} fill="none" />
          </G>
        </Fx>
      </G>
      <G transform="translate(60 104)">
        <Fx kind="tClimb" delay={3000}>
          <G>
            <Circle r={3.4} fill="#FFF1C4" />
            <Path d="M-6 -1 Q-3 -5 0 -2 Q3 -5 6 -1" stroke="#FFFFFF" strokeWidth={1.2} fill="none" />
          </G>
        </Fx>
      </G>
      <G transform="translate(18 40) scale(0.8)">
        <Fx kind="tTwinkle" ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFF1C4" />
        </Fx>
      </G>
      <G transform="translate(102 60) scale(0.8)">
        <Fx kind="tTwinkle" delay={800} ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFF1C4" />
        </Fx>
      </G>
    </>
  );
}

function PearlOfGreatPrice() {
  return (
    <>
      <Ellipse cx={60} cy={110} rx={34} ry={4} fill="#000" opacity={0.35} />
      <Path d="M24 80 Q30 104 60 106 Q90 104 96 80 Z" fill="#E8A9B4" />
      <Path d="M30 86 L40 102 M46 82 L50 104 M60 82 L60 106 M74 82 L70 104 M90 86 L80 102" stroke="#D08A98" strokeWidth={1.4} />
      <Circle cx={60} cy={74} r={12} fill="#F7F2E8" />
      <Circle cx={56} cy={70} r={4} fill="#FFFFFF" />
      <Circle cx={60} cy={74} r={12} fill="none" stroke="#E6E0F0" strokeWidth={1.4} />
      <Fx kind="tClam" ox={60.0} oy={80.0}>
        <G>
          <Path d="M24 80 Q24 36 60 34 Q96 36 96 80 Q60 70 24 80 Z" fill="#F2C6D0" />
          <Path d="M60 36 L60 74 M42 42 L36 78 M78 42 L84 78 M50 38 L46 76 M70 38 L74 76" stroke="#E8A9B4" strokeWidth={1.6} />
        </G>
      </Fx>
      <G transform="translate(88 60) scale(1)">
        <Fx kind="tTwinkle" ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFF1C4" />
        </Fx>
      </G>
      <G transform="translate(30 64) scale(0.7)">
        <Fx kind="tTwinkle" delay={800} ox={0.0} oy={0.0}>
          <Path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#FFFFFF" />
        </Fx>
      </G>
    </>
  );
}

export const TRINKET_ART = {
  firstLightCandle: FirstLightCandle,
  olivewoodRosary: OlivewoodRosary,
  mustardSeedJar: MustardSeedJar,
  oliveBranchVase: OliveBranchVase,
  loavesFishesBasket: LoavesFishesBasket,
  shepherdLambPlush: ShepherdLambPlush,
  quillPrayerJournal: QuillPrayerJournal,
  sevenbellChime: SevenbellChime,
  lilyOfTheField: LilyOfTheField,
  hourglassOfStillness: HourglassOfStillness,
  doveMusicBox: DoveMusicBox,
  nightWatchLantern: NightWatchLantern,
  psalmHarp: PsalmHarp,
  goldenPotOfManna: GoldenPotOfManna,
  harborLighthouse: HarborLighthouse,
  fishersNet: FishersNet,
  chapelSnowGlobe: ChapelSnowGlobe,
  roseWindowSuncatcher: RoseWindowSuncatcher,
  arkInABottle: ArkInABottle,
  galaxyPromiseJar: GalaxyPromiseJar,
  covenantPrism: CovenantPrism,
  unburntBushBonsai: UnburntBushBonsai,
  jacobsLadderMobile: JacobsLadderMobile,
  pearlOfGreatPrice: PearlOfGreatPrice,
  ...COLLECTION_KEEPSAKE_ART,
} as const;

export type TrinketId = keyof typeof TRINKET_ART;

/** Name, rarity, goal and tap phrase, in the design's order (commons first, legendaries last). */
export const TRINKET_INFO: Record<TrinketId, { name: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; goal: string; sound: string }> = {
  firstLightCandle: { name: "First Light Candle", rarity: "common", goal: "Pray for the first time", sound: "Amen!" },
  olivewoodRosary: { name: "Olivewood Rosary", rarity: "common", goal: "Pray 7 days in a row", sound: "Hail Mary…" },
  mustardSeedJar: { name: "Mustard Seed Jar", rarity: "common", goal: "Write your first prayer request", sound: "Grow!" },
  oliveBranchVase: { name: "Olive Branch Vase", rarity: "common", goal: "Complete 5 Faith & Daily Life quests", sound: "Peace be with you" },
  loavesFishesBasket: { name: "Loaves & Fishes Basket", rarity: "common", goal: "Complete 5 Love & Service quests", sound: "Enough for all!" },
  shepherdLambPlush: { name: "Shepherd Lamb Plush", rarity: "common", goal: "Complete your first quest", sound: "Baa!" },
  quillPrayerJournal: { name: "Quill & Prayer Journal", rarity: "common", goal: "Journal 5 prayers", sound: "Scribble scribble" },
  sevenbellChime: { name: "Seven-Bell Chime", rarity: "common", goal: "Pray at dawn 3 times", sound: "Ting-a-ling" },
  lilyOfTheField: { name: "Lily of the Field", rarity: "common", goal: "Complete 10 quests", sound: "Breathe…" },
  hourglassOfStillness: { name: "Hourglass of Stillness", rarity: "rare", goal: "Complete quests on 7 different days", sound: "Be still" },
  doveMusicBox: { name: "Dove Music Box", rarity: "rare", goal: "Answer 5 prayer requests", sound: "La la laa" },
  nightWatchLantern: { name: "Night Watch Lantern", rarity: "rare", goal: "Pray after 10pm 3 times", sound: "Keep watch" },
  psalmHarp: { name: "Psalm Harp", rarity: "rare", goal: "Complete 10 Scripture quests", sound: "Strum~" },
  goldenPotOfManna: { name: "Golden Pot of Manna", rarity: "rare", goal: "Pray every day for a week", sound: "Daily bread!" },
  harborLighthouse: { name: "Harbor Lighthouse", rarity: "rare", goal: "Complete 15 Prayer quests", sound: "Shine!" },
  fishersNet: { name: "Fisher's Net", rarity: "rare", goal: "Complete 15 Love & Service quests", sound: "Splash!" },
  chapelSnowGlobe: { name: "Chapel Snow Globe", rarity: "epic", goal: "Pray through Advent", sound: "Shake shake!" },
  roseWindowSuncatcher: { name: "Rose Window Suncatcher", rarity: "epic", goal: "Complete 3 bonus challenges", sound: "Shimmer~" },
  arkInABottle: { name: "Ark in a Bottle", rarity: "epic", goal: "Finish a weekly journey", sound: "All aboard!" },
  galaxyPromiseJar: { name: "Galaxy Promise Jar", rarity: "epic", goal: "Complete 100 quests", sound: "Count the stars!" },
  covenantPrism: { name: "Covenant Prism", rarity: "epic", goal: "Keep a 30-day prayer streak", sound: "A promise!" },
  unburntBushBonsai: { name: "Unburnt Bush Bonsai", rarity: "legendary", goal: "Pray 100 times", sound: "Holy ground!" },
  jacobsLadderMobile: { name: "Jacob's Ladder Mobile", rarity: "legendary", goal: "Pray for 50 different people", sound: "Up we go!" },
  pearlOfGreatPrice: { name: "Pearl of Great Price", rarity: "legendary", goal: "Finish 6 weekly journeys", sound: "Priceless!" },
  ...COLLECTION_KEEPSAKE_INFO,
};
