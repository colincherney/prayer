-- Regression tests for the Long Winter event (supabase/migrations/20261118_long_winter_event.sql and
-- 20261118_winter_challenges_anytime.sql). Run the whole file in the SQL editor (or the Supabase connector).
-- Everything happens inside one DO block that always ends by raising an exception, so all test rows are rolled back:
-- the message says either 'WINTER TESTS PASSED (n checks)' or lists the failures.
do $test$
declare
  ev constant text := 'long-winter-2026';
  u_full uuid := gen_random_uuid();
  u_tz uuid := gen_random_uuid();
  u_edge uuid := gen_random_uuid();
  u_late uuid := gen_random_uuid();
  u_mid uuid := gen_random_uuid();
  pids uuid[];
  pr public.user_event_progress;
  res jsonb;
  fails text[] := '{}';
  checks int := 0;
  before_count bigint;
  after_count bigint;
  d date;
  i int := 0;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@winter.test', '{}', '{}', now(), now()
    from unnest(array[u_full, u_tz, u_edge, u_late, u_mid]) x;
  select array_agg(id) into pids from (select id from public.prayers order by created_at limit 12) p;
  if coalesce(array_length(pids, 1), 0) < 12 then
    raise exception 'need at least 12 prayer rows to attach test prayers to';
  end if;
  insert into public.user_event_progress (user_id, event_id, tz) values
    (u_full, ev, 'America/New_York'), (u_tz, ev, 'America/Los_Angeles'),
    (u_edge, ev, 'America/New_York'), (u_late, ev, 'America/New_York'), (u_mid, ev, 'America/New_York');
  select value into before_count from public.community_counters where event_id = ev and key = 'winter_lights';

  -- 1. A full season for u_full: 40 days at noon, for 12 different people -----------------------------------------
  for d in select unnest(array[
      '2026-12-01','2026-12-02','2026-12-03','2026-12-08','2026-12-09','2026-12-10','2026-12-15','2026-12-16','2026-12-17',
      '2026-12-22','2026-12-23','2026-12-24','2026-12-25','2026-12-26','2026-12-27','2026-12-28','2026-12-29','2026-12-30'
    ]::date[]) loop
    i := i + 1;
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[1 + i % 12], u_full, 'prayed', (d + time '12:00') at time zone 'America/New_York');
  end loop;
  for d in select generate_series('2027-01-01'::date, '2027-01-20'::date, interval '1 day')::date loop
    i := i + 1;
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[1 + i % 12], u_full, 'prayed', (d + time '12:00') at time zone 'America/New_York');
  end loop;
  -- three prayers on one day still make one winter prayer
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values
    (pids[1], u_full, 'prayed', timestamp '2027-01-24 12:00' at time zone 'America/New_York'),
    (pids[2], u_full, 'prayed', timestamp '2027-01-24 13:00' at time zone 'America/New_York'),
    (pids[3], u_full, 'prayed', timestamp '2027-01-24 14:00' at time zone 'America/New_York'),
    (pids[4], u_full, 'prayed', timestamp '2027-01-25 12:00' at time zone 'America/New_York'),
    -- three nights (Silent Night) and three mornings (Candlemas), on days already prayed
    (pids[5], u_full, 'prayed', timestamp '2026-12-02 22:00' at time zone 'America/New_York'),
    (pids[6], u_full, 'prayed', timestamp '2026-12-03 22:00' at time zone 'America/New_York'),
    (pids[7], u_full, 'prayed', timestamp '2026-12-08 22:00' at time zone 'America/New_York'),
    (pids[8], u_full, 'prayed', timestamp '2026-12-09 07:00' at time zone 'America/New_York'),
    (pids[9], u_full, 'prayed', timestamp '2026-12-10 07:00' at time zone 'America/New_York'),
    (pids[10], u_full, 'prayed', timestamp '2026-12-15 07:00' at time zone 'America/New_York');
  insert into public.pair_intents (user_id, body, approved, created_at) values
    (u_full, 'test one', true, timestamp '2026-12-05 12:00' at time zone 'America/New_York'),
    (u_full, 'test two', true, timestamp '2026-12-06 12:00' at time zone 'America/New_York');

  -- Finishing all 10 gives everything at once, on any date: the Frost Lord and all five keepsakes, nothing to claim
  pr := private.evaluate_event(u_full, ev, '2026-12-24');
  checks := checks + 1; if pr.stage_unlocked <> 3 then fails := fails || format('all 10 done on Dec 24 gives the Frost Lord: stage %s', pr.stage_unlocked); end if;
  pr := private.evaluate_event(u_full, ev, '2027-01-31');
  checks := checks + 1; if pr.event_prayer_count <> 40 then fails := fails || format('40 winter prayers: got %s', pr.event_prayer_count); end if;
  checks := checks + 1; if pr.candles_lit <> 48 then fails := fails || format('candles count every prayer: got %s', pr.candles_lit); end if;
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 10 then fails := fails || format('all 10 challenges: got %s', pr.challenges_completed); end if;
  checks := checks + 1; if not pr.frost_lord_ready then fails := fails || 'frost lord ready'::text; end if;
  checks := checks + 1;
  if (select count(*) from public.user_trinkets where user_id = u_full
       and trinket_id in ('adventWreath', 'christmasStar', 'winterSnowGlobe', 'threeKingsCrown', 'candlemasCandles')) <> 5 then
    fails := fails || 'all five keepsakes on the shelf'::text;
  end if;
  checks := checks + 1; if not (pr.rewards_claimed @> array['frost_lord', 'adventWreath', 'candlemasCandles']) then fails := fails || format('rewards recorded: %s', pr.rewards_claimed); end if;
  res := to_jsonb(pr) - 'updated_at';
  pr := private.evaluate_event(u_full, ev, '2027-01-31');
  checks := checks + 1; if res <> to_jsonb(pr) - 'updated_at' then fails := fails || 'evaluate is not idempotent'::text; end if;

  -- Four challenges early in December: the Frost Mage arrives straight away, with no date to wait for
  for i in 1..5 loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[i], u_mid, 'prayed', (date '2026-12-02' + i + time '22:00') at time zone 'America/New_York');
  end loop;
  insert into public.pair_intents (user_id, body, approved, created_at) values
    (u_mid, 'test one', true, timestamp '2026-12-03 12:00' at time zone 'America/New_York'),
    (u_mid, 'test two', true, timestamp '2026-12-04 12:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_mid, ev, '2026-12-08');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 4 then fails := fails || format('u_mid has 4 challenges: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 2 then fails := fails || format('Frost Mage on Dec 8 with 4 challenges: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1; if exists (select 1 from public.user_trinkets where user_id = u_mid) then fails := fails || 'keepsakes before all 10'::text; end if;

  -- after the claim week the event is read-only
  perform set_config('request.jwt.claims', json_build_object('sub', u_full, 'role', 'authenticated')::text, true);
  begin
    res := public.claim_event_reward(ev, 'frost_lord', '2027-02-08');
    fails := fails || 'claim accepted after the grace week (Feb 8)'::text;
  exception when others then
    checks := checks + 1; if sqlerrm <> 'event_closed' then fails := fails || format('Feb 8 claim error: %s', sqlerrm); end if;
  end;

  -- 2. Local days and hours follow the person's timezone -----------------------------------------------------------
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
  values (pids[1], u_tz, 'prayed', timestamptz '2026-12-02 07:30:00+00'); -- 11:30pm Dec 1 in Los Angeles
  pr := private.evaluate_event(u_tz, ev, '2026-12-02');
  checks := checks + 1; if pr.prayer_days <> array['2026-12-01'::date] then fails := fails || format('LA local day: %s', pr.prayer_days); end if;
  for d in select generate_series('2026-12-02'::date, '2026-12-07'::date, interval '1 day')::date loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[1], u_tz, 'prayed', (d + time '23:50') at time zone 'America/Los_Angeles');
  end loop;
  pr := private.evaluate_event(u_tz, ev, '2026-12-08');
  checks := checks + 1; if not ('hoarfrost' = any(pr.challenges_completed)) then fails := fails || format('7-day streak across midnight (longest %s)', pr.longest_streak); end if;
  -- those were late-night prayers in LA, so they count as nights there
  checks := checks + 1; if not ('silent_night' = any(pr.challenges_completed)) then fails := fails || 'nights counted in local time'::text; end if;

  -- 3. Boundaries of the anytime challenges --------------------------------------------------------------------------
  -- Silent Night: 9pm counts, 8:59pm doesn't
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values
    (pids[1], u_edge, 'prayed', timestamp '2026-12-04 20:59' at time zone 'America/New_York'),
    (pids[1], u_edge, 'prayed', timestamp '2026-12-05 21:00' at time zone 'America/New_York'),
    (pids[1], u_edge, 'prayed', timestamp '2026-12-06 23:59' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2026-12-06');
  checks := checks + 1; if 'silent_night' = any(pr.challenges_completed) then fails := fails || 'Silent Night with 2 nights (8:59pm counted?)'::text; end if;
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
  values (pids[1], u_edge, 'prayed', timestamp '2026-12-07 21:30' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2026-12-07');
  checks := checks + 1; if not ('silent_night' = any(pr.challenges_completed)) then fails := fails || 'Silent Night with 3 nights'::text; end if;
  -- Candlemas: 8:59am counts, 9:00am doesn't, 3:59am doesn't
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values
    (pids[1], u_edge, 'prayed', timestamp '2026-12-10 08:59' at time zone 'America/New_York'),
    (pids[1], u_edge, 'prayed', timestamp '2026-12-11 09:00' at time zone 'America/New_York'),
    (pids[1], u_edge, 'prayed', timestamp '2026-12-12 03:59' at time zone 'America/New_York'),
    (pids[1], u_edge, 'prayed', timestamp '2026-12-13 04:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2026-12-13');
  checks := checks + 1; if 'candlemas' = any(pr.challenges_completed) then fails := fails || 'Candlemas with 2 mornings'::text; end if;
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
  values (pids[1], u_edge, 'prayed', timestamp '2027-01-20 06:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2027-01-20');
  checks := checks + 1; if not ('candlemas' = any(pr.challenges_completed)) then fails := fails || 'Candlemas with 3 mornings, one in January'::text; end if;
  -- Twelve Days: 11 different people, then 12
  for i in 2..11 loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[i], u_edge, 'prayed', timestamp '2027-01-21 12:00' at time zone 'America/New_York');
  end loop;
  pr := private.evaluate_event(u_edge, ev, '2027-01-21');
  checks := checks + 1; if pr.stage_unlocked = 3 or exists (select 1 from public.user_trinkets where user_id = u_edge) then fails := fails || format('nothing big before all 10 (%s done)', coalesce(array_length(pr.challenges_completed, 1), 0)); end if;
  checks := checks + 1; if 'twelve_days' = any(pr.challenges_completed) then fails := fails || 'Twelve Days with 11 people'::text; end if;
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
  values (pids[12], u_edge, 'prayed', timestamp '2027-01-22 12:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2027-01-22');
  checks := checks + 1; if not ('twelve_days' = any(pr.challenges_completed)) then fails := fails || 'Twelve Days with 12 people'::text; end if;

  -- 4. A late joiner (first prayer Jan 1): only what can't fit in the days left is closed ------------------------
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
  values (pids[1], u_late, 'prayed', timestamp '2027-01-01 12:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_late, ev, '2027-01-01');
  checks := checks + 1; if pr.challenges_closed <> array['word_melts'] then fails := fails || format('late joiner closed: %s (only the 40 prayers should be)', pr.challenges_closed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 1 then fails := fails || 'late joiner gets Snowcap'::text; end if;
  -- three weeks left is not enough for Four Candles
  pr := private.evaluate_event(u_late, ev, '2027-01-14');
  checks := checks + 1; if not ('four_candles' = any(pr.challenges_closed)) then fails := fails || format('Four Candles closes when 4 weeks no longer fit (%s)', pr.challenges_closed); end if;

  -- 5. The community counter counts every candle, once ---------------------------------------------------------------
  select value into after_count from public.community_counters where event_id = ev and key = 'winter_lights';
  checks := checks + 1;
  if after_count - before_count <> (select count(*) from public.prayer_interactions where user_id in (u_full, u_tz, u_edge, u_late, u_mid)) then
    fails := fails || format('counter moved %s', after_count - before_count);
  end if;

  if array_length(fails, 1) > 0 then
    raise exception 'WINTER TESTS FAILED (% of % checks): %', array_length(fails, 1), checks, array_to_string(fails, ' | ');
  end if;
  raise exception 'WINTER TESTS PASSED (% checks)', checks;
end
$test$;
