const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the real catalog and layout functions without booting React Native.
const projectDirectory = path.dirname(require.resolve('../package.json'));
const modules = new Map();
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? loadSource(path.resolve(path.dirname(filename), `${name}.ts`))
    : require(name);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const {
  arrangeNook, DEFAULT_NOOK, DECOR_SPOTS, ITEM_META, migrateNook, moveItemToSpot,
  NOOK_LAYOUTS, placementForItem, ROWS, spotsForItem, toggleItem,
} = loadSource(path.join(projectDirectory, 'src/components/pets/nookData.ts'));
const empty = () => ({ scene: 'grove', items: [], offsets: {}, layout: 'balanced' });

test('crowded old saves keep at most one piece in each suitable spot', () => {
  const items = ROWS.flatMap(row => row.items.map(item => item.id));
  const result = migrateNook({ scene: 'grove', items, offsets: { candles: { x: 900, y: -400 } }, v: 3 });
  assert.ok(result.items.length <= DECOR_SPOTS.length);
  assert.equal(new Set(Object.values(result.placements)).size, result.items.length);
  assert.deepEqual(result.offsets, {});
  assert.deepEqual(arrangeNook(result), result);
  for (const id of result.items) assert.ok(spotsForItem(id).includes(result.placements[id]));
});

test('adding to occupied spots replaces a piece, and removing it leaves the spot empty', () => {
  let nook = toggleItem(empty(), 'treeL');
  nook = toggleItem(nook, 'plant');
  nook = toggleItem(nook, 'lantern');
  assert.deepEqual(new Set(nook.items), new Set(['lantern', 'plant']));
  assert.equal(nook.placements.lantern, 'left');
  assert.equal(nook.placements.plant, 'right');
  nook = toggleItem(nook, 'lantern');
  assert.deepEqual(nook.items, ['plant']);
});

test('switching sides swaps the two pieces and survives saving and reloading', () => {
  const before = toggleItem(toggleItem(empty(), 'treeL'), 'plant');
  const after = moveItemToSpot(before, 'treeL', 'right');
  assert.equal(after.placements.treeL, 'right');
  assert.equal(after.placements.plant, 'left');
  assert.equal(before.placements.treeL, 'left');
  assert.deepEqual(migrateNook(JSON.parse(JSON.stringify(after))), after);
  assert.deepEqual(moveItemToSpot(after, 'treeL', 'wall'), after);
});

test('all carpet choices share one foundation spot, including collection carpets', () => {
  let nook = toggleItem(empty(), 'bluerug');
  for (const id of ['rug', 'roundrug', 'starrug', 'reedmat', 'flagstones', 'cushion', 'wreath']) {
    nook = toggleItem(nook, id);
    assert.deepEqual(nook.items, [id]);
    assert.equal(nook.placements[id], 'rug');
  }
});

test('presets keep chosen decorations while keeping side objects clear of the pet', () => {
  const initial = arrangeNook(DEFAULT_NOOK);
  for (const layout of NOOK_LAYOUTS) {
    const nook = arrangeNook({ ...initial, layout: layout.id });
    assert.deepEqual(nook.items, initial.items);
    for (const id of ROWS.flatMap(row => row.items.map(item => item.id))) {
      const hit = ITEM_META[id].hit;
      for (const spot of spotsForItem(id).filter(spot => ['left', 'right', 'accentLeft', 'accentRight'].includes(spot))) {
        const placed = placementForItem(nook, id, spot);
        const right = placed.x + hit.w * placed.scale;
        const bottom = placed.y + hit.h * placed.scale;
        assert.ok(placed.x >= 0 && placed.y >= 0 && right <= 342 && bottom <= 440, `${layout.id}: ${id} fits`);
        assert.ok(right <= 103 || placed.x >= 239 || placed.y >= 350, `${layout.id}: ${id} leaves the pet clear`);
      }
    }
  }
});

test('empty arrangements stay empty and invalid layout values are repaired', () => {
  assert.deepEqual(migrateNook({ ...empty(), v: 3 }).items, []);
  assert.equal(migrateNook({ ...empty(), layout: 'invalid', v: 3 }).layout, 'balanced');
});
