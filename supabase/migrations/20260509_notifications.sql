-- Notifications: push_tokens, notification_preferences, social-proof flag,
-- and pg_cron jobs that invoke edge functions to send pushes.
--
-- ONE-TIME MANUAL SETUP (run in the SQL editor before this migration takes effect):
--   alter database postgres set "app.settings.supabase_url" = 'https://<project-ref>.supabase.co';
--   alter database postgres set "app.settings.service_role_key" = '<service_role_key>';
-- The cron jobs use these settings to call edge functions. Without them the
-- jobs fire but no-op (current_setting returns NULL).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------- push_tokens ----------
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios','android','web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on push_tokens(user_id);

alter table push_tokens enable row level security;

drop policy if exists "push_tokens self read" on push_tokens;
create policy "push_tokens self read"
  on push_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "push_tokens self upsert" on push_tokens;
create policy "push_tokens self upsert"
  on push_tokens for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens self update" on push_tokens;
create policy "push_tokens self update"
  on push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens self delete" on push_tokens;
create policy "push_tokens self delete"
  on push_tokens for delete
  using (auth.uid() = user_id);

-- ---------- notification_preferences ----------
create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  comments_enabled bool not null default true,
  social_proof_enabled bool not null default true,
  daily_reminder_enabled bool not null default false,
  daily_reminder_hour int check (daily_reminder_hour between 0 and 23),
  timezone text,
  daily_reminder_last_sent_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

drop policy if exists "prefs self read" on notification_preferences;
create policy "prefs self read"
  on notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "prefs self upsert" on notification_preferences;
create policy "prefs self upsert"
  on notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "prefs self update" on notification_preferences;
create policy "prefs self update"
  on notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- social proof tracking ----------
alter table prayers add column if not exists social_proof_notified_at timestamptz;

create index if not exists prayers_social_proof_pending_idx
  on prayers(created_at)
  where social_proof_notified_at is null;

-- ---------- cron jobs ----------
-- Social proof: every 10 minutes
do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_social_proof') then
    perform cron.unschedule('notify_social_proof');
  end if;
end$$;

select cron.schedule(
  'notify_social_proof',
  '*/10 * * * *',
  $cron$
  do $body$
  declare
    url text := current_setting('app.settings.supabase_url', true);
    key text := current_setting('app.settings.service_role_key', true);
  begin
    if url is null or key is null then return; end if;
    perform net.http_post(
      url := url || '/functions/v1/notify-social-proof',
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

-- Daily reminder: every 5 minutes (function decides who is due)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify_daily_reminder') then
    perform cron.unschedule('notify_daily_reminder');
  end if;
end$$;

select cron.schedule(
  'notify_daily_reminder',
  '*/5 * * * *',
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
