import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Starts a Stripe Checkout session for one cosmetic product and returns its URL.
//
// Setup (when you are ready to link Stripe):
//   1. Create a Product + Price in Stripe for each cosmetic you want to sell.
//   2. Put each Price id in public.cosmetic_products.stripe_price_id.
//   3. Add the secret STRIPE_SECRET_KEY to this project's edge function secrets.
//   4. Deploy this function and `stripe-webhook`.
// Until then it answers { error: 'stripe_not_configured' } and the app says purchases are not available yet.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'server_misconfigured' }, 500);
  }
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  if (!STRIPE_SECRET_KEY) return json({ error: 'stripe_not_configured' }, 503);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;
  // Purchases belong to a real account, so they survive a lost phone or a reinstall. An anonymous session only
  // lives on one device.
  if (userData.user.is_anonymous) return json({ error: 'account_required' }, 403);

  let payload: { productId?: string; returnUrl?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const productId = payload.productId ?? '';
  const returnUrl = payload.returnUrl ?? '';
  if (!productId) return json({ error: 'product_required' }, 400);
  // Only send people back into this app (its custom scheme, or an Expo Go exp:// link while testing).
  if (!/^(prayer|exp|exps):\/\//.test(returnUrl)) return json({ error: 'bad_return_url' }, 400);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: product, error: productErr } = await admin
    .from('cosmetic_products')
    .select('id, billing_interval, stripe_price_id, active')
    .eq('id', productId)
    .maybeSingle();
  if (productErr) return json({ error: productErr.message }, 500);
  if (!product || !product.active) return json({ error: 'product_not_found' }, 404);
  if (!product.stripe_price_id) return json({ error: 'product_not_linked_to_stripe' }, 409);

  const { data: owned } = await admin
    .from('user_cosmetics')
    .select('product_id')
    .eq('user_id', userId)
    .in('product_id', [productId, 'plus']);
  if (owned && owned.length > 0) return json({ error: 'already_owned' }, 409);

  const form = new URLSearchParams();
  form.set('mode', product.billing_interval ? 'subscription' : 'payment');
  form.set('line_items[0][price]', product.stripe_price_id);
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', userId);
  form.set('metadata[user_id]', userId);
  form.set('metadata[product_id]', productId);
  if (product.billing_interval) {
    form.set('subscription_data[metadata][user_id]', userId);
    form.set('subscription_data[metadata][product_id]', productId);
  }
  form.set('success_url', returnUrl);
  form.set('cancel_url', returnUrl);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  const session = await res.json();
  if (!res.ok || !session.url) {
    console.error('stripe checkout failed', session);
    return json({ error: 'stripe_error' }, 502);
  }
  return json({ url: session.url });
});
