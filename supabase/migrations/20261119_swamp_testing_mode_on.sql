-- Testing mode for the Swamp King: the event starts today (2026-11-19) so real prayers count, the dev-only date
-- override works (pick "Mar 1" on the swamp screen), and the fen look is on now. The dates people see still say
-- Mar 1 (config.real_starts_on). Undo with 20261119_swamp_testing_mode_off.sql before release. Applied 2026-11-19.
update public.events
   set starts_on = '2026-11-19', config = jsonb_set(config, '{allow_test_dates}', 'true')
 where id = 'swamp-king-2027';
update public.content_windows
   set opens_at = '2026-11-19 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:swampKing';
-- Re-check everyone who has prayed today, so those prayers count now rather than on their next prayer.
select private.evaluate_event(u.user_id, 'swamp-king-2027', null)
  from (select distinct user_id from public.prayer_interactions
         where action = 'prayed' and created_at >= '2026-11-19 00:00'::timestamp at time zone 'America/New_York') u;
