import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Fx, PetMotion, SoftGlow as Glow, TwinkleStar } from './Fx';
import { PipStage } from './PipLamb';
import type { PetId } from './registry';

// Every companion lying down: on the Pray Now button, along the top of the "Your groups" card, on the hearth rug.
// Drawn on a 170x100 artboard, head on the left and tail on the right, resting on y=96 (from design/PrayNow.dc.html).

export type LieEyes = 'sleep' | 'open' | 'up';

const VB_W = 170;
const VB_H = 100;
const PAD = 6; // room for glows, halos and the candle's rays outside the artboard
/** Height for a given width. */
export const lyingHeight = (size: number) => (size * (VB_H + 2 * PAD)) / (VB_W + 2 * PAD);
/** How far down the resting line is from the top, so a screen can set the pet on an edge. */
export const lyingFeetOffset = (size: number) => (size * (96 + PAD)) / (VB_W + 2 * PAD);

const INK = '#2B2420';
const CHEEK = '#E8998A';

/** A pair of eyes: closed and smiling while asleep, blinking while awake, glancing up while waiting. */
function Eyes({ l, r, y, mode, rad = 3.6, iris, pupil = INK }: { l: number; r: number; y: number; mode: LieEyes; rad?: number; iris?: string; pupil?: string }) {
  if (mode === 'sleep') {
    return (
      <Path
        d={`M${l - 4} ${y} Q${l} ${y + 3.4} ${l + 4} ${y} M${r - 4} ${y} Q${r} ${y + 3.4} ${r + 4} ${y}`}
        stroke={pupil}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  const dy = mode === 'up' ? -2.6 : 0;
  return (
    <Fx kind="blink" ox={(l + r) / 2} oy={y}>
      {iris ? (
        <>
          <Circle cx={l} cy={y} r={rad + 1.6} fill={iris} />
          <Circle cx={r} cy={y} r={rad + 1.6} fill={iris} />
        </>
      ) : null}
      <Circle cx={l} cy={y + dy} r={iris ? rad * 0.62 : rad} fill={pupil} />
      <Circle cx={r} cy={y + dy} r={iris ? rad * 0.62 : rad} fill={pupil} />
      <Circle cx={l + 1.2} cy={y + dy - 1.3} r={1.2} fill="#FFFFFF" />
      <Circle cx={r + 1.2} cy={y + dy - 1.3} r={1.2} fill="#FFFFFF" />
    </Fx>
  );
}


const PILLOW: Record<PetId, [string, string]> = {
  lamb: ['#7FA4D8', '#B5CDEE'],
  dove: ['#F2D98B', '#FBEFC4'],
  lion: ['#B8433A', '#E08A7E'],
  ember: ['#8A93A6', '#C3CAD8'],
  dragon: ['#2F8F93', '#8FD3D3'],
  pumpkin: ['#7A55A8', '#B79BD8'],
};

/** A little pillow under the head while it sleeps. */
function Pillow({ id, x = 46 }: { id: PetId; x?: number }) {
  const [a, b] = PILLOW[id];
  return (
    <>
      <Path d={`M${x - 30} 90 Q${x - 32} 80 ${x - 22} 80 L${x + 22} 80 Q${x + 32} 80 ${x + 30} 90 Q${x + 32} 98 ${x + 22} 98 L${x - 22} 98 Q${x - 32} 98 ${x - 30} 90 Z`} fill={a} />
      <Path d={`M${x - 22} 84 L${x + 22} 84`} stroke={b} strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" />
      <Circle cx={x - 28} cy={89} r={2} fill={b} />
      <Circle cx={x + 28} cy={89} r={2} fill={b} />
    </>
  );
}

/* ------------------------------------------------------------------ lion */

const FUR = '#E3A957';
const FACE = '#EDB565';
const MUZZLE = '#F6D9A8';
const MANE = '#C77A35';
const NOSE = '#6B3F2A';

function LionLying({ stage, eyes }: { stage: PipStage; eyes: LieEyes }) {
  const mane = stage === 3 ? '#D98F3A' : MANE;
  return (
    <>
      {stage === 3 ? (
        <Glow cx={80} cy={58} r={64} color="#F2C462" />
      ) : null}
      <Fx kind={eyes === 'sleep' ? 'swish' : 'tailFlick'} ox={140} oy={72}>
        <Path d="M140 72 C162 66 168 48 158 36" stroke={FUR} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Circle cx={157} cy={32} r={6.5} fill={mane} />
      </Fx>
      <Fx kind={eyes === 'sleep' ? 'breatheSlow' : 'breatheLie'} ox={100} oy={96}>
        <Ellipse cx={100} cy={74} rx={48} ry={22} fill={FUR} />
        <Ellipse cx={128} cy={80} rx={18} ry={13} fill="#D9A04E" />
        <Ellipse cx={96} cy={82} rx={22} ry={10} fill={MUZZLE} opacity={0.5} />
        {stage >= 2 ? <Path d="M112 60 Q120 56 128 62 M100 58 Q106 55 112 58" stroke="#D99A48" strokeWidth={2} fill="none" strokeLinecap="round" /> : null}
      </Fx>
      <Ellipse cx={132} cy={94} rx={12} ry={6} fill={FACE} />
      {eyes === 'sleep' ? <Pillow id="lion" /> : null}
      <Fx kind="headNod" ox={50} oy={86}>
        {stage === 1 ? (
          <G fill={MANE}>
            <Circle cx={36} cy={30} r={8} />
            <Circle cx={50} cy={26} r={9} />
            <Circle cx={64} cy={30} r={8} />
          </G>
        ) : (
          <>
            {stage === 3 ? (
              <G fill="#A85A22">
                <Circle cx={18} cy={34} r={13} />
                <Circle cx={82} cy={34} r={13} />
                <Circle cx={12} cy={62} r={13} />
                <Circle cx={88} cy={62} r={13} />
                <Circle cx={34} cy={18} r={12} />
                <Circle cx={66} cy={18} r={12} />
              </G>
            ) : null}
            <Fx kind="breatheLion" ox={50} oy={58}>
              <G fill={mane}>
                <Circle cx={50} cy={58} r={36} />
                <Circle cx={50} cy={22} r={12} />
                <Circle cx={22} cy={36} r={12} />
                <Circle cx={78} cy={36} r={12} />
                <Circle cx={16} cy={62} r={12} />
                <Circle cx={84} cy={62} r={12} />
                <Circle cx={24} cy={84} r={11} />
                <Circle cx={76} cy={84} r={11} />
              </G>
            </Fx>
          </>
        )}
        <Circle cx={28} cy={38} r={9} fill={FACE} />
        <Circle cx={72} cy={38} r={9} fill={FACE} />
        <Circle cx={28} cy={38} r={4.5} fill="#D9955A" />
        <Circle cx={72} cy={38} r={4.5} fill="#D9955A" />
        <Circle cx={50} cy={58} r={26} fill={FACE} />
        <Ellipse cx={50} cy={68} rx={11} ry={8} fill={MUZZLE} />
        <Path d="M46 63 L54 63 L50 68 Z" fill={NOSE} />
        <Path d="M50 68 Q47 72 44 70 M50 68 Q53 72 56 70" stroke={NOSE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Eyes l={42} r={58} y={55} mode={eyes} />
        <Circle cx={34} cy={65} r={4} fill={CHEEK} opacity={0.6} />
        <Circle cx={66} cy={65} r={4} fill={CHEEK} opacity={0.6} />
        {stage === 3 ? (
          <>
            <Polygon points="36,26 39,10 45,20 50,4 55,20 61,10 64,26" fill="#F2C462" stroke="#C99A2E" strokeWidth={1.6} strokeLinejoin="round" />
            <Circle cx={50} cy={20} r={3} fill="#8FC6A9" />
          </>
        ) : null}
      </Fx>
      <Ellipse cx={36} cy={95} rx={13} ry={6} fill={FACE} />
      <Ellipse cx={62} cy={96} rx={13} ry={6} fill={FACE} />
      <Path d="M31 97 L31 100 M36 98 L36 101 M41 97 L41 100 M57 98 L57 101 M62 99 L62 102 M67 98 L67 101" stroke="#C99A5A" strokeWidth={1.4} strokeLinecap="round" />
      {stage === 3 ? (
        <>
          <TwinkleStar x={130} y={12} fill="#F2C462" />
          <TwinkleStar x={96} y={30} fill="#F7E3B5" delay={700} />
        </>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ lamb */

function LambLying({ stage, eyes }: { stage: PipStage; eyes: LieEyes }) {
  const fleece = stage === 3 ? '#FFFBF2' : '#F7F2E8';
  return (
    <>
      {stage === 3 ? (
        <Glow cx={90} cy={58} r={60} color="#F2C462" />
      ) : null}
      <Fx kind={eyes === 'sleep' ? 'sway' : 'tailWag'} ox={148} oy={74}>
        <Circle cx={152} cy={70} r={7} fill={fleece} />
        <Circle cx={158} cy={65} r={5} fill={fleece} />
      </Fx>
      <Rect x={118} y={86} width={11} height={10} rx={4} fill="#4A3F3A" />
      <Rect x={136} y={86} width={11} height={10} rx={4} fill="#4A3F3A" />
      <Fx kind={eyes === 'sleep' ? 'breatheSlow' : 'breatheLie'} ox={110} oy={96}>
        <G fill={fleece}>
          <Circle cx={92} cy={70} r={20} />
          <Circle cx={114} cy={64} r={22} />
          <Circle cx={136} cy={72} r={17} />
          <Circle cx={80} cy={80} r={16} />
          <Circle cx={104} cy={82} r={16} />
          <Circle cx={128} cy={84} r={14} />
        </G>
        <G fill="#E9E1D2">
          <Circle cx={100} cy={62} r={2} />
          <Circle cx={124} cy={70} r={2.4} />
          <Circle cx={112} cy={84} r={2} />
        </G>
        {stage === 3 ? (
          <G fill="#F2C462">
            <Circle cx={96} cy={66} r={2} />
            <Circle cx={130} cy={76} r={2} />
          </G>
        ) : null}
      </Fx>
      {stage === 3 ? (
        <Fx kind="flap" ox={108} oy={56}>
          <Path d="M108 58 C98 38 112 24 126 34 C132 40 128 52 116 58 Z" fill="#FFFFFF" stroke="#F2C462" strokeWidth={1.6} />
          <Path d="M112 52 Q118 42 124 38 M110 46 Q114 38 118 34" stroke="#E6DCC8" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </Fx>
      ) : null}
      {eyes === 'sleep' ? <Pillow id="lamb" /> : null}
      <Fx kind="headNod" ox={50} oy={86}>
        <Fx kind="earFlop" ox={32} oy={52}>
          <Ellipse cx={22} cy={58} rx={14} ry={6.5} fill="#E9D3BA" rotation={22} originX={22} originY={58} />
        </Fx>
        <Fx kind="earFlopR" ox={68} oy={52}>
          <Ellipse cx={78} cy={58} rx={14} ry={6.5} fill="#E9D3BA" rotation={-22} originX={78} originY={58} />
        </Fx>
        <Ellipse cx={50} cy={60} rx={22} ry={21} fill="#F1E2CC" />
        <G fill={fleece}>
          <Circle cx={39} cy={41} r={9} />
          <Circle cx={50} cy={36} r={10} />
          <Circle cx={61} cy={41} r={9} />
        </G>
        <Eyes l={42} r={58} y={60} mode={eyes} rad={3.4} />
        <Ellipse cx={50} cy={70} rx={3.4} ry={2.2} fill={CHEEK} />
        <Path d="M50 72 Q47 76 44 74 M50 72 Q53 76 56 74" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Circle cx={34} cy={68} r={4} fill={CHEEK} opacity={0.5} />
        <Circle cx={66} cy={68} r={4} fill={CHEEK} opacity={0.5} />
        {stage >= 2 ? (
          <>
            <Path d="M32 78 Q50 88 68 78" stroke="#8FC6A9" strokeWidth={4} fill="none" strokeLinecap="round" />
            <Fx kind="sway4" ox={50} oy={83}>
              <Circle cx={50} cy={86} r={4.6} fill="#F2C462" />
              <Rect x={49} y={86} width={2} height={3} fill="#C99A2E" />
            </Fx>
          </>
        ) : null}
        {stage === 3 ? (
          <Fx kind="haloFloat">
            <Ellipse cx={50} cy={20} rx={17} ry={4.5} fill="none" stroke="#F2C462" strokeWidth={3} />
          </Fx>
        ) : null}
      </Fx>
      <Circle cx={38} cy={89} r={7} fill={fleece} />
      <Circle cx={62} cy={90} r={7} fill={fleece} />
      <Rect x={32} y={90} width={12} height={8} rx={4} fill="#4A3F3A" />
      <Rect x={56} y={91} width={12} height={8} rx={4} fill="#4A3F3A" />
    </>
  );
}

/* ------------------------------------------------------------------ dove */

function DoveLying({ stage, eyes }: { stage: PipStage; eyes: LieEyes }) {
  return (
    <>
      {stage === 3 ? (
        <Glow cx={90} cy={58} r={62} color="#F2C462" />
      ) : null}
      {stage === 1 ? (
        <>
          <Ellipse cx={98} cy={92} rx={58} ry={9} fill="#8A6440" />
          <Path d="M44 90 L70 96 M60 86 L92 98 M88 86 L120 97 M110 86 L150 95 M130 87 L152 92" stroke="#6B4A2A" strokeWidth={2} strokeLinecap="round" />
        </>
      ) : null}
      <Fx kind="sway" ox={140} oy={72}>
        <Ellipse cx={154} cy={62} rx={17} ry={6} fill="#E6E1D7" rotation={-24} originX={154} originY={62} />
        <Ellipse cx={158} cy={72} rx={18} ry={6} fill="#F7F5F0" />
        <Ellipse cx={154} cy={82} rx={16} ry={5.5} fill="#E6E1D7" rotation={18} originX={154} originY={82} />
        {stage === 3 ? <Path d="M168 70 L176 72" stroke="#F2C462" strokeWidth={2} strokeLinecap="round" /> : null}
      </Fx>
      <Fx kind={eyes === 'sleep' ? 'breatheSlow' : 'breatheLie'} ox={100} oy={96}>
        <Ellipse cx={98} cy={74} rx={46} ry={22} fill="#F7F5F0" />
        <Ellipse cx={92} cy={84} rx={26} ry={9} fill="#FFFFFF" opacity={0.7} />
        <Fx kind="ruffle" ox={112} oy={72}>
          <Path d="M76 66 C96 48 128 52 146 68 C128 80 98 80 76 66 Z" fill="#E9E4DA" stroke={stage === 3 ? '#F2C462' : 'none'} strokeWidth={1.6} />
          <Path d="M100 62 Q112 66 120 74 M112 58 Q124 64 132 72 M124 58 Q134 64 140 70" stroke="#D8D2C6" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Fx>
      </Fx>
      <Path d="M92 94 L90 99 M96 94 L96 99 M106 94 L106 99 M110 94 L112 99" stroke="#E8A24B" strokeWidth={1.8} strokeLinecap="round" />
      {eyes === 'sleep' ? <Pillow id="dove" x={48} /> : null}
      <Fx kind="peck" ox={48} oy={74}>
        {stage === 1 ? (
          <G fill="#ECE7DD">
            <Circle cx={43} cy={33} r={4.5} />
            <Circle cx={50} cy={30} r={5.5} />
            <Circle cx={57} cy={34} r={4.5} />
          </G>
        ) : null}
        <Circle cx={48} cy={54} r={21} fill="#FAF8F3" />
        <Eyes l={41} r={56} y={51} mode={eyes} rad={3.4} />
        <Path d="M44 58 L53 58 L48.5 65 Z" fill="#E8A24B" />
        <Circle cx={34} cy={60} r={3.6} fill={CHEEK} opacity={0.5} />
        <Circle cx={63} cy={60} r={3.6} fill={CHEEK} opacity={0.5} />
        {stage >= 2 ? (
          <Fx kind="leafSway" ox={46} oy={64}>
            <Path d="M47 64 C38 68 30 70 20 70" stroke="#6E8B4E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Ellipse cx={34} cy={66} rx={5.5} ry={2.4} fill="#8DAA62" rotation={-30} originX={34} originY={66} />
            <Ellipse cx={26} cy={72} rx={5.5} ry={2.4} fill="#8DAA62" rotation={25} originX={26} originY={72} />
            <Ellipse cx={20} cy={68} rx={5} ry={2.2} fill="#7A9A56" rotation={-20} originX={20} originY={68} />
          </Fx>
        ) : null}
        {stage === 3 ? (
          <Fx kind="haloFloat">
            <Ellipse cx={48} cy={24} rx={16} ry={4} fill="none" stroke="#F2C462" strokeWidth={3} />
          </Fx>
        ) : null}
      </Fx>
    </>
  );
}

/* ------------------------------------------------------------------ candle (lying on its side) */

function EmberLying({ stage, eyes }: { stage: PipStage; eyes: LieEyes }) {
  const wax = stage === 3 ? '#F7F0E2' : '#F3EBDD';
  return (
    <>
      {stage === 3 ? (
        <>
          <Fx kind="spin30" ox={44} oy={50}>
            <Path
              d="M44 10 V24 M4 50 H18 M70 50 H84 M16 22 L26 32 M72 22 L62 32 M26 68 L16 78"
              stroke="#F2C462"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.35}
            />
          </Fx>
          <Ellipse cx={100} cy={95} rx={64} ry={5} fill="#C9A24B" />
          <Ellipse cx={100} cy={93} rx={58} ry={3.4} fill="#DDBA62" />
        </>
      ) : null}
      <Glow cx={44} cy={52} r={stage === 3 ? 40 : 32} color="#F2A93B" kind={stage === 3 ? 'glowb' : 'glowEmber'} />
      <Fx kind={eyes === 'sleep' ? 'breatheSlow' : 'breatheLie'} ox={100} oy={94}>
        <Rect x={48} y={62} width={104} height={32} rx={12} fill={wax} />
        <Rect x={48} y={82} width={104} height={12} rx={8} fill="#E6DCC8" />
        <Ellipse cx={51} cy={78} rx={6} ry={15} fill="#FFF8EC" />
        <Path d="M66 62 q0 9 5 9 q5 0 5 -9 Z M98 62 q0 6 4 6 q4 0 4 -6 Z M130 62 q0 10 5 10 q5 0 5 -10 Z" fill="#FFF8EC" />
        <Eyes l={82} r={100} y={77} mode={eyes} rad={3.4} />
        <Path d="M86 84 Q91 88 96 84" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Circle cx={75} cy={84} r={3.6} fill={CHEEK} opacity={0.5} />
        <Circle cx={107} cy={84} r={3.6} fill={CHEEK} opacity={0.5} />
        {stage >= 2 ? (
          <Fx kind="drip">
            <Path d="M118 62 q-3 6 0 9 q3 -3 0 -9 Z" fill="#FFF8EC" />
          </Fx>
        ) : null}
      </Fx>
      <Path d="M47 76 Q44 74 44 70" stroke="#3A2E28" strokeWidth={2} fill="none" strokeLinecap="round" />
      <G transform="translate(6 0)">
      <Fx kind={eyes === 'sleep' ? 'flameDim' : 'flameLie'} ox={38} oy={71}>
        <Path d={stage === 1 ? 'M38 71 C31 64 32 56 38 46 C44 56 45 64 38 71 Z' : 'M38 71 C28 62 30 50 38 34 C46 50 48 62 38 71 Z'} fill="#F2A93B" />
        <Path d={stage === 1 ? 'M38 70 C35 66 35 61 38 55 C41 61 41 66 38 70 Z' : 'M38 69 C33 63 34 56 38 47 C42 56 43 63 38 69 Z'} fill="#FFE08A" />
        {stage === 3 ? <Path d="M38 66 C36 63 36 60 38 56 C40 60 40 63 38 66 Z" fill="#FFFFFF" /> : null}
      </Fx>
      </G>
      <Ellipse cx={72} cy={96} rx={7} ry={3} fill={wax} />
      <Ellipse cx={128} cy={96} rx={7} ry={3} fill={wax} />
    </>
  );
}

/* ------------------------------------------------------------------ sea dragon */

const TEAL = '#1C9C98';
const DEEP = '#0E5E61';
const ICE = '#86E6D9';
const PALE = '#D7F4EF';
const GOLD = '#E8B93A';

function DragonLying({ stage, eyes }: { stage: PipStage; eyes: LieEyes }) {
  return (
    <>
      {stage === 3 ? (
        <Glow cx={90} cy={58} r={64} color="#7FE3D6" />
      ) : null}
      <Fx kind="tailFlick" ox={156} oy={72}>
        <Path d="M154 72 C164 60 170 58 170 48 C178 60 178 78 168 86 C168 80 162 76 154 72 Z" fill={ICE} />
        <Path d="M160 70 L170 56 M162 74 L172 70 M160 76 L168 82" stroke={TEAL} strokeWidth={1.2} strokeLinecap="round" />
      </Fx>
      <Fx kind="undulate" ox={104} oy={92}>
        <Path d="M60 80 C76 58 94 58 104 76 C114 92 130 94 140 80 C146 72 152 70 158 72" stroke={TEAL} strokeWidth={20} fill="none" strokeLinecap="round" />
        <Path d="M64 88 C78 70 92 70 102 86 C112 100 132 100 142 88" stroke={PALE} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
        <Path d="M78 56 L84 42 L90 56 Z M92 58 L98 46 L102 60 Z M140 70 L146 60 L150 72 Z" fill={GOLD} />
        <G fill={ICE}>
          <Circle cx={88} cy={66} r={2} />
          <Circle cx={118} cy={84} r={2} />
          <Circle cx={132} cy={84} r={1.8} />
          <Circle cx={100} cy={72} r={1.6} />
        </G>
      </Fx>
      {eyes === 'sleep' ? <Pillow id="dragon" /> : null}
      <Fx kind="swayDragon" ox={50} oy={84}>
        <Path d="M30 46 Q22 30 34 32 Q38 22 48 30 Q56 20 62 32 Q72 28 68 44 Z" fill={ICE} />
        {stage >= 2 ? (
          <Path d="M38 38 Q34 26 40 22 M60 38 Q64 26 58 22" stroke={GOLD} strokeWidth={3.4} fill="none" strokeLinecap="round" />
        ) : null}
        <Ellipse cx={48} cy={58} rx={22} ry={19} fill="#2BB3AD" />
        <Ellipse cx={48} cy={71} rx={14} ry={9} fill={PALE} />
        <Circle cx={44} cy={70} r={1.4} fill={DEEP} />
        <Circle cx={52} cy={70} r={1.4} fill={DEEP} />
        <Path d="M42 76 Q48 80 54 76" stroke={DEEP} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Eyes l={39} r={57} y={54} mode={eyes} rad={3.6} iris="#F2C462" pupil="#0A3B3D" />
        <Circle cx={30} cy={64} r={3.4} fill={CHEEK} opacity={0.45} />
        <Circle cx={66} cy={64} r={3.4} fill={CHEEK} opacity={0.45} />
        {stage === 1 ? (
          <>
            <Path d="M28 46 L32 36 L37 43 L43 32 L49 41 L55 32 L61 43 L65 36 L69 46 Q49 34 28 46 Z" fill="#F7F2E8" />
            <Circle cx={40} cy={40} r={1.6} fill="#E3D6BE" />
            <Circle cx={58} cy={41} r={1.6} fill="#E3D6BE" />
          </>
        ) : null}
        {stage === 3 ? <TwinkleStar x={30} y={10} fill="#F7E3B5" /> : null}
      </Fx>
      <Ellipse cx={66} cy={94} rx={13} ry={5} fill={TEAL} rotation={-10} originX={66} originY={94} />
      <Ellipse cx={34} cy={95} rx={11} ry={4.5} fill={TEAL} rotation={10} originX={34} originY={95} />
    </>
  );
}

/* ------------------------------------------------------------------ pumpkin */

function PumpkinLying({ stage, eyes }: { stage: PipStage; eyes: LieEyes }) {
  const carved = stage === 3;
  return (
    <>
      {carved ? (
        <Glow cx={96} cy={64} r={58} color="#F2A93B" />
      ) : null}
      <Path d="M70 74 C50 76 40 86 44 94" stroke="#6E8B4E" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M122 74 C142 76 152 86 148 94" stroke="#6E8B4E" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M52 80 q-8 -6 -4 -12 q6 0 4 6" stroke="#8DAA62" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M140 80 q8 -6 4 -12 q-6 0 -4 6" stroke="#8DAA62" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Ellipse cx={44} cy={94} rx={9} ry={4.5} fill="#8DAA62" />
      <Ellipse cx={148} cy={94} rx={9} ry={4.5} fill="#8DAA62" />
      {eyes === 'sleep' ? <Pillow id="pumpkin" x={96} /> : null}
      <Fx kind="wobbleLie" ox={96} oy={96}>
        <Ellipse cx={70} cy={68} rx={26} ry={26} fill="#D9762E" />
        <Ellipse cx={122} cy={68} rx={26} ry={26} fill="#D9762E" />
        <Ellipse cx={96} cy={66} rx={31} ry={30} fill={carved ? '#F09A44' : '#E8873A'} />
        <Path d="M80 40 Q74 66 80 94 M112 40 Q118 66 112 94" stroke="#C9692E" strokeWidth={2} fill="none" opacity={0.7} />
        <Rect x={92} y={30} width={8} height={12} rx={3} fill="#6B4A2A" />
        <Path d="M100 34 q8 -10 4 -16 q-6 2 -2 8" stroke="#6E8B4E" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Fx kind="sprout" ox={96} oy={34}>
          {stage === 1 ? (
            <>
              <Path d="M96 32 q-10 -10 -16 -4 q6 8 16 4 z" fill="#8DAA62" />
              <Path d="M96 32 q10 -10 16 -4 q-6 8 -16 4 z" fill="#7FA35A" />
            </>
          ) : (
            <Path d="M94 34 q-16 -12 -26 -2 q12 12 26 2 z" fill="#7FA35A" />
          )}
        </Fx>
        {carved ? (
          eyes === 'sleep' ? (
            <>
              <Path d="M78 64 Q84 68 90 64 M102 64 Q108 68 114 64" stroke="#FFE08A" strokeWidth={3} fill="none" strokeLinecap="round" />
              <Path d="M82 76 L88 82 L94 76 L100 82 L106 76 L110 80 Q96 90 82 80 Z" fill="#FFE08A" opacity={0.8} />
            </>
          ) : (
            <Fx kind="candle">
              <Polygon points={eyes === 'up' ? '78,64 90,64 84,52' : '78,68 90,68 84,56'} fill="#FFE08A" />
              <Polygon points={eyes === 'up' ? '102,64 114,64 108,52' : '102,68 114,68 108,56'} fill="#FFE08A" />
              <Path d="M80 76 L87 82 L93 76 L99 82 L105 76 L112 78 Q96 92 80 78 Z" fill="#FFE08A" />
            </Fx>
          )
        ) : (
          <>
            <Eyes l={84} r={108} y={64} mode={eyes} rad={4} />
            <Path d="M88 76 Q96 83 104 76" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
            <Circle cx={76} cy={74} r={4.4} fill={CHEEK} opacity={0.55} />
            <Circle cx={116} cy={74} r={4.4} fill={CHEEK} opacity={0.55} />
          </>
        )}
      </Fx>
    </>
  );
}

/** A little friend or flourish near each lying pet while it is awake (asleep, the world goes quiet). */
function Friend({ id, eyes }: { id: PetId; eyes: LieEyes }) {
  if (eyes === 'sleep') return null;
  switch (id) {
    case 'lion':
      // a butterfly looping around the tail
      return (
        <G transform="translate(120 10)">
          <Fx kind="flutterH">
            <Fx kind="wingBeat" ox={10} oy={8}>
              <Ellipse cx={6} cy={6} rx={6} ry={4.5} fill="#B9A6F2" />
              <Ellipse cx={14} cy={6} rx={6} ry={4.5} fill="#9C84E8" />
              <Ellipse cx={7} cy={11} rx={4} ry={3} fill="#D7C9FA" />
              <Ellipse cx={13} cy={11} rx={4} ry={3} fill="#B9A6F2" />
            </Fx>
            <Rect x={9.2} y={4} width={1.6} height={10} rx={0.8} fill="#4A3F3A" />
          </Fx>
        </G>
      );
    case 'lamb':
      return (
        <>
          <Fx kind="sprout" ox={66} oy={42}>
            <G fill="#FFFFFF">
              <Circle cx={66} cy={32} r={3} />
              <Circle cx={72} cy={36} r={3} />
              <Circle cx={70} cy={42} r={3} />
              <Circle cx={62} cy={42} r={3} />
              <Circle cx={60} cy={36} r={3} />
            </G>
            <Circle cx={66} cy={37.5} r={2.6} fill="#F2C462" />
          </Fx>
          <Fx kind="noteFloat" delay={600}>
            <Path d="M84 30 v-14 l10 -3 v13" stroke="#B5DCC6" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Circle cx={82} cy={30} r={2.6} fill="#B5DCC6" />
            <Circle cx={92} cy={27} r={2.6} fill="#B5DCC6" />
          </Fx>
        </>
      );
    case 'dove':
      return (
        <Fx kind="heartUp" delay={400}>
          <Path d="M12 21 C5 15 2 11.5 2 8.5 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8.5 C22 11.5 19 15 12 21 Z" fill="#F2A9A0" transform="translate(66 26) scale(0.55)" />
        </Fx>
      );
    case 'ember':
      return (
        <>
          <Fx kind="sparkE" delay={0}><Circle cx={42} cy={34} r={1.8} fill="#FFE08A" /></Fx>
          <Fx kind="sparkE" delay={900}><Circle cx={48} cy={30} r={1.5} fill="#F2A93B" /></Fx>
          <Fx kind="sparkE" delay={1700}><Circle cx={45} cy={38} r={1.4} fill="#FFE08A" /></Fx>
        </>
      );
    case 'dragon':
      return (
        <>
          <Fx kind="bubbleUp" delay={0}><Circle cx={30} cy={62} r={3.4} fill="none" stroke="#BDEBE6" strokeWidth={1.4} /></Fx>
          <Fx kind="bubbleUp" delay={1300}><Circle cx={26} cy={68} r={2.4} fill="none" stroke="#BDEBE6" strokeWidth={1.2} /></Fx>
          <Fx kind="bubbleUp" delay={2600}><Circle cx={34} cy={66} r={2} fill="none" stroke="#F7DFA0" strokeWidth={1.2} /></Fx>
        </>
      );
    default:
      // fireflies drifting around the pumpkin
      return (
        <>
          <Fx kind="firefly" delay={0}><Circle cx={140} cy={30} r={2} fill="#E9F59A" /></Fx>
          <Fx kind="firefly" delay={1400}><Circle cx={48} cy={40} r={1.8} fill="#E9F59A" /></Fx>
          <Fx kind="firefly" delay={2600}><Circle cx={156} cy={52} r={1.6} fill="#E9F59A" /></Fx>
        </>
      );
  }
}

/* ------------------------------------------------------------------ */

const ART: Record<PetId, React.ComponentType<{ stage: PipStage; eyes: LieEyes }>> = {
  lion: LionLying,
  lamb: LambLying,
  dove: DoveLying,
  ember: EmberLying,
  dragon: DragonLying,
  pumpkin: PumpkinLying,
};

const LABELS: Record<LieEyes, string> = { sleep: 'asleep', open: 'lying down', up: 'looking up hopefully' };

/** A companion lying down. `size` is the width in dp. Stage 1 is drawn a little smaller. */
export function LyingPet({ id, stage, size = 136, eyes = 'open', animated = true }: { id: PetId; stage: PipStage; size?: number; eyes?: LieEyes; animated?: boolean }) {
  const Art = ART[id];
  return (
    <PetMotion.Provider value={animated}>
      <Svg viewBox={`${-PAD} ${-PAD} ${VB_W + 2 * PAD} ${VB_H + 2 * PAD}`} width={size} height={lyingHeight(size)} accessibilityRole="image" accessibilityLabel={`Your companion ${LABELS[eyes]}`}>
        <Ellipse cx={92} cy={98} rx={72} ry={4} fill="#000" opacity={0.25} />
        {stage === 1 ? (
          <G transform="translate(8.5 9.6) scale(0.9)">
            <Art stage={stage} eyes={eyes} />
          </G>
        ) : (
          <Art stage={stage} eyes={eyes} />
        )}
        <Friend id={id} eyes={eyes} />
      </Svg>
    </PetMotion.Provider>
  );
}
