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

export type BibleTotals = { reads: number; notes: number; highlights: number };

/** How many chapter readings, notes and highlights you have, for the Bible page's summary. */
export async function fetchBibleTotals(signal: AbortSignal): Promise<BibleTotals | null> {
  const [reads, notes, highlights] = await Promise.all([
    supabase.from('bible_reads').select('book', { count: 'exact', head: true }).abortSignal(signal),
    supabase.from('bible_notes').select('id', { count: 'exact', head: true }).abortSignal(signal),
    supabase.from('bible_highlights').select('verse', { count: 'exact', head: true }).abortSignal(signal),
  ]);
  if (reads.error || notes.error) return null;
  return { reads: reads.count ?? 0, notes: notes.count ?? 0, highlights: highlights.error ? 0 : highlights.count ?? 0 };
}

export type BibleRead = { book: string; chapter: number; read_on: string; created_at: string };

/** Your reading history, newest first: every chapter you finished, and the day you finished it. */
export async function fetchReadHistory(signal: AbortSignal, limit = 300): Promise<BibleRead[]> {
  const { data, error } = await supabase
    .from('bible_reads')
    .select('book, chapter, read_on, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
    .abortSignal(signal);
  if (error) throw error;
  return data as BibleRead[];
}

/** Every note you've taken, newest first. */
export async function fetchAllNotes(signal: AbortSignal, limit = 300): Promise<BibleNote[]> {
  const { data, error } = await supabase
    .from('bible_notes')
    .select('id, book, chapter, verse, version, body, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
    .abortSignal(signal);
  if (error) throw error;
  return data as BibleNote[];
}

export const HIGHLIGHT_COLORS = ['gold', 'rose', 'sage', 'sky'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];
export type BibleHighlight = { book: string; chapter: number; verse: number; color: HighlightColor; created_at: string };

/** Soft washes that sit behind dark or light text alike. */
export const HIGHLIGHT_WASH: Record<HighlightColor, string> = {
  gold: 'rgba(242, 196, 64, 0.38)',
  rose: 'rgba(232, 128, 120, 0.32)',
  sage: 'rgba(110, 176, 128, 0.32)',
  sky: 'rgba(96, 156, 224, 0.32)',
};
/** The same colours, solid, for the swatches you pick from. */
export const HIGHLIGHT_SWATCH: Record<HighlightColor, string> = {
  gold: '#F0C24A',
  rose: '#E68A80',
  sage: '#79B58A',
  sky: '#6FA3DE',
};

export async function fetchChapterHighlights(book: string, chapter: number, signal: AbortSignal): Promise<BibleHighlight[]> {
  const { data, error } = await supabase
    .from('bible_highlights')
    .select('book, chapter, verse, color, created_at')
    .eq('book', book)
    .eq('chapter', chapter)
    .abortSignal(signal);
  if (error) throw error;
  return data as BibleHighlight[];
}

/** Highlights a verse, or recolours it. One highlight per verse, so only the first one earns XP. */
export async function setHighlight(book: string, chapter: number, verse: number, color: HighlightColor) {
  const { error } = await supabase.from('bible_highlights').upsert({ book, chapter, verse, color }, { onConflict: 'user_id,book,chapter,verse' });
  if (error) throw error;
  refreshXpSoon();
}

export async function removeHighlight(book: string, chapter: number, verse: number) {
  const { error } = await supabase.from('bible_highlights').delete().eq('book', book).eq('chapter', chapter).eq('verse', verse);
  if (error) throw error;
  refreshXpSoon();
}

/** Every verse you've highlighted, newest first. */
export async function fetchAllHighlights(signal: AbortSignal, limit = 300): Promise<BibleHighlight[]> {
  const { data, error } = await supabase
    .from('bible_highlights')
    .select('book, chapter, verse, color, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
    .abortSignal(signal);
  if (error) throw error;
  return data as BibleHighlight[];
}

/**
 * The chapter you last touched on any device: the newest chapter you finished, took a note in, or highlighted. The
 * phone remembers the exact chapter you last opened; this is the account's copy for a new phone or a reinstall.
 */
export async function fetchLastBiblePlace(signal: AbortSignal): Promise<{ book: string; chapter: number } | null> {
  const newest = (table: 'bible_reads' | 'bible_notes' | 'bible_highlights') =>
    supabase.from(table).select('book, chapter, created_at').order('created_at', { ascending: false }).limit(1).abortSignal(signal);
  const results = await Promise.all([newest('bible_reads'), newest('bible_notes'), newest('bible_highlights')]);
  const rows = results.flatMap(r => (r.error || !r.data ? [] : (r.data as { book: string; chapter: number; created_at: string }[])));
  if (!rows.length) return null;
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { book: rows[0].book, chapter: rows[0].chapter };
}
