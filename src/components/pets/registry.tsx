import React from 'react';

import { OliveDove } from './Dove';
import { SelahDragon } from './Dragon';
import { EmberFlame } from './Ember';
import { JudahLion } from './Lion';
import { PetProps } from './PetFrame';
import { TapPet } from './PetReaction';
import { PipLamb, PipStage } from './PipLamb';
import { GourdyPumpkin } from './Pumpkin';

export type PetId = 'lamb' | 'dove' | 'lion' | 'ember' | 'dragon' | 'pumpkin';

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
];

export const DEFAULT_PET: PetId = 'lamb';

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
