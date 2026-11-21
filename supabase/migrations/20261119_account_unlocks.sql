-- Per-account unlocks for testing: a row ('all_pets') makes every companion count as released and claimable for that
-- one account (src/lib/releases.ts), whatever the schedule or the vault says. Everyone else is unaffected.
-- Only the database (service role / SQL) adds rows; an account can read its own.
create table if not exists public.account_unlocks (
  user_id uuid not null references auth.users (id) on delete cascade,
  unlock text not null check (unlock in ('all_pets')),
  created_at timestamptz not null default now(),
  primary key (user_id, unlock)
);
alter table public.account_unlocks enable row level security;
drop policy if exists "read own unlocks" on public.account_unlocks;
create policy "read own unlocks" on public.account_unlocks
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.account_unlocks from anon;
grant select on public.account_unlocks to authenticated;
