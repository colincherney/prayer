import React from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Fx } from './Fx';

// The Swamp King's keepsakes. All five come with finishing the event's ten challenges, straight onto the keepsake
// shelf (public.user_trinkets). Drawn on the shared 120x120 trinket artboard.

function Shadow({ rx = 32 }: { rx?: number }) {
  return <Ellipse cx={60} cy={108} rx={rx} ry={4.5} fill="#000" opacity={0.3} />;
}

/** A little iron lantern with a blue wisp of light inside. */
function FenLantern() {
  return (
    <>
      <Shadow rx={26} />
      <Path d="M48 22 Q60 10 72 22" stroke="#4A4A52" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Rect x={42} y={26} width={36} height={8} rx={3} fill="#3A3A42" />
      <Rect x={40} y={34} width={40} height={56} rx={6} fill="#2A2A32" />
      <Rect x={45} y={39} width={30} height={46} rx={4} fill="#1C2A3A" />
      <Fx kind="glow"><Circle cx={60} cy={62} r={26} fill="#6FC3FF" /></Fx>
      <Fx kind="breathe" ox={60} oy={64}>
        <Path d="M60 48 Q70 60 60 74 Q50 60 60 48 Z" fill="#6FC3FF" />
        <Path d="M60 56 Q65 62 60 70 Q55 62 60 56 Z" fill="#D8F0FF" />
      </Fx>
      <Path d="M50 39 L50 85 M70 39 L70 85" stroke="#3A3A42" strokeWidth={2} />
      <Rect x={38} y={90} width={44} height={10} rx={3} fill="#3A3A42" />
    </>
  );
}

/** A simple wooden cross wrapped in a purple Lenten cloth. */
function LentenCross() {
  return (
    <>
      <Shadow rx={22} />
      <Rect x={54} y={14} width={12} height={92} rx={3} fill="#8A6A45" />
      <Rect x={30} y={36} width={60} height={12} rx={3} fill="#8A6A45" />
      <Path d="M54 14 L66 14 L66 106 L54 106 Z" fill="#6E5236" opacity={0.35} />
      <Path d="M44 46 Q60 58 76 46 L80 72 Q60 64 40 72 Z" fill="#6B4AA0" />
      <Path d="M48 52 Q60 60 72 52" stroke="#9A7AD0" strokeWidth={2} fill="none" />
    </>
  );
}

/** Two crossed palm branches from Palm Sunday. */
function PalmBranches() {
  const leaves = (flip: number) => (
    <G transform={`translate(60 104) rotate(${flip * 24}) translate(-60 -104)`}>
      <Path d="M60 104 L60 22" stroke="#5E7A3A" strokeWidth={3} strokeLinecap="round" />
      {[28, 40, 52, 64, 76].map(y => (
        <G key={y}>
          <Path d={`M60 ${y} Q46 ${y + 2} 38 ${y + 12} Q50 ${y + 8} 60 ${y + 6}`} fill="#7FA34A" />
          <Path d={`M60 ${y} Q74 ${y + 2} 82 ${y + 12} Q70 ${y + 8} 60 ${y + 6}`} fill="#6E9440" />
        </G>
      ))}
    </G>
  );
  return (
    <>
      <Shadow rx={28} />
      {leaves(-1)}
      {leaves(1)}
      <Rect x={53} y={92} width={14} height={8} rx={3} fill="#C9A35A" />
    </>
  );
}

/** White Easter lilies in a little clay pot. */
function EasterLilies() {
  const lily = (x: number, y: number, rot: number) => (
    <G transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Path d="M0 0 L-10 -18 L0 -10 L10 -18 Z" fill="#FBF4E6" />
      <Path d="M0 0 L-14 -8 L0 -6 L14 -8 Z" fill="#F2EADB" />
      <Circle cx={0} cy={-6} r={2} fill="#F2C462" />
    </G>
  );
  return (
    <>
      <Shadow rx={26} />
      <Path d="M60 84 L44 48 M60 84 L60 40 M60 84 L76 50" stroke="#5E7A3A" strokeWidth={3} strokeLinecap="round" />
      {lily(44, 48, -18)}
      {lily(60, 40, 0)}
      {lily(76, 50, 18)}
      <Path d="M58 70 Q48 64 44 70 Q50 72 58 70 Z" fill="#7FA34A" />
      <Path d="M62 74 Q74 66 78 72 Q70 76 62 74 Z" fill="#7FA34A" />
      <Path d="M40 84 L80 84 L74 106 L46 106 Z" fill="#B5683A" />
      <Rect x={38} y={80} width={44} height={8} rx={3} fill="#C9784A" />
      <Fx kind="twinkle" delay={500} ox={88} oy={30}>
        <Path d="M88 24 L90 29 L95 30 L90 31 L88 36 L86 31 L81 30 L86 29 Z" fill="#FFF3C4" />
      </Fx>
    </>
  );
}

/** The Old King's gold crown, set with a blue stone and topped with a cross. */
function OldKingsCrown() {
  return (
    <>
      <Shadow rx={34} />
      <Path d="M22 92 L22 50 L40 66 L60 36 L80 66 L98 50 L98 92 Z" fill="#C9A35A" />
      <Path d="M22 92 L22 50 L40 66 L60 36 L80 66 L98 50 L98 92 Z" fill="none" stroke="#9A7A3A" strokeWidth={2} />
      <Rect x={20} y={84} width={80} height={12} rx={3} fill="#B08A44" />
      <Circle cx={40} cy={90} r={3.5} fill="#6FC3FF" />
      <Circle cx={60} cy={90} r={4.5} fill="#6FC3FF" />
      <Circle cx={80} cy={90} r={3.5} fill="#6FC3FF" />
      <Rect x={57} y={18} width={6} height={20} rx={2} fill="#E9C46A" />
      <Rect x={51} y={24} width={18} height={6} rx={2} fill="#E9C46A" />
      <Polygon points="34,58 40,66 46,58" fill="#3E6B4A" opacity={0.5} />
      <Fx kind="twinkle" delay={300} ox={60} oy={60}>
        <Path d="M60 54 L62 58 L66 60 L62 62 L60 66 L58 62 L54 60 L58 58 Z" fill="#FFFFFF" />
      </Fx>
    </>
  );
}

export const SWAMP_KEEPSAKE_ART = {
  fenLantern: FenLantern,
  lentenCross: LentenCross,
  palmBranches: PalmBranches,
  easterLilies: EasterLilies,
  oldKingsCrown: OldKingsCrown,
} as const;

export type SwampKeepsakeId = keyof typeof SWAMP_KEEPSAKE_ART;

export const SWAMP_KEEPSAKE_INFO: Record<SwampKeepsakeId, { name: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; goal: string; sound: string }> = {
  fenLantern: { name: 'Fen Lantern', rarity: 'rare', goal: 'The Swamp King: finish all ten challenges', sound: 'A light in the dark' },
  lentenCross: { name: 'Lenten Cross', rarity: 'rare', goal: 'The Swamp King: finish all ten challenges', sound: 'Take up your cross' },
  palmBranches: { name: 'Palm Branches', rarity: 'epic', goal: 'The Swamp King: finish all ten challenges', sound: 'Hosanna!' },
  easterLilies: { name: 'Easter Lilies', rarity: 'epic', goal: 'The Swamp King: finish all ten challenges', sound: 'He is risen!' },
  oldKingsCrown: { name: 'Old King’s Crown', rarity: 'legendary', goal: 'The Swamp King: finish all ten challenges', sound: 'Set upon a rock' },
};

export const SWAMP_KEEPSAKE_IDS = Object.keys(SWAMP_KEEPSAKE_ART) as SwampKeepsakeId[];
