import { parseBibleReference } from './bibleReferences';
import type { BibleVersion } from './bibleVersion';
import { supabase } from './supabase';

export type BibleVerse = { number: number; text: string; inReading: boolean };
/** `book` is the app's own name for it ("1 Samuel", "Psalms"), the one notes and reading progress are saved under. */
export type BibleChapter = { key: string; title: string; book: string; chapter: number; data: BibleVerse[]; partial: boolean };

const PAGE_SIZE = 1000;
// Both tables name books the same way ("I Samuel", "Revelation of John").
const TABLE_BOOK_NAMES: Record<string, string> = { Psalm: 'Psalms', Revelation: 'Revelation of John' };

/**
 * Loads a passage in the chosen version. With `wholeChapter`, every verse of its chapters comes back, and the verses the
 * reference names are marked `inReading` so the reader can pick them out.
 */
async function fetchPassage(
  reference: string,
  version: BibleVersion,
  wholeChapter: boolean,
  signal: AbortSignal,
): Promise<BibleChapter[]> {
  const range = parseBibleReference(reference);
  if (!range) throw new Error(`Invalid Bible reference: ${reference}`);

  const { book, firstChapter, lastChapter, firstVerse, lastVerse } = range;
  const partial = firstVerse > 1 || Number.isFinite(lastVerse);
  const tableBook = TABLE_BOOK_NAMES[book] ?? book.replace(/^[123](?= )/, digit => 'I'.repeat(Number(digit)));
  const chapters = Array.from({ length: lastChapter - firstChapter + 1 }, (_, i) => String(firstChapter + i));
  const versesByChapter = new Map(chapters.map(chapter => [chapter, new Map<number, string>()]));
  // A reading across chapters starts mid-way through the first and stops mid-way through the last.
  const inReading = (chapter: number, verse: number) =>
    (chapter > firstChapter || verse >= firstVerse) && (chapter < lastChapter || verse <= lastVerse);

  // The tables contain duplicate rows. Page by row ID, then keep the first copy of each verse.
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(version)
      .select('chapter, verse, text')
      .eq('book', tableBook)
      .in('chapter', chapters)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1)
      .abortSignal(signal);
    if (error) throw error;

    for (const row of data) {
      const number = Number(row.verse);
      if (!Number.isInteger(number) || (!wholeChapter && !inReading(Number(row.chapter), number))) continue;
      const verses = versesByChapter.get(String(row.chapter));
      if (verses && !verses.has(number) && typeof row.text === 'string') verses.set(number, row.text);
    }
    if (data.length < PAGE_SIZE) break;
  }

  return chapters.map(chapter => {
    const verses = Array.from(versesByChapter.get(chapter) ?? [], ([number, text]) => ({
      number,
      text,
      inReading: inReading(Number(chapter), number),
    }));
    verses.sort((a, b) => a.number - b.number);

    // Versions number a few verses differently (the Psalms especially), so only an empty chapter is an error.
    if (!verses.some(v => v.inReading)) throw new Error(`Missing verses for ${reference}`);

    const title = `${book === 'Psalms' ? 'Psalm' : book} ${chapter}`;
    return { key: `${reference}:${chapter}`, title, book: book === 'Psalm' ? 'Psalms' : book, chapter: Number(chapter), data: verses, partial };
  });
}

export async function fetchBiblePassages(
  references: readonly string[],
  signal: AbortSignal,
  { version = 'KJV', wholeChapter = false }: { version?: BibleVersion; wholeChapter?: boolean } = {},
): Promise<BibleChapter[]> {
  const passages = await Promise.all(references.map(reference => fetchPassage(reference, version, wholeChapter, signal)));
  return passages.flat();
}
