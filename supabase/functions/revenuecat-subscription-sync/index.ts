import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';
import { verifySubscription } from '../_shared/subscription.ts';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'server_misconfigured' }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);
  if (auth.user.is_anonymous) return json({ error: 'account_required' }, 403);

  try {
    const { data: config, error } = await admin.from('revenuecat_subscription_config')
      .select('*').eq('id', 'subscription').single();
    if (error || !config) throw new Error('subscription_not_configured');
    const snapshot = await verifySubscription(auth.user.id, config);
    const { error: applyError } = await admin.rpc('apply_revenuecat_subscription', {
      p_user_id: auth.user.id, p_checked_at: snapshot.checkedAt, p_active: snapshot.active,
      p_expires_at: snapshot.expiresAt, p_product_id: snapshot.productId, p_transaction_id: snapshot.transactionId,
    });
    if (applyError) throw new Error('subscription_sync_failed');
    return json({ active: snapshot.active, expiresAt: snapshot.expiresAt });
  } catch (error) {
    console.error('Subscription sync failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'subscription_sync_unavailable' }, 503);
  }
});
