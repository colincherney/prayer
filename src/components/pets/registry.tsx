import React from 'react';

import { useReleases } from '@/lib/releases';

import { OliveDove } from './Dove';
import { SelahDragon } from './Dragon';
import { EmberFlame } from './Ember';
import { GobblesTurkey, NoelDonkey } from './HolidayPets';
import { JudahLion } from './Lion';
import { PetProps } from './PetFrame';
import { TapPet } from './PetReaction';
import { PipLamb, PipStage } from './PipLamb';
import { GourdyPumpkin } from './Pumpkin';
import { ZODIAC_PETS } from './ZodiacPets';

export type PetId =
  | 'lamb'
  | 'dove'
  | 'lion'
  | 'ember'
  | 'dragon'
  | 'pumpkin'
  | 'turkey'
  | 'donkey'
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'loong'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export type PetDef = {
  id: PetId;
  /** Default name; the user can rename it. */
  name: string;
  species: string;
  tagline: string;
  /** Names for evolution stages 1, 2 and 3 (levels 1-4, 5-9, 10+). */
  stages: [string, string, string];
  /** Set for seasonal companions; shown as a small tag in the picker. */
  season?: string;
  /**
   * Released on a date set in the database (public.content_releases, id `pet:<id>`). Until then it is hidden
   * everywhere; see src/lib/releases.ts.
   */
  scheduled?: boolean;
  Art: React.ComponentType<PetProps>;
};

export const PETS: PetDef[] = [
  {
    id: 'lamb',
    name: 'Pip',
    species: 'Lamb',
    tagline: 'From a wobbly lambkin to a lamb of light.',
    stages: ['Lambkin', 'Little Lamb', 'Lamb of Light'],
    Art: PipLamb,
  },
  {
    id: 'dove',
    name: 'Olive',
    species: 'Dove',
    tagline: 'From a fluffy fledgling to a dove of peace.',
    stages: ['Fledgling', 'Olive', 'Dove of Peace'],
    Art: OliveDove,
  },
  {
    id: 'lion',
    name: 'Judah',
    species: 'Lion',
    tagline: 'From a fuzzy cub to a crowned lion.',
    stages: ['Cub', 'Young Judah', 'Lion of Judah'],
    Art: JudahLion,
  },
  {
    id: 'ember',
    name: 'Ember',
    species: 'Candle',
    tagline: 'From a tiny tealight to the vigil flame.',
    stages: ['Spark', 'Ember', 'Vigil Flame'],
    Art: EmberFlame,
  },
  {
    id: 'dragon',
    name: 'Selah',
    species: 'Sea dragon',
    tagline: 'Grows from egg to guardian as you pray.',
    stages: ['Hatchling', 'Young Selah', 'Selah, Guardian'],
    Art: SelahDragon,
  },
  {
    id: 'pumpkin',
    name: 'Gourdy',
    species: 'Pumpkin',
    tagline: 'From a tiny gourd to the harvest lantern.',
    stages: ['Seedling Gourd', 'Gourdy', 'Harvest Lantern'],
    season: "All Hallows' Eve",
    Art: GourdyPumpkin,
  },
  {
    id: 'turkey',
    name: 'Gobbles',
    species: 'Turkey',
    tagline: 'From a little poult to a grateful harvest turkey.',
    stages: ['Little Poult', 'Gobbles', 'Harvest Gobbles'],
    season: 'Thanksgiving',
    scheduled: true,
    Art: GobblesTurkey,
  },
  {
    id: 'donkey',
    name: 'Noel',
    species: 'Donkey',
    tagline: 'From a little foal to the donkey of Bethlehem.',
    stages: ['Little Foal', 'Noel', 'Noel of Bethlehem'],
    season: 'Advent & Christmas',
    scheduled: true,
    Art: NoelDonkey,
  },
  // One companion a month through 2027 (design/ZodiacEvo.dc.html).
  {
    id: 'rat',
    name: 'Nib',
    species: 'Rat',
    tagline: 'From a nutshell nap to the lantern keeper.',
    stages: ['Nutshell Nib', 'Nib', 'Lantern Keeper'],
    season: 'January',
    scheduled: true,
    Art: ZODIAC_PETS.rat,
  },
  {
    id: 'ox',
    name: 'Bao',
    species: 'Ox',
    tagline: 'From a haystack calf to the steady harvest ox.',
    stages: ['Haystack Bao', 'Bao', 'Harvest Ox'],
    season: 'February',
    scheduled: true,
    Art: ZODIAC_PETS.ox,
  },
  {
    id: 'tiger',
    name: 'Rory',
    species: 'Tiger',
    tagline: 'From a yarn-pawed cub to the mountain guardian.',
    stages: ['Yarn-paw Rory', 'Rory', 'Mountain Guardian'],
    season: 'March',
    scheduled: true,
    Art: ZODIAC_PETS.tiger,
  },
  {
    id: 'rabbit',
    name: 'Mochi',
    species: 'Rabbit',
    tagline: 'From a teacup bunny to the rabbit of the moon.',
    stages: ['Teacup Mochi', 'Mochi', 'Mochi of the Moon'],
    season: 'April',
    scheduled: true,
    Art: ZODIAC_PETS.rabbit,
  },
  {
    id: 'loong',
    name: 'Long',
    species: 'Dragon',
    tagline: 'From a hatchling to the pearl dragon.',
    stages: ['Hatchling Long', 'Long', 'Pearl Dragon'],
    season: 'May',
    scheduled: true,
    Art: ZODIAC_PETS.dragon,
  },
  {
    id: 'snake',
    name: 'Ribbon',
    species: 'Snake',
    tagline: 'From a garden sprout to the jade coil.',
    stages: ['Sprout Ribbon', 'Ribbon', 'Jade Coil'],
    season: 'June',
    scheduled: true,
    Art: ZODIAC_PETS.snake,
  },
  {
    id: 'horse',
    name: 'Dash',
    species: 'Horse',
    tagline: 'From a daisy foal to the gallant steed.',
    stages: ['Daisy Dash', 'Dash', 'Gallant Steed'],
    season: 'July',
    scheduled: true,
    Art: ZODIAC_PETS.horse,
  },
  {
    id: 'goat',
    name: 'Clover',
    species: 'Goat',
    tagline: 'From a pebble kid to the goat of the cloud hills.',
    stages: ['Pebble Clover', 'Clover', 'Clover of the Cloud Hills'],
    season: 'August',
    scheduled: true,
    Art: ZODIAC_PETS.goat,
  },
  {
    id: 'monkey',
    name: 'Kiki',
    species: 'Monkey',
    tagline: 'From a peachy little one to the peach sage.',
    stages: ['Peachy Kiki', 'Kiki', 'Peach Sage'],
    season: 'September',
    scheduled: true,
    Art: ZODIAC_PETS.monkey,
  },
  {
    id: 'rooster',
    name: 'Dawn',
    species: 'Rooster',
    tagline: 'From an eggshell chick to the herald of morning.',
    stages: ['Eggshell Dawn', 'Dawn', 'Herald of Morning'],
    season: 'October',
    scheduled: true,
    Art: ZODIAC_PETS.rooster,
  },
  {
    id: 'dog',
    name: 'Biscuit',
    species: 'Dog',
    tagline: 'From a chew-toy puppy to the faithful friend.',
    stages: ['Chew-toy Biscuit', 'Biscuit', 'Faithful Friend'],
    season: 'November',
    scheduled: true,
    Art: ZODIAC_PETS.dog,
  },
  {
    id: 'pig',
    name: 'Rosie',
    species: 'Pig',
    tagline: 'From a blossom piglet to the abundant heart.',
    stages: ['Blossom Rosie', 'Rosie', 'Abundant Heart'],
    season: 'December',
    scheduled: true,
    Art: ZODIAC_PETS.pig,
  },
];

export const DEFAULT_PET: PetId = 'lamb';

/** The companions that can be picked right now: scheduled ones appear once the database releases them. */
export function useAvailablePets(): PetDef[] {
  const { isReleased } = useReleases();
  return PETS.filter(p => !p.scheduled || isReleased(`pet:${p.id}`));
}

export function getPet(id: PetId): PetDef {
  return PETS.find(p => p.id === id) ?? PETS[0];
}

export function isPetId(v: unknown): v is PetId {
  return PETS.some(p => p.id === v);
}

export function petStageName(id: PetId, stage: PipStage): string {
  return getPet(id).stages[stage - 1];
}

/** Renders the chosen companion at its evolution stage. With `interactive`, tapping it plays its reaction. */
export function Pet({ id, interactive, ...props }: PetProps & { id: PetId; interactive?: boolean }) {
  const { Art } = getPet(id);
  const art = <Art {...props} />;
  if (!interactive) return art;
  return (
    <TapPet id={id} stage={props.stage} size={props.size ?? 220}>
      {art}
    </TapPet>
  );
}
