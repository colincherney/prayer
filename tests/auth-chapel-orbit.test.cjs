const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(path.join(__dirname, '../src/components/saint/authChapelOrbit.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsForTest = {};
new Function('exports', compiled)(exportsForTest);
const { DEFAULT_CHAPEL_ORBIT, dragChapelOrbit } = exportsForTest;

test('dragging right and down turns the chapel in the direction of the drag', () => {
  const right = dragChapelOrbit(DEFAULT_CHAPEL_ORBIT, 30, 0, 350, 200);
  const left = dragChapelOrbit(DEFAULT_CHAPEL_ORBIT, -30, 0, 350, 200);
  const down = dragChapelOrbit(DEFAULT_CHAPEL_ORBIT, 0, 20, 350, 200);
  const up = dragChapelOrbit(DEFAULT_CHAPEL_ORBIT, 0, -20, 350, 200);
  assert.ok(right.azimuth < DEFAULT_CHAPEL_ORBIT.azimuth);
  assert.ok(left.azimuth > DEFAULT_CHAPEL_ORBIT.azimuth);
  assert.ok(down.elevation > DEFAULT_CHAPEL_ORBIT.elevation);
  assert.ok(up.elevation < DEFAULT_CHAPEL_ORBIT.elevation);
});

test('a new drag continues the previous orbit and the camera stays above the garden', () => {
  let orbit = DEFAULT_CHAPEL_ORBIT;
  for (let drag = 0; drag < 3; drag++) orbit = dragChapelOrbit(orbit, 350, 0, 350, 200);
  assert.ok(DEFAULT_CHAPEL_ORBIT.azimuth - orbit.azimuth > 2 * Math.PI);
  const low = dragChapelOrbit(orbit, 0, -800, 350, 200);
  const high = dragChapelOrbit(orbit, 0, 800, 350, 200);
  assert.ok(low.elevation > 0);
  assert.ok(high.elevation < Math.PI / 2);
});
