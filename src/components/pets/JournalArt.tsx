import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';
import { usePetProgress } from '@/lib/pet';

import { keyframe, useLoop, useMotionEnabled } from './anim';
import { Fx, SoftGlow, TwinkleDot } from './Fx';
import { LyingPet, lyingFeetOffset } from './LyingPets';
import { lightingForHour } from './nookData';

// Art for the journal (biography) page: a little study where your companion keeps you company while you write,
// your companion asleep on a closed journal when there are no entries yet, and a vine flourish for the footer.

const APath = Animated.createAnimatedComponent(Path);

const W = 346;
const H = 170;
const DESK_Y = 132;

const BOOK_COLORS = ['#7A4D22', '#2F4B7A', '#6E8B4E', '#8A3A2E', '#5A4A7A', '#C9A24B'];
const BOOK_SIZES = [
  { w: 10, h: 28 },
  { w: 8, h: 24 },
  { w: 11, h: 30 },
  { w: 9, h: 26 },
  { w: 10, h: 22 },
  { w: 12, h: 29 },
];

/** The line the quill is writing, drawing itself in and starting over. */
function WritingLine() {
  const enabled = useMotionEnabled(true);
  const p = useLoop(3500, 0, enabled, 0.9);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: keyframe(p.get(), [0, 0.9, 1], [40, 4, 40]),
    opacity: keyframe(p.get(), [0, 0.05, 0.9, 1], [0, 1, 1, 0]),
  }));
  return (
    <APath
      d="M180 110 Q190 108 200 110 T220 110"
      stroke="#3A2E28"
      strokeWidth={1.4}
      strokeLinecap="round"
      fill="none"
      strokeDasharray="44 44"
      animatedProps={animatedProps}
    />
  );
}

function Window({ night }: { night: boolean }) {
  return (
    <>
      <Path d="M18 86 V40 Q18 12 50 12 Q82 12 82 40 V86 Z" fill="#3A2414" />
      <Path d="M24 82 V41 Q24 18 50 18 Q76 18 76 41 V82 Z" fill={night ? '#1B2448' : '#8FB4DE'} />
      {night ? (
        <>
          <Circle cx={62} cy={34} r={7} fill="#F4E3B5" />
          <Circle cx={65} cy={32} r={6} fill="#1B2448" />
          <G fill="#F2E9D8">
            <TwinkleDot cx={34} cy={36} r={1.2} />
            <TwinkleDot cx={46} cy={28} r={1} delay={700} />
            <TwinkleDot cx={40} cy={56} r={1.1} delay={1400} />
          </G>
        </>
      ) : (
        <>
          <SoftGlow cx={58} cy={34} r={16} color="#FFF3C4" />
          <Circle cx={58} cy={34} r={7} fill="#FFE9A8" />
          <Fx kind="driftA">
            <Path d="M30 52 q4 -6 10 -2 q6 -4 10 2 z" fill="#FFFFFF" opacity={0.85} />
          </Fx>
        </>
      )}
      <Path d="M50 18 V82 M24 52 H76" stroke="#3A2414" strokeWidth={3} />
      <Rect x={14} y={84} width={72} height={6} rx={2} fill="#8A6440" />
    </>
  );
}

function Shelf({ books }: { books: number }) {
  let x = 258;
  return (
    <>
      <Rect x={250} y={70} width={88} height={5} rx={2} fill="#8A6440" />
      <Path d="M258 75 L262 84 M330 75 L326 84" stroke="#6B4A2A" strokeWidth={3} strokeLinecap="round" />
      {Array.from({ length: books }).map((_, i) => {
        const b = BOOK_SIZES[i % BOOK_SIZES.length];
        const el = (
          <G key={i}>
            <Rect x={x} y={70 - b.h} width={b.w} height={b.h} rx={1.5} fill={BOOK_COLORS[i % BOOK_COLORS.length]} />
            <Rect x={x + 1.5} y={70 - b.h + 4} width={b.w - 3} height={2} fill="#F2E9D8" opacity={0.5} />
          </G>
        );
        x += b.w + 1.5;
        return el;
      })}
      <Fx kind="leafSway" ox={326} oy={60}>
        <Path d="M326 60 C318 52 316 44 320 38 C326 44 328 52 326 60 Z" fill="#6E8B4E" />
        <Path d="M326 60 C330 50 336 46 342 46 C340 54 334 58 326 60 Z" fill="#8DAA62" />
      </Fx>
      <Path d="M318 60 h16 l-2 10 h-12 z" fill="#B5734A" />
    </>
  );
}

function Book({ accent }: { accent: string }) {
  return (
    <>
      <Path d="M94 132 Q133 124 172 130 Q211 124 250 132 L250 90 Q211 82 172 88 Q133 82 94 90 Z" fill={accent} />
      <Path d="M100 128 Q138 120 172 126 L172 88 Q138 82 100 90 Z" fill="#F7F0E2" />
      <Path d="M172 126 Q206 120 244 128 L244 90 Q206 82 172 88 Z" fill="#FBF5E8" />
      <Path d="M172 88 V126" stroke="#E0D3BA" strokeWidth={1.4} />
      <Path
        d="M108 98 Q136 93 164 96 M108 104 Q136 99 164 102 M108 110 Q136 105 164 108 M108 116 Q136 111 160 114 M180 98 Q208 95 236 99 M180 104 Q208 101 232 105"
        stroke="#C9BBA0"
        strokeWidth={1.3}
        fill="none"
        strokeLinecap="round"
      />
      {/* a little cross drawn in the margin */}
      <Path d="M114 120 V126 M111 122.5 H117" stroke="#C9A24B" strokeWidth={1.2} strokeLinecap="round" />
      <WritingLine />
      {/* the next page turning over */}
      <Fx kind="pageTurn" ox={172} oy={106}>
        <Path d="M172 126 Q206 120 244 128 L244 90 Q206 82 172 88 Z" fill="#FFF9EE" stroke="#E6DCC8" strokeWidth={0.8} />
      </Fx>
      {/* ribbon bookmark */}
      <Fx kind="sway4" ox={172} oy={128}>
        <Path d="M169 128 L169 150 L172 146 L175 150 L175 128 Z" fill="#C9433A" />
      </Fx>
      {/* the quill, writing */}
      <G transform="translate(180 110)">
        <Fx kind="quill">
          <Path d="M0 0 L3 -3 C10 -18 24 -36 42 -46 C36 -28 22 -12 5 -1 Z" fill="#F2E9D8" />
          <Path d="M2 -2 C14 -16 26 -30 40 -44" stroke="#C9BBA0" strokeWidth={1} fill="none" />
          <Path d="M0 0 L3 -3" stroke="#2B2420" strokeWidth={1.6} strokeLinecap="round" />
        </Fx>
      </G>
    </>
  );
}

/**
 * The study at the top of the journal page. The window follows the time of day, a book appears on the shelf for
 * every five entries, and your companion lies on the desk keeping you company (and nods off late at night).
 */
export function JournalDesk({ width, accent, entryCount }: { width: number; accent: string; entryCount: number }) {
  const { petId, progress } = usePetProgress();
  const k = width / W;
  const height = H * k;
  const hour = new Date().getHours();
  const night = lightingForHour(hour) === 'night';
  const sleepy = hour >= 23 || hour < 5;
  const books = Math.min(6, 1 + Math.floor(entryCount / 5));
  const petW = 96 * k;
  return (
    <View
      accessible
      accessibilityLabel="A cozy study with an open journal, a quill writing, a candle, and your companion resting on the desk"
      style={{ width, height, borderRadius: 24, overflow: 'hidden' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="studywall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={night ? '#221B33' : '#3A2E4A'} />
            <Stop offset="1" stopColor={night ? '#2E2440' : '#4A3A56'} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#studywall)" />
        <Window night={night} />
        <Shelf books={books} />
        {/* petals drifting in the air */}
        <Fx kind="petalDrift" delay={0}><Ellipse cx={96} cy={22} rx={3} ry={1.6} fill="#F2A9A0" /></Fx>
        <Fx kind="petalDrift" delay={4000}><Ellipse cx={140} cy={10} rx={2.6} ry={1.4} fill="#F7DFA0" /></Fx>
        {/* desk */}
        <Rect x={0} y={DESK_Y} width={W} height={H - DESK_Y} fill="#6B4A2A" />
        <Rect x={0} y={DESK_Y} width={W} height={5} fill="#8A6440" />
        <Path d="M0 150 H346 M0 162 H346" stroke="#5A3A24" strokeWidth={1.2} />
        {/* candle */}
        <SoftGlow cx={40} cy={96} r={44} color="#F2A93B" />
        <Ellipse cx={40} cy={131} rx={16} ry={4} fill="#C9A24B" />
        <Rect x={34} y={104} width={12} height={27} rx={2} fill="#F3EBDD" />
        <Path d="M34 108 q3 6 5 0" fill="#FFF8EC" />
        <Fx kind="candle">
          <Path d="M40 90 C46 97 46 102 40 105 C34 102 34 97 40 90 Z" fill="#F2A93B" />
          <Path d="M40 96 C43 99 43 102 40 104 C37 102 37 99 40 96 Z" fill="#FFE08A" />
        </Fx>
        {/* ink pot */}
        <Path d="M64 132 Q60 120 66 116 H82 Q88 120 84 132 Z" fill="#4A4070" stroke="#7C72A8" strokeWidth={1} />
        <Rect x={68} y={110} width={12} height={7} rx={2} fill="#5A5084" />
        <Path d="M68 122 Q70 118 74 118" stroke="#8A83A8" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Book accent={accent} />
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: 298 * k - petW / 2, top: DESK_Y * k - lyingFeetOffset(petW) + 2 }}>
        <LyingPet id={petId} stage={progress.stage} size={petW} eyes={sleepy ? 'sleep' : 'open'} />
      </View>
    </View>
  );
}

/** Your companion asleep on a closed journal, for an empty journal. */
export function JournalEmptyArt({ width = 220, accent }: { width?: number; accent: string }) {
  const { petId, progress } = usePetProgress();
  const k = width / 220;
  const petW = 120 * k;
  return (
    <View style={{ width, height: 110 * k }}>
      <Svg width={width} height={110 * k} viewBox="0 0 220 110">
        <Ellipse cx={110} cy={104} rx={86} ry={5} fill="#000" opacity={0.18} />
        <Rect x={40} y={78} width={140} height={24} rx={5} fill={accent} />
        <Rect x={46} y={80} width={130} height={6} rx={2} fill="#FBF5E8" />
        <Rect x={46} y={88} width={130} height={4} rx={2} fill="#F0E6D0" />
        <Path d="M104 90 V100 M99 94.5 H109" stroke="#FBF5E8" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        <Fx kind="sway4" ox={160} oy={100}>
          <Path d="M157 100 L157 110 L160 107 L163 110 L163 100 Z" fill="#C9433A" />
        </Fx>
        <Path d="M186 100 L189 97 C194 86 202 74 214 68 C210 80 200 92 191 99 Z" fill="#F2E9D8" opacity={0.9} />
        <Fx kind="zH" delay={0}><SvgText x={56} y={34} fontSize={11} fontStyle="italic" fill="#B5DCC6" fontFamily={FONTS.displayItalic}>z</SvgText></Fx>
        <Fx kind="zH" delay={1200}><SvgText x={60} y={30} fontSize={14} fontStyle="italic" fill="#B5DCC6" fontFamily={FONTS.displayItalic}>z</SvgText></Fx>
        <Fx kind="zH" delay={2400}><SvgText x={64} y={26} fontSize={17} fontStyle="italic" fill="#B5DCC6" fontFamily={FONTS.displayItalic}>z</SvgText></Fx>
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: 110 * k - petW / 2, top: 80 * k - lyingFeetOffset(petW) }}>
        <LyingPet id={petId} stage={progress.stage} size={petW} eyes="sleep" />
      </View>
    </View>
  );
}

/** A vine flourish with a small cross, to end the page. */
export function JournalFlourish({ color }: { color: string }) {
  return (
    <Svg width={180} height={34} viewBox="0 0 180 34" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M8 18 C30 4 50 30 74 17 M172 18 C150 4 130 30 106 17" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.7} />
      <G fill={color} opacity={0.7}>
        <Ellipse cx={28} cy={12} rx={5} ry={2.2} rotation={-30} originX={28} originY={12} />
        <Ellipse cx={52} cy={22} rx={5} ry={2.2} rotation={25} originX={52} originY={22} />
        <Ellipse cx={152} cy={12} rx={5} ry={2.2} rotation={30} originX={152} originY={12} />
        <Ellipse cx={128} cy={22} rx={5} ry={2.2} rotation={-25} originX={128} originY={22} />
        <Circle cx={8} cy={18} r={1.8} />
        <Circle cx={172} cy={18} r={1.8} />
      </G>
      <Fx kind="twinkleSoft">
        <Path d="M90 6 V28 M82 14 H98" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Fx>
    </Svg>
  );
}
