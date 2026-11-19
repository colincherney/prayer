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
  moveItemFreely, NOOK_LAYOUTS, placementForItem, ROWS, setNookPlacementMode, spotsForItem, toggleItem,
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

test('snap always uses balanced placement, including saves with older presets', () => {
  const initial = arrangeNook(DEFAULT_NOOK);
  for (const layout of NOOK_LAYOUTS) {
    const nook = arrangeNook({ ...initial, layout: layout.id });
    assert.equal(nook.layout, 'balanced');
    assert.equal(migrateNook({ ...initial, layout: layout.id }).layout, 'balanced');
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

test('entering free mode keeps every piece at its current snap position', () => {
  const snap = arrangeNook(DEFAULT_NOOK);
  const free = setNookPlacementMode(snap, 'free');
  assert.equal(free.placementMode, 'free');
  assert.deepEqual(free.items, snap.items);
  for (const id of snap.items) assert.deepEqual(placementForItem(free, id), placementForItem(snap, id));
  assert.equal(migrateNook({ ...empty(), placementMode: 'unknown', v: 3 }).placementMode, 'snap');
});

test('free mode can equip the entire catalog, including several carpets and light effects', () => {
  let nook = setNookPlacementMode(empty(), 'free');
  const items = ROWS.flatMap(row => row.items.map(item => item.id));
  for (const id of items) nook = toggleItem(nook, id);
  assert.deepEqual(new Set(nook.items), new Set(items));
  assert.ok(nook.items.length > DECOR_SPOTS.length);
  assert.deepEqual(migrateNook(JSON.parse(JSON.stringify(nook))), nook);
});

test('free drops keep exact coordinates on reload, including wall, rug and lighting pieces', () => {
  let nook = setNookPlacementMode({ ...empty(), layout: 'cozy' }, 'free');
  for (const id of ['treeL', 'cross', 'rug', 'prayerweb', 'greatweb', 'prayerlights']) {
    nook = toggleItem(nook, id);
    const before = placementForItem(nook, id);
    nook = moveItemFreely(nook, id, { x: 123.25, y: 180.75 });
    const after = placementForItem(nook, id);
    assert.equal(after.x, 123.25, `${id} keeps its horizontal drop position`);
    assert.equal(after.y, 180.75, `${id} keeps its vertical drop position`);
    assert.equal(after.scale, before.scale);
  }
  const reloaded = migrateNook(JSON.parse(JSON.stringify(nook)));
  assert.equal(reloaded.layout, 'cozy');
  assert.deepEqual(reloaded, nook);
  assert.deepEqual(arrangeNook(reloaded), reloaded);
  assert.deepEqual(moveItemToSpot(nook, 'treeL', 'right'), nook);
});

test('free drops bound the grab area to the canvas and reject invalid positions', () => {
  let nook = toggleItem(setNookPlacementMode(empty(), 'free'), 'cross');
  nook = moveItemFreely(nook, 'cross', { x: -900, y: 900 });
  const placed = placementForItem(nook, 'cross');
  assert.equal(placed.x, 0);
  assert.equal(placed.y + ITEM_META.cross.hit.h * placed.scale, 440);
  assert.equal(moveItemFreely(nook, 'cross', { x: NaN, y: 20 }), nook);
  assert.equal(moveItemFreely(nook, 'cross', { x: 20, y: Infinity }), nook);
  assert.equal(moveItemFreely(nook, 'plant', { x: 20, y: 20 }), nook);
  const repaired = migrateNook({ ...nook, offsets: { cross: { x: Infinity, y: 10 }, plant: { x: 10, y: 10 } } });
  assert.deepEqual(repaired.offsets, {});
});

test('removing a free piece clears its position without disturbing overlapping pieces', () => {
  let nook = toggleItem(toggleItem(setNookPlacementMode(empty(), 'free'), 'cross'), 'rose');
  nook = moveItemFreely(nook, 'cross', { x: 100, y: 100 });
  nook = moveItemFreely(nook, 'rose', { x: 100, y: 100 });
  const removed = toggleItem(nook, 'cross');
  assert.deepEqual(removed.items, ['rose']);
  assert.equal(removed.placements.cross, undefined);
  assert.equal(removed.offsets.cross, undefined);
  assert.deepEqual(placementForItem(removed, 'rose'), placementForItem(nook, 'rose'));
  const added = toggleItem(removed, 'cross');
  assert.equal(added.offsets.cross, undefined);
});

test('returning to snap mode restores one item per spot and clears free offsets', () => {
  let nook = toggleItem(toggleItem(setNookPlacementMode({ ...empty(), layout: 'garden' }, 'free'), 'cross'), 'rose');
  nook = moveItemFreely(nook, 'cross', { x: 20, y: 200 });
  const snap = setNookPlacementMode(nook, 'snap');
  assert.equal(snap.placementMode, 'snap');
  assert.equal(snap.layout, 'balanced');
  assert.deepEqual(snap.items, ['rose']);
  assert.deepEqual(snap.offsets, {});
  assert.deepEqual(nook.items, ['cross', 'rose']);
  assert.notDeepEqual(nook.offsets, {});
  assert.equal(moveItemFreely(snap, 'rose', { x: 20, y: 200 }), snap);
});
