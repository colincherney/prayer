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
-- The child tables of prayers (prayer_interactions, reflections,
-- prayer_updates, ...) predate the repo migrations, so their FKs may not
-- cascade. Recreate EVERY non-cascading FK that points at prayers, so
-- deleting a prayer (or a whole group) can neither fail on leftover child
-- rows nor orphan them — deletion must wipe everything, that's the privacy
-- promise.
do $$
declare
  r record;
  col text;
begin
  for r in
    select con.conname, con.conrelid, con.conkey, rel.relname as child
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_class frel on frel.oid = con.confrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where frel.relname = 'prayers'
      and n.nspname = 'public'
      and con.contype = 'f'
      and con.confdeltype <> 'c'
  loop
    select a.attname into col
    from pg_attribute a
    where a.attrelid = r.conrelid and a.attnum = r.conkey[1];

    execute format('alter table %I drop constraint %I', r.child, r.conname);
    execute format(
      'alter table %I add constraint %I foreign key (%I) references prayers(id) on delete cascade',
      r.child, r.conname, col
    );
  end loop;

  -- prayer_interactions might have no FK at all; make sure it gets one.
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
