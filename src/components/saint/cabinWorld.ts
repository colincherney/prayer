import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// A log-cabin prayer room in the warm-lamplit language of the 2D Lamplit Corner scene.
// Smooth-shaded, bevelled geometry with procedural grain/stone/cloth textures (generated as
// DataTextures, so nothing is downloaded and it works in Expo GL).

type Mat = THREE.Material;
type Finish = 'wood' | 'stone' | 'cloth' | 'leather' | 'plain';
type Paint = (color: string, finish?: Finish) => THREE.Material;

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

// ---------------------------------------------------------------- procedural textures

/** Tileable 2D value noise on a `cells` grid, sampled at (u, v) in [0, 1). */
function valueNoise(cellsX: number, cellsY: number, seed: number) {
  const random = seedRandom(seed);
  const grid = Array.from({ length: cellsX * cellsY }, random);
  const at = (x: number, y: number) => grid[((y % cellsY) + cellsY) % cellsY * cellsX + ((x % cellsX) + cellsX) % cellsX];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const x = u * cellsX;
    const y = v * cellsY;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const sx = smooth(x - x0);
    const sy = smooth(y - y0);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

function dataTexture(w: number, h: number, shade: (u: number, v: number) => number | [number, number, number]) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = shade(x / w, y / h);
      const [r, g, b] = typeof s === 'number' ? [s, s, s] : s;
      const i = (y * w + x) * 4;
      data[i] = Math.max(0, Math.min(255, r * 255));
      data[i + 1] = Math.max(0, Math.min(255, g * 255));
      data[i + 2] = Math.max(0, Math.min(255, b * 255));
      data[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** Grain runs along v (the length of a cylinder or a plank). */
function woodTexture() {
  const warp = valueNoise(6, 24, 11);
  const fine = valueNoise(64, 8, 12);
  const knots = valueNoise(4, 10, 13);
  return dataTexture(128, 512, (u, v) => {
    const ring = Math.sin((u * 22 + warp(u, v) * 4.5) * Math.PI);
    const streak = fine(u, v) * 0.18;
    const knot = Math.max(0, knots(u, v) - 0.78) * 2.4;
    return 0.86 + ring * 0.07 - streak + 0.05 - knot;
  });
}

/** End grain: concentric growth rings around the cap centre. */
function endGrainTexture() {
  const wobble = valueNoise(8, 8, 21);
  return dataTexture(128, 128, (u, v) => {
    const dx = u - 0.5;
    const dy = v - 0.5;
    const r = Math.hypot(dx, dy) * 2 + wobble(u, v) * 0.08;
    const rings = Math.sin(r * 38) * 0.06;
    const bark = r > 0.9 ? -0.35 : 0;
    const crack = Math.abs(Math.atan2(dy, dx) - 0.7) < 0.03 && r < 0.75 ? -0.25 : 0;
    return [1.0 + rings + bark + crack, 0.88 + rings + bark + crack, 0.7 + rings + bark + crack];
  });
}

function stoneTexture() {
  const big = valueNoise(5, 5, 31);
  const mid = valueNoise(17, 17, 32);
  const speck = valueNoise(64, 64, 33);
  return dataTexture(128, 128, (u, v) => 0.72 + big(u, v) * 0.18 + mid(u, v) * 0.12 + (speck(u, v) > 0.82 ? 0.1 : 0) - (speck(u, v) < 0.12 ? 0.12 : 0));
}

function clothTexture() {
  const fuzz = valueNoise(32, 32, 41);
  return dataTexture(64, 64, (u, v) => {
    const weave = (Math.sin(u * Math.PI * 32) * Math.sin(v * Math.PI * 32)) * 0.06;
    return 0.9 + weave + fuzz(u, v) * 0.1;
  });
}

// ---------------------------------------------------------------- geometry

const roundedCache = new Map<string, THREE.BufferGeometry>();
function roundedBox(w: number, h: number, d: number, round?: number) {
  const r = round ?? Math.min(0.03, Math.min(w, h, d) * 0.22);
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${r.toFixed(3)}`;
  let g = roundedCache.get(key);
  if (!g) {
    g = r < 0.004 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 3, r);
    roundedCache.set(key, g);
  }
  return g;
}

/** A hand-hewn log: unit length along Y, radius 1, gently irregular and wavy along its run. */
function makeLogGeometry() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 22, 10);
  const pos = g.attributes.position;
  const lumps = valueNoise(6, 4, 51);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-4) continue;
    const a = (Math.atan2(v.z, v.x) / (Math.PI * 2) + 1) % 1;
    const f = 0.93 + lumps(a, v.y + 0.5) * 0.11 + Math.sin(v.y * 9) * 0.012;
    pos.setXYZ(i, v.x * f, v.y, v.z * f);
  }
  g.computeVertexNormals();
  return g;
}

const logGeometry = makeLogGeometry();
const softBall = new THREE.IcosahedronGeometry(1, 3);

/** Teardrop flame profile, base at y=0, tip at y=1. */
const flameGeometry = new THREE.LatheGeometry(
  Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    return new THREE.Vector2(Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.6) * 0.5, t);
  }),
  14,
);

function box(parent: THREE.Object3D, mat: Mat, size: [number, number, number], x: number, y: number, z: number, round?: number) {
  const m = new THREE.Mesh(roundedBox(...size, round), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function geo(parent: THREE.Object3D, g: THREE.BufferGeometry, mat: Mat | Mat[], x: number, y: number, z: number) {
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

type LogMats = { bark: Mat; end: Mat };

/** A horizontal log from a to b along the wall's run axis. */
function log(parent: THREE.Object3D, mats: LogMats, axis: 'x' | 'z', a: number, b: number, fixed: number, y: number, r = LOG_R, spin = 0) {
  if (b - a < 0.08) return;
  const m = new THREE.Mesh(logGeometry, [mats.bark, mats.end, mats.end]);
  m.scale.set(r, b - a, r);
  const mid = (a + b) / 2;
  if (axis === 'x') {
    m.rotation.set(spin, 0, Math.PI / 2, 'XZY');
    m.position.set(mid, y, fixed);
  } else {
    m.rotation.set(Math.PI / 2, spin, 0);
    m.position.set(fixed, y, mid);
  }
  parent.add(m);
}

type Opening = { a0: number; a1: number; y0: number; y1: number };

/** A stacked-log wall with gaps for windows and doors, optionally rising into a gable. */
function logWall(parent: THREE.Object3D, logs: LogMats[], chink: Mat, axis: 'x' | 'z', fixed: number, half: number, openings: Opening[], gable: boolean) {
  const inward = -Math.sign(fixed);
  const top = gable ? RIDGE : H;
  // Chinking behind the logs so the gaps read as mortar, not void.
  if (axis === 'x') box(parent, chink, [half * 2, top, 0.04], 0, top / 2, fixed - inward * 0.07, 0);
  else box(parent, chink, [0.04, H, half * 2], fixed - inward * 0.07, H / 2, 0, 0);
  const random = seedRandom(Math.round(fixed * 100) + 7);
  let row = 0;
  for (let y = LOG_R; y < top; y += LOG_STEP, row++) {
    const span = y <= H ? half + 0.18 : half * (RIDGE - y) / (RIDGE - H);
    if (span < 0.1) break;
    const cuts = openings
      .filter(o => y + LOG_R * 0.6 > o.y0 && y - LOG_R * 0.6 < o.y1)
      .sort((p, q) => p.a0 - q.a0);
    let from = -span;
    const mats = logs[(row + Math.floor(random() * 2)) % logs.length];
    const radius = LOG_R * (0.94 + random() * 0.1);
    const spin = random() * Math.PI * 2;
    for (const cut of cuts) {
      log(parent, mats, axis, from, cut.a0, fixed, y, radius, spin);
      from = cut.a1;
    }
    log(parent, mats, axis, from, span, fixed, y, radius, spin + 1);
  }
}

/** Vertex-coloured gradient plane — the dawn sky seen through glass. */
function skyPlane(width: number, height: number, stops: [number, string][]) {
  const g = new THREE.PlaneGeometry(width, height, 1, 16);
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

/** Layered pine silhouette: three stacked tiers and a trunk. */
function pineShape(h: number) {
  const s = new THREE.Shape();
  const w = h * 0.34;
  s.moveTo(-w * 0.12, 0);
  s.lineTo(-w * 0.12, h * 0.1);
  s.lineTo(-w, h * 0.1);
  s.lineTo(-w * 0.45, h * 0.42);
  s.lineTo(-w * 0.78, h * 0.42);
  s.lineTo(-w * 0.3, h * 0.7);
  s.lineTo(-w * 0.52, h * 0.7);
  s.lineTo(0, h);
  s.lineTo(w * 0.52, h * 0.7);
  s.lineTo(w * 0.3, h * 0.7);
  s.lineTo(w * 0.78, h * 0.42);
  s.lineTo(w * 0.45, h * 0.42);
  s.lineTo(w, h * 0.1);
  s.lineTo(w * 0.12, h * 0.1);
  s.lineTo(w * 0.12, 0);
  s.closePath();
  return s;
}

/** A window cut into a wall: dawn sky, hills and pines, frame, mullions and sill. Built facing +z, then turned. */
function cabinWindow(parent: THREE.Object3D, frame: Mat, w: number, h: number) {
  const win = new THREE.Group();
  parent.add(win);
  const sky = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  geo(win, skyPlane(w + 0.1, h + 0.1, DAWN), sky, 0, h / 2, -0.14);
  const sun = new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false });
  geo(win, new THREE.CircleGeometry(0.11, 32), sun, w * 0.18, h * 0.36, -0.135);
  const halo = new THREE.MeshBasicMaterial({ color: '#ffe2b0', transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false });
  geo(win, new THREE.CircleGeometry(0.22, 32), halo, w * 0.18, h * 0.36, -0.136);

  // Distant ridge line.
  const hills = new THREE.Shape();
  hills.moveTo(-w / 2 - 0.05, -0.05);
  for (let i = 0; i <= 16; i++) {
    const x = -w / 2 - 0.05 + (i / 16) * (w + 0.1);
    hills.lineTo(x, h * (0.2 + 0.07 * Math.sin(i * 0.9) + 0.04 * Math.sin(i * 2.3)));
  }
  hills.lineTo(w / 2 + 0.05, -0.05);
  hills.closePath();
  geo(win, new THREE.ShapeGeometry(hills), new THREE.MeshBasicMaterial({ color: '#5b5f7e' }), 0, 0, -0.132);

  const random = seedRandom(Math.round(w * 97 + h * 31));
  const pineMats = ['#283147', '#34405a', '#2f3a52'].map(color => new THREE.MeshBasicMaterial({ color }));
  for (let i = 0; i < 9; i++) {
    const px = -w / 2 + (i + random() * 0.8) * (w / 8.5);
    const ph = 0.22 + random() * 0.36;
    geo(win, new THREE.ShapeGeometry(pineShape(ph)), pineMats[i % 3], px, -0.03, -0.128 + i * 0.0005);
  }
  const t = 0.07;
  box(win, frame, [w + t * 2, t, 0.2], 0, h + t / 2, 0);
  box(win, frame, [w + t * 2, t, 0.2], 0, -t / 2, 0);
  box(win, frame, [t, h, 0.2], -w / 2 - t / 2, h / 2, 0);
  box(win, frame, [t, h, 0.2], w / 2 + t / 2, h / 2, 0);
  box(win, frame, [0.035, h, 0.05], 0, h / 2, -0.07);
  box(win, frame, [w, 0.035, 0.05], 0, h * 0.55, -0.07);
  box(win, frame, [w + 0.3, 0.06, 0.26], 0, -0.09, 0.07, 0.02);
  // Faint glass sheen.
  const glass = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.05, depthWrite: false });
  geo(win, new THREE.PlaneGeometry(w, h), glass, 0, h / 2, -0.06);
  return win;
}

function buildShell(room: THREE.Group, paint: Paint, logMats: (bark: string) => LogMats) {
  const logs = [logMats('#8a5a36'), logMats('#7a4c2c'), logMats('#94633b')];
  const chink = paint('#3a2a1c', 'stone');
  const frame = paint('#4a3020', 'wood');

  // Plank floor with staggered butt joints.
  const planks = [paint('#5a3a22', 'wood'), paint('#4e321d', 'wood'), paint('#63412a', 'wood')];
  const random = seedRandom(23);
  for (let i = 0, x = -W; x < W; i++, x += 0.32) {
    const split = -D + 1 + random() * (D * 2 - 2);
    box(room, planks[i % 3], [0.31, 0.06, split + D - 0.012], x + 0.16, -0.03, (-D + split) / 2, 0.012);
    box(room, planks[(i + 1) % 3], [0.31, 0.06, D - split - 0.012], x + 0.16, -0.03, (split + D) / 2, 0.012);
  }
  // Baseboard-dark gap under the floor so seams read.
  box(room, paint('#1e140c'), [W * 2, 0.02, D * 2], 0, -0.065, 0, 0);

  const leftWin = { a0: -0.75, a1: 0.95, y0: 0.95, y1: 2.15 };
  const rightWin = { a0: -2.45, a1: -1.55, y0: 1.2, y1: 2.0 };
  const door = { a0: -0.55, a1: 0.55, y0: -1, y1: 2.15 };
  const frontWin = { a0: 1.35, a1: 2.3, y0: 1.15, y1: 1.95 };
  logWall(room, logs, chink, 'x', -D, W, [], true);
  logWall(room, logs, chink, 'x', D, W, [door, frontWin], true);
  logWall(room, logs, chink, 'z', -W, D, [leftWin], false);
  logWall(room, logs, chink, 'z', W, D, [rightWin], false);

  // Corner posts.
  const post = logMats('#6e4528');
  for (const x of [-W, W]) for (const z of [-D, D]) {
    const p = new THREE.Mesh(logGeometry, [post.bark, post.end, post.end]);
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

  // Plank door with iron straps, rivets and a ring pull.
  const doorWood = [paint('#5d3a22', 'wood'), paint('#684226', 'wood')];
  for (let i = 0; i < 5; i++) box(room, doorWood[i % 2], [0.212, 2.1, 0.07], -0.44 + i * 0.22, 1.05, D - 0.03, 0.015);
  const iron = new THREE.MeshPhongMaterial({ color: '#2b2826', specular: '#555049', shininess: 40 });
  const rivet = new THREE.SphereGeometry(0.014, 10, 8);
  for (const y of [0.45, 1.7]) {
    box(room, iron, [1.0, 0.07, 0.02], 0, y, D - 0.075, 0.008);
    for (let i = 0; i < 5; i++) geo(room, rivet, iron, -0.44 + i * 0.22, y, D - 0.088);
  }
  geo(room, new THREE.TorusGeometry(0.06, 0.012, 10, 28), iron, 0.32, 1.05, D - 0.09);
  geo(room, new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), iron, 0.32, 1.11, D - 0.08).rotation.x = Math.PI / 2;
  box(room, frame, [1.3, 0.12, 0.22], 0, 2.2, D - 0.02);
  for (const x of [-0.61, 0.61]) box(room, frame, [0.1, 2.2, 0.22], x, 1.1, D - 0.02);

  // Roof: underside planks, rafters, ridge beam and tie-beam logs.
  const slope = Math.atan2(RIDGE - H, W);
  const run = Math.hypot(RIDGE - H, W) + 0.25;
  const ceiling = [paint('#6b4529', 'wood'), paint('#5f3d24', 'wood')];
  const rafter = paint('#4a2f1c', 'wood');
  for (const side of [-1, 1]) {
    const roof = new THREE.Group();
    roof.position.set(side * W / 2, (H + RIDGE) / 2 + 0.12, 0);
    roof.rotation.z = -side * slope;
    room.add(roof);
    // Planks run down the slope; box UVs put grain along the long axis.
    const n = 14;
    for (let i = 0; i < n; i++) box(roof, ceiling[i % 2], [run / n - 0.006, 0.06, D * 2 + 0.4], -run / 2 + (i + 0.5) * run / n, 0.05, 0, 0.01);
    for (let z = -D + 0.5; z <= D - 0.4; z += 1.0) box(roof, rafter, [run, 0.16, 0.13], 0, -0.06, z, 0.025);
  }
  box(room, rafter, [0.24, 0.24, D * 2], 0, RIDGE + 0.02, 0, 0.04);
  const tie = logMats('#5a3820');
  for (const z of [-1.7, 1.2]) log(room, tie, 'x', -W, W, z, H + 0.05, 0.12);
  return { leftWin };
}

function buildHearth(room: THREE.Group, paint: Paint, logMats: (bark: string) => LogMats, glow: THREE.Group) {
  const stones = [paint('#6a6470', 'stone'), paint('#57525e', 'stone'), paint('#7a7279', 'stone'), paint('#4a4652', 'stone'), paint('#6e6258', 'stone')];
  const mortar = paint('#2f2a30', 'stone');
  const soot = new THREE.MeshBasicMaterial({ color: '#120a06' });
  const z0 = -D + 0.02;
  const depth = 0.75;
  const face = z0 + depth;
  const random = seedRandom(5);

  // Firebox cavity, pillars, and a narrower chimney stack above the mantle.
  box(room, soot, [1.1, 1.0, 0.1], 0, 0.5, z0 + 0.12, 0);
  box(room, soot, [1.1, 0.1, depth], 0, 1.0, z0 + depth / 2, 0);
  for (const side of [-1, 1]) box(room, mortar, [0.5, 1.05, depth], side * 0.8, 0.52, z0 + depth / 2, 0);
  box(room, mortar, [1.7, RIDGE - 1.1, depth - 0.12], 0, 1.1 + (RIDGE - 1.1) / 2, z0 + (depth - 0.12) / 2, 0);

  // Fieldstones: rounded, slightly tilted and jittered so the stack looks laid by hand.
  const stone = (x: number, y: number, z: number, w: number, h: number) => {
    const d = 0.1 + random() * 0.05;
    const s = box(room, stones[Math.floor(random() * stones.length)], [w, h, d], x, y, z, Math.min(w, h) * 0.32);
    s.rotation.set((random() - 0.5) * 0.12, (random() - 0.5) * 0.15, (random() - 0.5) * 0.14);
  };
  for (const side of [-1, 1]) {
    for (let y = 0.1; y < 1.0; y += 0.19) {
      stone(side * (0.67 + random() * 0.03), y, face, 0.22, 0.16);
      stone(side * (0.91 + random() * 0.03), y + 0.07, face, 0.21, 0.15);
      // Side faces of the pillars.
      stone(side * 1.05, y + 0.03, face - 0.25, 0.1, 0.16);
    }
  }
  // Arch stones over the firebox.
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.12 + (i / 6) * 0.76);
    const s = box(room, stones[i % stones.length], [0.17, 0.13, 0.13], Math.cos(a) * 0.62, 0.62 + Math.sin(a) * 0.36, face, 0.04);
    s.rotation.z = a - Math.PI / 2;
  }
  for (let y = 1.32, row = 0; y < RIDGE - 0.1; y += 0.22, row++) {
    for (let x = -0.72 + (row % 2) * 0.13; x < 0.75; x += 0.26 + random() * 0.05) {
      stone(x + 0.1, y, face - 0.12, 0.22 + random() * 0.06, 0.16 + random() * 0.04);
    }
  }

  // Hearth slab and a chunky mantle beam with corbels.
  box(room, stones[1], [2.3, 0.08, 0.7], 0, 0.04, face + 0.3, 0.03);
  const mantle = paint('#5a3820', 'wood');
  box(room, mantle, [2.25, 0.16, 0.4], 0, 1.12, face + 0.05, 0.035);
  for (const x of [-0.95, 0.95]) box(room, mantle, [0.12, 0.2, 0.28], x, 0.94, face + 0.02, 0.03);

  // Fire: split logs, glowing ember bed, layered additive flames.
  const firewood = logMats('#3e2a1c');
  for (const [x, rot, lift] of [[-0.12, 0.35, 0], [0.14, -0.4, 0], [0, 0, 0.09]] as const) {
    const l = new THREE.Mesh(logGeometry, [firewood.bark, firewood.end, firewood.end]);
    l.scale.set(0.07, 0.7, 0.07);
    l.rotation.set(Math.PI / 2, 0, Math.PI / 2 + rot);
    l.position.set(x, 0.1 + lift, z0 + 0.42);
    room.add(l);
  }
  const ember = new THREE.MeshBasicMaterial({ color: '#ff7a2e', toneMapped: false });
  box(room, ember, [0.7, 0.03, 0.35], 0, 0.04, z0 + 0.42, 0.012);
  const emberCoals = new THREE.MeshBasicMaterial({ color: '#ffb04a', toneMapped: false });
  for (let i = 0; i < 14; i++) geo(room, softBall, emberCoals, -0.3 + random() * 0.6, 0.06, z0 + 0.3 + random() * 0.25).scale.setScalar(0.015 + random() * 0.015);
  const glowFloor = new THREE.MeshBasicMaterial({ color: '#ff8a3c', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pool = geo(room, new THREE.CircleGeometry(1, 40), glowFloor, 0, 0.09, face + 0.35);
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(1.3, 0.75, 1);

  const flameLayers = [
    { color: '#ff7a2a', opacity: 0.55, scale: 1.0 },
    { color: '#ffb347', opacity: 0.7, scale: 0.7 },
    { color: '#fff0b8', opacity: 0.85, scale: 0.4 },
  ];
  for (let i = 0; i < 6; i++) {
    const tongue = new THREE.Group();
    tongue.position.set(-0.25 + i * 0.1, 0.12, z0 + 0.4 + (i % 2) * 0.06);
    tongue.userData.base = 0.75 + random() * 0.55;
    tongue.userData.phase = random() * 10;
    glow.add(tongue);
    for (const layer of flameLayers) {
      const m = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: layer.opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      geo(tongue, flameGeometry, m, 0, 0, 0).scale.set(0.16 * layer.scale, 0.42 * layer.scale, 0.16 * layer.scale);
    }
  }

  // Mantle: candles with drips and halos, a cross with a gold ring.
  const wax = paint('#efe3c8', 'plain');
  const candleGeo = new THREE.CylinderGeometry(0.03, 0.032, 1, 18);
  const halo = new THREE.MeshBasicMaterial({ color: '#ffd993', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const candleFlame = new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const x of [-0.85, -0.7, 0.75]) {
    const h = x === -0.7 ? 0.14 : 0.22;
    geo(room, candleGeo, wax, x, 1.2 + h / 2, face + 0.08).scale.y = h;
    geo(room, softBall, wax, x + 0.025, 1.2 + h * 0.8, face + 0.1).scale.set(0.01, 0.025, 0.01);
    const flame = geo(glow, flameGeometry, candleFlame, x, 1.205 + h, face + 0.08);
    flame.scale.set(0.035, 0.07, 0.035);
    flame.userData.candle = true;
    flame.userData.phase = x * 7;
    geo(room, softBall, halo, x, 1.24 + h, face + 0.08).scale.setScalar(0.09);
  }
  const crossWood = paint('#6e4528', 'wood');
  box(room, crossWood, [0.09, 0.85, 0.07], 0, 2.25, face - 0.02, 0.02);
  box(room, crossWood, [0.5, 0.09, 0.07], 0, 2.42, face - 0.01, 0.02);
  const gold = new THREE.MeshPhongMaterial({ color: '#E7B875', emissive: '#825527', emissiveIntensity: 0.4, specular: '#fff0c8', shininess: 60 });
  geo(room, new THREE.TorusGeometry(0.33, 0.018, 12, 64), gold, 0, 2.42, face - 0.04);

  // A woven basket of firewood.
  const basket = paint('#8a6a3c', 'cloth');
  geo(room, new THREE.CylinderGeometry(0.26, 0.22, 0.3, 28, 1, true), basket, -1.45, 0.15, face + 0.25);
  geo(room, new THREE.TorusGeometry(0.26, 0.018, 8, 36), paint('#6e5230', 'wood'), -1.45, 0.3, face + 0.25).rotation.x = Math.PI / 2;
  geo(room, new THREE.CircleGeometry(0.22, 28), basket, -1.45, 0.005, face + 0.25).rotation.x = -Math.PI / 2;
  const split = [logMats('#3e2a1c'), logMats('#6b4a30')];
  for (let i = 0; i < 6; i++) {
    const m = split[i % 2];
    const l = new THREE.Mesh(logGeometry, [m.bark, m.end, m.end]);
    l.scale.set(0.05, 0.5, 0.05);
    l.rotation.set(Math.PI / 2, 0, 0.3 + i * 0.25);
    l.position.set(-1.45 + (i - 2.5) * 0.07, 0.3 + (i % 2) * 0.06, face + 0.25);
    room.add(l);
  }
  return gold;
}

function buildFurnishings(room: THREE.Group, paint: Paint, glow: THREE.Group, gold: Mat) {
  const random = seedRandom(99);

  // Braided oval rug: many thin rings with a soft cloth texture.
  const rugColors = ['#8a3226', '#c69a59', '#6e2a20', '#b0543a', '#d4b87a', '#7a2c22', '#a8442e', '#c69a59', '#6e2a20'];
  rugColors.forEach((c, i) => {
    const r = 1 - i * 0.1;
    const m = geo(room, new THREE.CylinderGeometry(r, r, 0.012, 64), paint(c, 'cloth'), 0, 0.006 + i * 0.0015, -0.9);
    m.scale.set(1.55, 1, 1.05);
  });
  const rugEdge = geo(room, new THREE.TorusGeometry(1, 0.012, 8, 96), paint('#5a1f18', 'cloth'), 0, 0.012, -0.9);
  rugEdge.rotation.x = Math.PI / 2;
  rugEdge.scale.set(1.55, 1.05, 1);

  // Prayer kneeler with an open Bible.
  const oak = paint('#7a4c2c', 'wood');
  const dark = paint('#4a3020', 'wood');
  const k = new THREE.Group();
  k.position.set(0, 0, -1.25);
  room.add(k);
  box(k, dark, [1.0, 0.1, 0.32], 0, 0.14, 0.32);
  box(k, paint('#7a2c22', 'cloth'), [0.95, 0.07, 0.28], 0, 0.22, 0.32, 0.03);
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
  const page = paint('#efe3c8', 'plain');
  const cover = new THREE.MeshPhongMaterial({ color: '#5a1f18', specular: '#3a2018', shininess: 18 });
  box(desk, cover, [0.5, 0.02, 0.3], 0, 0.035, 0, 0.008);
  // Curved open pages: bent planes.
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(0.235, 0.27, 12, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 0.1175; // 0..0.235 from spine
      p.setZ(i, Math.sin((x / 0.235) * Math.PI * 0.85) * 0.025 + x * 0.04);
      p.setX(i, side * x);
    }
    g.computeVertexNormals();
    const leaf = geo(desk, g, page, 0, 0.048, 0);
    leaf.rotation.x = -Math.PI / 2;
    (leaf.material as THREE.Material).side = THREE.DoubleSide;
    // Page block underneath.
    box(desk, page, [0.22, 0.02, 0.26], side * 0.118, 0.04, 0, 0.006);
  }
  box(desk, gold, [0.5, 0.004, 0.302], 0, 0.046, 0, 0); // gilt edge
  box(desk, paint('#a83a26', 'cloth'), [0.012, 0.004, 0.24], 0.015, 0.07, 0.13, 0);

  // Armchair beneath the dawn window, with a draped blanket and side table.
  const chair = new THREE.Group();
  chair.position.set(-2.25, 0, 0.3);
  chair.rotation.y = 2.25;
  room.add(chair);
  const leather = paint('#5d3a26', 'leather');
  const cushion = paint('#a83a26', 'cloth');
  box(chair, leather, [0.85, 0.35, 0.8], 0, 0.3, 0, 0.07);
  box(chair, cushion, [0.62, 0.14, 0.64], 0, 0.54, 0.05, 0.06);
  box(chair, leather, [0.85, 0.85, 0.2], 0, 0.75, -0.32, 0.08).rotation.x = -0.12;
  box(chair, cushion, [0.6, 0.5, 0.1], 0, 0.85, -0.2, 0.04).rotation.x = -0.14;
  for (const x of [-0.37, 0.37]) {
    box(chair, leather, [0.14, 0.5, 0.78], x, 0.46, 0, 0.06);
    // Rolled arm tops.
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.8, 24), leather);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(x, 0.72, 0.0);
    chair.add(roll);
  }
  const studs = new THREE.SphereGeometry(0.008, 8, 6);
  for (const x of [-0.45, 0.45]) for (let i = 0; i < 8; i++) geo(chair, studs, gold, x, 0.64, -0.33 + i * 0.095);
  for (const x of [-0.33, 0.33]) for (const z of [-0.3, 0.3]) geo(chair, new THREE.CylinderGeometry(0.03, 0.022, 0.14, 12), dark, x, 0.07, z);
  const blanket = paint('#c69a59', 'cloth');
  // Draped blanket: a bent plane over the back and arm.
  {
    const g = new THREE.PlaneGeometry(0.55, 1.1, 8, 24);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i);
      const v = p.getY(i) + 0.55; // 0..1.1
      const fold = Math.sin(u * 22 + v * 3) * 0.012;
      // Over the arm roll: up the inside, across the top, down the outside.
      const a = Math.min(Math.PI, (v / 1.1) * Math.PI);
      p.setXYZ(i, u, 0.47 + Math.sin(a) * 0.36, Math.cos(a) * 0.14 + fold);
    }
    g.computeVertexNormals();
    const drape = geo(chair, g, blanket, 0.4, 0.0, -0.05);
    drape.rotation.y = Math.PI / 2;
    (drape.material as THREE.Material).side = THREE.DoubleSide;
  }
  // Tassels along the blanket's hanging hem.
  const tassel = paint('#a8442e', 'cloth');
  for (let i = 0; i < 9; i++) geo(chair, softBall, tassel, 0.54, 0.47, -0.3 + i * 0.062).scale.set(0.012, 0.035, 0.012);

  const side = new THREE.Group();
  side.position.set(-2.5, 0, -0.75);
  room.add(side);
  geo(side, new THREE.CylinderGeometry(0.28, 0.28, 0.05, 40), oak, 0, 0.62, 0);
  geo(side, new THREE.LatheGeometry([
    new THREE.Vector2(0.14, 0), new THREE.Vector2(0.05, 0.08), new THREE.Vector2(0.04, 0.3),
    new THREE.Vector2(0.06, 0.38), new THREE.Vector2(0.04, 0.5), new THREE.Vector2(0.06, 0.6),
  ], 20), dark, 0, 0, 0);
  const mug = new THREE.MeshPhongMaterial({ color: '#3a4f6a', specular: '#8aa0c0', shininess: 50 });
  geo(side, new THREE.CylinderGeometry(0.055, 0.05, 0.12, 24), mug, 0.08, 0.71, 0.03);
  geo(side, new THREE.TorusGeometry(0.03, 0.009, 8, 20), mug, 0.14, 0.71, 0.03).rotation.y = Math.PI / 2;
  geo(side, new THREE.CircleGeometry(0.048, 20), paint('#3a2414', 'plain'), 0.08, 0.765, 0.03).rotation.x = -Math.PI / 2;
  box(side, paint('#1f2a3a', 'leather'), [0.18, 0.04, 0.24], -0.08, 0.665, -0.05, 0.012).rotation.y = 0.4;

  // Bookshelf on the right wall.
  const shelf = new THREE.Group();
  shelf.position.set(W - 0.3, 0, 1.15);
  shelf.rotation.y = -Math.PI / 2;
  room.add(shelf);
  const shelfWood = paint('#3a2a18', 'wood');
  box(shelf, paint('#1a2433', 'plain'), [1.5, 2.05, 0.04], 0, 1.03, -0.16, 0);
  for (const x of [-0.75, 0.75]) box(shelf, shelfWood, [0.06, 2.1, 0.36], x, 1.05, 0);
  box(shelf, shelfWood, [1.62, 0.07, 0.4], 0, 2.12, 0.01, 0.02); // crown
  const spines = BOOK_SPINES.map(c => new THREE.MeshPhongMaterial({ color: c, specular: '#2a2018', shininess: 14 }));
  const bands = paint('#d4b87a', 'plain');
  for (let s = 0; s < 5; s++) {
    const y = 0.05 + s * 0.5;
    box(shelf, shelfWood, [1.5, 0.05, 0.36], 0, y, 0);
    if (s === 4) break;
    let x = -0.7;
    while (x < 0.66) {
      const w = 0.05 + random() * 0.05;
      const h = 0.3 + random() * 0.12;
      if (random() < 0.08) { x += 0.12; continue; }
      const b = box(shelf, spines[Math.floor(random() * spines.length)], [w, h, 0.24], x + w / 2, y + 0.025 + h / 2, 0.02, 0.008);
      if (random() < 0.5) {
        for (const t of [0.15, 0.82]) box(shelf, bands, [w + 0.002, 0.012, 0.004], x + w / 2, y + 0.025 + h * t, 0.141, 0);
      }
      if (random() < 0.1) b.rotation.z = -0.25;
      x += w + 0.006;
    }
  }
  // Potted fern on top.
  const pot = paint('#a8442e', 'stone');
  geo(shelf, new THREE.CylinderGeometry(0.09, 0.07, 0.14, 20), pot, 0.5, 2.23, 0);
  const leaf = paint('#5d8979', 'plain');
  for (let i = 0; i < 9; i++) {
    const f = geo(shelf, softBall, leaf, 0.5, 2.33, 0);
    f.scale.set(0.02, 0.012, 0.13);
    f.rotation.set(0.5 + random() * 0.4, (i / 9) * Math.PI * 2, 0);
    f.translateZ(0.08);
  }

  // Oil lamp on a small table under the right window.
  const tbl = new THREE.Group();
  tbl.position.set(W - 0.45, 0, -2.0);
  room.add(tbl);
  box(tbl, oak, [0.55, 0.05, 0.75], 0, 0.75, 0, 0.018);
  for (const x of [-0.22, 0.22]) for (const z of [-0.32, 0.32]) box(tbl, dark, [0.05, 0.75, 0.05], x, 0.37, z, 0.012);
  geo(tbl, new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.11, 0), new THREE.Vector2(0.115, 0.03), new THREE.Vector2(0.06, 0.06),
    new THREE.Vector2(0.09, 0.1), new THREE.Vector2(0.03, 0.13),
  ], 28), gold, 0, 0.775, 0);
  const lampGlass = new THREE.MeshBasicMaterial({ color: '#ffd993', transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false });
  geo(tbl, new THREE.LatheGeometry([
    new THREE.Vector2(0.035, 0), new THREE.Vector2(0.075, 0.06), new THREE.Vector2(0.06, 0.13), new THREE.Vector2(0.035, 0.2), new THREE.Vector2(0.038, 0.24),
  ], 24), lampGlass, 0, 0.905, 0);
  const lampFlame = geo(glow, flameGeometry, new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), W - 0.45, 0.93, -2.0);
  lampFlame.scale.set(0.03, 0.07, 0.03);
  lampFlame.userData.candle = true;
  geo(room, softBall, new THREE.MeshBasicMaterial({ color: '#ffd993', transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), W - 0.45, 0.98, -2.0).scale.setScalar(0.2);

  // Coat pegs by the door with hanging scarves.
  box(room, dark, [0.9, 0.08, 0.05], -1.3, 1.7, D - 0.12, 0.015);
  for (const x of [-1.6, -1.3, -1.0]) geo(room, new THREE.CylinderGeometry(0.015, 0.02, 0.1, 10), dark, x, 1.7, D - 0.18).rotation.x = Math.PI / 2;
  box(room, paint('#3a4f6a', 'cloth'), [0.13, 0.72, 0.035], -1.6, 1.34, D - 0.2, 0.015);
  box(room, paint('#c25a36', 'cloth'), [0.11, 0.52, 0.035], -1.0, 1.44, D - 0.2, 0.015);

  // Hanging lantern from the tie beam.
  const lantern = new THREE.Group();
  lantern.position.set(0, H - 0.05, -1.7);
  room.add(lantern);
  const chain = new THREE.TorusGeometry(0.018, 0.005, 6, 12);
  const ironDark = new THREE.MeshPhongMaterial({ color: '#2b2826', specular: '#555049', shininess: 40 });
  for (let i = 0; i < 9; i++) geo(lantern, chain, ironDark, 0, -0.03 - i * 0.045, 0).rotation.y = (i % 2) * Math.PI / 2;
  box(lantern, gold, [0.24, 0.04, 0.24], 0, -0.52, 0, 0.012);
  box(lantern, gold, [0.24, 0.04, 0.24], 0, -0.86, 0, 0.012);
  for (const x of [-0.11, 0.11]) for (const z of [-0.11, 0.11]) box(lantern, gold, [0.025, 0.34, 0.025], x, -0.69, z, 0.008);
  geo(lantern, new THREE.BoxGeometry(0.19, 0.3, 0.19), new THREE.MeshBasicMaterial({ color: '#ffc97a', transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false }), 0, -0.69, 0);
  const lanternFlame = geo(lantern, flameGeometry, new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0, -0.82, 0);
  lanternFlame.scale.set(0.05, 0.11, 0.05);
  geo(lantern, new THREE.ConeGeometry(0.18, 0.14, 4), gold, 0, -0.45, 0).rotation.y = Math.PI / 4;
  geo(lantern, softBall, new THREE.MeshBasicMaterial({ color: '#ffcf8a', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0, -0.69, 0).scale.setScalar(0.32);

  return lantern;
}

/** A small sleeping lamb by the fire — a nod to the app's companion pets. */
function buildLamb(room: THREE.Group, paint: Paint) {
  const lamb = new THREE.Group();
  lamb.position.set(1.15, 0, -1.85);
  lamb.rotation.y = -0.6;
  room.add(lamb);
  const wool = paint('#f3ead8', 'cloth');
  const woolShade = paint('#e2d6bf', 'cloth');
  const face = paint('#3a2e2a', 'plain');
  const body = new THREE.Group();
  lamb.add(body);
  const random = seedRandom(17);
  geo(body, softBall, wool, 0, 0.17, 0).scale.set(0.23, 0.15, 0.17);
  // Curly fleece: lots of small puffs over the body.
  for (let i = 0; i < 34; i++) {
    const a = random() * Math.PI * 2;
    const e = random() * 1.3 - 0.2;
    const x = Math.cos(a) * Math.cos(e) * 0.21;
    const z = Math.sin(a) * Math.cos(e) * 0.155;
    const y = 0.17 + Math.sin(e) * 0.13;
    if (y < 0.06) continue;
    geo(body, softBall, i % 3 ? wool : woolShade, x, y, z).scale.setScalar(0.045 + random() * 0.03);
  }
  // Tucked legs.
  for (const [x, z] of [[0.12, 0.13], [-0.1, 0.14]]) geo(body, softBall, face, x, 0.04, z).scale.set(0.06, 0.03, 0.03);
  const head = new THREE.Group();
  head.position.set(0.25, 0.14, 0.1);
  head.rotation.set(0, 0.5, -0.25);
  lamb.add(head);
  geo(head, softBall, face, 0.02, 0, 0).scale.set(0.085, 0.07, 0.065);
  geo(head, softBall, face, 0.08, -0.015, 0).scale.set(0.05, 0.045, 0.045);
  for (let i = 0; i < 5; i++) geo(head, softBall, wool, -0.03 + (i % 3) * 0.02, 0.055, -0.03 + i * 0.015).scale.setScalar(0.032);
  for (const s of [-1, 1]) {
    const ear = geo(head, softBall, face, -0.01, 0.01, s * 0.075);
    ear.scale.set(0.055, 0.016, 0.028);
    ear.rotation.y = s * 0.5;
  }
  // Closed eyes: tiny crescents.
  const lid = paint('#1a1412', 'plain');
  for (const s of [-1, 1]) geo(head, new THREE.TorusGeometry(0.012, 0.0025, 4, 10, Math.PI), lid, 0.065, 0.02, s * 0.035).rotation.set(Math.PI, s * 0.9, 0);
  return body;
}

function buildMotes() {
  const random = seedRandom(126);
  const n = 220;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = -W + 0.2 + random() * (W * 2 - 0.4);
    positions[i * 3 + 1] = 0.2 + random() * 3.2;
    positions[i * 3 + 2] = -D + 0.3 + random() * (D * 2 - 0.6);
  }
  const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const sprite = dataTexture(32, 32, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    return Math.max(0, 1 - r) ** 2;
  });
  sprite.wrapS = sprite.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.Points(g, new THREE.PointsMaterial({
    color: '#FCE3AF', size: 0.035, map: sprite, alphaMap: sprite, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

/** Soft additive shaft of dawn light from the left window to the floor, with a lit patch where it lands. */
function buildSunbeam(leftWin: Opening) {
  const g = new THREE.BufferGeometry();
  const top = [[-W, leftWin.y1, leftWin.a0], [-W, leftWin.y1, leftWin.a1], [-W, leftWin.y0, leftWin.a1], [-W, leftWin.y0, leftWin.a0]];
  const dx = 1.6;
  const floor = [[-W + dx + 1.1, 0.02, leftWin.a0 + 0.35], [-W + dx + 1.1, 0.02, leftWin.a1 + 0.35], [-W + dx, 0.02, leftWin.a1 + 0.35], [-W + dx, 0.02, leftWin.a0 + 0.35]];
  g.setAttribute('position', new THREE.Float32BufferAttribute([...top, ...floor].flat(), 3));
  g.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
  const mat = new THREE.MeshBasicMaterial({
    color: '#f5cba2', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const beam = new THREE.Mesh(g, mat);
  const patch = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, leftWin.a1 - leftWin.a0),
    new THREE.MeshBasicMaterial({ color: '#f5cba2', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(-W + dx + 0.55, 0.018, (leftWin.a0 + leftWin.a1) / 2 + 0.35);
  const group = new THREE.Group();
  group.add(beam, patch);
  return { group, beam: mat, patch: patch.material as THREE.MeshBasicMaterial };
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

  const textures = {
    wood: woodTexture(),
    end: endGrainTexture(),
    stone: stoneTexture(),
    cloth: clothTexture(),
  };

  // Lambert/Phong keep us off float colour buffers that some Expo GL devices lack (same as the chapel).
  const cache = new Map<string, THREE.Material>();
  const paint: Paint = (color, finish = 'plain') => {
    const key = `${finish}:${color}`;
    let m = cache.get(key);
    if (m) return m;
    switch (finish) {
      case 'wood':
        m = new THREE.MeshLambertMaterial({ color, map: textures.wood, bumpMap: textures.wood, bumpScale: 1.2 });
        break;
      case 'stone':
        m = new THREE.MeshLambertMaterial({ color, map: textures.stone, bumpMap: textures.stone, bumpScale: 2.2 });
        break;
      case 'cloth':
        m = new THREE.MeshLambertMaterial({ color, map: textures.cloth, bumpMap: textures.cloth, bumpScale: 0.8 });
        break;
      case 'leather':
        m = new THREE.MeshPhongMaterial({ color, specular: '#4a3428', shininess: 22, map: textures.stone, bumpMap: textures.cloth, bumpScale: 0.4 });
        break;
      default:
        m = new THREE.MeshLambertMaterial({ color });
    }
    cache.set(key, m);
    return m;
  };
  const logMats = (bark: string): LogMats => ({ bark: paint(bark, 'wood'), end: paint(`#${new THREE.Color(bark).lerp(new THREE.Color('#d8b080'), 0.45).getHexString()}`, 'plain') });
  // End caps get the ring texture rather than plain colour.
  const endCache = new Map<string, THREE.Material>();
  const logMatsWithRings = (bark: string): LogMats => {
    const base = logMats(bark);
    let end = endCache.get(bark);
    if (!end) {
      end = new THREE.MeshLambertMaterial({ color: (base.end as THREE.MeshLambertMaterial).color, map: textures.end, bumpMap: textures.end, bumpScale: 1 });
      endCache.set(bark, end);
    }
    return { bark: base.bark, end };
  };

  const { leftWin } = buildShell(room, paint, logMatsWithRings);
  const gold = buildHearth(room, paint, logMatsWithRings, glow);
  const lantern = buildFurnishings(room, paint, glow, gold);
  const lambBody = buildLamb(room, paint);
  const motes = buildMotes();
  const sun = buildSunbeam(leftWin);
  scene.add(motes, sun.group);

  // Lighting: dusky ambient, cool dawn through the windows, warm fire + lantern + lamp.
  scene.add(new THREE.HemisphereLight('#6d7fa8', '#3a2414', 0.85));
  const dawn = new THREE.DirectionalLight('#f5cba2', 1.6);
  dawn.position.set(-8, 5, 1);
  scene.add(dawn);
  const fire = new THREE.PointLight('#ff9a4a', 9, 9, 1.4);
  fire.position.set(0, 0.55, -D + 1.1);
  scene.add(fire);
  const fireFill = new THREE.PointLight('#ff7a30', 2.5, 4, 1.6);
  fireFill.position.set(0, 0.3, -D + 0.6);
  scene.add(fireFill);
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
      fireFill.intensity = 2.5 + flicker * 0.6;
      fire.position.x = Math.sin(seconds * 5.3) * 0.04;
      lanternLight.intensity = 5 + Math.sin(seconds * 3.1) * 0.25;
      for (const f of glow.children) {
        const phase = (f.userData.phase as number) ?? 0;
        if (f.userData.candle) {
          const s = 1 + Math.sin(seconds * 8 + phase) * 0.12;
          f.scale.y = f.scale.x * 2 * s;
          f.rotation.z = Math.sin(seconds * 3 + phase) * 0.06;
          continue;
        }
        const base = f.userData.base as number;
        const sy = base * (1 + 0.28 * Math.sin(seconds * 7 + phase) + 0.14 * Math.sin(seconds * 13 + phase * 2));
        f.scale.set(1 - 0.08 * Math.sin(seconds * 9 + phase), sy, 1);
        f.rotation.z = Math.sin(seconds * 2.3 + phase) * 0.12;
      }
      lantern.rotation.z = Math.sin(seconds * 0.7) * 0.025;
      lambBody.scale.y = 1 + Math.sin(seconds * 1.6) * 0.03;
      motes.rotation.y = Math.sin(seconds * 0.05) * 0.08;
      motes.position.y = Math.sin(seconds * 0.4) * 0.06;
      sun.beam.opacity = 0.065 + Math.sin(seconds * 0.5) * 0.012;
      sun.patch.opacity = 0.09 + Math.sin(seconds * 0.5) * 0.015;

      renderer.render(scene, camera);
    },
    dispose() {
      const materials = new Set<THREE.Material>();
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        geometries.add(object.geometry);
        const list: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
        for (const m of list) materials.add(m);
      });
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of Object.values(textures)) t.dispose();
      renderer.dispose();
    },
  };
}
