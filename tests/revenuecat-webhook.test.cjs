const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const userId = '12345678-1234-1234-1234-123456789012';
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../supabase/functions/revenuecat-webhook/index.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ env = {}, lookupError = null } = {}) {
  let handler;
  const calls = [];
  const config = {
    SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service',
    REVENUECAT_WEBHOOK_AUTH: 'fixture-webhook-secret', ...env,
  };
  const admin = { from: table => {
    const filters = [];
    let deleting = false;
    const query = {
      select: () => query,
      eq: (key, value) => { filters.push([key, value]); return query; },
      in: (key, value) => { filters.push([key, value]); return query; },
      maybeSingle: async () => {
        calls.push(['lookup', table, filters]);
        return { data: { id: 'plus', billing_interval: 'month' }, error: lookupError };
      },
      upsert: async (row, options) => { calls.push(['grant', row, options]); return { error: null }; },
      delete: () => { deleting = true; return query; },
      then: resolve => {
        if (deleting) calls.push(['revoke', table, filters]);
        return Promise.resolve({ error: null }).then(resolve);
      },
    };
    return query;
  } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'Deno', source)(
    () => ({ createClient: () => admin }), module, module.exports,
    { env: { get: key => config[key] }, serve: callback => { handler = callback; } },
  );
  return {
    calls,
    send: (event, authorization = 'Bearer fixture-webhook-secret') => handler(new Request('https://test.supabase.co/functions/v1/revenuecat-webhook', {
      method: 'POST', headers: { authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(event === null ? null : { event: { type: 'INITIAL_PURCHASE', app_user_id: userId, product_id: 'monthly', ...event } }),
    })),
  };
}

test('forged webhook requests are rejected without database access', async () => {
  const { send, calls } = setup();
  assert.equal((await send({}, 'Bearer wrong')).status, 401);
  assert.equal((await send({}, '')).status, 401);
  assert.deepEqual(calls, []);
});

test('dashboard test, null payload, anonymous IDs, and scheduled product changes do not grant access', async () => {
  const { send, calls } = setup();
  for (const event of [null, { type: 'TEST' }, { app_user_id: '$RCAnonymousID:fixture' },
    { type: 'PRODUCT_CHANGE', new_product_id: 'yearly' }, { type: 'TEMPORARY_ENTITLEMENT_GRANT' }]) {
    const response = await send(event);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ignored, true);
  }
  assert.deepEqual(calls, []);
});

test('Test Store cannot grant access until explicitly enabled for the matching sandbox product', async () => {
  const event = { store: 'TEST_STORE', environment: 'SANDBOX' };
  for (const options of [{}, { env: { REVENUECAT_TEST_PLUS_PRODUCT_ID: 'different-product' } }]) {
    const { send, calls } = setup(options);
    assert.equal((await (await send(event)).json()).reason, 'test_store_not_enabled');
    assert.deepEqual(calls, []);
  }
  const { send, calls } = setup({ env: { REVENUECAT_TEST_PLUS_PRODUCT_ID: 'monthly' } });
  assert.equal((await (await send({ ...event, environment: 'PRODUCTION' })).json()).ignored, true);
  assert.deepEqual(calls, []);
});

test('enabled monthly Test Store purchase maps to plus without changing real store product IDs', async () => {
  const { send, calls } = setup({ env: { REVENUECAT_TEST_PLUS_PRODUCT_ID: 'monthly' } });
  const response = await send({ store: 'TEST_STORE', environment: 'SANDBOX', transaction_id: 'test-transaction' });
  assert.equal((await response.json()).granted, 'plus');
  assert.deepEqual(calls[0], ['lookup', 'cosmetic_products', [['id', 'plus']]]);
  assert.deepEqual(calls[1], ['grant', {
    user_id: userId, product_id: 'plus', source: 'revenuecat', store_transaction_id: 'test-transaction',
  }, { onConflict: 'user_id,product_id' }]);
});

test('normal cancellation keeps access; expiration and refund revoke only purchase-sourced rows', async () => {
  for (const [event, revoked] of [
    [{ type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' }, false],
    [{ type: 'EXPIRATION' }, true],
    [{ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' }, true],
  ]) {
    const { send, calls } = setup();
    await send({ store: 'APP_STORE', ...event });
    const revocation = calls.find(call => call[0] === 'revoke');
    assert.equal(Boolean(revocation), revoked);
    if (revoked) assert.deepEqual(revocation[2], [['user_id', userId], ['product_id', 'plus'], ['source', 'revenuecat']]);
  }
});

test('database failures return a retryable error without database details', async () => {
  const { send } = setup({ lookupError: { message: 'private database detail' } });
  const response = await send({ store: 'APP_STORE' });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'product_lookup_failed' });
});
