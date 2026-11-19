-- Testing is over (2026-11-19): the Long Winter starts on Dec 1, 2026 (midnight US Eastern), the dev-only date
-- override is ignored by the server, and the Winter Lord look opens on Dec 1 too.
update public.events
   set starts_on = '2026-12-01', config = jsonb_set(config, '{allow_test_dates}', 'false')
 where id = 'long-winter-2026';
update public.content_windows
   set opens_at = '2026-12-01 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:winterLord';
