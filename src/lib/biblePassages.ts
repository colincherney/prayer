import { parseBibleReference } from './bibleReferences';
import { supabase } from './supabase';

type BibleVerse = { number: number; text: string };
type BibleChapter = { key: string; title: string; data: BibleVerse[] };

const PAGE_SIZE = 1000;
const KJV_BOOK_NAMES: Record<string, string> = { Psalm: 'Psalms', Revelation: 'Revelation of John' };

async function fetchPassage(reference: string, signal: AbortSignal): Promise<BibleChapter[]> {
  const range = parseBibleReference(reference);
  if (!range) throw new Error(`Invalid Bible reference: ${reference}`);

  const { book, firstChapter, lastChapter, firstVerse, lastVerse } = range;
  const tableBook = KJV_BOOK_NAMES[book] ?? book.replace(/^[123](?= )/, digit => 'I'.repeat(Number(digit)));
  const chapters = Array.from({ length: lastChapter - firstChapter + 1 }, (_, i) => String(firstChapter + i));
  const versesByChapter = new Map(chapters.map(chapter => [chapter, new Map<number, string>()]));

  // KJV contains duplicate rows. Page by row ID, then keep the first copy of each verse.
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('KJV')
      .select('chapter, verse, text')
      .eq('book', tableBook)
      .in('chapter', chapters)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1)
      .abortSignal(signal);
    if (error) throw error;

    for (const row of data) {
      const number = Number(row.verse);
      if (!Number.isInteger(number) || number < firstVerse || number > lastVerse) continue;
      const verses = versesByChapter.get(String(row.chapter));
      if (verses && !verses.has(number) && typeof row.text === 'string') verses.set(number, row.text);
    }
    if (data.length < PAGE_SIZE) break;
  }

  return chapters.map(chapter => {
    const verses = Array.from(versesByChapter.get(chapter) ?? [], ([number, text]) => ({ number, text }));
    verses.sort((a, b) => a.number - b.number);

    if (!verses.length || (Number.isFinite(lastVerse) && verses.length !== lastVerse - firstVerse + 1)) {
      throw new Error(`Missing verses for ${reference}`);
    }

    const title = `${book === 'Psalms' ? 'Psalm' : book} ${chapter}`;
    return { key: `${reference}:${chapter}`, title, data: verses };
  });
}

export async function fetchBiblePassages(references: readonly string[], signal: AbortSignal): Promise<BibleChapter[]> {
  const passages = await Promise.all(references.map(reference => fetchPassage(reference, signal)));
  return passages.flat();
}
