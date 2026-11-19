import * as THREE from 'three';

// A low-poly log-cabin prayer room. Same flat-shaded, warm-lamplit language as the
// auth chapel (authChapelWorld.ts) and the 2D Lamplit Corner scene, but walk-in.

type Mat = THREE.Material;
type Paint = (color: string) => THREE.MeshLambertMaterial;

export type CabinView = { x: number; y: number; z: number; yaw: number; pitch: number };

/** Preset spots to stand. yaw 0 faces the hearth (-z); positive yaw turns left. */
export const CABIN_VIEWS = {
  door: { x: 0, y: 1.55, z: 2.85, yaw: 0, pitch: -0.06 },
  kneeler: { x: 0, y: 1.0, z: -0.5, yaw: 0, pitch: 0.04 },
  chair: { x: -2.17, y: 1.15, z: 0.24, yaw: -0.9, pitch: -0.06 },
  shelf: { x: 0.9, y: 1.45, z: 1.1, yaw: -1.45, pitch: -0.02 },
} satisfies Record<string, CabinView>;
export type CabinViewName = keyof typeof CABIN_VIEWS;

const W = 3; // half-width (x)
const D = 3.5; // half-depth (z)
const H = 2.7; // eave height
const RIDGE = 4.15;
const LOG_R = 0.135;
const LOG_STEP = 0.25;

const BOOK_SPINES = ['#a83a26', '#c69a59', '#3a4f6a', '#7a4530', '#d4b87a', '#1f2a3a', '#c25a36', '#5d6b4a'];

function seedRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitLog = new THREE.CylinderGeometry(1, 1, 1, 7);
const unitBall = new THREE.IcosahedronGeometry(1, 1);

function box(parent: THREE.Object3D, mat: Mat, size: [number, number, number], x: number, y: number, z: number) {
  const m = new THREE.Mesh(unitBox, mat);
  m.scale.set(...size);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function geo(parent: THREE.Object3D, g: THREE.BufferGeometry, mat: Mat, x: number, y: number, z: number) {
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** A horizontal log from a to b along the wall's run axis. */
function log(parent: THREE.Object3D, mat: Mat, axis: 'x' | 'z', a: number, b: number, fixed: number, y: number, r = LOG_R) {
  if (b - a < 0.08) return;
  const m = new THREE.Mesh(unitLog, mat);
  m.scale.set(r, b - a, r);
  const mid = (a + b) / 2;
  if (axis === 'x') {
    m.rotation.z = Math.PI / 2;
    m.position.set(mid, y, fixed);
  } else {
    m.rotation.x = Math.PI / 2;
    m.position.set(fixed, y, mid);
  }
  parent.add(m);
}

type Opening = { a0: number; a1: number; y0: number; y1: number };

/** A stacked-log wall with gaps for windows and doors, optionally rising into a gable. */
function logWall(parent: THREE.Object3D, logs: Mat[], chink: Mat, axis: 'x' | 'z', fixed: number, half: number, openings: Opening[], gable: boolean) {
  const inward = -Math.sign(fixed);
  // Dark chinking behind the logs so the gaps read as mortar, not void.
  const top = gable ? RIDGE : H;
  if (axis === 'x') box(parent, chink, [half * 2, top, 0.04], 0, top / 2, fixed - inward * 0.06);
  else box(parent, chink, [0.04, H, half * 2], fixed - inward * 0.06, H / 2, 0);
  const random = seedRandom(Math.round(fixed * 100) + 7);
  let row = 0;
  for (let y = LOG_R; y < top; y += LOG_STEP, row++) {
    const span = y <= H ? half + 0.18 : half * (RIDGE - y) / (RIDGE - H);
    if (span < 0.1) break;
    const cuts = openings
      .filter(o => y + LOG_R * 0.6 > o.y0 && y - LOG_R * 0.6 < o.y1)
      .sort((p, q) => p.a0 - q.a0);
    let from = -span;
    const mat = logs[(row + Math.floor(random() * 2)) % logs.length];
    for (const cut of cuts) {
      log(parent, mat, axis, from, cut.a0, fixed, y);
      from = cut.a1;
    }
    log(parent, mat, axis, from, span, fixed, y);
  }
}

/** Vertex-coloured gradient plane — the dawn sky seen through glass. */
function skyPlane(width: number, height: number, stops: [number, string][]) {
  const g = new THREE.PlaneGeometry(width, height, 1, 8);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const lo = new THREE.Color();
  const hi = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / height + 0.5;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k];
    const [t1, c1] = stops[k + 1];
    c.copy(lo.set(c0)).lerp(hi.set(c1), Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

const DAWN: [number, string][] = [[0, '#e8946a'], [0.38, '#f5cba2'], [0.7, '#c9b4c4'], [1, '#6f84b0']];

/** A window cut into a wall: dawn sky, pines, frame, mullions and sill. Built facing +z, then turned. */
function cabinWindow(parent: THREE.Object3D, frame: Mat, w: number, h: number) {
  const win = new THREE.Group();
  parent.add(win);
  const sky = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  geo(win, skyPlane(w + 0.1, h + 0.1, DAWN), sky, 0, h / 2, -0.12);
  const sun = new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false });
  geo(win, new THREE.CircleGeometry(0.13, 14), sun, w * 0.18, h * 0.34, -0.115);
  const random = seedRandom(Math.round(w * 97 + h * 31));
  for (let i = 0; i < 6; i++) {
    const px = -w / 2 + (i + random() * 0.7) * (w / 5.5);
    const ph = 0.25 + random() * 0.32;
    const tri = new THREE.Shape();
    tri.moveTo(-ph * 0.32, 0);
    tri.lineTo(ph * 0.32, 0);
    tri.lineTo(0, ph);
    tri.closePath();
    geo(win, new THREE.ShapeGeometry(tri), new THREE.MeshBasicMaterial({ color: i % 2 ? '#34405a' : '#283147' }), px, -0.02, -0.11);
  }
  const t = 0.07;
  box(win, frame, [w + t * 2, t, 0.2], 0, h + t / 2, 0);
  box(win, frame, [w + t * 2, t, 0.2], 0, -t / 2, 0);
  box(win, frame, [t, h, 0.2], -w / 2 - t / 2, h / 2, 0);
  box(win, frame, [t, h, 0.2], w / 2 + t / 2, h / 2, 0);
  box(win, frame, [0.035, h, 0.06], 0, h / 2, -0.06);
  box(win, frame, [w, 0.035, 0.06], 0, h * 0.55, -0.06);
  box(win, frame, [w + 0.3, 0.06, 0.26], 0, -0.09, 0.07);
  return win;
}

function buildShell(room: THREE.Group, paint: Paint) {
  const logs = [paint('#8a5a36'), paint('#7a4c2c'), paint('#94633b')];
  const chink = paint('#2e2016');
  const frame = paint('#4a3020');

  // Plank floor.
  const planks = [paint('#5a3a22'), paint('#4e321d'), paint('#63412a')];
  const random = seedRandom(23);
  for (let i = 0, x = -W; x < W; i++, x += 0.32) {
    const split = -D + 1 + random() * (D * 2 - 2);
    box(room, planks[i % 3], [0.305, 0.06, split + D - 0.01], x + 0.16, -0.03, (-D + split) / 2);
    box(room, planks[(i + 1) % 3], [0.305, 0.06, D - split - 0.01], x + 0.16, -0.03, (split + D) / 2);
  }

  // Walls. Back (z = -D) holds the hearth; front holds the door; left has the big dawn window.
  const leftWin = { a0: -0.75, a1: 0.95, y0: 0.95, y1: 2.15 };
  const rightWin = { a0: -2.45, a1: -1.55, y0: 1.2, y1: 2.0 };
  const door = { a0: -0.55, a1: 0.55, y0: -1, y1: 2.15 };
  const frontWin = { a0: 1.35, a1: 2.3, y0: 1.15, y1: 1.95 };
  logWall(room, logs, chink, 'x', -D, W, [], true);
  logWall(room, logs, chink, 'x', D, W, [door, frontWin], true);
  logWall(room, logs, chink, 'z', -W, D, [leftWin], false);
  logWall(room, logs, chink, 'z', W, D, [rightWin], false);

  // Notched corner posts.
  const post = paint('#6e4528');
  for (const x of [-W, W]) for (const z of [-D, D]) {
    const p = new THREE.Mesh(unitLog, post);
    p.scale.set(0.17, H, 0.17);
    p.position.set(x * 0.985, H / 2, z * 0.985);
    room.add(p);
  }

  const left = cabinWindow(room, frame, leftWin.a1 - leftWin.a0, leftWin.y1 - leftWin.y0);
  left.position.set(-W + 0.02, leftWin.y0, (leftWin.a0 + leftWin.a1) / 2);
  left.rotation.y = Math.PI / 2;
  const right = cabinWindow(room, frame, rightWin.a1 - rightWin.a0, rightWin.y1 - rightWin.y0);
  right.position.set(W - 0.02, rightWin.y0, (rightWin.a0 + rightWin.a1) / 2);
  right.rotation.y = -Math.PI / 2;
  const front = cabinWindow(room, frame, frontWin.a1 - frontWin.a0, frontWin.y1 - frontWin.y0);
  front.position.set((frontWin.a0 + frontWin.a1) / 2, frontWin.y0, D - 0.02);
  front.rotation.y = Math.PI;

  // Plank door with iron straps.
  const doorWood = [paint('#5d3a22'), paint('#684226')];
  for (let i = 0; i < 5; i++) box(room, doorWood[i % 2], [0.215, 2.1, 0.07], -0.44 + i * 0.22, 1.05, D - 0.03);
  const iron = paint('#2b2826');
  for (const y of [0.45, 1.7]) box(room, iron, [1.0, 0.07, 0.02], 0, y, D - 0.075);
  geo(room, new THREE.TorusGeometry(0.06, 0.012, 5, 12), iron, 0.32, 1.05, D - 0.09);
  box(room, frame, [1.3, 0.12, 0.22], 0, 2.2, D - 0.02);
  for (const x of [-0.61, 0.61]) box(room, frame, [0.1, 2.2, 0.22], x, 1.1, D - 0.02);

  // Roof: underside planks, rafters, ridge beam and tie beams.
  const slope = Math.atan2(RIDGE - H, W);
  const run = Math.hypot(RIDGE - H, W) + 0.25;
  const ceiling = [paint('#6b4529'), paint('#5f3d24')];
  const rafter = paint('#4a2f1c');
  for (const side of [-1, 1]) {
    const roof = new THREE.Group();
    roof.position.set(side * W / 2, (H + RIDGE) / 2 + 0.12, 0);
    roof.rotation.z = -side * slope;
    room.add(roof);
    for (let i = 0; i < 12; i++) box(roof, ceiling[i % 2], [run / 12 - 0.005, 0.06, D * 2 + 0.4], -run / 2 + (i + 0.5) * run / 12, 0.05, 0);
    for (let z = -D + 0.5; z <= D - 0.4; z += 1.0) box(roof, rafter, [run, 0.16, 0.13], 0, -0.06, z);
  }
  box(room, rafter, [0.24, 0.24, D * 2], 0, RIDGE + 0.02, 0);
  for (const z of [-1.7, 1.2]) {
    log(room, rafter, 'x', -W, W, z, H + 0.05, 0.12);
  }
  return { frame, leftWin };
}

function buildHearth(room: THREE.Group, paint: Paint, glow: THREE.Group) {
  const stones = [paint('#6a6470'), paint('#57525e'), paint('#7a7279'), paint('#4a4652')];
  const core = paint('#45404c');
  const soot = new THREE.MeshBasicMaterial({ color: '#120a06' });
  const z0 = -D + 0.02;
  const depth = 0.75;
  const face = z0 + depth;
  const random = seedRandom(5);

  // Firebox cavity, pillars, and a narrower chimney stack above the mantle.
  box(room, soot, [1.1, 1.0, 0.1], 0, 0.5, z0 + 0.12);
  box(room, soot, [1.1, 0.1, depth], 0, 1.0, z0 + depth / 2);
  for (const side of [-1, 1]) box(room, core, [0.5, 1.05, depth], side * 0.8, 0.52, z0 + depth / 2);
  box(room, core, [1.7, RIDGE - 1.1, depth - 0.12], 0, 1.1 + (RIDGE - 1.1) / 2, z0 + (depth - 0.12) / 2);

  const stone = (x: number, y: number, z: number, w: number, h: number) => {
    const s = box(room, stones[Math.floor(random() * stones.length)], [w, h, 0.09 + random() * 0.05], x, y, z);
    s.rotation.z = (random() - 0.5) * 0.12;
  };
  for (const side of [-1, 1]) {
    for (let y = 0.1; y < 1.0; y += 0.2) {
      stone(side * (0.68 + random() * 0.04), y, face, 0.24, 0.17);
      stone(side * (0.92 + random() * 0.03), y + 0.06, face, 0.22, 0.16);
    }
  }
  for (let y = 1.32, row = 0; y < RIDGE - 0.1; y += 0.24, row++) {
    for (let x = -0.72 + (row % 2) * 0.14; x < 0.75; x += 0.29 + random() * 0.04) {
      stone(x, y, face - 0.12, 0.25 + random() * 0.05, 0.18 + random() * 0.03);
    }
  }

  // Hearth slab, mantle beam.
  box(room, stones[1], [2.3, 0.08, 0.7], 0, 0.04, face + 0.3);
  const mantle = paint('#5a3820');
  box(room, mantle, [2.25, 0.16, 0.4], 0, 1.12, face + 0.05);

  // Fire: split logs, ember bed, flickering flames.
  const bark = paint('#3e2a1c');
  for (const [x, rot] of [[-0.12, 0.35], [0.14, -0.4], [0, 0]] as const) {
    const l = new THREE.Mesh(unitLog, bark);
    l.scale.set(0.07, 0.7, 0.07);
    l.rotation.set(Math.PI / 2, 0, Math.PI / 2 + rot);
    l.position.set(x, 0.1 + (x === 0 ? 0.08 : 0), z0 + 0.42);
    room.add(l);
  }
  const ember = new THREE.MeshBasicMaterial({ color: '#ff7a2e', toneMapped: false });
  box(room, ember, [0.7, 0.03, 0.35], 0, 0.04, z0 + 0.42);
  const flameCols = ['#ffcf6b', '#ff9a3c', '#ffe7a8', '#ff8a2a', '#ffc457'];
  const tongue = new THREE.OctahedronGeometry(0.1, 0);
  for (let i = 0; i < 7; i++) {
    const f = geo(glow, tongue, new THREE.MeshBasicMaterial({ color: flameCols[i % flameCols.length], toneMapped: false, transparent: true, opacity: 0.92 }),
      -0.28 + i * 0.095, 0.24, z0 + 0.4 + (i % 2) * 0.06);
    f.userData.base = 0.7 + random() * 0.6;
    f.userData.phase = random() * 10;
  }

  // Mantle: candles, cross above.
  const wax = paint('#efe3c8');
  for (const x of [-0.85, -0.7, 0.75]) {
    const h = x === -0.7 ? 0.14 : 0.22;
    box(room, wax, [0.06, h, 0.06], x, 1.2 + h / 2, face + 0.08);
    const flame = geo(glow, new THREE.OctahedronGeometry(0.025, 0), new THREE.MeshBasicMaterial({ color: '#ffd993', toneMapped: false }), x, 1.23 + h, face + 0.08);
    flame.scale.y = 1.8;
    flame.userData.candle = true;
    flame.userData.phase = x * 7;
  }
  const crossWood = paint('#6e4528');
  box(room, crossWood, [0.09, 0.85, 0.07], 0, 2.25, face - 0.02);
  box(room, crossWood, [0.5, 0.09, 0.07], 0, 2.42, face - 0.02);
  const gold = new THREE.MeshPhongMaterial({ color: '#E7B875', emissive: '#825527', emissiveIntensity: 0.4, shininess: 30 });
  geo(room, new THREE.TorusGeometry(0.33, 0.018, 5, 28), gold, 0, 2.42, face - 0.04);

  // A basket of firewood, a poker.
  const basket = paint('#8a6a3c');
  geo(room, new THREE.CylinderGeometry(0.26, 0.22, 0.3, 9), basket, -1.45, 0.15, face + 0.25);
  for (let i = 0; i < 5; i++) {
    const l = new THREE.Mesh(unitLog, i % 2 ? bark : paint('#6b4a30'));
    l.scale.set(0.055, 0.5, 0.055);
    l.rotation.set(Math.PI / 2, 0, 0.3 + i * 0.2);
    l.position.set(-1.45 + (i - 2) * 0.08, 0.33 + (i % 2) * 0.06, face + 0.25);
    room.add(l);
  }
  return gold;
}

function buildFurnishings(room: THREE.Group, paint: Paint, glow: THREE.Group, gold: Mat) {
  const random = seedRandom(99);

  // Braided rug.
  const rugRings: [number, string][] = [[1.0, '#8a3226'], [0.86, '#c69a59'], [0.78, '#6e2a20'], [0.55, '#b0543a'], [0.42, '#d4b87a'], [0.32, '#7a2c22']];
  rugRings.forEach(([r, c], i) => {
    const m = geo(room, new THREE.CylinderGeometry(r, r, 0.012, 28), paint(c), 0, 0.006 + i * 0.002, -0.9);
    m.scale.set(1.55, 1, 1.05);
  });

  // Prayer kneeler with an open Bible.
  const oak = paint('#7a4c2c');
  const dark = paint('#4a3020');
  const k = new THREE.Group();
  k.position.set(0, 0, -1.25);
  room.add(k);
  box(k, dark, [1.0, 0.1, 0.32], 0, 0.14, 0.32);
  box(k, paint('#7a2c22'), [0.95, 0.06, 0.28], 0, 0.22, 0.32);
  for (const x of [-0.44, 0.44]) {
    box(k, oak, [0.08, 0.9, 0.08], x, 0.45, -0.05);
    box(k, oak, [0.08, 0.08, 0.5], x, 0.06, 0.15);
  }
  const desk = new THREE.Group();
  desk.position.set(0, 0.92, -0.05);
  desk.rotation.x = 0.38;
  k.add(desk);
  box(desk, oak, [1.0, 0.05, 0.36], 0, 0, 0);
  box(desk, dark, [1.0, 0.07, 0.04], 0, 0.02, 0.18);
  const page = paint('#efe3c8');
  const cover = paint('#5a1f18');
  box(desk, cover, [0.5, 0.02, 0.3], 0, 0.035, 0);
  for (const side of [-1, 1]) {
    const leaf = box(desk, page, [0.23, 0.03, 0.27], side * 0.12, 0.06, 0);
    leaf.rotation.z = side * -0.12;
  }
  box(desk, paint('#a83a26'), [0.015, 0.005, 0.2], 0.02, 0.07, 0.12); // ribbon

  // Armchair beneath the dawn window, with a draped blanket and side table.
  const chair = new THREE.Group();
  chair.position.set(-2.25, 0, 0.3);
  chair.rotation.y = 2.25;
  room.add(chair);
  const leather = paint('#5d3a26');
  const cushion = paint('#a83a26');
  box(chair, leather, [0.85, 0.35, 0.8], 0, 0.3, 0);
  box(chair, cushion, [0.65, 0.12, 0.65], 0, 0.53, 0.05);
  box(chair, leather, [0.85, 0.85, 0.2], 0, 0.75, -0.32).rotation.x = -0.12;
  for (const x of [-0.37, 0.37]) box(chair, leather, [0.14, 0.58, 0.78], x, 0.5, 0);
  for (const x of [-0.33, 0.33]) for (const z of [-0.3, 0.3]) box(chair, dark, [0.07, 0.14, 0.07], x, 0.07, z);
  const blanket = paint('#c69a59');
  box(chair, blanket, [0.5, 0.03, 0.6], 0.25, 1.02, -0.28).rotation.x = -0.2;
  box(chair, blanket, [0.03, 0.6, 0.5], 0.44, 0.66, -0.05);
  for (let i = 0; i < 4; i++) box(chair, paint('#a8442e'), [0.035, 0.6, 0.04], 0.455, 0.66, -0.25 + i * 0.13);

  const side = new THREE.Group();
  side.position.set(-2.5, 0, -0.75);
  room.add(side);
  geo(side, new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), oak, 0, 0.62, 0);
  geo(side, new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6), dark, 0, 0.3, 0);
  geo(side, new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8), paint('#3a4f6a'), 0.08, 0.71, 0.03); // mug
  box(side, paint('#1f2a3a'), [0.18, 0.05, 0.24], -0.08, 0.67, -0.05).rotation.y = 0.4; // journal

  // Bookshelf on the right wall.
  const shelf = new THREE.Group();
  shelf.position.set(W - 0.3, 0, 1.15);
  shelf.rotation.y = -Math.PI / 2;
  room.add(shelf);
  const shelfWood = paint('#3a2a18');
  const back = paint('#1a2433');
  box(shelf, back, [1.5, 2.05, 0.04], 0, 1.03, -0.16);
  for (const x of [-0.75, 0.75]) box(shelf, shelfWood, [0.06, 2.1, 0.36], x, 1.05, 0);
  const spines = BOOK_SPINES.map(paint);
  for (let s = 0; s < 5; s++) {
    const y = 0.05 + s * 0.5;
    box(shelf, shelfWood, [1.5, 0.05, 0.36], 0, y, 0);
    if (s === 4) break;
    let x = -0.7;
    while (x < 0.66) {
      const w = 0.06 + random() * 0.05;
      const h = 0.3 + random() * 0.12;
      if (random() < 0.08) { x += 0.12; continue; }
      const b = box(shelf, spines[Math.floor(random() * spines.length)], [w, h, 0.24], x + w / 2, y + 0.025 + h / 2, 0.02);
      if (random() < 0.1) b.rotation.z = -0.25;
      x += w + 0.008;
    }
  }
  geo(shelf, new THREE.IcosahedronGeometry(0.11, 0), paint('#5d8979'), 0.5, 2.22, 0).scale.y = 0.7; // potted fern
  box(shelf, paint('#a8442e'), [0.14, 0.14, 0.14], 0.5, 2.15, 0);

  // Oil lamp on a small table under the right window.
  const tbl = new THREE.Group();
  tbl.position.set(W - 0.45, 0, -2.0);
  room.add(tbl);
  box(tbl, oak, [0.55, 0.05, 0.75], 0, 0.75, 0);
  for (const x of [-0.22, 0.22]) for (const z of [-0.32, 0.32]) box(tbl, dark, [0.05, 0.75, 0.05], x, 0.37, z);
  geo(tbl, new THREE.CylinderGeometry(0.09, 0.11, 0.1, 10), gold, 0, 0.83, 0);
  const lampGlass = new THREE.MeshBasicMaterial({ color: '#ffd993', transparent: true, opacity: 0.75, toneMapped: false });
  geo(tbl, new THREE.SphereGeometry(0.075, 10, 8), lampGlass, 0, 0.95, 0).scale.y = 1.4;
  const lampFlame = geo(glow, new THREE.OctahedronGeometry(0.025, 0), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false }), W - 0.45, 0.95, -2.0);
  lampFlame.scale.y = 2;
  lampFlame.userData.candle = true;

  // Coat peg by the door with a scarf.
  box(room, dark, [0.9, 0.08, 0.05], -1.3, 1.7, D - 0.12);
  box(room, paint('#3a4f6a'), [0.12, 0.7, 0.04], -1.5, 1.35, D - 0.16);
  box(room, paint('#c25a36'), [0.1, 0.5, 0.04], -1.1, 1.45, D - 0.16);

  // Hanging lantern from the tie beam.
  const lantern = new THREE.Group();
  lantern.position.set(0, H - 0.05, -1.7);
  room.add(lantern);
  box(lantern, paint('#2b2826'), [0.015, 0.5, 0.015], 0, -0.25, 0);
  box(lantern, gold, [0.24, 0.04, 0.24], 0, -0.52, 0);
  box(lantern, gold, [0.24, 0.04, 0.24], 0, -0.86, 0);
  for (const x of [-0.11, 0.11]) for (const z of [-0.11, 0.11]) box(lantern, gold, [0.025, 0.34, 0.025], x, -0.69, z);
  geo(lantern, new THREE.BoxGeometry(0.19, 0.3, 0.19), new THREE.MeshBasicMaterial({ color: '#ffc97a', transparent: true, opacity: 0.55, toneMapped: false }), 0, -0.69, 0);
  geo(lantern, new THREE.ConeGeometry(0.18, 0.14, 4), gold, 0, -0.45, 0).rotation.y = Math.PI / 4;

  return lantern;
}

/** A small sleeping lamb by the fire — a nod to the app's companion pets. */
function buildLamb(room: THREE.Group, paint: Paint) {
  const lamb = new THREE.Group();
  lamb.position.set(1.15, 0, -1.85);
  lamb.rotation.y = -0.6;
  room.add(lamb);
  const wool = paint('#f3ead8');
  const woolShade = paint('#e2d6bf');
  const face = paint('#3a2e2a');
  const body = new THREE.Group();
  lamb.add(body);
  const random = seedRandom(17);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    geo(body, unitBall, i % 3 ? wool : woolShade, Math.cos(a) * 0.17, 0.17 + random() * 0.05, Math.sin(a) * 0.12).scale.setScalar(0.12 + random() * 0.03);
  }
  geo(body, unitBall, wool, 0, 0.2, 0).scale.set(0.22, 0.15, 0.16);
  const head = new THREE.Group();
  head.position.set(0.27, 0.13, 0.08);
  head.rotation.y = 0.5;
  lamb.add(head);
  geo(head, unitBall, face, 0, 0, 0).scale.set(0.09, 0.08, 0.075);
  geo(head, unitBall, wool, -0.03, 0.06, 0).scale.setScalar(0.06);
  for (const s of [-1, 1]) geo(head, unitBall, face, -0.02, 0.0, s * 0.08).scale.set(0.05, 0.02, 0.03);
  return body;
}

function buildMotes() {
  const random = seedRandom(126);
  const n = 140;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = -W + 0.2 + random() * (W * 2 - 0.4);
    positions[i * 3 + 1] = 0.2 + random() * 3.2;
    positions[i * 3 + 2] = -D + 0.3 + random() * (D * 2 - 0.6);
  }
  const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: '#FCE3AF', size: 0.022, transparent: true, opacity: 0.6, depthWrite: false }));
}

/** Soft additive shaft of dawn light falling from the left window to the floor. */
function buildSunbeam(leftWin: Opening) {
  const g = new THREE.BufferGeometry();
  const top = [[-W, leftWin.y1, leftWin.a0], [-W, leftWin.y1, leftWin.a1], [-W, leftWin.y0, leftWin.a1], [-W, leftWin.y0, leftWin.a0]];
  const dx = 1.6;
  const floor = [[-W + dx + 1.1, 0.02, leftWin.a0 + 0.35], [-W + dx + 1.1, 0.02, leftWin.a1 + 0.35], [-W + dx, 0.02, leftWin.a1 + 0.35], [-W + dx, 0.02, leftWin.a0 + 0.35]];
  const v = [...top, ...floor].flat();
  const idx = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7, 4, 5, 6, 4, 6, 7];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({
    color: '#f5cba2', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  return new THREE.Mesh(g, mat);
}

export function createCabinWorld(options: THREE.WebGLRendererParameters) {
  const renderer = new THREE.WebGLRenderer({ ...options, antialias: true });
  renderer.debug.onShaderError = (gl, program) => {
    throw new Error(gl.getProgramInfoLog(program) || 'The cabin shaders could not be linked.');
  };
  renderer.setClearColor('#14182a', 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#1a1410', 6, 14);
  const room = new THREE.Group();
  const glow = new THREE.Group();
  scene.add(room, glow);

  // Lambert keeps us off float colour buffers that some Expo GL devices lack (same as the chapel).
  const cache = new Map<string, THREE.MeshLambertMaterial>();
  const paint: Paint = color => {
    let m = cache.get(color);
    if (!m) cache.set(color, (m = new THREE.MeshLambertMaterial({ color, flatShading: true })));
    return m;
  };

  const { leftWin } = buildShell(room, paint);
  const gold = buildHearth(room, paint, glow);
  const lantern = buildFurnishings(room, paint, glow, gold);
  const lambBody = buildLamb(room, paint);
  const motes = buildMotes();
  const beam = buildSunbeam(leftWin);
  scene.add(motes, beam);

  // Lighting: dusky ambient, cool dawn from the windows, warm fire + lantern + lamp.
  scene.add(new THREE.HemisphereLight('#6d7fa8', '#3a2414', 0.9));
  const dawn = new THREE.DirectionalLight('#f5cba2', 1.6);
  dawn.position.set(-8, 5, 1);
  scene.add(dawn);
  const fire = new THREE.PointLight('#ff9a4a', 9, 9, 1.4);
  fire.position.set(0, 0.55, -D + 1.1);
  scene.add(fire);
  const lanternLight = new THREE.PointLight('#ffcf8a', 5, 7, 1.5);
  lanternLight.position.set(0, H - 0.75, -1.7);
  scene.add(lanternLight);
  const lampLight = new THREE.PointLight('#ffd993', 2.4, 4, 1.6);
  lampLight.position.set(W - 0.5, 1.05, -2.0);
  scene.add(lampLight);

  const camera = new THREE.PerspectiveCamera(64, 1, 0.05, 30);
  camera.rotation.order = 'YXZ';

  return {
    resize(width: number, height: number, pixelRatio: number) {
      camera.aspect = width / height;
      // Keep the room's width in frame on tall phones.
      camera.fov = camera.aspect < 0.7 ? 74 : 64;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    },
    render(view: CabinView, seconds: number) {
      camera.position.set(view.x, view.y + Math.sin(seconds * 0.9) * 0.012, view.z);
      camera.rotation.set(view.pitch, view.yaw, 0);

      const flicker = Math.sin(seconds * 9.1) * 0.5 + Math.sin(seconds * 13.7 + 1.3) * 0.3 + Math.sin(seconds * 4.3) * 0.4;
      fire.intensity = 9 + flicker * 1.6;
      lanternLight.intensity = 5 + Math.sin(seconds * 3.1) * 0.25;
      for (const f of glow.children) {
        const phase = (f.userData.phase as number) ?? 0;
        if (f.userData.candle) {
          f.scale.y = 1.9 + Math.sin(seconds * 8 + phase) * 0.35;
          continue;
        }
        const base = f.userData.base as number;
        f.scale.set(0.8, base * (1.6 + 0.5 * Math.sin(seconds * 7 + phase) + 0.25 * Math.sin(seconds * 13 + phase * 2)), 0.8);
        f.rotation.y = seconds * 0.6 + phase;
      }
      lantern.rotation.z = Math.sin(seconds * 0.7) * 0.025;
      lambBody.scale.y = 1 + Math.sin(seconds * 1.6) * 0.035;
      motes.rotation.y = Math.sin(seconds * 0.05) * 0.08;
      motes.position.y = Math.sin(seconds * 0.4) * 0.06;
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.065 + Math.sin(seconds * 0.5) * 0.012;

      renderer.render(scene, camera);
    },
    dispose() {
      const materials = new Set<THREE.Material>();
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        if (object.geometry !== unitBox && object.geometry !== unitLog && object.geometry !== unitBall) geometries.add(object.geometry);
        const list: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
        for (const m of list) materials.add(m);
      });
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      renderer.dispose();
    },
  };
}
