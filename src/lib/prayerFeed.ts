import { supabase } from './supabase';

export type PrayerRequest = {
  id: string;
  category: string;
  prayedCount: number;
  text: string;
};

type PrayerFeedCursor = {
  start: string;
  after?: string;
  wrapped: boolean;
};

const PAGE_SIZE = 10;

export function startPrayerFeed(): PrayerFeedCursor {
  // Prayer IDs are randomly generated UUIDs. Starting at a random point in the
  // ID index lets every eligible request surface, regardless of its age.
  const hex = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0'),
  ).join('');
  const start = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return { start, wrapped: false };
}

async function fetchRange(cursor: PrayerFeedCursor, userId: string | undefined, limit: number, signal: AbortSignal) {
  let query = supabase
    .from('prayers')
    .select('id, body, category, prayer_interactions(count), prayed_by_me:prayer_interactions()')
    .eq('approved', 'y')
    .is('group_id', null)
    .or('status.neq.answered,status.is.null')
    .eq('prayer_interactions.action', 'prayed')
    .order('id')
    .limit(limit)
    .abortSignal(signal);

  if (userId) {
    query = query.neq('user_id', userId)
      .eq('prayed_by_me.user_id', userId)
      .eq('prayed_by_me.action', 'prayed')
      .is('prayed_by_me', null);
  }
  if (cursor.wrapped) query = query.lt('id', cursor.start);
  if (cursor.after) query = query.gt('id', cursor.after);
  else if (!cursor.wrapped) query = query.gte('id', cursor.start);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPrayerFeedPage(
  cursor: PrayerFeedCursor,
  userId: string | undefined,
  signal: AbortSignal,
): Promise<{ requests: PrayerRequest[]; next: PrayerFeedCursor | null }> {
  let range = cursor;
  const rows = await fetchRange(range, userId, PAGE_SIZE, signal);
  if (!range.wrapped && rows.length < PAGE_SIZE) {
    range = { start: cursor.start, wrapped: true };
    rows.push(...await fetchRange(range, userId, PAGE_SIZE - rows.length, signal));
  }

  const requests: PrayerRequest[] = rows.map(row => ({
    id: row.id as string,
    text: (row.body as string | null) ?? '',
    category: (row.category as string | null) ?? 'Other',
    prayedCount: (row.prayer_interactions as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
  const next = requests.length === PAGE_SIZE ? { ...range, after: requests[requests.length - 1].id } : null;
  // Keep the cursor in index order, but shuffle the displayed batch.
  for (let index = requests.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [requests[index], requests[other]] = [requests[other], requests[index]];
  }
  return { requests, next };
}
