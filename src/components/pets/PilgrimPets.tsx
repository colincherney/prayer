import React from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { Fx, SoftGlow, TwinkleStar } from './Fx';
import { PetFrame } from './PetFrame';
import { PipStage } from './PipLamb';
import type { PetId } from './registry';

// The quest guide: your companion dressed as a hooded pilgrim (an original costume) with a satchel and a shepherd's
// crook with a swinging lantern. From design/Quests.dc.html, drawn for every pet on the shared 240x260 artboard.
// Stage 1 is a young pilgrim; from stage 2 the guide wears little spectacles; stage 3 adds gold trim and a crown or
// halo. Every face sits at the same spot (eyes at 109/131, 140) so the hood and spectacles fit them all.

const INK = '#2B2420';
const CHEEK = '#E8998A';
const GOLD = '#E8C27A';

type Cloak = { back: string; front: string; hood: string; rim: string };

const CLOAKS: Record<PetId, Cloak> = {
  lion: { back: '#26407A', front: '#2F4B8A', hood: '#26407A', rim: '#3E5E9E' },
  lamb: { back: '#5A4636', front: '#6B5442', hood: '#5A4636', rim: '#7E6650' },
  dove: { back: '#4A5578', front: '#56628A', hood: '#4A5578', rim: '#6A77A0' },
  ember: { back: '#4A2F5A', front: '#573A6A', hood: '#4A2F5A', rim: '#6E4E84' },
  dragon: { back: '#23503F', front: '#2C5E4B', hood: '#23503F', rim: '#3E7A62' },
  pumpkin: { back: '#3A2A5A', front: '#46336A', hood: '#3A2A5A', rim: '#5A4680' },
};

/** Two eyes at the shared spot, blinking. `iris` draws gold dragon eyes. */
function Eyes({ iris }: { iris?: string }) {
  return (
    <Fx kind="blink" ox={120} oy={140}>
      {iris ? (
        <>
          <Circle cx={109} cy={140} r={5.4} fill={iris} />
          <Circle cx={131} cy={140} r={5.4} fill={iris} />
        </>
      ) : null}
      <Circle cx={109} cy={140} r={iris ? 2.6 : 4} fill={iris ? '#0A3B3D' : INK} />
      <Circle cx={131} cy={140} r={iris ? 2.6 : 4} fill={iris ? '#0A3B3D' : INK} />
      <Circle cx={110.4} cy={138.6} r={1.3} fill="#FFFFFF" />
      <Circle cx={132.4} cy={138.6} r={1.3} fill="#FFFFFF" />
    </Fx>
  );
}

const Cheeks = ({ y = 154, o = 0.6 }: { y?: number; o?: number }) => (
  <>
    <Circle cx={100} cy={y} r={4.5} fill={CHEEK} opacity={o} />
    <Circle cx={140} cy={y} r={4.5} fill={CHEEK} opacity={o} />
  </>
);

type Parts = {
  /** Behind the body: tails, fins. */
  tail?: React.ReactNode;
  body: React.ReactNode;
  feet: React.ReactNode;
  /** The hand holding the crook, at the end of the sleeve (180, 188). */
  paw: React.ReactNode;
  /** The face inside the hood, centered on (120, 144). */
  face: React.ReactNode;
  /** Things that poke out of the hood: ears, horns, a flame, a stem. */
  out?: React.ReactNode;
  /** Above everything at stage 3: a crown or halo. */
  crown?: React.ReactNode;
};

/* ------------------------------------------------------------------ each pet */

function lionParts(stage: PipStage): Parts {
  const FUR = '#E3A957';
  const FACE = '#EDB565';
  const MUZZLE = '#F6D9A8';
  const MANE = stage === 3 ? '#D98F3A' : '#C77A35';
  return {
    tail: (
      <Fx kind="swish" ox={150} oy={238}>
        <Path d="M150 238 C170 242 182 230 180 216" stroke={FUR} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Circle cx={180} cy={211} r={7} fill={MANE} />
      </Fx>
    ),
    body: (
      <>
        <Ellipse cx={120} cy={206} rx={32} ry={34} fill={FUR} />
        <Ellipse cx={120} cy={214} rx={18} ry={20} fill={MUZZLE} />
      </>
    ),
    feet: (
      <>
        <Ellipse cx={104} cy={250} rx={12} ry={7} fill={FACE} />
        <Ellipse cx={136} cy={250} rx={12} ry={7} fill={FACE} />
      </>
    ),
    paw: <Ellipse cx={180} cy={188} rx={10} ry={9} fill={FACE} />,
    face: (
      <>
        <G fill={MANE}>
          <Circle cx={100} cy={124} r={9} />
          <Circle cx={140} cy={124} r={9} />
          <Circle cx={120} cy={116} r={9} />
          {stage >= 2 ? (
            <>
              <Circle cx={92} cy={140} r={8} />
              <Circle cx={148} cy={140} r={8} />
            </>
          ) : null}
        </G>
        <Circle cx={120} cy={144} r={28} fill={FACE} />
        <Ellipse cx={120} cy={156} rx={13} ry={9} fill={MUZZLE} />
        <Eyes />
        <Path d="M115 151 L125 151 L120 157 Z" fill="#6B3F2A" />
        <Path d="M120 157 Q116 161 112 159 M120 157 Q124 161 128 159" stroke="#6B3F2A" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Cheeks />
      </>
    ),
    out: (
      <>
        <Circle cx={92} cy={104} r={10} fill={FACE} />
        <Circle cx={92} cy={104} r={5} fill="#D9955A" />
        <Circle cx={148} cy={104} r={10} fill={FACE} />
        <Circle cx={148} cy={104} r={5} fill="#D9955A" />
      </>
    ),
    crown: (
      <>
        <Polygon points="102,84 106,62 113,74 120,54 127,74 134,62 138,84" fill="#F2C462" stroke="#C99A2E" strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={120} cy={74} r={3.4} fill="#8FC6A9" />
      </>
    ),
  };
}

function lambParts(stage: PipStage): Parts {
  const FLEECE = stage === 3 ? '#FFFBF2' : '#F7F2E8';
  const HOOF = '#4A3F3A';
  return {
    tail: (
      <Fx kind="tailWag" ox={150} oy={236}>
        <Circle cx={156} cy={234} r={8} fill={FLEECE} />
        <Circle cx={163} cy={228} r={5.5} fill={FLEECE} />
      </Fx>
    ),
    body: (
      <G fill={FLEECE}>
        <Circle cx={104} cy={200} r={20} />
        <Circle cx={136} cy={200} r={20} />
        <Circle cx={120} cy={190} r={22} />
        <Circle cx={110} cy={222} r={20} />
        <Circle cx={132} cy={222} r={20} />
      </G>
    ),
    feet: (
      <>
        <Rect x={96} y={242} width={16} height={12} rx={5} fill={HOOF} />
        <Rect x={128} y={242} width={16} height={12} rx={5} fill={HOOF} />
      </>
    ),
    paw: (
      <>
        <Circle cx={178} cy={186} r={8} fill={FLEECE} />
        <Rect x={174} y={186} width={12} height={10} rx={4} fill={HOOF} />
      </>
    ),
    face: (
      <>
        <Ellipse cx={120} cy={146} rx={25} ry={24} fill="#F1E2CC" />
        <G fill={FLEECE}>
          <Circle cx={105} cy={124} r={9} />
          <Circle cx={120} cy={120} r={10} />
          <Circle cx={135} cy={124} r={9} />
        </G>
        <Eyes />
        <Ellipse cx={120} cy={154} rx={4} ry={2.8} fill={CHEEK} />
        <Path d="M120 157 Q116 161 112 159 M120 157 Q124 161 128 159" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Cheeks y={152} o={0.5} />
        {stage >= 2 ? (
          <>
            <Path d="M100 168 Q120 176 140 168" stroke="#8FC6A9" strokeWidth={4} fill="none" strokeLinecap="round" />
            <Circle cx={120} cy={174} r={4.4} fill="#F2C462" />
          </>
        ) : null}
      </>
    ),
    out: (
      <>
        <Fx kind="earFlop" ox={88} oy={124}>
          <Ellipse cx={78} cy={130} rx={15} ry={7} fill="#E9D3BA" rotation={28} originX={78} originY={130} />
        </Fx>
        <Fx kind="earFlopR" ox={152} oy={124}>
          <Ellipse cx={162} cy={130} rx={15} ry={7} fill="#E9D3BA" rotation={-28} originX={162} originY={130} />
        </Fx>
      </>
    ),
    crown: (
      <Fx kind="haloFloat">
        <Ellipse cx={120} cy={68} rx={22} ry={6} fill="none" stroke="#F2C462" strokeWidth={3.4} />
      </Fx>
    ),
  };
}

function doveParts(stage: PipStage): Parts {
  const WHITE = '#F7F5F0';
  return {
    tail: (
      <Fx kind="sway" ox={150} oy={234}>
        <Ellipse cx={164} cy={230} rx={18} ry={6} fill="#E6E1D7" rotation={-30} originX={164} originY={230} />
        <Ellipse cx={168} cy={240} rx={19} ry={6} fill={WHITE} rotation={-10} originX={168} originY={240} />
        <Ellipse cx={164} cy={250} rx={16} ry={5.5} fill="#E6E1D7" rotation={10} originX={164} originY={250} />
      </Fx>
    ),
    body: (
      <>
        <Ellipse cx={120} cy={208} rx={33} ry={34} fill={WHITE} />
        <Ellipse cx={120} cy={218} rx={20} ry={20} fill="#FFFFFF" opacity={0.7} />
      </>
    ),
    feet: (
      <Path d="M106 244 L104 254 M110 244 L110 254 M130 244 L130 254 M134 244 L136 254" stroke="#E8A24B" strokeWidth={2.6} strokeLinecap="round" />
    ),
    paw: (
      <>
        <Ellipse cx={180} cy={188} rx={11} ry={8} fill={WHITE} />
        <Path d="M172 191 q4 4 8 1 M179 192 q4 4 8 1" stroke="#D8D2C6" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </>
    ),
    face: (
      <>
        <Circle cx={120} cy={142} r={27} fill="#FAF8F3" />
        <Eyes />
        <Path d="M115 149 L125 149 L120 158 Z" fill="#E8A24B" />
        <Cheeks y={152} o={0.5} />
        {stage >= 2 ? (
          <Fx kind="leafSway" ox={118} oy={156}>
            <Path d="M119 156 C108 162 98 164 86 162" stroke="#6E8B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
            <Ellipse cx={102} cy={160} rx={6} ry={2.6} fill="#8DAA62" rotation={-30} originX={102} originY={160} />
            <Ellipse cx={92} cy={166} rx={6} ry={2.6} fill="#8DAA62" rotation={25} originX={92} originY={166} />
          </Fx>
        ) : null}
      </>
    ),
    out: (
      <G fill="#ECE7DD">
        <Ellipse cx={114} cy={78} rx={4} ry={9} rotation={-24} originX={114} originY={86} />
        <Ellipse cx={121} cy={76} rx={4} ry={10} />
        <Ellipse cx={128} cy={78} rx={4} ry={9} rotation={24} originX={128} originY={86} />
      </G>
    ),
    crown: (
      <Fx kind="haloFloat">
        <Ellipse cx={120} cy={60} rx={20} ry={5.4} fill="none" stroke="#F2C462" strokeWidth={3.2} />
      </Fx>
    ),
  };
}

function emberParts(stage: PipStage): Parts {
  const WAX = stage === 3 ? '#F7F0E2' : '#F3EBDD';
  return {
    tail: (
      <Fx kind="drip">
        <Path d="M146 222 q-4 9 0 13 q4 -4 0 -13 Z" fill={WAX} />
      </Fx>
    ),
    body: (
      <>
        <Rect x={92} y={176} width={56} height={76} rx={10} fill={WAX} />
        <Rect x={134} y={176} width={14} height={76} rx={6} fill="#E6DCC8" />
      </>
    ),
    feet: (
      <>
        <Ellipse cx={104} cy={252} rx={11} ry={5} fill={WAX} />
        <Ellipse cx={136} cy={252} rx={11} ry={5} fill={WAX} />
        {stage === 3 ? <Ellipse cx={120} cy={255} rx={52} ry={6} fill="#C9A24B" /> : null}
      </>
    ),
    paw: (
      <>
        <Ellipse cx={180} cy={188} rx={10} ry={8} fill={WAX} />
        <Ellipse cx={180} cy={183} rx={4.4} ry={2.6} fill="#F2A93B" />
      </>
    ),
    face: (
      <>
        <Circle cx={120} cy={146} r={26} fill={WAX} />
        <Path d="M104 128 q3 6 6 0 M126 126 q3 8 6 0" fill="#FFF8EC" />
        <Eyes />
        <Path d="M114 154 Q120 159 126 154" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Cheeks y={150} o={0.5} />
      </>
    ),
    out: (
      <>
        <SoftGlow cx={120} cy={60} r={stage === 3 ? 34 : 26} color="#F2A93B" />
        <Path d="M120 84 V74" stroke="#3A2E28" strokeWidth={2.4} strokeLinecap="round" />
        <Fx kind="flickerEmber" ox={120} oy={76}>
          <Path d={stage === 1 ? 'M120 76 C113 69 113 61 120 52 C127 61 127 69 120 76 Z' : 'M120 76 C109 66 110 52 120 38 C130 52 131 66 120 76 Z'} fill="#F2A93B" />
          <Path d={stage === 1 ? 'M120 74 C117 70 117 66 120 61 C123 66 123 70 120 74 Z' : 'M120 74 C115 67 115 60 120 52 C125 60 125 67 120 74 Z'} fill="#FFE08A" />
        </Fx>
      </>
    ),
    crown: (
      <Fx kind="spin30" ox={120} oy={58}>
        <Path
          d="M120 18 V28 M120 88 V98 M80 58 H90 M150 58 H160 M92 30 L99 37 M141 79 L148 86 M148 30 L141 37 M99 79 L92 86"
          stroke="#F2C462"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.4}
        />
      </Fx>
    ),
  };
}

function dragonParts(stage: PipStage): Parts {
  const TEAL = '#1C9C98';
  const HEAD = '#2BB3AD';
  const PALE = '#D7F4EF';
  const ICE = '#86E6D9';
  const GOLDH = '#E8B93A';
  return {
    tail: (
      <Fx kind="tailFlick" ox={150} oy={240}>
        <Path d="M146 240 C168 246 184 236 186 220" stroke={TEAL} strokeWidth={11} fill="none" strokeLinecap="round" />
        <Path d="M186 220 C194 210 200 210 200 200 C206 214 204 228 194 234 C194 228 190 224 186 220 Z" fill={ICE} />
      </Fx>
    ),
    body: (
      <>
        <Ellipse cx={120} cy={206} rx={32} ry={34} fill={TEAL} />
        <Ellipse cx={120} cy={214} rx={17} ry={22} fill={PALE} />
        <Path d="M108 200 H132 M108 212 H132 M110 224 H130" stroke={ICE} strokeWidth={1.4} opacity={0.7} />
      </>
    ),
    feet: (
      <>
        <Ellipse cx={104} cy={250} rx={13} ry={7} fill={TEAL} />
        <Ellipse cx={136} cy={250} rx={13} ry={7} fill={TEAL} />
        <Path d="M98 254 l-1 3 M104 255 v3 M110 254 l1 3 M130 254 l-1 3 M136 255 v3 M142 254 l1 3" stroke={PALE} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    paw: <Ellipse cx={180} cy={188} rx={10} ry={9} fill={TEAL} />,
    face: (
      <>
        <Ellipse cx={120} cy={144} rx={27} ry={25} fill={HEAD} />
        <Ellipse cx={120} cy={158} rx={15} ry={9} fill={PALE} />
        <Circle cx={115} cy={157} r={1.5} fill="#0E5E61" />
        <Circle cx={125} cy={157} r={1.5} fill="#0E5E61" />
        <Path d="M114 163 Q120 166 126 163" stroke="#0E5E61" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Eyes iris="#F2C462" />
        <Cheeks y={152} o={0.4} />
      </>
    ),
    out: (
      <>
        <Path d="M80 128 Q66 120 70 140 Q76 136 82 142 Z" fill={ICE} />
        <Path d="M160 128 Q174 120 170 140 Q164 136 158 142 Z" fill={ICE} />
        {stage >= 2 ? (
          <Path d="M106 88 Q98 76 104 64 M134 88 Q142 76 136 64" stroke={GOLDH} strokeWidth={4.4} fill="none" strokeLinecap="round" />
        ) : (
          // the hatchling still wears a bit of its eggshell on top of the hood
          <Path d="M98 86 L102 74 L108 82 L114 70 L120 80 L126 70 L132 82 L138 74 L142 86 Q120 74 98 86 Z" fill="#F7F2E8" />
        )}
      </>
    ),
    crown: <TwinkleStar x={126} y={44} fill="#F7E3B5" />,
  };
}

function pumpkinParts(stage: PipStage): Parts {
  const carved = stage === 3;
  return {
    tail: (
      <Fx kind="sprout" ox={150} oy={236}>
        <Path d="M148 236 C164 236 168 222 160 216 C154 212 150 220 156 222" stroke="#6E8B4E" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      </Fx>
    ),
    body: (
      <>
        <Ellipse cx={106} cy={212} rx={20} ry={30} fill="#D9762E" />
        <Ellipse cx={134} cy={212} rx={20} ry={30} fill="#D9762E" />
        <Ellipse cx={120} cy={212} rx={24} ry={32} fill="#E8873A" />
      </>
    ),
    feet: (
      <>
        <Ellipse cx={102} cy={251} rx={13} ry={6} fill="#8DAA62" />
        <Ellipse cx={138} cy={251} rx={13} ry={6} fill="#8DAA62" />
        <Path d="M102 251 H112 M128 251 H138" stroke="#6E8B4E" strokeWidth={1.4} />
      </>
    ),
    paw: (
      <>
        <Ellipse cx={180} cy={188} rx={10} ry={7} fill="#6E8B4E" />
        <Path d="M186 182 q6 -4 4 -9" stroke="#8DAA62" strokeWidth={2} fill="none" strokeLinecap="round" />
      </>
    ),
    face: (
      <>
        <Ellipse cx={106} cy={146} rx={16} ry={23} fill="#D9762E" />
        <Ellipse cx={134} cy={146} rx={16} ry={23} fill="#D9762E" />
        <Ellipse cx={120} cy={146} rx={20} ry={25} fill={carved ? '#F09A44' : '#E8873A'} />
        {carved ? (
          <Fx kind="candle">
            <Polygon points="103,144 115,144 109,132" fill="#FFE08A" />
            <Polygon points="125,144 137,144 131,132" fill="#FFE08A" />
            <Path d="M106 154 L112 160 L118 154 L124 160 L130 154 L134 157 Q120 168 106 156 Z" fill="#FFE08A" />
          </Fx>
        ) : (
          <>
            <Eyes />
            <Path d="M112 153 Q120 160 128 153" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
            <Cheeks y={152} o={0.55} />
          </>
        )}
      </>
    ),
    out: (
      <>
        <Rect x={116} y={68} width={8} height={14} rx={3} fill="#6B4A2A" />
        <Fx kind="sprout" ox={122} oy={72}>
          <Path d={stage === 1 ? 'M122 72 q12 -10 18 -2 q-8 8 -18 2 z' : 'M122 72 q18 -14 28 -2 q-12 12 -28 2 z'} fill="#7FA35A" />
        </Fx>
        <Path d="M118 70 q-8 -6 -4 -12 q5 1 2 5" stroke="#6E8B4E" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </>
    ),
    crown: <TwinkleStar x={134} y={46} fill="#F2C462" />,
  };
}

const PARTS: Record<PetId, (stage: PipStage) => Parts> = {
  lion: lionParts,
  lamb: lambParts,
  dove: doveParts,
  ember: emberParts,
  dragon: dragonParts,
  pumpkin: pumpkinParts,
};

/* ------------------------------------------------------------------ the costume */

function Pilgrim({ id, stage }: { id: PetId; stage: PipStage }) {
  const c = CLOAKS[id];
  const p = PARTS[id](stage);
  const trim = stage === 3 ? GOLD : 'none';
  return (
    <>
      {stage === 3 && id !== 'ember' ? <SoftGlow cx={124} cy={170} r={100} color="#F2C462" kind="glow" /> : null}
      <Ellipse cx={124} cy={254} rx={62} ry={7} fill="#000" opacity={0.3} />
      <Fx kind="bobH">
        <Fx kind="sway" ox={120} oy={168}>
          <Path d="M84 168 C74 200 66 232 62 250 L178 250 C174 232 166 200 156 168 Z" fill={c.back} />
        </Fx>
        {p.tail}
        {p.body}
        {/* cloak front, rope belt, satchel */}
        <Path d="M86 170 C82 204 80 232 80 250 L104 250 C102 224 100 198 100 176 Z" fill={c.front} stroke={trim} strokeWidth={2} />
        <Path d="M154 170 C158 204 160 232 160 250 L136 250 C138 224 140 198 140 176 Z" fill={c.front} stroke={trim} strokeWidth={2} />
        <Path d="M100 206 Q120 214 140 206" stroke="#E8C27A" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Circle cx={120} cy={211} r={3.5} fill="#E8C27A" />
        <Fx kind="sway4" ox={120} oy={212}>
          <Path d="M118 213 L116 226 M122 213 L124 226" stroke="#E8C27A" strokeWidth={2} strokeLinecap="round" />
        </Fx>
        <Path d="M98 176 L146 222" stroke="#8A5A3C" strokeWidth={4} strokeLinecap="round" />
        <Rect x={136} y={214} width={24} height={20} rx={4} fill="#8A5A3C" />
        <Path d="M136 220 L160 220" stroke="#6B4A2A" strokeWidth={2} />
        <Circle cx={148} cy={224} r={2} fill="#E8C27A" />
        {stage === 1 ? (
          // a young pilgrim's satchel has a little flower tucked in it
          <>
            <Path d="M154 214 V206" stroke="#6E8B4E" strokeWidth={1.6} />
            <Circle cx={154} cy={204} r={3.6} fill="#F2A9A0" />
            <Circle cx={154} cy={204} r={1.4} fill="#F2C462" />
          </>
        ) : null}
        {p.feet}
        {/* the crook and its lantern */}
        <Path d="M186 112 L180 254" stroke="#7A5232" strokeWidth={6} strokeLinecap="round" />
        <Path d="M186 114 C186 92 210 90 210 108" stroke="#7A5232" strokeWidth={6} fill="none" strokeLinecap="round" />
        <Fx kind="swing" ox={210} oy={108}>
          <Path d="M210 108 L210 120" stroke="#C9A24B" strokeWidth={2} />
          <SoftGlow cx={210} cy={134} r={28} color="#F2C462" />
          <Polygon points="203,123 210,116 217,123" fill="#C9A24B" />
          <Rect x={203} y={123} width={14} height={20} rx={2} fill="#2A2236" stroke="#C9A24B" strokeWidth={2} />
          <Fx kind="candle">
            <Ellipse cx={210} cy={133} rx={3.2} ry={5.5} fill="#FFE08A" />
          </Fx>
        </Fx>
        {/* sleeve and the paw holding the crook */}
        <Path d="M148 180 L178 188" stroke={c.front} strokeWidth={14} strokeLinecap="round" />
        {p.paw}
        {/* hood, face, and what pokes out of it */}
        <Path d="M120 80 C78 80 70 124 80 170 L160 170 C170 124 162 80 120 80 Z" fill={c.hood} stroke={trim} strokeWidth={2.4} />
        {p.face}
        <Path d="M88 152 C84 106 156 106 152 152" stroke={c.rim} strokeWidth={9} fill="none" strokeLinecap="round" />
        {stage === 3 ? <Path d="M88 152 C84 106 156 106 152 152" stroke={GOLD} strokeWidth={1.6} fill="none" strokeLinecap="round" /> : null}
        {p.out}
        {stage >= 2 && !(id === 'pumpkin' && stage === 3) ? (
          <G fill="none" stroke={GOLD} strokeWidth={1.6}>
            <Circle cx={109} cy={140} r={7.5} />
            <Circle cx={131} cy={140} r={7.5} />
            <Path d="M116.5 140 L123.5 140" />
          </G>
        ) : null}
        {stage === 3 ? (
          <>
            <Polygon points="120,164 123,170 130,171 125,175 126,182 120,178 114,182 115,175 110,171 117,170" fill="#F2C462" />
            {p.crown}
          </>
        ) : null}
      </Fx>
      {stage === 3 ? (
        <>
          <TwinkleStar x={26} y={96} fill="#F2C462" />
          <TwinkleStar x={40} y={40} fill="#F7E3B5" delay={700} />
        </>
      ) : null}
    </>
  );
}

/** Your companion dressed as the quest guide. Height follows the 240x260 artboard. */
export function PilgrimPet({ id, stage, size = 220, animated = true }: { id: PetId; stage: PipStage; size?: number; animated?: boolean }) {
  return (
    <PetFrame size={size} animated={animated} label="Your companion dressed as a hooded pilgrim with a shepherd's crook and a lantern">
      {stage === 1 ? (
        <G transform="translate(12 26) scale(0.9)">
          <Pilgrim id={id} stage={stage} />
        </G>
      ) : (
        <Pilgrim id={id} stage={stage} />
      )}
    </PetFrame>
  );
}
