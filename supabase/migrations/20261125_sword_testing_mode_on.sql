-- Testing mode for the Sword of the Spirit (applied 2026-11-25): the event and its look start Nov 25 instead of Jun 1, so
-- real prayers count now and TestFlight builds show it, and the event is checked as if it were Jun 1, 2027
-- (config.test_today). Everything people see still says Jun 1 (config.real_starts_on). Undo with
-- 20261125_sword_testing_mode_off.sql before the release. While another event's dates are on (Dec 1 to May 1), that
-- one takes precedence in the app (EVENT_IDS order).
update public.events
   set starts_on = '2026-11-25',
       config = jsonb_set(jsonb_set(config, '{allow_test_dates}', 'true'), '{test_today}', '"2027-06-01"')
 where id = 'sword-2027';
update public.content_windows
   set opens_at = '2026-11-25 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:sword';
