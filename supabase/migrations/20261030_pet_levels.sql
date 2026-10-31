-- Per-pet levels: each companion only grows from XP earned while it was the active pet.
-- Paste into the Supabase dashboard SQL editor. Safe to run more than once. See supabase/SQL_CHANGES.md for how to revert.
--
-- The account's total XP is still worked out by the app (src/lib/pet.ts). A pet's XP is
--   banked_xp (from its earlier turns as the active pet)
--   + (total XP now - active_since_xp), if it is the active pet.
-- A user with no pet_state row yet gets one with their current pet active from 0 XP,
-- so the pet they have now keeps everything earned before this change.

-- XP each pet banked during its earlier turns as the active pet.
create table if not exists public.pet_xp (
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id text not null,
  banked_xp integer not null default 0,
  primary key (user_id, pet_id)
);
alter table public.pet_xp drop constraint if exists pet_xp_pet_id_check;
alter table public.pet_xp add constraint pet_xp_pet_id_check
  check (pet_id in ('lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin'));
alter table public.pet_xp drop constraint if exists pet_xp_banked_xp_check;
alter table public.pet_xp add constraint pet_xp_banked_xp_check check (banked_xp >= 0);

-- Which pet is active, and the account's total XP when it became active.
create table if not exists public.pet_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_pet text not null,
  active_since_xp integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.pet_state drop constraint if exists pet_state_active_pet_check;
alter table public.pet_state add constraint pet_state_active_pet_check
  check (active_pet in ('lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin'));

alter table public.pet_xp enable row level security;
alter table public.pet_state enable row level security;
drop policy if exists "pet xp own read" on public.pet_xp;
create policy "pet xp own read"
  on public.pet_xp for select
  to authenticated
  using (user_id = auth.uid());
drop policy if exists "pet state own read" on public.pet_state;
create policy "pet state own read"
  on public.pet_state for select
  to authenticated
  using (user_id = auth.uid());
-- The app can only read; writes go through switch_pet().
revoke all on public.pet_xp from anon, authenticated;
revoke all on public.pet_state from anon, authenticated;
grant select on public.pet_xp, public.pet_state to authenticated;

-- Makes p_to the active pet. The pet that was active banks what it earned during its turn.
-- p_from is the pet the app thinks is active; it is only used when the user has no pet_state row yet.
-- Calling it with p_from = p_to just creates the row (used on first load).
create or replace function public.switch_pet(p_from text, p_to text, p_total int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array['lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin'];
  st public.pet_state%rowtype;
  total int := greatest(coalesce(p_total, 0), 0);
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if not (p_from = any(allowed)) or not (p_to = any(allowed)) then
    raise exception 'unknown_pet';
  end if;

  select * into st from public.pet_state where user_id = uid for update;
  if not found then
    insert into public.pet_state (user_id, active_pet, active_since_xp)
    values (uid, p_from, 0)
    on conflict (user_id) do nothing;
    select * into st from public.pet_state where user_id = uid for update;
  end if;

  if st.active_pet = p_to then
    return;
  end if;

  insert into public.pet_xp (user_id, pet_id, banked_xp)
  values (uid, st.active_pet, greatest(total - st.active_since_xp, 0))
  on conflict (user_id, pet_id)
    do update set banked_xp = public.pet_xp.banked_xp + excluded.banked_xp;

  update public.pet_state
     set active_pet = p_to, active_since_xp = total, updated_at = now()
   where user_id = uid;
end;
$$;
revoke all on function public.switch_pet(text, text, int) from public, anon;
grant execute on function public.switch_pet(text, text, int) to authenticated;
