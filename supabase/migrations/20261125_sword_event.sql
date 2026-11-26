-- The Sword of the Spirit: the June event, Jun 1 to Jun 30, 2027 (src/app/sword.tsx), after the Swamp King (ends May 1).
-- It runs on the same system as the others (public.events, user_event_progress, community_counters,
-- private.evaluate_event): no new tables.
--
-- One month, so it's built like the Beloved:
--   * 6 challenges, every one doable on any day of the event (a late comer on Jun 29 can still finish);
--   * Shard comes with the first June prayer, Gladi at 3 challenges, Gladius at all 6;
--   * finishing all 6 gives Gladius and four keepsakes (the armour of God, Ephesians 6), straight away.
--
-- Also: the 'gladi' companion line in the pet-id checks and switch_pet(), the event:sword content window (the
-- sword-in-the-lake look, midnight US Eastern Jun 1 to midnight Jul 1), and the community counter. Safe to run again.

insert into public.events (id, title, starts_on, ends_on, is_active, config) values (
  'sword-2027', 'The Sword of the Spirit', '2027-06-01', '2027-06-30', true,
  $config${
  "pal_line": "gladi",
  "real_starts_on": "2027-06-01",
  "weeks_start": "2027-06-01",
  "allow_test_dates": false,
  "claim_grace_days": 0,
  "chapters": [
    { "key": "take_up", "title": "Take Up the Sword", "starts_on": "2027-06-01", "ends_on": "2027-06-10" },
    { "key": "stand_firm", "title": "Stand Firm", "starts_on": "2027-06-11", "ends_on": "2027-06-20" },
    { "key": "praying_always", "title": "Praying Always", "starts_on": "2027-06-21", "ends_on": "2027-06-30" }
  ],
  "evolutions": [
    { "stage": 1, "name": "Shard", "unlock": { "min_event_prayers": 1 } },
    { "stage": 2, "name": "Gladi", "unlock": { "min_challenges": 3 } },
    { "stage": 3, "name": "Gladius", "unlock": { "min_challenges": 6 } }
  ],
  "completion_rewards": ["beltOfTruth", "breastplate", "shieldOfFaith", "helmetOfSalvation"],
  "community_goal": {
    "key": "swords_raised",
    "title": "Light the lake together",
    "target": 1500,
    "reward": "scene:galilee",
    "reward_name": "the Sea of Galilee nook"
  },
  "reminders": {
    "start": "The Sword of the Spirit is here. Meet Shard.",
    "mage": "Your Gladi is ready. {n} to Gladius.",
    "lord": "Gladius is forged, and the whole armour of God is on your shelf.",
    "halfway": "Halfway through the Sword of the Spirit. {n} to go.",
    "last": "{n} left to Gladius."
  },
  "challenges": [
    { "key": "take_up_the_sword", "title": "Take Up the Sword", "detail": "Pray your first June prayer", "rule": { "type": "candles", "min": 1 } },
    { "key": "word_of_god", "title": "The Word of God", "detail": "Pray 10 June prayers", "rule": { "type": "candles", "min": 10 } },
    { "key": "stand_firm", "title": "Stand Firm", "detail": "Pray for 5 different requests", "rule": { "type": "people", "min": 5 } },
    { "key": "shield_of_faith", "title": "Shield of Faith", "detail": "Share 2 prayer requests", "rule": { "type": "shared", "min": 2 } },
    { "key": "sharper_than_any_sword", "title": "Sharper Than Any Sword", "detail": "Write 2 journal entries", "rule": { "type": "journal", "min": 2 } },
    { "key": "praying_always", "title": "Praying Always", "detail": "Pray 25 June prayers", "rule": { "type": "candles", "min": 25 } }
  ]
}$config$::jsonb
)
on conflict (id) do update set
  title = excluded.title, starts_on = excluded.starts_on, ends_on = excluded.ends_on,
  is_active = excluded.is_active, config = excluded.config;

insert into public.community_counters (key, event_id) values ('swords_raised', 'sword-2027')
on conflict do nothing;

insert into public.content_windows (id, opens_at, closes_at) values
  ('event:sword',
   '2027-06-01 00:00'::timestamp at time zone 'America/New_York',
   '2027-07-01 00:00'::timestamp at time zone 'America/New_York')
on conflict (id, opens_at) do update set closes_at = excluded.closes_at;

-- The Gladi line.
alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members add constraint group_members_pet_id_check
  check (pet_id is null or pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
    'frostLord', 'vesper', 'beloved', 'gladi'));
alter table public.pet_xp drop constraint if exists pet_xp_pet_id_check;
alter table public.pet_xp add constraint pet_xp_pet_id_check
  check (pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
    'frostLord', 'vesper', 'beloved', 'gladi'));
alter table public.pet_state drop constraint if exists pet_state_active_pet_check;
alter table public.pet_state add constraint pet_state_active_pet_check
  check (active_pet in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
    'frostLord', 'vesper', 'beloved', 'gladi'));

create or replace function public.switch_pet(p_from text, p_to text, p_total integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array['lamb','dove','lion','ember','dragon','pumpkin','turkey','donkey','rat','ox','tiger','rabbit','loong','snake','horse','goat','monkey','rooster','dog','pig','frostLord','vesper','beloved','gladi'];
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
