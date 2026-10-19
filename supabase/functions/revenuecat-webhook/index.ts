import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Receives RevenueCat webhooks and grants or revokes cosmetics in public.user_cosmetics.
//
// Setup (to be filled in with the RevenueCat dashboard):
//   1. Deploy with JWT verification OFF (RevenueCat has no Supabase login; it sends a shared secret instead).
//   2. Add the secret REVENUECAT_WEBHOOK_AUTH to this project's edge function secrets, with any long random value.
//   3. In RevenueCat: Project settings, Integrations, Webhooks, add
//      https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
//      and set "Authorization header value" to the same string as REVENUECAT_WEBHOOK_AUTH.
//   4. In public.cosmetic_products, set store_product_id on each row to the App Store / Play product id that
//      RevenueCat reports as `product_id` for that cosmetic.
// The app signs users in to RevenueCat with their Supabase user id (a uuid), so `app_user_id` is that id.
// Requests without the right Authorization header are rejected, so nobody can fake a purchase.

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Compares two strings in constant time, so the secret cannot be guessed from response timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Events that mean the user now owns the product.
const GRANT = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const SECRET = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!SUPABASE_URL || !SERVICE_KEY || !SECRET) return json({ error: 'server_misconfigured' }, 500);

  const provided = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!safeEqual(provided, SECRET)) return json({ error: 'unauthorized' }, 401);

  let body: { event?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const event = body.event;
  if (!event || typeof event.type !== 'string') return json({ ok: true, ignored: true });

  const type = event.type as string;
  const userId = String(event.app_user_id ?? '');
  // Anonymous RevenueCat ids ("$RCAnonymousID:...") are not our users; ignore them.
  if (!UUID.test(userId)) return json({ ok: true, ignored: true });

  // PRODUCT_CHANGE reports the product they moved to in new_product_id.
  const storeProductId = String((type === 'PRODUCT_CHANGE' ? event.new_product_id : event.product_id) ?? '');
  if (!storeProductId) return json({ ok: true, ignored: true });
  // Google Play subscription ids look like "product:base-plan"; match on the part before the colon too.
  const candidates = Array.from(new Set([storeProductId, storeProductId.split(':')[0]]));

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: product, error: productErr } = await admin
    .from('cosmetic_products')
    .select('id, billing_interval')
    .in('store_product_id', candidates)
    .maybeSingle();
  if (productErr) {
    console.error('product lookup failed', productErr);
    return json({ error: productErr.message }, 500);
  }
  if (!product) return json({ ok: true, ignored: true, reason: 'unknown_product' });

  if (GRANT.has(type)) {
    const { error } = await admin.from('user_cosmetics').upsert(
      {
        user_id: userId,
        product_id: product.id,
        source: 'revenuecat',
        store_transaction_id: String(event.transaction_id ?? event.original_transaction_id ?? '') || null,
      },
      { onConflict: 'user_id,product_id' },
    );
    if (error) {
      console.error('grant failed', error);
      // 500 makes RevenueCat retry the webhook.
      return json({ error: error.message }, 500);
    }
    return json({ ok: true, granted: product.id });
  }

  // A subscription ending, or a purchase refunded through customer support, takes the cosmetic away.
  // A plain CANCELLATION just turns off auto-renew: they keep access until it EXPIRES.
  const refunded = type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT';
  const expired = type === 'EXPIRATION' && product.billing_interval !== null;
  if (refunded || expired) {
    const { error } = await admin.from('user_cosmetics').delete().eq('user_id', userId).eq('product_id', product.id);
    if (error) {
      console.error('revoke failed', error);
      return json({ error: error.message }, 500);
    }
    return json({ ok: true, revoked: product.id });
  }

  return json({ ok: true, ignored: true });
});
