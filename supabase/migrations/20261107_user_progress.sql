-- Personal progress that used to live only on the phone, kept per account so it survives a new phone or a
-- reinstall: the nook layout, keepsake shelf picks, pet names, when each companion was met, level-ups already
-- celebrated, and today's accepted quests and swaps. The app writes it (src/lib/cloudProgress.ts). Safe to run again.
create table if not exists public.user_progress (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nook jsonb,
  shelf_picks jsonb,
  pet_names jsonb,
  companions_met jsonb,
  levels_seen jsonb,
  quest_day jsonb,
  updated_at timestamptz not null default now(),
  -- keeps each field small; the real values are a few kilobytes at most
  constraint user_progress_size check (
    coalesce(pg_column_size(nook), 0) < 65536
    and coalesce(pg_column_size(shelf_picks), 0) < 4096
    and coalesce(pg_column_size(pet_names), 0) < 8192
    and coalesce(pg_column_size(companions_met), 0) < 8192
    and coalesce(pg_column_size(levels_seen), 0) < 8192
    and coalesce(pg_column_size(quest_day), 0) < 8192
  )
);

alter table public.user_progress enable row level security;
drop policy if exists "own progress read" on public.user_progress;
drop policy if exists "own progress insert" on public.user_progress;
drop policy if exists "own progress update" on public.user_progress;
create policy "own progress read" on public.user_progress for select to authenticated using (user_id = auth.uid());
create policy "own progress insert" on public.user_progress for insert to authenticated with check (user_id = auth.uid());
create policy "own progress update" on public.user_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.user_progress from anon, authenticated;
grant select, insert, update on public.user_progress to authenticated;
