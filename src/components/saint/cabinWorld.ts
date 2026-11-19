import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// A cozy log-cabin prayer room in a chunky, toy-like "life-sim diorama" style:
// puffy rounded shapes, bright cheerful colours, soft toon shading, and a dollhouse
// overview where whichever walls face the camera fade away. Textures are generated in
// code (DataTextures), so nothing is downloaded and it runs in Expo GL.

type Mat = THREE.Material;
type Finish = 'wood' | 'stone' | 'cloth' | 'plain';
type Paint = (color: string, finish?: Finish) => THREE.Material;

export type CabinView = { x: number; y: number; z: number; yaw: number; pitch: number; fov: number; orbit?: boolean };

/** Preset spots. yaw 0 faces the hearth (-z); positive yaw turns left. `orbit` views circle the room when dragged. */
export const CABIN_VIEWS = {
  room: { x: 0, y: 6.2, z: 8.4, yaw: 0, pitch: -0.62, fov: 40, orbit: true },
  door: { x: 0, y: 1.55, z: 2.85, yaw: 0, pitch: -0.08, fov: 66 },
  kneeler: { x: 0, y: 1.0, z: -0.45, yaw: 0, pitch: 0.04, fov: 66 },
  chair: { x: -2.17, y: 1.15, z: 0.24, yaw: -0.9, pitch: -0.08, fov: 66 },
  shelf: { x: 0.9, y: 1.45, z: 1.1, yaw: -1.45, pitch: -0.04, fov: 66 },
} satisfies Record<string, CabinView>;
export type CabinViewName = keyof typeof CABIN_VIEWS;

const W = 3; // half-width (x)
const D = 3.5; // half-depth (z)
const H = 2.7; // eave height
const RIDGE = 4.15;
const LOG_R = 0.14;
const LOG_STEP = 0.26;

const BOOK_SPINES = ['#f08a7a', '#ffd38a', '#8cc8e8', '#9ad8c2', '#c3a6e8', '#f7b267', '#6fa8dc', '#e86f5c'];

function seedRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// ---------------------------------------------------------------- procedural textures

/** Tileable 2D value noise on a cell grid, sampled at (u, v) in [0, 1). */
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

/** Soft, clean grain running along v — just enough to read as wood, never gritty. */
function woodTexture() {
  const warp = valueNoise(5, 16, 11);
  return dataTexture(64, 256, (u, v) => 0.95 + Math.sin((u * 9 + warp(u, v) * 2.2) * Math.PI) * 0.035);
}

/** Cartoon end grain: a few bold rings and a darker bark rim. */
function endGrainTexture() {
  return dataTexture(128, 128, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    if (r > 0.86) return [0.78, 0.6, 0.45];
    const ring = Math.cos(r * 22) > 0.55 ? -0.07 : 0;
    return [1 + ring, 0.95 + ring, 0.85 + ring];
  });
}

function stoneTexture() {
  const big = valueNoise(4, 4, 31);
  return dataTexture(64, 64, (u, v) => 0.9 + big(u, v) * 0.1);
}

function clothTexture() {
  return dataTexture(64, 64, (u, v) => 0.96 + Math.sin(u * Math.PI * 16) * Math.sin(v * Math.PI * 16) * 0.04);
}

/** Toon ramp: a soft 4-step light ramp with a high floor, so shadows stay bright and friendly. */
function toonRamp() {
  const steps = [0.62, 0.78, 0.92, 1.0];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((s, i) => data.set([s * 255, s * 255, s * 255, 255], i * 4));
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- geometry

const roundedCache = new Map<string, THREE.BufferGeometry>();
/** Chunky rounded box. Default bevel is generous so everything feels soft and toy-like. */
function roundedBox(w: number, h: number, d: number, round?: number) {
  const r = round ?? Math.min(0.07, Math.min(w, h, d) * 0.34);
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${r.toFixed(3)}`;
  let g = roundedCache.get(key);
  if (!g) {
    g = r < 0.004 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 4, r);
    roundedCache.set(key, g);
  }
  return g;
}

/** A round, clean log: unit length along Y, radius 1, with softly rounded ends. */
function makeLogGeometry() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 24, 1);
  return g;
}

const logGeometry = makeLogGeometry();
const softBall = new THREE.IcosahedronGeometry(1, 3);

/** Teardrop flame profile, base at y=0, tip at y=1. */
const flameGeometry = new THREE.LatheGeometry(
  Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    return new THREE.Vector2(Math.sin(Math.PI * Math.pow(t, 0.6)) * (1 - t * 0.5) * 0.5, t);
  }),
  16,
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

function blob(parent: THREE.Object3D, mat: Mat, sx: number, sy: number, sz: number, x: number, y: number, z: number) {
  const m = geo(parent, softBall, mat, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

type LogMats = { bark: Mat; end: Mat };

/** A horizontal log from a to b along the wall's run axis, with puffy rounded ends. */
function log(parent: THREE.Object3D, mats: LogMats, axis: 'x' | 'z', a: number, b: number, fixed: number, y: number, r = LOG_R) {
  if (b - a < 0.08) return;
  const m = new THREE.Mesh(logGeometry, [mats.bark, mats.end, mats.end]);
  m.scale.set(r, b - a - r * 0.5, r);
  const mid = (a + b) / 2;
  if (axis === 'x') {
    m.rotation.z = Math.PI / 2;
    m.position.set(mid, y, fixed);
  } else {
    m.rotation.x = Math.PI / 2;
    m.position.set(fixed, y, mid);
  }
  parent.add(m);
  // Rounded caps: flattened spheres so log ends look soft, like a toy.
  for (const end of [a + r * 0.25, b - r * 0.25]) {
    const cap = geo(parent, softBall, mats.end, axis === 'x' ? end : fixed, y, axis === 'x' ? fixed : end);
    if (axis === 'x') cap.scale.set(r * 0.28, r * 0.98, r * 0.98);
    else cap.scale.set(r * 0.98, r * 0.98, r * 0.28);
  }
}

type Opening = { a0: number; a1: number; y0: number; y1: number };

/** A stacked-log wall with gaps for windows and doors, optionally rising into a gable. */
function logWall(parent: THREE.Object3D, logs: LogMats[], chink: Mat, axis: 'x' | 'z', fixed: number, half: number, openings: Opening[], gable: boolean) {
  const inward = -Math.sign(fixed);
  const top = gable ? RIDGE : H;
  // Creamy chinking behind the logs.
  if (axis === 'x') box(parent, chink, [half * 2, top, 0.04], 0, top / 2, fixed - inward * 0.07, 0);
  else box(parent, chink, [0.04, H, half * 2], fixed - inward * 0.07, H / 2, 0, 0);
  const random = seedRandom(Math.round(fixed * 100) + 7);
  let row = 0;
  for (let y = LOG_R; y < top; y += LOG_STEP, row++) {
    const span = y <= H ? half + 0.2 : half * (RIDGE - y) / (RIDGE - H);
    if (span < 0.1) break;
    const cuts = openings
      .filter(o => y + LOG_R * 0.6 > o.y0 && y - LOG_R * 0.6 < o.y1)
      .sort((p, q) => p.a0 - q.a0);
    let from = -span;
    const mats = logs[(row + Math.floor(random() * 2)) % logs.length];
    for (const cut of cuts) {
      log(parent, mats, axis, from, cut.a0, fixed, y);
      from = cut.a1;
    }
    log(parent, mats, axis, from, span, fixed, y);
  }
}

/** Vertex-coloured gradient plane — the bright morning sky through the glass. */
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

const MORNING: [number, string][] = [[0, '#e4f5ff'], [0.45, '#b4e2fb'], [1, '#7cc6f2']];

/** A window: morning sky, puffy clouds, rolling hills and round trees, a cream frame and a flower box. */
function cabinWindow(parent: THREE.Object3D, frame: Mat, paint: Paint, w: number, h: number) {
  const win = new THREE.Group();
  parent.add(win);
  const flat = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  geo(win, skyPlane(w + 0.1, h + 0.1, MORNING), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), 0, h / 2, -0.14);

  const random = seedRandom(Math.round(w * 97 + h * 31));
  const circle = new THREE.CircleGeometry(1, 32);
  const cloud = flat('#ffffff');
  for (let c = 0; c < 2; c++) {
    const cx = -w * 0.25 + c * w * 0.45 + random() * 0.1;
    const cy = h * (0.72 + random() * 0.12);
    for (const [dx, dy, r] of [[-0.09, 0, 0.06], [0, 0.03, 0.085], [0.1, 0, 0.065], [0.03, -0.02, 0.07]]) {
      geo(win, circle, cloud, cx + dx, cy + dy, -0.138).scale.setScalar(r);
    }
  }
  // Rolling hills: two soft bands.
  for (const [base, amp, color, zOff] of [[0.3, 0.06, '#9fdc8c', 0], [0.16, 0.05, '#6cc46e', 0.002]] as const) {
    const hills = new THREE.Shape();
    hills.moveTo(-w / 2 - 0.05, -0.05);
    for (let i = 0; i <= 24; i++) {
      const x = -w / 2 - 0.05 + (i / 24) * (w + 0.1);
      hills.lineTo(x, h * (base + amp * Math.sin(i * 0.55 + base * 10)));
    }
    hills.lineTo(w / 2 + 0.05, -0.05);
    hills.closePath();
    geo(win, new THREE.ShapeGeometry(hills, 24), flat(color), 0, 0, -0.134 + zOff);
  }
  // Round, lollipop-ish trees.
  const leaves = [flat('#4fae5c'), flat('#5cbd68')];
  const trunk = flat('#9a6a44');
  for (let i = 0; i < 4; i++) {
    const tx = -w / 2 + (i + 0.5 + (random() - 0.5) * 0.4) * (w / 4);
    const th = h * (0.22 + random() * 0.1);
    box(win, trunk, [0.025, th * 0.6, 0.001], tx, h * 0.18 + th * 0.3, -0.129, 0);
    geo(win, circle, leaves[i % 2], tx, h * 0.18 + th * 0.75, -0.128).scale.set(th * 0.36, th * 0.42, 1);
  }

  const t = 0.09;
  box(win, frame, [w + t * 2, t, 0.22], 0, h + t / 2, 0);
  box(win, frame, [w + t * 2, t, 0.22], 0, -t / 2, 0);
  box(win, frame, [t, h, 0.22], -w / 2 - t / 2, h / 2, 0);
  box(win, frame, [t, h, 0.22], w / 2 + t / 2, h / 2, 0);
  box(win, frame, [0.05, h, 0.06], 0, h / 2, -0.07);
  box(win, frame, [w, 0.05, 0.06], 0, h * 0.55, -0.07);
  box(win, frame, [w + 0.34, 0.08, 0.28], 0, -0.1, 0.08);
  // Flower box on the sill.
  box(win, paint('#f08a7a', 'wood'), [w * 0.8, 0.13, 0.16], 0, -0.01, 0.16);
  const petals = ['#ffd38a', '#ffffff', '#f7a8c4', '#c3a6e8'].map(c => paint(c));
  const leaf = paint('#6cc46e');
  for (let i = 0; i < Math.round(w * 6); i++) {
    const fx = -w * 0.36 + (i / Math.max(1, Math.round(w * 6) - 1)) * w * 0.72;
    blob(win, leaf, 0.045, 0.035, 0.04, fx, 0.08, 0.16);
    blob(win, petals[i % petals.length], 0.035, 0.03, 0.035, fx + 0.01, 0.13 + (i % 2) * 0.03, 0.17);
  }
  const glass = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, depthWrite: false });
  geo(win, new THREE.PlaneGeometry(w, h), glass, 0, h / 2, -0.06);
  // A cartoon glint on the glass.
  const glint = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false });
  for (const [gx, gy, s] of [[-0.25, 0.7, 1], [-0.17, 0.62, 0.55]]) {
    const g = box(win, glint, [0.04 * s, 0.22 * s, 0.001], w * gx, h * gy, -0.055, 0);
    g.rotation.z = -0.6;
  }
  return win;
}

export type CabinParts = {
  walls: { group: THREE.Group; hide: (c: THREE.Vector3) => boolean }[];
  ceiling: THREE.Group;
};

function buildShell(room: THREE.Group, paint: Paint, logMats: (bark: string) => LogMats): CabinParts & { leftWin: Opening } {
  const logs = [logMats('#d4914f'), logMats('#c78545'), logMats('#dc9c5c')];
  const chink = paint('#ecd3a6', 'cloth');
  const frame = paint('#fbf3e4', 'plain');

  // Chunky diorama base under the floor (visible in the dollhouse view).
  box(room, paint('#a8703f', 'wood'), [W * 2 + 0.5, 0.3, D * 2 + 0.5], 0, -0.2, 0, 0.1);
  // Plank floor.
  const planks = [paint('#c48a52', 'wood'), paint('#b97e48', 'wood'), paint('#cf9660', 'wood')];
  const random = seedRandom(23);
  for (let i = 0, x = -W; x < W; i++, x += 0.4) {
    const split = -D + 1 + random() * (D * 2 - 2);
    box(room, planks[i % 3], [0.39, 0.08, split + D - 0.015], x + 0.2, -0.03, (-D + split) / 2, 0.025);
    box(room, planks[(i + 1) % 3], [0.39, 0.08, D - split - 0.015], x + 0.2, -0.03, (split + D) / 2, 0.025);
  }

  const leftWin = { a0: -0.75, a1: 0.95, y0: 0.95, y1: 2.15 };
  const rightWin = { a0: -2.45, a1: -1.55, y0: 1.2, y1: 2.0 };
  const door = { a0: -0.55, a1: 0.55, y0: -1, y1: 2.15 };
  const frontWin = { a0: 1.35, a1: 2.3, y0: 1.15, y1: 1.95 };

  const wall = () => {
    const g = new THREE.Group();
    room.add(g);
    return g;
  };
  const back = wall();
  const front = wall();
  const left = wall();
  const right = wall();
  logWall(back, logs, chink, 'x', -D, W, [], true);
  logWall(front, logs, chink, 'x', D, W, [door, frontWin], true);
  logWall(left, logs, chink, 'z', -W, D, [leftWin], false);
  logWall(right, logs, chink, 'z', W, D, [rightWin], false);

  // Corner posts.
  const post = logMats('#b97a3e');
  for (const x of [-W, W]) for (const z of [-D, D]) {
    const p = new THREE.Mesh(logGeometry, [post.bark, post.end, post.end]);
    p.scale.set(0.19, H, 0.19);
    p.position.set(x * 0.985, H / 2, z * 0.985);
    (z > 0 ? front : back).add(p);
  }

  const lw = cabinWindow(left, frame, paint, leftWin.a1 - leftWin.a0, leftWin.y1 - leftWin.y0);
  lw.position.set(-W + 0.02, leftWin.y0, (leftWin.a0 + leftWin.a1) / 2);
  lw.rotation.y = Math.PI / 2;
  const rw = cabinWindow(right, frame, paint, rightWin.a1 - rightWin.a0, rightWin.y1 - rightWin.y0);
  rw.position.set(W - 0.02, rightWin.y0, (rightWin.a0 + rightWin.a1) / 2);
  rw.rotation.y = -Math.PI / 2;
  const fw = cabinWindow(front, frame, paint, frontWin.a1 - frontWin.a0, frontWin.y1 - frontWin.y0);
  fw.position.set((frontWin.a0 + frontWin.a1) / 2, frontWin.y0, D - 0.02);
  fw.rotation.y = Math.PI;

  // A round-topped storybook door.
  const doorWood = paint('#b0703c', 'wood');
  const doorShape = new THREE.Shape();
  doorShape.moveTo(-0.5, 0);
  doorShape.lineTo(0.5, 0);
  doorShape.lineTo(0.5, 1.6);
  doorShape.absarc(0, 1.6, 0.5, 0, Math.PI, false);
  doorShape.closePath();
  const doorGeo = new THREE.ExtrudeGeometry(doorShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 24 });
  const doorMesh = geo(front, doorGeo, doorWood, 0, 0, D - 0.02);
  doorMesh.rotation.y = Math.PI;
  for (const x of [-0.25, 0, 0.25]) box(front, paint('#a0663a', 'wood'), [0.03, 1.8, 0.02], x, 0.95, D - 0.14, 0.01);
  const brass = new THREE.MeshPhongMaterial({ color: '#f2c86b', emissive: '#7a5a20', emissiveIntensity: 0.25, specular: '#fff6d8', shininess: 80 });
  blob(front, brass, 0.055, 0.055, 0.04, 0.32, 1.0, D - 0.16);
  // A little round porthole in the door.
  geo(front, new THREE.TorusGeometry(0.14, 0.03, 12, 32), frame, 0, 1.6, D - 0.14);
  geo(front, new THREE.CircleGeometry(0.13, 32), new THREE.MeshBasicMaterial({ color: '#b4e2fb', toneMapped: false }), 0, 1.6, D - 0.135).rotation.y = Math.PI;
  // Welcome mat.
  box(room, paint('#9ad8c2', 'cloth'), [1.0, 0.03, 0.5], 0, 0.02, D - 0.45, 0.012);

  // Ceiling: roof underside, rafters, ridge, tie beams (all hidden in the dollhouse view).
  const ceiling = new THREE.Group();
  room.add(ceiling);
  const slope = Math.atan2(RIDGE - H, W);
  const run = Math.hypot(RIDGE - H, W) + 0.25;
  const boards = [paint('#e3b07a', 'wood'), paint('#d9a46c', 'wood')];
  const rafter = paint('#a0663a', 'wood');
  for (const side of [-1, 1]) {
    const roof = new THREE.Group();
    roof.position.set(side * W / 2, (H + RIDGE) / 2 + 0.12, 0);
    roof.rotation.z = -side * slope;
    ceiling.add(roof);
    const n = 10;
    for (let i = 0; i < n; i++) box(roof, boards[i % 2], [run / n - 0.008, 0.07, D * 2 + 0.4], -run / 2 + (i + 0.5) * run / n, 0.05, 0, 0.02);
    for (let z = -D + 0.5; z <= D - 0.4; z += 1.0) box(roof, rafter, [run, 0.18, 0.16], 0, -0.07, z, 0.05);
  }
  box(ceiling, rafter, [0.26, 0.26, D * 2], 0, RIDGE + 0.02, 0, 0.08);
  const tie = logMats('#a8703f');
  for (const z of [-1.7, 1.2]) log(ceiling, tie, 'x', -W, W, z, H + 0.05, 0.13);

  return {
    leftWin,
    ceiling,
    walls: [
      { group: back, hide: c => c.z < -D + 0.05 },
      { group: front, hide: c => c.z > D - 0.05 },
      { group: left, hide: c => c.x < -W + 0.05 },
      { group: right, hide: c => c.x > W - 0.05 },
    ],
  };
}

function buildHearth(room: THREE.Group, paint: Paint, logMats: (bark: string) => LogMats, glow: THREE.Group) {
  const stones = [paint('#c9c1b8', 'stone'), paint('#b5ada6', 'stone'), paint('#d6cabb', 'stone'), paint('#a9a19b', 'stone'), paint('#cdb9a2', 'stone')];
  const mortar = paint('#8a7f78', 'stone');
  const soot = new THREE.MeshBasicMaterial({ color: '#3a2620' });
  const z0 = -D + 0.02;
  const depth = 0.75;
  const face = z0 + depth;
  const random = seedRandom(5);

  // Firebox cavity, pillars, and a chimney stack above the mantle.
  box(room, soot, [1.1, 1.0, 0.1], 0, 0.5, z0 + 0.12, 0);
  box(room, soot, [1.1, 0.1, depth], 0, 1.0, z0 + depth / 2, 0);
  for (const side of [-1, 1]) box(room, mortar, [0.5, 1.05, depth], side * 0.8, 0.52, z0 + depth / 2, 0);
  box(room, mortar, [1.7, RIDGE - 1.1, depth - 0.12], 0, 1.1 + (RIDGE - 1.1) / 2, z0 + (depth - 0.12) / 2, 0);

  // Puffy pebble stones.
  const pebble = (x: number, y: number, z: number, w: number, h: number) =>
    blob(room, stones[Math.floor(random() * stones.length)], w / 2, h / 2, 0.07, x, y, z).rotation.z = (random() - 0.5) * 0.3;
  for (const side of [-1, 1]) {
    for (let y = 0.1; y < 1.0; y += 0.19) {
      pebble(side * (0.67 + random() * 0.03), y, face, 0.24, 0.19);
      pebble(side * (0.91 + random() * 0.03), y + 0.07, face, 0.23, 0.18);
      pebble(side * 1.05, y + 0.03, face - 0.25, 0.12, 0.18);
    }
  }
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.12 + (i / 6) * 0.76);
    pebble(Math.cos(a) * 0.62, 0.62 + Math.sin(a) * 0.36, face + 0.01, 0.2, 0.16);
  }
  for (let y = 1.32, row = 0; y < RIDGE - 0.1; y += 0.22, row++) {
    for (let x = -0.72 + (row % 2) * 0.13; x < 0.75; x += 0.27 + random() * 0.05) {
      pebble(x + 0.1, y, face - 0.12, 0.26 + random() * 0.06, 0.2 + random() * 0.04);
    }
  }

  // Hearth slab and a chunky mantle.
  box(room, stones[1], [2.3, 0.1, 0.7], 0, 0.05, face + 0.3, 0.05);
  const mantle = paint('#a0663a', 'wood');
  box(room, mantle, [2.3, 0.2, 0.42], 0, 1.12, face + 0.06, 0.08);
  for (const x of [-0.95, 0.95]) box(room, mantle, [0.14, 0.22, 0.3], x, 0.93, face + 0.02, 0.06);

  // Fire: chunky logs, glowing embers, bright cartoon flames.
  const firewood = logMats('#8a5a34');
  for (const [x, rot, lift] of [[-0.12, 0.35, 0], [0.14, -0.4, 0], [0, 0, 0.1]] as const) {
    const l = new THREE.Mesh(logGeometry, [firewood.bark, firewood.end, firewood.end]);
    l.scale.set(0.08, 0.66, 0.08);
    l.rotation.set(Math.PI / 2, 0, Math.PI / 2 + rot);
    l.position.set(x, 0.11 + lift, z0 + 0.42);
    room.add(l);
  }
  const ember = new THREE.MeshBasicMaterial({ color: '#ff8a3d', toneMapped: false });
  box(room, ember, [0.7, 0.04, 0.35], 0, 0.04, z0 + 0.42, 0.015);
  const glowFloor = new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pool = geo(room, new THREE.CircleGeometry(1, 40), glowFloor, 0, 0.11, face + 0.35);
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(1.3, 0.75, 1);

  const flameLayers = [
    { color: '#ff8a3d', scale: 1.0 },
    { color: '#ffc24d', scale: 0.68 },
    { color: '#fff3b0', scale: 0.38 },
  ];
  for (let i = 0; i < 5; i++) {
    const tongue = new THREE.Group();
    tongue.position.set(-0.22 + i * 0.11, 0.14, z0 + 0.42 + (i % 2) * 0.05);
    tongue.userData.base = i === 2 ? 1.3 : 0.75 + random() * 0.4;
    tongue.userData.phase = random() * 10;
    glow.add(tongue);
    layerFlame(tongue, flameLayers, 0.2, 0.46);
  }

  // Mantle: chunky candles with drips, a framed cross, a little potted succulent.
  const wax = paint('#fff6e6');
  const candleGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 20);
  for (const x of [-0.85, -0.68, 0.78]) {
    const h = x === -0.68 ? 0.15 : 0.24;
    geo(room, candleGeo, wax, x, 1.22 + h / 2, face + 0.08).scale.y = h;
    blob(room, wax, 0.047, 0.02, 0.047, x, 1.22 + h, face + 0.08);
    const flame = new THREE.Group();
    flame.position.set(x, 1.235 + h, face + 0.08);
    flame.userData.candle = true;
    flame.userData.phase = x * 7;
    glow.add(flame);
    layerFlame(flame, flameLayers.slice(1), 0.05, 0.1);
  }
  const crossWood = paint('#a8703f', 'wood');
  box(room, crossWood, [0.12, 0.85, 0.09], 0, 2.25, face - 0.01, 0.04);
  box(room, crossWood, [0.52, 0.12, 0.09], 0, 2.42, face, 0.04);
  const gold = new THREE.MeshPhongMaterial({ color: '#f2c86b', emissive: '#7a5a20', emissiveIntensity: 0.3, specular: '#fff6d8', shininess: 80 });
  geo(room, new THREE.TorusGeometry(0.33, 0.03, 14, 64), gold, 0, 2.42, face - 0.04);
  const pot = paint('#8cc8e8');
  geo(room, new THREE.CylinderGeometry(0.08, 0.06, 0.12, 20), pot, 0.5, 1.28, face + 0.08);
  const succ = paint('#8fd3a0');
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    blob(room, succ, 0.03, 0.05, 0.03, 0.5 + Math.cos(a) * 0.035, 1.37, face + 0.08 + Math.sin(a) * 0.035).rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
  }

  // A woven basket of firewood.
  const basket = paint('#e3b07a', 'cloth');
  geo(room, new THREE.CylinderGeometry(0.27, 0.23, 0.3, 28), basket, -1.45, 0.15, face + 0.25);
  geo(room, new THREE.TorusGeometry(0.27, 0.035, 10, 36), paint('#c98d55', 'wood'), -1.45, 0.3, face + 0.25).rotation.x = Math.PI / 2;
  const split = [logMats('#8a5a34'), logMats('#b0703c')];
  for (let i = 0; i < 5; i++) {
    const m = split[i % 2];
    const l = new THREE.Mesh(logGeometry, [m.bark, m.end, m.end]);
    l.scale.set(0.06, 0.48, 0.06);
    l.rotation.set(Math.PI / 2, 0, 0.3 + i * 0.25);
    l.position.set(-1.45 + (i - 2) * 0.08, 0.34 + (i % 2) * 0.06, face + 0.25);
    room.add(l);
  }
  return gold;
}

function layerFlame(parent: THREE.Object3D, layers: { color: string; scale: number }[], w: number, h: number) {
  for (const layer of layers) {
    const m = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: 0.92, depthWrite: false, toneMapped: false });
    const f = geo(parent, flameGeometry, m, 0, 0, 0);
    f.scale.set(w * layer.scale, h * layer.scale, w * layer.scale);
    f.renderOrder = 2 + layers.indexOf(layer);
  }
}

function buildFurnishings(room: THREE.Group, paint: Paint, glow: THREE.Group, gold: Mat) {
  const random = seedRandom(99);

  // Round rag rug in sunny pastel rings.
  const rugColors = ['#f08a7a', '#fbe7c6', '#8fd3b6', '#f7b267', '#fbe7c6', '#8cc8e8', '#f7a8c4', '#fbe7c6'];
  rugColors.forEach((c, i) => {
    const r = 1 - i * 0.115;
    const m = geo(room, new THREE.CylinderGeometry(r, r, 0.02, 64), paint(c, 'cloth'), 0, 0.02 + i * 0.002, -0.9);
    m.scale.set(1.5, 1, 1.05);
  });
  const rugEdge = geo(room, new THREE.TorusGeometry(1, 0.025, 10, 96), paint('#e86f5c', 'cloth'), 0, 0.025, -0.9);
  rugEdge.rotation.x = Math.PI / 2;
  rugEdge.scale.set(1.5, 1.05, 1);

  // Prayer kneeler with an open Bible.
  const oak = paint('#c48a52', 'wood');
  const dark = paint('#a0663a', 'wood');
  const k = new THREE.Group();
  k.position.set(0, 0, -1.25);
  room.add(k);
  box(k, dark, [1.0, 0.12, 0.34], 0, 0.15, 0.32);
  box(k, paint('#e86f5c', 'cloth'), [0.94, 0.1, 0.3], 0, 0.25, 0.32, 0.05);
  for (const x of [-0.44, 0.44]) {
    box(k, oak, [0.1, 0.9, 0.1], x, 0.45, -0.05);
    box(k, oak, [0.1, 0.1, 0.52], x, 0.06, 0.15);
  }
  const desk = new THREE.Group();
  desk.position.set(0, 0.92, -0.05);
  desk.rotation.x = 0.38;
  k.add(desk);
  box(desk, oak, [1.0, 0.07, 0.38], 0, 0, 0);
  const page = paint('#fffaf0');
  const cover = paint('#c25a46');
  box(desk, cover, [0.52, 0.03, 0.32], 0, 0.045, 0, 0.012);
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(0.24, 0.28, 12, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 0.12;
      p.setZ(i, Math.sin((x / 0.24) * Math.PI * 0.85) * 0.035 + x * 0.05);
      p.setX(i, side * x);
    }
    g.computeVertexNormals();
    const leafMat = paint('#fffaf0');
    leafMat.side = THREE.DoubleSide;
    const leaf = geo(desk, g, leafMat, 0, 0.065, 0);
    leaf.rotation.x = -Math.PI / 2;
    box(desk, page, [0.22, 0.03, 0.27], side * 0.12, 0.055, 0, 0.01);
  }
  box(desk, paint('#f7a8c4', 'cloth'), [0.02, 0.006, 0.26], 0.015, 0.1, 0.14, 0);

  // Big puffy armchair under the window, with a mint throw.
  const chair = new THREE.Group();
  chair.position.set(-2.25, 0, 0.3);
  chair.rotation.y = 2.25;
  room.add(chair);
  const plush = paint('#e86f5c', 'cloth');
  const cushion = paint('#ffd38a', 'cloth');
  box(chair, plush, [0.95, 0.4, 0.86], 0, 0.32, 0, 0.16);
  box(chair, cushion, [0.66, 0.18, 0.66], 0, 0.58, 0.06, 0.08);
  box(chair, plush, [0.95, 0.9, 0.24], 0, 0.8, -0.34, 0.11).rotation.x = -0.12;
  for (const x of [-0.41, 0.41]) blob(chair, plush, 0.13, 0.15, 0.44, x, 0.66, 0.0);
  for (const x of [-0.33, 0.33]) for (const z of [-0.3, 0.3]) blob(chair, dark, 0.045, 0.06, 0.045, x, 0.06, z);
  const throwMat = paint('#9ad8c2', 'cloth');
  throwMat.side = THREE.DoubleSide;
  {
    const g = new THREE.PlaneGeometry(0.55, 1.1, 8, 24);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i);
      const v = p.getY(i) + 0.55;
      const fold = Math.sin(u * 18 + v * 3) * 0.015;
      const a = Math.min(Math.PI, (v / 1.1) * Math.PI);
      p.setXYZ(i, u, 0.48 + Math.sin(a) * 0.36, Math.cos(a) * 0.17 + fold);
    }
    g.computeVertexNormals();
    geo(chair, g, throwMat, 0.43, 0.0, -0.02).rotation.y = Math.PI / 2;
  }
  const pompom = paint('#fffaf0', 'cloth');
  for (let i = 0; i < 7; i++) blob(chair, pompom, 0.025, 0.025, 0.025, 0.6, 0.47, -0.27 + i * 0.08);

  const side = new THREE.Group();
  side.position.set(-2.5, 0, -0.75);
  room.add(side);
  geo(side, new THREE.CylinderGeometry(0.3, 0.3, 0.07, 40), oak, 0, 0.62, 0);
  geo(side, new THREE.LatheGeometry([
    new THREE.Vector2(0.16, 0), new THREE.Vector2(0.07, 0.08), new THREE.Vector2(0.055, 0.3),
    new THREE.Vector2(0.08, 0.4), new THREE.Vector2(0.055, 0.5), new THREE.Vector2(0.08, 0.6),
  ], 24), dark, 0, 0, 0);
  const mug = paint('#8cc8e8');
  geo(side, new THREE.CylinderGeometry(0.07, 0.065, 0.14, 24), mug, 0.08, 0.72, 0.03);
  geo(side, new THREE.TorusGeometry(0.04, 0.014, 10, 20), mug, 0.16, 0.72, 0.03).rotation.y = Math.PI / 2;
  geo(side, new THREE.CircleGeometry(0.06, 20), paint('#8a5a34'), 0.08, 0.792, 0.03).rotation.x = -Math.PI / 2;
  // Steam puffs.
  const steam = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  const steamGroup = new THREE.Group();
  steamGroup.position.set(-2.42, 0.85, -0.72);
  room.add(steamGroup);
  for (let i = 0; i < 3; i++) {
    const s = geo(steamGroup, softBall, steam.clone(), 0, i * 0.07, 0);
    s.scale.setScalar(0.025 + i * 0.008);
    s.userData.phase = i * 1.3;
  }
  box(side, paint('#c3a6e8'), [0.2, 0.05, 0.26], -0.08, 0.68, -0.05, 0.02).rotation.y = 0.4;

  // Bookshelf on the right wall.
  const shelf = new THREE.Group();
  shelf.position.set(W - 0.32, 0, 1.15);
  shelf.rotation.y = -Math.PI / 2;
  room.add(shelf);
  const shelfWood = paint('#b0703c', 'wood');
  box(shelf, paint('#f4e2c4', 'cloth'), [1.5, 2.05, 0.04], 0, 1.03, -0.16, 0);
  for (const x of [-0.76, 0.76]) box(shelf, shelfWood, [0.09, 2.15, 0.38], x, 1.07, 0, 0.04);
  box(shelf, shelfWood, [1.66, 0.1, 0.42], 0, 2.15, 0.01, 0.04);
  const spines = BOOK_SPINES.map(c => paint(c));
  const bands = paint('#fffaf0');
  for (let s = 0; s < 5; s++) {
    const y = 0.05 + s * 0.5;
    box(shelf, shelfWood, [1.5, 0.07, 0.36], 0, y, 0, 0.03);
    if (s === 4) break;
    let x = -0.7;
    while (x < 0.62) {
      const w = 0.08 + random() * 0.05;
      const h = 0.28 + random() * 0.1;
      if (random() < 0.1) {
        // A cute knick-knack instead of a book.
        blob(shelf, spines[Math.floor(random() * spines.length)], 0.06, 0.06, 0.06, x + 0.07, y + 0.1, 0.03);
        x += 0.16;
        continue;
      }
      const b = box(shelf, spines[Math.floor(random() * spines.length)], [w, h, 0.24], x + w / 2, y + 0.035 + h / 2, 0.02, 0.022);
      if (random() < 0.5) box(shelf, bands, [w * 0.7, 0.025, 0.004], x + w / 2, y + 0.035 + h * 0.75, 0.142, 0);
      if (random() < 0.1) b.rotation.z = -0.22;
      x += w + 0.01;
    }
  }
  // Round potted plant on top.
  geo(shelf, new THREE.CylinderGeometry(0.11, 0.08, 0.16, 20), paint('#f08a7a'), 0.5, 2.28, 0);
  const bush = paint('#6cc46e');
  for (const [dx, dy, s] of [[0, 0.12, 0.13], [-0.08, 0.07, 0.09], [0.08, 0.08, 0.09]]) blob(shelf, bush, s, s, s, 0.5 + dx, 2.32 + dy, 0);

  // Oil lamp on a small table under the right window.
  const tbl = new THREE.Group();
  tbl.position.set(W - 0.5, 0, -2.0);
  room.add(tbl);
  box(tbl, oak, [0.58, 0.07, 0.78], 0, 0.75, 0, 0.03);
  for (const x of [-0.22, 0.22]) for (const z of [-0.32, 0.32]) box(tbl, dark, [0.07, 0.75, 0.07], x, 0.37, z, 0.03);
  geo(tbl, new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.12, 0), new THREE.Vector2(0.13, 0.04), new THREE.Vector2(0.07, 0.07),
    new THREE.Vector2(0.1, 0.11), new THREE.Vector2(0.035, 0.14),
  ], 28), gold, 0, 0.785, 0);
  const lampGlass = new THREE.MeshBasicMaterial({ color: '#fff0c0', transparent: true, opacity: 0.45, toneMapped: false, depthWrite: false });
  geo(tbl, new THREE.LatheGeometry([
    new THREE.Vector2(0.04, 0), new THREE.Vector2(0.085, 0.07), new THREE.Vector2(0.07, 0.15), new THREE.Vector2(0.04, 0.22), new THREE.Vector2(0.045, 0.26),
  ], 24), lampGlass, 0, 0.92, 0);
  const lampFlame = new THREE.Group();
  lampFlame.position.set(W - 0.5, 0.95, -2.0);
  lampFlame.userData.candle = true;
  glow.add(lampFlame);
  layerFlame(lampFlame, [{ color: '#ffc24d', scale: 1 }, { color: '#fff3b0', scale: 0.55 }], 0.045, 0.1);

  // Coat pegs by the door with a scarf and a sun hat.
  box(room, dark, [0.9, 0.1, 0.06], -1.3, 1.72, D - 0.13, 0.03);
  for (const x of [-1.6, -1.3, -1.0]) blob(room, paint('#f2c86b'), 0.03, 0.03, 0.05, x, 1.72, D - 0.2);
  box(room, paint('#8cc8e8', 'cloth'), [0.14, 0.72, 0.04], -1.6, 1.36, D - 0.21, 0.02);
  const hat = new THREE.Group();
  hat.position.set(-1.0, 1.55, D - 0.24);
  hat.rotation.x = Math.PI / 2 - 0.25;
  room.add(hat);
  geo(hat, new THREE.CylinderGeometry(0.22, 0.22, 0.02, 32), paint('#ffd38a', 'cloth'), 0, 0, 0);
  blob(hat, paint('#ffd38a', 'cloth'), 0.11, 0.08, 0.11, 0, 0.04, 0);
  geo(hat, new THREE.TorusGeometry(0.11, 0.018, 8, 28), paint('#f08a7a', 'cloth'), 0, 0.025, 0).rotation.x = Math.PI / 2;

  // Hanging lantern (lives with the ceiling so it hides in the dollhouse view).
  const lantern = new THREE.Group();
  lantern.position.set(0, H - 0.05, -1.7);
  const chain = new THREE.TorusGeometry(0.022, 0.007, 8, 14);
  for (let i = 0; i < 8; i++) geo(lantern, chain, gold, 0, -0.03 - i * 0.05, 0).rotation.y = (i % 2) * Math.PI / 2;
  box(lantern, gold, [0.28, 0.06, 0.28], 0, -0.5, 0, 0.025);
  box(lantern, gold, [0.28, 0.06, 0.28], 0, -0.86, 0, 0.025);
  for (const x of [-0.12, 0.12]) for (const z of [-0.12, 0.12]) box(lantern, gold, [0.035, 0.34, 0.035], x, -0.68, z, 0.015);
  geo(lantern, new THREE.BoxGeometry(0.21, 0.3, 0.21), new THREE.MeshBasicMaterial({ color: '#ffe2a0', transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false }), 0, -0.68, 0);
  const lanternFlame = new THREE.Group();
  lanternFlame.position.set(0, -0.82, 0);
  lantern.add(lanternFlame);
  layerFlame(lanternFlame, [{ color: '#ffc24d', scale: 1 }, { color: '#fff3b0', scale: 0.55 }], 0.07, 0.15);
  geo(lantern, new THREE.ConeGeometry(0.21, 0.16, 4), gold, 0, -0.42, 0).rotation.y = Math.PI / 4;
  blob(lantern, gold, 0.035, 0.035, 0.035, 0, -0.33, 0);

  return { lantern, steam: steamGroup };
}

/** A round, sleepy lamb by the fire — chunky and chibi, with rosy cheeks. */
function buildLamb(room: THREE.Group, paint: Paint) {
  const lamb = new THREE.Group();
  lamb.position.set(1.15, 0, -1.85);
  lamb.rotation.y = -0.6;
  room.add(lamb);
  const wool = paint('#fffaf0', 'cloth');
  const woolShade = paint('#f3eadb', 'cloth');
  const face = paint('#6a544c');
  const body = new THREE.Group();
  lamb.add(body);
  const random = seedRandom(17);
  blob(body, wool, 0.25, 0.18, 0.2, 0, 0.19, 0);
  for (let i = 0; i < 22; i++) {
    const a = random() * Math.PI * 2;
    const e = random() * 1.2 - 0.1;
    const x = Math.cos(a) * Math.cos(e) * 0.23;
    const z = Math.sin(a) * Math.cos(e) * 0.18;
    const y = 0.19 + Math.sin(e) * 0.15;
    if (y < 0.08) continue;
    const s = 0.07 + random() * 0.03;
    blob(body, i % 4 ? wool : woolShade, s, s, s, x, y, z);
  }
  for (const [x, z] of [[0.13, 0.15], [-0.1, 0.17]]) blob(body, face, 0.06, 0.035, 0.035, x, 0.04, z);
  blob(body, wool, 0.05, 0.05, 0.05, -0.26, 0.22, -0.02); // tail

  // Big chibi head.
  const head = new THREE.Group();
  head.position.set(0.27, 0.2, 0.1);
  head.rotation.set(0, 0.5, -0.3);
  lamb.add(head);
  blob(head, face, 0.12, 0.105, 0.1, 0.03, 0, 0);
  for (let i = 0; i < 5; i++) blob(head, wool, 0.045, 0.045, 0.045, -0.02 + (i % 3) * 0.03, 0.09, -0.04 + i * 0.02);
  for (const s of [-1, 1]) {
    const ear = blob(head, face, 0.075, 0.022, 0.04, -0.03, 0.02, s * 0.11);
    ear.rotation.y = s * 0.4;
    ear.rotation.x = s * 0.4;
  }
  // Closed happy eyes and rosy cheeks.
  const lid = new THREE.MeshBasicMaterial({ color: '#2a1e1a' });
  for (const s of [-1, 1]) {
    geo(head, new THREE.TorusGeometry(0.018, 0.004, 6, 14, Math.PI), lid, 0.12, 0.02, s * 0.045).rotation.set(Math.PI, Math.PI / 2 - s * 0.6, 0);
    blob(head, paint('#ffb3b3'), 0.014, 0.01, 0.022, 0.12, -0.02, s * 0.07);
  }
  return body;
}

/** Judah (the app's lion companion) as a cub, curled up asleep on a round cushion bed in the corner. */
function buildLionCub(room: THREE.Group, paint: Paint) {
  const nook = new THREE.Group();
  nook.position.set(2.3, 0, -2.95);
  nook.rotation.y = -0.5;
  room.add(nook);

  // Round pet bed: a puffy ring bolster around a soft cushion.
  const bedOuter = paint('#8cc8e8', 'cloth');
  const bedInner = paint('#fbe7c6', 'cloth');
  geo(nook, new THREE.TorusGeometry(0.38, 0.11, 16, 40), bedOuter, 0, 0.12, 0).rotation.x = Math.PI / 2;
  geo(nook, new THREE.CylinderGeometry(0.4, 0.42, 0.08, 40), bedOuter, 0, 0.04, 0);
  blob(nook, bedInner, 0.36, 0.06, 0.36, 0, 0.1, 0);
  // Little stitched hearts on the bolster.
  const heart = paint('#f7a8c4');
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    blob(nook, heart, 0.03, 0.03, 0.012, Math.cos(a) * 0.49, 0.14, Math.sin(a) * 0.49).lookAt(Math.cos(a) * 2, 0.14, Math.sin(a) * 2);
  }

  const fur = paint('#f2c462', 'cloth');
  const furShade = paint('#edb565', 'cloth');
  const mane = paint('#d9955a', 'cloth');
  const muzzle = paint('#f7e3b5');
  const dark = new THREE.MeshBasicMaterial({ color: '#2b2420' });

  const cub = new THREE.Group();
  cub.position.set(0, 0.12, 0);
  nook.add(cub);

  // Curled body (breathes), paws tucked, tail wrapping round to the nose.
  const body = new THREE.Group();
  cub.add(body);
  blob(body, fur, 0.21, 0.15, 0.17, -0.02, 0.13, 0);
  blob(body, furShade, 0.12, 0.09, 0.1, -0.14, 0.12, -0.05); // haunch
  for (const z of [0.07, -0.02]) blob(body, fur, 0.07, 0.045, 0.05, 0.17, 0.04, z + 0.06);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 0.09, -0.08), new THREE.Vector3(-0.24, 0.06, 0.08),
    new THREE.Vector3(-0.08, 0.04, 0.2), new THREE.Vector3(0.12, 0.05, 0.2),
  ]);
  geo(body, new THREE.TubeGeometry(tailCurve, 24, 0.025, 10), fur, 0, 0, 0);
  blob(body, mane, 0.04, 0.04, 0.04, 0.13, 0.05, 0.2); // tail tuft

  // Big round head resting on the paws, ringed by a puffy mane.
  const head = new THREE.Group();
  head.position.set(0.17, 0.15, 0.06);
  head.rotation.set(0.1, 0.35, -0.35);
  cub.add(head);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    blob(head, mane, 0.055, 0.055, 0.055, -0.02, Math.sin(a) * 0.11, Math.cos(a) * 0.11);
  }
  blob(head, fur, 0.12, 0.11, 0.115, 0, 0, 0);
  blob(head, muzzle, 0.05, 0.04, 0.065, 0.1, -0.035, 0);
  blob(head, paint('#e8998a'), 0.016, 0.012, 0.022, 0.145, -0.012, 0); // nose
  for (const s of [-1, 1]) {
    blob(head, fur, 0.035, 0.035, 0.02, -0.02, 0.1, s * 0.07).rotation.x = s * 0.4; // ears
    blob(head, paint('#e8998a'), 0.018, 0.012, 0.024, 0.09, -0.02, s * 0.075); // blush
    // Sleepy closed eyes.
    geo(head, new THREE.TorusGeometry(0.02, 0.005, 6, 14, Math.PI), dark, 0.11, 0.025, s * 0.045)
      .rotation.set(Math.PI, Math.PI / 2 - s * 0.5, 0);
  }

  // Floating "z z z" that drift up and fade.
  const zShape = new THREE.Shape();
  zShape.moveTo(-0.5, 0.5);
  zShape.lineTo(0.5, 0.5);
  zShape.lineTo(0.5, 0.3);
  zShape.lineTo(-0.15, -0.3);
  zShape.lineTo(0.5, -0.3);
  zShape.lineTo(0.5, -0.5);
  zShape.lineTo(-0.5, -0.5);
  zShape.lineTo(-0.5, -0.3);
  zShape.lineTo(0.15, 0.3);
  zShape.lineTo(-0.5, 0.3);
  zShape.closePath();
  const zGeo = new THREE.ShapeGeometry(zShape);
  const zzz = new THREE.Group();
  zzz.position.set(2.4, 0.5, -2.85);
  room.add(zzz);
  for (let i = 0; i < 3; i++) {
    const z = new THREE.Mesh(zGeo, new THREE.MeshBasicMaterial({ color: '#8cc8e8', transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    z.userData.phase = i / 3;
    zzz.add(z);
  }
  return { body, zzz };
}

function buildMotes() {
  const random = seedRandom(126);
  const n = 120;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = -W + 0.2 + random() * (W * 2 - 0.4);
    positions[i * 3 + 1] = 0.2 + random() * 2.4;
    positions[i * 3 + 2] = -D + 0.3 + random() * (D * 2 - 0.6);
  }
  const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const sprite = dataTexture(32, 32, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    return Math.max(0, 1 - r) ** 2;
  });
  sprite.wrapS = sprite.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.Points(g, new THREE.PointsMaterial({
    color: '#fff6d8', size: 0.05, map: sprite, alphaMap: sprite, transparent: true, opacity: 0.8,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

/** Soft additive shaft of morning light from the left window, with a sunny patch on the floor. */
function buildSunbeam(leftWin: Opening) {
  const g = new THREE.BufferGeometry();
  const top = [[-W, leftWin.y1, leftWin.a0], [-W, leftWin.y1, leftWin.a1], [-W, leftWin.y0, leftWin.a1], [-W, leftWin.y0, leftWin.a0]];
  const dx = 1.6;
  const floor = [[-W + dx + 1.1, 0.06, leftWin.a0 + 0.35], [-W + dx + 1.1, 0.06, leftWin.a1 + 0.35], [-W + dx, 0.06, leftWin.a1 + 0.35], [-W + dx, 0.06, leftWin.a0 + 0.35]];
  g.setAttribute('position', new THREE.Float32BufferAttribute([...top, ...floor].flat(), 3));
  g.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
  const mat = new THREE.MeshBasicMaterial({
    color: '#fff2c8', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const patch = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, leftWin.a1 - leftWin.a0),
    new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(-W + dx + 0.55, 0.055, (leftWin.a0 + leftWin.a1) / 2 + 0.35);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(g, mat), patch);
  return { group, beam: mat, patch: patch.material as THREE.MeshBasicMaterial };
}

export function createCabinWorld(options: THREE.WebGLRendererParameters) {
  const renderer = new THREE.WebGLRenderer({ ...options, antialias: true });
  renderer.debug.onShaderError = (gl, program) => {
    throw new Error(gl.getProgramInfoLog(program) || 'The cabin shaders could not be linked.');
  };
  // Soft cream backdrop around the dollhouse.
  renderer.setClearColor('#f6ead6', 1);
  // Neutral tone mapping keeps the bright pastels saturated instead of washing them out.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const room = new THREE.Group();
  const glow = new THREE.Group();
  scene.add(room, glow);

  const textures = {
    wood: woodTexture(),
    end: endGrainTexture(),
    stone: stoneTexture(),
    cloth: clothTexture(),
    ramp: toonRamp(),
  };

  // Toon materials: flat, friendly bands of light. They only need standard 8-bit buffers,
  // so they're as portable on Expo GL as the chapel's Lambert materials.
  const cache = new Map<string, THREE.Material>();
  const paint: Paint = (color, finish = 'plain') => {
    const key = `${finish}:${color}`;
    let m = cache.get(key);
    if (m) return m;
    const map = finish === 'plain' ? null : textures[finish];
    m = new THREE.MeshToonMaterial({ color, map, gradientMap: textures.ramp });
    cache.set(key, m);
    return m;
  };
  const endCache = new Map<string, THREE.Material>();
  const logMats = (bark: string): LogMats => {
    let end = endCache.get(bark);
    if (!end) {
      const c = new THREE.Color(bark).lerp(new THREE.Color('#ffe2b0'), 0.5);
      end = new THREE.MeshToonMaterial({ color: c, map: textures.end, gradientMap: textures.ramp });
      endCache.set(bark, end);
    }
    return { bark: paint(bark, 'wood'), end };
  };

  const shell = buildShell(room, paint, logMats);
  const gold = buildHearth(room, paint, logMats, glow);
  const { lantern, steam } = buildFurnishings(room, paint, glow, gold);
  shell.ceiling.add(lantern);
  const lambBody = buildLamb(room, paint);
  const cub = buildLionCub(room, paint);
  const motes = buildMotes();
  const sun = buildSunbeam(shell.leftWin);
  scene.add(motes, sun.group);

  // Lighting: bright cheerful morning with a warm glow from the fire and lamps.
  scene.add(new THREE.HemisphereLight('#fff6e6', '#e0b07a', 2.1));
  const sunLight = new THREE.DirectionalLight('#fff1d6', 2.0);
  sunLight.position.set(-6, 8, 4);
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight('#cfe6ff', 0.7);
  fill.position.set(5, 4, 6);
  scene.add(fill);
  const fire = new THREE.PointLight('#ffa257', 4, 6, 1.4);
  fire.position.set(0, 0.6, -D + 1.1);
  scene.add(fire);
  const lanternLight = new THREE.PointLight('#ffd89a', 2.2, 5, 1.5);
  lanternLight.position.set(0, H - 0.75, -1.7);
  scene.add(lanternLight);

  const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 40);
  camera.rotation.order = 'YXZ';
  let aspect = 1;

  return {
    resize(width: number, height: number, pixelRatio: number) {
      aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    },
    render(view: CabinView, seconds: number) {
      camera.position.set(view.x, view.y + Math.sin(seconds * 0.9) * 0.01, view.z);
      camera.rotation.set(view.pitch, view.yaw, 0);
      // Widen a little on tall phones so the room still fits.
      const fov = aspect < 0.7 ? view.fov * 1.18 : view.fov;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      // Dollhouse cutaway: hide walls the camera is behind, and the ceiling from above.
      const c = camera.position;
      let outside = false;
      for (const wall of shell.walls) {
        const hidden = wall.hide(c);
        wall.group.visible = !hidden;
        outside ||= hidden;
      }
      shell.ceiling.visible = !outside && c.y < H + 0.2;
      sun.group.visible = !outside;

      const flicker = Math.sin(seconds * 9.1) * 0.5 + Math.sin(seconds * 13.7 + 1.3) * 0.3 + Math.sin(seconds * 4.3) * 0.4;
      fire.intensity = 4 + flicker * 0.8;
      for (const f of glow.children) {
        const phase = (f.userData.phase as number) ?? 0;
        if (f.userData.candle) {
          f.scale.set(1, 1 + Math.sin(seconds * 8 + phase) * 0.12, 1);
          f.rotation.z = Math.sin(seconds * 3 + phase) * 0.08;
          continue;
        }
        const base = f.userData.base as number;
        const sy = base * (1 + 0.22 * Math.sin(seconds * 6 + phase) + 0.1 * Math.sin(seconds * 11 + phase * 2));
        // Squash-and-stretch: wider when shorter, like a bouncy cartoon flame.
        f.scale.set(1 / Math.sqrt(sy / base), sy, 1 / Math.sqrt(sy / base));
        f.rotation.z = Math.sin(seconds * 2.3 + phase) * 0.1;
      }
      lantern.rotation.z = Math.sin(seconds * 0.7) * 0.03;
      // Lamb breathes with a gentle squash-and-stretch.
      const breath = Math.sin(seconds * 1.6);
      lambBody.scale.set(1 - breath * 0.015, 1 + breath * 0.035, 1 - breath * 0.015);
      // The cub breathes slower and deeper — fast asleep.
      const cubBreath = Math.sin(seconds * 1.1 + 1);
      cub.body.scale.set(1 + cubBreath * 0.02, 1 + cubBreath * 0.045, 1 + cubBreath * 0.02);
      for (const z of cub.zzz.children) {
        const t = (seconds * 0.28 + (z.userData.phase as number)) % 1;
        z.position.set(Math.sin(t * 6) * 0.06 + t * 0.12, t * 0.75, 0);
        z.scale.setScalar(0.05 + t * 0.07);
        z.quaternion.copy(camera.quaternion);
        (z as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.opacity = Math.sin(t * Math.PI) * 0.9;
      }
      for (const puff of steam.children) {
        const t = (seconds * 0.5 + (puff.userData.phase as number)) % 1.5;
        puff.position.set(Math.sin(t * 4) * 0.02, t * 0.18, 0);
        (puff as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.opacity = 0.45 * (1 - t / 1.5);
        puff.scale.setScalar(0.02 + t * 0.03);
      }
      motes.rotation.y = Math.sin(seconds * 0.05) * 0.08;
      motes.position.y = Math.sin(seconds * 0.4) * 0.06;
      sun.beam.opacity = 0.075 + Math.sin(seconds * 0.5) * 0.012;
      sun.patch.opacity = 0.13 + Math.sin(seconds * 0.5) * 0.015;

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
