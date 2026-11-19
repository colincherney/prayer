const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const compile = filename => ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load(filename, dependencies = {}, fetcher = fetch) {
  const module = { exports: {} };
  new Function('module', 'exports', 'require', 'fetch', compile(filename))(
    module, module.exports, name => dependencies[name], fetcher,
  );
  return module.exports;
}
const helper = 'supabase/functions/_shared/prayerNotifications.ts';
const message = (index, key = `job-${index}`) => ({ key, to: `ExponentPushToken[${index}]`,
  title: 'A moment to reflect', body: 'Take a quiet moment to reflect on your prayers.',
  data: { type: 'prayer_reflection_reminder' }, sound: 'default', channelId: 'default' });

test('notification taps open the group or personal prayer history without selecting a prayer', () => {
  const { notificationDestination: destination } = load('src/lib/notificationDestination.ts');
  const id = '12345678-1234-1234-1234-123456789012';
  assert.deepEqual(destination({ type: 'group_prayer', group_id: id }), { pathname: '/group/[id]', params: { id } });
  assert.equal(destination({ type: 'prayer_reflection_reminder', prayer_id: 'ignored' }), '/myPrayers');
  assert.equal(destination({ type: 'reflection' }), '/myPrayers');
  assert.equal(destination({ type: 'daily_reminder' }), '/');
  assert.equal(destination({ type: 'group_prayer', group_id: '../auth' }), null);
  assert.equal(destination(), null);
});

test('pushes batch at 100, remove internal keys, and retain receipt IDs', async () => {
  const batches = [];
  const { sendPrayerPushes } = load(helper, {}, async (_url, options) => {
    const batch = JSON.parse(options.body);
    batches.push(batch);
    return Response.json({ data: batch.map(m => ({ status: 'ok', id: m.to })) });
  });
  const result = await sendPrayerPushes(Array.from({ length: 101 }, (_, i) => message(i)));
  assert.deepEqual(batches.map(b => b.length), [100, 1]);
  assert.equal(result.accepted.size, 101);
  assert.equal(result.receipts.length, 101);
  assert.ok(batches.flat().every(m => !('key' in m) && !('prayer_id' in m.data)));
});

test('an accepted device prevents retrying a reminder on the same user’s other device', async () => {
  const { sendPrayerPushes } = load(helper, {}, async () => Response.json({ data: [
    { status: 'ok', id: 'ticket-1' }, { status: 'error', details: { error: 'DeviceNotRegistered' } },
    { status: 'error', details: { error: 'InvalidCredentials' } },
  ] }));
  const result = await sendPrayerPushes([message(1, 'same-user'), message(2, 'same-user'), message(3)]);
  assert.deepEqual([...result.accepted], ['same-user']);
  assert.deepEqual(result.invalidTokens, ['ExponentPushToken[2]']);
});

test('network, HTTP, and malformed-ticket failures stay eligible for retry', async () => {
  for (const fetcher of [async () => { throw new Error('offline'); },
    async () => new Response('', { status: 503 }), async () => Response.json({ data: [] })]) {
    const result = await load(helper, {}, fetcher).sendPrayerPushes([message(1)]);
    assert.equal(result.accepted.size, 0);
    assert.deepEqual(result.invalidTokens, []);
  }
});

test('receipt checks distinguish unregistered devices from server credential errors', async () => {
  const { readPrayerPushReceipts } = load(helper, {}, async () => Response.json({ data: {
    accepted: { status: 'ok' }, gone: { status: 'error', details: { error: 'DeviceNotRegistered' } },
    credentials: { status: 'error', details: { error: 'InvalidCredentials' } },
  } }));
  assert.deepEqual(await readPrayerPushReceipts(['accepted', 'gone', 'credentials', 'pending']), {
    checked: ['accepted', 'gone', 'credentials'], invalid: ['gone'],
  });
});

function worker({ accepted = true, tokenError = false, schedulerToken = null } = {}) {
  let handler;
  const calls = [];
  const group = { id: 'group-job', user_id: 'member', group_id: 'group-id', group_name: 'Our circle', claimed_at: '2026-11-14T20:00:00Z' };
  const reflection = { user_id: 'author', previous_date: null, sent_date: '2026-11-14' };
  const admin = {
    rpc: async name => { calls.push(['rpc', name]); return { data: name === 'claim_group_prayer_notifications' ? [group] : [reflection] }; },
    from: table => {
      const action = { table, operation: 'select', filters: [] };
      const query = {
        select: () => query,
        delete: () => { action.operation = 'delete'; return query; },
        update: values => { action.operation = 'update'; action.values = values; return query; },
        upsert: values => { action.operation = 'upsert'; action.values = values; return query; },
        eq: (key, value) => { action.filters.push([key, value]); return query; },
        in: () => query, lt: () => query, order: () => query, limit: () => query, maybeSingle: () => query,
        then: (resolve, reject) => {
          calls.push(action);
          const response = table === 'notifications_config' ? { data: { service_role_key: schedulerToken } }
            : table === 'push_tokens' && action.operation === 'select'
            ? { data: [{ user_id: 'member', token: 'member-device' }, { user_id: 'author', token: 'author-device' }], error: tokenError ? {} : null }
            : { data: [], error: null };
          return Promise.resolve(response).then(resolve, reject);
        },
      };
      return query;
    },
  };
  new Function('require', 'exports', 'Deno', compile('supabase/functions/notify-prayer-activity/index.ts'))(
    name => name.startsWith('https:') ? { createClient: () => admin } : {
      readPrayerPushReceipts: async () => ({ checked: [], invalid: [] }),
      sendPrayerPushes: async messages => {
        calls.push(['push', messages]);
        return { accepted: new Set(accepted ? ['group-job', 'reflect:author'] : []), receipts: [], invalidTokens: [] };
      },
    },
    {},
    { env: { get: key => ({ SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service' })[key] },
      serve: callback => { handler = callback; } },
  );
  return { calls, send: token => handler(new Request('https://fixture.supabase.co', {
    method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' },
  })) };
}

test('only the service credential can claim or send prayer notifications', async () => {
  for (const token of ['', 'user-jwt']) {
    const fixture = worker();
    assert.equal((await fixture.send(token)).status, 401);
    assert.deepEqual(fixture.calls, []);
  }
});

test('worker sends general reflection copy and acknowledges accepted group deliveries', async () => {
  const fixture = worker();
  assert.equal((await fixture.send('fixture-service')).status, 200);
  const messages = fixture.calls.find(call => Array.isArray(call) && call[0] === 'push')[1];
  const reflection = messages.find(m => m.data.type === 'prayer_reflection_reminder');
  assert.equal(reflection.body, 'Take a quiet moment to reflect on your prayers.');
  assert.deepEqual(reflection.data, { type: 'prayer_reflection_reminder' });
  assert.deepEqual(messages.find(m => m.data.type === 'group_prayer').data, { type: 'group_prayer', group_id: 'group-id' });
  assert.ok(fixture.calls.some(call => call.table === 'group_prayer_notification_queue' && call.operation === 'update'));
  assert.ok(!fixture.calls.some(call => call.table === 'notification_preferences' && call.operation === 'update'));
});

test('the exact private legacy service credential can authorize the existing scheduler', async () => {
  const schedulerToken = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  const fixture = worker({ schedulerToken });
  assert.equal((await fixture.send(schedulerToken)).status, 200);
  assert.ok(fixture.calls.some(call => Array.isArray(call) && call[0] === 'rpc'));
});

test('a forged service-role claim and an anonymous credential cannot authorize delivery', async () => {
  const forged = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.forged`;
  const anon = `header.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`;
  for (const token of [forged, anon]) {
    const fixture = worker({ schedulerToken: anon });
    assert.equal((await fixture.send(token)).status, 401);
    assert.ok(!fixture.calls.some(call => Array.isArray(call) && call[0] === 'rpc'));
  }
});

test('failed pushes restore reflection eligibility and leave group leases available for retry', async () => {
  const fixture = worker({ accepted: false });
  await fixture.send('fixture-service');
  const restore = fixture.calls.find(call => call.table === 'notification_preferences' && call.operation === 'update');
  assert.deepEqual(restore.values, { reflection_reminder_last_sent_date: null });
  assert.deepEqual(restore.filters, [['user_id', 'author'], ['reflection_reminder_last_sent_date', '2026-11-14']]);
  assert.ok(!fixture.calls.some(call => call.table === 'group_prayer_notification_queue' && call.operation === 'update'));
});

test('token lookup failure releases the claimed reflection reminder', async () => {
  const fixture = worker({ tokenError: true });
  assert.equal((await fixture.send('fixture-service')).status, 500);
  assert.ok(fixture.calls.some(call => call.table === 'notification_preferences' && call.operation === 'update'));
  assert.ok(!fixture.calls.some(call => Array.isArray(call) && call[0] === 'push'));
});
