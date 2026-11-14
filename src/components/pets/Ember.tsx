import React from 'react';
import { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { Fx } from './Fx';
import { PetFrame, PetProps } from './PetFrame';
import { EmberExtras, EmberRays } from './PetExtras';

const LABELS = {
  1: 'Ember as a tiny tealight spark',
  2: 'Ember as a pillar candle',
  3: 'Ember as the vigil flame on a brass holder',
} as const;

const FLAME = '#F2A93B';
const INNER = '#FFE08A';
const INK = '#2B2420';
const WICK = '#4A3F3A';

function Spark() {
  return (
    <Fx kind="bob5">
      <Fx kind="glowEmber">
        <Circle cx={120} cy={170} r={62} fill={FLAME} />
      </Fx>
      <Ellipse cx={120} cy={242} rx={50} ry={7} fill="#000" opacity={0.35} />
      <Path d="M84 204 L156 204 L150 236 Q120 242 90 236 Z" fill="#C9CED6" />
      <Path d="M140 204 L156 204 L150 236 Q144 238 136 239 Z" fill="#AEB4BE" />
      <Ellipse cx={120} cy={204} rx={36} ry={8} fill="#E6E9EE" />
      <Ellipse cx={120} cy={204} rx={30} ry={6} fill="#F3EBDD" />
      <Rect x={118} y={188} width={4} height={14} rx={2} fill={WICK} />
      <Fx kind="flickerEmber" ox={120} oy={194}>
        <Path d="M120 118 C148 152 146 182 120 194 C94 182 92 152 120 118 Z" fill={FLAME} />
        <Path d="M120 140 C135 160 134 182 120 188 C106 182 105 160 120 140 Z" fill={INNER} />
      </Fx>
      <Fx kind="blink" ox={120} oy={168}>
        <Circle cx={114} cy={168} r={3} fill={INK} />
        <Circle cx={126} cy={168} r={3} fill={INK} />
      </Fx>
      <Path d="M116 175 Q120 178 124 175" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Fx>
  );
}

function Pillar() {
  return (
    <Fx kind="bob5" delay={600}>
      <Fx kind="glowEmber">
        <Circle cx={120} cy={138} r={62} fill={FLAME} />
      </Fx>
      <Ellipse cx={120} cy={240} rx={40} ry={7} fill="#000" opacity={0.35} />
      <Rect x={94} y={174} width={52} height={62} rx={8} fill="#F3EBDD" />
      <Path d="M132 174 L138 174 Q146 174 146 182 L146 228 Q146 236 138 236 L132 236 Z" fill="#E6DCC8" />
      <Path
        d="M94 184 Q94 174 104 174 L136 174 Q146 174 146 184 L146 190 Q140 190 140 198 Q134 198 134 190 L110 190 Q110 202 104 202 Q100 202 100 190 L94 190 Z"
        fill="#FFF8EC"
      />
      <Rect x={118} y={164} width={4} height={12} rx={2} fill={WICK} />
      <Fx kind="flickerEmber" ox={120} oy={168}>
        <Path d="M120 78 C152 118 150 156 120 168 C90 156 88 118 120 78 Z" fill={FLAME} />
        <Path d="M120 104 C140 130 138 154 120 162 C102 154 100 130 120 104 Z" fill={INNER} />
      </Fx>
      <Fx kind="blink" ox={120} oy={140}>
        <Circle cx={113} cy={140} r={3.4} fill={INK} />
        <Circle cx={127} cy={140} r={3.4} fill={INK} />
      </Fx>
      <Path d="M116 149 Q120 153 124 149" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Fx>
  );
}

function VigilFlame() {
  return (
    <>
      <Fx kind="glowEmber">
        <Circle cx={120} cy={80} r={76} fill={FLAME} />
      </Fx>
      <Fx kind="breatheRing" ox={120} oy={70}>
        <Circle cx={120} cy={70} r={50} fill="none" stroke="#F2C462" strokeWidth={3} />
      </Fx>
      <Ellipse cx={120} cy={246} rx={64} ry={8} fill="#000" opacity={0.35} />
      <Ellipse cx={120} cy={240} rx={36} ry={7} fill="#C9A24B" />
      <Rect x={104} y={222} width={32} height={18} rx={3} fill="#B08A3A" />
      <Ellipse cx={120} cy={224} rx={58} ry={10} fill="#C9A24B" />
      <Ellipse cx={120} cy={221} rx={50} ry={7} fill="#DDBA62" />
      <Rect x={94} y={112} width={52} height={110} rx={8} fill="#F7F0E2" />
      <Path d="M132 112 L138 112 Q146 112 146 120 L146 214 Q146 222 138 222 L132 222 Z" fill="#E9DFCB" />
      <Path
        d="M94 122 Q94 112 104 112 L136 112 Q146 112 146 122 L146 128 Q140 128 140 138 Q134 138 134 128 L110 128 Q110 146 104 146 Q98 146 98 128 L94 128 Z"
        fill="#FFFBF2"
      />
      <Path d="M120 158 L120 196 M108 170 L132 170" stroke="#C9A24B" strokeWidth={4} strokeLinecap="round" />
      <Rect x={118} y={100} width={4} height={14} rx={2} fill={WICK} />
      <Fx kind="flickerEmber" ox={120} oy={108}>
        <Path d="M120 16 C160 62 158 96 120 108 C82 96 80 62 120 16 Z" fill={FLAME} />
        <Path d="M120 42 C141 70 139 96 120 102 C101 96 99 70 120 42 Z" fill={INNER} />
      </Fx>
      <Fx kind="blink" ox={120} oy={78}>
        <Circle cx={112} cy={78} r={3.4} fill={INK} />
        <Circle cx={128} cy={78} r={3.4} fill={INK} />
      </Fx>
      <Path d="M115 87 Q120 91 125 87" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Fx kind="sparkE">
        <Circle cx={102} cy={44} r={2.6} fill={INNER} />
      </Fx>
      <Fx kind="sparkE" delay={800}>
        <Circle cx={140} cy={54} r={2.2} fill={INNER} />
      </Fx>
      <Fx kind="sparkE" delay={1600}>
        <Circle cx={122} cy={24} r={2.4} fill="#FFF3C4" />
      </Fx>
    </>
  );
}

/** Ember: tealight spark, pillar candle, vigil flame on brass. */
export function EmberFlame({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={LABELS[stage]}>
      {stage === 3 ? <EmberRays /> : null}
      {stage === 1 ? <Spark /> : stage === 2 ? <Pillar /> : <VigilFlame />}
      <EmberExtras stage={stage} />
    </PetFrame>
  );
}
