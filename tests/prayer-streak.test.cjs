const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

process.env.TZ = 'America/New_York';

function load(name, dependencies = {}) {
  const file = path.join(__dirname, '../src/lib', `${name}.ts`);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function('exports', 'require', outputText)(exports, id => dependencies[id] ?? require(id));
  return exports;
}

const streak = load('prayerStreak');
const daysOf = (...dates) => new Set(dates.map(date => streak.prayerDay(new Date(date))));

test('a local prayer day counts once, and missing the following day expires the streak at midnight', () => {
  const days = daysOf('2026-11-20T10:00:00', '2026-11-21T08:00:00', '2026-11-21T20:00:00');
  const expiresAt = new Date('2026-11-23T00:00:00');
  assert.deepEqual(streak.getPrayerStreak(days, new Date('2026-11-21T21:00:00')), { count: 2, expiresAt });
  assert.deepEqual(streak.getPrayerStreak(days, new Date('2026-11-22T23:59:59')), { count: 2, expiresAt });
  assert.equal(streak.getPrayerStreak(days, expiresAt), null);
  days.add(streak.prayerDay(new Date('2026-11-23T12:00:00')));
  assert.deepEqual(streak.getPrayerStreak(days, new Date('2026-11-23T13:00:00')), {
    count: 1,
    expiresAt: new Date('2026-11-25T00:00:00'),
  });
});

test('the deadline follows local midnight across a daylight-saving change', () => {
  const days = daysOf('2026-03-07T12:00:00-05:00');
  const { expiresAt } = streak.getPrayerStreak(days, new Date('2026-03-08T00:00:00-05:00'));
  assert.equal(expiresAt.toISOString(), '2026-03-09T04:00:00.000Z');
});

test('starting is opt-in and a saved prayer refreshes the running activity before sign-out ends it', async () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const rows = [{ created_at: yesterday.toISOString() }];
  let saved;
  let active;
  let buttons;
  let statusReads = 0;
  let startCount = 0;
  let props;
  let loadPrayers = async () => ({ data: rows });
  const activity = load('prayerStreakActivity', {
    'react-native': { Platform: { OS: 'ios' }, Alert: { alert(_title, _message, actions) { buttons = actions; } } },
    './localCache': {
      LOCAL_KEYS: { prayerStreakActivity: 'streak' },
      readLocal: () => saved,
      writeLocal: async (_key, data) => { saved = data; },
      clearLocal: async () => { saved = undefined; },
    },
    './prayerHistory': { fetchOfferedPrayerHistory: () => ({ abortSignal: () => loadPrayers() }) },
    './prayerStreak': streak,
    '@/widgets/PrayerStreakActivity': {
      __esModule: true,
      default: {
        getInstances: () => {
          statusReads += 1;
          return active ? [active] : [];
        },
        start(data, url, staleDate) {
          assert.equal(url, 'prayer:///explore');
          assert.equal(staleDate.getTime(), data.expiresAt);
          startCount += 1;
          props = data;
          active = {
            getId: () => 'live-id',
            update: async (next, deadline) => {
              assert.equal(deadline.getTime(), next.expiresAt);
              props = next;
            },
            end: async policy => { assert.equal(policy, 'immediate'); active = undefined; },
          };
          return active;
        },
      },
    },
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const button = text => buttons?.find(item => item.text === text);

  activity.setPrayerStreakActivityUser('owner');
  activity.showPrayerStreakActivityControls('owner');
  assert.equal(active, undefined);
  assert.equal(statusReads, 0);
  assert.equal(button('Cancel')?.style, 'cancel');
  const start = button('Start Live Activity');
  assert.ok(start);
  start.onPress();
  start.onPress();
  await flush();
  assert.equal(startCount, 1);
  assert.equal(props.count, 1);
  const firstDeadline = props.expiresAt;

  rows.unshift({ created_at: today.toISOString() });
  let finishRefresh;
  loadPrayers = () => new Promise(resolve => { finishRefresh = () => resolve({ data: rows }); });
  activity.refreshPrayerStreakActivity('owner');
  await flush();
  assert.equal(typeof finishRefresh, 'function');

  // Present the controls on the tap and perform no additional native status reads.
  const readsBeforeTap = statusReads;
  buttons = undefined;
  try {
    activity.showPrayerStreakActivityControls('owner');
    assert.ok(button('Start Live Activity'));
    assert.ok(button('End Live Activity'));
    await flush();
    assert.equal(statusReads, readsBeforeTap);
  } finally {
    finishRefresh();
  }
  await flush();
  assert.equal(props.count, 2);
  assert.ok(props.expiresAt > firstDeadline);

  button('End Live Activity').onPress();
  await flush();
  assert.equal(active, undefined);
  assert.equal(saved, undefined);

  loadPrayers = async () => ({ data: rows });
  start.onPress();
  await flush();
  assert.ok(active);
  activity.setPrayerStreakActivityUser(null);
  await flush();
  assert.equal(active, undefined);
  assert.equal(saved, undefined);
});
