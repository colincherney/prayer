import React, { useContext } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { Circle, Ellipse, G, Path, Polyline } from 'react-native-svg';

import { useLoop, useMotionEnabled } from './anim';
import { Fx, PetMotion } from './Fx';
import { PipStage } from './PipLamb';

// Extra idle animations from design ANIMATIONS.md. Every shape is in the pets' shared 240x260 artboard space.

/** A music note whose stem foot is at (x, y); it floats up and fades, 4s loop. */
function FloatingNote({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <Fx kind="noteFloat">
      <Path
        d={`M${x} ${y} L${x} ${y - 16} L${x + 10} ${y - 19} L${x + 10} ${y - 3}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={x - 3} cy={y} r={3.5} fill={color} />
      <Circle cx={x + 7} cy={y - 3} r={3.5} fill={color} />
    </Fx>
  );
}

function Feather({
  d,
  cx,
  cy,
  fill,
  stroke,
  strokeWidth,
  kind,
  delay,
}: {
  d: string;
  cx: number;
  cy: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  kind: 'featherLamb' | 'featherDove';
  delay?: number;
}) {
  return (
    <Fx kind={kind} delay={delay} ox={cx} oy={cy}>
      <Path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </Fx>
  );
}

/** Pip: grass and a daisy; bell jingle and a note; halo glint and drifting feathers. */
export function LambExtras({ stage }: { stage: PipStage }) {
  if (stage === 1) {
    return (
      <>
        <Fx kind="grass" ox={67.5} oy={244}>
          <Path
            d="M58 244 L62 228 L66 244 M66 244 L72 224 L77 244"
            stroke="#6E8B4E"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Fx>
        <Fx kind="grass" delay={1000} ox={173} oy={244}>
          <Path
            d="M164 244 L169 226 L173 244 M173 244 L178 230 L182 244"
            stroke="#6E8B4E"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Fx>
        <Fx kind="grass" delay={1000} ox={190} oy={244}>
          <Path d="M190 244 L190 228" stroke="#6E8B4E" strokeWidth={2} />
          <Circle cx={190} cy={226} r={4.5} fill="#F7E3B5" />
          <Circle cx={190} cy={226} r={1.8} fill="#F2C462" />
        </Fx>
      </>
    );
  }
  if (stage === 2) {
    return (
      <>
        <Fx kind="jingle">
          <Path
            d="M108 168 L102 164 M108 176 L101 178 M132 168 L138 164 M132 176 L139 178"
            stroke="#F2C462"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Fx>
        <FloatingNote x={152} y={150} color="#8FC6A9" />
      </>
    );
  }
  return (
    <>
      <Fx kind="haloFloat">
        <Gleam />
      </Fx>
      <Feather
        d="M40 120 Q46 108 52 120 Q46 132 40 120 Z"
        cx={46}
        cy={120}
        fill="#FFF6DE"
        stroke="#F2C462"
        strokeWidth={1}
        kind="featherLamb"
      />
      <Feather
        d="M196 110 Q202 98 208 110 Q202 122 196 110 Z"
        cx={202}
        cy={110}
        fill="#FFF6DE"
        stroke="#F2C462"
        strokeWidth={1}
        kind="featherLamb"
        delay={3000}
      />
    </>
  );
}

/** A short bright dash that runs around the halo ellipse (the "gleam"), 2.6s linear. */
function Gleam() {
  // Perimeter of the 22x6 halo ellipse (Ramanujan), so the dash is 14% of the loop.
  const a = 22;
  const b = 6;
  const perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  return <GleamEllipse perimeter={perimeter} />;
}

const AEllipse = Animated.createAnimatedComponent(Ellipse);

function GleamEllipse({ perimeter }: { perimeter: number }) {
  const allowed = useContext(PetMotion);
  const enabled = useMotionEnabled(allowed);
  const p = useLoop(2600, 0, enabled, 0.1);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: perimeter * (1 - p.value) }));
  return (
    <AEllipse
      cx={120}
      cy={100}
      rx={22}
      ry={6}
      fill="none"
      stroke="#FFF8E0"
      strokeWidth={2.5}
      strokeDasharray={`${perimeter * 0.14} ${perimeter * 0.86}`}
      animatedProps={animatedProps}
    />
  );
}

/** Olive: a peep note and a falling leaf; leaves and a feather; a gold light trail and a feather. */
export function DoveExtras({ stage }: { stage: PipStage }) {
  if (stage === 1) {
    return (
      <>
        <FloatingNote x={162} y={150} color="#B5DCC6" />
        <Fx kind="leafFall" ox={74} oy={150}>
          <Ellipse cx={74} cy={150} rx={6} ry={3} fill="#8DAA62" />
        </Fx>
      </>
    );
  }
  if (stage === 2) {
    return (
      <>
        <Fx kind="leafFall" ox={200} oy={184}>
          <Ellipse cx={200} cy={184} rx={7} ry={3.5} fill="#8DAA62" />
        </Fx>
        <Feather
          d="M70 150 Q76 138 82 150 Q76 162 70 150 Z"
          cx={76}
          cy={150}
          fill="#F7F5F0"
          stroke="#E4DFD5"
          strokeWidth={1}
          kind="featherDove"
        />
      </>
    );
  }
  return (
    <>
      <G fill="#F2C462">
        <Fx kind="trail">
          <Circle cx={78} cy={146} r={2.5} />
        </Fx>
        <Fx kind="trail" delay={700}>
          <Circle cx={70} cy={134} r={2} />
        </Fx>
        <Fx kind="trail" delay={1400}>
          <Circle cx={84} cy={158} r={2} />
        </Fx>
      </G>
      <Feather
        d="M60 170 Q66 158 72 170 Q66 182 60 170 Z"
        cx={66}
        cy={170}
        fill="#FFFFFF"
        stroke="#E4DFD5"
        strokeWidth={1}
        kind="featherDove"
        delay={3000}
      />
    </>
  );
}

/** Judah: a butterfly; a yawn and dust motes; a crown flash and wind wisps. */
export function LionExtras({ stage }: { stage: PipStage }) {
  if (stage === 1) {
    return (
      <Fx kind="flutter">
        <Fx kind="wingBeat" ox={53} oy={118}>
          <Ellipse cx={46} cy={118} rx={7} ry={9} fill="#B5DCC6" />
          <Ellipse cx={60} cy={118} rx={7} ry={9} fill="#9C84E8" />
        </Fx>
        <Path d="M53 110 L53 126" stroke="#2B2420" strokeWidth={2} strokeLinecap="round" />
      </Fx>
    );
  }
  if (stage === 2) {
    return (
      <>
        <Fx kind="yawn" ox={120} oy={157}>
          <Ellipse cx={120} cy={166} rx={7} ry={9} fill="#6B3F2A" />
        </Fx>
        <G fill="#F7E3B5">
          <Fx kind="moteLion">
            <Circle cx={54} cy={150} r={2} />
          </Fx>
          <Fx kind="moteLion" delay={1300}>
            <Circle cx={190} cy={140} r={1.8} />
          </Fx>
          <Fx kind="moteLion" delay={2600}>
            <Circle cx={176} cy={200} r={1.6} />
          </Fx>
        </G>
      </>
    );
  }
  return (
    <>
      <G transform="translate(120 93)">
        <Fx kind="flash">
          <Path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#FFFFFF" />
        </Fx>
      </G>
      <G stroke="#F7E3B5" strokeWidth={2} fill="none" strokeLinecap="round">
        <Fx kind="wind">
          <Path d="M6 120 Q24 114 40 120" />
        </Fx>
        <Fx kind="wind" delay={1300}>
          <Path d="M192 92 Q208 86 222 92" />
        </Fx>
        <Fx kind="wind" delay={2600}>
          <Path d="M12 172 Q30 166 46 172" />
        </Fx>
      </G>
    </>
  );
}

/** Ember: popping embers; a wax drip and smoke wisp; slow rays are drawn behind the flame by the caller. */
export function EmberExtras({ stage }: { stage: PipStage }) {
  if (stage === 1) {
    return (
      <G fill="#FFE08A">
        <Fx kind="emberPop">
          <Circle cx={116} cy={124} r={2} />
        </Fx>
        <Fx kind="emberPop" delay={900}>
          <Circle cx={124} cy={128} r={1.6} />
        </Fx>
        <Fx kind="emberPop" delay={1800}>
          <Circle cx={120} cy={120} r={1.8} />
        </Fx>
      </G>
    );
  }
  if (stage === 2) {
    return (
      <>
        <Fx kind="drip">
          <Ellipse cx={99} cy={196} rx={3} ry={5} fill="#FFF8EC" />
        </Fx>
        <Fx kind="smokeE">
          <Path d="M120 74 C114 64 126 56 120 44" stroke="#C9CED6" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </Fx>
      </>
    );
  }
  return null;
}

/** Eight slow-turning light rays behind the Vigil Flame. */
export function EmberRays() {
  return (
    <Fx kind="spin30" ox={120} oy={70}>
      <Path
        d="M176 70 L210 70 M159.6 109.6 L183.6 133.6 M120 126 L120 160 M80.4 109.6 L56.4 133.6 M64 70 L30 70 M80.4 30.4 L56.4 6.4 M120 14 L120 -20 M159.6 30.4 L183.6 6.4"
        stroke="#F2C462"
        strokeOpacity={0.16}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </Fx>
  );
}

function Bubbles({ items }: { items: [number, number, number][] }) {
  return (
    <G fill="none" stroke="#86E6D9" strokeWidth={1.5}>
      {items.map(([x, y, r], i) => (
        <Fx key={i} kind="rise" delay={i * 1300}>
          <Circle cx={x} cy={y} r={r} />
        </Fx>
      ))}
    </G>
  );
}

function Ripples({ rx, second }: { rx: number; second: string }) {
  return (
    <>
      <Fx kind="ripple" ox={120} oy={240}>
        <Ellipse cx={120} cy={240} rx={rx} ry={10} fill="none" stroke="#86E6D9" strokeWidth={1.5} />
      </Fx>
      <Fx kind="ripple" delay={1500} ox={120} oy={240}>
        <Ellipse cx={120} cy={240} rx={rx} ry={10} fill="none" stroke={second} strokeWidth={1.5} />
      </Fx>
    </>
  );
}

/** Selah: a glowing egg crack and bubbles; ripples and bubbles; gold ripples, bubbles and a horn star. */
export function DragonExtras({ stage }: { stage: PipStage }) {
  if (stage === 1) {
    return (
      <>
        <Fx kind="crack">
          <Polyline
            points="58,166 80,154 100,170 120,154 140,170 160,154 182,166"
            fill="none"
            stroke="#FFF3C4"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </Fx>
        <Bubbles items={[[40, 220, 4], [200, 214, 3], [190, 230, 2.5]]} />
      </>
    );
  }
  if (stage === 2) {
    return (
      <>
        <Ripples rx={80} second="#86E6D9" />
        <Bubbles items={[[30, 220, 4], [214, 200, 3], [56, 190, 2.5]]} />
      </>
    );
  }
  return (
    <>
      <Ripples rx={86} second="#F2C462" />
      <Bubbles items={[[24, 210, 4], [222, 190, 3], [40, 170, 2.5]]} />
      <G transform="translate(124 0)">
        <Fx kind="twinkle" ox={6} oy={6}>
          <Path d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z" fill="#FFF3C4" />
        </Fx>
      </G>
    </>
  );
}
