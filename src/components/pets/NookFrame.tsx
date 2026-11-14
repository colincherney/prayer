import React from 'react';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { Fx } from './Fx';

export type FrameKind = 'clouds' | 'wreath';

type Geometry = {
  /** Size of the whole band the nook sits in. */
  width: number;
  height: number;
  /** Size of the nook inside it (it is centered). */
  nookW: number;
  nookH: number;
};

/** A soft cloud centered on (0, 0): a flat base with three puffs. */
function Cloud({ tone }: { tone: 'back' | 'front' }) {
  const body = tone === 'back' ? '#DCE6F2' : '#EEF3FA';
  const shade = tone === 'back' ? '#C5D2E4' : '#D6E0EE';
  return (
    <>
      <Ellipse cx={0} cy={11} rx={38} ry={11} fill={shade} />
      <Circle cx={-18} cy={3} r={13} fill={body} />
      <Circle cx={2} cy={-7} r={18} fill={body} />
      <Circle cx={22} cy={2} r={12} fill={body} />
      <Ellipse cx={0} cy={9} rx={36} ry={9} fill={body} />
    </>
  );
}

type CloudSpec = { x: number; y: number; s: number; o: number; delay: number; slow: 'driftA' | 'driftB' };

function Clouds({ list, tone }: { list: CloudSpec[]; tone: 'back' | 'front' }) {
  return (
    <>
      {list.map((c, i) => (
        <Fx key={i} kind={c.slow} delay={c.delay}>
          <G opacity={c.o} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <Cloud tone={tone} />
          </G>
        </Fx>
      ))}
    </>
  );
}

/** Points along a rounded rectangle, each with the direction of travel, evenly spaced by `step`. */
function perimeter(x: number, y: number, w: number, h: number, r: number, step: number) {
  const pts: { x: number; y: number; a: number }[] = [];
  const straightW = w - 2 * r;
  const straightH = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const total = 2 * straightW + 2 * straightH + 4 * arc;
  const n = Math.max(8, Math.round(total / step));
  for (let i = 0; i < n; i++) {
    let d = (i / n) * total;
    let px = 0;
    let py = 0;
    let a = 0;
    if (d < straightW) {
      px = x + r + d;
      py = y;
      a = 0;
    } else if ((d -= straightW) < arc) {
      const t = d / r;
      px = x + w - r + r * Math.sin(t);
      py = y + r - r * Math.cos(t);
      a = (t * 180) / Math.PI;
    } else if ((d -= arc) < straightH) {
      px = x + w;
      py = y + r + d;
      a = 90;
    } else if ((d -= straightH) < arc) {
      const t = d / r;
      px = x + w - r + r * Math.cos(t);
      py = y + h - r + r * Math.sin(t);
      a = 90 + (t * 180) / Math.PI;
    } else if ((d -= arc) < straightW) {
      px = x + w - r - d;
      py = y + h;
      a = 180;
    } else if ((d -= straightW) < arc) {
      const t = d / r;
      px = x + r - r * Math.sin(t);
      py = y + h - r + r * Math.cos(t);
      a = 180 + (t * 180) / Math.PI;
    } else if ((d -= arc) < straightH) {
      px = x;
      py = y + h - r - d;
      a = 270;
    } else {
      d -= straightH;
      const t = d / r;
      px = x + r - r * Math.cos(t);
      py = y + r - r * Math.sin(t);
      a = 270 + (t * 180) / Math.PI;
    }
    pts.push({ x: px, y: py, a });
  }
  return pts;
}

/** A ring of leaves, lilies and berries hugging the edge of the nook. */
function Wreath({ g }: { g: Geometry }) {
  const x = (g.width - g.nookW) / 2 - 2;
  const y = (g.height - g.nookH) / 2 - 2;
  const pts = perimeter(x, y, g.nookW + 4, g.nookH + 4, 18, 15);
  return (
    <>
      {pts.map((p, i) => {
        const outward = i % 2 === 0 ? -1 : 1;
        // Leaves lie along the edge and alternate slightly in and out so the ring looks full.
        const rot = p.a + outward * 28;
        return (
          <Ellipse
            key={`l${i}`}
            cx={p.x}
            cy={p.y}
            rx={11}
            ry={4.6}
            fill={i % 3 === 0 ? '#6E8B4E' : '#8DAA62'}
            transform={`rotate(${rot} ${p.x} ${p.y})`}
          />
        );
      })}
      {pts.map((p, i) =>
        i % 5 === 2 ? (
          <G key={`f${i}`}>
            <Circle cx={p.x} cy={p.y} r={6} fill="#FFFBF2" />
            <Circle cx={p.x} cy={p.y} r={2.2} fill="#F2C462" />
          </G>
        ) : i % 5 === 4 ? (
          <Circle key={`b${i}`} cx={p.x} cy={p.y} r={3} fill="#E8998A" />
        ) : null,
      )}
    </>
  );
}

/** Soft clouds drifting behind the nook, in the space either side of it. */
function cloudsBack(g: Geometry): CloudSpec[] {
  const sideW = (g.width - g.nookW) / 2;
  const cx = sideW / 2;
  return [
    { x: cx, y: g.height * 0.2, s: 0.9, o: 0.5, delay: 0, slow: 'driftA' },
    { x: g.width - cx, y: g.height * 0.34, s: 1, o: 0.55, delay: 2200, slow: 'driftB' },
    { x: cx, y: g.height * 0.58, s: 1.1, o: 0.5, delay: 4200, slow: 'driftB' },
    { x: g.width - cx, y: g.height * 0.8, s: 0.85, o: 0.45, delay: 1200, slow: 'driftA' },
  ];
}

/** Clouds overlapping the nook's corners so its hard edges melt into the sky. */
function cloudsFront(g: Geometry): CloudSpec[] {
  const left = (g.width - g.nookW) / 2;
  const right = left + g.nookW;
  const top = (g.height - g.nookH) / 2;
  const bottom = top + g.nookH;
  return [
    { x: left + 6, y: top + 10, s: 1.1, o: 0.95, delay: 600, slow: 'driftA' },
    { x: right - 6, y: top + 24, s: 0.95, o: 0.95, delay: 3000, slow: 'driftB' },
    { x: left + 18, y: bottom - 6, s: 1.2, o: 0.97, delay: 1800, slow: 'driftB' },
    { x: right - 20, y: bottom - 2, s: 1.05, o: 0.97, delay: 3800, slow: 'driftA' },
  ];
}

/** Decoration drawn behind the nook (clouds only). */
export function NookFrameBack({ kind, ...g }: Geometry & { kind: FrameKind }) {
  if (kind !== 'clouds') return null;
  return (
    <Svg width={g.width} height={g.height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Clouds list={cloudsBack(g)} tone="back" />
    </Svg>
  );
}

/** Decoration drawn over the nook's edge: clouds across its corners, or a wreath around it. */
export function NookFrameFront({ kind, ...g }: Geometry & { kind: FrameKind }) {
  return (
    <Svg width={g.width} height={g.height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {kind === 'clouds' ? <Clouds list={cloudsFront(g)} tone="front" /> : <Wreath g={g} />}
    </Svg>
  );
}
