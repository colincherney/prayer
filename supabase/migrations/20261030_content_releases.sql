-- Dated releases: seasonal and monthly home scenes, the seasonal and monthly companions, and the prayer nook
-- trinkets unlock on their dates without an app update. Paste into the Supabase dashboard SQL editor AFTER 20261030_pet_levels.sql. Safe to run more than once.
-- See supabase/SQL_CHANGES.md for how to revert.
--
-- The art already ships in the app, hidden. The app reads this table (src/lib/releases.ts), and the read policy only
-- returns rows whose release time has passed by the server's clock, so nothing shows early and a phone's clock
-- can't unlock anything. To move a date, update release_at; the app follows the next time it opens.

create table if not exists public.content_releases (
  id text primary key,            -- 'pet:<pet id>' or 'room:<room name>'
  release_at timestamptz not null,
  note text
);

alter table public.content_releases enable row level security;
drop policy if exists "released content is public" on public.content_releases;
create policy "released content is public"
  on public.content_releases for select
  to anon, authenticated
  using (release_at <= now());
revoke all on public.content_releases from anon, authenticated;
grant select on public.content_releases to anon, authenticated;

-- Midnight US Eastern on each date (the time zone handles daylight saving).
insert into public.content_releases (id, release_at, note) values
  ('room:thanksgiving', '2026-11-14 00:00'::timestamp at time zone 'America/New_York', 'Give Thanks home scene'),
  ('pet:turkey',        '2026-11-14 00:00'::timestamp at time zone 'America/New_York', 'Gobbles the Turkey'),
  ('room:christmas',    '2026-12-01 00:00'::timestamp at time zone 'America/New_York', 'God With Us home scene'),
  ('pet:donkey',        '2026-12-01 00:00'::timestamp at time zone 'America/New_York', 'Noel the Donkey'),
  ('pet:rat',           '2027-01-01 00:00'::timestamp at time zone 'America/New_York', 'January: Nib the Rat'),
  ('pet:ox',            '2027-02-01 00:00'::timestamp at time zone 'America/New_York', 'February: Bao the Ox'),
  ('pet:tiger',         '2027-03-01 00:00'::timestamp at time zone 'America/New_York', 'March: Rory the Tiger'),
  ('pet:rabbit',        '2027-04-01 00:00'::timestamp at time zone 'America/New_York', 'April: Mochi the Rabbit'),
  ('pet:loong',         '2027-05-01 00:00'::timestamp at time zone 'America/New_York', 'May: Long the Dragon'),
  ('pet:snake',         '2027-06-01 00:00'::timestamp at time zone 'America/New_York', 'June: Ribbon the Snake'),
  ('pet:horse',         '2027-07-01 00:00'::timestamp at time zone 'America/New_York', 'July: Dash the Horse'),
  ('pet:goat',          '2027-08-01 00:00'::timestamp at time zone 'America/New_York', 'August: Clover the Goat'),
  ('pet:monkey',        '2027-09-01 00:00'::timestamp at time zone 'America/New_York', 'September: Kiki the Monkey'),
  ('pet:rooster',       '2027-10-01 00:00'::timestamp at time zone 'America/New_York', 'October: Dawn the Rooster'),
  ('pet:dog',           '2027-11-01 00:00'::timestamp at time zone 'America/New_York', 'November: Biscuit the Dog'),
  ('pet:pig',           '2027-12-01 00:00'::timestamp at time zone 'America/New_York', 'December: Rosie the Pig'),
  -- 2027 monthly home scenes, then the prayer nook trinkets (two a month)
  ('room:m2027jan', '2027-01-01 00:00'::timestamp at time zone 'America/New_York', 'Jan 2027 home scene'),
  ('room:m2027feb', '2027-02-01 00:00'::timestamp at time zone 'America/New_York', 'Feb 2027 home scene'),
  ('room:m2027mar', '2027-03-01 00:00'::timestamp at time zone 'America/New_York', 'Mar 2027 home scene'),
  ('room:m2027apr', '2027-04-01 00:00'::timestamp at time zone 'America/New_York', 'Apr 2027 home scene'),
  ('room:m2027may', '2027-05-01 00:00'::timestamp at time zone 'America/New_York', 'May 2027 home scene'),
  ('room:m2027jun', '2027-06-01 00:00'::timestamp at time zone 'America/New_York', 'Jun 2027 home scene'),
  ('room:m2027jul', '2027-07-01 00:00'::timestamp at time zone 'America/New_York', 'Jul 2027 home scene'),
  ('room:m2027aug', '2027-08-01 00:00'::timestamp at time zone 'America/New_York', 'Aug 2027 home scene'),
  ('room:m2027sep', '2027-09-01 00:00'::timestamp at time zone 'America/New_York', 'Sep 2027 home scene'),
  ('room:m2027oct', '2027-10-01 00:00'::timestamp at time zone 'America/New_York', 'Oct 2027 home scene'),
  ('room:m2027nov', '2027-11-01 00:00'::timestamp at time zone 'America/New_York', 'Nov 2027 home scene'),
  ('room:m2027dec', '2027-12-01 00:00'::timestamp at time zone 'America/New_York', 'Dec 2027 home scene'),
  ('trinket:firstLightCandle', '2026-11-14 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:loavesFishesBasket', '2026-11-14 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:chapelSnowGlobe', '2026-12-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:shepherdLambPlush', '2026-12-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:olivewoodRosary', '2027-01-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:mustardSeedJar', '2027-01-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:oliveBranchVase', '2027-02-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:quillPrayerJournal', '2027-02-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:lilyOfTheField', '2027-03-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:sevenbellChime', '2027-03-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:hourglassOfStillness', '2027-04-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:doveMusicBox', '2027-04-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:goldenPotOfManna', '2027-05-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:psalmHarp', '2027-05-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:nightWatchLantern', '2027-06-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:harborLighthouse', '2027-06-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:fishersNet', '2027-07-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:galaxyPromiseJar', '2027-07-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:arkInABottle', '2027-08-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:roseWindowSuncatcher', '2027-08-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:covenantPrism', '2027-09-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:jacobsLadderMobile', '2027-09-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:unburntBushBonsai', '2027-10-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket'),
  ('trinket:pearlOfGreatPrice', '2027-10-01 00:00'::timestamp at time zone 'America/New_York', 'Trinket')
on conflict (id) do nothing;

-- The new companions can rest in a group hearth and have their own levels.
alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members add constraint group_members_pet_id_check
  check (pet_id is null or pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'));

alter table public.pet_xp drop constraint if exists pet_xp_pet_id_check;
alter table public.pet_xp add constraint pet_xp_pet_id_check
  check (pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'));

alter table public.pet_state drop constraint if exists pet_state_active_pet_check;
alter table public.pet_state add constraint pet_state_active_pet_check
  check (active_pet in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'));

-- switch_pet() from 20261030_pet_levels.sql, with the longer list of pets.
create or replace function public.switch_pet(p_from text, p_to text, p_total int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array[
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
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

-- Prayer nook trinkets each person has earned (src/lib/trinkets.ts). Written only through earn_trinket().
create table if not exists public.user_trinkets (
  user_id uuid not null references auth.users(id) on delete cascade,
  trinket_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, trinket_id)
);
alter table public.user_trinkets enable row level security;
drop policy if exists "own trinkets read" on public.user_trinkets;
create policy "own trinkets read"
  on public.user_trinkets for select
  to authenticated
  using (user_id = auth.uid());
revoke all on public.user_trinkets from anon, authenticated;
grant select on public.user_trinkets to authenticated;

-- Records a trinket as earned. Only trinkets that are out (a released 'trinket:<id>' row) can be earned.
create or replace function public.earn_trinket(p_trinket text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if not exists (
    select 1 from public.content_releases where id = 'trinket:' || p_trinket and release_at <= now()
  ) then
    raise exception 'not_released';
  end if;
  insert into public.user_trinkets (user_id, trinket_id) values (auth.uid(), p_trinket)
  on conflict do nothing;
end;
$$;
revoke all on function public.earn_trinket(text) from public, anon;
grant execute on function public.earn_trinket(text) to authenticated;
