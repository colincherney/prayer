import { refreshXpSoon } from './pet';
import { supabase } from './supabase';

export type BibleNote = {
  id: string;
  book: string;
  chapter: number;
  verse: number | null;
  version: string;
  body: string;
  created_at: string;
};

/**
 * Records that you read a chapter through today. Only the first read of a chapter each day counts (the table's key
 * says so), and it reports whether this one did, so the reader only celebrates XP that was really earned.
 */
export async function markChapterRead(book: string, chapter: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('bible_reads')
    .upsert({ book, chapter }, { onConflict: 'user_id,book,chapter,read_on', ignoreDuplicates: true })
    .select('book');
  if (error || !data?.length) return false;
  refreshXpSoon();
  return true;
}

export async function fetchChapterNotes(book: string, chapter: number, signal: AbortSignal): Promise<BibleNote[]> {
  const { data, error } = await supabase
    .from('bible_notes')
    .select('id, book, chapter, verse, version, body, created_at')
    .eq('book', book)
    .eq('chapter', chapter)
    .order('created_at', { ascending: false })
    .abortSignal(signal);
  if (error) throw error;
  return data as BibleNote[];
}

export async function addNote(note: { book: string; chapter: number; verse: number | null; version: string; body: string }) {
  const { data, error } = await supabase.from('bible_notes').insert(note).select('id, book, chapter, verse, version, body, created_at').single();
  if (error) throw error;
  refreshXpSoon();
  return data as BibleNote;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('bible_notes').delete().eq('id', id);
  if (error) throw error;
  refreshXpSoon();
}

/** Every chapter of a book you have ever read through, for marking them in the chapter grid. */
export async function fetchReadChapters(book: string, signal: AbortSignal): Promise<Set<number>> {
  const { data, error } = await supabase.from('bible_reads').select('chapter').eq('book', book).abortSignal(signal);
  if (error) return new Set();
  return new Set((data ?? []).map(r => r.chapter as number));
}

/** How many chapter readings and notes you have, for the Bible page's summary. */
export async function fetchBibleTotals(signal: AbortSignal): Promise<{ reads: number; notes: number } | null> {
  const [reads, notes] = await Promise.all([
    supabase.from('bible_reads').select('book', { count: 'exact', head: true }).abortSignal(signal),
    supabase.from('bible_notes').select('id', { count: 'exact', head: true }).abortSignal(signal),
  ]);
  if (reads.error || notes.error) return null;
  return { reads: reads.count ?? 0, notes: notes.count ?? 0 };
}
