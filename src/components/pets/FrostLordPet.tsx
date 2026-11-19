import React from 'react';
import { Image } from 'react-native-svg';

import { PetProps, PetFrame } from './PetFrame';

// The Frost Lord line, from the Long Winter event: Snowcap the apprentice cub, the Frost Mage, and the Frost Lord.
// The art is the event's painted stage images (assets/images/winter-lord), standing on the shared 240x260 artboard
// with their feet where every other companion's are. Its stage comes from the event, not from XP (src/lib/pet.ts).

export const FROST_LORD_ART = {
  1: require('../../../assets/images/winter-lord/frost-1-snowcap.png'),
  2: require('../../../assets/images/winter-lord/frost-2-mage.png'),
  3: require('../../../assets/images/winter-lord/frost-3-lord.png'),
} as const;

/**
 * Each image's size and where the figure is in it. The Frost Mage and Frost Lord images were extended upward (and the
 * Lord's to the right) so their hats aren't cut off: `body` is the height of the original 1120 px frame the figure was
 * painted in, so the bears stay the same size and only the hat rises above it.
 */
export const FROST_LORD_FRAMES = {
  1: { w: 880, h: 1120, body: 1120, top: 98, feet: 1059 },
  2: { w: 880, h: 1280, body: 1120, top: 12, feet: 1235 },
  3: { w: 940, h: 1400, body: 1120, top: 5, feet: 1365 },
} as const;

export const FROST_LORD_STAGE_LABELS = {
  1: 'Snowcap, a polar bear cub in an apprentice wizard hat',
  2: 'the Frost Mage, a polar bear wizard with a frost staff',
  3: 'the Frost Lord, a crowned polar bear wizard with an ice-crystal staff',
} as const;

const FEET_Y = 239; // where every companion's feet are on the 240x260 artboard
const CENTER_X = 120;
const FIGURE_CX = 440; // the bear's middle, in image pixels (the same in all three)
const BASE_SCALE = 196 / 880;

export function FrostLordBear({ stage, size = 220, animated = true }: PetProps) {
  const f = FROST_LORD_FRAMES[stage];
  // As big as Snowcap's original placement, but small enough that the tip of the hat stays inside the frame.
  const s = Math.min(BASE_SCALE, (FEET_Y - 2) / (f.feet - f.top));
  return (
    <PetFrame size={size} animated={animated} label={FROST_LORD_STAGE_LABELS[stage]}>
      <Image href={FROST_LORD_ART[stage]} x={CENTER_X - FIGURE_CX * s} y={FEET_Y - f.feet * s} width={f.w * s} height={f.h * s} />
    </PetFrame>
  );
}
