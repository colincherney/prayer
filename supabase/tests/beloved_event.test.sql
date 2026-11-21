-- Regression tests for the Beloved (supabase/migrations/20261119_beloved_event.sql). Run the whole file in the SQL editor
-- or through the connector. It always ends by raising an exception, so every test row is rolled back: the message says
-- 'BELOVED TESTS PASSED (n checks)' or lists the failures. Passed 14/14 on 2026-11-19, including a late comer who starts
-- on Feb 28.
do $test$
declare
  ev constant text := 'beloved-2027';
  u_full uuid := gen_random_uuid(); u_mid uuid := gen_random_uuid(); u_late uuid := gen_random_uuid(); u_short uuid := gen_random_uuid();
  pids uuid[]; pr public.user_event_progress; fails text[] := '{}'; checks int := 0; i int; before_w bigint; after_w bigint;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@beloved.test', '{}', '{}', now(), now()
    from unnest(array[u_full, u_mid, u_late, u_short]) x;
  select array_agg(id) into pids from (select id from public.prayers order by created_at limit 20) p;
  insert into public.user_event_progress (user_id, event_id, tz)
  values (u_full, ev, 'America/New_York'), (u_mid, ev, 'America/New_York'), (u_late, ev, 'America/New_York'), (u_short, ev, 'America/Los_Angeles');
  select count(*) into before_w from public.user_event_progress where event_id in ('long-winter-2026', 'swamp-king-2027');

  -- u_full: 20 prayers for 5 different requests, 2 journal entries, 2 encouragements, all on Feb 3
  for i in 1..20 loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[1 + i % 5], u_full, 'prayed', timestamp '2027-02-03 12:00' at time zone 'America/New_York');
  end loop;
  for i in 1..2 loop insert into public.biography_entries (user_id, title, body, created_at) values (u_full, 'test', 'test', timestamp '2027-02-03 13:00' at time zone 'America/New_York'); end loop;
  for i in 1..2 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u_full, 'test', timestamp '2027-02-03 14:00' at time zone 'America/New_York'); end loop;
  pr := private.evaluate_event(u_full, ev, '2027-02-03');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 6 then fails := fails || format('all 6 in one day: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 3 then fails := fails || format('The Beloved at 6: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1;
  if (select count(*) from public.user_trinkets where user_id = u_full and trinket_id in ('loveLetter','roseBouquet','goldenLyre','marbleHeart')) <> 4 then
    fails := fails || 'four Valentine keepsakes'::text;
  end if;

  -- u_mid: 10 prayers for 1 request -> First Love + Song of Songs; + 2 notes = 3 challenges -> the Muse, no keepsakes
  for i in 1..10 loop insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values (pids[1], u_mid, 'prayed', timestamp '2027-02-05 12:00' at time zone 'America/New_York'); end loop;
  for i in 1..2 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u_mid, 'test', timestamp '2027-02-05 13:00' at time zone 'America/New_York'); end loop;
  pr := private.evaluate_event(u_mid, ev, '2027-02-06');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 3 then fails := fails || format('mid: 3 done: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 2 then fails := fails || format('Muse at 3: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1; if coalesce(array_length(pr.challenges_closed, 1), 0) <> 0 then fails := fails || format('mid: nothing closed: %s', pr.challenges_closed); end if;
  checks := checks + 1;
  if exists (select 1 from public.user_trinkets where user_id = u_mid and trinket_id = 'loveLetter') then fails := fails || 'mid: no keepsakes yet'::text; end if;

  -- u_late: starts on the last day (Feb 28) and still finishes everything
  for i in 1..20 loop insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values (pids[1 + i % 6], u_late, 'prayed', timestamp '2027-02-28 10:00' at time zone 'America/New_York'); end loop;
  for i in 1..2 loop insert into public.biography_entries (user_id, title, body, created_at) values (u_late, 'test', 'test', timestamp '2027-02-28 11:00' at time zone 'America/New_York'); end loop;
  for i in 1..2 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u_late, 'test', timestamp '2027-02-28 12:00' at time zone 'America/New_York'); end loop;
  pr := private.evaluate_event(u_late, ev, '2027-02-28');
  checks := checks + 1; if pr.stage_unlocked <> 3 then fails := fails || format('late comer Feb 28: stage %s, done %s, closed %s', pr.stage_unlocked, pr.challenges_completed, pr.challenges_closed); end if;

  -- u_short: on Feb 27 with nothing done, no challenge is closed yet (every one can still be done on Feb 28)
  pr := private.evaluate_event(u_short, ev, '2027-02-27');
  checks := checks + 1; if coalesce(array_length(pr.challenges_closed, 1), 0) <> 0 then fails := fails || format('Feb 27: nothing closed: %s', pr.challenges_closed); end if;
  -- a prayer at 11pm Feb 28 in Los Angeles is still in the event (local day), one at 12:30am Mar 1 is not
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values (pids[1], u_short, 'prayed', timestamp '2027-02-28 23:00' at time zone 'America/Los_Angeles');
  insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values (pids[2], u_short, 'prayed', timestamp '2027-03-01 00:30' at time zone 'America/Los_Angeles');
  pr := private.evaluate_event(u_short, ev, '2027-03-01');
  checks := checks + 1; if pr.candles_lit <> 1 then fails := fails || format('local-day window: %s prayers', pr.candles_lit); end if;
  checks := checks + 1; if pr.stage_unlocked <> 1 then fails := fails || format('Cherub with a first prayer: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1; if coalesce(array_length(pr.challenges_closed, 1), 0) <> 5 then fails := fails || format('after the end: 5 closed: %s', pr.challenges_closed); end if;

  -- the other events are untouched
  select count(*) into after_w from public.user_event_progress where event_id in ('long-winter-2026', 'swamp-king-2027');
  checks := checks + 1; if after_w <> before_w then fails := fails || 'other events untouched'::text; end if;

  -- switch_pet knows the line
  checks := checks + 1;
  if not exists (select 1 from pg_constraint where conname = 'pet_state_active_pet_check' and pg_get_constraintdef(oid) like '%beloved%') then
    fails := fails || 'pet id checks include beloved'::text;
  end if;

  if array_length(fails, 1) > 0 then
    raise exception 'BELOVED TESTS FAILED (% of %): %', array_length(fails, 1), checks, array_to_string(fails, ' | ');
  end if;
  raise exception 'BELOVED TESTS PASSED (% checks)', checks;
end;
$test$;
