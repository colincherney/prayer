-- The Long Winter: nothing in the event is tied to a date any more, and finishing all 10 challenges gives the whole
-- reward at once, with nothing to claim.
--
--   * The Frost Mage arrives as soon as 4 challenges are done (it used to wait for Dec 25).
--   * The five winter keepsakes are no longer one per week: all five come with finishing the 10 challenges
--     (config.completion_rewards), straight onto the keepsake shelf (public.user_trinkets).
--   * The Frost Lord arrives the moment the 10th challenge is done (stage 3), instead of being claimed.
--
-- Snowcap still arrives with the first winter prayer. Safe to run again.

update public.events
   set config = jsonb_set(
         jsonb_set(config - 'weekly_rewards', '{evolutions,1,unlock}', '{"min_challenges": 4}'::jsonb),
         '{completion_rewards}',
         '["adventWreath", "christmasStar", "winterSnowGlobe", "threeKingsCrown", "candlemasCandles"]'::jsonb)
 where id = 'long-winter-2026';

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
