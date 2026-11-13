const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const monthly = {
  identifier: 'monthly', price: 5.99, priceString: '€5.99', subscriptionPeriod: 'P1M',
};
const pkg = { identifier: '$rc_monthly', product: monthly };
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/purchases.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function setup({ dev = true, platform = 'ios', native = false, nativePaywall = false, paywallResult = 'PURCHASED', active = false, activeStore, env = {}, overrides = {} } = {}) {
  const calls = [];
  let anonymous = true;
  const info = () => ({ entitlements: { active: active ? { saint_central_app_pro: {
    isActive: true, store: activeStore ?? (native && env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.startsWith('appl_') ? 'APP_STORE' : 'TEST_STORE'),
  } } : {} } });
  const offering = { identifier: 'monthly_599', availablePackages: [pkg], monthly: pkg };
  const sdk = {
    setLogLevel: () => {},
    configure: config => { anonymous = false; calls.push(['configure', config]); },
    logIn: async id => { anonymous = false; calls.push(['login', id]); },
    logOut: async () => { anonymous = true; calls.push(['logout']); },
    isAnonymous: async () => anonymous,
    getCustomerInfo: async () => info(),
    addCustomerInfoUpdateListener: () => {},
    getOfferings: async () => ({ current: { identifier: 'default', availablePackages: [] }, all: { monthly_599: offering } }),
    getProducts: async (ids, type) => {
      calls.push(['products', ids, type]);
      return ids.map(identifier => ({ identifier, price: 0.99, priceString: '$0.99', subscriptionPeriod: null }));
    },
    purchasePackage: async value => { active = true; calls.push(['package', value]); return { customerInfo: info() }; },
    purchaseStoreProduct: async product => calls.push(['product', product]),
    restorePurchases: async () => { calls.push(['restore']); return info(); },
    ...overrides,
  };
  const module = { exports: {} };
  const localRequire = name => {
    if (name === 'react-native') return {
      NativeModules: native ? { RNPurchases: {}, ...(nativePaywall ? { RNPaywalls: {} } : {}) } : {},
      Platform: { OS: platform, select: options => options[platform] ?? options.default },
    };
    if (name === 'react-native-purchases') return {
      __esModule: true, default: sdk, PURCHASE_TYPE: { SUBS: 'subs', INAPP: 'inapp' },
      LOG_LEVEL: { DEBUG: 'DEBUG' },
      PURCHASES_ERROR_CODE: {
        PURCHASE_CANCELLED_ERROR: '1', PAYMENT_PENDING_ERROR: '20', NETWORK_ERROR: '10', OFFLINE_CONNECTION_ERROR: '35',
      },
    };
    if (name === 'react-native-purchases-ui') return {
      __esModule: true,
      PAYWALL_RESULT: { PURCHASED: 'PURCHASED', RESTORED: 'RESTORED', CANCELLED: 'CANCELLED', ERROR: 'ERROR' },
      default: { presentPaywall: async options => {
        calls.push(['paywall', options]);
        if (paywallResult === 'PURCHASED' || paywallResult === 'RESTORED') active = true;
        return paywallResult;
      } },
    };
    throw new Error(`Unexpected import ${name}`);
  };
  new Function('require', 'module', 'exports', '__DEV__', 'process', source)(
    localRequire, module, module.exports, dev,
    { env: { EXPO_PUBLIC_REVENUECAT_TEST_KEY: 'test_fixture', EXPO_PUBLIC_REVENUECAT_TEST_PLUS_PRODUCT_ID: 'monthly', ...env } },
  );
  return { api: module.exports, calls };
}

test('Expo Go gets localized test prices and purchases a package without native product APIs', async () => {
  const { api, calls } = setup();
  assert.equal(api.usingTestStore, true);
  assert.equal(api.testPlusProductId, 'monthly');
  assert.deepEqual(await api.loadStorePrices('user-a', [{ storeProductId: 'monthly', subscription: true }]), [{
    storeProductId: 'monthly', priceCents: 599, priceString: '€5.99', subscriptionPeriod: 'P1M',
  }]);
  assert.deepEqual(await api.buyStoreProduct('user-a', 'monthly', true), { ok: true });
  assert.deepEqual(calls.map(call => call[0]), ['configure', 'package']);
  assert.equal(calls[0][1].appUserID, 'user-a');
});

test('release builds ignore the test key and use only the correct platform key', async () => {
  const { api, calls } = setup({ dev: false, native: true, platform: 'android', env: {
    EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: 'goog_fixture', EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_other',
  } });
  assert.equal(api.usingTestStore, false);
  assert.equal(api.testPlusProductId, undefined);
  await api.loadStorePrices('user-a', [{ storeProductId: 'monthly', subscription: true }]);
  assert.equal(calls[0][1].apiKey, 'goog_fixture');
});

test('native iOS development uses Apple billing even when the Expo Go test key is present', async () => {
  const { api, calls } = setup({ native: true, nativePaywall: true, env: {
    EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_fixture',
  } });
  assert.equal(api.usingTestStore, false);
  assert.equal(api.testPlusProductId, undefined);
  assert.deepEqual(await api.presentSubscriptionPaywall('user-a'), { ok: true, active: true });
  assert.equal(calls.find(call => call[0] === 'configure')[1].apiKey, 'appl_fixture');
  assert.equal(calls.filter(call => call[0] === 'paywall').length, 1);
});

test('Expo Go keeps simulated checkout when an iOS key is also configured', async () => {
  const { api, calls } = setup({ env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_fixture' } });
  assert.equal(api.usingTestStore, true);
  await api.presentSubscriptionPaywall('user-a');
  assert.equal(calls.find(call => call[0] === 'configure')[1].apiKey, 'test_fixture');
});

test('a previous Test Store entitlement cannot skip native Apple checkout', async () => {
  const { api, calls } = setup({ native: true, nativePaywall: true, active: true, activeStore: 'TEST_STORE',
    env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_fixture' } });
  await api.presentSubscriptionPaywall('user-a');
  assert.equal(calls.filter(call => call[0] === 'paywall').length, 1);
});

test('a release without the native purchases module never initializes simulated billing', async () => {
  const { api, calls } = setup({ dev: false, env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_fixture' } });
  assert.equal(api.purchasesAvailable, false);
  assert.equal((await api.presentSubscriptionPaywall('user-a')).ok, false);
  assert.equal(calls.length, 0);
});

test('release without a production key cannot initialize Test Store, including misfiled test keys', async () => {
  for (const iosKey of [undefined, 'test_wrong_slot', 'goog_wrong_platform', 'sk_secret']) {
    const { api, calls } = setup({ dev: false, env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: iosKey } });
    assert.equal(api.purchasesAvailable, false);
    assert.equal((await api.buyStoreProduct('user-a', 'monthly', true)).ok, false);
    assert.equal(calls.length, 0);
  }
});

test('web development also uses the Test Store package flow', async () => {
  const { api, calls } = setup({ platform: 'web' });
  assert.deepEqual(await api.buyStoreProduct('user-a', 'monthly', true), { ok: true });
  assert.equal(calls.at(-1)[0], 'package');
});

test('unknown products and a subscription sold as a one-time item never start a purchase', async () => {
  const { api, calls } = setup();
  assert.deepEqual(await api.loadStorePrices('user-a', [{ storeProductId: 'monthly', subscription: false }]), []);
  for (const [id, subscription] of [['monthly', false], ['unconfigured', true]]) {
    assert.equal((await api.buyStoreProduct('user-a', id, subscription)).ok, false);
  }
  assert.ok(!calls.some(call => call[0] === 'package' || call[0] === 'product'));
});

test('native one-time cosmetics work outside an offering', async () => {
  const { api, calls } = setup({ dev: false, native: true, env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_fixture' } });
  const quotes = await api.loadStorePrices('user-a', [{ storeProductId: 'prayer_cushion', subscription: false }]);
  assert.equal(quotes[0].priceString, '$0.99');
  assert.deepEqual(await api.buyStoreProduct('user-a', 'prayer_cushion', false), { ok: true });
  assert.equal(calls.at(-1)[0], 'product');
  assert.deepEqual(calls.find(call => call[0] === 'products'), ['products', ['prayer_cushion'], 'inapp']);
});

test('cancel, pending payment, network failure, and simulated failure have distinct results', async () => {
  for (const [error, expected] of [
    [{ code: '1' }, { cancelled: true, message: '' }],
    [{ userCancelled: true }, { cancelled: true, message: '' }],
    [{ code: '20' }, { message: /awaiting approval/ }],
    [{ code: '10' }, { message: /connection/ }],
    [{ code: '35' }, { message: /connection/ }],
    [{ code: '42' }, { message: /try again/ }],
  ]) {
    const { api } = setup({ overrides: { purchasePackage: async () => { throw error; } } });
    const result = await api.buyStoreProduct('user-a', 'monthly', true);
    assert.equal(result.ok, false);
    assert.equal(result.cancelled, expected.cancelled);
    if (typeof expected.message === 'string') assert.equal(result.message, expected.message);
    else assert.match(result.message, expected.message);
  }
});

test('restore failures are returned to the caller instead of reported as success', async () => {
  const { api } = setup({ overrides: { restorePurchases: async () => { throw { code: '10' }; } } });
  const result = await api.restoreStorePurchases('user-a');
  assert.equal(result.ok, false);
  assert.match(result.message, /connection/);
});

test('identity changes and logout wait until a pending purchase has finished', async () => {
  let finishPurchase;
  let purchaseStarted;
  const started = new Promise(resolve => { purchaseStarted = resolve; });
  const { api, calls } = setup({ overrides: { purchasePackage: async () => {
    purchaseStarted();
    await new Promise(resolve => { finishPurchase = resolve; });
    calls.push(['purchase-finished']);
  } } });
  const purchase = api.buyStoreProduct('user-a', 'monthly', true);
  await started;
  const logout = api.signOutOfPurchases();
  const nextUser = api.loadStorePrices('user-b', [{ storeProductId: 'monthly', subscription: true }]);
  assert.deepEqual(calls.map(call => call[0]), ['configure']);
  finishPurchase();
  await Promise.all([purchase, logout, nextUser]);
  assert.deepEqual(calls.map(call => call[0]), ['configure', 'purchase-finished', 'logout', 'login']);
  assert.equal(calls.at(-1)[1], 'user-b');
});

test('offline store logout does not block account sign-out and the next checkout identifies its user', async () => {
  let offline = true;
  const { api, calls } = setup({ overrides: { logOut: async () => { if (offline) throw { code: '10' }; } } });
  await api.loadStorePrices('user-a', []);
  await assert.doesNotReject(api.signOutOfPurchases());
  offline = false;
  await api.restoreStorePurchases('user-b');
  assert.deepEqual(calls.find(call => call[0] === 'login'), ['login', 'user-b']);
});

test('subscription CTA opens the specific published native paywall and never double-purchases', async () => {
  const { api, calls } = setup({ native: true, nativePaywall: true });
  assert.deepEqual(await api.presentSubscriptionPaywall('user-a'), { ok: true, active: true });
  const presentation = calls.find(call => call[0] === 'paywall');
  assert.equal(presentation[1].offering.identifier, 'monthly_599');
  assert.equal(presentation[1].displayCloseButton, true);
  assert.ok(!calls.some(call => call[0] === 'package' || call[0] === 'product'));
});

test('closing the native paywall is quiet and does not grant subscription access', async () => {
  const { api, calls } = setup({ native: true, nativePaywall: true, paywallResult: 'CANCELLED' });
  assert.deepEqual(await api.presentSubscriptionPaywall('user-a'), { ok: false, cancelled: true, message: '' });
  assert.equal(calls.filter(call => call[0] === 'paywall').length, 1);
});

test('an active entitlement avoids opening another subscription checkout', async () => {
  const { api, calls } = setup({ native: true, nativePaywall: true, active: true });
  assert.deepEqual(await api.presentSubscriptionPaywall('user-a'), { ok: true, active: true });
  assert.ok(!calls.some(call => call[0] === 'paywall'));
});

test('subscription checkout does not fall back to a default offering with unrelated plans', async () => {
  const { api, calls } = setup({ overrides: { getOfferings: async () => ({ all: {}, current: { monthly: pkg } }) } });
  assert.equal((await api.presentSubscriptionPaywall('user-a')).ok, false);
  assert.ok(!calls.some(call => call[0] === 'package'));
});

test('Expo Go uses the chosen monthly test package and publishes an account refresh event', async () => {
  const { api, calls } = setup();
  const events = [];
  const unsubscribe = api.onPurchaseUpdated(id => events.push(id));
  assert.deepEqual(await api.presentSubscriptionPaywall('user-a'), { ok: true, active: true });
  assert.equal(calls.at(-1)[1], pkg);
  assert.deepEqual(events, ['user-a']);
  unsubscribe();
});

test('restore reports whether a subscription entitlement is actually active', async () => {
  const { api } = setup();
  assert.deepEqual(await api.restoreStorePurchases('user-a'), { ok: true, active: false });
});

test('a failed price request can be retried without leaving checkout stuck unavailable', async () => {
  let attempts = 0;
  const offering = { identifier: 'monthly_599', availablePackages: [pkg], monthly: pkg };
  const { api } = setup({ overrides: { getOfferings: async () => {
    if (++attempts === 1) throw { code: '10', message: 'temporary connection failure' };
    return { current: null, all: { monthly_599: offering } };
  } } });
  const request = [{ storeProductId: 'monthly', subscription: true }];
  await assert.rejects(api.loadStorePrices('user-a', request));
  const prices = await api.loadStorePrices('user-a', request);
  assert.equal(prices[0].priceString, '€5.99');
  assert.deepEqual(await api.presentSubscriptionPaywall('user-a'), { ok: true, active: true });
});
