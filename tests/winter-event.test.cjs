const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// The Long Winter's date maths (src/lib/winterDates.ts), run in Node without React Native. The progress rules
// themselves live in the database and are tested by supabase/tests/long_winter_event.test.sql.
const projectDirectory = path.dirname(require.resolve('../package.json'));
function loadSource(filename) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
const W = loadSource(path.join(projectDirectory, 'src/lib/winterDates.ts'));

const config = {
  pal_line: 'frostLord',
  real_starts_on: '2026-12-01',
  weeks_start: '2026-12-01',
  claim_grace_days: 7,
  chapters: [
    { key: 'advent', title: 'Advent', starts_on: '2026-12-01', ends_on: '2026-12-24' },
    { key: 'christmastide', title: 'Christmastide', starts_on: '2026-12-25', ends_on: '2027-01-10' },
    { key: 'candlemas', title: 'Candlemas', starts_on: '2027-01-11', ends_on: '2027-01-31' },
  ],
  evolutions: [
    { stage: 1, name: 'Snowcap', unlock: { min_event_prayers: 1 } },
    { stage: 2, name: 'Frost Mage', unlock: { min_challenges: 4, not_before: '2026-12-25' } },
    { stage: 3, name: 'Frost Lord', unlock: { min_challenges: 10, claim: true } },
  ],
  advent_wreath: [],
  weeks: [],
  weekly_rewards: [{ week: 1, keepsake: 'adventWreath' }, { week: 9, keepsake: 'candlemasCandles' }],
  community_goal: { key: 'winter_lights', title: 'Winter lights', target: 2000, reward: 'scene:aurora' },
  challenges: Array.from({ length: 10 }, (_, i) => ({ key: `c${i}`, title: `C${i}`, detail: '', rule: { type: 'prayers', min: 1 } })),
};
const event = { id: 'long-winter-2026', title: 'The Long Winter', starts_on: '2026-12-01', ends_on: '2027-01-31', is_active: true, config };

const state = progress => ({
  event,
  community: { value: 0, target: 2000, rewarded: false },
  progress: {
    tz: 'America/New_York', prayer_days: [], event_prayer_count: 0, candles_lit: 0, partner_sessions: 0, longest_streak: 0,
    stage_unlocked: 0, stage_seen: 0, frost_lord_ready: false, wreath_candles_lit: 0, challenges_completed: [],
    challenges_closed: [], rewards_available: [], rewards_claimed: [], intro_seen_at: null, event_notifications: false,
    evaluated_on: null, ...progress,
  },
});
const done = n => Array.from({ length: n }, (_, i) => `c${i}`);

test('eventDayFor uses the local calendar day, across timezones and midnight', () => {
  const lateDec1InNewYork = new Date('2026-12-02T04:30:00Z'); // 11:30pm Dec 1 in New York
  assert.equal(W.eventDayFor(lateDec1InNewYork, 'America/New_York'), '2026-12-01');
  assert.equal(W.eventDayFor(lateDec1InNewYork, 'Europe/London'), '2026-12-02');
  assert.equal(W.eventDayFor(new Date('2026-12-02T07:30:00Z'), 'America/Los_Angeles'), '2026-12-01');
  assert.equal(W.eventDayFor(new Date('2026-12-02T08:00:00Z'), 'America/Los_Angeles'), '2026-12-02');
  // Dec 31 to Jan 1 at midnight in Auckland
  assert.equal(W.eventDayFor(new Date('2026-12-31T11:00:00Z'), 'Pacific/Auckland'), '2027-01-01');
});

test('day arithmetic crosses months and years', () => {
  assert.equal(W.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(W.addDays('2027-01-31', 7), '2027-02-07');
  assert.equal(W.daysBetween('2026-12-01', '2027-01-31'), 61);
  assert.equal(W.shortDate('2026-12-25'), 'Dec 25');
  assert.equal(W.longDate('2026-12-01'), 'December 1');
});

test('event weeks are 7-day blocks from Dec 1 and the last one is cut short', () => {
  assert.deepEqual(W.weekRange(event, 1), ['2026-12-01', '2026-12-07']);
  assert.deepEqual(W.weekRange(event, 4), ['2026-12-22', '2026-12-28']);
  assert.deepEqual(W.weekRange(event, 9), ['2027-01-26', '2027-01-31']);
  assert.equal(W.weekForDay(event, '2026-12-07'), 1);
  assert.equal(W.weekForDay(event, '2026-12-08'), 2);
  assert.equal(W.weekForDay(event, '2026-11-30'), 0);
  assert.equal(W.daysNeededForWeek(event, 1), 3);
  assert.equal(W.daysNeededForWeek(event, 9), 3); // six days is still a full week
  // With the spec's Feb 2 ending, week 10 is a single day and needs 2.
  const longer = { ...event, ends_on: '2027-02-02', config: { ...config, weekly_rewards: [] } };
  assert.deepEqual(W.weekRange(longer, 10), ['2027-02-02', '2027-02-02']);
  assert.equal(W.daysNeededForWeek(longer, 10), 2);
});

test('chapters change on Dec 25 and Jan 11', () => {
  assert.equal(W.chapterFor(config, '2026-12-24'), 'advent');
  assert.equal(W.chapterFor(config, '2026-12-25'), 'christmastide');
  assert.equal(W.chapterFor(config, '2027-01-10'), 'christmastide');
  assert.equal(W.chapterFor(config, '2027-01-11'), 'candlemas');
  assert.equal(W.chapterFor(config, '2027-02-01'), null);
});

test('phases: before, live through Jan 31, a claim week to Feb 7, then read-only', () => {
  assert.equal(W.phaseFor(event, '2026-11-30'), 'before');
  assert.equal(W.phaseFor(event, '2026-12-01'), 'live');
  assert.equal(W.phaseFor(event, '2027-01-31'), 'live');
  assert.equal(W.phaseFor(event, '2027-02-07'), 'grace');
  assert.equal(W.phaseFor(event, '2027-02-08'), 'ended');
  assert.equal(W.daysLeft(event, '2026-12-01'), 62);
  assert.equal(W.daysLeft(event, '2027-01-31'), 1);
  assert.equal(W.daysLeft(event, '2027-02-01'), 0);
});

test('the next step points at the companion', () => {
  assert.equal(W.nextStep(state({}), '2026-12-02'), 'Pray your first winter prayer to meet Snowcap');
  assert.equal(W.nextStep(state({ stage_unlocked: 1, challenges_completed: done(3) }), '2026-12-10'), '1 more challenge to Frost Mage');
  assert.equal(W.nextStep(state({ stage_unlocked: 1, challenges_completed: done(4) }), '2026-12-20'), 'Frost Mage unlocks Dec 25');
  assert.equal(W.nextStep(state({ stage_unlocked: 2, challenges_completed: done(7) }), '2027-01-02'), '3 more challenges to the Frost Lord');
  assert.equal(W.nextStep(state({ stage_unlocked: 2, challenges_completed: done(10), frost_lord_ready: true }), '2027-01-30'), 'All ten done. Crown your Frost Lord');
  assert.equal(W.nextStep(state({ stage_unlocked: 3, challenges_completed: done(10), frost_lord_ready: true }), '2027-01-30'), 'The Frost Lord walks with you');
  assert.equal(W.nextStep(state({ stage_unlocked: 2, challenges_closed: ['c1'] }), '2027-01-02'), 'Your Frost Mage is yours to keep');
});

test('the community title follows the target', () => {
  assert.equal(W.communityTitle({ ...config.community_goal, target: 1_000_000 }), 'A million winter lights');
  assert.equal(W.communityTitle(config.community_goal), 'Winter lights');
});

test('the next step uses each event\'s own companion names', () => {
  const swampConfig = {
    ...config,
    pal_line: 'vesper',
    evolutions: [
      { stage: 1, name: 'Vesper', unlock: { min_event_prayers: 1 } },
      { stage: 2, name: 'Fen Warden', unlock: { min_challenges: 4 } },
      { stage: 3, name: 'The Old King', unlock: { min_challenges: 10 } },
    ],
  };
  const swamp = progress => ({ ...state(progress), event: { ...event, config: swampConfig } });
  assert.equal(W.nextStep(swamp({}), '2027-03-02'), 'Pray your first spring prayer to meet Vesper');
  assert.equal(W.nextStep(swamp({ stage_unlocked: 1, challenges_completed: done(2) }), '2027-03-02'), '2 more challenges to Fen Warden');
  assert.equal(W.nextStep(swamp({ stage_unlocked: 2, challenges_completed: done(7) }), '2027-03-20'), '3 more challenges to the Old King');
  assert.equal(W.nextStep(swamp({ stage_unlocked: 3, challenges_completed: done(10) }), '2027-04-20'), 'The Old King walks with you');
});
