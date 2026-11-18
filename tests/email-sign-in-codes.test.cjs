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

function setup({ enabledAt, passwordError, stored } = {}) {
  const calls = [];
  const user = { id: 'member', email, user_metadata: { [setting]: enabledAt } };
  const session = { user, access_token: 'access', refresh_token: 'refresh' };
  const storage = new Map(stored ? [[rememberKey, stored]] : []);
  const main = {
    setSession: async tokens => { calls.push(['setSession', tokens]); return { error: null }; },
    signInWithOtp: async input => { calls.push(['signInWithOtp', input]); return { error: null }; },
    verifyOtp: async () => ({ data: { user }, error: null }),
    updateUser: async ({ data }) => {
      Object.assign(user.user_metadata, data);
      return { error: null };
    },
    resend: async input => { calls.push(['resend', input]); return { error: null }; },
  };
  const exports = {};
  const imports = {
    react: { createContext: () => ({}), useEffect: () => {}, useState: initial => [initial ?? session, () => {}] },
    'react/jsx-runtime': { jsx: (_component, props) => props.value },
    'react-native': {},
    './purchases': {},
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
  return { render: () => exports.AuthProvider({}), calls, storage };
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
