import React from 'react';
import { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

import { Fx } from './Fx';
import type { PetId } from './registry';

// The seasonal and monthly companions (Gobbles, Noel and the twelve monthly ones) don't have hand-drawn poses for
// every scene the way the first six pets do. Each has a "look" instead: its palette and the shape of its ears,
// snout and tail. The lying-down pose, pilgrim costume, paws and dangling tail are drawn from it.

export type Ears = 'round' | 'long' | 'pointy' | 'horns' | 'curly' | 'floppy' | 'comb' | 'dragon' | 'none';
export type Snout = 'nose' | 'beak' | 'pig';
export type Tail = 'thin' | 'tuft' | 'stripe' | 'puff' | 'fan' | 'wag' | 'curl' | 'hair' | 'coil';

export type Look = {
  fur: string;
  /** Belly, muzzle and inner ears. */
  light: string;
  /** Accents: tail tips, hooves, manes, stripes. */
  dark: string;
  ears: Ears;
  snout: Snout;
  tail: Tail;
  /** Horn color, for horns and dragon horns. */
  horn?: string;
  /** Pillow and blanket colors. */
  bed: [string, string];
  /** Tap reactions for stages 1, 2 and 3. */
  sounds: [string, string, string];
  /** Color of the little things that float off it. */
  mote: string;
  /** Which first-six pet it moves like when just living somewhere (the hearth, the groups card). */
  movesLike: 'lamb' | 'dove' | 'lion' | 'dragon' | 'pumpkin';
  /** Belly and paws when lying down, if `light` (often an inner-ear pink) would look wrong there. */
  belly?: string;
  /** A long muzzle and a mane when lying down, for the horse and donkey, instead of a round face. */
  longFace?: boolean;
};

export type LookPetId = Exclude<PetId, 'lamb' | 'dove' | 'lion' | 'ember' | 'dragon' | 'pumpkin'>;

export const LOOKS: Record<LookPetId, Look> = {
  turkey: { fur: '#8A5A3C', light: '#A8704A', dark: '#C9433A', ears: 'none', snout: 'beak', tail: 'fan', bed: ['#C9433A', '#F2C462'], sounds: ['Peep!', 'Gobble!', 'Gobble! Give thanks!'], mote: '#E8913A', movesLike: 'lamb' },
  donkey: { fur: '#B4A698', light: '#E6DED4', dark: '#5C5048', ears: 'long', snout: 'nose', tail: 'tuft', bed: ['#C9433A', '#F2E9D8'], sounds: ['Hee!', 'Hee-haw!', 'Glory to God!'], mote: '#FFFFFF', movesLike: 'lion', longFace: true },
  rat: { fur: '#C8C3D0', light: '#E3DEE8', dark: '#E8A9B4', ears: 'round', snout: 'nose', tail: 'thin', bed: ['#8E2A24', '#E8A24B'], sounds: ['Squeak!', 'Squeak!', 'Good fortune!'], mote: '#F2C462', movesLike: 'lamb' },
  ox: { fur: '#9A6646', light: '#E3B994', dark: '#4A2E22', ears: 'horns', snout: 'nose', tail: 'tuft', horn: '#F3EBDD', bed: ['#C9A24B', '#F3EBDD'], sounds: ['Mm-moo!', 'Moo!', 'Steady on!'], mote: '#E8C462', movesLike: 'lion' },
  tiger: { fur: '#E8913A', light: '#FFF3E2', dark: '#3A2A22', ears: 'pointy', snout: 'nose', tail: 'stripe', bed: ['#2F4B7A', '#8EC9F0'], sounds: ['Mew!', 'Rrrawr!', 'Be brave!'], mote: '#E6EEF8', movesLike: 'lion' },
  rabbit: { fur: '#F4F1EA', light: '#F2B6B8', dark: '#E6E0D6', ears: 'long', snout: 'nose', tail: 'puff', bed: ['#6E5AA8', '#B9A6F0'], sounds: ['Hop!', 'Hop hop!', 'Moonlight!'], mote: '#F4EED8', movesLike: 'lamb', belly: '#FFFFFF' },
  loong: { fur: '#C9433A', light: '#F2C462', dark: '#8E2A24', ears: 'dragon', snout: 'nose', tail: 'coil', horn: '#F2C462', bed: ['#8E2A24', '#F2C462'], sounds: ['Rawr!', 'Good fortune!', 'Pearl of peace!'], mote: '#F2C462', movesLike: 'dragon' },
  snake: { fur: '#6BAF7A', light: '#86C893', dark: '#4E8E5C', ears: 'none', snout: 'nose', tail: 'coil', bed: ['#2F6B4A', '#B5F0D8'], sounds: ['Hiss!', 'Hiss-ello!', 'Be wise!'], mote: '#B5F0D8', movesLike: 'dragon' },
  horse: { fur: '#B9783F', light: '#E3B994', dark: '#4A2E22', ears: 'pointy', snout: 'nose', tail: 'hair', bed: ['#2F4B8A', '#E6EEF8'], sounds: ['Neigh!', 'Neigh!', 'Onward!'], mote: '#E6EEF8', movesLike: 'lion', longFace: true },
  goat: { fur: '#E6DCC4', light: '#F4ECDA', dark: '#6B5E52', ears: 'curly', snout: 'nose', tail: 'puff', horn: '#9C9488', bed: ['#3E7A4A', '#9CCB7A'], sounds: ['Meh!', 'Maa!', 'Peace on the hills!'], mote: '#F2F5FA', movesLike: 'lamb' },
  monkey: { fur: '#8A5A3C', light: '#F0CFA8', dark: '#6E4630', ears: 'round', snout: 'nose', tail: 'curl', bed: ['#B5476E', '#F2A7C0'], sounds: ['Ooh!', 'Ooh-ooh!', 'Wisdom!'], mote: '#F2A7C0', movesLike: 'dove' },
  rooster: { fur: '#F7F5F0', light: '#E6E1D7', dark: '#C9433A', ears: 'comb', snout: 'beak', tail: 'fan', bed: ['#C9433A', '#F2934A'], sounds: ['Cheep!', 'Cock-a-doodle!', 'Rise and pray!'], mote: '#F2934A', movesLike: 'dove' },
  dog: { fur: '#E3B57A', light: '#F3E2C8', dark: '#8A5A3C', ears: 'floppy', snout: 'nose', tail: 'wag', bed: ['#2F4B8A', '#6E9BEA'], sounds: ['Yip!', 'Woof!', 'Faithful friend!'], mote: '#6E9BEA', movesLike: 'lamb' },
  pig: { fur: '#E89A9E', light: '#F5C2C4', dark: '#C97F84', ears: 'pointy', snout: 'pig', tail: 'curl', bed: ['#B5476E', '#F08CA6'], sounds: ['Oink!', 'Oink oink!', 'Abundant joy!'], mote: '#F08CA6', movesLike: 'pumpkin' },
};

export function getLook(id: PetId): Look | undefined {
  return (LOOKS as Partial<Record<PetId, Look>>)[id];
}

const INK = '#2B2420';

/**
 * Ears (or horns, comb) for a head whose top center is (cx, top), sized for a head of radius `r`.
 * Drawn behind the head except the comb and horns, which callers draw after it with `front`.
 */
export function LookEars({ look, cx, top, r, front }: { look: Look; cx: number; top: number; r: number; front?: boolean }) {
  const k = r / 28;
  const lx = cx - 18 * k;
  const rx = cx + 18 * k;
  const y = top + 6 * k;
  const isFront = look.ears === 'horns' || look.ears === 'curly' || look.ears === 'comb' || look.ears === 'dragon';
  if (isFront !== Boolean(front)) return null;
  switch (look.ears) {
    case 'round':
      return (
        <>
          <Circle cx={lx - 4 * k} cy={y} r={10 * k} fill={look.fur} />
          <Circle cx={lx - 4 * k} cy={y} r={5.5 * k} fill={look.light} />
          <Circle cx={rx + 4 * k} cy={y} r={10 * k} fill={look.fur} />
          <Circle cx={rx + 4 * k} cy={y} r={5.5 * k} fill={look.light} />
        </>
      );
    case 'long':
      return (
        <>
          <Fx kind="earN" ox={lx} oy={y + 8 * k}>
            <Ellipse cx={lx} cy={y - 14 * k} rx={7 * k} ry={22 * k} fill={look.fur} />
            <Ellipse cx={lx} cy={y - 12 * k} rx={3.2 * k} ry={15 * k} fill={look.light} />
          </Fx>
          <Fx kind="earNR" ox={rx} oy={y + 8 * k}>
            <Ellipse cx={rx} cy={y - 14 * k} rx={7 * k} ry={22 * k} fill={look.fur} />
            <Ellipse cx={rx} cy={y - 12 * k} rx={3.2 * k} ry={15 * k} fill={look.light} />
          </Fx>
        </>
      );
    case 'pointy':
      return (
        <>
          <Polygon points={`${lx - 10 * k},${y + 6 * k} ${lx - 4 * k},${y - 14 * k} ${lx + 6 * k},${y + 2 * k}`} fill={look.fur} />
          <Polygon points={`${lx - 6 * k},${y + 3 * k} ${lx - 3.5 * k},${y - 7 * k} ${lx + 2 * k},${y + 1 * k}`} fill={look.light} />
          <Polygon points={`${rx + 10 * k},${y + 6 * k} ${rx + 4 * k},${y - 14 * k} ${rx - 6 * k},${y + 2 * k}`} fill={look.fur} />
          <Polygon points={`${rx + 6 * k},${y + 3 * k} ${rx + 3.5 * k},${y - 7 * k} ${rx - 2 * k},${y + 1 * k}`} fill={look.light} />
        </>
      );
    case 'floppy':
      return (
        <>
          <Fx kind="zFlopL" ox={lx - 6 * k} oy={y}>
            <Ellipse cx={lx - 8 * k} cy={y + 14 * k} rx={8 * k} ry={16 * k} fill={look.dark} transform={`rotate(14 ${lx - 8 * k} ${y + 14 * k})`} />
          </Fx>
          <Fx kind="zFlopR" ox={rx + 6 * k} oy={y}>
            <Ellipse cx={rx + 8 * k} cy={y + 14 * k} rx={8 * k} ry={16 * k} fill={look.dark} transform={`rotate(-14 ${rx + 8 * k} ${y + 14 * k})`} />
          </Fx>
        </>
      );
    case 'horns':
      return (
        <>
          <Path d={`M${lx} ${y + 4 * k} Q${lx - 18 * k} ${y - 6 * k} ${lx - 12 * k} ${y - 20 * k} Q${lx - 6 * k} ${y - 6 * k} ${lx + 8 * k} ${y - 2 * k} Z`} fill={look.horn} />
          <Path d={`M${rx} ${y + 4 * k} Q${rx + 18 * k} ${y - 6 * k} ${rx + 12 * k} ${y - 20 * k} Q${rx + 6 * k} ${y - 6 * k} ${rx - 8 * k} ${y - 2 * k} Z`} fill={look.horn} />
        </>
      );
    case 'curly':
      return (
        <G stroke={look.horn} strokeWidth={5 * k} fill="none" strokeLinecap="round">
          <Path d={`M${lx + 4 * k} ${y} C${lx - 14 * k} ${y - 14 * k} ${lx - 22 * k} ${y + 4 * k} ${lx - 10 * k} ${y + 8 * k}`} />
          <Path d={`M${rx - 4 * k} ${y} C${rx + 14 * k} ${y - 14 * k} ${rx + 22 * k} ${y + 4 * k} ${rx + 10 * k} ${y + 8 * k}`} />
        </G>
      );
    case 'comb':
      return (
        <Fx kind="zComb" ox={cx} oy={top + 4 * k}>
          <G fill={look.dark}>
            <Circle cx={cx - 7 * k} cy={top - 2 * k} r={6 * k} />
            <Circle cx={cx} cy={top - 6 * k} r={7 * k} />
            <Circle cx={cx + 7 * k} cy={top - 2 * k} r={6 * k} />
          </G>
        </Fx>
      );
    case 'dragon':
      return (
        <G fill={look.horn}>
          <Path d={`M${lx} ${y + 2 * k} L${lx - 8 * k} ${y - 18 * k} L${lx + 6 * k} ${y - 2 * k} Z`} />
          <Path d={`M${rx} ${y + 2 * k} L${rx + 8 * k} ${y - 18 * k} L${rx - 6 * k} ${y - 2 * k} Z`} />
        </G>
      );
    default:
      return null;
  }
}

/** A nose, beak or pig snout centered on (cx, cy), for a head of radius `r`. */
export function LookSnout({ look, cx, cy, r }: { look: Look; cx: number; cy: number; r: number }) {
  const k = r / 28;
  if (look.snout === 'beak') {
    return (
      <>
        <Polygon points={`${cx - 5 * k},${cy - 3 * k} ${cx + 5 * k},${cy - 3 * k} ${cx},${cy + 6 * k}`} fill="#E8A24B" />
        {look.tail === 'fan' && look.ears === 'none' ? (
          <Fx kind="floatyN" ox={cx + 3 * k} oy={cy + 3 * k}>
            <Path d={`M${cx + 3 * k} ${cy + 3 * k} q${6 * k} ${8 * k} ${1 * k} ${14 * k} q${-5 * k} ${-6 * k} ${-1 * k} ${-14 * k} z`} fill={look.dark} />
          </Fx>
        ) : null}
      </>
    );
  }
  if (look.snout === 'pig') {
    return (
      <>
        <Ellipse cx={cx} cy={cy} rx={9 * k} ry={6.5 * k} fill={look.light} stroke={look.dark} strokeWidth={1.2} />
        <Circle cx={cx - 3 * k} cy={cy} r={1.6 * k} fill={look.dark} />
        <Circle cx={cx + 3 * k} cy={cy} r={1.6 * k} fill={look.dark} />
      </>
    );
  }
  return (
    <>
      <Ellipse cx={cx} cy={cy + 2 * k} rx={11 * k} ry={8 * k} fill={look.light} />
      <Ellipse cx={cx} cy={cy - 1 * k} rx={3.6 * k} ry={2.6 * k} fill={INK} />
      <Path d={`M${cx} ${cy + 1.5 * k} Q${cx - 3 * k} ${cy + 5 * k} ${cx - 6 * k} ${cy + 3.5 * k} M${cx} ${cy + 1.5 * k} Q${cx + 3 * k} ${cy + 5 * k} ${cx + 6 * k} ${cy + 3.5 * k}`} stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>
  );
}

/** A tail starting at (x, y) and curling up and right, swaying. */
export function LookTail({ look, x, y, s = 1 }: { look: Look; x: number; y: number; s?: number }) {
  const at = (dx: number, dy: number) => `${x + dx * s} ${y + dy * s}`;
  switch (look.tail) {
    case 'fan':
      return (
        <Fx kind="fanT" ox={x} oy={y}>
          {[-50, -25, 0, 25, 50].map((a, i) => (
            <Ellipse key={a} cx={x} cy={y - 22 * s} rx={7 * s} ry={22 * s} fill={i % 2 ? '#F2C462' : look.dark} transform={`rotate(${a} ${x} ${y})`} />
          ))}
        </Fx>
      );
    case 'puff':
      return (
        <Fx kind="tailWag" ox={x} oy={y}>
          <Circle cx={x + 6 * s} cy={y - 4 * s} r={8 * s} fill={look.fur} />
        </Fx>
      );
    case 'wag':
      return (
        <Fx kind="zWag" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} Q${at(16, -6)} ${at(18, -24)}`} stroke={look.fur} strokeWidth={7 * s} fill="none" strokeLinecap="round" />
        </Fx>
      );
    case 'curl':
      return (
        <Fx kind="zCurly" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} C${at(20, 0)} ${at(24, -20)} ${at(12, -22)} C${at(4, -22)} ${at(6, -12)} ${at(12, -14)}`} stroke={look.dark} strokeWidth={4 * s} fill="none" strokeLinecap="round" />
        </Fx>
      );
    case 'hair':
      return (
        <Fx kind="zSwish" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} C${at(16, 2)} ${at(22, 14)} ${at(18, 30)} L${at(10, 28)} C${at(12, 16)} ${at(8, 8)} ${at(0, 6)} Z`} fill={look.dark} />
        </Fx>
      );
    case 'coil':
      return (
        <Fx kind="sway4" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} C${at(22, 4)} ${at(28, -18)} ${at(14, -24)}`} stroke={look.fur} strokeWidth={9 * s} fill="none" strokeLinecap="round" />
          <Circle cx={x + 14 * s} cy={y - 24 * s} r={3 * s} fill={look.light} />
        </Fx>
      );
    case 'stripe':
      return (
        <Fx kind="zSwish" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} C${at(22, 2)} ${at(30, -14)} ${at(26, -30)}`} stroke={look.fur} strokeWidth={7 * s} fill="none" strokeLinecap="round" />
          <Path d={`M${at(12, -2)} l${3 * s} ${6 * s} M${at(22, -10)} l${6 * s} ${2 * s} M${at(27, -22)} l${6 * s} ${0}`} stroke={look.dark} strokeWidth={3 * s} strokeLinecap="round" />
        </Fx>
      );
    case 'thin':
      return (
        <Fx kind="zSwish" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} C${at(28, 4)} ${at(36, -22)} ${at(22, -30)}`} stroke={look.dark} strokeWidth={3.5 * s} fill="none" strokeLinecap="round" />
        </Fx>
      );
    default:
      // tuft
      return (
        <Fx kind="zSwish" ox={x} oy={y}>
          <Path d={`M${at(0, 0)} C${at(18, 2)} ${at(24, -12)} ${at(20, -24)}`} stroke={look.fur} strokeWidth={5 * s} fill="none" strokeLinecap="round" />
          <Circle cx={x + 20 * s} cy={y - 28 * s} r={6 * s} fill={look.dark} />
        </Fx>
      );
  }
}

/** Front paws, hooves or wings in a 68x18 box (left at x=14, right at x=54), for the vigil candle. */
export function LookPaws({ look }: { look: Look }) {
  const wing = look.snout === 'beak';
  const hoof = look.ears === 'long' || look.ears === 'horns' || look.ears === 'curly' || look.tail === 'hair';
  return (
    <>
      {[14, 54].map(x => (
        <G key={x}>
          <Ellipse cx={x} cy={9} rx={wing ? 13 : 12} ry={wing ? 7 : 8} fill={look.fur} />
          {hoof ? (
            <Path d={`M${x - 9} 13 Q${x} 18 ${x + 9} 13`} stroke={look.dark} strokeWidth={4} fill="none" strokeLinecap="round" />
          ) : wing ? (
            <Path d={`M${x - 9} 11 q4 5 8 1 M${x - 1} 12 q4 5 8 1`} stroke={look.light} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          ) : (
            <Path d={`M${x - 5} 13 L${x - 5} 16 M${x} 14 L${x} 17 M${x + 5} 13 L${x + 5} 16`} stroke={look.light} strokeWidth={1.5} strokeLinecap="round" />
          )}
        </G>
      ))}
    </>
  );
}

/** What hangs over the edge of the prayer box where the pet perches: its tail. */
export function LookDangle({ look }: { look: Look }) {
  return (
    <Fx kind="sway4" ox={150} oy={226}>
      {look.tail === 'fan' ? (
        <>
          <Ellipse cx={154} cy={244} rx={6} ry={18} fill={look.dark} rotation={-10} originX={154} originY={226} />
          <Ellipse cx={164} cy={246} rx={6} ry={20} fill="#F2C462" rotation={6} originX={164} originY={226} />
          <Ellipse cx={174} cy={242} rx={6} ry={17} fill={look.dark} rotation={22} originX={174} originY={226} />
        </>
      ) : (
        <>
          <Path
            d="M150 226 C166 230 170 246 162 256"
            stroke={look.tail === 'thin' || look.tail === 'curl' ? look.dark : look.fur}
            strokeWidth={look.tail === 'thin' || look.tail === 'curl' ? 4 : 7}
            fill="none"
            strokeLinecap="round"
          />
          {look.tail === 'tuft' || look.tail === 'hair' ? <Circle cx={162} cy={258} r={6} fill={look.dark} /> : null}
          {look.tail === 'puff' ? <Circle cx={162} cy={256} r={8} fill={look.fur} /> : null}
        </>
      )}
    </Fx>
  );
}
