-- The Long Winter: the app's first long seasonal event (src/lib/winterEvent.ts, src/app/winter.tsx).
--
-- Everything about the event is data in public.events (dates, chapters, challenges, rewards, the community goal),
-- so it can be changed without an app update. Progress is worked out here in the database from the records the app
-- already writes, never sent by the phone:
--   * a "winter prayer" is a local day with at least one prayed row in public.prayer_interactions (at most one a day);
--   * a Vigil candle is one prayed row (lighting a candle in the Vigil is how the app records praying for someone);
--   * a prayer-partner session is one row in public.pair_intents.
-- Days are the person's local calendar days, like the app's streak (which uses the phone's local time). The phone
-- sends its timezone when it opens the event; until then the notification timezone, then US Eastern, is used.
--
-- TESTING: the event is set to start today (2026-11-18) and allow_test_dates is on, so the dev-only date picker can
-- preview later dates. Before launch, run the "Launch settings" block at the bottom of supabase/SQL_CHANGES.md
-- (starts_on back to 2026-12-01, allow_test_dates off, the event:winterLord window back to Dec 1).
--
-- Safe to run again (it resets the event row's dates and config to what's written here).

create schema if not exists private;

-- 1. Events -----------------------------------------------------------------------------------------------------------

create table if not exists public.events (
  id text primary key,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
alter table public.events enable row level security;
drop policy if exists "events readable" on public.events;
create policy "events readable" on public.events for select to anon, authenticated using (true);
revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;

insert into public.events (id, title, starts_on, ends_on, is_active, config) values (
  'long-winter-2026',
  'The Long Winter',
  '2026-11-18', -- TESTING; the real start is 2026-12-01 (config.real_starts_on)
  '2027-01-31',
  true,
  $config$
  {
    "pal_line": "frostLord",
    "real_starts_on": "2026-12-01",
    "weeks_start": "2026-12-01",
    "allow_test_dates": true,
    "claim_grace_days": 7,
    "chapters": [
      { "key": "advent",        "title": "Advent",        "starts_on": "2026-12-01", "ends_on": "2026-12-24" },
      { "key": "christmastide", "title": "Christmastide", "starts_on": "2026-12-25", "ends_on": "2027-01-10" },
      { "key": "candlemas",     "title": "Candlemas",     "starts_on": "2027-01-11", "ends_on": "2027-01-31" }
    ],
    "evolutions": [
      { "stage": 1, "name": "Snowcap",    "unlock": { "min_event_prayers": 1 } },
      { "stage": 2, "name": "Frost Mage", "unlock": { "min_challenges": 4, "not_before": "2026-12-25" } },
      { "stage": 3, "name": "Frost Lord", "unlock": { "min_challenges": 10, "claim": true } }
    ],
    "advent_wreath": [
      { "candle": 1, "color": "purple", "starts_on": "2026-12-01", "ends_on": "2026-12-07", "days_needed": 3 },
      { "candle": 2, "color": "purple", "starts_on": "2026-12-08", "ends_on": "2026-12-14", "days_needed": 3 },
      { "candle": 3, "color": "pink",   "starts_on": "2026-12-15", "ends_on": "2026-12-21", "days_needed": 3 },
      { "candle": 4, "color": "purple", "starts_on": "2026-12-22", "ends_on": "2026-12-24", "days_needed": 2 }
    ],
    "weeks": [
      { "week": 1, "title": "Hope",                 "chapter": "advent" },
      { "week": 2, "title": "Peace",                "chapter": "advent" },
      { "week": 3, "title": "Gaudete",              "chapter": "advent" },
      { "week": 4, "title": "Christmas Day",        "chapter": "christmastide" },
      { "week": 5, "title": "Holy Family",          "chapter": "christmastide" },
      { "week": 6, "title": "Epiphany",             "chapter": "christmastide" },
      { "week": 7, "title": "Baptism of the Lord",  "chapter": "candlemas" },
      { "week": 8, "title": "Light to the Nations", "chapter": "candlemas" },
      { "week": 9, "title": "The Presentation",     "chapter": "candlemas" }
    ],
    "weekly_rewards": [
      { "week": 1, "keepsake": "adventWreath" },
      { "week": 4, "keepsake": "christmasStar" },
      { "week": 5, "keepsake": "winterSnowGlobe" },
      { "week": 6, "keepsake": "threeKingsCrown" },
      { "week": 9, "keepsake": "candlemasCandles" }
    ],
    "community_goal": { "key": "winter_lights", "title": "Winter lights", "target": 2000, "reward": "scene:aurora", "reward_name": "the Aurora nook" },
    "challenges": [
      { "key": "first_light",   "title": "First Light",              "detail": "Pray your first winter prayer",                    "rule": { "type": "prayers", "min": 1 } },
      { "key": "advent_wreath", "title": "Advent Wreath",            "detail": "Light all 4 wreath candles",                       "rule": { "type": "wreath" } },
      { "key": "snow_like_wool","title": "Snow Like Wool",           "detail": "Reach 15 winter prayers",                          "rule": { "type": "prayers", "min": 15 } },
      { "key": "stranger",      "title": "A Light for a Stranger",   "detail": "Light 5 Vigil candles",                            "rule": { "type": "candles", "min": 5 } },
      { "key": "christmas",     "title": "Christmas Prayer",         "detail": "Pray on Dec 24 or Dec 25",                         "rule": { "type": "days_in_range", "from": "2026-12-24", "to": "2026-12-25", "min": 1 } },
      { "key": "two_souls",     "title": "Two Souls",                "detail": "Complete 2 prayer-partner sessions",               "rule": { "type": "partner", "min": 2 } },
      { "key": "twelve_days",   "title": "Twelve Days",              "detail": "Pray on 6 of the 12 days of Christmas",            "rule": { "type": "days_in_range", "from": "2026-12-25", "to": "2027-01-05", "min": 6 } },
      { "key": "hoarfrost",     "title": "Hoarfrost",                "detail": "Keep a 7-day streak",                              "rule": { "type": "streak", "min": 7 } },
      { "key": "word_melts",    "title": "The Word Melts the Frost", "detail": "Reach 40 winter prayers",                          "rule": { "type": "prayers", "min": 40 } },
      { "key": "candlemas",     "title": "Candlemas",                "detail": "Pray on any day from Jan 24 to Jan 31",            "rule": { "type": "days_in_range", "from": "2027-01-24", "to": "2027-01-31", "min": 1 } }
    ]
  }
  $config$::jsonb
)
on conflict (id) do update set
  title = excluded.title, starts_on = excluded.starts_on, ends_on = excluded.ends_on,
  is_active = excluded.is_active, config = excluded.config;

-- 2. Per-user progress (read your own; written only by the functions below) ------------------------------------------

create table if not exists public.user_event_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  tz text not null default 'America/New_York',
  prayer_days date[] not null default '{}',
  event_prayer_count int not null default 0,
  candles_lit int not null default 0,
  partner_sessions int not null default 0,
  longest_streak int not null default 0,
  stage_unlocked smallint not null default 0 check (stage_unlocked between 0 and 3),
  stage_seen smallint not null default 0,
  frost_lord_ready boolean not null default false,
  wreath_candles_lit smallint not null default 0 check (wreath_candles_lit between 0 and 4),
  challenges_completed text[] not null default '{}',
  challenges_closed text[] not null default '{}',
  rewards_available text[] not null default '{}',
  rewards_claimed text[] not null default '{}',
  intro_seen_at timestamptz,
  event_notifications boolean not null default false,
  last_notified_on date,
  evaluated_on date,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.user_event_progress enable row level security;
drop policy if exists "own event progress" on public.user_event_progress;
create policy "own event progress" on public.user_event_progress for select to authenticated using (user_id = auth.uid());
revoke all on public.user_event_progress from anon, authenticated;
grant select on public.user_event_progress to authenticated;

-- 3. Community counters (read through winter_event_state; nobody writes them from the app) --------------------------

create table if not exists public.community_counters (
  key text not null,
  event_id text not null references public.events(id) on delete cascade,
  value bigint not null default 0,
  rewarded_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (key, event_id)
);
alter table public.community_counters enable row level security;
revoke all on public.community_counters from anon, authenticated;
insert into public.community_counters (key, event_id) values ('winter_lights', 'long-winter-2026')
on conflict do nothing;

-- 4. Helpers ----------------------------------------------------------------------------------------------------------

-- A timezone name the database knows, or US Eastern.
create or replace function private.safe_tz(p text)
returns text language sql stable set search_path = '' as $$
  select coalesce((select name from pg_catalog.pg_timezone_names where name = p limit 1), 'America/New_York');
$$;

-- Hands the community reward (a nook scene) to everyone who said at least one winter prayer. Runs once; the
-- evaluation below also grants it to anyone who joins in after the goal was reached.
create or replace function private.grant_community_reward(p_event text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  e public.events%rowtype;
  reward text;
begin
  select * into e from public.events where id = p_event;
  reward := e.config->'community_goal'->>'reward';
  if reward is null or not exists (select 1 from public.cosmetic_products where id = reward) then
    return;
  end if;
  update public.community_counters set rewarded_at = now()
   where event_id = p_event and key = e.config->'community_goal'->>'key' and rewarded_at is null;
  if not found then
    return;
  end if;
  insert into public.user_cosmetics (user_id, product_id, source)
  select p.user_id, reward, 'grant' from public.user_event_progress p
   where p.event_id = p_event and p.event_prayer_count >= 1
  on conflict do nothing;
end;
$$;

-- Works out one person's event progress from their records and saves it. Idempotent. p_today is only for testing
-- (the public functions pass it through only while config.allow_test_dates is on).
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

-- Prayers (Vigil candles) and partner sessions update progress and the community count as they're saved. A failure
-- here is logged and never blocks the prayer itself.
create or replace function private.on_event_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  e record;
  ck text;
  v bigint;
begin
  -- pair_intents has no action column, so only look at it on prayer_interactions
  if tg_table_name = 'prayer_interactions' then
    if (to_jsonb(new)->>'action') is distinct from 'prayed' then
      return new;
    end if;
  end if;
  for e in select * from public.events ev
            where ev.is_active and (now() at time zone 'America/New_York')::date between ev.starts_on - 1 and ev.ends_on + 1
  loop
    begin
      if tg_table_name = 'prayer_interactions' then
        ck := e.config->'community_goal'->>'key';
        if ck is not null and (now() at time zone 'America/New_York')::date between e.starts_on and e.ends_on then
          insert into public.community_counters as cc (key, event_id, value) values (ck, e.id, 1)
          on conflict (key, event_id) do update set value = cc.value + 1, updated_at = now()
          returning cc.value into v;
          if v >= coalesce((e.config->'community_goal'->>'target')::bigint, 0) then
            perform private.grant_community_reward(e.id);
          end if;
        end if;
      end if;
      perform private.evaluate_event(new.user_id, e.id, null);
    exception when others then
      raise warning 'event % update failed: %', e.id, sqlerrm;
    end;
  end loop;
  return new;
end;
$$;

drop trigger if exists event_activity_on_prayer on public.prayer_interactions;
create trigger event_activity_on_prayer after insert on public.prayer_interactions
  for each row execute function private.on_event_activity();
drop trigger if exists event_activity_on_pair on public.pair_intents;
create trigger event_activity_on_pair after insert on public.pair_intents
  for each row execute function private.on_event_activity();

revoke all on function private.safe_tz(text) from public;
revoke all on function private.grant_community_reward(text) from public;
revoke all on function private.evaluate_event(uuid, text, date) from public;
revoke all on function private.on_event_activity() from public;

-- 5. What the app calls -----------------------------------------------------------------------------------------------

-- The whole event screen in one call: the event, your progress (re-evaluated now) and the community count.
create or replace function public.winter_event_state(p_event text, p_tz text default null, p_today date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  e public.events%rowtype;
  pr public.user_event_progress%rowtype;
  cv bigint;
  crew timestamptz;
begin
  select * into e from public.events where id = p_event;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  select cc.value, cc.rewarded_at into cv, crew from public.community_counters cc
   where cc.event_id = e.id and cc.key = e.config->'community_goal'->>'key';
  if uid is not null and e.is_active then
    if p_tz is not null then
      insert into public.user_event_progress (user_id, event_id, tz) values (uid, e.id, private.safe_tz(p_tz))
      on conflict (user_id, event_id) do update set tz = excluded.tz;
    end if;
    if not coalesce((e.config->>'allow_test_dates')::boolean, false) then
      p_today := null;
    end if;
    pr := private.evaluate_event(uid, e.id, p_today);
  end if;
  return jsonb_build_object(
    'found', true,
    'event', jsonb_build_object('id', e.id, 'title', e.title, 'starts_on', e.starts_on, 'ends_on', e.ends_on,
                                'is_active', e.is_active, 'config', e.config),
    'progress', case when pr.user_id is null then null else to_jsonb(pr) end,
    'community', jsonb_build_object('value', coalesce(cv, 0),
                                    'target', coalesce((e.config->'community_goal'->>'target')::bigint, 0),
                                    'rewarded', crew is not null)
  );
end;
$$;

-- Claims a weekly keepsake (into the keepsake shelf, public.user_trinkets) or crowns the Frost Lord. Allowed until
-- claim_grace_days after the event ends.
create or replace function public.claim_event_reward(p_event text, p_reward text, p_today date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  e public.events%rowtype;
  pr public.user_event_progress%rowtype;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  select * into e from public.events where id = p_event;
  if not found or not e.is_active then
    raise exception 'unknown_event';
  end if;
  if not coalesce((e.config->>'allow_test_dates')::boolean, false) then
    p_today := null;
  end if;
  pr := private.evaluate_event(uid, e.id, p_today);
  if pr.evaluated_on > e.ends_on + coalesce((e.config->>'claim_grace_days')::int, 0) then
    raise exception 'event_closed';
  end if;
  if p_reward = any(pr.rewards_claimed) then
    return to_jsonb(pr);
  end if;
  if p_reward = 'frost_lord' then
    if not pr.frost_lord_ready then
      raise exception 'not_ready';
    end if;
    update public.user_event_progress
       set stage_unlocked = 3, rewards_claimed = rewards_claimed || p_reward, updated_at = now()
     where user_id = uid and event_id = e.id
    returning * into pr;
  else
    if not (p_reward = any(pr.rewards_available)) then
      raise exception 'not_earned';
    end if;
    insert into public.user_trinkets (user_id, trinket_id) values (uid, p_reward) on conflict do nothing;
    update public.user_event_progress
       set rewards_claimed = rewards_claimed || p_reward, updated_at = now()
     where user_id = uid and event_id = e.id
    returning * into pr;
  end if;
  return to_jsonb(pr);
end;
$$;

-- Records that the intro clip started playing ('intro'), or that an evolution celebration was shown ('stage').
create or replace function public.mark_event_seen(p_event text, p_what text, p_stage int default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  insert into public.user_event_progress (user_id, event_id) values (auth.uid(), p_event)
  on conflict do nothing;
  if p_what = 'intro' then
    update public.user_event_progress set intro_seen_at = coalesce(intro_seen_at, now())
     where user_id = auth.uid() and event_id = p_event;
  elsif p_what = 'stage' then
    update public.user_event_progress set stage_seen = greatest(stage_seen, least(coalesce(p_stage, 0), stage_unlocked))
     where user_id = auth.uid() and event_id = p_event;
  end if;
end;
$$;

-- Event reminders are opt-in.
create or replace function public.set_event_notifications(p_event text, p_on boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  insert into public.user_event_progress (user_id, event_id, event_notifications) values (auth.uid(), p_event, p_on)
  on conflict (user_id, event_id) do update set event_notifications = excluded.event_notifications;
end;
$$;

revoke all on function public.winter_event_state(text, text, date) from public, anon;
revoke all on function public.claim_event_reward(text, text, date) from public, anon;
revoke all on function public.mark_event_seen(text, text, int) from public, anon;
revoke all on function public.set_event_notifications(text, boolean) from public, anon;
grant execute on function public.winter_event_state(text, text, date) to authenticated;
grant execute on function public.claim_event_reward(text, text, date) to authenticated;
grant execute on function public.mark_event_seen(text, text, int) to authenticated;
grant execute on function public.set_event_notifications(text, boolean) to authenticated;

-- 6. The Frost Lord companion -----------------------------------------------------------------------------------------

alter table public.group_members drop constraint if exists group_members_pet_id_check;
alter table public.group_members add constraint group_members_pet_id_check
  check (pet_id is null or pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord'));

alter table public.pet_xp drop constraint if exists pet_xp_pet_id_check;
alter table public.pet_xp add constraint pet_xp_pet_id_check
  check (pet_id in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord'));

alter table public.pet_state drop constraint if exists pet_state_active_pet_check;
alter table public.pet_state add constraint pet_state_active_pet_check
  check (active_pet in (
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord'));

-- switch_pet() as it is live (20261107_server_side_xp_and_nook.sql), with the Frost Lord added. Only someone who has
-- received Snowcap in an event can switch to it.
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
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig', 'frostLord'];
  st public.pet_state%rowtype;
  total int;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if not (p_from = any(allowed)) or not (p_to = any(allowed)) then
    raise exception 'unknown_pet';
  end if;
  if p_to = 'frostLord' and not exists (
    select 1 from public.user_event_progress where user_id = uid and stage_unlocked >= 1
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

-- 7. Event notifications (opt-in; at most one a day, at 9am local) ---------------------------------------------------
-- Calls the notify-winter-event Edge Function only when someone is due, the same way the other notification jobs do.

create or replace function private.dispatch_winter_event_if_due()
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  cfg record;
  req_id bigint;
begin
  if not exists (
    select 1
      from public.user_event_progress p
      join public.events e on e.id = p.event_id
     where e.is_active and p.event_notifications
       and extract(hour from now() at time zone p.tz) = 9
       and (now() at time zone p.tz)::date between e.starts_on and e.ends_on
       and p.last_notified_on is distinct from (now() at time zone p.tz)::date
       and exists (select 1 from public.push_tokens t where t.user_id = p.user_id)
  ) then
    return null;
  end if;
  select supabase_url, service_role_key into cfg from public.notifications_config where id = 1;
  if cfg.supabase_url is null or cfg.service_role_key is null then
    return null;
  end if;
  select net.http_post(
    url := rtrim(cfg.supabase_url, '/') || '/functions/v1/notify-winter-event',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || cfg.service_role_key),
    body := '{}'::jsonb, timeout_milliseconds := 60000
  ) into req_id;
  return req_id;
end;
$$;
revoke all on function private.dispatch_winter_event_if_due() from public;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_winter_event') then
    perform cron.unschedule('notify_winter_event');
  end if;
end$$;
select cron.schedule('notify_winter_event', '7 * * * *', $$select private.dispatch_winter_event_if_due();$$);

-- 8. The Winter Lord look (TESTING: on from today; set back to Dec 1 before launch) -----------------------------------

insert into public.content_windows (id, opens_at, closes_at) values
  ('event:winterLord',
   '2026-11-18 00:00'::timestamp at time zone 'America/New_York',
   '2027-02-01 00:00'::timestamp at time zone 'America/New_York')
on conflict (id, opens_at) do update set closes_at = excluded.closes_at;
