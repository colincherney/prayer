import { supabase } from './supabase';

export type UpdateKind = 'progress' | 'answered' | 'setback' | 'note';
export type UpdateVisibility = 'public' | 'private';
export type PrayerStatus = 'active' | 'progress' | 'answered' | 'setback';
export type PrayerFilter = 'all' | 'ongoing' | 'answered';

export type Reflection = {
  id: string;
  content: string;
  createdAt: string;
};

export type PrayerUpdate = {
  id: string;
  kind: UpdateKind;
  note: string;
  visibility: UpdateVisibility;
  createdAt: string;
};

export type MyPrayer = {
  id: string;
  text: string;
  createdAt: string;
  status: PrayerStatus;
  prayedCount: number;
  reflections: Reflection[];
  updates: PrayerUpdate[];
  groupName: string | null;
};

export type PrayerStats = {
  offered: number;
  offeredThisWeek: number;
  shared: number;
  answered: number;
  prayersReceived: number;
  notesSent: number;
  notesReceived: number;
};

export const PRAYER_PAGE_SIZE = 20;

export async function fetchPrayerStats(userId: string): Promise<PrayerStats> {
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  // Exact counts stay independent of the currently loaded history page.
  // "Offered" uses the same definition as the Me page: each saved prayed action.
  const results = await Promise.all([
    supabase.from('prayer_interactions').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('action', 'prayed'),
    supabase.from('prayer_interactions').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('action', 'prayed').gte('created_at', weekStart.toISOString()),
    supabase.from('prayers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('prayers').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'answered'),
    supabase.from('prayer_interactions').select('id, prayers!inner(user_id)', { count: 'exact', head: true })
      .eq('prayers.user_id', userId).eq('action', 'prayed'),
    supabase.from('reflections').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('reflections').select('id, prayers!inner(user_id)', { count: 'exact', head: true })
      .eq('prayers.user_id', userId),
  ]);
  for (const result of results) {
    if (result.error) throw result.error;
  }
  const [offered, offeredThisWeek, shared, answered, prayersReceived, notesSent, notesReceived] =
    results.map(result => result.count ?? 0);
  return { offered, offeredThisWeek, shared, answered, prayersReceived, notesSent, notesReceived };
}

export async function fetchPrayerHistory({
  userId,
  search = '',
  filter = 'all',
  oldestFirst = false,
  offset = 0,
}: {
  userId: string;
  search?: string;
  filter?: PrayerFilter;
  oldestFirst?: boolean;
  offset?: number;
}): Promise<{ prayers: MyPrayer[]; total: number }> {
  let query = supabase.from('prayers').select(
    'id, body, created_at, status, groups(name), prayer_interactions(count), reflections(id, content, created_at), prayer_updates(id, kind, note, visibility, created_at)',
    { count: 'exact' },
  ).eq('user_id', userId).eq('prayer_interactions.action', 'prayed');
  if (search.trim()) {
    // A literal search: percent and underscore in a prayer aren't wildcards.
    const literal = search.trim().replace(/[\\%_]/g, '\\$&');
    query = query.ilike('body', `%${literal}%`);
  }
  if (filter === 'ongoing') query = query.or('status.neq.answered,status.is.null');
  if (filter === 'answered') query = query.eq('status', 'answered');
  const { data, count, error } = await query
    .order('created_at', { ascending: oldestFirst })
    .order('id', { ascending: oldestFirst })
    .range(offset, offset + PRAYER_PAGE_SIZE - 1);
  if (error) throw error;
  const prayers: MyPrayer[] = (data ?? []).map(p => {
    const group = p.groups as unknown as { name: string } | { name: string }[] | null;
    return {
    id: p.id as string,
    text: (p.body as string) ?? '',
    createdAt: p.created_at as string,
    status: (p.status as PrayerStatus) ?? 'active',
    groupName: (Array.isArray(group) ? group[0]?.name : group?.name) ?? null,
    prayedCount: (p.prayer_interactions as { count: number }[] | null)?.[0]?.count ?? 0,
    reflections: ((p.reflections ?? []) as { id: string; content: string; created_at: string }[])
      .map(r => ({ id: r.id, content: r.content, createdAt: r.created_at }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    updates: ((p.prayer_updates ?? []) as {
      id: string; kind: UpdateKind; note: string; visibility: UpdateVisibility; created_at: string;
    }[]).map(u => ({ id: u.id, kind: u.kind, note: u.note, visibility: u.visibility, createdAt: u.created_at }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  });
  return { prayers, total: count ?? 0 };
}
