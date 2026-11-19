-- Late-comer test for the Long Winter (supabase/migrations/20261119_winter_late_comer_rules.sql): someone who starts on
-- Jan 30 can still finish all 10 challenges and get the Frost Lord and the keepsakes. Always ends by raising an
-- exception, so every test row is rolled back. Passed 4/4 on 2026-11-19.
do $test$
declare
  ev constant text := 'long-winter-2026';
  u uuid := gen_random_uuid(); pids uuid[]; pr public.user_event_progress; fails text[] := '{}'; checks int := 0; i int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', u::text || '@winter.test', '{}', '{}', now(), now());
  select array_agg(id) into pids from (select id from public.prayers order by created_at limit 20) p;
  insert into public.user_event_progress (user_id, event_id, tz) values (u, ev, 'America/New_York');
  for i in 1..40 loop
    insert into public.prayer_interactions (prayer_id, user_id, action, created_at)
    values (pids[1 + i % 20], u, 'prayed', (date '2027-01-30' + (i % 2) + time '12:00') at time zone 'America/New_York');
  end loop;
  for i in 1..2 loop insert into public.prayers (user_id, body, created_at, approved) values (u, 'test', timestamp '2027-01-30 12:00' at time zone 'America/New_York', 'y'); end loop;
  for i in 1..3 loop insert into public.biography_entries (user_id, title, body, created_at) values (u, 't', 't', timestamp '2027-01-30 13:00' at time zone 'America/New_York'); end loop;
  for i in 1..3 loop insert into public.reflections (prayer_id, user_id, content, created_at) values (pids[i], u, 't', timestamp '2027-01-30 14:00' at time zone 'America/New_York'); end loop;
  for i in 1..4 loop insert into public.quest_completions (user_id, quest_id, category, tier, xp, day, created_at) values (u, 'late-q' || i, 'prayer', 'n', 0, date '2027-01-30' + (i % 2), (date '2027-01-30' + (i % 2) + time '15:00') at time zone 'America/New_York'); end loop;
  for i in 1..2 loop insert into public.pair_intents (user_id, body, approved, created_at) values (u, 't', true, timestamp '2027-01-31 12:00' at time zone 'America/New_York'); end loop;
  pr := private.evaluate_event(u, ev, '2027-01-30');
  checks := checks + 1; if coalesce(array_length(pr.challenges_closed, 1), 0) > 0 then fails := fails || format('closed on Jan 30: %s', pr.challenges_closed); end if;
  pr := private.evaluate_event(u, ev, '2027-01-31');
  checks := checks + 1; if coalesce(array_length(pr.challenges_completed, 1), 0) <> 10 then fails := fails || format('all 10: %s', pr.challenges_completed); end if;
  checks := checks + 1; if pr.stage_unlocked <> 3 then fails := fails || format('Frost Lord: stage %s', pr.stage_unlocked); end if;
  checks := checks + 1; if (select count(*) from public.user_trinkets where user_id = u) < 5 then fails := fails || 'five winter keepsakes'::text; end if;
  if array_length(fails, 1) > 0 then raise exception 'WINTER LATE TESTS FAILED (% of % checks): %', array_length(fails, 1), checks, array_to_string(fails, ' | '); end if;
  raise exception 'WINTER LATE TESTS PASSED (% checks)', checks;
end
$test$;
