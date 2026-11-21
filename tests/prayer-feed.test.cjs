const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { createClient } = require('@supabase/supabase-js');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(require.resolve('../src/lib/prayerFeed.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(rows) {
  const queries = [];
  const supabase = createClient('https://prayer-feed.example.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async input => {
        const { searchParams } = new URL(input);
        queries.push(searchParams);
        const visible = rows.filter(row => searchParams.getAll('id').every(filter => {
          const [op, id] = filter.split('.');
          if (op === 'gt') return row.id > id;
          if (op === 'gte') return row.id >= id;
          if (op === 'lt') return row.id < id;
          throw new Error(`Unexpected ID filter ${filter}`);
        }));
        return Response.json(visible.slice(0, Number(searchParams.get('limit'))));
      },
    },
  });
  const exports = {};
  const math = Object.assign(Object.create(Math), { random: () => 0 });
  new Function('require', 'exports', 'Math', source)(name => {
    assert.equal(name, './supabase');
    return { supabase };
  }, exports, math);
  return { ...exports, queries };
}

const idFor = n => `${n.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`;
const signal = new AbortController().signal;

test('a visit can reach every request across the wrap without repeats or a 200-row cutoff', async () => {
  const rows = Array.from({ length: 243 }, (_, index) => ({ id: idFor(index + 1) }));
  const { fetchPrayerFeedPage, queries, startPrayerFeed } = setup(rows);
  const seen = [];
  const cursor = { ...startPrayerFeed(), start: idFor(240) };
  const first = await fetchPrayerFeedPage(cursor, undefined, signal);
  const firstIds = first.requests.map(request => request.id);
  assert.deepEqual(firstIds.toSorted(), [1, 2, 3, 4, 5, 6, 240, 241, 242, 243].map(idFor));
  assert.notEqual(firstIds[0], idFor(240));
  seen.push(...firstIds);
  let next = first.next;
  for (let page = 1; next && page < 30; page++) {
    const result = await fetchPrayerFeedPage(next, undefined, signal);
    seen.push(...result.requests.map(request => request.id));
    next = result.next;
  }
  assert.equal(next, null);
  assert.deepEqual(seen.toSorted(), rows.map(row => row.id));
  assert.ok(queries.every(query => query.get('order') === 'id.asc' && Number(query.get('limit')) <= 10));
});

test('the feed filters eligible requests on the server before taking a batch', async () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const { fetchPrayerFeedPage, queries, startPrayerFeed } = setup([
    { id: idFor(1), body: 'A request', category: null, prayer_interactions: [{ count: 2 }] },
  ]);
  const { requests, next } = await fetchPrayerFeedPage(startPrayerFeed(), userId, signal);
  assert.deepEqual(requests, [{ id: idFor(1), text: 'A request', category: 'Other', prayedCount: 2 }]);
  assert.equal(next, null);
  const [query] = queries;
  assert.equal(query.get('approved'), 'eq.y');
  assert.equal(query.get('group_id'), 'is.null');
  assert.equal(query.get('or'), '(status.neq.answered,status.is.null)');
  assert.equal(query.get('user_id'), `neq.${userId}`);
  assert.equal(query.get('prayed_by_me'), 'is.null');
  assert.equal(query.get('prayed_by_me.user_id'), `eq.${userId}`);
  assert.equal(query.get('prayed_by_me.action'), 'eq.prayed');
  assert.equal(query.get('prayer_interactions.action'), 'eq.prayed');
});
