const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const userId = '12345678-1234-1234-1234-123456789012';
const otherUserId = '12345678-1234-1234-1234-123456789013';
const directory = path.join(__dirname, '../supabase/functions');
const compile = name => ts.transpileModule(fs.readFileSync(path.join(directory, name), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(name, { active = false, guest = false, upstreamError = false } = {}) {
  let handler;
  const calls = [];
  const shared = { exports: {} };
  new Function('module', 'exports', 'fetch', compile('_shared/subscription.ts'))(shared, shared.exports, async url => {
    calls.push(['revenuecat', url]);
    if (upstreamError) return new Response('', { status: 503 });
    const expires = new Date(Date.now() + 60000).toISOString();
    return Response.json({ request_date_ms: Date.now(), subscriber: active ? {
      entitlements: { saint_central_app_pro: { product_identifier: 'monthly_599', expires_date: expires } },
      subscriptions: { monthly_599: { expires_date: expires, is_sandbox: true, store: 'test_store', store_transaction_id: 'verified-txn' } },
    } : {} });
  });
  const admin = {
    auth: {
      getUser: async token => token === 'fixture-user' ? { data: { user: { id: userId, is_anonymous: guest } } } : { data: {}, error: {} },
      admin: { getUserById: async id => id === userId ? { data: { user: { id, is_anonymous: guest } } } : { data: {}, error: {} } },
    },
    from: () => {
      const query = { select: () => query, eq: () => query, single: async () => ({ data: {
        entitlement_id: 'saint_central_app_pro', product_ids: ['monthly_599'], public_api_key: 'test_fixture', allow_sandbox: true,
      } }) };
      return query;
    },
    rpc: async (rpc, args) => { calls.push(['apply', rpc, args]); return { data: true }; },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'Deno', compile(`${name}/index.ts`))(
    dependency => dependency.includes('_shared') ? shared.exports : { createClient: () => admin }, module, module.exports,
    { env: { get: key => ({ SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service' })[key] },
      serve: callback => { handler = callback; } },
  );
  return { calls, send: (body, token = '') => handler(new Request(`https://fixture.supabase.co/functions/v1/${name}`, {
    method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })) };
}

test('subscription sync requires a verified permanent account', async () => {
  for (const token of ['', 'not-a-jwt']) {
    const { send, calls } = setup('revenuecat-subscription-sync');
    assert.equal((await send({}, token)).status, 401);
    assert.deepEqual(calls, []);
  }
  const { send, calls } = setup('revenuecat-subscription-sync', { guest: true });
  assert.equal((await send({}, 'fixture-user')).status, 403);
  assert.deepEqual(calls, []);
});

test('subscription sync ignores client-provided account, payment, and expiry claims', async () => {
  const { send, calls } = setup('revenuecat-subscription-sync');
  const response = await send({ user_id: otherUserId, active: true, expires_at: '2099-01-01' }, 'fixture-user');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).active, false);
  const apply = calls.find(call => call[0] === 'apply')[2];
  assert.equal(apply.p_user_id, userId);
  assert.equal(apply.p_active, false);
  assert.equal(apply.p_expires_at, null);
});

test('verified active subscription is applied using server-provided transaction and expiry', async () => {
  const { send, calls } = setup('revenuecat-subscription-sync', { active: true });
  const response = await send({}, 'fixture-user');
  assert.equal((await response.json()).active, true);
  const apply = calls.find(call => call[0] === 'apply')[2];
  assert.equal(apply.p_transaction_id, 'verified-txn');
  assert.equal(apply.p_active, true);
  assert.equal(apply.p_product_id, 'monthly_599');
});

test('forged webhook payment claims never grant access without independent RevenueCat proof', async () => {
  const { send, calls } = setup('revenuecat-subscription-webhook');
  const response = await send({ event: { type: 'INITIAL_PURCHASE', app_user_id: userId,
    product_id: 'monthly_599', expiration_at_ms: 9999999999999, entitlement_ids: ['saint_central_app_pro'] } });
  assert.equal(response.status, 200);
  assert.equal(calls.find(call => call[0] === 'apply')[2].p_active, false);
});

test('stale expiration notifications preserve a subscription that RevenueCat confirms is still active', async () => {
  const { send, calls } = setup('revenuecat-subscription-webhook', { active: true });
  await send({ event: { type: 'EXPIRATION', app_user_id: userId, product_id: 'old-product' } });
  assert.equal(calls.find(call => call[0] === 'apply')[2].p_active, true);
});

test('notifications for nonexistent users are ignored without creating RevenueCat customers', async () => {
  const { send, calls } = setup('revenuecat-subscription-webhook');
  assert.equal((await send({ event: { type: 'RENEWAL', app_user_id: otherUserId } })).status, 200);
  assert.deepEqual(calls, []);
});

test('upstream failures ask for a retry and preserve existing database access', async () => {
  for (const name of ['revenuecat-subscription-webhook', 'revenuecat-subscription-sync']) {
    const { send, calls } = setup(name, { upstreamError: true });
    assert.equal((await send({ event: { type: 'RENEWAL', app_user_id: userId } }, 'fixture-user')).status, 503);
    assert.ok(!calls.some(call => call[0] === 'apply'));
  }
});
