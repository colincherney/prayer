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

test('the Home Screen widget updates at local midnight and clears an expired streak', () => {
  const now = new Date('2026-03-07T19:00:00-05:00');
  const days = daysOf('2026-03-06T18:00:00-05:00', '2026-03-07T08:00:00-05:00');
  const midnight = new Date('2026-03-08T00:00:00-05:00');
  const expiry = new Date('2026-03-09T00:00:00-04:00');
  assert.deepEqual(streak.prayerStreakWidgetTimeline(days, now), [
    { date: now, props: { count: 2, prayedToday: true, expiresAt: expiry.getTime() } },
    { date: midnight, props: { count: 2, prayedToday: false, expiresAt: expiry.getTime() } },
    { date: expiry, props: { count: 0 } },
  ]);
  assert.deepEqual(streak.prayerStreakWidgetTimeline(days, expiry), [{ date: expiry, props: { count: 0 } }]);
});

test('the Home Screen prayer widgets adopt the new theme and clear streak data on sign-out', async t => {
  const now = new Date('2026-11-19T14:00:00');
  t.mock.timers.enable({ apis: ['Date'], now });
  const expiresAt = new Date('2026-11-20T00:00:00').getTime();
  let saved = { userId: 'owner', data: { count: 1, prayedToday: false, expiresAt } };
  let resolveHistory;
  let reloads = 0;
  const snapshots = [];
  const timelines = [];
  const requestSnapshots = [];
  const quietSnapshots = [];
  const widget = load('prayerStreakWidget', {
    'react-native': { Platform: { OS: 'ios' } },
    './localCache': {
      LOCAL_KEYS: { prayerStreakWidget: 'widget' },
      readLocal: () => saved,
      clearLocal: async () => { saved = undefined; },
      writeForUser: (_key, userId, data) => { saved = { userId, data }; },
    },
    './prayerHistory': {
      fetchOfferedPrayerHistory: () => ({ abortSignal: () => new Promise(resolve => { resolveHistory = resolve; }) }),
    },
    './prayerStreak': streak,
    '@/widgets/SharePrayerRequest': {
      __esModule: true, default: { updateSnapshot: props => requestSnapshots.push(props) },
    },
    '@/widgets/QuietPrayerWidget': {
      __esModule: true, default: { updateSnapshot: props => quietSnapshots.push(props) },
    },
    '@/widgets/PrayerStreakWidget': {
      __esModule: true,
      default: {
        reload: () => { reloads += 1; },
        getTimeline: async () => timelines.at(-1),
        updateSnapshot: props => snapshots.push(props),
        updateTimeline: timeline => timelines.push(timeline),
      },
    },
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const response = { data: [{ created_at: '2026-11-18T12:00:00' }] };

  widget.setPrayerStreakWidgetUser('owner');
  await flush();
  // A layout-only change redraws the existing timeline before any network response.
  assert.equal(reloads, 1);
  resolveHistory(response);
  await flush();
  assert.equal(timelines.length, 0);
  assert.equal(snapshots.length, 0);

  widget.refreshPrayerStreakWidget('owner');
  await flush();
  resolveHistory({ data: [...response.data, { created_at: now.toISOString() }] });
  await flush();
  assert.equal(reloads, 1);
  assert.deepEqual(timelines[0][0].props, {
    count: 2, prayedToday: true, expiresAt: new Date('2026-11-21T00:00:00').getTime(),
  });
  assert.equal(saved.userId, 'owner');

  const theme = {
    surface: '#F5F8EC', ink: '#1F3A2E', inkSoft: '#3D5A4A', pillInk: '#5A4030',
    pillBg: '#E1E7D2', line: 'rgba(31,58,46,0.10)', bgSoft: '#DCE3CF', accentSoft: '#C5A88B', isDark: false,
  };
  widget.setPrayerWidgetTheme(theme, 'default');
  await flush();
  const appearance = {
    background: theme.surface, ink: theme.ink, secondary: theme.inkSoft, accent: theme.pillInk,
    badge: theme.pillBg, line: theme.line, design: 'default',
    backgroundSoft: theme.bgSoft, accentSoft: theme.accentSoft, isDark: theme.isDark,
  };
  assert.deepEqual(requestSnapshots, [{ appearance }]);
  assert.deepEqual(quietSnapshots, [{ appearance }]);
  assert.deepEqual(timelines[1], timelines[0].map(({ date, props }) => ({ date, props: { ...props, appearance } })));
  widget.setPrayerWidgetTheme({ ...theme }, 'default');
  await flush();
  assert.equal(requestSnapshots.length, 1);

  widget.refreshPrayerStreakWidget('owner');
  await flush();
  widget.setPrayerStreakWidgetUser(null);
  await flush();
  assert.deepEqual(snapshots.at(-1), { appearance });
  assert.equal(saved, undefined);
  resolveHistory(response);
  await flush();
  assert.equal(timelines.length, 2);
});

test('starting is opt-in and a saved prayer refreshes the running activity before sign-out ends it', async t => {
  const today = new Date('2026-11-19T14:00:00');
  t.mock.timers.enable({ apis: ['Date'], now: today });
  const rows = [
    { created_at: '2026-11-18T12:00:00' },
    { created_at: '2026-11-18T10:00:00' },
    { created_at: '2026-11-16T10:00:00' },
    { created_at: '2026-11-15T10:00:00' },
  ];
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
  assert.deepEqual(props.prayerWeek, {
    days: [true, false, true, false, false, false, false],
    endsAt: new Date('2026-11-23T00:00:00').getTime(),
  });
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
  assert.deepEqual(props.prayerWeek.days, [true, false, true, true, false, false, false]);
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
