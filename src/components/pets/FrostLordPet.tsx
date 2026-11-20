import React, { createContext, useContext } from 'react';
import { Image, View } from 'react-native';
import { Image as SvgImage } from 'react-native-svg';

import { useBelovedForm } from '@/lib/belovedForm';

import { PetFrame, PetProps } from './PetFrame';

/**
 * The nook (on the Me page) draws event companions bigger, as big as the other companions there (Selah's final form
 * fills the artboard). Everywhere else they keep their original size. Wrap a <Pet> in this, with true, for the big size.
 */
export const FullSizePals = createContext(false);

// The event companions: painted stage images (assets/images/winter-lord, assets/images/swamp-king) standing on the
// shared 240x260 artboard with their feet where every other companion's are. Their stage comes from their event, not
// from XP (src/lib/pet.ts).
//   * The Long Winter: Snowcap the apprentice cub, the Frost Mage, and the Frost Lord.
//   * The Beloved: the Cherub, the Muse, and The Beloved, whose final stage has a second look, the Seraph.
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
  /** The figure's middle in image pixels, if not 440. */
  cx?: number;
  /** The solid figure (alpha over 200, so faint glows and sparkles don't count): its top, left and right pixels. */
  solid: [top: number, left: number, right: number];
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
  1: { w: 880, h: 1120, body: 1120, top: 98, feet: 1059, solid: [98, 204, 729] },
  2: { w: 880, h: 1280, body: 1120, top: 12, feet: 1235, solid: [12, 164, 731] },
  3: { w: 940, h: 1400, body: 1120, top: 5, feet: 1365, solid: [17, 73, 838] },
};

export const FROST_LORD_STAGE_LABELS: Stages<string> = {
  1: 'Snowcap, a polar bear cub in an apprentice wizard hat',
  2: 'the Frost Mage, a polar bear wizard with a frost staff',
  3: 'the Frost Lord, a crowned polar bear wizard with an ice-crystal staff',
};

export const BELOVED_ART: Stages<number> = {
  1: require('../../../assets/images/beloved/beloved-1-cherub.png'),
  2: require('../../../assets/images/beloved/beloved-2-muse.png'),
  3: require('../../../assets/images/beloved/beloved-3-the-beloved.png'),
};

export const BELOVED_FRAMES: Stages<PalFrame> = {
  1: { w: 880, h: 1120, body: 1120, top: 403, feet: 1051, solid: [404, 169, 710] },
  2: { w: 880, h: 1120, body: 1120, top: 224, feet: 1079, solid: [224, 218, 661] },
  3: { w: 880, h: 1120, body: 1120, top: 194, feet: 1079, solid: [195, 144, 745] },
};

/** The Seraph, The Beloved's spirit form: a bigger canvas (her neon halo and glow), the figure at the same scale. */
export const SERAPH_ART: number = require('../../../assets/images/beloved/beloved-4-seraph.png');
export const SERAPH_FRAME: PalFrame = { w: 1120, h: 1360, body: 1120, top: 46, feet: 1215, cx: 560, solid: [315, 112, 1007] };

export const BELOVED_STAGE_LABELS: Stages<string> = {
  1: 'the Cherub, a little winged marble cherub holding a heart',
  2: 'the Muse, a marble muse with a laurel crown and a golden lyre',
  3: 'The Beloved, a marble statue with a golden crown holding a rose heart',
};
const SERAPH_LABEL = 'the Seraph, The Beloved in her glowing neon spirit form';

export const VESPER_ART: Stages<number> = {
  1: require('../../../assets/images/swamp-king/vesper-1.png'),
  2: require('../../../assets/images/swamp-king/vesper-2-fen-warden.png'),
  3: require('../../../assets/images/swamp-king/vesper-3-old-king.png'),
};

export const VESPER_FRAMES: Stages<PalFrame> = {
  1: { w: 860, h: 1100, body: 1100, top: 120, feet: 1029, solid: [120, 141, 738] },
  2: { w: 880, h: 1120, body: 1120, top: 164, feet: 1049, solid: [165, 202, 677] },
  3: { w: 880, h: 1120, body: 1120, top: 68, feet: 1066, solid: [68, 92, 808] },
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
/** Full size (the nook): at most this big (artboard units per image pixel), so a small figure like the Cherub doesn't balloon. */
const MAX_SCALE = 0.27;
/** How far above the artboard a tall hat may rise (the Frost Lord's), rather than shrinking the whole figure to fit it. */
const HAT_ROOM = 40;

/**
 * The full-size scale (the nook): as big as the other companions (Selah's final form fills the artboard), up to
 * MAX_SCALE, with the feet on the shared line, the solid figure no wider than the artboard, and no higher than
 * HAT_ROOM above it.
 */
export function palScale(f: PalFrame): number {
  const [top, left, right] = f.solid;
  const cx = f.cx ?? FIGURE_CX;
  return Math.min(MAX_SCALE, (FEET_Y + HAT_ROOM) / (f.feet - top), (CENTER_X - 2) / Math.max(cx - left, right - cx));
}

/**
 * Draws one painted stage image on the artboard. Normally: as big as the first stage's placement, but small enough
 * that the top of the head or hat stays inside the frame. Full size (the nook): a plain image in a box the artboard's
 * size rather than an SVG, because an SVG clips at its edges and a hat may rise a little above the box.
 */
function PalImage({ href, f, label, size, animated }: { href: number; f: PalFrame; label: string; size: number; animated: boolean }) {
  const full = useContext(FullSizePals);
  if (!full) {
    const s = Math.min(BASE_SCALE, (FEET_Y - 2) / (f.feet - f.top));
    const cx = f.cx ?? FIGURE_CX;
    return (
      <PetFrame size={size} animated={animated} label={label}>
        <SvgImage href={href} x={CENTER_X - cx * s} y={FEET_Y - f.feet * s} width={f.w * s} height={f.h * s} />
      </PetFrame>
    );
  }
  const s = palScale(f);
  const k = size / 240; // dp per artboard unit
  const cx = f.cx ?? FIGURE_CX;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: (size * 260) / 240 }}>
      <Image
        source={href}
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', left: (CENTER_X - cx * s) * k, top: (FEET_Y - f.feet * s) * k, width: f.w * s * k, height: f.h * s * k }}
      />
    </View>
  );
}

/** One event companion's art component, from its images, frames and descriptions. */
function makeEventPal(art: Stages<number>, frames: Stages<PalFrame>, labels: Stages<string>) {
  return function EventPal({ stage, size = 220, animated = true }: PetProps) {
    return <PalImage href={art[stage]} f={frames[stage]} label={labels[stage]} size={size} animated={animated} />;
  };
}

export const FrostLordBear = makeEventPal(FROST_LORD_ART, FROST_LORD_FRAMES, FROST_LORD_STAGE_LABELS);
export const VesperPal = makeEventPal(VESPER_ART, VESPER_FRAMES, VESPER_STAGE_LABELS);

/** The Beloved's line. Her final stage wears whichever form was picked (src/lib/belovedForm.ts): marble or the Seraph. */
export function BelovedPal({ stage, size = 220, animated = true }: PetProps) {
  const form = useBelovedForm();
  if (stage === 3 && form === 'spirit') {
    return <PalImage href={SERAPH_ART} f={SERAPH_FRAME} label={SERAPH_LABEL} size={size} animated={animated} />;
  }
  return <PalImage href={BELOVED_ART[stage]} f={BELOVED_FRAMES[stage]} label={BELOVED_STAGE_LABELS[stage]} size={size} animated={animated} />;
}
