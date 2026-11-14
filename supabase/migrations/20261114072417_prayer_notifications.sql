-- Per-membership prayer alerts. Preferences stay private and disappear on leaving.
create table public.group_notification_preferences (
  group_id uuid not null,
  user_id uuid not null,
  prayers_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id),
  foreign key (group_id, user_id) references public.group_members(group_id, user_id) on delete cascade
);
create index group_notification_preferences_user_idx on public.group_notification_preferences(user_id);
alter table public.group_notification_preferences enable row level security;
revoke all on public.group_notification_preferences from anon, authenticated;
grant select, insert, update on public.group_notification_preferences to authenticated;
grant all on public.group_notification_preferences to service_role;
create policy "group notification prefs self read" on public.group_notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "group notification prefs self insert" on public.group_notification_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "group notification prefs self update" on public.group_notification_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.notification_preferences
  add column reflection_reminder_enabled boolean not null default false,
  add column reflection_reminder_interval_days integer not null default 2 check (reflection_reminder_interval_days in (2, 3, 7)),
  add column reflection_reminder_hour integer not null default 19 check (reflection_reminder_hour between 0 and 23),
  add column reflection_reminder_started_at timestamptz not null default now(),
  add column reflection_reminder_last_sent_date date;

create schema if not exists private;
-- Anchor a new cadence when enabled, re-enabled, or its interval changes.
create or replace function private.reset_reflection_reminder_cadence()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.reflection_reminder_enabled and (
    not old.reflection_reminder_enabled or
    new.reflection_reminder_interval_days <> old.reflection_reminder_interval_days
  ) then
    new.reflection_reminder_started_at := now();
    new.reflection_reminder_last_sent_date := null;
  end if;
  return new;
end;
$$;
revoke all on function private.reset_reflection_reminder_cadence() from public, anon, authenticated;
create trigger reset_reflection_reminder_cadence before update on public.notification_preferences
  for each row execute function private.reset_reflection_reminder_cadence();

-- Durable outbox: only new approved posts create alerts; no historical backfill.
create table public.group_prayer_notification_queue (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers(id) on delete cascade,
  group_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  delivered_at timestamptz,
  unique (prayer_id, user_id),
  foreign key (group_id, user_id) references public.group_members(group_id, user_id) on delete cascade
);
create index group_prayer_notification_pending_idx on public.group_prayer_notification_queue(created_at) where delivered_at is null;
create index group_prayer_notification_membership_idx on public.group_prayer_notification_queue(group_id, user_id);
alter table public.group_prayer_notification_queue enable row level security;
revoke all on public.group_prayer_notification_queue from public, anon, authenticated;
grant all on public.group_prayer_notification_queue to service_role;

-- Expo tickets are checked after delivery to remove devices that unregistered.
create table public.prayer_notification_receipts (
  ticket_id text primary key,
  token text not null references public.push_tokens(token) on delete cascade,
  created_at timestamptz not null default now()
);
create index prayer_notification_receipts_created_idx on public.prayer_notification_receipts(created_at);
alter table public.prayer_notification_receipts enable row level security;
revoke all on public.prayer_notification_receipts from public, anon, authenticated;
grant all on public.prayer_notification_receipts to service_role;

create or replace function private.enqueue_group_prayer_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.group_id is null or new.approved is distinct from 'y' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.approved = 'y' then return new; end if;
  end if;
  insert into public.group_prayer_notification_queue(prayer_id, group_id, user_id)
  select new.id, new.group_id, m.user_id
  from public.group_members m
  left join public.group_notification_preferences pref on pref.group_id = m.group_id and pref.user_id = m.user_id
  where m.group_id = new.group_id and m.user_id <> new.user_id
    and m.joined_at <= new.created_at and coalesce(pref.prayers_enabled, true)
  on conflict (prayer_id, user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.enqueue_group_prayer_notifications() from public, anon, authenticated;
create trigger enqueue_group_prayer_notifications after insert or update of approved on public.prayers
  for each row execute function private.enqueue_group_prayer_notifications();

-- Atomic leases prevent overlapping cron invocations from sending the same alert.
create or replace function public.claim_group_prayer_notifications(p_now timestamptz default now())
returns table(id uuid, user_id uuid, group_id uuid, group_name text, claimed_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.group_prayer_notification_queue q
  where q.created_at < p_now - interval '1 day' or q.delivered_at < p_now - interval '1 hour';
  return query
  with candidates as (
    select q.id
    from public.group_prayer_notification_queue q
    join public.prayers p on p.id = q.prayer_id and p.group_id = q.group_id and p.approved = 'y'
    join public.group_members m on m.group_id = q.group_id and m.user_id = q.user_id
    left join public.group_notification_preferences pref on pref.group_id = q.group_id and pref.user_id = q.user_id
    where q.delivered_at is null and coalesce(pref.prayers_enabled, true)
      and (q.claimed_at is null or q.claimed_at < p_now - interval '5 minutes')
    order by q.created_at, q.id limit 100
    for update of q skip locked
  ), claimed as (
    update public.group_prayer_notification_queue q set claimed_at = p_now
    from candidates c where q.id = c.id returning q.*
  )
  select q.id, q.user_id, q.group_id, g.name, q.claimed_at from claimed q
  join public.groups g on g.id = q.group_id;
end;
$$;
revoke all on function public.claim_group_prayer_notifications(timestamptz) from public, anon, authenticated;
grant execute on function public.claim_group_prayer_notifications(timestamptz) to service_role;

-- Claim only users with posted prayers and a registered device. Dates use the
-- account's timezone and catch up later the same day if a cron minute is missed.
create or replace function public.claim_prayer_reflection_reminders(p_now timestamptz default now())
returns table(user_id uuid, previous_date date, sent_date date)
language sql security invoker set search_path = '' as $$
  with due as (
    select pref.user_id, pref.reflection_reminder_last_sent_date as previous_date,
      (p_now at time zone coalesce(tz.name, 'UTC'))::date as sent_date
    from public.notification_preferences pref
    left join pg_catalog.pg_timezone_names tz on tz.name = pref.timezone
    where pref.reflection_reminder_enabled
      and extract(hour from p_now at time zone coalesce(tz.name, 'UTC')) >= pref.reflection_reminder_hour
      and (p_now at time zone coalesce(tz.name, 'UTC'))::date >=
        coalesce(pref.reflection_reminder_last_sent_date,
          (pref.reflection_reminder_started_at at time zone coalesce(tz.name, 'UTC'))::date) + pref.reflection_reminder_interval_days
      and exists (select 1 from public.prayers p where p.user_id = pref.user_id and p.approved = 'y')
      and exists (select 1 from public.push_tokens t where t.user_id = pref.user_id)
    order by pref.user_id limit 100
    for update of pref skip locked
  ), claimed as (
    update public.notification_preferences pref set reflection_reminder_last_sent_date = due.sent_date
    from due where pref.user_id = due.user_id returning pref.user_id
  )
  select due.user_id, due.previous_date, due.sent_date from due join claimed using (user_id);
$$;
revoke all on function public.claim_prayer_reflection_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.claim_prayer_reflection_reminders(timestamptz) to service_role;

-- Extend the existing, server-only dispatcher without exposing its credentials.
create or replace function public.notifications_dispatch(target text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare cfg record; req_id bigint;
begin
  if target not in ('notify-social-proof', 'notify-daily-reminder', 'notify-prayer-activity') then
    raise exception 'unknown notification target: %', target;
  end if;
  select supabase_url, service_role_key into cfg from public.notifications_config where id = 1;
  if cfg.supabase_url is null or cfg.service_role_key is null then return null; end if;
  select net.http_post(
    url := rtrim(cfg.supabase_url, '/') || '/functions/v1/' || target,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || cfg.service_role_key),
    body := '{}'::jsonb, timeout_milliseconds := 60000
  ) into req_id;
  return req_id;
end;
$$;
revoke all on function public.notifications_dispatch(text) from public, anon, authenticated;
grant execute on function public.notifications_dispatch(text) to service_role;

select cron.schedule('notify_prayer_activity', '* * * * *',
  $$select public.notifications_dispatch('notify-prayer-activity');$$);
