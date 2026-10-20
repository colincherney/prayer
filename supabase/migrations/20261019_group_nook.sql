-- Group "hearth": each member's chosen pet rests there (never names), and members can decorate it.
-- Applied to the live project on 2026-10-19. See supabase/SQL_CHANGES.md for how to revert.

-- Which pet each member shows in the hearth. Set only through set_my_group_pet() below.
alter table public.group_members add column if not exists pet_id text;
alter table public.group_members add column if not exists pet_stage smallint;
alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members add constraint group_members_pet_id_check
  check (pet_id is null or pet_id in ('lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin'));
alter table public.group_members drop constraint if exists group_members_pet_stage_check;
alter table public.group_members add constraint group_members_pet_stage_check
  check (pet_stage is null or pet_stage between 1 and 3);

-- The decor a group has placed in its hearth (a list of item ids; see src/components/pets/Hearth.tsx).
create table if not exists public.group_nooks (
  group_id uuid primary key references public.groups(id) on delete cascade,
  decor jsonb not null default '[]'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.group_nooks enable row level security;
drop policy if exists "group nook members read" on public.group_nooks;
create policy "group nook members read"
  on public.group_nooks for select
  to authenticated
  using (public.is_group_member(group_id));
-- The app can only read; writes go through save_group_nook().
revoke all on public.group_nooks from anon, authenticated;
grant select on public.group_nooks to authenticated;

-- A member records which pet they show in a group. Touches only their own row, and only these two columns.
create or replace function public.set_my_group_pet(p_group uuid, p_pet text, p_stage int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.group_members
     set pet_id = p_pet, pet_stage = p_stage
   where group_id = p_group and user_id = auth.uid();
$$;

-- A member saves the group's decor. Only known item ids are accepted, at most 12.
create or replace function public.save_group_nook(p_group uuid, p_decor jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed constant text[] := array['garland', 'stockings', 'wreath', 'cross', 'candles', 'plant', 'tree', 'lantern'];
  cleaned jsonb;
begin
  if auth.uid() is null or not public.is_group_member(p_group) then
    raise exception 'not_a_member';
  end if;
  if jsonb_typeof(p_decor) <> 'array' then
    raise exception 'invalid_decor';
  end if;
  select coalesce(jsonb_agg(distinct v), '[]'::jsonb)
    into cleaned
    from jsonb_array_elements_text(p_decor) as t(v)
   where v = any (allowed);
  if jsonb_array_length(cleaned) > 12 then
    raise exception 'too_many';
  end if;
  insert into public.group_nooks (group_id, decor, updated_by, updated_at)
  values (p_group, cleaned, auth.uid(), now())
  on conflict (group_id) do update
     set decor = excluded.decor, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
end;
$$;

revoke execute on function public.set_my_group_pet(uuid, text, int) from public, anon;
revoke execute on function public.save_group_nook(uuid, jsonb) from public, anon;
grant execute on function public.set_my_group_pet(uuid, text, int) to authenticated;
grant execute on function public.save_group_nook(uuid, jsonb) to authenticated;
