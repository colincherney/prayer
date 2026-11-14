-- Quests: daily quests from the guide, XP for the pet, weekly journeys. Applied to the live project on 2026-10-20.
-- See supabase/SQL_CHANGES.md for how to revert.

create table if not exists public.quest_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- 'p:12' prayer, 's:4' scripture, 'l:30' love & service, 'f:7' faith & daily life (index into src/lib/questPool.ts),
  -- or 'j:2026-W43' for a step of that week's journey.
  quest_id text not null,
  category text not null check (category in ('prayer', 'scripture', 'service', 'daily', 'journey')),
  tier text not null default 'n' check (tier in ('n', 'A', 'S')),
  xp int not null check (xp between 0 and 100),
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, quest_id, day)
);
create index if not exists quest_completions_user_day_idx on public.quest_completions (user_id, day);

alter table public.quest_completions enable row level security;
drop policy if exists "own quest completions readable" on public.quest_completions;
create policy "own quest completions readable"
  on public.quest_completions for select
  to authenticated
  using (user_id = auth.uid());
-- The app can only read; completions go through complete_quest(), which sets the XP and the daily limits.
revoke all on public.quest_completions from anon, authenticated;
grant select on public.quest_completions to authenticated;

-- The Pilgrim's lantern is earned by finishing a weekly journey, never sold (inactive, so the store never lists it).
insert into public.cosmetic_products (id, kind, name, price_cents, billing_interval, active)
values ('item:pilgrimlantern', 'item', 'Pilgrim''s lantern', 0, null, false)
on conflict (id) do nothing;

/*
  Records a finished quest for the signed-in user and returns what it was worth.
  Limits per local day: one regular quest per category, one bonus challenge (tier A or S), one journey step.
  `p_day` is the phone's local date, accepted only within a day of the server's date (time zones).
  XP: regular 10, advanced (A) 30, special (S) 60. A journey step is 5, and the fifth step of the week is worth
  85 and unlocks the Pilgrim's lantern for the nook.
*/
create or replace function public.complete_quest(p_quest_id text, p_category text, p_tier text, p_day date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_xp int;
  steps int := 0;
  rewarded boolean := false;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if p_day is null or p_day < current_date - 1 or p_day > current_date + 1 then
    raise exception 'bad_day';
  end if;
  if p_tier not in ('n', 'A', 'S') then
    raise exception 'bad_tier';
  end if;

  if p_category = 'journey' then
    if p_quest_id !~ '^j:[0-9]{4}-W[0-9]{2}$' then
      raise exception 'bad_quest';
    end if;
    if exists (select 1 from quest_completions where user_id = uid and day = p_day and category = 'journey') then
      raise exception 'already_done_today';
    end if;
    select count(*) into steps from quest_completions where user_id = uid and quest_id = p_quest_id;
    if steps >= 5 then
      raise exception 'journey_complete';
    end if;
    steps := steps + 1;
    v_xp := case when steps = 5 then 85 else 5 end;
    insert into quest_completions (user_id, quest_id, category, tier, xp, day)
    values (uid, p_quest_id, 'journey', 'n', v_xp, p_day);
    if steps = 5 then
      insert into user_cosmetics (user_id, product_id, source)
      values (uid, 'item:pilgrimlantern', 'grant')
      on conflict (user_id, product_id) do nothing;
      rewarded := true;
    end if;
  else
    if p_category not in ('prayer', 'scripture', 'service', 'daily') then
      raise exception 'bad_category';
    end if;
    if p_quest_id !~ '^[psfl]:[0-9]{1,3}$' then
      raise exception 'bad_quest';
    end if;
    if p_tier = 'n' then
      if exists (select 1 from quest_completions where user_id = uid and day = p_day and category = p_category and tier = 'n') then
        raise exception 'already_done_today';
      end if;
      v_xp := 10;
    else
      if exists (select 1 from quest_completions where user_id = uid and day = p_day and tier in ('A', 'S')) then
        raise exception 'already_done_today';
      end if;
      v_xp := case when p_tier = 'A' then 30 else 60 end;
    end if;
    insert into quest_completions (user_id, quest_id, category, tier, xp, day)
    values (uid, p_quest_id, p_category, p_tier, v_xp, p_day);
  end if;

  return jsonb_build_object('xp', v_xp, 'journey_steps', steps, 'rewarded', rewarded);
end;
$$;

revoke execute on function public.complete_quest(text, text, text, date) from public, anon;
grant execute on function public.complete_quest(text, text, text, date) to authenticated;
