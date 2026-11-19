-- Back to testing mode (the user is still testing): the Long Winter starts 2026-11-18, the dev-only date override works,
-- and the Winter Lord look is on. Undo with 20261118_winter_launch_settings.sql before Dec 1. Applied 2026-11-19.
update public.events
   set starts_on = '2026-11-18', config = jsonb_set(config, '{allow_test_dates}', 'true')
 where id = 'long-winter-2026';
update public.content_windows
   set opens_at = '2026-11-18 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:winterLord';
-- Re-check everyone who has prayed since, so their prayers count now rather than on their next prayer.
select private.evaluate_event(u.user_id, 'long-winter-2026', null)
  from (select distinct user_id from public.prayer_interactions
         where action = 'prayed' and created_at >= '2026-11-18 00:00'::timestamp at time zone 'America/New_York') u;
