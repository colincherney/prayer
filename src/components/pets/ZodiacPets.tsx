import React from 'react';
import { Defs, G, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Fx, SoftGlow } from './Fx';
import { PetFrame, PetProps } from './PetFrame';
import { Paint, ZODIAC_ART } from './zodiacArt';
import { tint, TintName } from './tint';

// The twelve monthly companions (design/ZodiacEvo.dc.html). Every stage reuses the animal's companion art:
//   stage 1 (baby): the art shrunk into its little scene, hopping;
//   stage 2: the companion itself, bobbing;
//   stage 3 (radiant): the art in front of its own backdrop, floating, recolored where the design filters it.
// The design's 200x200 artboard sits in the shared 240x260 pet frame at (20, 54), so feet land where other pets'
// do. Radiant backdrops fade out at the edges so they never show a hard square on the app's scenes.

type ZodiacKey = keyof typeof ZODIAC_ART;

type Spec = {
  /** Names for stages 1, 2, 3. */
  labels: [string, string, string];
  /** Where the baby art sits in its scene, and the radiant art in its backdrop (design `tfB`, `tfF`). */
  baby: string;
  radiant: string;
  /** Color filters from the design: the radiant stage's, and the baby's (only Dawn's chick). */
  radiantTint?: TintName;
  babyTint?: TintName;
  /** The radiant tile's glow color. */
  glow: string;
};

export const ZODIAC: Record<ZodiacKey, Spec> = {
  rat: { labels: ['Nutshell Nib', 'Nib the Rat', 'Nib, Lantern Keeper'], baby: 'translate(30 40) scale(0.7)', radiant: 'translate(-16 -16)', glow: '#E8A24B' },
  ox: { labels: ['Haystack Bao', 'Bao the Ox', 'Bao, Harvest Ox'], baby: 'translate(30 46) scale(0.7)', radiant: 'translate(0 -6)', glow: '#D9B25A' },
  tiger: { labels: ['Yarn-paw Rory', 'Rory the Tiger', 'Rory, Mountain Guardian'], baby: 'translate(22 48) scale(0.7)', radiant: 'translate(-2 -6) scale(1.02)', radiantTint: 'white', glow: '#8EC9F0' },
  rabbit: { labels: ['Teacup Mochi', 'Mochi the Rabbit', 'Mochi of the Moon'], baby: 'translate(30 28) scale(0.7)', radiant: 'translate(-14 -6)', radiantTint: 'moon', glow: '#B9A6F0' },
  dragon: { labels: ['Hatchling Long', 'Long the Dragon', 'Long, Pearl Dragon'], baby: 'translate(30 52) scale(0.7)', radiant: 'translate(0 -8)', radiantTint: 'gold', glow: '#E8C27A' },
  snake: { labels: ['Sprout Ribbon', 'Ribbon the Snake', 'Ribbon, Jade Coil'], baby: 'translate(30 50) scale(0.7)', radiant: 'translate(0 -4)', radiantTint: 'jade', glow: '#5FBF8A' },
  horse: { labels: ['Daisy Dash', 'Dash the Horse', 'Dash, Gallant Steed'], baby: 'translate(30 46) scale(0.7)', radiant: 'translate(0 -4)', glow: '#E6EEF8' },
  goat: { labels: ['Pebble Clover', 'Clover the Goat', 'Clover of the Cloud Hills'], baby: 'translate(30 30) scale(0.7)', radiant: 'translate(0 -12)', glow: '#9CCB7A' },
  monkey: { labels: ['Peachy Kiki', 'Kiki the Monkey', 'Kiki, Peach Sage'], baby: 'translate(30 46) scale(0.7)', radiant: 'translate(0 -4)', glow: '#F2A7C0' },
  rooster: { labels: ['Eggshell Dawn', 'Dawn the Rooster', 'Dawn, Herald of Morning'], baby: 'translate(30 50) scale(0.7)', radiant: 'translate(-6 -6)', babyTint: 'chick', glow: '#F2934A' },
  dog: { labels: ['Chew-toy Biscuit', 'Biscuit the Dog', 'Biscuit, Faithful Friend'], baby: 'translate(26 46) scale(0.7)', radiant: 'translate(0 -6)', glow: '#6E9BEA' },
  pig: { labels: ['Blossom Rosie', 'Rosie the Pig', 'Rosie, Abundant Heart'], baby: 'translate(30 46) scale(0.7)', radiant: 'translate(-8 -2)', glow: '#F08CA6' },
};

const same: Paint = c => c;
const painter = (name?: TintName): Paint => (name ? c => tint(name, c) : same);

/** Gradients the art refers to, plus the soft-edged mask for radiant backdrops. Ids are per animal. */
function ZodiacDefs({ k }: { k: ZodiacKey }) {
  return (
    <Defs>
      <RadialGradient id="zWarm" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#F2A93B" stopOpacity={0.45} />
        <Stop offset="1" stopColor="#F2A93B" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id={`zfadeG-${k}`} cx="50%" cy="50%" r="50%">
        <Stop offset="0.62" stopColor="#FFFFFF" stopOpacity={1} />
        <Stop offset="1" stopColor="#000000" stopOpacity={1} />
      </RadialGradient>
      <Mask id={`zfade-${k}`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={240} height={240}>
        <Rect x={-20} y={-20} width={240} height={240} fill={`url(#zfadeG-${k})`} />
      </Mask>
    </Defs>
  );
}

function Stage({ k, stage }: { k: ZodiacKey; stage: 1 | 2 | 3 }) {
  const spec = ZODIAC[k];
  const { Art, BabyBack, BabyFront, RadiantBack, RadiantFront } = ZODIAC_ART[k];
  if (stage === 1) {
    return (
      <Fx kind="zBabyHop" ox={100} oy={100}>
        <BabyBack />
        <G transform={spec.baby}>
          <Art t={painter(spec.babyTint)} />
        </G>
        <BabyFront />
      </Fx>
    );
  }
  if (stage === 2) {
    return (
      <Fx kind="bob6">
        <Art t={same} />
      </Fx>
    );
  }
  return (
    <Fx kind="zFloat">
      <G mask={`url(#zfade-${k})`}>
        <RadiantBack />
      </G>
      <G transform={spec.radiant}>
        <Art t={painter(spec.radiantTint)} />
      </G>
      <G mask={`url(#zfade-${k})`}>
        <RadiantFront />
      </G>
    </Fx>
  );
}

/** A monthly companion at its evolution stage. */
function ZodiacPet({ k, stage, size = 220, animated = true }: PetProps & { k: ZodiacKey }) {
  return (
    <PetFrame size={size} animated={animated} label={ZODIAC[k].labels[stage - 1]}>
      <ZodiacDefs k={k} />
      {stage === 3 ? <SoftGlow cx={120} cy={150} r={112} color={ZODIAC[k].glow} kind="glow" /> : null}
      <G transform="translate(20 54)">
        <Stage k={k} stage={stage} />
      </G>
    </PetFrame>
  );
}

const make = (k: ZodiacKey) => {
  const Pet = (props: PetProps) => <ZodiacPet k={k} {...props} />;
  Pet.displayName = `ZodiacPet(${k})`;
  return Pet;
};

/** One component per animal, in the shape the pet registry expects. */
export const ZODIAC_PETS = Object.fromEntries(
  (Object.keys(ZODIAC) as ZodiacKey[]).map(k => [k, make(k)]),
) as unknown as Record<ZodiacKey, (props: PetProps) => React.JSX.Element>;
