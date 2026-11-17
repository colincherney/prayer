-- Run with psql -v ON_ERROR_STOP=1 on an EMPTY disposable Postgres 17 database.
-- All fixtures/DDL roll back. Cron and HTTP dispatch are spies, so no background
-- jobs or real pushes run. Timezone calculations execute in real PostgreSQL.
begin;
set local statement_timeout = '15s';
do $$ begin
  if not exists(select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists(select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
create schema private;
create schema cron;
create table public.notification_preferences(
  user_id uuid primary key, daily_reminder_enabled boolean default false,
  daily_reminder_hour int, daily_reminder_minute int, timezone text,
  daily_reminder_last_sent_date date, reflection_reminder_enabled boolean default false,
  reflection_reminder_hour int default 19, reflection_reminder_started_at timestamptz default now(),
  reflection_reminder_last_sent_date date, reflection_reminder_interval_days int default 2
);
create table public.push_tokens(user_id uuid, token text primary key);
create table public.prayers(id uuid primary key default gen_random_uuid(), user_id uuid,
  approved text, created_at timestamptz default now(), social_proof_notified_at timestamptz);
create table public.group_prayer_notification_queue(id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), claimed_at timestamptz, delivered_at timestamptz);
create table public.prayer_notification_receipts(ticket_id text primary key, created_at timestamptz default now());
create table public.prayer_interaction_schedule(processed boolean default false, due_at timestamptz);
create table cron.job(jobid bigserial primary key, jobname text unique, schedule text,
  command text, username text default 'postgres', active boolean default true);
create function cron.alter_job(job_id bigint, schedule text default null, command text default null,
  database text default null, username text default null, active boolean default null)
returns void language sql as $$
  update cron.job j set command = coalesce(alter_job.command, j.command) where jobid = job_id;
$$;
create function cron.schedule(job_name text, schedule text, command text)
returns bigint language sql as $$
  insert into cron.job(jobname, schedule, command) values(job_name, schedule, command)
  on conflict(jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid;
$$;
create table public.dispatch_spy(target text);
create function public.notifications_dispatch(target text) returns bigint language plpgsql as $$
begin insert into public.dispatch_spy values(target); return 1; end;
$$;
create function public.process_prayer_interaction_schedule() returns void language sql as $$
  insert into public.dispatch_spy values('process-prayer-interactions');
$$;
insert into cron.job(jobname, schedule, command, active) values
  ('notify_daily_reminder', '* * * * *', 'old daily', true),
  ('notify_prayer_activity', '* * * * *', 'old activity', true),
  ('notify_social_proof', '*/10 * * * *', 'old social', false),
  ('process_prayer_interaction_schedule', '*/5 * * * *', 'old interactions', true);

\ir ../migrations/20261117173942_notification_compute_guards.sql

do $$ begin
  assert not private.notification_work_due('notify-daily-reminder'), 'Empty daily worker stays asleep';
  assert not private.notification_work_due('notify-prayer-activity'), 'Empty activity worker stays asleep';
  assert not private.notification_work_due('notify-social-proof'), 'Empty social worker stays asleep';
  perform private.dispatch_notifications_if_due('notify-daily-reminder');
  perform private.dispatch_notifications_if_due('notify-prayer-activity');
  perform private.dispatch_notifications_if_due('notify-social-proof');
  assert not exists(select 1 from public.dispatch_spy), 'Idle checks never dispatch HTTP';
  assert (select count(*) = 4 from cron.job where jobid between 1 and 4), 'Existing job IDs retained';
  assert (select schedule = '* * * * *' and active from cron.job where jobname = 'notify_daily_reminder'), 'Minute timing retained';
  assert (select schedule = '*/10 * * * *' and not active from cron.job where jobname = 'notify_social_proof'), 'Disabled jobs remain disabled';
  assert (select command = 'vacuum (analyze) net._http_response, cron.job_run_details;'
    from cron.job where jobname = 'notification_log_maintenance'), 'Maintenance never deletes history';
  assert not has_function_privilege('authenticated', 'private.notification_work_due(text,timestamptz)', 'execute'), 'No client access to private predicates';
  assert not has_function_privilege('anon', 'private.dispatch_notifications_if_due(text)', 'execute'), 'No public access to scheduled dispatch';
  assert not has_function_privilege('service_role', 'private.dispatch_notifications_if_due(text)', 'execute'), 'Cron-only wrapper';
  begin
    perform private.notification_work_due('unknown');
    raise exception 'Unknown target unexpectedly accepted';
  exception when raise_exception then
    assert sqlerrm like 'unknown notification target:%', 'Invalid targets fail closed';
  end;
end $$;

insert into public.notification_preferences(user_id, daily_reminder_enabled, daily_reminder_hour, daily_reminder_minute, timezone)
values('a1000000-0000-0000-0000-000000000001', true, 9, 5, 'America/Phoenix');
do $$ begin
  assert not private.notification_work_due('notify-daily-reminder', '2026-11-17T16:05:00Z'), 'No device means no HTTP';
end $$;
insert into public.push_tokens values('a1000000-0000-0000-0000-000000000001', 'test-device');
do $$ begin
  assert not private.notification_work_due('notify-daily-reminder', '2026-11-17T16:04:59Z'), 'Do not fire early';
  assert private.notification_work_due('notify-daily-reminder', '2026-11-17T16:05:00Z'), 'Selected local minute fires';
  assert private.notification_work_due('notify-daily-reminder', '2026-11-17T16:05:59Z'), 'Full selected minute remains eligible';
  assert not private.notification_work_due('notify-daily-reminder', '2026-11-17T16:06:00Z'), 'Do not change daily timing';
end $$;
update public.notification_preferences set daily_reminder_last_sent_date = '2026-11-17';
do $$ begin
  assert not private.notification_work_due('notify-daily-reminder', '2026-11-17T16:05:00Z'), 'Already sent today stays asleep';
  assert private.notification_work_due('notify-daily-reminder', '2026-11-18T16:05:00Z'), 'Next local day becomes eligible';
end $$;
update public.notification_preferences set daily_reminder_last_sent_date = null, daily_reminder_minute = null;
do $$ begin
  assert private.notification_work_due('notify-daily-reminder', '2026-11-17T16:00:00Z'), 'Legacy minute defaults to zero';
end $$;
update public.notification_preferences set timezone = 'invalid/timezone';
do $$ begin
  assert not private.notification_work_due('notify-daily-reminder', '2026-11-17T16:00:00Z'), 'Invalid daily timezone skips safely';
end $$;
update public.notification_preferences set timezone = 'Asia/Kathmandu', daily_reminder_hour = 21, daily_reminder_minute = 50;
do $$ begin
  assert private.notification_work_due('notify-daily-reminder', '2026-11-17T16:05:00Z'), 'Quarter-hour timezone works';
end $$;
update public.notification_preferences set timezone = 'America/New_York', daily_reminder_hour = 1, daily_reminder_minute = 30;
do $$ begin
  assert private.notification_work_due('notify-daily-reminder', '2026-11-01T05:30:00Z'), 'DST first occurrence';
end $$;
update public.notification_preferences set daily_reminder_last_sent_date = '2026-11-01';
do $$ begin
  assert not private.notification_work_due('notify-daily-reminder', '2026-11-01T06:30:00Z'), 'DST repeated hour never resends';
end $$;
update public.notification_preferences set daily_reminder_enabled = false, reflection_reminder_enabled = true,
  timezone = 'America/Phoenix', reflection_reminder_started_at = '2026-11-10T19:00:00-07:00';
do $$ begin
  assert not private.notification_work_due('notify-prayer-activity', '2026-11-12T19:05:00-07:00'), 'Reflection requires an approved prayer';
end $$;
insert into public.prayers(user_id, approved, social_proof_notified_at)
values('a1000000-0000-0000-0000-000000000001', 'y', now());
do $$ declare days int; begin
  foreach days in array array[2,3,7] loop
    update public.notification_preferences set reflection_reminder_interval_days = days;
    assert not private.notification_work_due('notify-prayer-activity', '2026-11-10T19:00:00-07:00'::timestamptz + (days-1)*interval '1 day'), 'Respect each cadence';
    assert not private.notification_work_due('notify-prayer-activity', '2026-11-10T18:59:00-07:00'::timestamptz + days*interval '1 day'), 'Respect local reflection hour';
    assert private.notification_work_due('notify-prayer-activity', '2026-11-10T19:05:00-07:00'::timestamptz + days*interval '1 day'), 'Catch up for every cadence';
  end loop;
end $$;
update public.notification_preferences set reflection_reminder_last_sent_date = '2026-11-17';
do $$ begin
  assert not private.notification_work_due('notify-prayer-activity', '2026-11-17T20:00:00-07:00'), 'Reflection already claimed stays asleep';
end $$;
update public.notification_preferences set timezone = 'invalid/timezone', reflection_reminder_last_sent_date = null,
  reflection_reminder_started_at = '2026-11-10T19:00:00Z';
do $$ begin
  assert private.notification_work_due('notify-prayer-activity', '2026-11-17T19:01:00Z'), 'Invalid reflection timezone falls back to UTC';
  assert not private.notification_work_due('notify-prayer-activity', '2026-11-17T18:59:00Z'), 'UTC fallback still respects hour';
end $$;
update public.notification_preferences set reflection_reminder_enabled = false;

insert into public.group_prayer_notification_queue(created_at) values(now());
do $$ begin
  assert private.notification_work_due('notify-prayer-activity'), 'New group alert wakes immediately';
  perform private.dispatch_notifications_if_due('notify-prayer-activity');
  assert (select count(*) = 1 from public.dispatch_spy where target = 'notify-prayer-activity'), 'Due guard invokes the original dispatcher once';
end $$;
update public.group_prayer_notification_queue set claimed_at = now();
do $$ begin
  assert not private.notification_work_due('notify-prayer-activity'), 'Active lease does not trigger a useless worker';
  assert private.notification_work_due('notify-prayer-activity', now() + interval '6 minutes'), 'Failed delivery retries after lease';
end $$;
update public.group_prayer_notification_queue set delivered_at = now();
do $$ begin
  assert not private.notification_work_due('notify-prayer-activity'), 'Delivered alerts stay asleep';
  assert private.notification_work_due('notify-prayer-activity', now() + interval '61 minutes'), 'Delivered queue cleanup still runs';
end $$;
delete from public.group_prayer_notification_queue;
insert into public.prayer_notification_receipts values('test-ticket', now());
do $$ begin
  assert not private.notification_work_due('notify-prayer-activity'), 'Wait for receipt availability';
  assert private.notification_work_due('notify-prayer-activity', now() + interval '16 minutes'), 'Receipt check still wakes after 15 minutes';
  assert private.notification_work_due('notify-prayer-activity', now() + interval '25 hours'), 'Expired receipt cleanup still runs';
end $$;
delete from public.prayer_notification_receipts;
insert into public.prayers(created_at) values(now() - interval '59 minutes');
do $$ begin
  assert not private.notification_work_due('notify-social-proof'), 'Social proof does not wake early';
  assert private.notification_work_due('notify-social-proof', now() + interval '1 minute'), 'Social proof wakes at one hour';
  assert private.notification_work_due('notify-social-proof', now() + interval '4 hours'), 'Older social-proof rows still get housekeeping';
end $$;

do $$ declare command text; begin
  select j.command into command from cron.job j where jobname = 'process_prayer_interaction_schedule';
  execute command;
  assert not exists(select 1 from public.dispatch_spy where target = 'process-prayer-interactions'), 'Idle interaction job skips its worker';
  insert into public.prayer_interaction_schedule values(false, now() - interval '1 minute');
  execute command;
  assert (select count(*) = 1 from public.dispatch_spy where target = 'process-prayer-interactions'), 'Due interaction processing is preserved';
end $$;

rollback;
select 'Notification compute guard regression checks passed' as result;
