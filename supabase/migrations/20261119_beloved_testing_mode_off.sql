-- Leaves Beloved testing mode: back to the real schedule (Feb 1 to Feb 28, 2027, look from Feb 1 00:00 ET to
-- Mar 1 00:00 ET), dev date override off. Run before release. Applied 2026-11-19.
update public.events
   set starts_on = '2027-02-01', config = jsonb_set(config, '{allow_test_dates}', 'false') - 'test_today'
 where id = 'beloved-2027';
update public.content_windows
   set opens_at = '2027-02-01 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:beloved';
-- The community count would otherwise start the real event with the test prayers in it.
update public.community_counters set value = 0, rewarded_at = null where event_id = 'beloved-2027';
-- To also wipe test progress (what testers earned is otherwise kept, like everything earned):
-- delete from public.user_event_progress where event_id = 'beloved-2027';
