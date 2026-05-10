-- Notification fixes:
--   1. Adds register_push_token() RPC so re-installs / sign-out-sign-in on
--      the same device can claim an existing token row without a 42501 RLS
--      error. The strict per-user RLS on push_tokens stays — only this
--      narrow RPC bypasses it (and only to assign ownership to the caller).
--   2. cron jobs no longer rely on `current_setting('app.settings.*')` (which
--      requires a manual `alter database postgres set ...` step that's easy
--      to miss). They now read from a single-row config table populated once
--      after migration.
--   3. Adds a manual trigger function so notifications can be fired on demand
--      for verification.
--
-- AFTER APPLYING THIS MIGRATION, run ONCE in the SQL editor:
--
--   insert into notifications_config (id, supabase_url, service_role_key)
--   values (1, 'https://YOUR-PROJECT.supabase.co', 'YOUR-SERVICE-ROLE-KEY')
--   on conflict (id) do update
--     set supabase_url = excluded.supabase_url,
--         service_role_key = excluded.service_role_key,
--         updated_at = now();
--
-- Then verify with:
--
--   select notifications_dispatch('notify-daily-reminder');
--   select notifications_dispatch('notify-social-proof');
--   select * from net._http_response order by created desc limit 5;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------- register_push_token: claim-by-token RPC ----------
-- The strict push_tokens RLS prevents user A from updating a row owned by
-- user B. That blocks the legitimate case where two accounts have signed in
-- on the same device and Expo returns the same token to the second one.
-- This SECURITY DEFINER function bypasses RLS only for the narrow operation
-- of "the caller is claiming this exact token for themselves" — they must
-- already hold the token (passed as an argument), so it's not enumerable.
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = pg_temp
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_platform not in ('ios', 'android', 'web') then
    raise exception 'invalid platform: %', p_platform using errcode = '22023';
  end if;
  if p_token is null or length(p_token) = 0 then
    raise exception 'token required' using errcode = '22023';
  end if;

  insert into public.push_tokens (user_id, token, platform, updated_at)
  values (uid, p_token, p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- ---------- cron config table ----------
create table if not exists notifications_config (
  id int primary key default 1 check (id = 1),
  supabase_url text not null,
  service_role_key text not null,
  updated_at timestamptz not null default now()
);

alter table notifications_config enable row level security;
-- No policies → only service_role and superuser cron jobs can read/write.

-- ---------- dispatch helper ----------
create or replace function public.notifications_dispatch(target text)
returns bigint
language plpgsql
security definer
set search_path = pg_temp
as $$
declare
  cfg record;
  req_id bigint;
begin
  if target not in ('notify-social-proof', 'notify-daily-reminder') then
    raise exception 'unknown notification target: %', target;
  end if;

  select supabase_url, service_role_key into cfg
  from public.notifications_config
  where id = 1;

  if cfg.supabase_url is null or cfg.service_role_key is null then
    raise notice 'notifications_dispatch(%): notifications_config row not set; skipping', target;
    return null;
  end if;

  select net.http_post(
    url := cfg.supabase_url || '/functions/v1/' || target,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cfg.service_role_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) into req_id;

  raise notice 'notifications_dispatch(%): dispatched req_id=%', target, req_id;
  return req_id;
end
$$;

revoke all on function public.notifications_dispatch(text) from public, anon, authenticated;
grant execute on function public.notifications_dispatch(text) to service_role;

-- ---------- re-schedule cron jobs ----------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_social_proof') then
    perform cron.unschedule('notify_social_proof');
  end if;
  if exists (select 1 from cron.job where jobname = 'notify_daily_reminder') then
    perform cron.unschedule('notify_daily_reminder');
  end if;
end$$;

select cron.schedule(
  'notify_social_proof',
  '*/10 * * * *',
  $$select public.notifications_dispatch('notify-social-proof');$$
);

select cron.schedule(
  'notify_daily_reminder',
  '*/5 * * * *',
  $$select public.notifications_dispatch('notify-daily-reminder');$$
);
