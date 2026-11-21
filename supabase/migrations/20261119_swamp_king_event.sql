-- The Swamp King: the second long seasonal event, Mar 1 to May 1, 2027 (src/lib/events.ts, src/app/swamp.tsx).
-- It runs on the Long Winter's system (public.events, user_event_progress, community_counters, private.evaluate_event),
-- with the same rules the user chose for winter: all 10 challenges can be done on any day of the event, the Fen
-- Warden comes at 4 challenges, and finishing all 10 gives the Old King and all five keepsakes straight away.
--
-- New here:
--   * four challenge types: shared (prayer requests shared), journal (journal entries), notes (encouragements sent)
--     and quests (daily quests finished), all counted inside the event window;
--   * triggers on those tables, so progress updates as soon as they're saved;
--   * the Vesper companion line ('vesper') in the pet-id checks and switch_pet(), which now only lets someone
--     switch to an event companion they earned in that event;
--   * config.reminders: the reminder wording for each event, read by the notify-winter-event Edge Function;
--   * the event:swampKing content window (the swamp look), midnight US Eastern Mar 1 to midnight May 2.
-- Safe to run again.

insert into public.events (id, title, starts_on, ends_on, is_active, config) values (
  'swamp-king-2027', 'The Swamp King', '2027-03-01', '2027-05-01', true,
  $config${
  "pal_line": "vesper",
  "real_starts_on": "2027-03-01",
  "weeks_start": "2027-03-01",
  "allow_test_dates": false,
  "claim_grace_days": 0,
  "chapters": [
    {
      "key": "lent",
      "title": "Lent",
      "starts_on": "2027-03-01",
      "ends_on": "2027-03-20"
    },
    {
      "key": "holy_week",
      "title": "Holy Week",
      "starts_on": "2027-03-21",
      "ends_on": "2027-04-04"
    },
    {
      "key": "eastertide",
      "title": "Eastertide",
      "starts_on": "2027-04-05",
      "ends_on": "2027-05-01"
    }
  ],
  "evolutions": [
    {
      "stage": 1,
      "name": "Vesper",
      "unlock": {
        "min_event_prayers": 1
      }
    },
    {
      "stage": 2,
      "name": "Fen Warden",
      "unlock": {
        "min_challenges": 4
      }
    },
    {
      "stage": 3,
      "name": "The Old King",
      "unlock": {
        "min_challenges": 10
      }
    }
  ],
  "completion_rewards": [
    "fenLantern",
    "lentenCross",
    "palmBranches",
    "easterLilies",
    "oldKingsCrown"
  ],
  "community_goal": {
    "key": "fen_lights",
    "title": "Light the fen together",
    "target": 2000,
    "reward": "scene:easter",
    "reward_name": "the Easter Dawn nook"
  },
  "reminders": {
    "start": "The Swamp King awakens. Meet Vesper.",
    "mage": "Your Fen Warden is ready. {n} to the Old King.",
    "lord": "Out of the miry clay: the Old King is crowned, and five keepsakes are on your shelf.",
    "halfway": "Halfway through the Swamp King. {n} to go.",
    "last": "{n} left to the Old King."
  },
  "challenges": [
    {
      "key": "first_steps",
      "title": "First Steps",
      "detail": "Pray your first spring prayer",
      "rule": {
        "type": "prayers",
        "min": 1
      }
    },
    {
      "key": "cast_your_burden",
      "title": "Cast Your Burden",
      "detail": "Share 2 prayer requests",
      "rule": {
        "type": "shared",
        "min": 2
      }
    },
    {
      "key": "out_of_the_mire",
      "title": "Out of the Mire",
      "detail": "Reach 20 spring prayers",
      "rule": {
        "type": "prayers",
        "min": 20
      }
    },
    {
      "key": "wisps_in_the_dark",
      "title": "Wisps in the Dark",
      "detail": "Light 10 Vigil candles",
      "rule": {
        "type": "candles",
        "min": 10
      }
    },
    {
      "key": "still_waters",
      "title": "Still Waters",
      "detail": "Write 3 journal entries",
      "rule": {
        "type": "journal",
        "min": 3
      }
    },
    {
      "key": "a_word_of_hope",
      "title": "A Word of Hope",
      "detail": "Send 3 encouragements",
      "rule": {
        "type": "notes",
        "min": 3
      }
    },
    {
      "key": "pilgrims_path",
      "title": "The Pilgrim’s Path",
      "detail": "Finish 7 daily quests",
      "rule": {
        "type": "quests",
        "min": 7
      }
    },
    {
      "key": "kindred_spirits",
      "title": "Kindred Spirits",
      "detail": "Complete 3 prayer-partner sessions",
      "rule": {
        "type": "partner",
        "min": 3
      }
    },
    {
      "key": "steadfast",
      "title": "Steadfast",
      "detail": "Keep a 10-day streak",
      "rule": {
        "type": "streak",
        "min": 10
      }
    },
    {
      "key": "feet_upon_a_rock",
      "title": "Feet Upon a Rock",
      "detail": "Reach 40 spring prayers",
      "rule": {
        "type": "prayers",
        "min": 40
      }
    }
  ]
}$config$::jsonb
)
on conflict (id) do update set
  title = excluded.title, starts_on = excluded.starts_on, ends_on = excluded.ends_on,
  is_active = excluded.is_active, config = excluded.config;

insert into public.community_counters (key, event_id) values ('fen_lights', 'swamp-king-2027')
on conflict do nothing;

-- The Long Winter's reminder wording, now kept in its config like the Swamp King's.
update public.events set config = jsonb_set(config, '{reminders}', '{"start":"The Long Winter has begun. Meet Snowcap.","mage":"Your Frost Mage is ready. {n} to the Frost Lord.","lord":"The Frost Lord is crowned, and five winter keepsakes are on your shelf.","halfway":"Halfway through the Long Winter. {n} to go.","last":"{n} left to the Frost Lord."}'::jsonb)
 where id = 'long-winter-2026';

insert into public.content_windows (id, opens_at, closes_at) values
  ('event:swampKing',
   '2027-03-01 00:00'::timestamp at time zone 'America/New_York',
   '2027-05-02 00:00'::timestamp at time zone 'America/New_York')
on conflict (id, opens_at) do update set closes_at = excluded.closes_at;

create or replace function private.evaluate_event(p_user uuid, p_event text, p_today date default null)
returns public.user_event_progress
language plpgsql security definer set search_path = '' as $$
declare
  e public.events%rowtype;
  c jsonb;
  pr public.user_event_progress%rowtype;
  tz text;
  today date;
  win_from timestamptz;
  win_to timestamptz;
  days date[];
  n_days int;
  n_candles int;
  n_partner int;
  best int := 0;
  cur int := 0;
  ch jsonb;
  r jsonb;
  ok boolean;
  dead boolean;
  have int;
  need int;
  rem int;
  d_from date;
  d_to date;
  wreath_lit int := 0;
  wreath_all boolean := true;
  wreath_dead boolean := false;
  done text[] := '{}';
  closed text[] := '{}';
  avail text[] := '{}';
  stage int;
  ready boolean;
  min_mage int;
  mage_from date;
  min_lord int;
  ws date;
  wk jsonb;
  counter_rewarded timestamptz;
  wk_from date;
  wk_to date;
  wk_need int;
  wk_have int;
  wk_left int;
  hour_days date[];
begin
  select * into e from public.events where id = p_event;
  if not found then
    raise exception 'unknown_event';
  end if;
  c := e.config;

  select * into pr from public.user_event_progress where user_id = p_user and event_id = p_event;
  if found then
    tz := private.safe_tz(pr.tz);
  else
    tz := private.safe_tz((select n.timezone from public.notification_preferences n where n.user_id = p_user));
  end if;
  today := coalesce(p_today, (now() at time zone tz)::date);

  -- the event window in the person's local time
  win_from := e.starts_on::timestamp at time zone tz;
  win_to := (e.ends_on + 1)::timestamp at time zone tz;

  select coalesce(array_agg(distinct (i.created_at at time zone tz)::date order by (i.created_at at time zone tz)::date), '{}'),
         count(*)
    into days, n_candles
    from public.prayer_interactions i
   where i.user_id = p_user and i.action = 'prayed' and i.created_at >= win_from and i.created_at < win_to;
  n_days := coalesce(array_length(days, 1), 0);

  select count(*) into n_partner from public.pair_intents pi
   where pi.user_id = p_user and pi.approved and pi.created_at >= win_from and pi.created_at < win_to;

  -- longest run of consecutive days, and the run that is still going (ending today or yesterday)
  select coalesce(max(len), 0) into best from (
    select count(*) as len from (select d, d - (row_number() over (order by d))::int as grp from unnest(days) d) s group by grp
  ) runs;
  select coalesce(max(len), 0) into cur from (
    select count(*) as len, max(d) as last_day
      from (select d, d - (row_number() over (order by d))::int as grp from unnest(days) d) s group by grp
  ) runs where last_day >= today - 1;

  -- the Advent wreath: each candle lights with enough days prayed in its week
  for wk in select value from jsonb_array_elements(coalesce(c->'advent_wreath', '[]')) loop
    d_from := (wk->>'starts_on')::date;
    d_to := (wk->>'ends_on')::date;
    need := (wk->>'days_needed')::int;
    select count(*) into have from unnest(days) d where d between d_from and d_to;
    if have >= need then
      wreath_lit := wreath_lit + 1;
    else
      wreath_all := false;
      select count(*) into rem from generate_series(greatest(d_from, today), d_to, interval '1 day') g
       where g::date <> all(days);
      if have + rem < need then
        wreath_dead := true;
      end if;
    end if;
  end loop;

  -- the challenges
  for ch in select value from jsonb_array_elements(coalesce(c->'challenges', '[]')) loop
    r := ch->'rule';
    ok := false;
    dead := false;
    need := coalesce((r->>'min')::int, 1);
    case r->>'type'
      when 'prayers' then
        ok := n_days >= need;
        select count(*) into rem from generate_series(greatest(e.starts_on, today), e.ends_on, interval '1 day') g
         where g::date <> all(days);
        dead := not ok and n_days + rem < need;
      when 'candles' then
        ok := n_candles >= need;
        dead := not ok and today > e.ends_on;
      when 'partner' then
        ok := n_partner >= need;
        dead := not ok and today > e.ends_on;
      when 'wreath' then
        ok := wreath_all;
        dead := not ok and wreath_dead;
      when 'weeks' then
        -- any weeks of the event (7-day blocks from its start) with enough days prayed: 3, or 2 in a short last week
        have := 0;
        rem := 0;
        for wk_from in select generate_series(e.starts_on, e.ends_on, interval '7 day')::date loop
          wk_to := least(wk_from + 6, e.ends_on);
          wk_need := coalesce((r->>'days')::int, case when wk_to - wk_from + 1 < 5 then 2 else 3 end);
          select count(*) into wk_have from unnest(days) d where d between wk_from and wk_to;
          if wk_have >= wk_need then
            have := have + 1;
          else
            select count(*) into wk_left from generate_series(greatest(wk_from, today), wk_to, interval '1 day') g
             where g::date <> all(days);
            if wk_have + wk_left >= wk_need then
              rem := rem + 1;
            end if;
          end if;
        end loop;
        ok := have >= need;
        dead := not ok and have + rem < need;
      when 'hours' then
        -- days with a prayer in a local time-of-day window (from_hour inclusive, to_hour exclusive)
        select coalesce(array_agg(distinct (i.created_at at time zone tz)::date), '{}') into hour_days
          from public.prayer_interactions i
         where i.user_id = p_user and i.action = 'prayed' and i.created_at >= win_from and i.created_at < win_to
           and extract(hour from i.created_at at time zone tz) >= (r->>'from_hour')::int
           and extract(hour from i.created_at at time zone tz) < (r->>'to_hour')::int;
        have := coalesce(array_length(hour_days, 1), 0);
        ok := have >= need;
        select count(*) into rem from generate_series(greatest(e.starts_on, today), e.ends_on, interval '1 day') g
         where g::date <> all(hour_days);
        dead := not ok and have + rem < need;
      when 'people' then
        -- different prayer requests prayed for
        select count(distinct i.prayer_id) into have from public.prayer_interactions i
         where i.user_id = p_user and i.action = 'prayed' and i.created_at >= win_from and i.created_at < win_to;
        ok := have >= need;
        dead := not ok and today > e.ends_on;
      -- things done in the event window: prayer requests shared, journal entries, encouragements sent, daily quests
      when 'shared' then
        select count(*) into have from public.prayers x
         where x.user_id = p_user and x.created_at >= win_from and x.created_at < win_to;
        ok := have >= need;
        dead := not ok and today > e.ends_on;
      when 'journal' then
        select count(*) into have from public.biography_entries x
         where x.user_id = p_user and x.created_at >= win_from and x.created_at < win_to;
        ok := have >= need;
        dead := not ok and today > e.ends_on;
      when 'notes' then
        select count(*) into have from public.reflections x
         where x.user_id = p_user and x.created_at >= win_from and x.created_at < win_to;
        ok := have >= need;
        dead := not ok and today > e.ends_on;
      when 'quests' then
        select count(*) into have from public.quest_completions x
         where x.user_id = p_user and x.category <> 'journey' and x.created_at >= win_from and x.created_at < win_to;
        ok := have >= need;
        dead := not ok and today > e.ends_on;
      when 'days_in_range' then
        d_from := (r->>'from')::date;
        d_to := (r->>'to')::date;
        select count(*) into have from unnest(days) d where d between d_from and d_to;
        ok := have >= need;
        select count(*) into rem from generate_series(greatest(d_from, today), d_to, interval '1 day') g
         where g::date <> all(days);
        dead := not ok and have + rem < need;
      when 'streak' then
        ok := best >= need;
        dead := not ok and cur + greatest(e.ends_on - today, 0) + (case when today = any(days) then 0 else 1 end) < need;
      else
        ok := false;
    end case;
    if ok then
      done := done || (ch->>'key');
    elsif dead or today > e.ends_on then
      closed := closed || (ch->>'key');
    end if;
  end loop;

  -- weekly keepsakes: 3 days prayed in that event week (2 in a week shorter than 5 days)
  ws := coalesce((c->>'weeks_start')::date, e.starts_on);
  for wk in select value from jsonb_array_elements(coalesce(c->'weekly_rewards', '[]')) loop
    d_from := ws + 7 * ((wk->>'week')::int - 1);
    d_to := least(d_from + 6, e.ends_on);
    need := coalesce((wk->>'days_needed')::int, case when d_to - d_from + 1 < 5 then 2 else 3 end);
    select count(*) into have from unnest(days) d where d between d_from and d_to;
    if have >= need then
      avail := avail || (wk->>'keepsake');
    end if;
  end loop;

  -- the Frost Lord line
  min_mage := coalesce((c->'evolutions'->1->'unlock'->>'min_challenges')::int, 4);
  mage_from := coalesce((c->'evolutions'->1->'unlock'->>'not_before')::date, e.starts_on);
  min_lord := coalesce((c->'evolutions'->2->'unlock'->>'min_challenges')::int, jsonb_array_length(coalesce(c->'challenges', '[]')));
  stage := coalesce(pr.stage_unlocked, 0);
  if n_days >= 1 then
    stage := greatest(stage, 1);
  end if;
  if coalesce(array_length(done, 1), 0) >= min_mage and today >= mage_from then
    stage := greatest(stage, 2);
  end if;
  ready := coalesce(array_length(done, 1), 0) >= min_lord;
  -- Finishing every challenge is the whole reward: the Frost Lord and all the winter keepsakes, straight away.
  if ready then
    stage := 3;
    for wk in select value from jsonb_array_elements(coalesce(c->'completion_rewards', '[]')) loop
      avail := avail || (wk #>> '{}');
    end loop;
  end if;

  insert into public.user_event_progress as p (
    user_id, event_id, tz, prayer_days, event_prayer_count, candles_lit, partner_sessions, longest_streak,
    stage_unlocked, frost_lord_ready, wreath_candles_lit, challenges_completed, challenges_closed,
    rewards_available, evaluated_on, updated_at)
  values (
    p_user, p_event, tz, days, n_days, n_candles, n_partner, best,
    stage, ready, wreath_lit, done, closed, avail, today, now())
  on conflict (user_id, event_id) do update set
    prayer_days = excluded.prayer_days,
    event_prayer_count = excluded.event_prayer_count,
    candles_lit = excluded.candles_lit,
    partner_sessions = excluded.partner_sessions,
    longest_streak = excluded.longest_streak,
    stage_unlocked = greatest(p.stage_unlocked, excluded.stage_unlocked),
    frost_lord_ready = excluded.frost_lord_ready or p.stage_unlocked = 3,
    wreath_candles_lit = excluded.wreath_candles_lit,
    challenges_completed = excluded.challenges_completed,
    challenges_closed = excluded.challenges_closed,
    rewards_available = excluded.rewards_available,
    evaluated_on = excluded.evaluated_on,
    updated_at = now()
  returning * into pr;

  if ready then
    insert into public.user_trinkets (user_id, trinket_id)
    select p_user, x from unnest(avail) x
    on conflict do nothing;
    update public.user_event_progress
       set rewards_claimed = array(select distinct x from unnest(rewards_claimed || avail || array['frost_lord']) x order by x)
     where user_id = p_user and event_id = p_event
    returning * into pr;
  end if;

  -- the community reward reaches late joiners too
  select cc.rewarded_at into counter_rewarded from public.community_counters cc
   where cc.event_id = p_event and cc.key = c->'community_goal'->>'key';
  if counter_rewarded is not null and n_days >= 1
     and exists (select 1 from public.cosmetic_products where id = c->'community_goal'->>'reward') then
    insert into public.user_cosmetics (user_id, product_id, source)
    values (p_user, c->'community_goal'->>'reward', 'grant')
    on conflict do nothing;
  end if;

  return pr;
end;
$$;

revoke all on function private.evaluate_event(uuid, text, date) from public;

-- Progress updates as soon as a shared request, journal entry, encouragement or daily quest is saved.
drop trigger if exists event_activity_on_prayer_shared on public.prayers;
create trigger event_activity_on_prayer_shared after insert on public.prayers
  for each row execute function private.on_event_activity();
drop trigger if exists event_activity_on_journal on public.biography_entries;
create trigger event_activity_on_journal after insert on public.biography_entries
  for each row execute function private.on_event_activity();
drop trigger if exists event_activity_on_note on public.reflections;
create trigger event_activity_on_note after insert on public.reflections
  for each row execute function private.on_event_activity();
drop trigger if exists event_activity_on_quest on public.quest_completions;
create trigger event_activity_on_quest after insert on public.quest_completions
  for each row execute function private.on_event_activity();

-- The Vesper line.
alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members add constraint group_members_pet_id_check
  check (pet_id is null or pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord', 'vesper'));
alter table public.pet_xp drop constraint if exists pet_xp_pet_id_check;
alter table public.pet_xp add constraint pet_xp_pet_id_check
  check (pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord', 'vesper'));
alter table public.pet_state drop constraint if exists pet_state_active_pet_check;
alter table public.pet_state add constraint pet_state_active_pet_check
  check (active_pet in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord', 'vesper'));

create or replace function public.switch_pet(p_from text, p_to text, p_total integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array[
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord', 'vesper'];
  st public.pet_state%rowtype;
  total int;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if not (p_from = any(allowed)) or not (p_to = any(allowed)) then
    raise exception 'unknown_pet';
  end if;
  -- an event companion only for someone who met it in its own event
  if exists (select 1 from public.events ev where ev.config->>'pal_line' = p_to) and not exists (
    select 1 from public.user_event_progress up join public.events ev on ev.id = up.event_id
     where up.user_id = uid and up.stage_unlocked >= 1 and ev.config->>'pal_line' = p_to
  ) then
    raise exception 'not_owned';
  end if;
  total := public.account_xp(uid);

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
$function$;
