-- Synthetic prayer-engagement schedule.
-- At post time, submit-prayer seeds ~72 future-due rows here.
-- A pg_cron job drains rows whose due_at has passed into prayer_interactions.

create extension if not exists pg_cron;

create table if not exists prayer_interaction_schedule (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references prayers(id) on delete cascade,
  due_at timestamptz not null,
  processed bool not null default false,
  created_at timestamptz not null default now()
);

create index if not exists prayer_interaction_schedule_due_idx
  on prayer_interaction_schedule (due_at)
  where processed = false;

alter table prayer_interaction_schedule enable row level security;
-- No policies: only service_role and the cron job (superuser) read/write this table.

create or replace function process_prayer_interaction_schedule()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bot_id uuid;
begin
  select id into bot_id from auth.users where email = 'bot1717@gmail.com' limit 1;
  if bot_id is null then
    raise notice 'bot user bot1717@gmail.com not found; skipping';
    return;
  end if;

  with due as (
    select id, prayer_id
    from prayer_interaction_schedule
    where processed = false and due_at <= now()
    order by due_at
    limit 5000
    for update skip locked
  ),
  inserted as (
    insert into prayer_interactions (prayer_id, user_id, action)
    select prayer_id, bot_id, 'prayed' from due
    returning 1
  )
  update prayer_interaction_schedule s
    set processed = true
    from due
    where s.id = due.id;
end;
$$;

-- Run every 5 minutes. Idempotent: drop any prior schedule with this name first.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'process_prayer_interaction_schedule') then
    perform cron.unschedule('process_prayer_interaction_schedule');
  end if;
end$$;

select cron.schedule(
  'process_prayer_interaction_schedule',
  '*/5 * * * *',
  $$select process_prayer_interaction_schedule();$$
);
