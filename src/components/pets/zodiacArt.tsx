import React from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { DashFlow, Fx } from './Fx';

// The twelve monthly companions' artwork, converted from design/ZodiacEvo.dc.html (Monthly companion evolutions).
// Each animal has its companion art (drawn on a 200x200 artboard and reused by every stage), the props of its baby
// scene, and the backdrop of its radiant scene. `t` recolors the art for stages whose design used an SVG color filter.
// Stage assembly lives in ZodiacPets.tsx.

/** Maps a design color to the color drawn (identity for most stages). */
export type Paint = (hex: string) => string;
const same: Paint = c => c;

/* ------------------------------------------------------------------ Rat */

function RatArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={46} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zSwish" ox={134.0} oy={176.0}>
        <G>
          <Path d="M134 170 C168 176 178 146 160 134" stroke={t('#E3A9A6')} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Ellipse cx={100} cy={152} rx={34} ry={30} fill={t('#B9B4C2')} />
      <Ellipse cx={100} cy={160} rx={20} ry={18} fill={t('#E3DEE8')} />
      <Ellipse cx={84} cy={182} rx={10} ry={5} fill={t('#E8A9B4')} />
      <Ellipse cx={116} cy={182} rx={10} ry={5} fill={t('#E8A9B4')} />
      <Fx kind="zEar" ox={66.0} oy={84.0}>
        <G>
          <Circle cx={66} cy={64} r={20} fill={t('#B9B4C2')} />
          <Circle cx={66} cy={64} r={12} fill={t('#E8A9B4')} />
        </G>
      </Fx>
      <Fx kind="zEarR" ox={134.0} oy={84.0}>
        <G>
          <Circle cx={134} cy={64} r={20} fill={t('#B9B4C2')} />
          <Circle cx={134} cy={64} r={12} fill={t('#E8A9B4')} />
        </G>
      </Fx>
      <Circle cx={100} cy={92} r={36} fill={t('#C8C3D0')} />
      <Ellipse cx={100} cy={106} rx={13} ry={10} fill={t('#E3DEE8')} />
      <Circle cx={100} cy={101} r={4} fill={t('#E8998A')} />
      <Fx kind="zWhisker" ox={100.0} oy={106.0}>
        <G stroke={t('#8A8494')} strokeWidth={1.5} strokeLinecap="round">
          <Path d="M86 104 L62 100 M86 109 L62 112 M114 104 L138 100 M114 109 L138 112" />
        </G>
      </Fx>
      <Fx kind="blink" ox={100.0} oy={90.0}>
        <G>
          <Circle cx={88} cy={90} r={4.2} fill={t('#2B2420')} />
          <Circle cx={112} cy={90} r={4.2} fill={t('#2B2420')} />
          <Circle cx={89.5} cy={88.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={113.5} cy={88.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
    </>
  );
}

function RatBabyBack() {
  const t = same;
  return (
    <>
      <Ellipse cx={100} cy={164} rx={46} ry={11} fill={t('#5A3A24')} />
    </>
  );
}

function RatBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M52 164 Q56 198 100 198 Q144 198 148 164 Q100 178 52 164 Z" fill={t('#9A6646')} />
      <Path d="M64 176 Q70 188 82 192 M136 176 Q130 188 118 192 M100 182 L100 196" stroke={t('#7A4E34')} strokeWidth={2} fill="none" strokeLinecap="round" />
      <G transform="translate(124 150) rotate(25)">
        <Ellipse cx={0} cy={0} rx={6} ry={9} fill={t('#E8C27A')} />
        <Path d="M-1 -6 L1 6" stroke={t('#C9A04A')} strokeWidth={1.2} />
      </G>
      <G transform="translate(150 60)">
        <Fx kind="zTwinkle" ox={0.0} oy={0.0}>
          <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill={t('#F7E3B5')} />
        </Fx>
      </G>
    </>
  );
}

function RatRadiantBack() {
  const t = same;
  return (
    <>
      <Fx kind="zLglow">
        <Circle cx={154} cy={92} r={46} fill="url(#zWarm)" />
      </Fx>
      <Rect x={34} y={186} width={100} height={12} rx={2} fill={t('#2F4B7A')} />
      <Rect x={42} y={174} width={88} height={12} rx={2} fill={t('#8E2A24')} />
      <Path d="M38 192 H130 M46 180 H126" stroke={t('#F3EBDD')} strokeWidth={1.5} />
    </>
  );
}

function RatRadiantFront() {
  const t = same;
  return (
    <>
      <Path d="M128 184 L140 64" stroke={t('#7A5232')} strokeWidth={4} strokeLinecap="round" />
      <Path d="M140 64 Q152 56 154 68" stroke={t('#7A5232')} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Fx kind="zLantern" ox={154.0} oy={68.0}>
        <G>
          <Path d="M154 68 L154 76" stroke={t('#C9A24B')} strokeWidth={1.5} />
          <Rect x={146} y={76} width={16} height={3} rx={1} fill={t('#C9A24B')} />
          <Ellipse cx={154} cy={90} rx={11} ry={12} fill={t('#FFF1C4')} />
          <Path d="M148 80 Q144 90 148 100 M160 80 Q164 90 160 100" stroke={t('#E8C27A')} strokeWidth={1} fill="none" />
          <Fx kind="zLglow">
            <Ellipse cx={154} cy={90} rx={5} ry={6} fill={t('#F2A93B')} />
          </Fx>
          <Rect x={146} y={100} width={16} height={3} rx={1} fill={t('#C9A24B')} />
        </G>
      </Fx>
      <Ellipse cx={128} cy={140} rx={7} ry={6} fill={t('#C8C3D0')} />
      <Path d="M66 112 Q84 124 102 112 L100 120 Q84 130 68 120 Z" fill={t('#E8A24B')} />
    </>
  );
}

/* ------------------------------------------------------------------ Ox */

function OxArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={50} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zSwish" ox={136.0} oy={162.0}>
        <G>
          <Path d="M136 160 C160 162 166 140 160 128" stroke={t('#8A5A3C')} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Circle cx={160} cy={124} r={6} fill={t('#4A2E22')} />
        </G>
      </Fx>
      <Ellipse cx={100} cy={154} rx={40} ry={30} fill={t('#8A5A3C')} />
      <Ellipse cx={100} cy={162} rx={24} ry={18} fill={t('#C8946A')} />
      <Ellipse cx={82} cy={183} rx={11} ry={5} fill={t('#3A2A22')} />
      <Ellipse cx={118} cy={183} rx={11} ry={5} fill={t('#3A2A22')} />
      <Fx kind="zNod">
        <G>
          <Path d="M72 70 Q52 56 60 36 Q70 54 84 62 Z" fill={t('#F3EBDD')} />
          <Path d="M128 70 Q148 56 140 36 Q130 54 116 62 Z" fill={t('#F3EBDD')} />
          <Ellipse cx={62} cy={86} rx={13} ry={7} fill={t('#7A4E34')} />
          <Ellipse cx={138} cy={86} rx={13} ry={7} fill={t('#7A4E34')} />
          <Circle cx={100} cy={92} r={36} fill={t('#9A6646')} />
          <Circle cx={94} cy={60} r={6} fill={t('#4A2E22')} />
          <Circle cx={104} cy={58} r={6} fill={t('#4A2E22')} />
          <Ellipse cx={100} cy={112} rx={22} ry={14} fill={t('#E3B994')} />
          <Circle cx={92} cy={112} r={2.6} fill={t('#6B3F2A')} />
          <Circle cx={108} cy={112} r={2.6} fill={t('#6B3F2A')} />
          <Fx kind="zGlint">
            <Circle cx={100} cy={123} r={6} fill="none" stroke={t('#F2C462')} strokeWidth={2.5} />
          </Fx>
          <Fx kind="blink" ox={100.0} oy={88.0}>
            <G>
              <Circle cx={86} cy={88} r={4.2} fill={t('#2B2420')} />
              <Circle cx={114} cy={88} r={4.2} fill={t('#2B2420')} />
              <Circle cx={87.5} cy={86.5} r={1.4} fill={t('#FFFFFF')} />
              <Circle cx={115.5} cy={86.5} r={1.4} fill={t('#FFFFFF')} />
            </G>
          </Fx>
          <Circle cx={74} cy={100} r={5} fill={t('#E8998A')} opacity={0.45} />
          <Circle cx={126} cy={100} r={5} fill={t('#E8998A')} opacity={0.45} />
        </G>
      </Fx>
    </>
  );
}

const OxBabyBack = () => null;

function OxBabyFront() {
  const t = same;
  return (
    <>
      <Circle cx={100} cy={142} r={5.5} fill={t('#F2C462')} />
      <Circle cx={100} cy={145} r={1.6} fill={t('#8A6A2A')} />
      <Path d="M34 198 Q40 168 64 174 Q78 158 100 168 Q122 156 136 172 Q160 166 166 198 Z" fill={t('#E3C06A')} />
      <Path d="M50 186 L60 176 M70 190 L76 174 M92 186 L96 170 M110 188 L106 172 M128 186 L136 174 M148 190 L150 178" stroke={t('#C9A04A')} strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function OxRadiantBack() {
  const t = same;
  return (
    <>
      <Path d="M0 176 Q100 160 200 176 L200 200 L0 200 Z" fill={t('#3A2E18')} />
      <Fx kind="zSway" ox={28.0} oy={198.0}>
        <G>
          <Path d="M14 198 L22 132 M24 198 L30 120 M34 198 L38 128" stroke={t('#C9A24B')} strokeWidth={2} />
          <G fill={t('#E8C462')}>
            <Ellipse cx={22} cy={126} rx={4} ry={10} />
            <Ellipse cx={30} cy={114} rx={4} ry={10} />
            <Ellipse cx={38} cy={122} rx={4} ry={10} />
          </G>
        </G>
      </Fx>
      <Fx kind="zSway" delay={1200} ox={172.0} oy={198.0}>
        <G>
          <Path d="M166 198 L162 128 M176 198 L170 118 M186 198 L178 132" stroke={t('#C9A24B')} strokeWidth={2} />
          <G fill={t('#E8C462')}>
            <Ellipse cx={162} cy={122} rx={4} ry={10} />
            <Ellipse cx={170} cy={112} rx={4} ry={10} />
            <Ellipse cx={178} cy={126} rx={4} ry={10} />
          </G>
        </G>
      </Fx>
    </>
  );
}

function OxRadiantFront() {
  const t = same;
  return (
    <>
      <Fx kind="zNod">
        <G>
          <Path d="M64 56 Q100 40 136 56" stroke={t('#C9A24B')} strokeWidth={5} fill="none" strokeLinecap="round" />
          <G fill={t('#F2C462')}>
            <Ellipse cx={70} cy={52} rx={3.5} ry={7} transform="rotate(-50 70 52)" />
            <Ellipse cx={84} cy={46} rx={3.5} ry={7} transform="rotate(-30 84 46)" />
            <Ellipse cx={116} cy={46} rx={3.5} ry={7} transform="rotate(30 116 46)" />
            <Ellipse cx={130} cy={52} rx={3.5} ry={7} transform="rotate(50 130 52)" />
          </G>
          <Circle cx={100.0} cy={42.0} r={3.4} fill={t('#E8735F')} />
          <Circle cx={103.8} cy={44.8} r={3.4} fill={t('#E8735F')} />
          <Circle cx={102.4} cy={49.2} r={3.4} fill={t('#E8735F')} />
          <Circle cx={97.6} cy={49.2} r={3.4} fill={t('#E8735F')} />
          <Circle cx={96.2} cy={44.8} r={3.4} fill={t('#E8735F')} />
          <Circle cx={100} cy={46} r={2.4} fill={t('#F2C462')} />
        </G>
      </Fx>
      <G fill={t('#F2C462')} opacity={0.8}>
        <Fx kind="zRise">
          <Circle cx={60} cy={150} r={2} />
        </Fx>
        <Fx kind="zRise" delay={1300}>
          <Circle cx={140} cy={140} r={2} />
        </Fx>
      </G>
    </>
  );
}

/* ------------------------------------------------------------------ Tiger */

function TigerArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={48} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zSwish" ox={134.0} oy={168.0}>
        <G>
          <Path d="M134 164 C168 168 178 138 164 124" stroke={t('#E8913A')} strokeWidth={8} fill="none" strokeLinecap="round" />
          <Path d="M150 166 L152 158 M164 156 L171 152 M166 136 L174 136" stroke={t('#3A2A22')} strokeWidth={3} strokeLinecap="round" />
        </G>
      </Fx>
      <Ellipse cx={100} cy={154} rx={36} ry={30} fill={t('#E8913A')} />
      <Ellipse cx={100} cy={162} rx={20} ry={18} fill={t('#FFF3E2')} />
      <Path d="M68 146 L78 150 M68 156 L78 158 M132 146 L122 150 M132 156 L122 158" stroke={t('#3A2A22')} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={84} cy={183} rx={11} ry={5} fill={t('#FFF3E2')} />
      <Ellipse cx={116} cy={183} rx={11} ry={5} fill={t('#FFF3E2')} />
      <Fx kind="zEar" ox={70.0} oy={75.0}>
        <G>
          <Circle cx={70} cy={62} r={13} fill={t('#E8913A')} />
          <Circle cx={70} cy={62} r={6.5} fill={t('#FFF3E2')} />
        </G>
      </Fx>
      <Fx kind="zEarR" ox={130.0} oy={75.0}>
        <G>
          <Circle cx={130} cy={62} r={13} fill={t('#E8913A')} />
          <Circle cx={130} cy={62} r={6.5} fill={t('#FFF3E2')} />
        </G>
      </Fx>
      <Circle cx={100} cy={92} r={36} fill={t('#EFA04A')} />
      <Ellipse cx={84} cy={108} rx={15} ry={10} fill={t('#FFF3E2')} />
      <Ellipse cx={116} cy={108} rx={15} ry={10} fill={t('#FFF3E2')} />
      <Path d="M92 64 L108 64 M90 72 L110 72 M94 80 L106 80 M100 64 L100 80 M66 86 L76 90 M66 96 L76 96 M134 86 L124 90 M134 96 L124 96" stroke={t('#3A2A22')} strokeWidth={3} strokeLinecap="round" />
      <Path d="M95 102 L105 102 L100 108 Z" fill={t('#E8998A')} />
      <Path d="M100 108 Q96 112 92 110 M100 108 Q104 112 108 110" stroke={t('#3A2A22')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Fx kind="blink" ox={100.0} oy={90.0}>
        <G>
          <Circle cx={87} cy={90} r={4.2} fill={t('#2B2420')} />
          <Circle cx={113} cy={90} r={4.2} fill={t('#2B2420')} />
          <Circle cx={88.5} cy={88.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={114.5} cy={88.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
    </>
  );
}

const TigerBabyBack = () => null;

function TigerBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M104 172 Q128 188 142 180" stroke={t('#8FC6A9')} strokeWidth={2} fill="none" />
      <Fx kind="zYarn" ox={152.0} oy={178.0}>
        <G>
          <Circle cx={152} cy={178} r={14} fill={t('#8FC6A9')} />
          <Path d="M140 172 Q152 166 164 176 M140 182 Q152 176 164 186 M146 166 Q158 178 150 192" stroke={t('#6AA88A')} strokeWidth={1.6} fill="none" />
        </G>
      </Fx>
    </>
  );
}

function TigerRadiantBack() {
  const t = same;
  return (
    <>
      <Path d="M0 170 L40 96 L70 140 L104 70 L140 130 L166 104 L200 160 L200 200 L0 200 Z" fill={t('#22344A')} />
      <Path d="M40 96 L30 114 L44 110 L50 116 Z M104 70 L92 92 L104 86 L114 92 Z M166 104 L158 118 L168 114 L174 120 Z" fill={t('#E6EEF8')} />
      <Fx kind="zMist">
        <Ellipse cx={100} cy={170} rx={110} ry={10} fill={t('#8EC9F0')} opacity={0.2} />
      </Fx>
    </>
  );
}

function TigerRadiantFront() {
  const t = same;
  return (
    <>
      <Path d="M76 120 Q102 134 128 120 L128 128 Q102 142 76 128 Z" fill={t('#5A9BD6')} />
      <Path d="M114 130 L122 154 L108 150 Z" fill={t('#4A86C2')} />
      <G fill={t('#FFFFFF')}>
        <Fx kind="zSnow">
          <Circle cx={30} cy={10} r={2} />
        </Fx>
        <Fx kind="zSnow" delay={1600}>
          <Circle cx={90} cy={6} r={1.6} />
        </Fx>
        <Fx kind="zSnow" delay={3200}>
          <Circle cx={160} cy={10} r={2} />
        </Fx>
        <Fx kind="zSnow" delay={1600}>
          <Circle cx={186} cy={30} r={1.5} />
        </Fx>
      </G>
    </>
  );
}

/* ------------------------------------------------------------------ Rabbit */

function RabbitArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={44} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zFlop" ox={84.0} oy={74.0}>
        <G>
          <Ellipse cx={84} cy={44} rx={11} ry={30} fill={t('#F4F1EA')} />
          <Ellipse cx={84} cy={46} rx={5} ry={22} fill={t('#F2B6B8')} />
        </G>
      </Fx>
      <Ellipse cx={116} cy={44} rx={11} ry={30} fill={t('#F4F1EA')} />
      <Ellipse cx={116} cy={46} rx={5} ry={22} fill={t('#F2B6B8')} />
      <Circle cx={134} cy={166} r={9} fill={t('#FFFFFF')} />
      <Ellipse cx={100} cy={156} rx={34} ry={28} fill={t('#F4F1EA')} />
      <Ellipse cx={84} cy={183} rx={11} ry={5} fill={t('#F4F1EA')} />
      <Ellipse cx={116} cy={183} rx={11} ry={5} fill={t('#F4F1EA')} />
      <Circle cx={100} cy={96} r={34} fill={t('#FAF7F0')} />
      <Fx kind="zTwitch" ox={100.0} oy={106.0}>
        <Ellipse cx={100} cy={106} rx={4} ry={3} fill={t('#E8998A')} />
      </Fx>
      <Path d="M100 109 Q96 114 92 112 M100 109 Q104 114 108 112" stroke={t('#2B2420')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Rect x={97} y={112} width={6} height={6} rx={1} fill={t('#FFFFFF')} stroke={t('#E6E0D6')} strokeWidth={0.8} />
      <Fx kind="blink" ox={100.0} oy={94.0}>
        <G>
          <Circle cx={88} cy={94} r={4.2} fill={t('#2B2420')} />
          <Circle cx={112} cy={94} r={4.2} fill={t('#2B2420')} />
          <Circle cx={89.5} cy={92.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={113.5} cy={92.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
      <Circle cx={78} cy={106} r={5} fill={t('#E8998A')} opacity={0.5} />
      <Circle cx={122} cy={106} r={5} fill={t('#E8998A')} opacity={0.5} />
    </>
  );
}

function RabbitBabyBack() {
  const t = same;
  return (
    <>
      <Ellipse cx={100} cy={150} rx={48} ry={11} fill={t('#C9D7EA')} />
    </>
  );
}

function RabbitBabyFront() {
  const t = same;
  return (
    <>
      <Ellipse cx={100} cy={194} rx={60} ry={6} fill={t('#DCE5F1')} />
      <Path d="M52 150 Q56 194 100 194 Q144 194 148 150 Q100 162 52 150 Z" fill={t('#F2F5FA')} />
      <Path d="M52 150 Q100 162 148 150" stroke={t('#C9D7EA')} strokeWidth={2} fill="none" />
      <Path d="M147 158 Q170 158 166 174 Q162 186 140 180" stroke={t('#F2F5FA')} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Circle cx={76.0} cy={171.0} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={78.8} cy={173.1} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={77.8} cy={176.4} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={74.2} cy={176.4} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={73.2} cy={173.1} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={76} cy={174} r={1.8} fill={t('#F2C462')} />
      <Circle cx={100.0} cy={177.0} r={2.5} fill={t('#B5DCC6')} />
      <Circle cx={102.8} cy={179.1} r={2.5} fill={t('#B5DCC6')} />
      <Circle cx={101.8} cy={182.4} r={2.5} fill={t('#B5DCC6')} />
      <Circle cx={98.2} cy={182.4} r={2.5} fill={t('#B5DCC6')} />
      <Circle cx={97.2} cy={179.1} r={2.5} fill={t('#B5DCC6')} />
      <Circle cx={100} cy={180} r={1.8} fill={t('#F2C462')} />
      <Circle cx={124.0} cy={171.0} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={126.8} cy={173.1} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={125.8} cy={176.4} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={122.2} cy={176.4} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={121.2} cy={173.1} r={2.5} fill={t('#F2B6B8')} />
      <Circle cx={124} cy={174} r={1.8} fill={t('#F2C462')} />
    </>
  );
}

function RabbitRadiantBack() {
  const t = same;
  return (
    <>
      <Path d="M168 16 A44 44 0 1 0 168 104 A33 33 0 1 1 168 16 Z" fill={t('#F4EED8')} opacity={0.92} />
      <G fill={t('#F4EED8')}>
        <G transform="translate(26 30)">
          <Fx kind="zTwinkle" ox={0.0} oy={0.0}>
            <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" />
          </Fx>
        </G>
        <G transform="translate(64 14)">
          <Fx kind="zTwinkle" delay={900} ox={0.0} oy={0.0}>
            <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" transform="scale(0.6)" />
          </Fx>
        </G>
        <G transform="translate(186 150)">
          <Fx kind="zTwinkle" ox={0.0} oy={0.0}>
            <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" transform="scale(0.7)" />
          </Fx>
        </G>
      </G>
    </>
  );
}

function RabbitRadiantFront() {
  const t = same;
  return (
    <>
      <Path d="M136 168 L172 168 L166 196 L142 196 Z" fill={t('#8A5A3C')} />
      <Ellipse cx={154} cy={168} rx={18} ry={4.5} fill={t('#6B4A2A')} />
      <Ellipse cx={154} cy={166} rx={11} ry={4} fill={t('#FAF7F0')} />
      <Fx kind="zPound">
        <G>
          <Rect x={150} y={118} width={8} height={44} rx={4} fill={t('#B5824A')} />
        </G>
      </Fx>
    </>
  );
}

/* ------------------------------------------------------------------ Dragon */

function DragonArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={64} ry={7} fill={t('#000')} opacity={0.3} />
      <Path d="M30 176 C50 130 84 196 116 156 C138 128 160 166 178 146" stroke={t('#C9433A')} strokeWidth={22} fill="none" strokeLinecap="round" />
      <DashFlow kind="slither" d="M30 176 C50 130 84 196 116 156 C138 128 160 166 178 146" stroke={t('#F2C462')} strokeWidth={5} fill="none" strokeDasharray="8 6" strokeLinecap="round" />
      <Path d="M176 146 L196 132 L188 150 L198 156 Z" fill={t('#F2C462')} />
      <Fx kind="zPearl">
        <Circle cx={164} cy={70} r={16} fill={t('#F2C462')} opacity={0.35} />
      </Fx>
      <Circle cx={164} cy={70} r={9} fill={t('#F7F2E8')} />
      <G fill={t('#2F9E8F')}>
        <Circle cx={64} cy={88} r={12} />
        <Circle cx={136} cy={88} r={12} />
        <Circle cx={72} cy={68} r={10} />
        <Circle cx={128} cy={68} r={10} />
      </G>
      <Path d="M82 68 L74 44 M78 56 L68 52 M118 68 L126 44 M122 56 L132 52" stroke={t('#F2C462')} strokeWidth={4} strokeLinecap="round" />
      <Ellipse cx={100} cy={94} rx={34} ry={30} fill={t('#D9534A')} />
      <Path d="M80 80 L92 84 M120 80 L108 84" stroke={t('#8E2A24')} strokeWidth={2.5} strokeLinecap="round" />
      <Ellipse cx={100} cy={112} rx={22} ry={13} fill={t('#E8735F')} />
      <Circle cx={93} cy={110} r={2.5} fill={t('#8E2A24')} />
      <Circle cx={107} cy={110} r={2.5} fill={t('#8E2A24')} />
      <Fx kind="zFloaty" ox={60.0} oy={104.0}>
        <G>
          <Path d="M80 112 C62 120 52 104 40 114" stroke={t('#F2C462')} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Fx kind="zFloaty" delay={1500} ox={140.0} oy={104.0}>
        <G>
          <Path d="M120 112 C138 120 148 104 160 114" stroke={t('#F2C462')} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Fx kind="blink" ox={100.0} oy={92.0}>
        <G>
          <Circle cx={87} cy={92} r={4.2} fill={t('#2B2420')} />
          <Circle cx={113} cy={92} r={4.2} fill={t('#2B2420')} />
          <Circle cx={88.5} cy={90.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={114.5} cy={90.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
    </>
  );
}

const DragonBabyBack = () => null;

function DragonBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M44 152 L56 142 L68 154 L82 140 L96 154 L110 140 L124 154 L138 142 L150 154 L156 150 Q160 198 100 198 Q40 198 44 152 Z" fill={t('#F3EBDD')} />
      <G fill={t('#E8C27A')}>
        <Circle cx={70} cy={176} r={3} />
        <Circle cx={96} cy={186} r={2.5} />
        <Circle cx={128} cy={174} r={3} />
        <Circle cx={116} cy={190} r={2} />
      </G>
      <Path d="M76 92 Q100 60 124 92 L118 86 L112 94 L106 86 L100 94 L94 86 L88 94 L82 86 Z" fill={t('#F3EBDD')} />
    </>
  );
}

function DragonRadiantBack() {
  const t = same;
  return (
    <>
      <Fx kind="zDrift">
        <G fill={t('#F2E9D8')} opacity={0.22}>
          <Ellipse cx={40} cy={58} rx={30} ry={9} />
          <Ellipse cx={164} cy={36} rx={32} ry={10} />
          <Ellipse cx={150} cy={182} rx={42} ry={9} />
          <Ellipse cx={34} cy={150} rx={26} ry={8} />
        </G>
      </Fx>
    </>
  );
}

function DragonRadiantFront() {
  const t = same;
  return (
    <>
      <Fx kind="zOrbit" ox={100} oy={96}>
        <G>
          <Circle cx={100} cy={14} r={6} fill={t('#F7F2E8')} />
          <Circle cx={100} cy={14} r={9} fill="none" stroke={t('#FFF1C4')} strokeOpacity={0.5} />
          <Circle cx={182} cy={128} r={5} fill={t('#E6F0FF')} />
          <Circle cx={20} cy={132} r={5} fill={t('#FFF1C4')} />
        </G>
      </Fx>
    </>
  );
}

/* ------------------------------------------------------------------ Snake */

function SnakeArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={54} ry={7} fill={t('#000')} opacity={0.3} />
      <Ellipse cx={100} cy={174} rx={50} ry={14} fill={t('#5E9E6C')} />
      <Ellipse cx={100} cy={170} rx={46} ry={11} fill={t('#6BAF7A')} />
      <Ellipse cx={100} cy={154} rx={38} ry={12} fill={t('#5E9E6C')} />
      <Ellipse cx={100} cy={150} rx={34} ry={9} fill={t('#7DBF8A')} />
      <G fill={t('#4E8E5C')}>
        <Circle cx={68} cy={170} r={3} />
        <Circle cx={88} cy={174} r={3} />
        <Circle cx={112} cy={174} r={3} />
        <Circle cx={132} cy={170} r={3} />
        <Circle cx={82} cy={152} r={3} />
        <Circle cx={118} cy={152} r={3} />
      </G>
      <Fx kind="zSway" ox={100.0} oy={150.0}>
        <G>
          <Path d="M100 150 C100 134 104 128 100 120" stroke={t('#7DBF8A')} strokeWidth={22} fill="none" strokeLinecap="round" />
          <Ellipse cx={100} cy={96} rx={30} ry={26} fill={t('#86C893')} />
          <Fx kind="zFlick" ox={100.0} oy={118.0}>
            <Path d="M100 118 L100 130 L96 136 M100 130 L104 136" stroke={t('#C9433A')} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          </Fx>
          <Path d="M92 108 Q100 114 108 108" stroke={t('#2B2420')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Fx kind="blink" ox={100.0} oy={92.0}>
            <G>
              <Circle cx={88} cy={92} r={4.2} fill={t('#2B2420')} />
              <Circle cx={112} cy={92} r={4.2} fill={t('#2B2420')} />
              <Circle cx={89.5} cy={90.5} r={1.4} fill={t('#FFFFFF')} />
              <Circle cx={113.5} cy={90.5} r={1.4} fill={t('#FFFFFF')} />
            </G>
          </Fx>
          <Circle cx={78} cy={104} r={5} fill={t('#E8998A')} opacity={0.45} />
          <Circle cx={122} cy={104} r={5} fill={t('#E8998A')} opacity={0.45} />
        </G>
      </Fx>
    </>
  );
}

function SnakeBabyBack() {
  const t = same;
  return (
    <>
      <Path d="M22 184 Q100 134 178 184 Q100 206 22 184 Z" fill={t('#4E7A3A')} />
      <Path d="M28 184 Q100 176 172 184" stroke={t('#6E9B4E')} strokeWidth={2} fill="none" />
    </>
  );
}

function SnakeBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M40 182 Q42 166 50 160" stroke={t('#6E9B4E')} strokeWidth={2.4} fill="none" />
      <Ellipse cx={54} cy={158} rx={7} ry={4} fill={t('#8DAA62')} transform="rotate(-30 54 158)" />
      <Fx kind="zGlint">
        <Circle cx={152} cy={178} r={3} fill={t('#E6F4FF')} />
      </Fx>
    </>
  );
}

function SnakeRadiantBack() {
  const t = same;
  return (
    <>
      <Ellipse cx={100} cy={186} rx={84} ry={14} fill={t('#2F6B4A')} />
      <Path d="M100 186 L180 180" stroke={t('#0E3A28')} strokeWidth={2} />
      <G fill={t('#B5F0D8')}>
        <Fx kind="zRise">
          <Circle cx={40} cy={160} r={2} />
        </Fx>
        <Fx kind="zRise" delay={1300}>
          <Circle cx={160} cy={150} r={2} />
        </Fx>
        <Fx kind="zRise" delay={2600}>
          <Circle cx={130} cy={170} r={1.6} />
        </Fx>
      </G>
    </>
  );
}

function SnakeRadiantFront() {
  const t = same;
  return (
    <>
      <G transform="translate(34 182)">
        <Ellipse cx={0} cy={-9} rx={6} ry={12} fill={t('#F4C2D0')} />
        <Ellipse cx={-9} cy={-5} rx={6} ry={11} fill={t('#F2A7C0')} transform="rotate(-35 -9 -5)" />
        <Ellipse cx={9} cy={-5} rx={6} ry={11} fill={t('#F2A7C0')} transform="rotate(35 9 -5)" />
        <Circle cx={0} cy={-3} r={3} fill={t('#F2C462')} />
      </G>
      <G transform="translate(170 176)">
        <Ellipse cx={0} cy={-6} rx={4} ry={8} fill={t('#F4C2D0')} />
        <Ellipse cx={-6} cy={-3} rx={4} ry={7} fill={t('#F2A7C0')} transform="rotate(-35 -6 -3)" />
        <Ellipse cx={6} cy={-3} rx={4} ry={7} fill={t('#F2A7C0')} transform="rotate(35 6 -3)" />
      </G>
    </>
  );
}

/* ------------------------------------------------------------------ Horse */

function HorseArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={190} rx={48} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zSwish" ox={134.0} oy={186.0}>
        <G>
          <Path d="M134 154 C160 156 168 176 158 186" stroke={t('#4A2E22')} strokeWidth={8} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Rect x={80} y={166} width={10} height={18} fill={t('#B0703A')} />
      <Rect x={110} y={166} width={10} height={18} fill={t('#B0703A')} />
      <Rect x={80} y={182} width={10} height={6} rx={1} fill={t('#3A2A22')} />
      <Rect x={110} y={182} width={10} height={6} rx={1} fill={t('#3A2A22')} />
      <Ellipse cx={100} cy={152} rx={38} ry={26} fill={t('#B0703A')} />
      <Fx kind="zNod">
        <G>
          <Fx kind="zEar" ox={87.0} oy={58.0}>
            <G>
              <Polygon points="80,58 86,34 94,56" fill={t('#B9783F')} />
            </G>
          </Fx>
          <Fx kind="zEarR" ox={113.0} oy={58.0}>
            <G>
              <Polygon points="106,56 114,34 120,58" fill={t('#B9783F')} />
            </G>
          </Fx>
          <Ellipse cx={100} cy={90} rx={30} ry={36} fill={t('#B9783F')} />
          <Path d="M100 62 L96 98 L104 98 Z" fill={t('#F3EBDD')} opacity={0.9} />
          <Fx kind="zMane" ox={76.0} oy={77.0}>
            <G fill={t('#4A2E22')}>
              <Circle cx={84} cy={58} r={8} />
              <Circle cx={94} cy={52} r={8} />
              <Circle cx={106} cy={52} r={8} />
              <Circle cx={118} cy={58} r={8} />
              <Circle cx={126} cy={70} r={7} />
            </G>
          </Fx>
          <Ellipse cx={100} cy={116} rx={20} ry={13} fill={t('#D9A274')} />
          <Circle cx={93} cy={116} r={2.5} fill={t('#6B3F2A')} />
          <Circle cx={107} cy={116} r={2.5} fill={t('#6B3F2A')} />
          <Fx kind="blink" ox={100.0} oy={86.0}>
            <G>
              <Circle cx={86} cy={86} r={4.2} fill={t('#2B2420')} />
              <Circle cx={114} cy={86} r={4.2} fill={t('#2B2420')} />
              <Circle cx={87.5} cy={84.5} r={1.4} fill={t('#FFFFFF')} />
              <Circle cx={115.5} cy={84.5} r={1.4} fill={t('#FFFFFF')} />
            </G>
          </Fx>
          <Circle cx={78} cy={100} r={5} fill={t('#E8998A')} opacity={0.45} />
          <Circle cx={122} cy={100} r={5} fill={t('#E8998A')} opacity={0.45} />
          <Path d="M76 104 Q100 112 124 104" stroke={t('#C9433A')} strokeWidth={3} fill="none" />
          <Circle cx={76} cy={104} r={3.5} fill={t('#F2C462')} />
          <Circle cx={124} cy={104} r={3.5} fill={t('#F2C462')} />
        </G>
      </Fx>
    </>
  );
}

const HorseBabyBack = () => null;

function HorseBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M104 130 Q114 138 120 140" stroke={t('#6E8B4E')} strokeWidth={1.6} fill="none" />
      <Circle cx={124.0} cy={136.0} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={127.8} cy={138.8} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={126.4} cy={143.2} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={121.6} cy={143.2} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={120.2} cy={138.8} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={124} cy={140} r={2.4} fill={t('#F2C462')} />
      <Path d="M44 198 L48 182 L52 198 M150 198 L154 184 L158 198" stroke={t('#6E8B4E')} strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  );
}

function HorseRadiantBack() {
  const t = same;
  return (
    <>
      <Fx kind="zWingL" ox={78.0} oy={150.4}>
        <G>
          <Path d="M78 148 C52 122 28 104 8 108 C20 116 22 122 18 130 C30 130 34 136 30 144 C44 142 52 150 50 158 C62 154 70 156 78 162 Z" fill={t('#F7F5F0')} stroke={t('#E8C27A')} strokeWidth={1.5} />
          <Path d="M60 128 L44 122 M64 138 L46 136 M68 148 L54 148" stroke={t('#E6E1D7')} strokeWidth={1.5} />
        </G>
      </Fx>
      <G transform="translate(200 0) scale(-1 1)">
        <Fx kind="zWingL" ox={78.0} oy={150.4}>
          <G>
            <Path d="M78 148 C52 122 28 104 8 108 C20 116 22 122 18 130 C30 130 34 136 30 144 C44 142 52 150 50 158 C62 154 70 156 78 162 Z" fill={t('#F7F5F0')} stroke={t('#E8C27A')} strokeWidth={1.5} />
            <Path d="M60 128 L44 122 M64 138 L46 136 M68 148 L54 148" stroke={t('#E6E1D7')} strokeWidth={1.5} />
          </G>
        </Fx>
      </G>
    </>
  );
}

function HorseRadiantFront() {
  const t = same;
  return (
    <>
      <G stroke={t('#FFF1C4')} strokeWidth={2} strokeLinecap="round" opacity={0.8}>
        <DashFlow kind="streak" d="M128 50 L172 34" />
        <DashFlow kind="streak" d="M132 62 L182 56" />
        <DashFlow kind="streak" d="M126 40 L160 18" />
      </G>
      <G transform="translate(170 150)">
        <Fx kind="zTwinkle" ox={0.0} oy={0.0}>
          <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill={t('#FFF1C4')} />
        </Fx>
      </G>
      <G transform="translate(28 176)">
        <Fx kind="zTwinkle" delay={900} ox={0.0} oy={0.0}>
          <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill={t('#E6EEF8')} />
        </Fx>
      </G>
    </>
  );
}

/* ------------------------------------------------------------------ Goat */

function GoatArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={46} ry={7} fill={t('#000')} opacity={0.3} />
      <Ellipse cx={100} cy={156} rx={36} ry={28} fill={t('#F4ECDA')} />
      <Ellipse cx={84} cy={183} rx={10} ry={5} fill={t('#6B5E52')} />
      <Ellipse cx={116} cy={183} rx={10} ry={5} fill={t('#6B5E52')} />
      <Fx kind="zTilt" ox={100.0} oy={152.0}>
        <G>
          <Path d="M84 64 C74 46 92 38 94 54 M116 64 C126 46 108 38 106 54" stroke={t('#9C9488')} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Fx kind="zEar" ox={64.0} oy={94.0}>
            <G>
              <Ellipse cx={64} cy={88} rx={15} ry={6} fill={t('#E6DCC4')} />
            </G>
          </Fx>
          <Fx kind="zEarR" ox={136.0} oy={94.0}>
            <G>
              <Ellipse cx={136} cy={88} rx={15} ry={6} fill={t('#E6DCC4')} />
            </G>
          </Fx>
          <Circle cx={100} cy={92} r={34} fill={t('#F4ECDA')} />
          <Circle cx={94} cy={62} r={6} fill={t('#FFFBF2')} />
          <Circle cx={104} cy={60} r={6} fill={t('#FFFBF2')} />
          <Ellipse cx={100} cy={108} rx={6} ry={4} fill={t('#E8998A')} />
          <Path d="M94 114 Q100 118 106 114" stroke={t('#2B2420')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Fx kind="blink" ox={100.0} oy={90.0}>
            <G>
              <Circle cx={88} cy={90} r={4.2} fill={t('#2B2420')} />
              <Circle cx={112} cy={90} r={4.2} fill={t('#2B2420')} />
              <Circle cx={89.5} cy={88.5} r={1.4} fill={t('#FFFFFF')} />
              <Circle cx={113.5} cy={88.5} r={1.4} fill={t('#FFFFFF')} />
            </G>
          </Fx>
          <Circle cx={78} cy={102} r={5} fill={t('#E8998A')} opacity={0.5} />
          <Circle cx={122} cy={102} r={5} fill={t('#E8998A')} opacity={0.5} />
          <Fx kind="zFloaty" ox={100.0} oy={135.0}>
            <Path d="M95 135 L100 152 L105 135 Z" fill={t('#E6DCC4')} />
          </Fx>
        </G>
      </Fx>
    </>
  );
}

const GoatBabyBack = () => null;

function GoatBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M38 198 Q42 164 72 162 Q100 150 128 162 Q158 164 162 198 Z" fill={t('#7C766F')} />
      <Path d="M60 170 Q80 162 96 166" stroke={t('#9C968F')} strokeWidth={3} fill="none" strokeLinecap="round" />
      <G fill={t('#6E8B4E')}>
        <Ellipse cx={132} cy={168} rx={8} ry={3} />
        <Ellipse cx={62} cy={178} rx={6} ry={2.5} />
      </G>
      <G fill={t('#8DAA62')}>
        <Circle cx={146} cy={156} r={3.5} />
        <Circle cx={152} cy={156} r={3.5} />
        <Circle cx={149} cy={151} r={3.5} />
      </G>
      <Path d="M149 158 L150 166" stroke={t('#6E8B4E')} strokeWidth={1.4} />
    </>
  );
}

function GoatRadiantBack() {
  const t = same;
  return (
    <>
      <Path d="M0 150 Q50 120 100 140 Q150 116 200 140 L200 200 L0 200 Z" fill={t('#2F5A3A')} />
      <Path d="M0 172 Q60 150 120 166 Q170 152 200 164 L200 200 L0 200 Z" fill={t('#3E7A4A')} />
      <Fx kind="zDrift">
        <G fill={t('#F2F5FA')} opacity={0.75}>
          <Ellipse cx={40} cy={48} rx={20} ry={7} />
          <Ellipse cx={52} cy={42} rx={12} ry={7} />
          <Ellipse cx={164} cy={70} rx={22} ry={7} />
          <Ellipse cx={174} cy={64} rx={12} ry={7} />
        </G>
      </Fx>
    </>
  );
}

function GoatRadiantFront() {
  const t = same;
  return (
    <>
      <G fill={t('#F2F5FA')}>
        <Circle cx={64} cy={186} r={14} />
        <Circle cx={86} cy={180} r={17} />
        <Circle cx={112} cy={180} r={17} />
        <Circle cx={136} cy={186} r={14} />
        <Rect x={54} y={184} width={92} height={14} rx={7} />
      </G>
      <Fx kind="zTilt" ox={100.4} oy={126.6}>
        <G>
          <Circle cx={80.0} cy={108.0} r={3.4} fill={t('#F2F5FA')} />
          <Circle cx={83.8} cy={110.8} r={3.4} fill={t('#F2F5FA')} />
          <Circle cx={82.4} cy={115.2} r={3.4} fill={t('#F2F5FA')} />
          <Circle cx={77.6} cy={115.2} r={3.4} fill={t('#F2F5FA')} />
          <Circle cx={76.2} cy={110.8} r={3.4} fill={t('#F2F5FA')} />
          <Circle cx={80} cy={112} r={2.4} fill={t('#F2C462')} />
          <Circle cx={92.0} cy={114.0} r={3.4} fill={t('#F2A7C0')} />
          <Circle cx={95.8} cy={116.8} r={3.4} fill={t('#F2A7C0')} />
          <Circle cx={94.4} cy={121.2} r={3.4} fill={t('#F2A7C0')} />
          <Circle cx={89.6} cy={121.2} r={3.4} fill={t('#F2A7C0')} />
          <Circle cx={88.2} cy={116.8} r={3.4} fill={t('#F2A7C0')} />
          <Circle cx={92} cy={118} r={2.4} fill={t('#F2C462')} />
          <Circle cx={106.0} cy={116.0} r={3.4} fill={t('#F2C462')} />
          <Circle cx={109.8} cy={118.8} r={3.4} fill={t('#F2C462')} />
          <Circle cx={108.4} cy={123.2} r={3.4} fill={t('#F2C462')} />
          <Circle cx={103.6} cy={123.2} r={3.4} fill={t('#F2C462')} />
          <Circle cx={102.2} cy={118.8} r={3.4} fill={t('#F2C462')} />
          <Circle cx={106} cy={120} r={2.4} fill={t('#E8913A')} />
          <Circle cx={120.0} cy={112.0} r={3.4} fill={t('#B5DCC6')} />
          <Circle cx={123.8} cy={114.8} r={3.4} fill={t('#B5DCC6')} />
          <Circle cx={122.4} cy={119.2} r={3.4} fill={t('#B5DCC6')} />
          <Circle cx={117.6} cy={119.2} r={3.4} fill={t('#B5DCC6')} />
          <Circle cx={116.2} cy={114.8} r={3.4} fill={t('#B5DCC6')} />
          <Circle cx={120} cy={116} r={2.4} fill={t('#F2C462')} />
          <Circle cx={80.0} cy={40.6} r={2.9} fill={t('#F2A7C0')} />
          <Circle cx={83.2} cy={42.9} r={2.9} fill={t('#F2A7C0')} />
          <Circle cx={82.0} cy={46.8} r={2.9} fill={t('#F2A7C0')} />
          <Circle cx={78.0} cy={46.8} r={2.9} fill={t('#F2A7C0')} />
          <Circle cx={76.8} cy={42.9} r={2.9} fill={t('#F2A7C0')} />
          <Circle cx={80} cy={44} r={2.0} fill={t('#F2C462')} />
          <Circle cx={122.0} cy={40.6} r={2.9} fill={t('#F2F5FA')} />
          <Circle cx={125.2} cy={42.9} r={2.9} fill={t('#F2F5FA')} />
          <Circle cx={124.0} cy={46.8} r={2.9} fill={t('#F2F5FA')} />
          <Circle cx={120.0} cy={46.8} r={2.9} fill={t('#F2F5FA')} />
          <Circle cx={118.8} cy={42.9} r={2.9} fill={t('#F2F5FA')} />
          <Circle cx={122} cy={44} r={2.0} fill={t('#F2C462')} />
        </G>
      </Fx>
    </>
  );
}

/* ------------------------------------------------------------------ Monkey */

function MonkeyArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={46} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zSwish" dur={2600} ox={130.0} oy={168.0}>
        <G>
          <Path d="M130 168 C176 162 170 112 148 118 C138 122 146 134 156 128" stroke={t('#8A5A3C')} strokeWidth={6} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Ellipse cx={100} cy={156} rx={32} ry={28} fill={t('#8A5A3C')} />
      <Ellipse cx={100} cy={162} rx={18} ry={16} fill={t('#F0CFA8')} />
      <Ellipse cx={84} cy={183} rx={10} ry={5} fill={t('#F0CFA8')} />
      <Ellipse cx={116} cy={183} rx={10} ry={5} fill={t('#F0CFA8')} />
      <Fx kind="zWave" ox={126.0} oy={148.0}>
        <G>
          <Path d="M126 148 L148 118" stroke={t('#8A5A3C')} strokeWidth={10} strokeLinecap="round" />
          <Circle cx={150} cy={114} r={8} fill={t('#F0CFA8')} />
        </G>
      </Fx>
      <Circle cx={62} cy={92} r={13} fill={t('#8A5A3C')} />
      <Circle cx={62} cy={92} r={7} fill={t('#F0CFA8')} />
      <Circle cx={138} cy={92} r={13} fill={t('#8A5A3C')} />
      <Circle cx={138} cy={92} r={7} fill={t('#F0CFA8')} />
      <Circle cx={100} cy={92} r={34} fill={t('#8A5A3C')} />
      <Path d="M92 60 Q100 46 108 60 Z" fill={t('#6E4630')} />
      <G fill={t('#F0CFA8')}>
        <Circle cx={92} cy={90} r={14} />
        <Circle cx={108} cy={90} r={14} />
        <Ellipse cx={100} cy={106} rx={22} ry={15} />
      </G>
      <Circle cx={97} cy={103} r={1.5} fill={t('#6B3F2A')} />
      <Circle cx={103} cy={103} r={1.5} fill={t('#6B3F2A')} />
      <Path d="M90 110 Q100 118 110 110" stroke={t('#2B2420')} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Fx kind="blink" ox={100.0} oy={89.0}>
        <G>
          <Circle cx={90} cy={89} r={4.2} fill={t('#2B2420')} />
          <Circle cx={110} cy={89} r={4.2} fill={t('#2B2420')} />
          <Circle cx={91.5} cy={87.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={111.5} cy={87.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
      <Circle cx={80} cy={104} r={5} fill={t('#E8998A')} opacity={0.5} />
      <Circle cx={120} cy={104} r={5} fill={t('#E8998A')} opacity={0.5} />
    </>
  );
}

const MonkeyBabyBack = () => null;

function MonkeyBabyFront() {
  const t = same;
  return (
    <>
      <Circle cx={100} cy={162} r={20} fill={t('#F7B49A')} />
      <Circle cx={92} cy={158} r={10} fill={t('#F9CDB8')} opacity={0.7} />
      <Path d="M100 144 Q96 162 100 180" stroke={t('#E8826A')} strokeWidth={1.6} fill="none" />
      <Path d="M100 142 Q108 132 118 136 Q110 144 100 142 Z" fill={t('#6E8B4E')} />
    </>
  );
}

function MonkeyRadiantBack() {
  const t = same;
  return (
    <>
      <Path d="M0 40 Q60 18 110 30 Q150 36 196 18" stroke={t('#5A3A24')} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M70 26 L76 42 M140 32 L144 46" stroke={t('#5A3A24')} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={30.0} cy={27.0} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={34.8} cy={30.4} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={33.0} cy={36.0} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={27.1} cy={36.0} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={25.2} cy={30.4} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={30} cy={32} r={3.0} fill={t('#F2C462')} />
      <Circle cx={76.0} cy={39.5} r={3.8} fill={t('#F7C6D6')} />
      <Circle cx={80.3} cy={42.6} r={3.8} fill={t('#F7C6D6')} />
      <Circle cx={78.7} cy={47.6} r={3.8} fill={t('#F7C6D6')} />
      <Circle cx={73.3} cy={47.6} r={3.8} fill={t('#F7C6D6')} />
      <Circle cx={71.7} cy={42.6} r={3.8} fill={t('#F7C6D6')} />
      <Circle cx={76} cy={44} r={2.7} fill={t('#F2C462')} />
      <Circle cx={120.0} cy={25.0} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={124.8} cy={28.4} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={123.0} cy={34.0} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={117.0} cy={34.0} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={115.2} cy={28.4} r={4.2} fill={t('#F2A7C0')} />
      <Circle cx={120} cy={30} r={3.0} fill={t('#F2C462')} />
      <Circle cx={144.0} cy={44.0} r={3.4} fill={t('#F7C6D6')} />
      <Circle cx={147.8} cy={46.8} r={3.4} fill={t('#F7C6D6')} />
      <Circle cx={146.4} cy={51.2} r={3.4} fill={t('#F7C6D6')} />
      <Circle cx={141.6} cy={51.2} r={3.4} fill={t('#F7C6D6')} />
      <Circle cx={140.2} cy={46.8} r={3.4} fill={t('#F7C6D6')} />
      <Circle cx={144} cy={48} r={2.4} fill={t('#F2C462')} />
      <Circle cx={178.0} cy={17.5} r={3.8} fill={t('#F2A7C0')} />
      <Circle cx={182.3} cy={20.6} r={3.8} fill={t('#F2A7C0')} />
      <Circle cx={180.7} cy={25.6} r={3.8} fill={t('#F2A7C0')} />
      <Circle cx={175.3} cy={25.6} r={3.8} fill={t('#F2A7C0')} />
      <Circle cx={173.7} cy={20.6} r={3.8} fill={t('#F2A7C0')} />
      <Circle cx={178} cy={22} r={2.7} fill={t('#F2C462')} />
      <G fill={t('#F7C6D6')}>
        <Fx kind="zPetal" ox={60.0} oy={50.0}>
          <Ellipse cx={60} cy={50} rx={3} ry={2} />
        </Fx>
        <Fx kind="zPetal" delay={1700} ox={130.0} oy={46.0}>
          <Ellipse cx={130} cy={46} rx={3} ry={2} />
        </Fx>
        <Fx kind="zPetal" delay={3400} ox={170.0} oy={40.0}>
          <Ellipse cx={170} cy={40} rx={3} ry={2} />
        </Fx>
      </G>
    </>
  );
}

function MonkeyRadiantFront() {
  const t = same;
  return (
    <>
      <G fill="none" stroke={t('#C9A24B')} strokeWidth={1.6}>
        <Circle cx={90} cy={85} r={7.5} />
        <Circle cx={110} cy={85} r={7.5} />
        <Path d="M97.5 85 L102.5 85" />
      </G>
      <Path d="M92 112 Q100 134 108 112 Q100 118 92 112 Z" fill={t('#F2F5FA')} />
      <G transform="translate(70 152)">
        <Circle cx={0} cy={0} r={13} fill={t('#F7B49A')} />
        <Circle cx={-5} cy={-3} r={6} fill={t('#F9CDB8')} opacity={0.7} />
        <Path d="M0 -12 Q-3 0 0 12" stroke={t('#E8826A')} strokeWidth={1.4} fill="none" />
        <Path d="M0 -12 Q7 -20 14 -16 Q8 -10 0 -12 Z" fill={t('#6E8B4E')} />
      </G>
    </>
  );
}

/* ------------------------------------------------------------------ Rooster */

function RoosterArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={44} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zFan" ox={128.0} oy={170.0}>
        <G>
          <Path d="M128 130 C158 88 178 108 168 140 Z" fill={t('#2F7D68')} />
          <Path d="M132 136 C168 110 184 132 168 156 Z" fill={t('#E8913A')} />
          <Path d="M130 144 C162 140 174 160 156 170 Z" fill={t('#C9433A')} />
        </G>
      </Fx>
      <Path d="M88 166 L86 186 M112 166 L114 186 M80 186 L92 186 M108 186 L120 186" stroke={t('#E8A24B')} strokeWidth={4} strokeLinecap="round" />
      <Fx kind="zComb" ox={100.0} oy={85.0}>
        <G>
          <Circle cx={90} cy={76} r={9} fill={t('#C9433A')} />
          <Circle cx={100} cy={72} r={10} fill={t('#C9433A')} />
          <Circle cx={110} cy={76} r={9} fill={t('#C9433A')} />
        </G>
      </Fx>
      <Circle cx={100} cy={126} r={44} fill={t('#F7F5F0')} />
      <Ellipse cx={124} cy={136} rx={17} ry={24} fill={t('#E6E1D7')} />
      <Polygon points="94,112 106,112 100,122" fill={t('#E8A24B')} />
      <Fx kind="zFloaty" ox={100.0} oy={120.0}>
        <Path d="M100 120 Q106 130 100 136 Q94 130 100 120 Z" fill={t('#C9433A')} />
      </Fx>
      <Fx kind="blink" ox={100.0} oy={104.0}>
        <G>
          <Circle cx={88} cy={104} r={4.2} fill={t('#2B2420')} />
          <Circle cx={112} cy={104} r={4.2} fill={t('#2B2420')} />
          <Circle cx={89.5} cy={102.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={113.5} cy={102.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
      <Circle cx={78} cy={116} r={5} fill={t('#E8998A')} opacity={0.5} />
      <Circle cx={122} cy={116} r={5} fill={t('#E8998A')} opacity={0.5} />
    </>
  );
}

const RoosterBabyBack = () => null;

function RoosterBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M78 110 Q78 84 100 84 Q122 84 122 110 L116 104 L110 111 L104 104 L98 111 L92 104 L86 111 Z" fill={t('#F3EBDD')} />
      <Path d="M54 196 L60 186 L66 194 L72 186 L78 196 Z M126 196 L132 188 L138 196 L144 188 L148 196 Z" fill={t('#F3EBDD')} />
    </>
  );
}

function RoosterRadiantBack() {
  const t = same;
  return (
    <>
      <Fx kind="zRays">
        <G stroke={t('#F2934A')} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round">
          <Path d="M100 200 L20 60 M100 200 L52 36 M100 200 L100 18 M100 200 L148 36 M100 200 L180 60 M100 200 L4 120 M100 200 L196 120" />
        </G>
      </Fx>
      <Path d="M0 184 Q100 172 200 184 L200 200 L0 200 Z" fill={t('#3A2214')} />
    </>
  );
}

function RoosterRadiantFront() {
  const t = same;
  return (
    <>
      <Fx kind="zFan" ox={142.0} oy={156.0}>
        <G>
          <Path d="M142 140 C176 100 196 70 186 36 C180 66 166 90 148 118 Z" fill={t('#F2C462')} />
          <Path d="M146 148 C186 122 200 100 198 74 C188 98 172 116 152 134 Z" fill={t('#E8913A')} />
          <Path d="M148 156 C184 148 198 132 200 114 C186 132 170 140 152 146 Z" fill={t('#F7D27A')} />
        </G>
      </Fx>
    </>
  );
}

/* ------------------------------------------------------------------ Dog */

function DogArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={46} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zWag" ox={132.0} oy={162.0}>
        <G>
          <Path d="M132 162 Q160 152 156 128" stroke={t('#D9A86A')} strokeWidth={9} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Ellipse cx={100} cy={156} rx={36} ry={28} fill={t('#D9A86A')} />
      <Ellipse cx={100} cy={162} rx={20} ry={16} fill={t('#F3E2C8')} />
      <Ellipse cx={84} cy={183} rx={11} ry={5} fill={t('#F3E2C8')} />
      <Ellipse cx={116} cy={183} rx={11} ry={5} fill={t('#F3E2C8')} />
      <Circle cx={100} cy={92} r={36} fill={t('#E3B57A')} />
      <Fx kind="zFlopL" ox={66.0} oy={72.0}>
        <G>
          <Ellipse cx={66} cy={96} rx={12} ry={24} fill={t('#8A5A3C')} />
        </G>
      </Fx>
      <Fx kind="zFlopR" ox={134.0} oy={72.0}>
        <G>
          <Ellipse cx={134} cy={96} rx={12} ry={24} fill={t('#8A5A3C')} />
        </G>
      </Fx>
      <Ellipse cx={87} cy={88} rx={12} ry={11} fill={t('#B5824A')} />
      <Ellipse cx={100} cy={110} rx={20} ry={14} fill={t('#F3E2C8')} />
      <Ellipse cx={100} cy={103} rx={6} ry={4.5} fill={t('#2B2420')} />
      <Fx kind="zPant" ox={100.0} oy={113.0}>
        <Ellipse cx={100} cy={119} rx={5} ry={6} fill={t('#E8998A')} />
      </Fx>
      <Path d="M100 108 L100 112 M100 112 Q94 116 90 113 M100 112 Q106 116 110 113" stroke={t('#2B2420')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Fx kind="blink" ox={100.0} oy={88.0}>
        <G>
          <Circle cx={87} cy={88} r={4.2} fill={t('#2B2420')} />
          <Circle cx={113} cy={88} r={4.2} fill={t('#2B2420')} />
          <Circle cx={88.5} cy={86.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={114.5} cy={86.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
    </>
  );
}

const DogBabyBack = () => null;

function DogBabyFront() {
  const t = same;
  return (
    <>
      <G transform="rotate(-20 140 184)">
        <Rect x={124} y={180} width={32} height={8} rx={4} fill={t('#F3EBDD')} />
        <Circle cx={124} cy={180} r={5} fill={t('#F3EBDD')} />
        <Circle cx={124} cy={188} r={5} fill={t('#F3EBDD')} />
        <Circle cx={156} cy={180} r={5} fill={t('#F3EBDD')} />
        <Circle cx={156} cy={188} r={5} fill={t('#F3EBDD')} />
      </G>
    </>
  );
}

function DogRadiantBack() {
  const t = same;
  return (
    <>
      <G fill={t('#6E9BEA')} opacity={0.45}>
        <G transform="translate(24 190)">
          <Ellipse cx={0} cy={2} rx={4} ry={3.4} />
          <Circle cx={-4} cy={-3} r={1.6} />
          <Circle cx={0} cy={-4.5} r={1.6} />
          <Circle cx={4} cy={-3} r={1.6} />
        </G>
        <G transform="translate(44 180)">
          <Ellipse cx={0} cy={2} rx={4} ry={3.4} />
          <Circle cx={-4} cy={-3} r={1.6} />
          <Circle cx={0} cy={-4.5} r={1.6} />
          <Circle cx={4} cy={-3} r={1.6} />
        </G>
        <G transform="translate(64 192)">
          <Ellipse cx={0} cy={2} rx={4} ry={3.4} />
          <Circle cx={-4} cy={-3} r={1.6} />
          <Circle cx={0} cy={-4.5} r={1.6} />
          <Circle cx={4} cy={-3} r={1.6} />
        </G>
        <G transform="translate(170 186)">
          <Ellipse cx={0} cy={2} rx={4} ry={3.4} />
          <Circle cx={-4} cy={-3} r={1.6} />
          <Circle cx={0} cy={-4.5} r={1.6} />
          <Circle cx={4} cy={-3} r={1.6} />
        </G>
      </G>
      <G fill={t('#8FB4F2')}>
        <G transform="translate(36 70)">
          <Fx kind="zRise">
            <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" />
          </Fx>
        </G>
        <G transform="translate(168 90)">
          <Fx kind="zRise" delay={1300}>
            <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" />
          </Fx>
        </G>
      </G>
    </>
  );
}

function DogRadiantFront() {
  const t = same;
  return (
    <>
      <Path d="M76 120 Q100 128 124 120 L100 152 Z" fill={t('#3E6FC8')} />
      <G fill={t('#F2F5FA')}>
        <Circle cx={90} cy={128} r={1.6} />
        <Circle cx={110} cy={128} r={1.6} />
        <Circle cx={100} cy={144} r={1.6} />
      </G>
      <G transform="translate(100 134)">
        <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" fill={t('#F2C462')} />
      </G>
    </>
  );
}

/* ------------------------------------------------------------------ Pig */

function PigArt({ t }: { t: Paint }) {
  return (
    <>
      <Ellipse cx={100} cy={188} rx={48} ry={7} fill={t('#000')} opacity={0.3} />
      <Fx kind="zCurly" ox={132.0} oy={158.0}>
        <G>
          <Path d="M134 156 C146 150 150 162 140 164 C132 166 136 154 146 152" stroke={t('#E89A9E')} strokeWidth={3} fill="none" strokeLinecap="round" />
        </G>
      </Fx>
      <Ellipse cx={100} cy={154} rx={38} ry={30} fill={t('#F2B6B8')} />
      <Ellipse cx={84} cy={183} rx={10} ry={5} fill={t('#C97F84')} />
      <Ellipse cx={116} cy={183} rx={10} ry={5} fill={t('#C97F84')} />
      <Fx kind="zEar" ox={81.0} oy={74.0}>
        <G>
          <Polygon points="70,74 76,48 92,64" fill={t('#E89A9E')} />
        </G>
      </Fx>
      <Fx kind="zEarR" ox={119.0} oy={74.0}>
        <G>
          <Polygon points="108,64 124,48 130,74" fill={t('#E89A9E')} />
        </G>
      </Fx>
      <Circle cx={100} cy={94} r={38} fill={t('#F5C2C4')} />
      <Fx kind="zTwitch" dur={1800} ox={100.0} oy={108.0}>
        <G>
          <Ellipse cx={100} cy={108} rx={16} ry={11} fill={t('#E89A9E')} />
          <Ellipse cx={95} cy={108} rx={2.2} ry={3.2} fill={t('#C97F84')} />
          <Ellipse cx={105} cy={108} rx={2.2} ry={3.2} fill={t('#C97F84')} />
        </G>
      </Fx>
      <Path d="M94 122 Q100 126 106 122" stroke={t('#2B2420')} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Fx kind="blink" ox={100.0} oy={88.0}>
        <G>
          <Circle cx={86} cy={88} r={4.2} fill={t('#2B2420')} />
          <Circle cx={114} cy={88} r={4.2} fill={t('#2B2420')} />
          <Circle cx={87.5} cy={86.5} r={1.4} fill={t('#FFFFFF')} />
          <Circle cx={115.5} cy={86.5} r={1.4} fill={t('#FFFFFF')} />
        </G>
      </Fx>
      <Circle cx={74} cy={104} r={5} fill={t('#E8998A')} opacity={0.6} />
      <Circle cx={126} cy={104} r={5} fill={t('#E8998A')} opacity={0.6} />
    </>
  );
}

const PigBabyBack = () => null;

function PigBabyFront() {
  const t = same;
  return (
    <>
      <Path d="M84 86 L76 80 L76 92 Z M84 86 L92 80 L92 92 Z" fill={t('#E86A8A')} />
      <Circle cx={84} cy={86} r={2.5} fill={t('#C94A6A')} />
      <Circle cx={48.0} cy={184.0} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={51.8} cy={186.8} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={50.4} cy={191.2} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={45.6} cy={191.2} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={44.2} cy={186.8} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={48} cy={188} r={2.4} fill={t('#F2C462')} />
      <Circle cx={72.0} cy={190.0} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={75.8} cy={192.8} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={74.4} cy={197.2} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={69.6} cy={197.2} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={68.2} cy={192.8} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={72} cy={194} r={2.4} fill={t('#F2C462')} />
      <Circle cx={128.0} cy={190.0} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={131.8} cy={192.8} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={130.4} cy={197.2} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={125.6} cy={197.2} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={124.2} cy={192.8} r={3.4} fill={t('#F2B6B8')} />
      <Circle cx={128} cy={194} r={2.4} fill={t('#F2C462')} />
      <Circle cx={152.0} cy={184.0} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={155.8} cy={186.8} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={154.4} cy={191.2} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={149.6} cy={191.2} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={148.2} cy={186.8} r={3.4} fill={t('#FFFFFF')} />
      <Circle cx={152} cy={188} r={2.4} fill={t('#F2C462')} />
    </>
  );
}

function PigRadiantBack() {
  const t = same;
  return (
    <>
      <G fill={t('#F08CA6')}>
        <G transform="translate(30 90)">
          <Fx kind="zRise">
            <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" />
          </Fx>
        </G>
        <G transform="translate(172 70)">
          <Fx kind="zRise" delay={1300}>
            <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" />
          </Fx>
        </G>
        <G transform="translate(40 150)">
          <Fx kind="zRise" delay={2600}>
            <Path d="M0 4 C-5 0 -6 -3 -6 -4.5 A3 3 0 0 1 0 -5 A3 3 0 0 1 6 -4.5 C6 -3 5 0 0 4 Z" />
          </Fx>
        </G>
      </G>
    </>
  );
}

function PigRadiantFront() {
  const t = same;
  return (
    <>
      <Path d="M64 62 Q100 44 136 62" stroke={t('#6E8B4E')} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={68.0} cy={55.0} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={72.8} cy={58.5} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={71.0} cy={64.0} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={65.0} cy={64.0} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={63.2} cy={58.5} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={68} cy={60} r={3.0} fill={t('#F2C462')} />
      <Circle cx={84.0} cy={47.0} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={88.8} cy={50.5} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={87.0} cy={56.0} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={81.0} cy={56.0} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={79.2} cy={50.5} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={84} cy={52} r={3.0} fill={t('#F2C462')} />
      <Circle cx={100.0} cy={43.5} r={4.7} fill={t('#F08CA6')} />
      <Circle cx={105.2} cy={47.3} r={4.7} fill={t('#F08CA6')} />
      <Circle cx={103.2} cy={53.5} r={4.7} fill={t('#F08CA6')} />
      <Circle cx={96.8} cy={53.5} r={4.7} fill={t('#F08CA6')} />
      <Circle cx={94.8} cy={47.3} r={4.7} fill={t('#F08CA6')} />
      <Circle cx={100} cy={49} r={3.3} fill={t('#F2C462')} />
      <Circle cx={116.0} cy={47.0} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={120.8} cy={50.5} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={119.0} cy={56.0} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={113.0} cy={56.0} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={111.2} cy={50.5} r={4.2} fill={t('#FFFFFF')} />
      <Circle cx={116} cy={52} r={3.0} fill={t('#F2C462')} />
      <Circle cx={132.0} cy={55.0} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={136.8} cy={58.5} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={134.9} cy={64.0} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={129.1} cy={64.0} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={127.2} cy={58.5} r={4.2} fill={t('#F2B6B8')} />
      <Circle cx={132} cy={60} r={3.0} fill={t('#F2C462')} />
      <Path d="M144 170 Q160 146 176 170" stroke={t('#8A5A3C')} strokeWidth={3} fill="none" />
      <Ellipse cx={160} cy={166} rx={11} ry={5} fill={t('#D9A04E')} />
      <Circle cx={151} cy={168} r={6} fill={t('#C9433A')} />
      <Circle cx={168} cy={168} r={6} fill={t('#E8735F')} />
      <Path d="M140 170 L180 170 L174 196 L146 196 Z" fill={t('#B5824A')} />
      <Path d="M144 178 H176 M146 186 H174 M154 170 V196 M166 170 V196" stroke={t('#8A5A3C')} strokeWidth={1.4} />
    </>
  );
}

export const ZODIAC_ART = {
  rat: { Art: RatArt, BabyBack: RatBabyBack, BabyFront: RatBabyFront, RadiantBack: RatRadiantBack, RadiantFront: RatRadiantFront },
  ox: { Art: OxArt, BabyBack: OxBabyBack, BabyFront: OxBabyFront, RadiantBack: OxRadiantBack, RadiantFront: OxRadiantFront },
  tiger: { Art: TigerArt, BabyBack: TigerBabyBack, BabyFront: TigerBabyFront, RadiantBack: TigerRadiantBack, RadiantFront: TigerRadiantFront },
  rabbit: { Art: RabbitArt, BabyBack: RabbitBabyBack, BabyFront: RabbitBabyFront, RadiantBack: RabbitRadiantBack, RadiantFront: RabbitRadiantFront },
  dragon: { Art: DragonArt, BabyBack: DragonBabyBack, BabyFront: DragonBabyFront, RadiantBack: DragonRadiantBack, RadiantFront: DragonRadiantFront },
  snake: { Art: SnakeArt, BabyBack: SnakeBabyBack, BabyFront: SnakeBabyFront, RadiantBack: SnakeRadiantBack, RadiantFront: SnakeRadiantFront },
  horse: { Art: HorseArt, BabyBack: HorseBabyBack, BabyFront: HorseBabyFront, RadiantBack: HorseRadiantBack, RadiantFront: HorseRadiantFront },
  goat: { Art: GoatArt, BabyBack: GoatBabyBack, BabyFront: GoatBabyFront, RadiantBack: GoatRadiantBack, RadiantFront: GoatRadiantFront },
  monkey: { Art: MonkeyArt, BabyBack: MonkeyBabyBack, BabyFront: MonkeyBabyFront, RadiantBack: MonkeyRadiantBack, RadiantFront: MonkeyRadiantFront },
  rooster: { Art: RoosterArt, BabyBack: RoosterBabyBack, BabyFront: RoosterBabyFront, RadiantBack: RoosterRadiantBack, RadiantFront: RoosterRadiantFront },
  dog: { Art: DogArt, BabyBack: DogBabyBack, BabyFront: DogBabyFront, RadiantBack: DogRadiantBack, RadiantFront: DogRadiantFront },
  pig: { Art: PigArt, BabyBack: PigBabyBack, BabyFront: PigBabyFront, RadiantBack: PigRadiantBack, RadiantFront: PigRadiantFront },
} as const;
