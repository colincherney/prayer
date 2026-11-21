const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(require.resolve('../src/lib/auth.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

const email = 'member@example.com';
const setting = 'email_sign_in_codes_enabled_at';
const enrollment = '2026-11-18T00:00:00.000Z';
const rememberKey = `remembered-phone:${email}`;

function setup({ enabledAt, passwordError, stored, guest = false, verifyError = null, instantSignup = false, savedTours } = {}) {
  const calls = [];
  const user = { id: 'member', email, user_metadata: { [setting]: enabledAt }, is_anonymous: guest };
  const session = { user, access_token: 'access', refresh_token: 'refresh' };
  const storage = new Map(stored ? [[rememberKey, stored]] : []);
  const tourKey = 'saint.accountTours';
  const cache = new Map([[tourKey, savedTours]]);
  const verifiedUser = guest ? { ...user, is_anonymous: false } : user;
  let cursor = 0;
  const state = [];
  const main = {
    setSession: async tokens => { calls.push(['setSession', tokens]); return { error: null }; },
    signInWithOtp: async input => { calls.push(['signInWithOtp', input]); return { error: null }; },
    signUp: async () => ({ data: { session: instantSignup ? session : null }, error: null }),
    verifyOtp: async () => ({ data: { user: verifiedUser }, error: verifyError }),
    refreshSession: async () => ({ data: { session: { ...session, user: verifiedUser } }, error: null }),
    updateUser: async ({ data }) => {
      Object.assign(user.user_metadata, data);
      return { error: null };
    },
    resend: async input => { calls.push(['resend', input]); return { error: null }; },
  };
  const exports = {};
  const imports = {
    react: {
      createContext: () => ({}),
      useEffect: () => {},
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial ?? session;
        return [state[index], value => { state[index] = value; }];
      },
    },
    'react/jsx-runtime': { jsx: (_component, props) => props.value },
    'react-native': {},
    './purchases': {},
    './localCache': {
      LOCAL_KEYS: { accountTours: tourKey },
      readLocal: key => cache.get(key),
      writeLocal: async (key, value) => { cache.set(key, value); },
    },
    '@react-native-async-storage/async-storage': {
      getItem: async key => storage.get(key),
      setItem: async (key, value) => storage.set(key, value),
    },
    './supabase': {
      supabase: { auth: main },
      passwordCheckClient: { auth: {
        signInWithPassword: async () => ({ data: { session }, error: passwordError }),
        signOut: async ({ scope }) => { calls.push(['signOut', scope]); },
      } },
    },
  };
  new Function('require', 'exports', source)(name => imports[name], exports);
  return {
    render: () => {
      cursor = 0;
      return exports.AuthProvider({});
    },
    calls,
    storage,
    savedTours: () => cache.get(tourKey),
  };
}

test('a confirmed account signs in with just its password by default', async () => {
  const { render, calls } = setup();
  assert.equal(render().emailSignInCodes, false);
  assert.deepEqual(await render().signInWithPassword(email, 'password'), { error: null, signedIn: true });
  assert.deepEqual(calls, [['setSession', { access_token: 'access', refresh_token: 'refresh' }]]);
});

test('enabling email codes adds the code step and disabling it restores password-only sign-in', async () => {
  const { render, calls } = setup();
  assert.deepEqual(await render().setEmailSignInCodes(true), { error: null });
  assert.equal(render().emailSignInCodes, true);
  assert.deepEqual(await render().signInWithPassword(email, 'password'), { error: null, kind: 'email' });
  assert.deepEqual(calls, [['signOut', 'local'], ['signInWithOtp', { email, options: { shouldCreateUser: false } }]]);

  assert.deepEqual(await render().setEmailSignInCodes(false), { error: null });
  assert.equal(render().emailSignInCodes, false);
  assert.deepEqual(await render().signInWithPassword(email, 'password'), { error: null, signedIn: true });
});

test('remembering a phone only skips codes for the enrollment that verified it', async () => {
  const { render, storage } = setup({ enabledAt: enrollment, stored: String(Date.now() + 60_000) });
  assert.equal((await render().signInWithPassword(email, 'password')).kind, 'email');
  await render().verifyEmailCode(email, '12345678', 'email', true);
  assert.equal((await render().signInWithPassword(email, 'password')).signedIn, true);

  const reEnrolled = setup({ enabledAt: '2026-11-18T01:00:00.000Z', stored: storage.get(rememberKey) });
  assert.equal((await reEnrolled.render().signInWithPassword(email, 'password')).kind, 'email');
});

test('an unconfirmed address still needs its signup code', async () => {
  const { render, calls } = setup({ passwordError: { code: 'email_not_confirmed' } });
  assert.deepEqual(await render().signInWithPassword(email, 'password'), { error: null, kind: 'signup' });
  assert.deepEqual(calls, [['resend', { type: 'signup', email }]]);
});

test('the tour is queued after confirming signup and stays dismissed after a restart', async () => {
  const { render, savedTours } = setup();
  await render().signUpWithPassword(email, 'password');
  assert.equal(render().accountTourPending, false);
  await render().verifyEmailCode(email, '12345678', 'signup');
  assert.equal(render().accountTourPending, true);
  assert.equal(setup({ savedTours: savedTours() }).render().accountTourPending, true);
  render().finishAccountTour();
  assert.equal(render().accountTourPending, false);
  assert.equal(setup({ savedTours: savedTours() }).render().accountTourPending, false);
});

test('immediate signup queues the tour, while ordinary sign-in codes and failed verification leave it closed', async () => {
  const instant = setup({ instantSignup: true });
  assert.equal((await instant.render().signUpWithPassword(email, 'password')).signedIn, true);
  assert.equal(instant.render().accountTourPending, true);

  const existing = setup();
  await existing.render().verifyEmailCode(email, '12345678', 'email');
  await existing.render().verifyEmailCode(email, '12345678', 'email_change');
  assert.equal(existing.render().accountTourPending, false);

  const invalid = setup({ verifyError: { message: 'Invalid code' } });
  await invalid.render().verifyEmailCode(email, '12345678', 'signup');
  assert.equal(invalid.render().accountTourPending, false);
});

test('a guest can dismiss the tour and keeps it dismissed after restarting or upgrading', async () => {
  const { render, savedTours } = setup({ guest: true, savedTours: ['someone-else'] });
  assert.equal(render().accountTourPending, true);
  render().finishAccountTour();
  assert.equal(render().accountTourPending, false);
  assert.deepEqual(savedTours(), { member: 'finished', 'someone-else': 'pending' });

  const restarted = setup({ guest: true, savedTours: savedTours() }).render;
  assert.equal(restarted().accountTourPending, false);
  await restarted().verifyEmailCode(email, '12345678', 'email_change');
  await restarted().refreshUser();
  assert.equal(restarted().isGuest, false);
  assert.equal(restarted().accountTourPending, false);
});

test('a guest who upgrades before seeing the tour can still see it afterward', async () => {
  const { render } = setup({ guest: true });
  assert.equal(render().accountTourPending, true);
  await render().verifyEmailCode(email, '12345678', 'email_change');
  await render().refreshUser();
  assert.equal(render().isGuest, false);
  assert.equal(render().accountTourPending, true);
});
