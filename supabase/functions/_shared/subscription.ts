export type SubscriptionConfig = {
  entitlement_id: string;
  offering_id: string;
  product_ids: string[];
  public_api_key: string;
  allow_sandbox: boolean;
};

type Subscriber = {
  entitlements?: Record<string, {
    product_identifier?: string;
    expires_date?: string | null;
    grace_period_expires_date?: string | null;
  }>;
  subscriptions?: Record<string, {
    expires_date?: string | null;
    grace_period_expires_date?: string | null;
    is_sandbox?: boolean;
    store?: string;
    refunded_at?: string | null;
    store_transaction_id?: string | number | null;
  }>;
};

export function subscriptionSnapshot(subscriber: Subscriber, config: SubscriptionConfig, now = Date.now()) {
  const entitlement = subscriber.entitlements?.[config.entitlement_id];
  const productId = entitlement?.product_identifier;
  const subscription = productId ? subscriber.subscriptions?.[productId] : undefined;
  const expectedStore = config.public_api_key.startsWith('appl_') ? 'app_store'
    : config.public_api_key.startsWith('goog_') ? 'play_store'
      : config.public_api_key.startsWith('test_') ? 'test_store' : null;
  const dates = [entitlement?.expires_date, entitlement?.grace_period_expires_date,
    subscription?.grace_period_expires_date]
    .flatMap(value => value && Number.isFinite(Date.parse(value)) ? [Date.parse(value)] : []);
  const expires = dates.length ? Math.max(...dates) : 0;
  const active = Boolean(entitlement && productId && config.product_ids.includes(productId)
    && subscription && expectedStore && subscription.store === expectedStore && !subscription.refunded_at
    && (config.allow_sandbox || subscription.is_sandbox === false) && expires > now);
  return {
    active,
    expiresAt: expires ? new Date(expires).toISOString() : null,
    productId: productId ?? null,
    transactionId: subscription?.store_transaction_id == null ? null : String(subscription.store_transaction_id),
  };
}

// Webhooks are notifications to re-check status, never proof of payment.
// Only RevenueCat's authenticated REST response is allowed to grant access.
export async function verifySubscription(
  userId: string,
  config: SubscriptionConfig,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${config.public_api_key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('revenuecat_unavailable');
  const body = await response.json();
  if (!body || typeof body.subscriber !== 'object' || body.subscriber === null || Array.isArray(body.subscriber)
    || typeof body.request_date_ms !== 'number' || !Number.isFinite(body.request_date_ms)) {
    throw new Error('invalid_revenuecat_response');
  }
  return {
    ...subscriptionSnapshot(body.subscriber, config),
    checkedAt: new Date(body.request_date_ms).toISOString(),
  };
}
