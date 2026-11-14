-- The look of the app follows the account too: { theme, room, mode }. Safe to run again.
alter table public.user_progress add column if not exists appearance jsonb;
alter table public.user_progress drop constraint if exists user_progress_appearance_size;
alter table public.user_progress add constraint user_progress_appearance_size check (coalesce(pg_column_size(appearance), 0) < 1024);
