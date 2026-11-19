-- Keep the existing notification cadence, but avoid starting an Edge Function
-- (and pg_net response cleanup) when its worker has no work. Delivery, claims,
-- retries, credentials and manual notifications_dispatch() calls stay intact.
create or replace function private.notification_work_due(
  target text, p_now timestamptz default now()
)
returns boolean language plpgsql stable security invoker set search_path = '' as $$
declare
  pref record;
  local_time timestamp;
begin
  case target
  when 'notify-daily-reminder' then
    for pref in
      select n.timezone, n.daily_reminder_hour, n.daily_reminder_minute,
        n.daily_reminder_last_sent_date
      from public.notification_preferences n
      where n.daily_reminder_enabled and n.daily_reminder_hour is not null
        and n.timezone is not null
        and exists (select 1 from public.push_tokens t where t.user_id = n.user_id)
    loop
      -- Invalid timezones are skipped by the daily worker, too. Do not scan
      -- pg_timezone_names for every idle minute just to validate a few users.
      begin
        local_time := p_now at time zone pref.timezone;
      exception when invalid_parameter_value then
        continue;
      end;
      if extract(hour from local_time) = pref.daily_reminder_hour
        and extract(minute from local_time) = coalesce(pref.daily_reminder_minute, 0)
        and pref.daily_reminder_last_sent_date is distinct from local_time::date then
        return true;
      end if;
    end loop;
    return false;

  when 'notify-prayer-activity' then
    -- Include queue housekeeping and expiring leases, even for tokenless
    -- members. The existing worker remains responsible for delivery decisions.
    if exists (
      select 1 from public.group_prayer_notification_queue q
      where q.created_at < p_now - interval '1 day'
        or q.delivered_at < p_now - interval '1 hour'
        or (q.delivered_at is null and
          (q.claimed_at is null or q.claimed_at < p_now - interval '5 minutes'))
    ) or exists (
      select 1 from public.prayer_notification_receipts r
      where r.created_at < p_now - interval '15 minutes'
    ) then
      return true;
    end if;

    -- Avoid timezone-catalog work altogether when no eligible account has
    -- reflection reminders enabled. Match the claim RPC's UTC fallback and
    -- same-day catch-up rules exactly when there are candidates.
    if not exists (
      select 1 from public.notification_preferences n
      where n.reflection_reminder_enabled
        and exists (select 1 from public.prayers p where p.user_id = n.user_id and p.approved = 'y')
        and exists (select 1 from public.push_tokens t where t.user_id = n.user_id)
    ) then
      return false;
    end if;
    return exists (
      select 1 from public.notification_preferences n
      left join pg_catalog.pg_timezone_names tz on tz.name = n.timezone
      where n.reflection_reminder_enabled
        and extract(hour from p_now at time zone coalesce(tz.name, 'UTC')) >= n.reflection_reminder_hour
        and (p_now at time zone coalesce(tz.name, 'UTC'))::date >=
          coalesce(n.reflection_reminder_last_sent_date,
            (n.reflection_reminder_started_at at time zone coalesce(tz.name, 'UTC'))::date)
          + n.reflection_reminder_interval_days
        and exists (select 1 from public.prayers p where p.user_id = n.user_id and p.approved = 'y')
        and exists (select 1 from public.push_tokens t where t.user_id = n.user_id)
    );

  when 'notify-social-proof' then
    -- Include older prayers: the worker marks those outside its delivery
    -- window as finished, preventing permanent pending-index entries.
    return exists (
      select 1 from public.prayers p
      where p.social_proof_notified_at is null
        and p.created_at <= p_now - interval '60 minutes'
    );
  else
    raise exception 'unknown notification target: %', target;
  end case;
end;
$$;
revoke all on function private.notification_work_due(text, timestamptz)
  from public, anon, authenticated, service_role;

create or replace function private.dispatch_notifications_if_due(target text)
returns bigint language plpgsql security invoker set search_path = '' as $$
begin
  if private.notification_work_due(target) then
    return public.notifications_dispatch(target);
  end if;
  return null;
end;
$$;
revoke all on function private.dispatch_notifications_if_due(text)
  from public, anon, authenticated, service_role;

-- Alter commands only: keep existing job IDs, owners, enabled states and
-- schedules, including the daily reminder's one-minute precision.
do $$
declare job record;
begin
  for job in select jobid, jobname from cron.job
    where jobname in ('notify_daily_reminder', 'notify_prayer_activity', 'notify_social_proof')
  loop
    perform cron.alter_job(job.jobid, command := format(
      'select private.dispatch_notifications_if_due(%L);',
      case job.jobname
        when 'notify_daily_reminder' then 'notify-daily-reminder'
        when 'notify_prayer_activity' then 'notify-prayer-activity'
        when 'notify_social_proof' then 'notify-social-proof'
      end
    ));
  end loop;
  for job in select jobid from cron.job where jobname = 'process_prayer_interaction_schedule'
  loop
    perform cron.alter_job(job.jobid, command :=
      'select public.process_prayer_interaction_schedule() where exists (' ||
      'select 1 from public.prayer_interaction_schedule where not processed and due_at <= now());');
  end loop;
end;
$$;

-- Normal VACUUM permits reads/writes and preserves every stored response and
-- cron history row. It makes dead space reusable and refreshes planner stats.
-- VACUUM must be a standalone cron command, not inside a transaction/function.
select cron.schedule('notification_log_maintenance', '23 */6 * * *',
  $$vacuum (analyze) net._http_response, cron.job_run_details;$$);
