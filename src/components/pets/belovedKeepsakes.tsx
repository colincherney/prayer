import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { Fx } from './Fx';

// The Beloved's keepsakes (the Valentine event). All four come with finishing the event's six challenges, straight
// onto the keepsake shelf (public.user_trinkets). Drawn on the shared 120x120 trinket artboard, in the event's colours:
// rose #C2546F, blush #E8879B, gold #C9A35A and marble cream.

function Shadow({ rx = 32 }: { rx?: number }) {
  return <Ellipse cx={60} cy={108} rx={rx} ry={4.5} fill="#000" opacity={0.25} />;
}

const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.3} C${x} ${y - s * 0.25} ${x - s} ${y - s * 0.25} ${x - s} ${y + s * 0.3} C${x - s} ${y + s * 0.75} ${x - s * 0.2} ${y + s} ${x} ${y + s * 1.3} C${x + s * 0.2} ${y + s} ${x + s} ${y + s * 0.75} ${x + s} ${y + s * 0.3} C${x + s} ${y - s * 0.25} ${x} ${y - s * 0.25} ${x} ${y + s * 0.3} Z`;

/** A cream envelope sealed with a rose wax heart, a little letter peeking out. */
function LoveLetter() {
  return (
    <>
      <Shadow rx={34} />
      <Rect x={30} y={30} width={60} height={44} rx={3} fill="#FFFDF8" transform="rotate(-8 60 52)" />
      <Path d="M38 40 L80 36 M38 48 L76 44 M38 56 L70 52" stroke="#D9C9B8" strokeWidth={2} strokeLinecap="round" transform="rotate(-8 60 52)" />
      <Rect x={22} y={52} width={76} height={50} rx={5} fill="#F5EDE3" />
      <Path d="M22 56 L60 84 L98 56" stroke="#E3D4C4" strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <Path d="M22 100 L50 78 M98 100 L70 78" stroke="#E3D4C4" strokeWidth={2} />
      <Fx kind="breathe" ox={60} oy={82}>
        <Path d={heart(60, 74, 11)} fill="#C2546F" />
        <Path d={heart(57, 76, 3.5)} fill="#E8879B" opacity={0.8} />
      </Fx>
    </>
  );
}

/** A bouquet of red roses tied with a blush ribbon. */
function RoseBouquet() {
  const roses: [number, number, number][] = [[44, 36, 11], [62, 28, 12], [78, 40, 11], [52, 52, 10], [70, 54, 10]];
  return (
    <>
      <Shadow rx={22} />
      <Path d="M52 104 L58 62 M68 104 L62 62 M60 104 L60 60" stroke="#6E8A56" strokeWidth={4} strokeLinecap="round" />
      <Path d="M36 56 Q30 46 40 44 Q44 54 48 60 Z M84 58 Q92 48 82 46 Q78 56 72 62 Z" fill="#7E9A64" />
      {roses.map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={r} fill="#C2546F" />
          <Path d={`M${x - r * 0.5} ${y} Q${x} ${y - r * 0.8} ${x + r * 0.5} ${y} Q${x} ${y + r * 0.5} ${x - r * 0.3} ${y - r * 0.1}`} stroke="#8E2E4A" strokeWidth={1.6} fill="none" />
          <Circle cx={x} cy={y} r={r * 0.28} fill="#E8879B" />
        </G>
      ))}
      <Path d="M46 82 Q60 76 74 82 L70 92 Q60 88 50 92 Z" fill="#F4B6C4" />
      <Path d="M58 86 Q44 96 42 104 M62 86 Q76 96 78 104" stroke="#F4B6C4" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Fx kind="twinkle" delay={200} ox={80} oy={24}>
        <Path d="M80 18 L82 22 L86 24 L82 26 L80 30 L78 26 L74 24 L78 22 Z" fill="#FFFFFF" />
      </Fx>
    </>
  );
}

/** The Muse's golden lyre, a heart in its middle. */
function GoldenLyre() {
  return (
    <>
      <Shadow rx={26} />
      <Path d="M40 98 Q24 70 34 40 Q38 24 50 22 Q42 40 46 64 Q48 80 56 92 Z" fill="#C9A35A" />
      <Path d="M80 98 Q96 70 86 40 Q82 24 70 22 Q78 40 74 64 Q72 80 64 92 Z" fill="#C9A35A" />
      <Path d="M40 98 Q24 70 34 40" stroke="#E9C98A" strokeWidth={2} fill="none" />
      <Rect x={34} y={34} width={52} height={7} rx={3} fill="#B08A44" />
      <Rect x={40} y={92} width={40} height={10} rx={4} fill="#B08A44" />
      <Path d="M48 41 L50 92 M56 41 L57 92 M64 41 L63 92 M72 41 L70 92" stroke="#F3E6C8" strokeWidth={1.4} />
      <Fx kind="breathe" ox={60} oy={66}>
        <Path d={heart(60, 58, 9)} fill="#C2546F" />
      </Fx>
      <Circle cx={34} cy={40} r={4} fill="#E9C98A" />
      <Circle cx={86} cy={40} r={4} fill="#E9C98A" />
    </>
  );
}

/** A marble heart on a little plinth, a rose at its foot and a glow of love. */
function MarbleHeart() {
  return (
    <>
      <Shadow rx={30} />
      <Fx kind="glow"><Circle cx={60} cy={56} r={34} fill="#F4B6C4" /></Fx>
      <Rect x={32} y={86} width={56} height={10} rx={2} fill="#E3D6CA" />
      <Rect x={28} y={96} width={64} height={8} rx={2} fill="#EFE5DC" />
      <Path d={heart(60, 30, 26)} fill="#F7F0EA" />
      <Path d={heart(60, 30, 26)} fill="none" stroke="#E3D4C8" strokeWidth={2} />
      <Path d="M46 44 Q54 52 50 64 M66 40 Q72 50 68 58 Q74 66 70 74" stroke="#D9C9B8" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M44 42 Q48 36 54 38" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={80} cy={88} r={7} fill="#C2546F" />
      <Circle cx={80} cy={88} r={3} fill="#E8879B" />
      <Path d="M74 92 Q70 98 66 96" stroke="#7E9A64" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Fx kind="twinkle" delay={400} ox={84} oy={30}>
        <Path d="M84 24 L86 28 L90 30 L86 32 L84 36 L82 32 L78 30 L82 28 Z" fill="#FFFFFF" />
      </Fx>
    </>
  );
}

export const BELOVED_KEEPSAKE_ART = {
  loveLetter: LoveLetter,
  roseBouquet: RoseBouquet,
  goldenLyre: GoldenLyre,
  marbleHeart: MarbleHeart,
} as const;

export type BelovedKeepsakeId = keyof typeof BELOVED_KEEPSAKE_ART;

export const BELOVED_KEEPSAKE_INFO: Record<BelovedKeepsakeId, { name: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; goal: string; sound: string }> = {
  loveLetter: { name: 'Love Letter', rarity: 'rare', goal: 'The Beloved: finish all six challenges', sound: 'Sealed with love' },
  roseBouquet: { name: 'Rose Bouquet', rarity: 'rare', goal: 'The Beloved: finish all six challenges', sound: 'The flowers appear!' },
  goldenLyre: { name: 'Golden Lyre', rarity: 'epic', goal: 'The Beloved: finish all six challenges', sound: 'A new song' },
  marbleHeart: { name: 'Marble Heart', rarity: 'legendary', goal: 'The Beloved: finish all six challenges', sound: 'Love never fails' },
};

export const BELOVED_KEEPSAKE_IDS = Object.keys(BELOVED_KEEPSAKE_ART) as BelovedKeepsakeId[];
