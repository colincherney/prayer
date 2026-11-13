-- Account deletion failed for anyone with a biography entry: this foreign key had no ON DELETE rule,
-- so deleting the auth user was refused. Every other user table already cascades.
alter table public.biography_entries
  drop constraint biography_entries_user_id_fkey,
  add constraint biography_entries_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
