import React from 'react';
import { Image } from 'react-native-svg';

import { PetProps, PetFrame } from './PetFrame';

// The event companions: painted stage images (assets/images/winter-lord, assets/images/swamp-king) standing on the
// shared 240x260 artboard with their feet where every other companion's are. Their stage comes from their event, not
// from XP (src/lib/pet.ts).
//   * The Long Winter: Snowcap the apprentice cub, the Frost Mage, and the Frost Lord.
//   * The Swamp King: Vesper the wanderer, the Fen Warden, and the Old King.

export type PalFrame = {
  /** Image size in pixels. */
  w: number;
  h: number;
  /** Height of the frame the figure was painted in; StageImage sizes figures by this, so extended hats rise above it. */
  body: number;
  /** Highest and lowest opaque rows: the top of the head or hat, and the feet. */
  top: number;
  feet: number;
};
type Stages<T> = Record<1 | 2 | 3, T>;

export const FROST_LORD_ART: Stages<number> = {
  1: require('../../../assets/images/winter-lord/frost-1-snowcap.png'),
  2: require('../../../assets/images/winter-lord/frost-2-mage.png'),
  3: require('../../../assets/images/winter-lord/frost-3-lord.png'),
};

/**
 * The Frost Mage and Frost Lord images were extended upward (and the Lord's to the right) so their hats aren't cut off:
 * `body` is the original 1120 px frame, so the bears stay the same size and only the hat rises above it.
 */
export const FROST_LORD_FRAMES: Stages<PalFrame> = {
  1: { w: 880, h: 1120, body: 1120, top: 98, feet: 1059 },
  2: { w: 880, h: 1280, body: 1120, top: 12, feet: 1235 },
  3: { w: 940, h: 1400, body: 1120, top: 5, feet: 1365 },
};

export const FROST_LORD_STAGE_LABELS: Stages<string> = {
  1: 'Snowcap, a polar bear cub in an apprentice wizard hat',
  2: 'the Frost Mage, a polar bear wizard with a frost staff',
  3: 'the Frost Lord, a crowned polar bear wizard with an ice-crystal staff',
};

export const VESPER_ART: Stages<number> = {
  1: require('../../../assets/images/swamp-king/vesper-1.png'),
  2: require('../../../assets/images/swamp-king/vesper-2-fen-warden.png'),
  3: require('../../../assets/images/swamp-king/vesper-3-old-king.png'),
};

export const VESPER_FRAMES: Stages<PalFrame> = {
  1: { w: 860, h: 1100, body: 1100, top: 120, feet: 1029 },
  2: { w: 880, h: 1120, body: 1120, top: 164, feet: 1049 },
  3: { w: 880, h: 1120, body: 1120, top: 68, feet: 1066 },
};

export const VESPER_STAGE_LABELS: Stages<string> = {
  1: 'Vesper, a small hooded wanderer of the fen with glowing blue eyes and a dove',
  2: 'the Fen Warden, a hooded guardian of the fen holding a mended sword',
  3: 'the Old King, a crowned guardian of the fen with a sword and a dove',
};

const FEET_Y = 239; // where every companion's feet are on the 240x260 artboard
const CENTER_X = 120;
const FIGURE_CX = 440; // the figure's middle, in image pixels (the same in every stage of both lines)
const BASE_SCALE = 196 / 880;

/** One event companion's art component, from its images, frames and descriptions. */
function makeEventPal(art: Stages<number>, frames: Stages<PalFrame>, labels: Stages<string>) {
  return function EventPal({ stage, size = 220, animated = true }: PetProps) {
    const f = frames[stage];
    // As big as the first stage's placement, but small enough that the top of the head or hat stays inside the frame.
    const s = Math.min(BASE_SCALE, (FEET_Y - 2) / (f.feet - f.top));
    return (
      <PetFrame size={size} animated={animated} label={labels[stage]}>
        <Image href={art[stage]} x={CENTER_X - FIGURE_CX * s} y={FEET_Y - f.feet * s} width={f.w * s} height={f.h * s} />
      </PetFrame>
    );
  };
}

export const FrostLordBear = makeEventPal(FROST_LORD_ART, FROST_LORD_FRAMES, FROST_LORD_STAGE_LABELS);
export const VesperPal = makeEventPal(VESPER_ART, VESPER_FRAMES, VESPER_STAGE_LABELS);
