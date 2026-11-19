-- Leaves Swamp King testing mode: back to the real schedule (Mar 1 to May 1, 2027, look from Mar 1 00:00 ET),
-- dev date override off. Run before release.
update public.events
   set starts_on = '2027-03-01', config = jsonb_set(config, '{allow_test_dates}', 'false')
 where id = 'swamp-king-2027';
update public.content_windows
   set opens_at = '2027-03-01 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:swampKing';
-- To also wipe test progress:
-- delete from public.user_event_progress where event_id = 'swamp-king-2027';
-- update public.community_counters set value = 0, rewarded_at = null where event_id = 'swamp-king-2027';
