import * as THREE from 'three';

import { DEFAULT_CHAPEL_COLORS, type ChapelColorKey, type ChapelColors } from './authChapelColors';
import { CHAPEL_CAMERA_ASPECT, type ChapelOrbit } from './authChapelOrbit';

type ChapelStone = THREE.MeshStandardMaterial | THREE.MeshLambertMaterial;
type ChapelMaterial = ChapelStone | THREE.MeshPhongMaterial | THREE.MeshBasicMaterial;
/** Makes a stone material painted with one of the chapel's colours (and remembers it, so it can be repainted). */
type StoneFactory = (key: ChapelColorKey) => ChapelStone;
/** A flat, unlit material in one of the chapel's colours. */
type GlowFactory = (key: ChapelColorKey, extra?: THREE.MeshBasicMaterialParameters) => THREE.MeshBasicMaterial;

const TURN = Math.PI * 2;

function mesh(parent: THREE.Group, geometry: THREE.BufferGeometry, material: ChapelMaterial, x: number, y: number, z: number) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function box(parent: THREE.Group, material: ChapelMaterial, size: [number, number, number], x: number, y: number, z: number) {
  return mesh(parent, new THREE.BoxGeometry(...size), material, x, y, z);
}

function arch(width: number, height: number) {
  const radius = width / 2;
  const shoulder = height - radius;
  const opening = new THREE.Shape();
  opening.moveTo(-radius, 0);
  opening.lineTo(radius, 0);
  opening.lineTo(radius, shoulder);
  opening.absarc(0, shoulder, radius, 0, Math.PI, false);
  opening.closePath();
  return opening;
}

function seedRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildIsland(world: THREE.Group, stone: StoneFactory) {
  const rock = [stone('rock0'), stone('rock1'), stone('rock2'), stone('rock3')];
  const earth = stone('earth');
  const radius = 2.81;
  const layers = [
    { radius, y: -0.08 }, { radius: 2.94, y: -0.36 }, { radius: 2.50, y: -0.68 },
    { radius: 1.65, y: -1.08 }, { radius: 0.72, y: -1.39 },
  ];
  const sides = 11;
  const random = seedRandom(81);
  const rings = layers.map(({ radius, y }, level) => Array.from({ length: sides }, (_, side) => {
    const angle = TURN * side / sides + 0.17;
    const r = radius * (0.92 + random() * 0.16);
    return new THREE.Vector3(r * Math.cos(angle), y + (level === 0 ? 0 : random() * 0.14), r * Math.sin(angle));
  }));
  const terrace = new THREE.Shape();
  rings[0].forEach((v, index) => {
    if (index === 0) terrace.moveTo(v.x, -v.z);
    else terrace.lineTo(v.x, -v.z);
  });
  terrace.closePath();
  mesh(world, new THREE.ShapeGeometry(terrace), earth, 0, -0.08, 0).rotation.x = -Math.PI / 2;

  const faces = rock.map(() => [] as number[]);
  const walls = new THREE.BufferGeometry();
  for (let level = 0; level < rings.length - 1; level++) {
    for (let side = 0; side < sides; side++) {
      const next = (side + 1) % sides;
      const top = rings[level];
      const bottom = rings[level + 1];
      const triangles = [[top[side], top[next], bottom[side]], [top[next], bottom[next], bottom[side]]];
      for (const triangle of triangles) {
        const vertices = faces[Math.floor(random() * rock.length)];
        for (const point of triangle) vertices.push(point.x, point.y, point.z);
      }
    }
  }
  let start = 0;
  for (const [index, vertices] of faces.entries()) {
    walls.addGroup(start, vertices.length / 3, index);
    start += vertices.length / 3;
  }
  walls.setAttribute('position', new THREE.Float32BufferAttribute(faces.flat(), 3));
  walls.computeVertexNormals();
  world.add(new THREE.Mesh(walls, rock));

  const pathColors = [stone('path0'), stone('path1'), stone('path2')];
  const paving = new THREE.CylinderGeometry(1, 1.04, 0.056, 6);
  for (let index = 0; index < 7; index++) {
    const z = 0.76 + index * 0.286;
    const x = 0.10 + 0.29 * Math.sin(index * 0.44);
    const tile = mesh(world, paving, pathColors[index % pathColors.length], x, -0.065, z);
    tile.scale.set(0.38 - index * 0.011, 1, 0.145);
    tile.rotation.y = random() * 0.30;
  }
}

function windowFrame(parent: THREE.Group, material: ChapelMaterial, glass: ChapelMaterial, width: number, height: number, x: number, y: number, z: number) {
  mesh(parent, new THREE.ExtrudeGeometry(arch(width, height), { depth: 0.035, bevelEnabled: false, curveSegments: 12 }), material, x, y, z);
  const light = new THREE.ShapeGeometry(arch(width - 0.085, height - 0.09), 12);
  mesh(parent, light, glass, x, y + 0.043, z + 0.038);
  box(parent, material, [0.019, height - 0.09, 0.017], x, y + height / 2, z + 0.044);
  box(parent, material, [width - 0.034, 0.024, 0.017], x, y + height * 0.57, z + 0.044);
}

function buildChapel(world: THREE.Group, stone: StoneFactory, glow: GlowFactory, gold: ChapelMaterial) {
  const wall = stone('wall');
  const pale = stone('pale');
  const wood = stone('door');
  const slate = stone('roof');
  const nextSlate = stone('roof2');
  const trim = stone('trim');
  const glass = glow('glass');
  const violetGlass = glow('glass2');
  const chapel = new THREE.Group();
  chapel.position.set(0, 0, -0.28);
  world.add(chapel);

  const length = 2.14;
  const halfWidth = 1.06;
  const eave = 1.49;
  const ridge = 2.36;
  const front = length / 2;
  box(chapel, trim, [2.31, 0.15, 2.36], 0, 0, 0);
  box(chapel, pale, [2.20, 0.065, 2.27], 0, 0.10, 0);

  const gable = new THREE.Shape();
  gable.moveTo(-halfWidth, 0.12);
  gable.lineTo(halfWidth, 0.12);
  gable.lineTo(halfWidth, eave);
  gable.lineTo(0, ridge);
  gable.lineTo(-halfWidth, eave);
  gable.closePath();
  mesh(chapel, new THREE.ExtrudeGeometry(gable, { depth: length, bevelEnabled: false }), wall, 0, 0, -front);

  const slope = Math.atan2(ridge - eave, halfWidth);
  const roofWidth = Math.hypot(ridge - eave, halfWidth) + 0.20;
  for (const side of [-1, 1]) {
    const roof = new THREE.Group();
    roof.position.set(side * 0.54, 1.94, 0);
    roof.rotation.z = -side * slope;
    chapel.add(roof);
    box(roof, slate, [roofWidth, 0.13, 2.48], 0, 0, 0);
    for (let row = -2; row <= 2; row++) {
      box(roof, row % 2 === 0 ? trim : nextSlate, [0.033, 0.038, 2.48], row * 0.26, 0.079, 0);
    }
    for (const x of [-1.016, 1.016]) {
      box(chapel, pale, [0.13, 1.29, 0.15], x, 0.76, side * front);
    }
    const nave = new THREE.Group();
    nave.position.x = side * halfWidth;
    nave.rotation.y = side * Math.PI / 2;
    chapel.add(nave);
    for (const x of [-0.61, 0, 0.61]) {
      windowFrame(nave, trim, x === 0 ? violetGlass : glass, 0.29, 0.73, x, 0.58, 0);
      box(nave, pale, [0.33, 0.039, 0.11], x, 0.57, 0.023);
    }
  }
  box(chapel, pale, [0.095, 0.075, 2.49], 0, ridge + 0.04, 0);

  mesh(chapel, new THREE.ExtrudeGeometry(arch(0.87, 1.22), { depth: 0.11, bevelEnabled: false, curveSegments: 16 }), pale, 0, 0.12, front);
  mesh(chapel, new THREE.ShapeGeometry(arch(0.68, 1.13), 16), wood, 0, 0.12, front + 0.112);
  box(chapel, gold, [0.025, 0.83, 0.027], 0, 0.58, front + 0.117);
  box(chapel, gold, [0.17, 0.032, 0.025], 0, 0.59, front + 0.12);
  box(chapel, pale, [0.92, 0.091, 0.29], 0, 0.029, front + 0.13);
  mesh(chapel, new THREE.CircleGeometry(0.25, 12), trim, 0, 1.692, front + 0.03);
  mesh(chapel, new THREE.CircleGeometry(0.191, 12), glass, 0, 1.692, front + 0.035);
  for (const angle of [0, Math.PI / 3, 2 * Math.PI / 3]) {
    box(chapel, trim, [0.39, 0.026, 0.024], 0, 1.692, front + 0.047).rotation.z = angle;
  }

  const tower = new THREE.Group();
  tower.position.z = 0.32;
  chapel.add(tower);
  box(tower, pale, [0.56, 0.70, 0.56], 0, 2.57, 0);
  box(tower, trim, [0.61, 0.086, 0.61], 0, 2.90, 0);
  for (let face = 0; face < 4; face++) {
    const frame = new THREE.Group();
    frame.rotation.y = face * Math.PI / 2;
    tower.add(frame);
    windowFrame(frame, trim, glass, 0.28, 0.42, 0, 2.43, 0.282);
  }
  mesh(tower, new THREE.ConeGeometry(0.48, 0.72, 4), slate, 0, 3.28, 0).rotation.y = Math.PI / 4;
  box(tower, gold, [0.057, 0.43, 0.057], 0, 3.82, 0);
  box(tower, gold, [0.29, 0.053, 0.055], 0, 3.88, 0);
}

function buildGarden(world: THREE.Group, stone: StoneFactory, glow: GlowFactory) {
  const fern = [stone('leaves0'), stone('leaves1'), stone('leaves2')];
  const bark = stone('bark');
  const rock = stone('boulder');
  const canopy = new THREE.IcosahedronGeometry(1, 0);
  const treeLocations = [[-1.67, -1.04, 1.07], [1.61, -0.81, 0.82], [-1.91, 0.07, 0.67]];
  for (const [x, z, height] of treeLocations) {
    mesh(world, new THREE.CylinderGeometry(0.054, 0.095, height, 5), bark, x, height / 2 - 0.08, z);
    const crown = mesh(world, canopy, fern[0], x, height, z);
    crown.scale.set(height * 0.60, height * 0.46, height * 0.55);
    const side = mesh(world, canopy, fern[1], x - 0.30, height - 0.08, z + 0.06);
    side.scale.setScalar(height * 0.36);
    mesh(world, canopy, fern[2], x + 0.26, height - 0.06, z + 0.13).scale.setScalar(height * 0.32);
  }

  const random = seedRandom(61);
  for (let index = 0; index < 21; index++) {
    const angle = random() * TURN;
    const radius = 1.69 + random() * 0.82;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    if (Math.abs(x) < 0.60 && z > 0) continue;
    const size = 0.095 + random() * 0.21;
    const bush = mesh(world, canopy, index % 4 === 0 ? rock : fern[index % fern.length], x, -0.025, z);
    bush.scale.set(size * 1.2, size * 0.55, size * 0.78);
    bush.rotation.y = angle;
  }

  const flame = glow('flame');
  const flames = new THREE.Group();
  world.add(flames);
  for (const x of [-0.74, 0.91]) {
    const z = x < 0 ? 1.57 : 1.97;
    box(world, rock, [0.20, 0.38, 0.20], x, 0.11, z);
    box(world, bark, [0.23, 0.065, 0.23], x, 0.32, z);
    const tip = mesh(flames, new THREE.OctahedronGeometry(0.070), flame, x, 0.41, z);
    tip.scale.set(0.57, 1.23, 0.57);
  }
  return flames;
}

function addAtmosphere(world: THREE.Group, glow: GlowFactory, paint: (key: ChapelColorKey, material: { color: THREE.Color }) => void) {
  const material = glow('ring', { transparent: true, opacity: 0.31 });
  const outer = mesh(world, new THREE.TorusGeometry(3.28, 0.012, 5, 88), material, 0, -0.35, 0);
  outer.rotation.set(Math.PI / 2 + 0.14, 0.12, 0);
  const inner = mesh(world, new THREE.TorusGeometry(2.97, 0.009, 5, 80), glow('ring', { transparent: true }), 0, -0.55, 0);
  inner.material.opacity = 0.20;
  inner.rotation.copy(outer.rotation);

  const random = seedRandom(126);
  const positions = new Float32Array(75 * 3);
  for (let index = 0; index < positions.length; index += 3) {
    const angle = random() * TURN;
    const radius = 2.3 + random() * 3.8;
    positions[index] = Math.cos(angle) * radius;
    positions[index + 1] = -1.5 + random() * 6.7;
    positions[index + 2] = Math.sin(angle) * radius;
  }
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const moteMaterial = new THREE.PointsMaterial({ color: DEFAULT_CHAPEL_COLORS.motes, size: 0.043, transparent: true, opacity: 0.56, depthWrite: false });
  paint('motes', moteMaterial);
  const motes = new THREE.Points(geometry, moteMaterial);
  world.add(motes);
  return motes;
}

export function createAuthChapelWorld(options: THREE.WebGLRendererParameters, { portableMaterials = false, colors = DEFAULT_CHAPEL_COLORS }: { portableMaterials?: boolean; colors?: ChapelColors } = {}) {
  const renderer = new THREE.WebGLRenderer({ ...options, alpha: true, antialias: true });
  renderer.debug.onShaderError = (gl, program) => {
    throw new Error(gl.getProgramInfoLog(program) || 'The chapel shaders could not be linked.');
  };
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);
  // Every coloured thing is listed under its colour, so the whole chapel can be repainted for another wallpaper.
  const painted = new Map<ChapelColorKey, { color: THREE.Color }[]>();
  const paint = (key: ChapelColorKey, target: { color: THREE.Color }) => {
    const list = painted.get(key) ?? [];
    list.push(target);
    painted.set(key, list);
    target.color.set(colors[key]);
  };
  const sky = new THREE.HemisphereLight(colors.sky, colors.ground, 1.65);
  scene.add(sky);
  const key = new THREE.DirectionalLight(colors.key, 3.1);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const edge = new THREE.DirectionalLight(colors.edge, 2.2);
  edge.position.set(4, 3, -5);
  scene.add(edge);
  paint('sky', sky);
  paint('key', key);
  paint('edge', edge);
  // Expo GL does not expose float color buffers on every device. Lambert and Phong avoid Three's half-float lighting texture.
  const stone: StoneFactory = name => {
    const material = portableMaterials
      ? new THREE.MeshLambertMaterial({ flatShading: true })
      : new THREE.MeshStandardMaterial({ roughness: 0.92, flatShading: true });
    paint(name, material);
    return material;
  };
  const glow: GlowFactory = (name, extra) => {
    const material = new THREE.MeshBasicMaterial(extra);
    paint(name, material);
    return material;
  };
  const goldColor = { emissiveIntensity: 0.35 };
  const gold = portableMaterials
    ? new THREE.MeshPhongMaterial({ ...goldColor, shininess: 24 })
    : new THREE.MeshStandardMaterial({ ...goldColor, metalness: 0.3, roughness: 0.34 });
  paint('gold', gold);
  const setGlow = (value: string) => gold.emissive.set(value);
  setGlow(colors.goldGlow);
  buildIsland(world, stone);
  buildChapel(world, stone, glow, gold);
  const flames = buildGarden(world, stone, glow);
  const motes = addAtmosphere(world, glow, paint);
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 36);

  return {
    /** Repaints the chapel for another wallpaper (shows on the next frame). */
    setColors(next: ChapelColors) {
      for (const [name, targets] of painted) for (const target of targets) target.color.set(next[name]);
      sky.groundColor.set(next.ground);
      setGlow(next.goldGlow);
    },
    resize(width: number, height: number, pixelRatio: number) {
      camera.aspect = width / height;
      camera.zoom = Math.min(1, camera.aspect / CHAPEL_CAMERA_ASPECT);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    },
    render({ azimuth, elevation }: ChapelOrbit, seconds: number) {
      const distance = 11.26;
      const horizontalDistance = distance * Math.cos(elevation);
      camera.position.set(
        Math.sin(azimuth) * horizontalDistance,
        1.13 + Math.sin(elevation) * distance,
        Math.cos(azimuth) * horizontalDistance,
      );
      camera.lookAt(0, 1.13, 0);
      world.position.y = Math.sin(seconds * 1.04) * 0.075;
      motes.rotation.y = seconds * 0.056;
      motes.position.y = 0.12 * Math.sin(seconds);
      for (const [index, flame] of flames.children.entries()) flame.scale.y = 1.23 + 0.19 * Math.sin(seconds * 6 + index * 1.7);
      renderer.render(scene, camera);
    },
    dispose() {
      const materials = new Set<THREE.Material>();
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        geometries.add(object.geometry);
        const objectMaterials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of objectMaterials) materials.add(material);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
    },
  };
}
