-- The Long Winter's reminders follow each person's progress instead of holiday dates (the event is two months and
-- every challenge can be done any day). The notify-winter-event Edge Function records here which reminders it has
-- sent, so each one goes out at most once. Safe to run again.
alter table public.user_event_progress add column if not exists notified text[] not null default '{}';
