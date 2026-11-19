import React from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Fx } from './Fx';

// The Long Winter's weekly keepsakes (src/lib/winterEvent.ts). They're earned only in the event, claimed from the
// winter screen, and then sit on the keepsake shelf like any other. Drawn on the shared 120x120 trinket artboard.

function Shadow({ rx = 32 }: { rx?: number }) {
  return <Ellipse cx={60} cy={108} rx={rx} ry={4.5} fill="#000" opacity={0.3} />;
}

function Flame({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <Fx kind="candle" delay={delay}>
      <G>
        <Path d={`M${x} ${y - 11} Q${x + 5} ${y - 3} ${x} ${y + 1} Q${x - 5} ${y - 3} ${x} ${y - 11} Z`} fill="#F2A93B" />
        <Path d={`M${x} ${y - 6} Q${x + 2.5} ${y - 2} ${x} ${y} Q${x - 2.5} ${y - 2} ${x} ${y - 6} Z`} fill="#FFF1C4" />
      </G>
    </Fx>
  );
}

/** Week 1: a small Advent wreath, its first candle lit. */
function AdventWreath() {
  return (
    <>
      <Shadow rx={38} />
      <Ellipse cx={60} cy={92} rx={40} ry={13} fill="#1E4A34" />
      <Ellipse cx={60} cy={90} rx={40} ry={12} fill="#2F6B4A" />
      <Ellipse cx={60} cy={90} rx={24} ry={6} fill="#1A2A22" />
      {[[26, 88], [40, 98], [60, 101], [80, 98], [94, 88], [34, 82], [86, 82]].map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} fill="#C9433A" />
      ))}
      {/* candles: purple, purple, pink, purple */}
      <Rect x={30} y={62} width={9} height={26} rx={2} fill="#6B4AA0" />
      <Rect x={51} y={58} width={9} height={30} rx={2} fill="#6B4AA0" />
      <Rect x={70} y={60} width={9} height={28} rx={2} fill="#E08AB0" />
      <Rect x={86} y={64} width={9} height={24} rx={2} fill="#6B4AA0" />
      <Flame x={34.5} y={60} />
      <Path d="M55.5 58 L55.5 54 M74.5 60 L74.5 56 M90.5 64 L90.5 60" stroke="#3A2A1E" strokeWidth={1.4} />
    </>
  );
}

/** Week 4 (Christmas): the star over Bethlehem. */
function ChristmasStar() {
  return (
    <>
      <Shadow rx={22} />
      <Rect x={56} y={74} width={8} height={32} rx={2} fill="#8A6A45" />
      <Fx kind="glow">
        <Circle cx={60} cy={48} r={40} fill="#F7DFA0" />
      </Fx>
      <Fx kind="breathe" ox={60} oy={48}>
        <Polygon points="60,14 69,38 95,40 75,56 82,82 60,67 38,82 45,56 25,40 51,38" fill="#E9C46A" />
      </Fx>
      <Polygon points="60,24 66,40 83,42 70,52 74,69 60,59 46,69 50,52 37,42 54,40" fill="#FFF0C2" />
      <Fx kind="twinkle" delay={600} ox={92} oy={20}>
        <Path d="M92 14 L94 20 L100 22 L94 24 L92 30 L90 24 L84 22 L90 20 Z" fill="#FFFFFF" />
      </Fx>
    </>
  );
}

/** Week 5 (Holy Family): a snow globe with a little stable inside. */
function WinterSnowGlobe() {
  return (
    <>
      <Shadow rx={30} />
      <Path d="M30 92 L90 92 L96 106 L24 106 Z" fill="#6B4A2A" />
      <Rect x={28} y={88} width={64} height={6} rx={2} fill="#E9C46A" />
      <Circle cx={60} cy={56} r={36} fill="#BFE6FF" opacity={0.35} />
      <Ellipse cx={60} cy={84} rx={30} ry={6} fill="#F2F7FD" />
      <Polygon points="44,82 44,64 60,52 76,64 76,82" fill="#8A6A45" />
      <Polygon points="40,66 60,48 80,66 76,66 60,52 44,66" fill="#F2F7FD" />
      <Rect x={54} y={68} width={12} height={14} fill="#3A2A1E" />
      <Circle cx={60} cy={74} r={3} fill="#F2C462" />
      <Path d="M60 40 L62 44 L66 45 L62 46 L60 50 L58 46 L54 45 L58 44 Z" fill="#E9C46A" />
      <Fx kind="twinkle" delay={0} ox={40} oy={40}><Circle cx={40} cy={40} r={2} fill="#FFFFFF" /></Fx>
      <Fx kind="twinkle" delay={700} ox={78} oy={46}><Circle cx={78} cy={46} r={1.8} fill="#FFFFFF" /></Fx>
      <Fx kind="twinkle" delay={1400} ox={70} oy={30}><Circle cx={70} cy={30} r={1.6} fill="#FFFFFF" /></Fx>
      <Path d="M34 40 Q40 26 56 22" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.55} fill="none" />
    </>
  );
}

/** Week 6 (Epiphany): a crown of the three kings. */
function ThreeKingsCrown() {
  return (
    <>
      <Shadow rx={34} />
      <Path d="M24 96 L24 52 L42 70 L60 40 L78 70 L96 52 L96 96 Z" fill="#E9C46A" />
      <Path d="M24 96 L24 52 L42 70 L60 40 L78 70 L96 52 L96 96 Z" fill="none" stroke="#B8902E" strokeWidth={2} />
      <Rect x={22} y={86} width={76} height={12} rx={3} fill="#C9A24B" />
      <Circle cx={42} cy={92} r={4} fill="#C9433A" />
      <Circle cx={60} cy={92} r={4} fill="#5FE3C0" />
      <Circle cx={78} cy={92} r={4} fill="#6B8BFF" />
      <Circle cx={24} cy={50} r={4} fill="#FFF0C2" />
      <Circle cx={60} cy={38} r={5} fill="#FFF0C2" />
      <Circle cx={96} cy={50} r={4} fill="#FFF0C2" />
      <Fx kind="twinkle" delay={300} ox={60} oy={24}>
        <Path d="M60 16 L62 22 L68 24 L62 26 L60 32 L58 26 L52 24 L58 22 Z" fill="#FFFFFF" />
      </Fx>
    </>
  );
}

/** Week 9 (Candlemas): a pair of tall beeswax candles. */
function CandlemasCandles() {
  return (
    <>
      <Shadow rx={30} />
      <Ellipse cx={60} cy={100} rx={30} ry={6} fill="#C9A24B" />
      <Rect x={40} y={44} width={14} height={56} rx={3} fill="#F4E3B8" />
      <Rect x={66} y={34} width={14} height={66} rx={3} fill="#F4E3B8" />
      <Path d="M44 50 L44 94 M70 40 L70 94" stroke="#E2CC92" strokeWidth={2} />
      <Path d="M47 44 L47 40 M73 34 L73 30" stroke="#3A2A1E" strokeWidth={1.4} />
      <Fx kind="glow"><Circle cx={60} cy={32} r={30} fill="#F7DFA0" /></Fx>
      <Flame x={47} y={40} />
      <Flame x={73} y={30} delay={500} />
    </>
  );
}

export const WINTER_KEEPSAKE_ART = {
  adventWreath: AdventWreath,
  christmasStar: ChristmasStar,
  winterSnowGlobe: WinterSnowGlobe,
  threeKingsCrown: ThreeKingsCrown,
  candlemasCandles: CandlemasCandles,
} as const;

export type WinterKeepsakeId = keyof typeof WINTER_KEEPSAKE_ART;

export const WINTER_KEEPSAKE_INFO: Record<WinterKeepsakeId, { name: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; goal: string; sound: string }> = {
  adventWreath: { name: 'Advent Wreath', rarity: 'rare', goal: 'The Long Winter, week 1: pray 3 days', sound: 'O come, O come' },
  christmasStar: { name: 'Christmas Star', rarity: 'epic', goal: 'The Long Winter, Christmas week: pray 3 days', sound: 'Glory!' },
  winterSnowGlobe: { name: 'Winter Snow Globe', rarity: 'rare', goal: 'The Long Winter, Holy Family week: pray 3 days', sound: 'Shake shake!' },
  threeKingsCrown: { name: 'Three Kings Crown', rarity: 'epic', goal: 'The Long Winter, Epiphany week: pray 3 days', sound: 'We three kings!' },
  candlemasCandles: { name: 'Candlemas Candles', rarity: 'legendary', goal: 'The Long Winter, last week: pray 3 days', sound: 'A light!' },
};

export const WINTER_KEEPSAKE_IDS = Object.keys(WINTER_KEEPSAKE_ART) as WinterKeepsakeId[];
