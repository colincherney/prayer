const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../supabase/functions/_shared/subscription.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleObject = { exports: {} };
new Function('module', 'exports', source)(moduleObject, moduleObject.exports);
const { subscriptionSnapshot, verifySubscription } = moduleObject.exports;
const config = { entitlement_id: 'saint_central_app_pro', product_ids: ['monthly_599'], public_api_key: 'test_fixture', allow_sandbox: true };
const now = Date.now();
const future = new Date(now + 60000).toISOString();
const past = new Date(now - 60000).toISOString();
const subscriber = () => ({
  entitlements: { saint_central_app_pro: { product_identifier: 'monthly_599', expires_date: future } },
  subscriptions: { monthly_599: { expires_date: future, is_sandbox: true, store: 'test_store', store_transaction_id: 'txn-fixture' } },
});

test('server derives an active subscription and expiry from the correct RevenueCat entitlement', () => {
  assert.deepEqual(subscriptionSnapshot(subscriber(), config, now), {
    active: true, expiresAt: future, productId: 'monthly_599', transactionId: 'txn-fixture',
  });
});

test('missing entitlement, expired access, refunds, unrelated products, and lifetime products do not grant access', () => {
  const cases = [
    { subscriptions: subscriber().subscriptions },
    { entitlements: { saint_central_app_pro: { product_identifier: 'monthly_599', expires_date: past } }, subscriptions: subscriber().subscriptions },
    { ...subscriber(), subscriptions: { monthly_599: { expires_date: future, refunded_at: past } } },
    { entitlements: { saint_central_app_pro: { product_identifier: 'lifetime', expires_date: null } } },
    { entitlements: { other_entitlement: { product_identifier: 'monthly_599', expires_date: future } }, subscriptions: subscriber().subscriptions },
  ];
  for (const value of cases) assert.equal(subscriptionSnapshot(value, config, now).active, false);
});

test('cancellation preserves a paid period and grace periods remain active until grace expiry', () => {
  const value = subscriber();
  value.subscriptions.monthly_599.unsubscribe_detected_at = past;
  assert.equal(subscriptionSnapshot(value, config, now).active, true);
  value.entitlements.saint_central_app_pro.expires_date = past;
  value.subscriptions.monthly_599.grace_period_expires_date = future;
  assert.equal(subscriptionSnapshot(value, config, now).active, true);
});

test('sandbox subscriptions are denied when the backend is configured for production only', () => {
  assert.equal(subscriptionSnapshot(subscriber(), { ...config, allow_sandbox: false }, now).active, false);
  const value = subscriber();
  value.subscriptions.monthly_599.is_sandbox = false;
  assert.equal(subscriptionSnapshot(value, { ...config, allow_sandbox: false }, now).active, true);
});

test('Apple verification accepts Apple sandbox and production receipts and rejects Test Store access', () => {
  const appleConfig = { ...config, public_api_key: 'appl_fixture', product_ids: ['saintcentral_plus_monthly'] };
  const value = {
    entitlements: { saint_central_app_pro: { product_identifier: 'saintcentral_plus_monthly', expires_date: future } },
    subscriptions: { saintcentral_plus_monthly: { expires_date: future, is_sandbox: true, store: 'app_store' } },
  };
  assert.equal(subscriptionSnapshot(value, appleConfig, now).active, true);
  value.subscriptions.saintcentral_plus_monthly.is_sandbox = false;
  assert.equal(subscriptionSnapshot(value, appleConfig, now).active, true);
  for (const store of ['test_store', 'play_store', 'promotional', undefined]) {
    value.subscriptions.saintcentral_plus_monthly.store = store;
    assert.equal(subscriptionSnapshot(value, appleConfig, now).active, false);
  }
  assert.equal(subscriptionSnapshot(subscriber(), appleConfig, now).active, false);
});

test('verification calls RevenueCat for the user and uses RevenueCat snapshot time', async () => {
  const result = await verifySubscription('user/fixture', config, async (url, options) => {
    assert.equal(url, 'https://api.revenuecat.com/v1/subscribers/user%2Ffixture');
    assert.equal(options.headers.Authorization, 'Bearer test_fixture');
    return Response.json({ subscriber: subscriber(), request_date_ms: now });
  });
  assert.equal(result.active, true);
  assert.equal(result.checkedAt, new Date(now).toISOString());
});

test('a failed or malformed RevenueCat response never becomes an inactive snapshot that revokes access', async () => {
  for (const response of [new Response('', { status: 503 }),
    Response.json({ subscriber: null, request_date_ms: now }),
    Response.json({ subscriber: [], request_date_ms: now }),
    Response.json({ subscriber: {} }),
  ]) await assert.rejects(verifySubscription('user-a', config, async () => response));
});
