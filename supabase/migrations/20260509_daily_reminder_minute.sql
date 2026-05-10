-- Custom daily reminder time: extend hour-only scheduling to hour+minute.
-- Existing rows keep their hour and default to minute=0 (matches prior behaviour).

alter table notification_preferences
  add column if not exists daily_reminder_minute int
    check (daily_reminder_minute between 0 and 59);

update notification_preferences
  set daily_reminder_minute = 0
  where daily_reminder_minute is null
    and daily_reminder_hour is not null;

-- Tighten cron to fire every minute so minute-precision matching works.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_daily_reminder') then
    perform cron.unschedule('notify_daily_reminder');
  end if;
end$$;

select cron.schedule(
  'notify_daily_reminder',
  '* * * * *',
  $cron$
  do $body$
  declare
    url text := current_setting('app.settings.supabase_url', true);
    key text := current_setting('app.settings.service_role_key', true);
  begin
    if url is null or key is null then return; end if;
    perform net.http_post(
      url := url || '/functions/v1/notify-daily-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || key
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  end
  $body$;
  $cron$
);
