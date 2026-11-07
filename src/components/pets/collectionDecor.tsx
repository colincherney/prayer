import React from 'react';
import { G } from 'react-native-svg';

import { COLLECTION_DECOR, CollectionDecor } from './collectionData';
import { COLLECTION_DECOR_ART } from './collectionDecorArt';

const BY_ID = new Map<string, CollectionDecor>(COLLECTION_DECOR.map(d => [d.id, d]));
/** Ambience is a 120x120 tile of drifting particles, repeated across the whole nook. */
const AMBIENCE_TILE = 180;

export function isCollectionDecor(id: string): boolean {
  return BY_ID.has(id);
}

export function collectionDecor(id: string): CollectionDecor | undefined {
  return BY_ID.get(id);
}

/** A collection decoration at its default spot in the nook's 342x440 space. */
export function CollectionDecorPiece({ id }: { id: string }) {
  const d = BY_ID.get(id);
  const Art = COLLECTION_DECOR_ART[id];
  if (!d || !Art) return null;
  if (d.slot === 'ambience') {
    return (
      <>
        {[0, 1, 2].flatMap(row => [0, 1].map(col => (
          <G key={`${row}-${col}`} transform={`translate(${col * AMBIENCE_TILE + (row % 2) * 40 - 20} ${row * AMBIENCE_TILE - 20}) scale(${d.s})`}>
            <Art />
          </G>
        )))}
      </>
    );
  }
  return (
    <G transform={`translate(${d.x} ${d.y}) scale(${d.s})`}>
      <Art />
    </G>
  );
}

/** The decoration on its own tile, for the 32x32 thumbnails. */
export function CollectionDecorThumb({ id }: { id: string }) {
  const Art = COLLECTION_DECOR_ART[id];
  if (!Art) return null;
  return (
    <G transform="scale(0.2667)">
      <Art />
    </G>
  );
}
