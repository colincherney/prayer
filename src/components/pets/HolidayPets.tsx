import React from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Fx, SoftGlow, TwinkleStar } from './Fx';
import { PetFrame, PetProps } from './PetFrame';

// Gobbles the Turkey (Thanksgiving) and Noel the Donkey (Advent and Christmas), from design/Seasonal.dc.html.
// The design draws each one once; that is stage 2 here. Stage 1 is the little one (hopping, smaller and plainer)
// and stage 3 the radiant one, with a glow, slow rays and gold, like Gourdy's Harvest Lantern.
// Both are drawn on the design's 200x200 artboard, placed in the 240x260 pet frame at (20, 54).

const INK = '#2B2420';
const CHEEK = '#E8998A';

/* ------------------------------------------------------------------ Gobbles */

const FEATHERS = ['#C9433A', '#E8913A', '#F2C462', '#8A5A3C', '#F2C462', '#E8913A', '#C9433A'];

function Turkey({ stage }: { stage: 1 | 2 | 3 }) {
  const baby = stage === 1;
  const angles = baby ? [-44, -22, 0, 22, 44] : [-66, -44, -22, 0, 22, 44, 66];
  const colors = baby ? FEATHERS.slice(1, 6) : FEATHERS;
  return (
    <>
      <Ellipse cx={100} cy={190} rx={50} ry={7} fill="#000" opacity={0.35} />
      {/* the tail fan breathes in and out */}
      <Fx kind="fanT" ox={100} oy={140}>
        {stage === 3
          ? angles.map(a => (
              <Ellipse key={`g${a}`} cx={100} cy={88} rx={15} ry={50} fill="#F7D98A" transform={`rotate(${a} 100 142)`} />
            ))
          : null}
        {angles.map((a, i) => (
          <Ellipse key={a} cx={100} cy={94} rx={13} ry={baby ? 36 : 44} fill={colors[i]} transform={`rotate(${a} 100 142)`} />
        ))}
      </Fx>
      <Path d="M90 176 L88 190 M110 176 L112 190 M82 190 L94 190 M106 190 L118 190" stroke="#E8A24B" strokeWidth={4} strokeLinecap="round" />
      <Ellipse cx={100} cy={150} rx={34} ry={32} fill={baby ? '#A8704A' : '#8A5A3C'} />
      <Ellipse cx={100} cy={158} rx={20} ry={20} fill={baby ? '#C8946A' : '#A8704A'} />
      <Ellipse cx={126} cy={150} rx={13} ry={22} fill="#6E4630" />
      <Ellipse cx={74} cy={150} rx={13} ry={22} fill="#6E4630" />
      {stage === 3 ? (
        // a harvest garland across the chest
        <>
          <Path d="M72 136 Q100 152 128 136" stroke="#C9A24B" strokeWidth={3} fill="none" strokeLinecap="round" />
          <G fill="#C9433A">
            <Ellipse cx={84} cy={143} rx={5} ry={3} transform="rotate(-25 84 143)" />
            <Ellipse cx={116} cy={143} rx={5} ry={3} transform="rotate(25 116 143)" />
          </G>
          <Circle cx={100} cy={146} r={4.5} fill="#F2C462" />
        </>
      ) : null}
      {/* the head bobs a gobble */}
      <Fx kind="gobble">
        <Circle cx={100} cy={104} r={22} fill="#B9783F" />
        <Fx kind="blink" ox={100} oy={100}>
          <Circle cx={92} cy={100} r={3.6} fill={INK} />
          <Circle cx={108} cy={100} r={3.6} fill={INK} />
          <Circle cx={93.2} cy={98.8} r={1.2} fill="#FFFFFF" />
          <Circle cx={109.2} cy={98.8} r={1.2} fill="#FFFFFF" />
        </Fx>
        <Polygon points="95,107 105,107 100,116" fill="#E8A24B" />
        {baby ? null : (
          <Fx kind="floatyN" ox={104} oy={112}>
            <Path d="M103 112 Q110 122 104 130 Q98 122 103 112 Z" fill="#C9433A" />
          </Fx>
        )}
        <Circle cx={86} cy={110} r={4} fill={CHEEK} opacity={0.5} />
        <Circle cx={114} cy={110} r={4} fill={CHEEK} opacity={0.5} />
        {stage === 3 ? (
          // a little crown of autumn leaves
          <G>
            <Ellipse cx={90} cy={84} rx={7} ry={3.5} fill="#C9433A" transform="rotate(-30 90 84)" />
            <Ellipse cx={100} cy={80} rx={7} ry={3.5} fill="#F2C462" transform="rotate(-90 100 80)" />
            <Ellipse cx={110} cy={84} rx={7} ry={3.5} fill="#E8913A" transform="rotate(30 110 84)" />
          </G>
        ) : null}
      </Fx>
    </>
  );
}

function FallingLeaves() {
  return (
    <G>
      <Fx kind="leafT" ox={40} oy={10}>
        <Ellipse cx={40} cy={10} rx={7} ry={4} fill="#E8913A" />
      </Fx>
      <Fx kind="leafT" delay={2300} ox={160} oy={6}>
        <Ellipse cx={160} cy={6} rx={7} ry={4} fill="#C9433A" />
      </Fx>
      <Fx kind="leafT" delay={4600} ox={110} oy={4}>
        <Ellipse cx={110} cy={4} rx={6} ry={3.5} fill="#F2C462" />
      </Fx>
    </G>
  );
}

function WheatSheaf({ x, flip }: { x: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <Fx kind="sheaf" delay={flip ? 1200 : 0} ox={x} oy={186}>
      <Path d={`M${x} 186 L${x + 6 * s} 128 M${x + 6 * s} 186 L${x + 12 * s} 124 M${x + 12 * s} 186 L${x + 16 * s} 130`} stroke="#C9A24B" strokeWidth={2.5} strokeLinecap="round" />
      <G fill="#F2C462">
        <Ellipse cx={x + 6 * s} cy={124} rx={4} ry={9} />
        <Ellipse cx={x + 12 * s} cy={120} rx={4} ry={9} />
        <Ellipse cx={x + 17 * s} cy={126} rx={4} ry={9} />
      </G>
      <Path d={`M${x} 160 L${x + 18 * s} 160`} stroke="#C9433A" strokeWidth={3} />
    </Fx>
  );
}

const TURKEY_LABELS = {
  1: 'Little Poult, a small turkey with a tiny tail fan',
  2: 'Gobbles, a grateful turkey with a fanned tail',
  3: 'Harvest Gobbles, a glowing turkey with a golden tail fan between wheat sheaves',
} as const;

/** Gobbles the Turkey: a little poult, Gobbles, Harvest Gobbles. */
export function GobblesTurkey({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={TURKEY_LABELS[stage]}>
      {stage === 3 ? (
        <>
          <Fx kind="spin28" ox={120} oy={160}>
            <Path
              d="M195 160 L232 160 M173 213 L199 239 M120 235 L120 258 M67 213 L41 239 M45 160 L8 160 M67 107 L41 81 M120 85 L120 48 M173 107 L199 81"
              stroke="#F2A93B"
              strokeOpacity={0.16}
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
          </Fx>
          <SoftGlow cx={120} cy={160} r={100} color="#F2A93B" kind="glow" />
          <TwinkleStar x={196} y={52} fill="#FFF3C4" />
          <TwinkleStar x={26} y={90} fill="#F2C462" delay={900} />
        </>
      ) : null}
      <G transform="translate(20 54)">
        <FallingLeaves />
        {stage === 1 ? (
          <Fx kind="zBabyHop" ox={100} oy={190}>
            <G transform="translate(28 52) scale(0.72)">
              <Turkey stage={1} />
            </G>
          </Fx>
        ) : (
          <Fx kind="bob6" delay={1200}>
            {stage === 3 ? (
              <>
                <WheatSheaf x={22} />
                <WheatSheaf x={178} flip />
              </>
            ) : null}
            <Turkey stage={stage} />
          </Fx>
        )}
      </G>
    </PetFrame>
  );
}

/* ------------------------------------------------------------------ Noel */

const COAT = '#A89A8C';
const HEAD = '#B4A698';
const PALE = '#D8CFC4';
const MANE = '#5C5048';
const SCARF = '#C9433A';

function Donkey({ stage }: { stage: 1 | 2 | 3 }) {
  const baby = stage === 1;
  return (
    <>
      <Ellipse cx={100} cy={190} rx={50} ry={7} fill="#000" opacity={0.35} />
      {/* tail swish */}
      <Fx kind="swishN" ox={136} oy={150}>
        <Path d="M136 150 C150 156 152 172 146 180" stroke="#9C8E80" strokeWidth={4} fill="none" strokeLinecap="round" />
        <Circle cx={146} cy={182} r={5} fill={MANE} />
      </Fx>
      <Rect x={80} y={166} width={10} height={20} fill={COAT} />
      <Rect x={110} y={166} width={10} height={20} fill={COAT} />
      <Rect x={80} y={184} width={10} height={6} rx={1} fill={MANE} />
      <Rect x={110} y={184} width={10} height={6} rx={1} fill={MANE} />
      <Ellipse cx={100} cy={156} rx={38} ry={26} fill={COAT} />
      <Ellipse cx={100} cy={162} rx={22} ry={16} fill={PALE} />
      {stage === 3 ? (
        // a gold-fringed saddle blanket, as for the road to Bethlehem
        <>
          <Path d="M74 142 Q100 134 126 142 L124 168 Q100 174 76 168 Z" fill="#2F4B8A" />
          <Path d="M76 168 Q100 174 124 168" stroke="#F2C462" strokeWidth={3} fill="none" />
          <G fill="#F2C462">
            <Circle cx={84} cy={173} r={1.8} />
            <Circle cx={100} cy={175} r={1.8} />
            <Circle cx={116} cy={173} r={1.8} />
          </G>
          <Circle cx={100} cy={154} r={4} fill="#F2C462" />
        </>
      ) : null}
      {/* the head nods; the ears flick */}
      <Fx kind="zNod">
        <Fx kind="earN" ox={80} oy={78}>
          <Ellipse cx={80} cy={52} rx={9} ry={baby ? 22 : 26} fill={COAT} />
          <Ellipse cx={80} cy={54} rx={4} ry={baby ? 14 : 18} fill={PALE} />
        </Fx>
        <Fx kind="earNR" ox={120} oy={78}>
          <Ellipse cx={120} cy={52} rx={9} ry={baby ? 22 : 26} fill={COAT} />
          <Ellipse cx={120} cy={54} rx={4} ry={baby ? 14 : 18} fill={PALE} />
        </Fx>
        <Ellipse cx={100} cy={94} rx={30} ry={34} fill={HEAD} />
        <G fill={MANE}>
          <Circle cx={100} cy={62} r={7} />
          <Circle cx={108} cy={58} r={6} />
          <Circle cx={92} cy={58} r={5} />
        </G>
        <Ellipse cx={100} cy={118} rx={22} ry={15} fill="#E6DED4" />
        <Circle cx={93} cy={118} r={2.5} fill="#6B5E52" />
        <Circle cx={107} cy={118} r={2.5} fill="#6B5E52" />
        <Path d="M94 126 Q100 130 106 126" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Fx kind="blink" ox={100} oy={90}>
          <Circle cx={88} cy={90} r={4.2} fill={INK} />
          <Circle cx={112} cy={90} r={4.2} fill={INK} />
          <Circle cx={89.5} cy={88.5} r={1.4} fill="#FFFFFF" />
          <Circle cx={113.5} cy={88.5} r={1.4} fill="#FFFFFF" />
        </Fx>
        <Circle cx={78} cy={104} r={5} fill={CHEEK} opacity={0.5} />
        <Circle cx={122} cy={104} r={5} fill={CHEEK} opacity={0.5} />
      </Fx>
      {baby ? null : (
        // the red scarf, one end blowing in the wind
        <>
          <Path d="M72 132 Q100 146 128 132 L128 140 Q100 154 72 140 Z" fill={SCARF} />
          <G fill="#FFFFFF" opacity={0.8}>
            <Circle cx={84} cy={140} r={1.6} />
            <Circle cx={100} cy={146} r={1.6} />
            <Circle cx={116} cy={140} r={1.6} />
          </G>
          <Fx kind="floatyN" ox={114} oy={140}>
            <Rect x={108} y={140} width={12} height={28} rx={3} fill={SCARF} />
            <Path d="M108 160 L120 160 M108 164 L120 164" stroke="#FFFFFF" strokeWidth={1.5} />
          </Fx>
          {stage === 3 ? <Circle cx={100} cy={150} r={4} fill="#F2C462" stroke="#C99A2E" strokeWidth={1} /> : null}
        </>
      )}
    </>
  );
}

function Snowfall() {
  const flakes: [number, number, number][] = [
    [30, 2.5, 0],
    [70, 2, 1500],
    [128, 2.5, 3000],
    [176, 2, 4500],
    [50, 1.8, 3000],
  ];
  return (
    <G fill="#FFFFFF">
      {flakes.map(([x, r, d]) => (
        <Fx key={`${x}-${d}`} kind="snowN" delay={d}>
          <Circle cx={x} cy={-4} r={r} />
        </Fx>
      ))}
    </G>
  );
}

function GuidingStar({ big }: { big?: boolean }) {
  return (
    <>
      <Fx kind="glowP">
        <Circle cx={154} cy={36} r={big ? 30 : 22} fill="#F2C462" />
      </Fx>
      <Fx kind="zTwinkle" dur={2000} ox={154} oy={36}>
        <Path d="M154 20 L158 32 L170 36 L158 40 L154 52 L150 40 L138 36 L150 32 Z" fill="#F2C462" />
      </Fx>
    </>
  );
}

const DONKEY_LABELS = {
  1: 'Little Foal, a small donkey with big ears',
  2: 'Noel, a Nativity donkey with a red scarf under a star',
  3: 'Noel of Bethlehem, a donkey with a gold-fringed blanket under a shining star',
} as const;

/** Noel the Donkey: a little foal, Noel, Noel of Bethlehem. */
export function NoelDonkey({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={DONKEY_LABELS[stage]}>
      {stage === 3 ? (
        <>
          <Fx kind="spin28" ox={174} oy={90}>
            <Path
              d="M174 50 L174 30 M174 130 L174 150 M134 90 L114 90 M214 90 L234 90 M146 62 L132 48 M202 118 L216 132 M202 62 L216 48 M146 118 L132 132"
              stroke="#F2C462"
              strokeOpacity={0.22}
              strokeWidth={5}
              strokeLinecap="round"
            />
          </Fx>
          <SoftGlow cx={120} cy={160} r={100} color="#F2C462" kind="glow" />
          <TwinkleStar x={24} y={70} fill="#FFF3C4" delay={700} />
        </>
      ) : null}
      <G transform="translate(20 54)">
        <Snowfall />
        {stage === 1 ? null : <GuidingStar big={stage === 3} />}
        {stage === 1 ? (
          <Fx kind="zBabyHop" ox={100} oy={190}>
            <G transform="translate(28 52) scale(0.72)">
              <Donkey stage={1} />
            </G>
          </Fx>
        ) : (
          <Fx kind="bob6" delay={600}>
            <Donkey stage={stage} />
          </Fx>
        )}
      </G>
    </PetFrame>
  );
}
