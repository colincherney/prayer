-- Regression tests for the Swamp King (supabase/migrations/20261119_swamp_king_event.sql). Run the whole file in the SQL
-- editor or through the connector. It always ends by raising an exception, so every test row is rolled back: the
-- message says 'SWAMP TESTS PASSED (n checks)' or lists the failures. Passed 17/17 on 2026-11-19 with the late-comer rules
-- (20261119_swamp_launch_settings.sql), including a late comer who starts Apr 30.
do $test$
declare
  ev constant text := 'swamp-king-2027';
  u_full uuid := gen_random_uuid(); u_mid uuid := gen_random_uuid(); u_edge uuid := gen_random_uuid(); u_late uuid := gen_random_uuid();
  pids uuid[]; pr public.user_event_progress; fails text[] := '{}'; checks int := 0; d date; i int; before_w bigint; after_w bigint;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@swamp.test', '{}', '{}', now(), now()
    from unnest(array[u_full, u_mid, u_edge, u_late]) x;
  select array_agg(id) into pids from (select id from public.prayers order by created_at limit 20) p;
  insert into public.user_event_progress (user_id, event_id, tz) values (u_full, ev, 'America/New_York'), (u_mid, ev, 'America/New_York'), (u_edge, ev, 'America/New_York'), (u_late, ev, 'America/New_York');
  select count(*) into before_w from public.user_event_progress where event_id = 'long-winter-2026';

  -- u_full: 40 days of prayer Mar 1 - Apr 9, 2 requests shared, 3 journal entries, 3 encouragements, 7 daily quests, 3 partner sessions
  for d in select generate_series('2027-03-01'::date, '2027-04-09'::date, interval '1 day')::date loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values (pids[1 + (d - date '2027-03-01') % 20], u_full, 'prayed', (d + time '12:00') at time zone 'America/New_York');
  end loop;
  for i in 1..2 loop insert into public.prayers (user_id, body, created_at, approved) values (u_full, 'test request', timestamp '2027-03-05 12:00' at time zone 'America/New_York', 'y'); end loop;
  for i in 1..3 loop insert into public.biography_entries (user_id, title, body, created_at) values (u_full, 'test', 'test', timestamp '2027-03-06 12:00' at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u_full, 'test', timestamp '2027-03-07 12:00' at time zone 'America/New_York'); end loop;
  for i in 1..7 loop insert into public.quest_completions (user_id, quest_id, category, tier, xp, day, created_at) values (u_full, 'test-q' || i, 'prayer', 'n', 0, date '2027-03-08' + i, (date '2027-03-08' + i + time '12:00') at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.pair_intents (user_id, body, approved, created_at) values (u_full, 'test', true, timestamp '2027-03-09 12:00' at time zone 'America/New_York'); end loop;

  pr := private.evaluate_event(u_full, ev, '2027-04-10');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 10 then fails := fails || format('all 10: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 3 then fails := fails || format('Old King at 10: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1;
  if (select count(*) from public.user_trinkets where user_id = u_full and trinket_id in ('fenLantern','lentenCross','palmBranches','easterLilies','oldKingsCrown')) <> 5 then
    fails := fails || 'five spring keepsakes'::text;
  end if;

  -- u_mid: 4 challenges in the first week -> the Fen Warden straight away, no keepsakes yet
  for i in 1..10 loop insert into public.prayer_interactions (prayer_id, user_id, action, created_at) values (pids[1 + i % 12], u_mid, 'prayed', timestamp '2027-03-02 12:00' at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u_mid, 'test', timestamp '2027-03-03 12:00' at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.pair_intents (user_id, body, approved, created_at) values (u_mid, 'test', true, timestamp '2027-03-04 12:00' at time zone 'America/New_York'); end loop;
  pr := private.evaluate_event(u_mid, ev, '2027-03-05');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 4 then fails := fails || format('u_mid 4: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 2 then fails := fails || format('Fen Warden on Mar 5: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1; if exists (select 1 from public.user_trinkets where user_id = u_mid) then fails := fails || 'keepsakes before 10'::text; end if;

  -- boundaries of the new types
  insert into public.prayers (user_id, body, created_at, approved) values (u_edge, 'test', timestamp '2027-02-28 23:59' at time zone 'America/New_York', 'y');
  insert into public.prayers (user_id, body, created_at, approved) values (u_edge, 'test', timestamp '2027-03-01 00:00' at time zone 'America/New_York', 'y');
  for i in 1..2 loop insert into public.biography_entries (user_id, title, body, created_at) values (u_edge, 't', 't', timestamp '2027-03-02 12:00' at time zone 'America/New_York'); end loop;
  for i in 1..6 loop insert into public.quest_completions (user_id, quest_id, category, tier, xp, day, created_at) values (u_edge, 'e-q' || i, 'service', 'n', 0, date '2027-03-02' + i, (date '2027-03-02' + i + time '12:00') at time zone 'America/New_York'); end loop;
  insert into public.quest_completions (user_id, quest_id, category, tier, xp, day, created_at) values (u_edge, 'journey-step', 'journey', 'n', 0, date '2027-03-10', timestamp '2027-03-10 12:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2027-03-11');
  checks := checks + 1; if 'cast_your_burden' = any(pr.challenges_completed) then fails := fails || 'a Feb 28 request counted'::text; end if;
  checks := checks + 1; if 'still_waters' = any(pr.challenges_completed) then fails := fails || 'journal with 2'::text; end if;
  checks := checks + 1; if 'pilgrims_path' = any(pr.challenges_completed) then fails := fails || 'quests with 6 (journey counted?)'::text; end if;
  insert into public.prayers (user_id, body, created_at, approved) values (u_edge, 'test', timestamp '2027-03-11 12:00' at time zone 'America/New_York', 'y');
  insert into public.biography_entries (user_id, title, body, created_at) values (u_edge, 't', 't', timestamp '2027-03-11 12:00' at time zone 'America/New_York');
  insert into public.quest_completions (user_id, quest_id, category, tier, xp, day, created_at) values (u_edge, 'e-q7', 'daily', 'n', 0, date '2027-03-11', timestamp '2027-03-11 13:00' at time zone 'America/New_York');
  pr := private.evaluate_event(u_edge, ev, '2027-03-11');
  checks := checks + 1; if not ('cast_your_burden' = any(pr.challenges_completed)) then fails := fails || 'shared with 2'::text; end if;
  checks := checks + 1; if not ('still_waters' = any(pr.challenges_completed)) then fails := fails || 'journal with 3'::text; end if;
  checks := checks + 1; if not ('pilgrims_path' = any(pr.challenges_completed)) then fails := fails || 'quests with 7'::text; end if;
  pr := private.evaluate_event(u_edge, ev, '2027-05-02');
  checks := checks + 1; if not ('a_word_of_hope' = any(pr.challenges_closed)) then fails := fails || 'closed after the event'::text; end if;

  -- u_late: starts on Apr 30 and does everything in the last two days -> all 10 and the Old King
  for i in 1..40 loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[1 + i % 20], u_late, 'prayed', (date '2027-04-30' + (i % 2) + time '12:00') at time zone 'America/New_York');
  end loop;
  for i in 1..2 loop insert into public.prayers (user_id, body, created_at, approved) values (u_late, 'test request', timestamp '2027-04-30 12:00' at time zone 'America/New_York', 'y'); end loop;
  for i in 1..3 loop insert into public.biography_entries (user_id, title, body, created_at) values (u_late, 'test', 'test', timestamp '2027-04-30 13:00' at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u_late, 'test', timestamp '2027-04-30 14:00' at time zone 'America/New_York'); end loop;
  for i in 1..7 loop insert into public.quest_completions (user_id, quest_id, category, tier, xp, day, created_at) values (u_late, 'late-q' || i, 'prayer', 'n', 0, date '2027-04-30' + (i % 2), (date '2027-04-30' + (i % 2) + time '15:00') at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.pair_intents (user_id, body, approved, created_at) values (u_late, 'test', true, timestamp '2027-05-01 12:00' at time zone 'America/New_York'); end loop;
  pr := private.evaluate_event(u_late, ev, '2027-04-30');
  checks := checks + 1; if coalesce(array_length(pr.challenges_closed, 1), 0) > 0 then fails := fails || format('late comer: closed on Apr 30: %s', pr.challenges_closed); end if;
  pr := private.evaluate_event(u_late, ev, '2027-05-01');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 10 then fails := fails || format('late comer all 10: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 3 then fails := fails || format('late comer Old King: stage %s', pr.stage_unlocked); end if;

  select count(*) into after_w from public.user_event_progress where event_id = 'long-winter-2026';
  checks := checks + 1; if after_w - before_w > 4 then fails := fails || 'swamp activity created winter rows'::text; end if;

  if array_length(fails, 1) > 0 then raise exception 'SWAMP TESTS FAILED (% of % checks): %', array_length(fails, 1), checks, array_to_string(fails, ' | '); end if;
  raise exception 'SWAMP TESTS PASSED (% checks)', checks;
end
$test$;
