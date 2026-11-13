-- The public iOS SDK key is provisioned separately in the server-only config.
-- Accept Apple sandbox receipts for TestFlight as well as production receipts.
update public.cosmetic_products
set store_product_id = 'saintcentral_plus_monthly', price_cents = 599, billing_interval = 'month'
where id = 'plus';

update public.revenuecat_subscription_config
set product_ids = array['saintcentral_plus_monthly'], allow_sandbox = true
where id = 'subscription';
