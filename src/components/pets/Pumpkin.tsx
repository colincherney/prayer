import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';

import { Fx } from './Fx';
import { PetFrame, PetProps } from './PetFrame';

const LABELS = {
  1: 'Seedling Gourd, a small golden gourd under a big leaf',
  2: 'Gourdy, a friendly glowing pumpkin',
  3: 'Harvest Lantern, a glowing pumpkin crowned with autumn leaves between wheat sheaves',
} as const;

const GLOW = '#FFE08A';
const INK = '#2B2420';
const CHEEK = '#E8998A';
const STEM = '#6B4A2A';
const VINE = '#6E8B4E';

function Seedling() {
  return (
    <Fx kind="hopP" ox={120} oy={240}>
      <G fill="#F2C462">
        <Fx kind="firefly">
          <Circle cx={56} cy={130} r={2.2} />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={186} cy={150} r={2} />
        </Fx>
      </G>
      <G transform="translate(48 104) scale(0.72)">
        <Ellipse cx={100} cy={188} rx={44} ry={7} fill="#000" opacity={0.35} />
        <Path d="M104 100 Q130 70 150 84 Q160 92 150 100" stroke={VINE} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M97 112 L99 92 L105 92 L103 112 Z" fill={STEM} />
        <Fx kind="leafSway" ox={100} oy={82}>
          <Ellipse cx={126} cy={82} rx={26} ry={11} fill="#7FA35A" transform="rotate(-25 126 82)" />
          <Path d="M104 92 L146 72" stroke="#5E7F42" strokeWidth={1.5} />
        </Fx>
        <Ellipse cx={78} cy={152} rx={26} ry={36} fill="#D9A040" />
        <Ellipse cx={122} cy={152} rx={26} ry={36} fill="#D9A040" />
        <Ellipse cx={100} cy={152} rx={30} ry={38} fill="#E8B04A" />
        <Path d="M100 114 Q93 152 100 190 M100 114 Q107 152 100 190" stroke="#C9902A" strokeWidth={2} fill="none" opacity={0.5} />
        <Fx kind="blink" ox={100} oy={148}>
          <Circle cx={90} cy={148} r={4.6} fill={INK} />
          <Circle cx={110} cy={148} r={4.6} fill={INK} />
          <Circle cx={91.5} cy={146.5} r={1.5} fill="#FFFFFF" />
          <Circle cx={111.5} cy={146.5} r={1.5} fill="#FFFFFF" />
        </Fx>
        <Path d="M94 160 Q100 165 106 160" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={80} cy={158} r={5} fill={CHEEK} opacity={0.5} />
        <Circle cx={120} cy={158} r={5} fill={CHEEK} opacity={0.5} />
      </G>
    </Fx>
  );
}

function Gourdy() {
  return (
    <Fx kind="bob6" delay={600}>
      <G transform="translate(20 52)">
        <Fx kind="glowP">
          <Circle cx={100} cy={130} r={74} fill="#F2A93B" />
        </Fx>
        <G fill="#F2C462">
          <Fx kind="firefly">
            <Circle cx={36} cy={80} r={2.5} />
          </Fx>
          <Fx kind="firefly" delay={1300}>
            <Circle cx={168} cy={62} r={2.2} />
          </Fx>
          <Fx kind="firefly" delay={2600}>
            <Circle cx={160} cy={150} r={2.5} />
          </Fx>
        </G>
        <Ellipse cx={100} cy={188} rx={58} ry={7} fill="#000" opacity={0.35} />
        <Path d="M96 94 L98 74 L106 72 L104 94 Z" fill={STEM} />
        <Path d="M106 76 Q122 62 128 72" stroke={VINE} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Fx kind="leafSway" ox={105} oy={80}>
          <Ellipse cx={118} cy={80} rx={13} ry={5.5} fill={VINE} transform="rotate(-20 118 80)" />
        </Fx>
        <Ellipse cx={68} cy={136} rx={32} ry={46} fill="#D9762E" />
        <Ellipse cx={132} cy={136} rx={32} ry={46} fill="#D9762E" />
        <Ellipse cx={100} cy={136} rx={36} ry={48} fill="#E8873A" />
        <Path d="M100 92 Q92 136 100 182 M100 92 Q108 136 100 182" stroke="#C9672A" strokeWidth={2} fill="none" opacity={0.5} />
        <Fx kind="candle">
          <Fx kind="blink" ox={100} oy={126}>
            <Ellipse cx={85} cy={126} rx={7} ry={9} fill={GLOW} />
            <Ellipse cx={115} cy={126} rx={7} ry={9} fill={GLOW} />
          </Fx>
          <Path d="M80 148 Q100 164 120 148 Q100 156 80 148 Z" fill={GLOW} />
        </Fx>
        <Circle cx={70} cy={142} r={6} fill={CHEEK} opacity={0.45} />
        <Circle cx={130} cy={142} r={6} fill={CHEEK} opacity={0.45} />
      </G>
    </Fx>
  );
}

function Sheaf({ flip }: { flip?: boolean }) {
  // Left sheaf leans one way, the right one is its mirror.
  const stalks = flip ? 'M170 186 L164 128 M164 186 L158 124 M158 186 L154 130' : 'M30 186 L36 128 M36 186 L42 124 M42 186 L46 130';
  const heads = flip
    ? [[164, 124], [158, 120], [153, 126]]
    : [[36, 124], [42, 120], [47, 126]];
  const band = flip ? 'M152 160 L170 160' : 'M30 160 L48 160';
  return (
    <Fx kind="sheaf" delay={flip ? 1200 : 0} ox={flip ? 161 : 40} oy={186}>
      <Path d={stalks} stroke="#C9A24B" strokeWidth={2.5} strokeLinecap="round" />
      <G fill="#F2C462">
        {heads.map(([x, y]) => (
          <Ellipse key={`${x}-${y}`} cx={x} cy={y} rx={4} ry={9} />
        ))}
      </G>
      <Path d={band} stroke="#C9433A" strokeWidth={3} />
    </Fx>
  );
}

function HarvestLantern() {
  return (
    <>
      <Fx kind="spin28" ox={120} oy={170}>
        <Path
          d="M195 170 L232 170 M173 223 L199 249 M120 245 L120 282 M67 223 L41 249 M45 170 L8 170 M67 117 L41 91 M120 95 L120 58 M173 117 L199 91"
          stroke="#F2A93B"
          strokeOpacity={0.16}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
      </Fx>
      <Fx kind="glowP">
        <Circle cx={120} cy={170} r={92} fill="#F2A93B" />
      </Fx>
      <G fill="#F2C462">
        <Fx kind="firefly">
          <Circle cx={30} cy={110} r={2.5} />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={210} cy={96} r={2.2} />
        </Fx>
        <Fx kind="firefly" delay={2600}>
          <Circle cx={204} cy={200} r={2.5} />
        </Fx>
        <Fx kind="firefly" delay={1300}>
          <Circle cx={26} cy={196} r={2} />
        </Fx>
      </G>
      <G transform="translate(206 40)">
        <Fx kind="twinkle" ox={8} oy={8}>
          <Path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill="#FFF3C4" />
        </Fx>
      </G>
      <Fx kind="bob6" delay={1200}>
        <G transform="translate(15 42) scale(1.05)">
          <Ellipse cx={100} cy={188} rx={70} ry={7} fill="#000" opacity={0.35} />
          <Sheaf />
          <Sheaf flip />
          <Path d="M96 94 L98 76 L106 74 L104 94 Z" fill={STEM} />
          <G transform="rotate(-30 80 90)">
            <Ellipse cx={80} cy={90} rx={12} ry={6} fill="#C9433A" />
          </G>
          <G transform="rotate(-10 90 82)">
            <Ellipse cx={90} cy={82} rx={12} ry={6} fill="#E8913A" />
          </G>
          <G transform="rotate(10 112 82)">
            <Ellipse cx={112} cy={82} rx={12} ry={6} fill="#F2C462" />
          </G>
          <G transform="rotate(30 122 90)">
            <Ellipse cx={122} cy={90} rx={12} ry={6} fill="#C9433A" />
          </G>
          <Ellipse cx={66} cy={136} rx={34} ry={48} fill="#E07E34" />
          <Ellipse cx={134} cy={136} rx={34} ry={48} fill="#E07E34" />
          <Ellipse cx={100} cy={136} rx={38} ry={50} fill="#F09A44" />
          <Path d="M100 90 Q92 136 100 184 M100 90 Q108 136 100 184" stroke="#C9672A" strokeWidth={2} fill="none" opacity={0.5} />
          <Path d="M44 120 Q60 104 76 116 Q90 128 84 150 M156 120 Q140 104 124 116" stroke={VINE} strokeWidth={3} fill="none" strokeLinecap="round" />
          <G fill="#7FA35A">
            <Ellipse cx={58} cy={108} rx={7} ry={3.5} transform="rotate(-30 58 108)" />
            <Ellipse cx={142} cy={108} rx={7} ry={3.5} transform="rotate(30 142 108)" />
            <Ellipse cx={86} cy={140} rx={6} ry={3} transform="rotate(60 86 140)" />
          </G>
          <Fx kind="glowP">
            <Ellipse cx={100} cy={138} rx={30} ry={24} fill={GLOW} />
          </Fx>
          <Fx kind="candle">
            <Fx kind="blink" ox={100} oy={126}>
              <Ellipse cx={85} cy={126} rx={8} ry={10} fill={GLOW} />
              <Ellipse cx={115} cy={126} rx={8} ry={10} fill={GLOW} />
            </Fx>
            <Path d="M78 148 Q100 168 122 148 Q100 158 78 148 Z" fill={GLOW} />
          </Fx>
          <Circle cx={68} cy={144} r={6} fill={CHEEK} opacity={0.45} />
          <Circle cx={132} cy={144} r={6} fill={CHEEK} opacity={0.45} />
        </G>
      </Fx>
    </>
  );
}

/** Gourdy the Pumpkin: seedling gourd, carved and glowing Gourdy, the Harvest Lantern. */
export function GourdyPumpkin({ stage, size = 220, animated = true }: PetProps) {
  return (
    <PetFrame size={size} animated={animated} label={LABELS[stage]}>
      {stage === 1 ? <Seedling /> : stage === 2 ? <Gourdy /> : <HarvestLantern />}
    </PetFrame>
  );
}
