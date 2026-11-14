import React from 'react';
import { Circle, Ellipse, G, Path, Polygon, Polyline } from 'react-native-svg';

import { Fx } from './Fx';
import { PetFrame, PetProps } from './PetFrame';
import { DragonExtras } from './PetExtras';

const LABELS = {
  1: 'Selah as a hatchling peeking out of an egg',
  2: 'Selah as a young dragon',
  3: 'Selah as a grown guardian dragon',
} as const;

const TEAL = '#1C9C98';
const DEEP = '#0E5E61';
const ICE = '#86E6D9';
const PALE = '#D7F4EF';
const GOLD = '#E8B93A';
const PUPIL = '#0A3B3D';
const EYE = '#F2C462';

const BODY_PATH =
  'M200 232 C238 206 190 176 140 190 C82 206 38 186 60 150 C78 122 150 136 152 102 C153 84 138 72 124 66';

function Hatchling() {
  return (
    <Fx kind="wobble" ox={120} oy={238}>
      <Ellipse cx={120} cy={240} rx={62} ry={9} fill="#000" opacity={0.35} />
      <Polygon points="96,52 120,36 144,52 142,82 98,82" fill={TEAL} />
      <Polygon points="120,36 144,52 142,82 128,60" fill={DEEP} />
      <Polygon points="96,52 120,36 112,52" fill={ICE} opacity={0.7} />
      <Polygon points="106,42 110,26 116,38" fill={GOLD} />
      <Polygon points="124,38 130,26 134,42" fill={GOLD} />
      <Fx kind="blink" ox={120} oy={60}>
        <Polygon points="102,56 114,54 113,66 103,66" fill={EYE} />
        <Polygon points="107,56 110,56 110,65 107,65" fill={PUPIL} />
        <Polygon points="126,54 138,56 137,66 127,66" fill={EYE} />
        <Polygon points="130,56 133,56 133,65 130,65" fill={PUPIL} />
      </Fx>
      <Path d="M120 84 C170 84 190 150 185 190 C180 232 60 232 55 190 C50 150 70 84 120 84 Z" fill={TEAL} />
      <Polygon points="72,130 96,96 92,178 62,188" fill={ICE} opacity={0.35} />
      <Polygon points="160,116 186,190 150,224 146,150" fill={DEEP} opacity={0.6} />
      <Polygon points="74,96 90,80 104,94 118,78 132,94 148,80 164,96 168,110 72,110" fill={TEAL} />
      <Polygon points="74,96 90,80 104,94 96,110 72,110" fill={ICE} opacity={0.3} />
      <Polyline
        points="58,166 80,154 100,170 120,154 140,170 160,154 182,166"
        fill="none"
        stroke={GOLD}
        strokeWidth={7}
        strokeLinejoin="round"
      />
    </Fx>
  );
}

/** The long coiled body shared by the young and grown dragons. */
function Coil({ wide, bands }: { wide: number; bands: [string, string] }) {
  return (
    <>
      <Path d={BODY_PATH} stroke={DEEP} strokeWidth={wide + 10} fill="none" strokeLinecap="round" />
      <Path
        d={BODY_PATH}
        stroke={TEAL}
        strokeWidth={wide}
        fill="none"
        strokeLinecap="round"
        transform="translate(-3 -3)"
      />
      <Path d={BODY_PATH} stroke={GOLD} strokeWidth={wide + 10} fill="none" strokeDasharray={bands[0]} strokeDashoffset={Number(bands[1])} />
      <Path
        d={BODY_PATH}
        stroke={ICE}
        strokeWidth={5}
        fill="none"
        strokeDasharray="16 9"
        strokeLinecap="round"
        opacity={0.75}
        transform="translate(-8 -7)"
      />
    </>
  );
}

function YoungSelah() {
  return (
    <Fx kind="bob7" delay={600}>
      <Ellipse cx={120} cy={240} rx={80} ry={10} fill="#000" opacity={0.35} />
      <Fx kind="flick" ox={198} oy={227}>
        <Polygon points="198,226 226,216 214,238" fill={GOLD} />
      </Fx>
      <Coil wide={20} bands={['5 52', '-26']} />
      <Polygon points="162,104 176,98 162,94" fill={PALE} />
      <Polygon points="160,88 174,80 158,80" fill={PALE} />
      <Fx kind="swayDragon" ox={139.7} oy={89.6}>
        <Polygon points="116,40 122,24 128,38" fill={GOLD} />
        <Polygon points="128,38 140,26 138,42" fill={GOLD} />
        <Polygon points="96,44 130,32 152,52 144,76 108,80 90,62" fill={TEAL} />
        <Polygon points="108,80 144,76 152,52 134,60" fill={DEEP} />
        <Polygon points="96,44 130,32 120,48" fill={ICE} opacity={0.7} />
        <Polygon points="90,62 108,80 84,84 70,72" fill={TEAL} />
        <Polygon points="70,72 90,62 86,70" fill={ICE} opacity={0.7} />
        <Circle cx={77} cy={72} r={2} fill={PUPIL} />
        <Polygon points="84,84 108,80 112,90 88,93" fill={DEEP} />
        <Fx kind="blink" ox={115} oy={54}>
          <Polygon points="106,50 124,46 122,60 106,62" fill={EYE} />
          <Polygon points="113,49 117,48 116,61 112,61" fill={PUPIL} />
        </Fx>
      </Fx>
    </Fx>
  );
}

function Guardian() {
  return (
    <>
      <Fx kind="glowDragon">
        <Circle cx={120} cy={140} r={108} fill="#7FE3D6" />
      </Fx>
      <Fx kind="bob7" delay={1200}>
        <Ellipse cx={120} cy={240} rx={86} ry={10} fill="#000" opacity={0.35} />
        <Fx kind="flick" ox={196} oy={230}>
          <Polygon points="196,226 230,212 216,236 234,248 200,240" fill={GOLD} />
        </Fx>
        <Polygon points="42,150 20,140 40,164" fill={PALE} />
        <Polygon points="46,174 24,182 50,188" fill={PALE} />
        <Coil wide={24} bands={['6 34', '-20']} />
        <Polygon points="164,112 186,102 164,96" fill={PALE} />
        <Polygon points="162,94 184,78 160,82" fill={PALE} />
        <Polygon points="154,80 170,60 150,70" fill={PALE} />
        <Fx kind="swayDragon" ox={160.6} oy={89.6}>
          <Polygon points="138,44 174,28 154,54" fill={PALE} />
          <Polygon points="146,58 178,62 150,70" fill={PALE} />
          <Polygon points="116,38 130,6 132,36" fill={GOLD} />
          <Polygon points="130,36 160,14 146,42" fill={EYE} />
          <Polygon points="94,42 130,30 152,50 144,74 108,78 88,60" fill={TEAL} />
          <Polygon points="108,78 144,74 152,50 134,58" fill={DEEP} />
          <Polygon points="94,42 130,30 120,46" fill={ICE} opacity={0.7} />
          <Polygon points="88,60 108,78 80,84 62,70" fill={TEAL} />
          <Polygon points="62,70 88,60 84,68" fill={ICE} opacity={0.7} />
          <Circle cx={70} cy={70} r={2} fill={PUPIL} />
          <Polygon points="80,84 108,78 114,90 86,94" fill={DEEP} />
          <G fill="#F7F2E8">
            <Polygon points="84,84 87,90 90,83" />
            <Polygon points="93,82 96,89 99,81" />
            <Polygon points="102,80 105,87 108,79" />
          </G>
          <Fx kind="blink" ox={115} oy={52}>
            <Polygon points="106,50 124,46 122,58 106,60" fill={EYE} />
            <Polygon points="113,48 117,47 116,59 112,59" fill={PUPIL} />
          </Fx>
        </Fx>
        <Polygon points="134,84 160,88 160,100 132,96" fill={GOLD} />
      </Fx>
    </>
  );
}

/** Selah the Sea Dragon: hatchling in an egg, young coil, grown guardian. */
export function SelahDragon({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={LABELS[stage]}>
      {stage === 1 ? <Hatchling /> : stage === 2 ? <YoungSelah /> : <Guardian />}
      <DragonExtras stage={stage} />
    </PetFrame>
  );
}
