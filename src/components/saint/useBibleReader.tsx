import React, { useMemo, useState } from 'react';

import { BiblePassageReader } from '@/components/saint/BiblePassageReader';
import { BIBLE_BOOKS } from '@/lib/bibleBooks';
import { LOCAL_KEYS, writeLocal } from '@/lib/localCache';

export type BiblePlace = { book: number; chapter: number };

export const bibleRef = ({ book, chapter }: BiblePlace) => `${BIBLE_BOOKS[book].name} ${chapter}`;
/** "Psalms 23" reads as "Psalm 23". */
export const shownBibleRef = (place: BiblePlace) => bibleRef(place).replace(/^Psalms /, 'Psalm ');
/** A saved book name ("1 Samuel") back to its place in the Bible, or null if it isn't one of the 66. */
export const placeOf = (book: string, chapter: number): BiblePlace | null => {
  const index = BIBLE_BOOKS.findIndex(b => b.name === book);
  return index >= 0 && chapter >= 1 && chapter <= BIBLE_BOOKS[index].chapters ? { book: index, chapter } : null;
};

/**
 * Opens the full-screen reader on a chapter, with swiping through to the chapters either side, and remembers it as
 * the place to pick up from. Render `reader` anywhere in the screen.
 */
export function useBibleReader(onOpen?: (place: BiblePlace) => void, onClose?: () => void) {
  const [reading, setReading] = useState<BiblePlace | null>(null);
  const references = useMemo(() => (reading ? [bibleRef(reading)] : []), [reading]);

  const open = (place: BiblePlace) => {
    setReading(place);
    onOpen?.(place);
    writeLocal(LOCAL_KEYS.bibleLastRead, place).catch(() => {});
  };
  const step = (delta: 1 | -1) => {
    if (!reading) return;
    let { book, chapter } = reading;
    chapter += delta;
    if (chapter < 1) {
      book -= 1;
      chapter = BIBLE_BOOKS[book]?.chapters ?? 0;
    } else if (chapter > BIBLE_BOOKS[book].chapters) {
      book += 1;
      chapter = 1;
    }
    if (BIBLE_BOOKS[book]) open({ book, chapter });
  };
  const atStart = reading?.book === 0 && reading.chapter === 1;
  const atEnd = reading?.book === BIBLE_BOOKS.length - 1 && reading.chapter === BIBLE_BOOKS[reading.book].chapters;

  const reader = reading ? (
    <BiblePassageReader
      references={references}
      onClose={() => {
        setReading(null);
        onClose?.();
      }}
      backLabel="Back"
      onPrevChapter={atStart ? undefined : () => step(-1)}
      onNextChapter={atEnd ? undefined : () => step(1)}
    />
  ) : null;

  return { open, reader };
}
