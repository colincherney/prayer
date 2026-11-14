import React from 'react';
import { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

import { Fx } from './Fx';
import { PetFrame, PetProps } from './PetFrame';
import { DoveExtras } from './PetExtras';

const LABELS = {
  1: 'Olive as a fledgling in a nest',
  2: 'Olive as a dove holding an olive branch',
  3: 'Olive as the dove of peace in flight',
} as const;

const OLIVE = '#8DAA62';
const STEM = '#6E8B4E';
const BEAK = '#E8A24B';
const CHEEK = '#E8998A';

function Fledgling() {
  return (
    <>
      <Ellipse cx={120} cy={244} rx={70} ry={8} fill="#000" opacity={0.35} />
      <Ellipse cx={120} cy={210} rx={66} ry={20} fill="#5C4430" />
      <Fx kind="bob7">
        <Fx kind="flapFast" ox={93.6} oy={200.4}>
          <Ellipse cx={84} cy={186} rx={12} ry={18} fill="#E4DFD5" />
        </Fx>
        <Fx kind="flapRFast" ox={146.4} oy={200.4}>
          <Ellipse cx={156} cy={186} rx={12} ry={18} fill="#E4DFD5" />
        </Fx>
        <Circle cx={120} cy={180} r={40} fill="#F4F1EA" />
        <Ellipse cx={120} cy={196} rx={26} ry={20} fill="#FFFFFF" />
        <G fill="#F4F1EA">
          <Circle cx={112} cy={142} r={7} />
          <Circle cx={120} cy={137} r={8} />
          <Circle cx={128} cy={142} r={7} />
        </G>
        <Fx kind="blink" ox={120} oy={174}>
          <Circle cx={108} cy={174} r={5} fill="#2B2420" />
          <Circle cx={132} cy={174} r={5} fill="#2B2420" />
          <Circle cx={110} cy={172} r={1.6} fill="#FFFFFF" />
          <Circle cx={134} cy={172} r={1.6} fill="#FFFFFF" />
        </Fx>
        <Polygon points="114,184 126,184 120,193" fill={BEAK} />
        <Circle cx={99} cy={188} r={5} fill={CHEEK} opacity={0.6} />
        <Circle cx={141} cy={188} r={5} fill={CHEEK} opacity={0.6} />
      </Fx>
      <Path d="M54 204 Q120 248 186 204 L190 220 Q120 262 50 220 Z" fill="#8A6A45" />
      <Path
        d="M60 214 L96 226 M140 230 L180 214 M92 238 L130 240 M70 226 L84 218 M160 226 L174 232"
        stroke="#B08B5E"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function Olive() {
  return (
    <Fx kind="bob7" delay={600}>
      <G transform="translate(20 56)">
        <Ellipse cx={100} cy={184} rx={48} ry={7} fill="#000" opacity={0.35} />
        <Path d="M58 112 L18 96 L30 122 L18 146 L62 128 Z" fill="#E6E1D7" />
        <Ellipse cx={100} cy={118} rx={50} ry={32} fill="#F7F5F0" />
        <Fx kind="peck">
          <Circle cx={140} cy={86} r={21} fill="#F7F5F0" />
          <Fx kind="blink" ox={146} oy={83}>
            <Circle cx={146} cy={83} r={3.4} fill="#2B2420" />
          </Fx>
          <Circle cx={140} cy={94} r={3.5} fill={CHEEK} opacity={0.6} />
          <Path d="M159 86 L174 91 L159 96 Z" fill={BEAK} />
          <Path d="M170 94 Q182 110 176 130" stroke={STEM} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Ellipse cx={182} cy={106} rx={8} ry={4} fill={OLIVE} transform="rotate(40 182 106)" />
          <Ellipse cx={170} cy={118} rx={8} ry={4} fill={OLIVE} transform="rotate(-30 170 118)" />
          <Ellipse cx={183} cy={126} rx={8} ry={4} fill={OLIVE} transform="rotate(30 183 126)" />
        </Fx>
        <Fx kind="flap" ox={127.8} oy={115}>
          <Path d="M72 106 Q104 70 134 108 Q102 130 72 106 Z" fill="#E4DFD5" />
        </Fx>
        <Path d="M92 148 L90 172 M110 148 L112 172" stroke={BEAK} strokeWidth={4} strokeLinecap="round" />
      </G>
    </Fx>
  );
}

function Peace() {
  return (
    <>
      <Fx kind="spin" ox={120} oy={130}>
        <Path
          d="M170 130 L230 130 M155 165 L198 208 M120 180 L120 240 M85 165 L42 208 M70 130 L10 130 M85 95 L42 52 M120 80 L120 20 M155 95 L198 52"
          stroke="#F2C462"
          strokeOpacity={0.22}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
        />
      </Fx>
      <Fx kind="glowDove">
        <Circle cx={120} cy={130} r={70} fill="#F2C462" />
      </Fx>
      <Ellipse cx={120} cy={246} rx={40} ry={6} fill="#000" opacity={0.2} />
      <Fx kind="fly">
        <Fx kind="flap" ox={104.6} oy={124}>
          <Path d="M112 128 C100 76 72 46 38 34 C56 62 60 82 56 96 C78 98 94 112 104 134 Z" fill="#E4DFD5" />
        </Fx>
        <Path d="M76 140 L36 126 L48 146 L34 164 L78 152 Z" fill="#E6E1D7" />
        <Ellipse cx={120} cy={142} rx={46} ry={22} fill="#F7F5F0" />
        <Fx kind="flapR" ox={132.4} oy={129.2}>
          <Path
            d="M126 134 C130 76 152 44 190 28 C172 58 170 82 174 98 C156 102 142 116 136 140 Z"
            fill="#FFFFFF"
            stroke="#E4DFD5"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Fx>
        <Circle cx={164} cy={124} r={18} fill="#F7F5F0" />
        <Fx kind="blink" ox={170} oy={120}>
          <Circle cx={170} cy={120} r={3} fill="#2B2420" />
        </Fx>
        <Circle cx={164} cy={131} r={3.5} fill={CHEEK} opacity={0.6} />
        <Path d="M180 122 L194 127 L180 132 Z" fill={BEAK} />
        <Path d="M190 132 Q202 148 196 172" stroke={STEM} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Ellipse cx={202} cy={144} rx={8} ry={4} fill={OLIVE} transform="rotate(40 202 144)" />
        <Ellipse cx={190} cy={154} rx={8} ry={4} fill={OLIVE} transform="rotate(-30 190 154)" />
        <Ellipse cx={203} cy={162} rx={8} ry={4} fill={OLIVE} transform="rotate(30 203 162)" />
        <Ellipse cx={191} cy={172} rx={8} ry={4} fill={OLIVE} transform="rotate(-20 191 172)" />
      </Fx>
    </>
  );
}

/** Olive the Dove: fledgling in a nest, dove with an olive branch, dove of peace. */
export function OliveDove({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={LABELS[stage]}>
      {stage === 1 ? <Fledgling /> : stage === 2 ? <Olive /> : <Peace />}
      <DoveExtras stage={stage} />
    </PetFrame>
  );
}
