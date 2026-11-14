import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';
import { verifySubscription } from '../_shared/subscription.ts';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// This endpoint treats every notification as untrusted. It never copies access,
// product, expiry, or payment claims from a webhook into the database. A fresh
// authenticated RevenueCat API lookup must independently prove the entitlement.
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (Number(req.headers.get('content-length') ?? 0) > 65536) return json({ error: 'body_too_large' }, 413);
  let event;
  try {
    const raw = await req.text();
    if (raw.length > 65536) return json({ error: 'body_too_large' }, 413);
    event = JSON.parse(raw)?.event;
  } catch { return json({ error: 'invalid_json' }, 400); }
  if (!event || typeof event.type !== 'string') return json({ error: 'invalid_event' }, 400);
  if (event.type === 'TEST') return json({ ok: true });
  const ids: unknown[] = event.type === 'TRANSFER'
    ? [...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
      ...(Array.isArray(event.transferred_to) ? event.transferred_to : [])]
    : [event.app_user_id];
  const userIds = [...new Set(ids.filter((id): id is string => typeof id === 'string' && UUID.test(id)))].slice(0, 20);
  if (!userIds.length) return json({ ok: true, ignored: true });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'server_misconfigured' }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  try {
    const { data: config, error } = await admin.from('revenuecat_subscription_config')
      .select('*').eq('id', 'subscription').single();
    if (error || !config) throw new Error('subscription_not_configured');
    await Promise.all(userIds.map(async userId => {
      const { data, error: userError } = await admin.auth.admin.getUserById(userId);
      if (userError || !data.user || data.user.is_anonymous) return;
      const snapshot = await verifySubscription(userId, config);
      const { error: applyError } = await admin.rpc('apply_revenuecat_subscription', {
        p_user_id: userId, p_checked_at: snapshot.checkedAt, p_active: snapshot.active,
        p_expires_at: snapshot.expiresAt, p_product_id: snapshot.productId, p_transaction_id: snapshot.transactionId,
      });
      if (applyError) throw new Error('subscription_sync_failed');
    }));
    return json({ ok: true });
  } catch (error) {
    console.error('Subscription notification verification failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'subscription_verification_unavailable' }, 503);
  }
});
