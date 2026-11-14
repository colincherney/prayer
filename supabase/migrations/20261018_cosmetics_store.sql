-- Cosmetics store: what can be bought, and what each user owns.
-- Safe to run more than once. Paste into the Supabase dashboard SQL editor.
--
-- Praying and evolving stay free; these are cosmetic nook items only.
-- Clients can READ the catalog and their own purchases but cannot write purchases:
-- rows in user_cosmetics are only created by the Stripe webhook edge function (service role).

create table if not exists public.cosmetic_products (
  -- 'scene:<id>', 'item:<id>' (ids match src/components/pets/nookData.ts) or 'plus' (the bundle).
  id text primary key,
  kind text not null check (kind in ('scene', 'item', 'bundle')),
  name text not null,
  price_cents int not null check (price_cents >= 0),
  -- null = one-time purchase; 'month' or 'year' = subscription (the 'plus' bundle).
  billing_interval text check (billing_interval in ('month', 'year')),
  -- Fill this in once the product exists in Stripe (price_...). Checkout refuses products without it.
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_cosmetics (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.cosmetic_products (id),
  -- Where the grant came from: 'stripe' for real purchases, 'grant' for manual/promo grants.
  source text not null default 'stripe' check (source in ('stripe', 'grant')),
  stripe_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists user_cosmetics_subscription_idx
  on public.user_cosmetics (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.cosmetic_products enable row level security;
alter table public.user_cosmetics enable row level security;

-- Everyone signed in (including anonymous sessions) can read the catalog.
drop policy if exists "catalog readable" on public.cosmetic_products;
create policy "catalog readable"
  on public.cosmetic_products for select
  to authenticated
  using (active);

-- Users can read only their own purchases. No insert/update/delete policies on purpose:
-- only the service role (the webhook) writes here.
drop policy if exists "own purchases readable" on public.user_cosmetics;
create policy "own purchases readable"
  on public.user_cosmetics for select
  to authenticated
  using (auth.uid() = user_id);

-- Defense in depth on top of row level security: the app can only READ these tables. Even if someone adds a write
-- policy by mistake later, the underlying permissions still block inserts, updates and deletes from the client.
-- The service role (the Stripe webhook) is unaffected.
revoke all on public.cosmetic_products from anon, authenticated;
revoke all on public.user_cosmetics from anon, authenticated;
grant select on public.cosmetic_products to authenticated;
grant select on public.user_cosmetics to authenticated;

-- Starter catalog. Prices are placeholders; change them here or with a later update.
-- `on conflict do nothing` keeps any price or Stripe id you have already edited.
insert into public.cosmetic_products (id, kind, name, price_cents, billing_interval) values
  ('plus',               'bundle', 'Saint Central+',  599, 'month'),
  ('scene:meadow',       'scene',  'Meadow',          199, null),
  ('scene:aurora',       'scene',  'Aurora',          199, null),
  ('scene:advent',       'scene',  'Advent',          199, null),
  ('scene:easter',       'scene',  'Easter dawn',     199, null),
  ('item:cushion',       'item',   'Prayer cushion',   99, null),
  ('item:wreath',        'item',   'Lily wreath',      99, null),
  ('item:censer',        'item',   'Incense',          99, null),
  ('item:scripture',     'item',   'Scripture stand',  99, null),
  ('item:glass',         'item',   'Stained glass',    99, null),
  ('item:tapestry',      'item',   'Alpha & Omega',    99, null),
  ('item:mobile',        'item',   'Star mobile',      99, null),
  ('item:chimes',        'item',   'Chimes',           99, null),
  -- Halloween pieces.
  ('scene:harvest',      'scene',  'Harvest moon',    199, null),
  ('item:hay',           'item',   'Hay bale',         99, null),
  ('item:jackolantern',  'item',   'Jack-o''-lantern', 99, null),
  ('item:wheat',         'item',   'Wheat sheaf',      99, null),
  ('item:autumnwreath',  'item',   'Autumn wreath',    99, null),
  ('item:web',           'item',   'Spiderweb',        99, null),
  ('item:bats',          'item',   'Friendly bats',    99, null),
  ('item:garland',       'item',   'Candy corn garland', 99, null)
on conflict (id) do nothing;

-- If you already ran an earlier copy of this file, move the bundle from the old $3.99 placeholder to $5.99.
-- It only changes the row while it still has the old placeholder price, so a price you set yourself is kept.
update public.cosmetic_products set price_cents = 599 where id = 'plus' and price_cents = 399;
