import React from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { FadeInG, FlowPath, Fx, TravelDot, TwinkleDot, TwinkleStar } from './Fx';
import { SceneId } from './nookData';

export const NOOK_W = 342;
export const NOOK_H = 440;

/** The static-plus-twinkling backdrop for each scene. */
export function SceneBackdrop({ scene, bg }: { scene: SceneId; bg: string }) {
  return (
    <Svg width={NOOK_W} height={NOOK_H} viewBox={`0 0 ${NOOK_W} ${NOOK_H}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      {scene === 'night' && (
        <>
          <Path d="M34 118 L118 40 L196 108 L246 150 M118 40 L150 96" stroke="#F2E9D8" strokeOpacity={0.14} strokeWidth={0.8} fill="none" />
          <G fill="#F2E9D8">
            <TwinkleDot cx={34} cy={118} r={1.6} />
            <TwinkleDot cx={118} cy={40} r={1.3} delay={700} />
            <TwinkleDot cx={196} cy={108} r={1.5} delay={1400} />
            <TwinkleDot cx={44} cy={232} r={1.2} delay={700} />
            <TwinkleDot cx={318} cy={210} r={1.4} />
            <TwinkleDot cx={246} cy={150} r={1.1} delay={1400} />
            <TwinkleDot cx={150} cy={96} r={1} />
            <TwinkleDot cx={300} cy={300} r={1.2} delay={700} />
          </G>
          <Circle cx={300} cy={140} r={16} fill="#F2E9D8" />
          <Circle cx={307} cy={134} r={14} fill={bg} />
        </>
      )}
      {scene === 'chapel' && (
        <>
          <Fx kind="glow">
            <Polygon points="126,236 216,236 262,360 80,360" fill="#F2C462" />
          </Fx>
          <Path d="M118 236 L118 154 A53 53 0 0 1 224 154 L224 236 Z" fill="#2A2236" stroke="#C9A24B" strokeWidth={3} />
          <Path d="M171 104 L171 236 M118 180 L224 180" stroke="#C9A24B" strokeWidth={2} />
          <Rect x={122} y={184} width={46} height={48} fill="#8FC6A9" opacity={0.28} />
          <Rect x={174} y={184} width={46} height={48} fill="#E8998A" opacity={0.22} />
          <Path d="M122 176 L122 154 A49 49 0 0 1 168 106 L168 176 Z" fill="#9C84E8" opacity={0.2} />
          <Path d="M174 176 L174 106 A49 49 0 0 1 220 154 L220 176 Z" fill="#F2C462" opacity={0.2} />
          <Rect x={0} y={360} width={342} height={80} fill="#1F1A28" />
        </>
      )}
      {scene === 'grove' && (
        <>
          <Fx kind="glow">
            <Circle cx={262} cy={70} r={96} fill="#F2C462" />
          </Fx>
          <Ellipse cx={171} cy={474} rx={330} ry={160} fill="#1E3A2E" />
          <Fx kind="glow">
            <Ellipse cx={120} cy={364} rx={26} ry={6} fill="#F2C462" />
          </Fx>
          <Fx kind="glow">
            <Ellipse cx={226} cy={384} rx={30} ry={7} fill="#F2C462" />
          </Fx>
          <Path d="M40 384 C46 334 30 302 44 262" stroke="#3A3026" strokeWidth={8} fill="none" strokeLinecap="round" />
          <G fill="#2F4B3A">
            <Circle cx={30} cy={250} r={30} />
            <Circle cx={62} cy={236} r={26} />
            <Circle cx={46} cy={212} r={22} />
          </G>
          <Path d="M304 392 C296 342 312 312 300 272" stroke="#3A3026" strokeWidth={8} fill="none" strokeLinecap="round" />
          <G fill="#2F4B3A">
            <Circle cx={302} cy={258} r={30} />
            <Circle cx={328} cy={240} r={24} />
            <Circle cx={282} cy={236} r={22} />
          </G>
          <G fill="#8DAA62" opacity={0.7}>
            <Ellipse cx={40} cy={232} rx={5} ry={2.5} />
            <Ellipse cx={66} cy={222} rx={5} ry={2.5} />
            <Ellipse cx={298} cy={246} rx={5} ry={2.5} />
            <Ellipse cx={320} cy={230} rx={5} ry={2.5} />
          </G>
        </>
      )}
      {scene === 'desert' && (
        <>
          <Rect x={0} y={290} width={342} height={50} fill="#E38A4B" opacity={0.08} />
          <Fx kind="glow">
            <Circle cx={250} cy={120} r={44} fill="#F7E3B5" />
          </Fx>
          <TwinkleStar x={240} y={110} fill="#FFF3C4" />
          <G fill="#F2E9D8">
            <TwinkleDot cx={60} cy={60} r={1.2} delay={700} />
            <TwinkleDot cx={150} cy={110} r={1} delay={1400} />
            <TwinkleDot cx={40} cy={190} r={1.1} />
          </G>
          <Path d="M-10 330 C60 290 130 300 200 330 C260 355 300 320 360 300 L360 440 L-10 440 Z" fill="#3A2E3A" />
          <Path d="M-10 380 C80 340 160 360 240 380 C290 392 330 370 360 360 L360 440 L-10 440 Z" fill="#4A3A40" />
        </>
      )}
      {scene === 'meadow' && (
        <>
          <Ellipse cx={90} cy={430} rx={220} ry={120} fill="#173A2E" />
          <Ellipse cx={300} cy={440} rx={200} ry={100} fill="#1C4636" />
          <G fill="#F2E07A">
            <TwinkleDot cx={60} cy={250} r={2.2} />
            <TwinkleDot cx={250} cy={200} r={2} delay={700} />
            <TwinkleDot cx={300} cy={280} r={2.2} delay={1400} />
            <TwinkleDot cx={40} cy={160} r={1.8} delay={700} />
          </G>
          <G fill="#F7F2E8">
            <Fx kind="seed"><Circle cx={80} cy={340} r={2} /></Fx>
            <Fx kind="seed" delay={2300}><Circle cx={210} cy={330} r={2} /></Fx>
            <Fx kind="seed" delay={4600}><Circle cx={300} cy={350} r={2} /></Fx>
          </G>
          <G fill="#E8998A">
            <Circle cx={40} cy={380} r={3} />
            <Circle cx={300} cy={372} r={3} />
            <Circle cx={250} cy={400} r={2.5} />
          </G>
          <G fill="#F7F2E8">
            <Circle cx={70} cy={404} r={2.5} />
            <Circle cx={320} cy={398} r={2.5} />
          </G>
        </>
      )}
      {scene === 'aurora' && (
        <>
          <Fx kind="driftA">
            <Path d="M-40 120 C40 60 120 160 200 90 C260 40 320 120 380 70 L380 200 C320 230 260 160 200 210 C120 270 40 170 -40 230 Z" fill="#5FD3A8" opacity={0.16} />
          </Fx>
          <Fx kind="driftB">
            <Path d="M-40 170 C60 110 140 210 220 140 C280 100 330 170 380 130 L380 230 C320 260 260 200 200 250 C120 300 50 220 -40 270 Z" fill="#9C84E8" opacity={0.14} />
          </Fx>
          <G fill="#F2E9D8">
            <TwinkleDot cx={30} cy={60} r={1.3} />
            <TwinkleDot cx={230} cy={40} r={1.2} delay={700} />
            <TwinkleDot cx={320} cy={250} r={1.3} delay={1400} />
          </G>
        </>
      )}
      {scene === 'advent' && (
        <>
          <G fill="#F2A93B">
            <Fx kind="bokeh"><Circle cx={40} cy={110} r={18} /></Fx>
            <Fx kind="bokeh" delay={1600}><Circle cx={300} cy={150} r={24} /></Fx>
            <Fx kind="bokeh" delay={3200}><Circle cx={90} cy={300} r={14} /></Fx>
            <Fx kind="bokeh" delay={1600}><Circle cx={262} cy={104} r={12} /></Fx>
            <Fx kind="bokeh"><Circle cx={210} cy={190} r={10} /></Fx>
            <Fx kind="bokeh" delay={3200}><Circle cx={320} cy={330} r={16} /></Fx>
          </G>
          <Path d="M-10 28 Q85 78 171 40 Q257 78 352 28" stroke="#2F5B3A" strokeWidth={10} fill="none" strokeLinecap="round" />
          <G fill="#C0453A">
            <Circle cx={40} cy={46} r={4} />
            <Circle cx={110} cy={62} r={4} />
            <Circle cx={171} cy={40} r={4} />
            <Circle cx={232} cy={62} r={4} />
            <Circle cx={302} cy={46} r={4} />
          </G>
          <Rect x={0} y={360} width={342} height={80} fill="#24180F" />
        </>
      )}
      {scene === 'easter' && (
        <>
          <Rect x={0} y={190} width={342} height={130} fill="#E8A9A0" opacity={0.12} />
          <Rect x={0} y={260} width={342} height={90} fill="#F2C462" opacity={0.1} />
          <Fx kind="glow">
            <Circle cx={171} cy={352} r={70} fill="#F7E3B5" />
          </Fx>
          <Circle cx={171} cy={352} r={34} fill="#FFF3C4" opacity={0.85} />
          <Path d="M-10 360 C80 330 140 340 200 352 C260 364 300 340 360 336 L360 440 L-10 440 Z" fill="#3A2E48" />
          <Path d="M50 328 L50 346 M45 333 L55 333 M64 324 L64 344 M59 329 L69 329 M78 328 L78 344 M73 333 L83 333" stroke="#1E1830" strokeWidth={2} />
        </>
      )}
    </Svg>
  );
}

const WEB_SPOKES =
  'M171 230 L431 230 M171 230 L354.8 413.8 M171 230 L171 490 M171 230 L-12.8 413.8 M171 230 L-89 230 M171 230 L-12.8 46.2 M171 230 L171 -30 M171 230 L354.8 46.2';
const RINGS = [
  'M231 230 Q206 240 213.4 272.4 Q181 268 171 290 Q161 268 128.6 272.4 Q136 240 111 230 Q136 220 128.6 187.6 Q161 192 171 170 Q181 192 213.4 187.6 Q206 220 231 230 Z',
  'M276 230 Q236 244 245.2 304.2 Q190 296 171 335 Q152 296 96.8 304.2 Q106 244 66 230 Q106 216 96.8 155.8 Q152 164 171 125 Q190 164 245.2 155.8 Q236 216 276 230 Z',
  'M326 230 Q270 250 280.6 339.6 Q200 328 171 385 Q142 328 61.4 339.6 Q72 250 16 230 Q72 210 61.4 120.4 Q142 132 171 75 Q200 132 280.6 120.4 Q270 210 326 230 Z',
];
const PLUS_SPOTS: [number, number][] = [
  [276, 230], [245.2, 304.2], [171, 335], [96.8, 304.2], [66, 230], [96.8, 155.8], [171, 125], [245.2, 155.8],
];
const NODE_SPOTS: [number, number, number, number][] = [
  [276, 230, 1.8, 0], [96.8, 155.8, 1.6, 700], [171, 335, 1.8, 1400], [280.6, 120.4, 1.5, 700],
  [61.4, 339.6, 1.6, 0], [16, 230, 1.4, 1400], [231, 230, 1.4, 0], [111, 230, 1.4, 700],
];

/** The prayer web: a mandala that gains rings with prayers offered, plus the four flows from the corner stats. */
export function PrayerWeb({ level }: { level: 1 | 2 | 3 | 4 }) {
  const opacity = level === 1 ? 0.2 : level === 2 ? 0.28 : 0.36;
  const width = level >= 3 ? 1.3 : 1;
  return (
    <Svg width={NOOK_W} height={NOOK_H} viewBox={`0 0 ${NOOK_W} ${NOOK_H}`} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <RadialGradient id="webglow">
          <Stop offset="0" stopColor="#F2C462" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#F2C462" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {level >= 4 && (
        <Fx kind="bigglow">
          <Circle cx={171} cy={230} r={210} fill="url(#webglow)" />
        </Fx>
      )}
      <Fx kind="shimmer">
        <G fill="none" stroke="#8FC6A9" strokeOpacity={opacity} strokeWidth={width}>
          <FadeInG>
            <Path d={WEB_SPOKES} />
          </FadeInG>
          <FadeInG delay={350}>
            <Path d={RINGS[0]} />
          </FadeInG>
          <FadeInG delay={700}>
            <Path d={RINGS[1]} />
          </FadeInG>
          <FadeInG delay={1050}>
            <Path d={RINGS[2]} />
          </FadeInG>
        </G>
      </Fx>
      {level >= 2 && (
        <G fill="#DDF3E8">
          {NODE_SPOTS.map(([x, y, r, d], i) => (
            <TwinkleDot key={i} cx={x} cy={y} r={r} delay={d} />
          ))}
        </G>
      )}
      {level >= 3 &&
        PLUS_SPOTS.map(([x, y], i) => (
          <G key={i} transform={`translate(${x} ${y})`}>
            <Fx kind="twinkle" delay={(i % 3) * 700}>
              <Path d="M-5 0 L5 0 M0 -6 L0 6" stroke="#F2C462" strokeWidth={1.6} strokeLinecap="round" />
            </Fx>
          </G>
        ))}
      <FlowPath d="M74 52 L171 230" stroke="#8FC6A9" />
      <FlowPath d="M268 52 L171 230" stroke="#8FC6A9" />
      <FlowPath d="M74 388 L171 230" stroke="#8FC6A9" />
      <FlowPath d="M268 388 L171 230" stroke="#8FC6A9" />
      <TravelDot from={[74, 52]} to={[171, 230]} fill="#F2C462" />
      {level >= 2 && (
        <>
          <TravelDot from={[268, 52]} to={[171, 230]} fill="#F2C462" delay={750} />
          <TravelDot from={[74, 388]} to={[171, 230]} fill="#F2C462" delay={1500} />
          <TravelDot from={[268, 388]} to={[171, 230]} fill="#F2C462" delay={2250} />
        </>
      )}
    </Svg>
  );
}

type ItemArtProps = {
  id: string;
  lanternBright: boolean;
  leafOn: boolean;
  hangFast: boolean;
};

/** One piece of decor, drawn at its original spot in the 342x440 nook. The caller moves it with a transform. */
export function ItemArt({ id, lanternBright, leafOn, hangFast }: ItemArtProps) {
  const swing = hangFast ? 'swingFast' : 'swing';
  switch (id) {
    case 'glass':
      return (
        <>
          <Path d="M14 440 L14 120 A157 110 0 0 1 328 120 L328 440" stroke="#C9A24B" strokeWidth={4} fill="none" opacity={0.85} />
          <Circle cx={40} cy={60} r={5} fill="#8FC6A9" />
          <Circle cx={90} cy={24} r={5} fill="#E8998A" />
          <Circle cx={171} cy={10} r={6} fill="#F2C462" />
          <Circle cx={252} cy={24} r={5} fill="#9C84E8" />
          <Circle cx={302} cy={60} r={5} fill="#8FC6A9" />
        </>
      );
    case 'cross':
      return (
        <>
          <Rect x={287} y={150} width={8} height={72} rx={2} fill="#7A5C3E" />
          <Rect x={273} y={168} width={36} height={8} rx={2} fill="#7A5C3E" />
        </>
      );
    case 'tapestry':
      return (
        <>
          <Path d="M20 128 L84 128" stroke="#8A6A45" strokeWidth={3} strokeLinecap="round" />
          <Rect x={26} y={130} width={52} height={92} rx={3} fill="#3A2A4A" />
          <Rect x={31} y={135} width={42} height={82} rx={2} fill="none" stroke="#C9A24B" strokeWidth={1.5} />
          <SvgText x={52} y={170} textAnchor="middle" fontSize={22} fill="#F2C462">Α</SvgText>
          <SvgText x={52} y={204} textAnchor="middle" fontSize={22} fill="#F2C462">Ω</SvgText>
          <Path d="M30 222 L30 230 M38 222 L38 230 M46 222 L46 230 M54 222 L54 230 M62 222 L62 230 M70 222 L70 230" stroke="#C9A24B" strokeWidth={1.5} />
        </>
      );
    case 'lamp':
      return (
        <>
          <Path d="M171 0 L171 104" stroke="#8A6A45" strokeWidth={2} strokeDasharray="3 2" />
          <Fx kind={swing} ox={171} oy={0}>
            <Fx kind="glow">
              <Circle cx={171} cy={112} r={28} fill="#F2A93B" />
            </Fx>
            <Path d="M148 110 Q171 128 194 110 L188 104 L154 104 Z" fill="#B5734A" />
            <Path d="M188 104 L198 100 L194 108 Z" fill="#B5734A" />
            <Fx kind="flicker" ox={198} oy={100}>
              <Ellipse cx={198} cy={94} rx={3.5} ry={6.5} fill="#FFE08A" />
            </Fx>
          </Fx>
        </>
      );
    case 'mobile':
      return (
        <>
          <Path d="M171 0 L171 96" stroke="#C9A24B" strokeWidth={1.5} />
          <Fx kind={swing} ox={171} oy={0}>
            <Path d="M128 96 L214 96 M136 96 L136 116 M171 96 L171 124 M206 96 L206 112" stroke="#C9A24B" strokeWidth={1.5} fill="none" />
            <TwinkleStar x={126} y={114} fill="#F2C462" />
            <TwinkleStar x={161} y={122} fill="#F7E3B5" delay={700} />
            <TwinkleStar x={196} y={110} fill="#F2C462" delay={1400} />
          </Fx>
        </>
      );
    case 'chimes':
      return (
        <>
          <Path d="M171 0 L171 92" stroke="#C9A24B" strokeWidth={1.5} />
          <Fx kind={swing} ox={171} oy={0}>
            <Ellipse cx={171} cy={94} rx={22} ry={5} fill="#C9A24B" />
            <G fill="#B5DCC6" opacity={0.9}>
              <Rect x={152} y={98} width={4} height={30} rx={2} />
              <Rect x={162} y={98} width={4} height={40} rx={2} />
              <Rect x={176} y={98} width={4} height={34} rx={2} />
              <Rect x={186} y={98} width={4} height={26} rx={2} />
            </G>
            <Circle cx={171} cy={126} r={4} fill="#C9A24B" />
          </Fx>
        </>
      );
    case 'rug':
      return (
        <>
          <Ellipse cx={171} cy={288} rx={98} ry={22} fill="#2E4B5E" />
          <Ellipse cx={171} cy={288} rx={82} ry={16} fill="none" stroke="#8FC6A9" strokeWidth={2} strokeDasharray="4 5" opacity={0.7} />
        </>
      );
    case 'cushion':
      return (
        <>
          <Rect x={104} y={270} width={134} height={34} rx={14} fill="#1E2E5A" stroke="#C9A24B" strokeWidth={2} />
          <Rect x={112} y={273} width={118} height={10} rx={5} fill="#2A3E72" />
          <G fill="#F2C462">
            <Circle cx={104} cy={272} r={4} />
            <Circle cx={238} cy={272} r={4} />
            <Circle cx={104} cy={302} r={4} />
            <Circle cx={238} cy={302} r={4} />
          </G>
        </>
      );
    case 'wreath':
      return (
        <>
          <Ellipse cx={171} cy={288} rx={96} ry={22} fill="#1E3326" />
          <G fill="#8DAA62">
            <Ellipse cx={267} cy={288} rx={9} ry={4} transform="rotate(90 267 288)" />
            <Ellipse cx={248.7} cy={300.9} rx={9} ry={4} transform="rotate(-30 248.7 300.9)" />
            <Ellipse cx={200.7} cy={308.9} rx={9} ry={4} />
            <Ellipse cx={141.3} cy={308.9} rx={9} ry={4} />
            <Ellipse cx={93.3} cy={300.9} rx={9} ry={4} transform="rotate(30 93.3 300.9)" />
            <Ellipse cx={75} cy={288} rx={9} ry={4} transform="rotate(90 75 288)" />
            <Ellipse cx={93.3} cy={275.1} rx={9} ry={4} transform="rotate(-30 93.3 275.1)" />
            <Ellipse cx={141.3} cy={267.1} rx={9} ry={4} />
            <Ellipse cx={200.7} cy={267.1} rx={9} ry={4} />
            <Ellipse cx={248.7} cy={275.1} rx={9} ry={4} transform="rotate(30 248.7 275.1)" />
          </G>
          <G fill="#FFFBF2">
            <Circle cx={171} cy={310} r={4} />
            <Circle cx={120} cy={306} r={3.5} />
            <Circle cx={222} cy={306} r={3.5} />
            <Circle cx={84} cy={281} r={3} />
            <Circle cx={258} cy={281} r={3} />
            <Circle cx={171} cy={266} r={3.5} />
          </G>
        </>
      );
    case 'lantern':
      return (
        <>
          <Fx kind={lanternBright ? 'glowb' : 'glow'}>
            <Circle cx={70} cy={310} r={lanternBright ? 44 : 30} fill="#F2C462" />
          </Fx>
          <Path d="M62 286 Q70 272 78 286" stroke="#C9A24B" strokeWidth={2} fill="none" />
          <Polygon points="58,294 70,284 82,294" fill="#C9A24B" />
          <Rect x={60} y={294} width={20} height={34} rx={4} fill="#2A2236" stroke="#C9A24B" strokeWidth={2} />
          <Fx kind="flicker" ox={70} oy={318}>
            <Ellipse cx={70} cy={311} rx={4} ry={7} fill="#FFE08A" />
          </Fx>
          <Rect x={56} y={328} width={28} height={6} rx={2} fill="#C9A24B" />
        </>
      );
    case 'censer':
      return (
        <>
          <Fx kind="smoke"><Path d="M70 290 C62 272 78 258 70 240" stroke="#E6E9EE" strokeWidth={3} fill="none" strokeLinecap="round" /></Fx>
          <Fx kind="smoke" delay={1100}><Path d="M72 290 C80 274 64 260 72 242" stroke="#E6E9EE" strokeWidth={3} fill="none" strokeLinecap="round" /></Fx>
          <Fx kind="smoke" delay={2200}><Path d="M69 290 C60 276 76 264 68 248" stroke="#E6E9EE" strokeWidth={2.5} fill="none" strokeLinecap="round" /></Fx>
          <Rect x={66} y={318} width={8} height={22} fill="#8A6A45" />
          <Ellipse cx={70} cy={341} rx={14} ry={3.5} fill="#8A6A45" />
          <Path d="M54 306 Q70 328 86 306 Z" fill="#B9BFC9" />
          <Path d="M56 306 Q70 288 84 306 Z" fill="#D6DBE2" />
          <Circle cx={70} cy={292} r={3} fill="#C9A24B" />
        </>
      );
    case 'plant':
      return (
        <>
          <Fx kind="sway" ox={287} oy={296}>
            <Ellipse cx={287} cy={282} rx={5} ry={15} fill="#8DAA62" />
            <Ellipse cx={276} cy={290} rx={5} ry={13} fill="#6E8B4E" transform="rotate(-45 276 290)" />
            <Ellipse cx={298} cy={290} rx={5} ry={13} fill="#6E8B4E" transform="rotate(45 298 290)" />
            <Ellipse cx={281} cy={272} rx={4} ry={10} fill="#6E8B4E" transform="rotate(-20 281 272)" />
          </Fx>
          <Rect x={269} y={306} width={36} height={8} rx={3} fill="#C98760" />
          <Polygon points="272,314 302,314 298,342 276,342" fill="#B5734A" />
          {leafOn && <FallingLeaf />}
        </>
      );
    case 'scripture':
      return (
        <>
          <Fx kind="glow">
            <Circle cx={285} cy={282} r={24} fill="#F2C462" />
          </Fx>
          <Path d="M272 342 L285 300 L298 342" stroke="#8A6A45" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M264 298 L285 292 L285 270 L264 276 Z" fill="#F3EBDD" />
          <Path d="M306 298 L285 292 L285 270 L306 276 Z" fill="#FFF8EC" />
          <Path d="M268 282 L281 278 M268 287 L281 283 M289 278 L302 282 M289 283 L302 287" stroke="#C9B89A" strokeWidth={1.2} />
        </>
      );
    default:
      return null;
  }
}

type EffectsProps = { warmLight: boolean; easterSet: boolean; sanctuarySet: boolean };

/** Whole-nook effects that are not tied to one piece: warm light motes, drifting petals, set-bonus sparks. */
export function NookEffects({ warmLight, easterSet, sanctuarySet }: EffectsProps) {
  return (
    <Svg width={NOOK_W} height={NOOK_H} viewBox={`0 0 ${NOOK_W} ${NOOK_H}`} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {warmLight && (
        <G fill="#FFE08A">
          <Fx kind="mote"><Circle cx={132} cy={214} r={2} /></Fx>
          <Fx kind="mote" delay={1300}><Circle cx={212} cy={222} r={1.8} /></Fx>
          <Fx kind="mote" delay={2600}><Circle cx={178} cy={182} r={1.6} /></Fx>
        </G>
      )}
      {easterSet && (
        <G fill="#FFFBF2">
          <Fx kind="petal"><Ellipse cx={-10} cy={120} rx={5} ry={3} /></Fx>
          <Fx kind="petal" delay={3000}><Ellipse cx={-10} cy={200} rx={5} ry={3} /></Fx>
          <Fx kind="petal" delay={6000}><Ellipse cx={-10} cy={160} rx={4} ry={2.5} /></Fx>
        </G>
      )}
      {sanctuarySet && (
        <G fill="#F2C462">
          <Fx kind="spark"><Circle cx={10} cy={420} r={2} /></Fx>
          <Fx kind="spark" delay={1000}><Circle cx={332} cy={400} r={2} /></Fx>
          <Fx kind="spark" delay={2000}><Circle cx={12} cy={300} r={1.8} /></Fx>
          <Fx kind="spark" delay={1000}><Circle cx={330} cy={260} r={1.8} /></Fx>
          <Fx kind="spark"><Circle cx={331} cy={180} r={1.6} /></Fx>
          <Fx kind="spark" delay={2000}><Circle cx={11} cy={160} r={1.6} /></Fx>
        </G>
      )}
    </Svg>
  );
}

/** A full-size drawing layer for one piece, so each piece can be moved on its own. */
export function ItemLayer({ children }: { children: React.ReactNode }) {
  return (
    <Svg width={NOOK_W} height={NOOK_H} viewBox={`0 0 ${NOOK_W} ${NOOK_H}`} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {children}
    </Svg>
  );
}

/** The leaf that drops from the fig plant when tapped: one-shot fall, spin and fade. */
function FallingLeaf() {
  return (
    <FallOnce>
      <Ellipse cx={296} cy={286} rx={4} ry={8} fill="#8DAA62" />
    </FallOnce>
  );
}

const AnimG = Animated.createAnimatedComponent(G);

function FallOnce({ children }: { children: React.ReactNode }) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withTiming(1, { duration: 1600, easing: Easing.in(Easing.quad) });
  }, [t]);
  const animatedProps = useAnimatedProps(() => ({
    translateX: 16 * t.value,
    translateY: 60 * t.value,
    rotation: 170 * t.value,
    opacity: 1 - t.value,
  }));
  return (
    <AnimG animatedProps={animatedProps} originX={296} originY={286}>
      {children}
    </AnimG>
  );
}
