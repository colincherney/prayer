import React from 'react';
import { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { Fx } from './Fx';

// The Sword of the Spirit's keepsakes (the June event): the armour of God from Ephesians 6. All four come with
// finishing the event's six challenges, straight onto the keepsake shelf (public.user_trinkets). Drawn on the shared
// 120x120 trinket artboard, in the event's colours: ice white #E6F8FF, sky #7FDDF2, deep teal #3FA9C9, gold #D8B45A
// and the hilt's navy #2A3A4E.

function Shadow({ rx = 32 }: { rx?: number }) {
  return <Ellipse cx={60} cy={108} rx={rx} ry={4.5} fill="#000" opacity={0.25} />;
}

const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25} Z`;

/** The belt of truth: a sea-blue leather belt coiled round, a gold buckle with a cyan gem. */
function BeltOfTruth() {
  return (
    <>
      <Shadow rx={36} />
      <Ellipse cx={60} cy={76} rx={40} ry={22} fill="none" stroke="#3F6E8C" strokeWidth={12} />
      <Ellipse cx={60} cy={76} rx={40} ry={22} fill="none" stroke="#D8B45A" strokeWidth={1.6} strokeDasharray="4 6" />
      <Path d="M96 70 Q108 72 106 86 L98 90" stroke="#3F6E8C" strokeWidth={10} fill="none" strokeLinecap="round" />
      <Rect x={44} y={82} width={32} height={24} rx={5} fill="#D8B45A" />
      <Rect x={50} y={88} width={20} height={12} rx={3} fill="#2A3A4E" />
      <Fx kind="breathe" ox={60} oy={94}>
        <Path d="M60 88 L65 94 L60 100 L55 94 Z" fill="#7FDDF2" />
      </Fx>
      <Fx kind="twinkle" delay={300} ox={88} oy={44}>
        <Path d={sparkle(88, 44, 6)} fill="#FFFFFF" />
      </Fx>
    </>
  );
}

/** The breastplate of righteousness: ice-white plate with gold trim and a cross in the middle. */
function Breastplate() {
  return (
    <>
      <Shadow rx={30} />
      <Path d="M30 30 Q60 20 90 30 L94 50 Q92 84 60 102 Q28 84 26 50 Z" fill="#E6F8FF" />
      <Path d="M60 24.5 L60 101 Q92 84 94 50 L90 30 Q76 25.5 60 24.5 Z" fill="#BFEAF6" />
      <Path d="M30 30 Q60 20 90 30 L94 50 Q92 84 60 102 Q28 84 26 50 Z" fill="none" stroke="#D8B45A" strokeWidth={3.5} strokeLinejoin="round" />
      <Path d="M30 30 Q40 40 38 52 M90 30 Q80 40 82 52" stroke="#D8B45A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Fx kind="glow"><Circle cx={60} cy={60} r={16} fill="#7FDDF2" /></Fx>
      <Rect x={57} y={44} width={6} height={32} rx={2} fill="#3FA9C9" />
      <Rect x={48} y={53} width={24} height={6} rx={2} fill="#3FA9C9" />
      <Path d="M38 40 Q44 34 52 34" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  );
}

/** The shield of faith: a round shield of ice and sky with gold rim and rays, quenching the fiery darts. */
function ShieldOfFaith() {
  return (
    <>
      <Shadow rx={34} />
      <Circle cx={60} cy={60} r={42} fill="#D8B45A" />
      <Circle cx={60} cy={60} r={36} fill="#3FA9C9" />
      <Circle cx={60} cy={60} r={28} fill="#7FDDF2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <Rect key={a} x={58.5} y={26} width={3} height={14} rx={1.5} fill="#E6F8FF" opacity={0.85} transform={`rotate(${a} 60 60)`} />
      ))}
      <Fx kind="breathe" ox={60} oy={60}>
        <Circle cx={60} cy={60} r={12} fill="#E6F8FF" />
        <Path d="M60 51 L66 60 L60 69 L54 60 Z" fill="#3FA9C9" />
      </Fx>
      <Path d="M30 44 Q38 28 54 24" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      <Fx kind="twinkle" delay={500} ox={94} oy={24}>
        <Path d={sparkle(94, 24, 6)} fill="#FFFFFF" />
      </Fx>
    </>
  );
}

/** The helmet of salvation: a crested ice helm with a gold halo above it. */
function HelmetOfSalvation() {
  return (
    <>
      <Shadow rx={30} />
      <Fx kind="glow"><Circle cx={60} cy={58} r={36} fill="#7FDDF2" /></Fx>
      <Ellipse cx={60} cy={10} rx={22} ry={5} fill="none" stroke="#D8B45A" strokeWidth={3.5} />
      <Path d="M28 96 L28 60 Q28 30 60 28 Q92 30 92 60 L92 96 L74 96 L74 76 L46 76 L46 96 Z" fill="#E6F8FF" />
      <Path d="M60 28 Q92 30 92 60 L92 96 L74 96 L74 76 L60 76 Z" fill="#BFEAF6" />
      <Path d="M28 96 L28 60 Q28 30 60 28 Q92 30 92 60 L92 96 L74 96 L74 76 L46 76 L46 96 Z" fill="none" stroke="#D8B45A" strokeWidth={3} strokeLinejoin="round" />
      <Rect x={46} y={56} width={28} height={8} rx={3} fill="#2A3A4E" />
      <Rect x={57} y={64} width={6} height={20} rx={2} fill="#2A3A4E" />
      <Path d="M60 29 Q53 22 60 16 Q67 22 60 29 Z" fill="#3FA9C9" />
      <Fx kind="breathe" ox={60} oy={44}>
        <Path d="M60 38 L64 44 L60 50 L56 44 Z" fill="#7FDDF2" stroke="#D8B45A" strokeWidth={1.5} />
      </Fx>
      <Path d="M36 50 Q40 38 50 34" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  );
}

export const SWORD_KEEPSAKE_ART = {
  beltOfTruth: BeltOfTruth,
  breastplate: Breastplate,
  shieldOfFaith: ShieldOfFaith,
  helmetOfSalvation: HelmetOfSalvation,
};

export type SwordKeepsakeId = keyof typeof SWORD_KEEPSAKE_ART;

export const SWORD_KEEPSAKE_INFO: Record<SwordKeepsakeId, { name: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; goal: string; sound: string }> = {
  beltOfTruth: { name: 'Belt of Truth', rarity: 'rare', goal: 'The Sword of the Spirit: finish all six challenges', sound: 'Girt about with truth' },
  breastplate: { name: 'Breastplate of Righteousness', rarity: 'rare', goal: 'The Sword of the Spirit: finish all six challenges', sound: 'Stand therefore' },
  shieldOfFaith: { name: 'Shield of Faith', rarity: 'epic', goal: 'The Sword of the Spirit: finish all six challenges', sound: 'Above all, faith' },
  helmetOfSalvation: { name: 'Helmet of Salvation', rarity: 'legendary', goal: 'The Sword of the Spirit: finish all six challenges', sound: 'The armour of God' },
};

export const SWORD_KEEPSAKE_IDS = Object.keys(SWORD_KEEPSAKE_ART) as SwordKeepsakeId[];
