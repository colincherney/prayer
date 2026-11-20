-- The Beloved: the Valentine event, Feb 1 to Feb 28, 2027, between the Long Winter (ends Jan 31) and the Swamp King
-- (starts Mar 1). It runs on the same system as the other two (public.events, user_event_progress, community_counters,
-- private.evaluate_event): no new tables.
--
-- Shorter and easier than the two-month events, because it's one month:
--   * 6 challenges instead of 10, every one doable on any day of the event (a late comer on Feb 27 can still finish);
--   * the Muse comes at 3 challenges, The Beloved at all 6;
--   * finishing all 6 gives The Beloved, her Seraph spirit form (a second look for her final stage that the app lets
--     you switch to; the database only needs stage 3) and four keepsakes, straight away.
--
-- Also: the 'beloved' companion line in the pet-id checks and switch_pet(), the event:beloved content window (the
-- rose-garden look, midnight US Eastern Feb 1 to midnight Mar 1), and the community counter. Safe to run again.

insert into public.events (id, title, starts_on, ends_on, is_active, config) values (
  'beloved-2027', 'The Beloved', '2027-02-01', '2027-02-28', true,
  $config${
  "pal_line": "beloved",
  "real_starts_on": "2027-02-01",
  "weeks_start": "2027-02-01",
  "allow_test_dates": false,
  "claim_grace_days": 0,
  "chapters": [
    { "key": "song_of_songs", "title": "Song of Songs", "starts_on": "2027-02-01", "ends_on": "2027-02-13" },
    { "key": "valentines", "title": "Valentine’s", "starts_on": "2027-02-14", "ends_on": "2027-02-14" },
    { "key": "love_never_fails", "title": "Love Never Fails", "starts_on": "2027-02-15", "ends_on": "2027-02-28" }
  ],
  "evolutions": [
    { "stage": 1, "name": "Cherub", "unlock": { "min_event_prayers": 1 } },
    { "stage": 2, "name": "Muse", "unlock": { "min_challenges": 3 } },
    { "stage": 3, "name": "The Beloved", "unlock": { "min_challenges": 6 } }
  ],
  "forms": [
    { "key": "marble", "name": "Marble" },
    { "key": "spirit", "name": "Seraph", "kind": "spirit_form" }
  ],
  "completion_rewards": ["loveLetter", "roseBouquet", "goldenLyre", "marbleHeart"],
  "community_goal": {
    "key": "garden_of_candles",
    "title": "A garden of candles",
    "target": 1500,
    "reward": "scene:blossom",
    "reward_name": "the Blossom Bridge nook"
  },
  "reminders": {
    "start": "The Beloved has arrived. Meet your Cherub.",
    "mage": "Your Muse is ready. {n} to The Beloved.",
    "lord": "Many waters cannot quench love: The Beloved is yours, Seraph form and all.",
    "halfway": "Halfway through the Beloved. {n} to go.",
    "last": "{n} left to The Beloved."
  },
  "challenges": [
    { "key": "first_love", "title": "First Love", "detail": "Pray your first Valentine prayer", "rule": { "type": "candles", "min": 1 } },
    { "key": "song_of_songs", "title": "Song of Songs", "detail": "Pray 10 Valentine prayers", "rule": { "type": "candles", "min": 10 } },
    { "key": "light_for_a_stranger", "title": "A Light for a Stranger", "detail": "Pray for 5 different requests", "rule": { "type": "people", "min": 5 } },
    { "key": "love_letters", "title": "Love Letters", "detail": "Write 2 journal entries", "rule": { "type": "journal", "min": 2 } },
    { "key": "love_is_kind", "title": "Love Is Kind", "detail": "Send 2 encouragements", "rule": { "type": "notes", "min": 2 } },
    { "key": "love_never_fails", "title": "Love Never Fails", "detail": "Pray 20 Valentine prayers", "rule": { "type": "candles", "min": 20 } }
  ]
}$config$::jsonb
)
on conflict (id) do update set
  title = excluded.title, starts_on = excluded.starts_on, ends_on = excluded.ends_on,
  is_active = excluded.is_active, config = excluded.config;

insert into public.community_counters (key, event_id) values ('garden_of_candles', 'beloved-2027')
on conflict do nothing;

insert into public.content_windows (id, opens_at, closes_at) values
  ('event:beloved',
   '2027-02-01 00:00'::timestamp at time zone 'America/New_York',
   '2027-03-01 00:00'::timestamp at time zone 'America/New_York')
on conflict (id, opens_at) do update set closes_at = excluded.closes_at;

-- The Beloved line.
alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members add constraint group_members_pet_id_check
  check (pet_id is null or pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
    'frostLord', 'vesper', 'beloved'));
alter table public.pet_xp drop constraint if exists pet_xp_pet_id_check;
alter table public.pet_xp add constraint pet_xp_pet_id_check
  check (pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
    'frostLord', 'vesper', 'beloved'));
alter table public.pet_state drop constraint if exists pet_state_active_pet_check;
alter table public.pet_state add constraint pet_state_active_pet_check
  check (active_pet in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
    'frostLord', 'vesper', 'beloved'));

create or replace function public.switch_pet(p_from text, p_to text, p_total integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array['lamb','dove','lion','ember','dragon','pumpkin','turkey','donkey','rat','ox','tiger','rabbit','loong','snake','horse','goat','monkey','rooster','dog','pig','frostLord','vesper','beloved'];
  st public.pet_state%rowtype;
  total int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not (p_from = any(allowed)) or not (p_to = any(allowed)) then raise exception 'unknown_pet'; end if;
  -- an event companion only for someone who met it in its own event
  if exists (select 1 from public.events ev where ev.config->>'pal_line' = p_to) and not exists (
    select 1 from public.user_event_progress up join public.events ev on ev.id = up.event_id
     where up.user_id = uid and up.stage_unlocked >= 1 and ev.config->>'pal_line' = p_to
  ) then raise exception 'not_owned'; end if;
  total := public.account_xp(uid);
  select * into st from public.pet_state where user_id = uid for update;
  if not found then
    insert into public.pet_state (user_id, active_pet, active_since_xp) values (uid, p_from, 0) on conflict (user_id) do nothing;
    select * into st from public.pet_state where user_id = uid for update;
  end if;
  if st.active_pet = p_to then return; end if;
  insert into public.pet_xp (user_id, pet_id, banked_xp) values (uid, st.active_pet, greatest(total - st.active_since_xp, 0))
  on conflict (user_id, pet_id) do update set banked_xp = public.pet_xp.banked_xp + excluded.banked_xp;
  update public.pet_state set active_pet = p_to, active_since_xp = total, updated_at = now() where user_id = uid;
end;
$function$;
