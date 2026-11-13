-- Subscription configuration is readable only by the server. Public SDK keys
-- are supplied separately after this migration, never service-role/secret keys.
create table if not exists public.revenuecat_subscription_config (
  id text primary key check (id = 'subscription'),
  entitlement_id text not null,
  offering_id text not null,
  product_ids text[] not null,
  public_api_key text not null check (public_api_key ~ '^(test_|appl_|goog_)'),
  allow_sandbox boolean not null default false
);
alter table public.revenuecat_subscription_config enable row level security;
revoke all on public.revenuecat_subscription_config from public, anon, authenticated;
grant select, insert, update, delete on public.revenuecat_subscription_config to service_role;

alter table public.user_cosmetics add column if not exists expires_at timestamptz;

-- Records the time of RevenueCat's authoritative snapshot. Stale/concurrent
-- responses cannot overwrite newer verification results.
create table if not exists public.revenuecat_subscription_checks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  checked_at timestamptz not null,
  active boolean not null,
  expires_at timestamptz,
  product_id text
);
alter table public.revenuecat_subscription_checks enable row level security;
revoke all on public.revenuecat_subscription_checks from public, anon, authenticated;
grant select, insert, update, delete on public.revenuecat_subscription_checks to service_role;

create or replace function public.apply_revenuecat_subscription(
  p_user_id uuid, p_checked_at timestamptz, p_active boolean,
  p_expires_at timestamptz, p_product_id text, p_transaction_id text
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
begin
  if p_user_id is null or p_checked_at is null then
    raise exception 'invalid_subscription_snapshot';
  end if;
  insert into public.revenuecat_subscription_checks(user_id, checked_at, active, expires_at, product_id)
  values(p_user_id, p_checked_at, p_active, p_expires_at, p_product_id)
  on conflict(user_id) do update set checked_at = excluded.checked_at,
    active = excluded.active, expires_at = excluded.expires_at, product_id = excluded.product_id
  where public.revenuecat_subscription_checks.checked_at <= excluded.checked_at;
  if not found then return false; end if;

  if p_active and p_expires_at > now() then
    insert into public.user_cosmetics(user_id, product_id, source, store_transaction_id, expires_at)
    values(p_user_id, 'plus', 'revenuecat', p_transaction_id, p_expires_at)
    on conflict(user_id, product_id) do update set
      store_transaction_id = excluded.store_transaction_id, expires_at = excluded.expires_at
    where public.user_cosmetics.source = 'revenuecat';
  else
    delete from public.user_cosmetics where user_id = p_user_id
      and product_id = 'plus' and source = 'revenuecat';
  end if;
  return true;
end;
$$;
revoke all on function public.apply_revenuecat_subscription(uuid,timestamptz,boolean,timestamptz,text,text)
  from public, anon, authenticated;
grant execute on function public.apply_revenuecat_subscription(uuid,timestamptz,boolean,timestamptz,text,text)
  to service_role;

drop policy if exists "own purchases readable" on public.user_cosmetics;
create policy "own purchases readable" on public.user_cosmetics for select to authenticated
  using ((select auth.uid()) = user_id and (expires_at is null or expires_at > now()));

-- Enforce the same expiration on server-side nook saves, including writes made
-- while a phone is offline or before the app has refreshed its ownership cache.
create or replace function public.strip_unowned_nook()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  has_plus boolean;
  kept jsonb;
  dropped text[];
begin
  if new.nook is null or jsonb_typeof(new.nook) <> 'object' then return new; end if;
  if tg_op = 'UPDATE' and new.nook is not distinct from old.nook then return new; end if;
  select exists (select 1 from public.user_cosmetics where user_id = new.user_id
    and product_id = 'plus' and (expires_at is null or expires_at > now())) into has_plus;
  if has_plus then return new; end if;

  if jsonb_typeof(new.nook -> 'items') = 'array' then
    select coalesce(jsonb_agg(i) filter (where keep), '[]'::jsonb),
      coalesce(array_agg(i) filter (where not keep), '{}') into kept, dropped
    from (
      select t.i,
        not exists (select 1 from public.cosmetic_products p where p.id = 'item:' || t.i and coalesce(p.price_cents,0) > 0)
        or exists (select 1 from public.user_cosmetics c where c.user_id = new.user_id
          and c.product_id = 'item:' || t.i and (c.expires_at is null or c.expires_at > now())) as keep
      from jsonb_array_elements_text(new.nook -> 'items') as t(i)
    ) s;
    new.nook := jsonb_set(new.nook, '{items}', kept);
    if array_length(dropped,1) > 0 and jsonb_typeof(new.nook -> 'offsets') = 'object' then
      new.nook := jsonb_set(new.nook, '{offsets}', (new.nook -> 'offsets') - dropped);
    end if;
  end if;
  if jsonb_typeof(new.nook -> 'scene') = 'string'
    and exists (select 1 from public.cosmetic_products p where p.id = 'scene:' || (new.nook ->> 'scene') and coalesce(p.price_cents,0) > 0)
    and not exists (select 1 from public.user_cosmetics c where c.user_id = new.user_id
      and c.product_id = 'scene:' || (new.nook ->> 'scene') and (c.expires_at is null or c.expires_at > now())) then
    new.nook := jsonb_set(new.nook, '{scene}', '"night"');
  end if;
  return new;
end;
$$;
revoke all on function public.strip_unowned_nook() from public, anon, authenticated;
