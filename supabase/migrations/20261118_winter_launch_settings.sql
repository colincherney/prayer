-- The Long Winter leaves testing mode: it starts on Dec 1, 2026 (midnight US Eastern), the dev-only date override is
-- ignored by the server, and the Winter Lord look opens on Dec 1 too. Applied 2026-11-18.
update public.events
   set starts_on = '2026-12-01', config = jsonb_set(config, '{allow_test_dates}', 'false')
 where id = 'long-winter-2026';
update public.content_windows
   set opens_at = '2026-12-01 00:00'::timestamp at time zone 'America/New_York'
 where id = 'event:winterLord';
