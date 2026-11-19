const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { setImmediate } = require('node:timers/promises');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(path.join(__dirname, '../src/components/saint/AuthChapelCanvas.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function nativeChapel() {
  const states = [];
  const ref = { current: undefined };
  const options = [];
  const materialSettings = [];
  let stateIndex = 0;
  let currentKey;
  let cleanup;
  let mounted = false;
  let surface;
  let disposals = 0;
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (index >= states.length) states[index] = initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next() : next; }];
    },
    useRef: initial => {
      ref.current ??= initial;
      return ref;
    },
    useLayoutEffect(effect) {
      if (mounted) return;
      mounted = true;
      cleanup = effect();
    },
  };
  const modules = {
    'react': react,
    'react/jsx-runtime': { jsx: (type, props, key) => ({ type, props, key }) },
    'react-native': { PixelRatio: { getPixelSizeForLayoutSize: logical => Math.round(3 * logical) }, StyleSheet: { create: styles => styles } },
    'expo-gl': { GLView() {} },
    './authChapelPlayback': { useChapelPlayback: value => { surface = value; } },
    './authChapelWorld': {
      createAuthChapelWorld(value, settings) {
        options.push(value);
        materialSettings.push(settings);
        return { dispose: () => { disposals++; } };
      },
    },
  };
  const module = { exports: {} };
  new Function('module', 'exports', 'require', '__DEV__', compiled)(module, module.exports, name => modules[name], false);
  const readiness = [];
  const onReady = ready => readiness.push(ready);
  return {
    render(width, height, active = true) {
      stateIndex = 0;
      const owner = module.exports.AuthChapelCanvas({ width, height, active, onReady });
      if (owner?.key !== currentKey) {
        cleanup?.();
        cleanup = undefined;
        currentKey = owner?.key;
        states.length = 0;
        ref.current = undefined;
        mounted = false;
        surface = null;
      }
      return owner ? owner.type(owner.props) : null;
    },
    get surface() { return surface; },
    get disposals() { return disposals; },
    options,
    materialSettings,
    readiness,
  };
}

test('the native GL view waits for layout and stays drawable before the first frame', async () => {
  const chapel = nativeChapel();
  assert.equal(chapel.render(0, 260), null);
  await setImmediate();
  assert.equal(chapel.render(0, 260), null);

  assert.equal(chapel.render(350, 260), null);
  await setImmediate();
  const view = chapel.render(350, 260);
  assert.deepEqual(view.props.style[1], { width: 350, height: 260 });
  assert.equal(view.props.style[1].opacity, undefined);
});

test('a zero native viewport uses the measured screen size and presents through Expo GL', async () => {
  const chapel = nativeChapel();
  chapel.render(350, 260);
  await setImmediate();
  const view = chapel.render(350, 260);
  let presented = 0;
  const gl = { drawingBufferWidth: 0, drawingBufferHeight: 0, texImage3D() {}, endFrameEXP: () => { presented++; } };
  await view.props.onContextCreate(gl);
  chapel.render(350, 260);

  assert.deepEqual(chapel.surface.size(), [1050, 780, 1]);
  assert.equal(chapel.options[0].canvas.width, 1050);
  assert.equal(chapel.options[0].canvas.height, 780);
  assert.equal(chapel.options[0].canvas.getContext('webgl2'), gl);
  assert.deepEqual(chapel.materialSettings, [{ portableMaterials: true }]);
  chapel.surface.present();
  assert.equal(presented, 1);
});

test('Three.js accepts the canvas adapter for a WebGL 2 context with Expo Go’s old prototype', async () => {
  const { WebGLRenderer } = await import('three');
  const chapel = nativeChapel();
  chapel.render(350, 260);
  await setImmediate();

  const reachedRenderer = new Error('Three.js reached Expo GL initialization');
  class LegacyWebGLContext {
    drawingBufferWidth = 1050;
    drawingBufferHeight = 780;
    texImage3D() {}
    getExtension() { throw reachedRenderer; }
  }
  const gl = new LegacyWebGLContext();
  await chapel.render(350, 260).props.onContextCreate(gl);

  // Mirror Expo Go's older constructor chain while exercising Three's real constructor guard.
  const previousConstructor = globalThis.WebGLRenderingContext;
  const previousError = console.error;
  globalThis.WebGLRenderingContext = LegacyWebGLContext;
  console.error = () => {};
  try {
    assert.throws(() => new WebGLRenderer({ ...chapel.options[0], context: gl }), /WebGL 1 is not supported/);
    assert.throws(() => new WebGLRenderer(chapel.options[0]), error => error === reachedRenderer);
  } finally {
    globalThis.WebGLRenderingContext = previousConstructor;
    console.error = previousError;
  }
});

test('a WebGL 1 surface keeps the illustrated fallback', async () => {
  const chapel = nativeChapel();
  chapel.render(350, 260);
  await setImmediate();
  await chapel.render(350, 260).props.onContextCreate({ drawingBufferWidth: 1050, drawingBufferHeight: 780 });
  assert.deepEqual(chapel.options, []);
  assert.deepEqual(chapel.readiness, [false]);
});

test('returning to the chapel creates a new native surface and discards stale GL callbacks', async () => {
  const chapel = nativeChapel();
  chapel.render(350, 260);
  await setImmediate();
  const first = chapel.render(350, 260);
  const gl = { drawingBufferWidth: 1050, drawingBufferHeight: 780, texImage3D() {} };
  await first.props.onContextCreate(gl);
  chapel.render(350, 260);

  const pending = first.props.onContextCreate(gl);
  assert.equal(chapel.render(350, 260, false), null);
  await pending;
  assert.equal(chapel.disposals, 1);
  assert.deepEqual(chapel.readiness, [false]);
  assert.equal(chapel.options.length, 1);

  assert.equal(chapel.render(350, 260), null);
  await setImmediate();
  const next = chapel.render(350, 260);
  await next.props.onContextCreate(gl);
  chapel.render(350, 260);
  assert.equal(chapel.options.length, 2);
  assert.ok(chapel.surface);
});
