-- Highlighting verses earns XP too: +2 each. One highlight per verse, so recoloring or re-highlighting can't stack it.

create table if not exists public.bible_highlights (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book text not null check (char_length(book) between 1 and 40),
  chapter integer not null check (chapter between 1 and 150),
  verse integer not null check (verse between 1 and 200),
  color text not null default 'gold' check (color in ('gold', 'rose', 'sage', 'sky')),
  created_at timestamptz not null default now(),
  primary key (user_id, book, chapter, verse)
);
alter table public.bible_highlights enable row level security;
create policy "bible_highlights own select" on public.bible_highlights for select using (user_id = auth.uid());
create policy "bible_highlights own insert" on public.bible_highlights for insert with check (user_id = auth.uid());
create policy "bible_highlights own update" on public.bible_highlights for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bible_highlights own delete" on public.bible_highlights for delete using (user_id = auth.uid());

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
    + (select count(*) from bible_highlights where user_id = uid) * 2
  )::integer;
$function$;
revoke all on function public.account_xp(uuid) from public, anon, authenticated;
