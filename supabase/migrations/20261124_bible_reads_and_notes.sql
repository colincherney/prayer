-- Reading the Bible and taking notes on it now earn XP for your companion.

create table if not exists public.bible_reads (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book text not null check (char_length(book) between 1 and 40),
  chapter integer not null check (chapter between 1 and 150),
  read_on date not null default current_date,
  created_at timestamptz not null default now(),
  -- One read per chapter per day counts, so reopening a chapter can't stack XP.
  primary key (user_id, book, chapter, read_on)
);
alter table public.bible_reads enable row level security;
create policy "bible_reads own select" on public.bible_reads for select using (user_id = auth.uid());
create policy "bible_reads own insert" on public.bible_reads for insert with check (user_id = auth.uid() and read_on = current_date);

create table if not exists public.bible_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book text not null check (char_length(book) between 1 and 40),
  chapter integer not null check (chapter between 1 and 150),
  verse integer check (verse between 1 and 200),
  version text not null default 'KJV' check (version in ('KJV', 'CPVD')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bible_notes_user_chapter on public.bible_notes (user_id, book, chapter);
alter table public.bible_notes enable row level security;
create policy "bible_notes own select" on public.bible_notes for select using (user_id = auth.uid());
create policy "bible_notes own insert" on public.bible_notes for insert with check (user_id = auth.uid());
create policy "bible_notes own update" on public.bible_notes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bible_notes own delete" on public.bible_notes for delete using (user_id = auth.uid());

-- Keep in step with xpFromCounts() in src/lib/pet.ts.
create or replace function public.account_xp(uid uuid)
 returns integer
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select (
      (select count(*) from prayer_interactions where user_id = uid and action = 'prayed') * 10
    + (select count(*) from prayers where user_id = uid) * 20
    + (select count(*) from biography_entries where user_id = uid) * 5
    + (select coalesce(sum(xp), 0) from quest_completions where user_id = uid)
    + (select count(*) from bible_reads where user_id = uid) * 3
    + (select count(*) from bible_notes where user_id = uid) * 5
  )::integer;
$function$;
revoke all on function public.account_xp(uuid) from public, anon, authenticated;
