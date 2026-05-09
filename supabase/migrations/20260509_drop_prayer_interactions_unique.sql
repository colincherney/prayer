-- Drop unique constraint(s) on prayer_interactions(prayer_id, user_id[, action]).
-- Needed so the synthetic-engagement bot can insert many "prayed" rows per prayer.
-- Real-user uniqueness is enforced client-side (explore.tsx filters already-prayed prayers from the feed).

do $$
declare
  r record;
begin
  -- Drop any UNIQUE table constraints on prayer_interactions whose columns include both prayer_id and user_id.
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'prayer_interactions'
      and c.contype = 'u'
      and exists (
        select 1 from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
        where a.attname = 'prayer_id'
      )
      and exists (
        select 1 from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
        where a.attname = 'user_id'
      )
  loop
    execute format('alter table prayer_interactions drop constraint %I', r.conname);
    raise notice 'dropped constraint %', r.conname;
  end loop;

  -- Drop any UNIQUE indexes (not backing a constraint) covering prayer_id + user_id.
  for r in
    select i.indexname
    from pg_indexes i
    join pg_class c on c.relname = i.indexname
    join pg_index x on x.indexrelid = c.oid
    where i.tablename = 'prayer_interactions'
      and x.indisunique
      and not exists (select 1 from pg_constraint pc where pc.conindid = c.oid)
      and i.indexdef ilike '%prayer_id%'
      and i.indexdef ilike '%user_id%'
  loop
    execute format('drop index if exists %I', r.indexname);
    raise notice 'dropped index %', r.indexname;
  end loop;
end$$;
