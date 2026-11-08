-- Claim windows for seasonal content. Outside every window an item is in the vault: whoever claimed it keeps it,
-- but nobody new can claim it. The app reads these (src/lib/releases.ts). Safe to run again.
create table if not exists public.content_windows (
  id text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  primary key (id, opens_at),
  check (closes_at > opens_at)
);

alter table public.content_windows enable row level security;
drop policy if exists "content windows readable" on public.content_windows;
create policy "content windows readable" on public.content_windows for select to anon, authenticated using (true);
revoke all on public.content_windows from anon, authenticated;
grant select on public.content_windows to anon, authenticated;

-- Seasonal companions: out until Jan 7, 2027, then back for one month each in their season (midnight US Eastern).
insert into public.content_windows (id, opens_at, closes_at) values
  ('pet:pumpkin', '2026-01-01T05:00:00Z', '2027-01-07T05:00:00Z'),
  ('pet:pumpkin', '2027-10-01T04:00:00Z', '2027-11-01T04:00:00Z'),
  ('pet:turkey', '2026-11-14T05:00:00Z', '2027-01-07T05:00:00Z'),
  ('pet:turkey', '2027-11-14T05:00:00Z', '2027-12-01T05:00:00Z'),
  ('pet:donkey', '2026-12-01T05:00:00Z', '2027-01-07T05:00:00Z'),
  ('pet:donkey', '2027-12-01T05:00:00Z', '2028-01-01T05:00:00Z')
on conflict (id, opens_at) do update set closes_at = excluded.closes_at;
