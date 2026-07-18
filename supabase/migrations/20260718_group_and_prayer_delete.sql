-- Owners can delete their group; authors can delete their own prayers
-- (anywhere, including inside a group).

-- ---------- group deletion ----------
-- Only the creator/owner may delete. The existing cascades already wipe
-- group_members and the group's prayers with it.
drop policy if exists "groups owner delete" on groups;
create policy "groups owner delete"
  on groups for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from group_members m
      where m.group_id = groups.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- ---------- prayer deletion ----------
-- prayer_interactions predates the repo migrations, so its FK to prayers may
-- not cascade. Recreate any non-cascading FK so deleting a prayer can't fail
-- on leftover "prayed" rows.
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_class frel on frel.oid = con.confrelid
    where rel.relname = 'prayer_interactions'
      and frel.relname = 'prayers'
      and con.contype = 'f'
      and con.confdeltype <> 'c'
  loop
    execute format('alter table prayer_interactions drop constraint %I', r.conname);
  end loop;

  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_class frel on frel.oid = con.confrelid
    where rel.relname = 'prayer_interactions'
      and frel.relname = 'prayers'
      and con.contype = 'f'
  ) then
    alter table prayer_interactions
      add constraint prayer_interactions_prayer_id_fkey
      foreign key (prayer_id) references prayers(id) on delete cascade;
  end if;
end $$;

drop policy if exists "prayers self delete" on prayers;
create policy "prayers self delete"
  on prayers for delete
  using (user_id = auth.uid());
