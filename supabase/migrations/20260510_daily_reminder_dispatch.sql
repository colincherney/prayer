-- Fix: 20260509_daily_reminder_minute.sql regressed the notify_daily_reminder
-- cron to read app.settings.* GUCs (the legacy approach from
-- 20260509_notifications.sql) instead of using notifications_dispatch() from
-- 20260509_notifications_fix.sql. Without the manual `alter database postgres
-- set ...` step, the cron fires every minute but the inner `if url is null
-- ... return` short-circuits and no push is sent.
--
-- This migration re-schedules notify_daily_reminder to use
-- notifications_dispatch(), matching how notify_social_proof is already wired.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_daily_reminder') then
    perform cron.unschedule('notify_daily_reminder');
  end if;
end$$;

select cron.schedule(
  'notify_daily_reminder',
  '* * * * *',
  $$select public.notifications_dispatch('notify-daily-reminder');$$
);
