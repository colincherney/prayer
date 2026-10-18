import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Receives Stripe webhooks and grants or revokes cosmetics.
//
// Setup (when you are ready to link Stripe):
//   1. Deploy this function with JWT verification OFF (Stripe does not send a Supabase JWT):
//      in the dashboard, turn off "Verify JWT" for stripe-webhook.
//   2. In Stripe, add a webhook endpoint at https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//      for: checkout.session.completed, customer.subscription.deleted.
//   3. Add the secrets STRIPE_WEBHOOK_SECRET (whsec_...) to the edge function secrets.
// Requests whose signature does not verify are rejected, so nobody can fake a purchase.

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** Checks the `Stripe-Signature` header (t=...,v1=...) against the raw body. */
async function verifySignature(rawBody: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const [k, ...v] = kv.split('=');
      return [k, v.join('=')];
    }),
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;
  // Reject events older than five minutes to stop replays.
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  if (!(await verifySignature(rawBody, sig, WEBHOOK_SECRET))) return json({ error: 'bad_signature' }, 400);

  const event = JSON.parse(rawBody);
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId: string | undefined = session.client_reference_id ?? session.metadata?.user_id;
    const productId: string | undefined = session.metadata?.product_id;
    // Only grant once Stripe says the money arrived (subscriptions and cards both report 'paid').
    if (!userId || !productId || session.payment_status !== 'paid') return json({ ok: true, ignored: true });

    const { error } = await admin.from('user_cosmetics').upsert(
      {
        user_id: userId,
        product_id: productId,
        source: 'stripe',
        stripe_session_id: session.id,
        stripe_customer_id: session.customer ?? null,
        stripe_subscription_id: session.subscription ?? null,
      },
      { onConflict: 'user_id,product_id' },
    );
    if (error) {
      console.error('grant failed', error);
      // 500 makes Stripe retry the webhook.
      return json({ error: error.message }, 500);
    }
    return json({ ok: true });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscriptionId: string | undefined = event.data.object.id;
    if (!subscriptionId) return json({ ok: true, ignored: true });
    const { error } = await admin.from('user_cosmetics').delete().eq('stripe_subscription_id', subscriptionId);
    if (error) {
      console.error('revoke failed', error);
      return json({ error: error.message }, 500);
    }
    return json({ ok: true });
  }

  return json({ ok: true, ignored: true });
});
