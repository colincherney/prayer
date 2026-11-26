-- Leaves Sword of the Spirit testing mode: back to the real schedule (Jun 1 to Jun 30, 2027, look from Jun 1 00:00 ET
-- to Jul 1 00:00 ET), dev date override off. Run before release.
update public.events
   set starts_on = '2027-06-01', config = jsonb_set(config, '{allow_test_dates}', 'false') - 'test_today'
 where id = 'sword-2027';
update public.content_windows
   set opens_at = '2027-06-01 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:sword';
-- The community count would otherwise start the real event with the test prayers in it.
update public.community_counters set value = 0, rewarded_at = null where event_id = 'sword-2027';
-- To also wipe test progress (what testers earned is otherwise kept, like everything earned):
-- delete from public.user_event_progress where event_id = 'sword-2027';
