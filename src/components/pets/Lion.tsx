import React from 'react';
import { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

import { Fx, TwinkleStar } from './Fx';
import { PetFrame, PetProps } from './PetFrame';
import { LionExtras } from './PetExtras';

const LABELS = {
  1: 'Judah as a fuzzy lion cub',
  2: 'Judah as a young lion with a full mane',
  3: 'Judah as a crowned lion with a golden mane',
} as const;

const FUR = '#E3A957';
const FACE = '#EDB565';
const MUZZLE = '#F6D9A8';
const MANE = '#C77A35';
const NOSE = '#6B3F2A';
const CHEEK = '#E8998A';

/** Face parts shared by the young lion and the crowned lion. */
function LionFace({ crowned }: { crowned?: boolean }) {
  return (
    <>
      <Circle cx={74} cy={64} r={11} fill={FACE} />
      <Circle cx={126} cy={64} r={11} fill={FACE} />
      <Circle cx={74} cy={64} r={5.5} fill="#D9955A" />
      <Circle cx={126} cy={64} r={5.5} fill="#D9955A" />
      <Circle cx={100} cy={94} r={34} fill={FACE} />
      <Ellipse cx={100} cy={108} rx={16} ry={12} fill={MUZZLE} />
      <Fx kind="blink" ox={100} oy={90}>
        <Circle cx={88} cy={90} r={3.8} fill="#2B2420" />
        <Circle cx={112} cy={90} r={3.8} fill="#2B2420" />
      </Fx>
      {crowned ? <Path d="M84 84 L93 86 M116 84 L107 86" stroke="#B87A3A" strokeWidth={2.5} strokeLinecap="round" /> : null}
      <Path d="M94 102 L106 102 L100 109 Z" fill={NOSE} />
      <Path d="M100 109 Q95 115 91 112 M100 109 Q105 115 109 112" stroke={NOSE} strokeWidth={2} fill="none" strokeLinecap="round" />
      {crowned ? null : (
        <>
          <Circle cx={80} cy={102} r={4} fill={CHEEK} opacity={0.6} />
          <Circle cx={120} cy={102} r={4} fill={CHEEK} opacity={0.6} />
        </>
      )}
    </>
  );
}

function Cub() {
  return (
    <Fx kind="bob6">
      <Ellipse cx={120} cy={242} rx={56} ry={8} fill="#000" opacity={0.35} />
      <Fx kind="swish" ox={150} oy={214}>
        <Path d="M150 214 C176 214 186 196 184 180" stroke={FUR} strokeWidth={8} fill="none" strokeLinecap="round" />
        <Circle cx={184} cy={174} r={8} fill={MANE} />
      </Fx>
      <Ellipse cx={120} cy={200} rx={36} ry={32} fill={FUR} />
      <Ellipse cx={120} cy={210} rx={20} ry={18} fill={MUZZLE} />
      <Ellipse cx={102} cy={232} rx={13} ry={8} fill={FACE} />
      <Ellipse cx={138} cy={232} rx={13} ry={8} fill={FACE} />
      <Fx kind="tilt" ox={120} oy={174}>
        <G fill={MANE}>
          <Circle cx={104} cy={110} r={11} />
          <Circle cx={120} cy={104} r={12} />
          <Circle cx={136} cy={110} r={11} />
        </G>
        <Circle cx={94} cy={118} r={11} fill={FACE} />
        <Circle cx={146} cy={118} r={11} fill={FACE} />
        <Circle cx={94} cy={118} r={5.5} fill="#D9955A" />
        <Circle cx={146} cy={118} r={5.5} fill="#D9955A" />
        <Circle cx={120} cy={142} r={32} fill={FACE} />
        <Ellipse cx={120} cy={154} rx={14} ry={10} fill={MUZZLE} />
        <Fx kind="blink" ox={120} oy={138}>
          <Circle cx={108} cy={138} r={4.4} fill="#2B2420" />
          <Circle cx={132} cy={138} r={4.4} fill="#2B2420" />
          <Circle cx={109.5} cy={136.5} r={1.4} fill="#FFFFFF" />
          <Circle cx={133.5} cy={136.5} r={1.4} fill="#FFFFFF" />
        </Fx>
        <Path d="M115 149 L125 149 L120 155 Z" fill={NOSE} />
        <Path d="M120 155 Q116 160 112 158 M120 155 Q124 160 128 158" stroke={NOSE} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={100} cy={152} r={4.5} fill={CHEEK} opacity={0.6} />
        <Circle cx={140} cy={152} r={4.5} fill={CHEEK} opacity={0.6} />
      </Fx>
    </Fx>
  );
}

function YoungJudah() {
  return (
    <Fx kind="bob6" delay={600}>
      <G transform="translate(20 56)">
        <Ellipse cx={100} cy={184} rx={50} ry={8} fill="#000" opacity={0.35} />
        <Fx kind="swish" ox={130} oy={168}>
          <Path d="M130 166 C160 168 174 152 172 134" stroke={FUR} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Circle cx={172} cy={128} r={8} fill={MANE} />
        </Fx>
        <Ellipse cx={100} cy={158} rx={36} ry={22} fill={FUR} />
        <Ellipse cx={78} cy={176} rx={12} ry={7} fill={FACE} />
        <Ellipse cx={122} cy={176} rx={12} ry={7} fill={FACE} />
        <Fx kind="breatheLion" ox={100} oy={92}>
          <G fill={MANE}>
            <Circle cx={100} cy={92} r={50} />
            <Circle cx={58} cy={78} r={18} />
            <Circle cx={142} cy={78} r={18} />
            <Circle cx={62} cy={116} r={18} />
            <Circle cx={138} cy={116} r={18} />
            <Circle cx={100} cy={44} r={18} />
            <Circle cx={100} cy={138} r={16} />
          </G>
        </Fx>
        <LionFace />
      </G>
    </Fx>
  );
}

function LionOfJudah() {
  return (
    <>
      <Fx kind="glowLion">
        <Circle cx={120} cy={150} r={106} fill="#F2C462" />
      </Fx>
      <Fx kind="bob6" delay={1200}>
        <G transform="translate(20 56)">
          <Ellipse cx={100} cy={184} rx={56} ry={8} fill="#000" opacity={0.35} />
          <Fx kind="swish" ox={130} oy={168}>
            <Path d="M130 166 C162 168 178 150 176 130" stroke={FUR} strokeWidth={8} fill="none" strokeLinecap="round" />
            <Circle cx={176} cy={124} r={9} fill="#D98F3A" />
          </Fx>
          <Ellipse cx={100} cy={158} rx={40} ry={24} fill={FUR} />
          <Ellipse cx={76} cy={177} rx={13} ry={7} fill={FACE} />
          <Ellipse cx={124} cy={177} rx={13} ry={7} fill={FACE} />
          <Fx kind="breatheLion" ox={100} oy={95}>
            <G fill="#A85A22">
              <Circle cx={48} cy={70} r={22} />
              <Circle cx={152} cy={70} r={22} />
              <Circle cx={44} cy={118} r={22} />
              <Circle cx={156} cy={118} r={22} />
              <Circle cx={66} cy={38} r={20} />
              <Circle cx={134} cy={38} r={20} />
              <Circle cx={66} cy={148} r={20} />
              <Circle cx={134} cy={148} r={20} />
              <Circle cx={100} cy={154} r={20} />
            </G>
            <G fill="#D98F3A">
              <Circle cx={100} cy={92} r={52} />
              <Circle cx={58} cy={78} r={18} />
              <Circle cx={142} cy={78} r={18} />
              <Circle cx={62} cy={116} r={18} />
              <Circle cx={138} cy={116} r={18} />
              <Circle cx={100} cy={44} r={18} />
              <Circle cx={100} cy={140} r={16} />
            </G>
          </Fx>
          <LionFace crowned />
          <Polygon
            points="76,46 82,18 94,34 100,10 106,34 118,18 124,46"
            fill="#F2C462"
            stroke="#C99A2E"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Circle cx={100} cy={37} r={4.5} fill="#8FC6A9" />
          <Circle cx={84} cy={40} r={3} fill="#F7E3B5" />
          <Circle cx={116} cy={40} r={3} fill="#F7E3B5" />
        </G>
      </Fx>
      <TwinkleStar x={22} y={62} fill="#F2C462" />
      <TwinkleStar x={200} y={104} fill="#F7E3B5" delay={600} />
      <TwinkleStar x={178} y={30} fill="#F2C462" delay={1200} />
    </>
  );
}

/** Judah the Lion: cub, young lion with a full mane, crowned Lion of Judah. */
export function JudahLion({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={LABELS[stage]}>
      {stage === 1 ? <Cub /> : stage === 2 ? <YoungJudah /> : <LionOfJudah />}
      <LionExtras stage={stage} />
    </PetFrame>
  );
}
