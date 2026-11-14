-- Swap Stripe for RevenueCat. Applied to the live project on 2026-10-18 (user_cosmetics and the Stripe columns were
-- empty when this ran). See supabase/SQL_CHANGES.md for how to revert.

-- Which App Store / Google Play product each cosmetic is sold as. Filled in once the products exist in
-- App Store Connect / Play Console and are added to RevenueCat.
alter table public.cosmetic_products add column if not exists store_product_id text;
alter table public.cosmetic_products drop column if exists stripe_price_id;
create unique index if not exists cosmetic_products_store_product_id_key
  on public.cosmetic_products (store_product_id) where store_product_id is not null;

drop index if exists public.user_cosmetics_subscription_idx;
alter table public.user_cosmetics drop column if exists stripe_session_id;
alter table public.user_cosmetics drop column if exists stripe_customer_id;
alter table public.user_cosmetics drop column if exists stripe_subscription_id;
alter table public.user_cosmetics add column if not exists store_transaction_id text;

update public.user_cosmetics set source = 'grant' where source not in ('revenuecat', 'grant');
alter table public.user_cosmetics alter column source set default 'revenuecat';
alter table public.user_cosmetics drop constraint if exists user_cosmetics_source_check;
alter table public.user_cosmetics add constraint user_cosmetics_source_check check (source in ('revenuecat', 'grant'));
