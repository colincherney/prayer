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
  const router = {
    replace: route => redirects.push(route),
    push: route => redirects.push(route),
    dismissTo: route => redirects.push(route),
  };
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
  const AccountTour = () => {};
  const defaultModule = new Proxy({}, { get: () => noop });
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'expo-router': { useSegments: () => state.segments, useRouter: () => router, Stack: { Screen: noop, Protected: noop } },
    'expo-notifications': {
      useLastNotificationResponse: () => state.notification && {
        notification: { request: { identifier: state.notification, content: { data: state.notification } } },
      },
      clearLastNotificationResponseAsync: async () => {},
    },
    'expo-splash-screen': { preventAutoHideAsync: async () => {}, hideAsync: async () => {} },
    'expo-system-ui': { setBackgroundColorAsync: async () => {} },
    '@/lib/auth': { useAuth: () => state.auth },
    '@/lib/notifications': { registerForPushNotifications: async () => null },
    '@/components/saint/AccountTour': { AccountTour },
    '@/components/saint/useFonts': { useSaintFonts: () => true },
    '@/components/saint/appDisplay': { useAppDisplay: () => ({ simple: state.simple }) },
    '@/components/saint/theme': { useTheme: () => ({ theme: {} }) },
    '@/components/pets/registry': { PETS: [] },
    '@/lib/notificationDestination': { notificationDestination: data => data },
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
  const guestSession = { user: { id: 'guest-user', is_anonymous: true } };
  let tour;
  let stack;
  return {
    render(screen, { signedIn = false, guest = false, loading = false, simple = false, notification = null, accountTourPending = false } = {}) {
      state = {
        segments: [screen],
        auth: {
          session: guest ? guestSession : signedIn ? session : null,
          loading,
          accountTourPending,
          finishAccountTour: () => redirects.push('finish account tour'),
        },
        simple,
        notification,
      };
      cursor = 0;
      redirects.length = 0;
      const view = module.exports.renderRootStack();
      stack = view.props.children[0];
      tour = view.props.children.find(child => child?.type === AccountTour);
      for (const effect of effects.splice(0)) effect();
      return [...redirects];
    },
    tourVisible: () => Boolean(tour),
    openPlus() {
      tour.props.onGetPlus();
      return [...redirects];
    },
    storeAvailableInSimpleMode: () => stack.props.children.some(child => child.props.name === 'store'),
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

test('Simple mode keeps the widget route and prayer notifications available while skipping event navigation', () => {
  const nav = navigation();
  const simple = { signedIn: true, simple: true };
  assert.deepEqual(nav.render('prayerRequest', simple), []);
  assert.deepEqual(nav.render('(tabs)', { ...simple, notification: '/winter' }), []);
  assert.deepEqual(nav.render('(tabs)', { ...simple, notification: '/myPrayers' }), ['/myPrayers']);
  assert.deepEqual(nav.render('(tabs)', { signedIn: true, notification: '/winter' }), ['/winter']);
});

test('the account tour waits for the linked prayer request and opens on returning home', () => {
  const nav = navigation();
  const newAccount = { signedIn: true, accountTourPending: true };
  assert.deepEqual(nav.render('prayerRequest'), ['/auth']);
  assert.deepEqual(nav.render('auth', newAccount), ['/prayerRequest']);
  assert.equal(nav.tourVisible(), false);
  assert.deepEqual(nav.render('prayerRequest', newAccount), []);
  assert.equal(nav.tourVisible(), false);
  nav.render('(tabs)', newAccount);
  assert.equal(nav.tourVisible(), true);
  nav.render('(tabs)', { signedIn: true });
  assert.equal(nav.tourVisible(), false);
});

test('the account tour also opens on a completed guest upgrade in Simple mode', () => {
  const nav = navigation();
  nav.render('createAccount', { signedIn: true, simple: true, accountTourPending: true });
  assert.equal(nav.tourVisible(), true);
});

test('a guest sees the tour after leaving the welcome screen', () => {
  const nav = navigation();
  const newGuest = { guest: true, accountTourPending: true };
  assert.deepEqual(nav.render('auth', newGuest), ['/']);
  assert.equal(nav.tourVisible(), false);
  nav.render('(tabs)', newGuest);
  assert.equal(nav.tourVisible(), true);
  assert.deepEqual(nav.openPlus(), ['finish account tour', '/store']);
});

test('the tour can finish and open the store in Simple mode, including after a guest upgrade', () => {
  const nav = navigation();
  const newAccount = { signedIn: true, simple: true, accountTourPending: true };
  nav.render('(tabs)', newAccount);
  assert.equal(nav.storeAvailableInSimpleMode(), true);
  assert.deepEqual(nav.openPlus(), ['finish account tour', '/store']);
  nav.render('createAccount', newAccount);
  assert.deepEqual(nav.openPlus(), ['finish account tour', '/store']);
});
