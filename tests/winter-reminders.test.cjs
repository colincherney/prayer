const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Which Long Winter reminder someone gets on a given day (supabase/functions/notify-winter-event). The Edge Function
// runs in Deno, so Deno and the Supabase import are stubbed and only reminderFor() is exercised.
const projectDirectory = path.dirname(require.resolve('../package.json'));
const file = path.join(projectDirectory, 'supabase/functions/notify-winter-event/index.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
const Deno = { serve() {}, env: { get() { return undefined; } } };
new Function('require', 'module', 'exports', 'Deno', code)(() => ({ createClient() {} }), mod, mod.exports, Deno);
const { reminderFor } = mod.exports;

const event = {
  id: 'long-winter-2026',
  title: 'The Long Winter',
  starts_on: '2026-12-01',
  ends_on: '2027-01-31',
  config: { real_starts_on: '2026-12-01', challenges: Array.from({ length: 10 }, (_, i) => ({ key: `c${i}` })) },
};
const person = over => ({
  user_id: 'u', event_id: event.id, tz: 'America/New_York', stage_unlocked: 1, frost_lord_ready: false,
  challenges_completed: [], challenges_closed: [], notified: [], last_notified_on: null, ...over,
});
const done = n => Array.from({ length: n }, (_, i) => `c${i}`);

test('the first day says the event has begun', () => {
  assert.equal(reminderFor(event, person({ stage_unlocked: 0 }), '2026-12-01').key, 'start');
  assert.equal(reminderFor(event, person({ notified: ['start'] }), '2026-12-01'), null);
});

test('growing is announced the next morning, once, whatever the date', () => {
  const mage = reminderFor(event, person({ stage_unlocked: 2, challenges_completed: done(4) }), '2026-12-09');
  assert.equal(mage.key, 'mage');
  assert.equal(mage.body, 'Your Frost Mage is ready. 6 challenges to the Frost Lord.');
  assert.equal(reminderFor(event, person({ stage_unlocked: 2, challenges_completed: done(4), notified: ['mage'] }), '2026-12-10'), null);
  const lord = reminderFor(event, person({ stage_unlocked: 3, frost_lord_ready: true, challenges_completed: done(10), notified: ['mage'] }), '2026-12-20');
  assert.equal(lord.key, 'lord');
  // finishing beats an unsent Frost Mage reminder: no point telling them about the Mage now
  assert.equal(reminderFor(event, person({ stage_unlocked: 3, frost_lord_ready: true, challenges_completed: done(10) }), '2026-12-20').key, 'lord');
});

test('halfway (Jan 1) and the last three days only go to people still working on it', () => {
  const halfway = reminderFor(event, person({ challenges_completed: done(3) }), '2027-01-01');
  assert.equal(halfway.body, 'Halfway through the Long Winter. 7 challenges to go.');
  assert.equal(reminderFor(event, person({ challenges_completed: done(3) }), '2027-01-28'), null);
  assert.equal(reminderFor(event, person({ challenges_completed: done(9) }), '2027-01-29').body, '1 challenge left to the Frost Lord.');
  assert.equal(reminderFor(event, person({ challenges_completed: done(9) }), '2027-01-31').key, 'last-2027-01-31');
  // not if they can't make it any more, and never after finishing
  assert.equal(reminderFor(event, person({ challenges_completed: done(5), challenges_closed: ['c9'] }), '2027-01-30'), null);
  assert.equal(reminderFor(event, person({ stage_unlocked: 3, frost_lord_ready: true, notified: ['lord'] }), '2027-01-31'), null);
});

test('no Christmas-only reminder: Dec 25 is an ordinary day', () => {
  assert.equal(reminderFor(event, person({ challenges_completed: done(2) }), '2026-12-25'), null);
});
