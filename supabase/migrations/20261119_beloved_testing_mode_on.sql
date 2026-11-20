-- Testing mode for the Beloved: the event and its rose-garden look start today (2026-11-19) instead of Feb 1, so real
-- prayers count now and TestFlight builds show it. Everything people see still says Feb 1 (config.real_starts_on), and
-- the dev-only date override works. Undo with 20261119_beloved_testing_mode_off.sql before the release.
update public.events
   set starts_on = '2026-11-19', config = jsonb_set(config, '{allow_test_dates}', 'true')
 where id = 'beloved-2027';
update public.content_windows
   set opens_at = '2026-11-19 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:beloved';
-- Re-check everyone who has prayed today, so those prayers count now rather than on their next prayer.
select private.evaluate_event(u.user_id, 'beloved-2027', null)
  from (select distinct user_id from public.prayer_interactions
         where action = 'prayed' and created_at >= '2026-11-19 00:00'::timestamp at time zone 'America/New_York') u;
