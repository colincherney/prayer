const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise RootStack's effects across auth and navigation changes, without
// mounting native views or contacting the notification/auth services.
function navigation() {
  let state;
  let cursor = 0;
  const hooks = [];
  const effects = [];
  const redirects = [];
  const router = { replace: route => redirects.push(route) };
  const react = {
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ??= { current: initial };
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = hooks[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
        hooks[index] = dependencies;
        effects.push(effect);
      }
    },
  };
  const noop = () => {};
  const defaultModule = new Proxy({}, { get: () => noop });
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'expo-router': { useSegments: () => state.segments, useRouter: () => router, Stack: { Screen: noop } },
    'expo-notifications': { useLastNotificationResponse: () => null },
    'expo-splash-screen': { preventAutoHideAsync: async () => {}, hideAsync: async () => {} },
    'expo-system-ui': { setBackgroundColorAsync: async () => {} },
    '@/lib/auth': { useAuth: () => state.auth },
    '@/lib/notifications': { registerForPushNotifications: async () => null },
    '@/components/saint/useFonts': { useSaintFonts: () => true },
    '@/components/pets/registry': { PETS: [] },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/app/_layout.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', `${compiled}\nexports.renderRootStack = RootStack;`)(
    module, module.exports, name => dependencies[name] ?? defaultModule,
  );

  const session = { user: { id: 'widget-user' } };
  return {
    render(screen, { signedIn = false, loading = false } = {}) {
      state = { segments: [screen], auth: { session: signedIn ? session : null, loading } };
      cursor = 0;
      redirects.length = 0;
      module.exports.renderRootStack();
      for (const effect of effects.splice(0)) effect();
      return [...redirects];
    },
  };
}

test('a saved session opens the widget form directly on cold and warm launches', () => {
  const nav = navigation();
  assert.deepEqual(nav.render('prayerRequest', { signedIn: true, loading: true }), []);
  assert.deepEqual(nav.render('prayerRequest', { signedIn: true }), []);
  assert.deepEqual(nav.render('(tabs)', { signedIn: true }), []);
  assert.deepEqual(nav.render('prayerRequest', { signedIn: true }), []);
});

test('a signed-out widget launch resumes the request after authentication, once only', () => {
  const nav = navigation();
  assert.deepEqual(nav.render('prayerRequest', { loading: true }), []);
  assert.deepEqual(nav.render('prayerRequest'), ['/auth']);
  assert.deepEqual(nav.render('auth'), []);
  assert.deepEqual(nav.render('auth', { signedIn: true }), ['/prayerRequest']);
  assert.deepEqual(nav.render('prayerRequest', { signedIn: true }), []);
  // Leaving the composer must not reopen it, including after signing in again.
  assert.deepEqual(nav.render('(tabs)', { signedIn: true }), []);
  assert.deepEqual(nav.render('(tabs)'), ['/auth']);
  assert.deepEqual(nav.render('auth'), []);
  assert.deepEqual(nav.render('auth', { signedIn: true }), ['/']);
});

test('ordinary launches retain the existing sign-in wall and home destination', () => {
  const nav = navigation();
  assert.deepEqual(nav.render('(tabs)', { loading: true }), []);
  assert.deepEqual(nav.render('(tabs)'), ['/auth']);
  assert.deepEqual(nav.render('auth'), []);
  assert.deepEqual(nav.render('auth', { signedIn: true }), ['/']);
  assert.deepEqual(nav.render('(tabs)', { signedIn: true }), []);
});
