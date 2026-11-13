// Catalog and derived state for the Me-page nook, from design/Me.dc.html.

import { COLLECTION_DECOR, COLLECTION_SCENE_IDS, COLLECTION_SCENES } from './collectionData';

/**
 * The collection decorations the app offers. The six ambience layers (snowfall, fireflies...) are held back until
 * they're reworked; drop the filter to bring them back.
 */
export const SHOWN_COLLECTION_DECOR = COLLECTION_DECOR.filter(d => d.slot !== 'ambience');

export type SceneId =
  | 'night' | 'chapel' | 'grove' | 'desert' | 'meadow' | 'aurora' | 'advent' | 'easter' | 'harvest'
  | (typeof COLLECTION_SCENE_IDS)[number];
export type SlotId = 'floor' | 'left' | 'right' | 'wall' | 'hang' | 'ambience';
export type DecorSpotId = 'rug' | 'left' | 'right' | 'accentLeft' | 'accentRight' | 'wall' | 'overhead' | 'atmosphere';
export type NookLayoutId = 'balanced' | 'cozy' | 'garden';

/** How far a piece has been dragged from its default spot, in the nook's own 342x440 units. */
export type Offset = { x: number; y: number };

/**
 * Equipped pieces occupy designed spots. Legacy offsets are retained in the storage shape for older clients;
 * current layouts use placements so decorations cannot pile up over the pet.
 */
export type NookState = {
  scene: SceneId;
  items: string[];
  offsets: Record<string, Offset>;
  layout?: NookLayoutId;
  placements?: Record<string, DecorSpotId>;
  /** 3 since the great web and the prayer lights became two removable pieces. Older saves had both built in. */
  v?: 3;
};

/** The light lines running to the centre, with the lights that travel along them. Drawn by NookView. */
export const PRAYER_LIGHTS = 'prayerlights';
/** The big web of rings and spokes behind them. It grows with prayers offered. Drawn by NookView. */
export const GREAT_WEB = 'greatweb';

/** The pet always stands on one rug. The blue one is the default, and choosing another swaps it out. */
export const DEFAULT_RUG = 'bluerug';
const RUGS = [DEFAULT_RUG, 'rug', 'roundrug', 'starrug', 'reedmat', 'flagstones'];
export const isRug = (id: string) => RUGS.includes(id);

/** Leaves at most one rug in the list. */
function withOneRug(items: string[]): string[] {
  if (items.filter(isRug).length <= 1) return items;
  return items.filter(id => id !== DEFAULT_RUG);
}

export const DEFAULT_NOOK: NookState = {
  scene: 'grove',
  items: ['bluerug', 'cross', 'treeL', 'candles', 'lily'],
  offsets: {},
  layout: 'balanced',
  v: 3,
};

/** Turns anything read from storage into a valid NookState. Understands the older one-item-per-spot format. */
export function migrateNook(raw: unknown): NookState {
  const r = (raw ?? {}) as { scene?: SceneId; items?: unknown; offsets?: unknown; slots?: Record<string, string | null>; v?: number; layout?: NookLayoutId; placements?: Record<string, DecorSpotId> };
  const known = new Set(ROWS.flatMap(row => row.items.map(it => it.id)));
  let items: string[];
  if (Array.isArray(r.items)) items = r.items.filter((id): id is string => typeof id === 'string' && known.has(id));
  else if (r.slots) items = [DEFAULT_RUG, ...Object.values(r.slots).filter((id): id is string => typeof id === 'string' && known.has(id))];
  else items = [...DEFAULT_NOOK.items];
  items = withOneRug(Array.from(new Set(items)));
  // Older saves always showed the web and lights, so they keep them. Version 2 had them as one piece, the lights.
  const version = r.v ?? 1;
  if (version < 2 && !items.includes(PRAYER_LIGHTS)) items.push(PRAYER_LIGHTS);
  if (version < 3 && items.includes(PRAYER_LIGHTS) && !items.includes(GREAT_WEB)) items.push(GREAT_WEB);
  const offsets: Record<string, Offset> = {};
  if (r.offsets && typeof r.offsets === 'object') {
    for (const [id, o] of Object.entries(r.offsets as Record<string, Offset>)) {
      if (items.includes(id) && typeof o?.x === 'number' && typeof o?.y === 'number') offsets[id] = { x: o.x, y: o.y };
    }
  }
  const scene = SCENES.some(sc => sc.id === r.scene) ? (r.scene as SceneId) : DEFAULT_NOOK.scene;
  return arrangeNook({ scene, items, offsets, layout: r.layout, placements: r.placements, v: 3 });
}

export type Box = { x: number; y: number; w: number; h: number };
export type ItemMeta = {
  slot: SlotId;
  /** Where the piece is drawn by default, as an offset from its original art position (keeps pieces in one spot from stacking exactly). */
  base: Offset;
  /** The part of the piece you can grab, in nook units at its default spot. */
  hit: Box;
};

/** How far the pet was lowered onto the pedestal, in nook units. The older floor and side pieces move down with it. */
const PET_DROP = 48;

export const ITEM_META: Record<string, ItemMeta> = {
  bluerug: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 78, y: 296, w: 186, h: 85 } },
  rug: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 78, y: 296, w: 186, h: 85 } },
  cushion: { slot: 'floor', base: { x: 0, y: PET_DROP }, hit: { x: 100, y: 264, w: 142, h: 44 } },
  wreath: { slot: 'floor', base: { x: 0, y: PET_DROP }, hit: { x: 74, y: 262, w: 196, h: 54 } },
  lantern: { slot: 'left', base: { x: 0, y: 0 }, hit: { x: 74, y: 232, w: 44, h: 195 } },
  censer: { slot: 'left', base: { x: 34, y: PET_DROP }, hit: { x: 52, y: 236, w: 36, h: 108 } },
  plant: { slot: 'right', base: { x: 0, y: PET_DROP }, hit: { x: 262, y: 258, w: 48, h: 86 } },
  scripture: { slot: 'right', base: { x: -34, y: PET_DROP }, hit: { x: 262, y: 264, w: 50, h: 80 } },
  cross: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 137, y: 51, w: 68, h: 109 } },
  glass: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 100, y: 2, w: 142, h: 40 } },
  tapestry: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 16, y: 124, w: 70, h: 110 } },
  lamp: { slot: 'hang', base: { x: -62, y: 0 }, hit: { x: 134, y: 78, w: 74, h: 62 } },
  mobile: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 120, y: 90, w: 102, h: 56 } },
  chimes: { slot: 'hang', base: { x: 62, y: 0 }, hit: { x: 146, y: 88, w: 50, h: 54 } },
  hay: { slot: 'floor', base: { x: 0, y: PET_DROP }, hit: { x: 176, y: 290, w: 78, h: 44 } },
  jackolantern: { slot: 'left', base: { x: 38, y: PET_DROP }, hit: { x: 50, y: 296, w: 42, h: 46 } },
  pilgrimlantern: { slot: 'left', base: { x: 72, y: PET_DROP }, hit: { x: 46, y: 244, w: 56, h: 100 } },
  wheat: { slot: 'right', base: { x: 0, y: PET_DROP }, hit: { x: 302, y: 268, w: 32, h: 76 } },
  autumnwreath: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 266, y: 74, w: 52, h: 56 } },
  web: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 0, y: 0, w: 108, h: 108 } },
  bats: { slot: 'hang', base: { x: -110, y: 0 }, hit: { x: 122, y: 56, w: 100, h: 56 } },
  candles: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 70, y: 377, w: 51, h: 56 } },
  lily: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 239, y: 344, w: 44, h: 88 } },
  treeL: { slot: 'left', base: { x: 19, y: 0 }, hit: { x: -19, y: 179, w: 121, h: 249 } },
  treeR: { slot: 'right', base: { x: -21, y: 0 }, hit: { x: 242, y: 179, w: 121, h: 249 } },
  bench: { slot: 'right', base: { x: 0, y: 0 }, hit: { x: 224, y: 351, w: 88, h: 65 } },
  rose: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 130, y: 3, w: 82, h: 82 } },
  lights: { slot: 'hang', base: { x: 0, y: 34 }, hit: { x: 4, y: -35, w: 335, h: 65 } },
  dove: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 235, y: -67, w: 61, h: 112 } },
  prayerweb: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 111, y: 2, w: 120, h: 44 } },
  // Fills the nook and stays put, so there's nothing to grab.
  [PRAYER_LIGHTS]: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 0, y: 0, w: 0, h: 0 } },
  [GREAT_WEB]: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 0, y: 0, w: 0, h: 0 } },
  garland: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 100, y: 14, w: 142, h: 40 } },
};
for (const d of SHOWN_COLLECTION_DECOR) {
  ITEM_META[d.id] = { slot: d.slot, base: { x: 0, y: 0 }, hit: d.hit };
}

/** Equip or unequip a piece. Unequipping also forgets where it was dragged to. */
export function toggleItem(n: NookState, id: string): NookState {
  const current = arrangeNook(n);
  if (current.items.includes(id)) return arrangeNook({ ...current, items: current.items.filter(item => item !== id) });
  const spots = spotsForItem(id);
  if (!spots.length) return current;
  const spot = spots.find(candidate => !Object.values(current.placements ?? {}).includes(candidate)) ?? spots[0];
  return arrangeNook({
    ...current,
    items: [...current.items.filter(item => current.placements?.[item] !== spot), id],
    placements: { ...current.placements, [id]: spot },
  });
}

export function hasItem(n: NookState, id: string): boolean {
  return n.items.includes(id);
}

export type SceneDef = { id: SceneId; name: string; sw: string; bg: string; locked: boolean };
export type ItemDef = {
  id: string;
  name: string;
  sw: string;
  locked: boolean;
  /** Earned rather than sold: how to get it. Earned pieces never appear in the store. */
  earned?: string;
};
export type RowDef = { slot: SlotId; label: string; items: ItemDef[] };

export const SCENES: SceneDef[] = [
  { id: 'night', name: 'Starry night', sw: '#13233A', bg: '#0E1430', locked: false },
  { id: 'chapel', name: 'Quiet chapel', sw: '#2A2236', bg: '#2A2018', locked: false },
  { id: 'grove', name: 'Olive grove', sw: '#2F4B3A', bg: '#18201E', locked: false },
  { id: 'desert', name: 'Desert', sw: '#4A3A40', bg: '#231A3A', locked: false },
  { id: 'meadow', name: 'Meadow', sw: '#1C4636', bg: '#10251F', locked: true },
  { id: 'aurora', name: 'Aurora', sw: '#2F7D68', bg: '#0A1424', locked: true },
  { id: 'advent', name: 'Advent', sw: '#8A4A22', bg: '#1A120E', locked: true },
  { id: 'easter', name: 'Easter dawn', sw: '#E8A9A0', bg: '#2A2238', locked: true },
  { id: 'harvest', name: 'Harvest moon', sw: '#2B1C44', bg: '#140F2A', locked: true },
  // The nook collection, released one or two a month (public.content_releases, id scene:<id>).
  ...COLLECTION_SCENES.map(sc => ({ ...sc, locked: true })),
];

export const ROWS: RowDef[] = [
  {
    slot: 'floor',
    label: 'Floor',
    items: [
      { id: 'bluerug', name: 'Woven rug', sw: '#2E3E5A', locked: false },
      { id: 'rug', name: 'Prayer rug', sw: '#8E2F2A', locked: false },
      { id: 'candles', name: 'Candle', sw: '#F3EBDD', locked: false },
      { id: 'lily', name: 'Lily pot', sw: '#C9702E', locked: false },
      { id: 'cushion', name: 'Prayer cushion', sw: '#1E2E5A', locked: true },
      { id: 'wreath', name: 'Lily wreath', sw: '#8DAA62', locked: true },
      { id: 'hay', name: 'Hay bale', sw: '#D9B24A', locked: true },
    ],
  },
  {
    slot: 'left',
    label: 'Left side',
    items: [
      { id: 'treeL', name: 'Olive tree', sw: '#3E5A44', locked: false },
      { id: 'lantern', name: 'Lantern post', sw: '#F2C462', locked: false },
      { id: 'censer', name: 'Incense', sw: '#B9BFC9', locked: true },
      { id: 'jackolantern', name: "Jack-o'-lantern", sw: '#E07E34', locked: true },
      { id: 'pilgrimlantern', name: "Pilgrim's lantern", sw: '#C9A24B', locked: true, earned: 'Finish a weekly journey on the Quests page' },
    ],
  },
  {
    slot: 'right',
    label: 'Right side',
    items: [
      { id: 'treeR', name: 'Olive tree', sw: '#3E5A44', locked: false },
      { id: 'bench', name: 'Prayer bench', sw: '#8A5A3C', locked: true },
      { id: 'plant', name: 'Fig plant', sw: '#6E8B4E', locked: false },
      { id: 'scripture', name: 'Scripture stand', sw: '#C98760', locked: true },
      { id: 'wheat', name: 'Wheat sheaf', sw: '#F2C462', locked: true },
    ],
  },
  {
    slot: 'wall',
    label: 'Wall',
    items: [
      { id: 'cross', name: 'Olivewood cross', sw: '#8A5A3C', locked: false },
      { id: 'rose', name: 'Rose window', sw: '#C9A24B', locked: true },
      { id: 'glass', name: 'Stained glass', sw: '#9C84E8', locked: true },
      { id: 'tapestry', name: 'Alpha & Omega', sw: '#C9A24B', locked: true },
      { id: 'autumnwreath', name: 'Autumn wreath', sw: '#C9433A', locked: true },
      { id: 'web', name: 'Spiderweb', sw: '#B9BFC9', locked: true },
    ],
  },
  {
    slot: 'hang',
    label: 'Overhead',
    items: [
      { id: 'lights', name: 'String lights', sw: '#F2C462', locked: false },
      { id: 'dove', name: 'Hanging dove', sw: '#F7F5F0', locked: true },
      { id: 'prayerweb', name: 'Prayer web', sw: '#B9BFC9', locked: false },
      { id: GREAT_WEB, name: 'Great web', sw: '#8FC6A9', locked: false },
      { id: PRAYER_LIGHTS, name: 'Prayer lights', sw: '#F2C462', locked: false },
      { id: 'lamp', name: 'Clay oil lamp', sw: '#B5734A', locked: false },
      { id: 'mobile', name: 'Star mobile', sw: '#F7E3B5', locked: true },
      { id: 'chimes', name: 'Chimes', sw: '#B5DCC6', locked: true },
      { id: 'bats', name: 'Friendly bats', sw: '#241A38', locked: true },
      { id: 'garland', name: 'Candy corn garland', sw: '#E8913A', locked: true },
    ],
  },
];

export type Lighting = 'morning' | 'afternoon' | 'sunset' | 'night';

export function lightingForHour(h: number): Lighting {
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 21) return 'sunset';
  return 'night';
}

export const TINTS: Record<Lighting, string> = {
  morning: 'rgba(242,196,98,0.08)',
  afternoon: 'rgba(255,255,255,0.03)',
  sunset: 'rgba(227,138,75,0.12)',
  night: 'rgba(4,8,20,0.28)',
};
export const TOD_LABELS: Record<Lighting, string> = {
  morning: 'Morning light',
  afternoon: 'Afternoon light',
  sunset: 'Sunset glow',
  night: 'Night',
};
export const GREETINGS: Record<Lighting, string> = {
  morning: 'Good morning',
  afternoon: 'Grace and peace',
  sunset: 'Good evening',
  night: 'Peace be with you',
};

/** Prayer web grows with prayers offered for others. */
export function webLevelFor(total: number): 1 | 2 | 3 | 4 {
  return total > 500 ? 4 : total > 100 ? 3 : total > 25 ? 2 : 1;
}

export function webNextText(total: number, level: number): string {
  if (level >= 4) return 'Your sanctuary web is complete';
  const nextAt = level === 1 ? 26 : level === 2 ? 101 : 501;
  return `${nextAt - total} more prayers to grow your web to Level ${level + 1}`;
}

export function isSanctuarySet(n: NookState): boolean {
  return n.scene === 'chapel' && hasItem(n, 'cushion') && hasItem(n, 'censer') && hasItem(n, 'glass');
}
export function isEasterSet(n: NookState): boolean {
  return n.scene === 'easter' && hasItem(n, 'wreath') && hasItem(n, 'chimes');
}


// The nook collection's decorations join the rows for their spot, released weekly (public.content_releases, id item:<id>).
for (const d of SHOWN_COLLECTION_DECOR) {
  ROWS.find(row => row.slot === d.slot)?.items.push({ id: d.id, name: d.name, sw: d.sw, locked: true });
}

export const DECOR_SPOTS: { id: DecorSpotId; label: string }[] = [
  { id: 'rug', label: 'Carpet' },
  { id: 'left', label: 'Left corner' },
  { id: 'right', label: 'Right corner' },
  { id: 'accentLeft', label: 'Left accent' },
  { id: 'accentRight', label: 'Right accent' },
  { id: 'wall', label: 'Wall feature' },
  { id: 'overhead', label: 'Above' },
  { id: 'atmosphere', label: 'Light effect' },
];

export const NOOK_LAYOUTS: { id: NookLayoutId; label: string }[] = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'cozy', label: 'Cozy corner' },
  { id: 'garden', label: 'Garden' },
];

type SpotFrame = { cx: number; bottom: number; w: number; h: number };
const BALANCED_SPOTS: Record<DecorSpotId, SpotFrame> = {
  rug: { cx: 171, bottom: 387, w: 186, h: 85 },
  left: { cx: 49, bottom: 350, w: 78, h: 180 },
  right: { cx: 293, bottom: 350, w: 78, h: 180 },
  accentLeft: { cx: 64, bottom: 414, w: 48, h: 62 },
  accentRight: { cx: 278, bottom: 414, w: 48, h: 62 },
  wall: { cx: 171, bottom: 161, w: 94, h: 106 },
  overhead: { cx: 171, bottom: 48, w: 264, h: 44 },
  atmosphere: { cx: 171, bottom: 440, w: 342, h: 440 },
};
const LAYOUT_SPOTS: Record<NookLayoutId, Record<DecorSpotId, SpotFrame>> = {
  balanced: BALANCED_SPOTS,
  cozy: {
    ...BALANCED_SPOTS,
    rug: { cx: 176, bottom: 385, w: 170, h: 78 },
    left: { cx: 51, bottom: 348, w: 82, h: 166 },
    right: { cx: 299, bottom: 340, w: 64, h: 150 },
    accentLeft: { cx: 73, bottom: 410, w: 44, h: 56 },
    accentRight: { cx: 281, bottom: 402, w: 44, h: 56 },
    wall: { cx: 175, bottom: 159, w: 84, h: 96 },
    overhead: { cx: 158, bottom: 48, w: 236, h: 40 },
  },
  garden: {
    ...BALANCED_SPOTS,
    rug: { cx: 171, bottom: 383, w: 166, h: 76 },
    left: { cx: 47, bottom: 345, w: 78, h: 192 },
    right: { cx: 295, bottom: 345, w: 78, h: 192 },
    accentLeft: { cx: 55, bottom: 421, w: 48, h: 70 },
    accentRight: { cx: 287, bottom: 421, w: 48, h: 70 },
    wall: { cx: 171, bottom: 149, w: 88, h: 96 },
    overhead: { cx: 171, bottom: 48, w: 280, h: 44 },
  },
};

const ATMOSPHERE = [PRAYER_LIGHTS, GREAT_WEB, 'prayerweb'];
const FRAMING = ['glass', 'lights', 'garland', 'fairycurtain', 'flagbunting', 'canopy', 'driedgarland', 'skylight', ...ATMOSPHERE];

/** A piece may change sides, but always stays in a spot suited to its size and purpose. */
export function spotsForItem(id: string): DecorSpotId[] {
  const meta = ITEM_META[id];
  if (!meta) return [];
  if (ATMOSPHERE.includes(id)) return ['atmosphere'];
  if (isRug(id) || id === 'cushion' || id === 'wreath') return ['rug'];
  if (meta.slot === 'wall') return ['wall'];
  if (meta.slot === 'hang') return ['overhead'];
  if (meta.slot === 'left') return ['left', 'right'];
  if (meta.slot === 'right') return ['right', 'left'];
  return meta.hit.x + meta.hit.w / 2 < 171 ? ['accentLeft', 'accentRight'] : ['accentRight', 'accentLeft'];
}

/** Repair older or crowded arrangements without changing the inventory of available decorations. */
export function arrangeNook(n: NookState): NookState {
  const layout = NOOK_LAYOUTS.some(candidate => candidate.id === n.layout) ? n.layout! : 'balanced';
  const placements: Record<string, DecorSpotId> = {};
  const occupied = new Map<DecorSpotId, string>();
  for (const id of [...new Set(n.items)]) {
    const allowed = spotsForItem(id);
    if (!allowed.length) continue;
    const saved = n.placements?.[id];
    const spot = saved && allowed.includes(saved) ? saved : allowed.find(candidate => !occupied.has(candidate)) ?? allowed[0];
    const previous = occupied.get(spot);
    if (previous) delete placements[previous];
    occupied.set(spot, id);
    placements[id] = spot;
  }
  return { ...n, layout, items: Object.keys(placements), placements, offsets: {}, v: 3 };
}

/** Moving into an occupied spot swaps the two decorations instead of covering one with the other. */
export function moveItemToSpot(n: NookState, id: string, destination: DecorSpotId): NookState {
  const current = arrangeNook(n);
  const origin = current.placements?.[id];
  if (!origin || origin === destination || !spotsForItem(id).includes(destination)) return current;
  const other = current.items.find(item => current.placements?.[item] === destination);
  const placements = { ...current.placements, [id]: destination };
  if (other) placements[other] = origin;
  return { ...current, placements };
}

export type ItemPlacement = { spot: DecorSpotId; x: number; y: number; scale: number };

export function placementForItem(n: NookState, id: string, destination?: DecorSpotId): ItemPlacement {
  const { hit, base } = ITEM_META[id];
  const spot = destination ?? n.placements?.[id] ?? spotsForItem(id)[0];
  if (FRAMING.includes(id)) return { spot, x: hit.x + base.x, y: hit.y + base.y, scale: 1 };
  const frame = LAYOUT_SPOTS[n.layout ?? 'balanced'][spot];
  const scale = Math.min(1, frame.w / hit.w, frame.h / hit.h);
  return { spot, x: frame.cx - hit.w * scale / 2, y: frame.bottom - hit.h * scale, scale };
}

export function spotFrame(n: NookState, spot: DecorSpotId): Box {
  const frame = LAYOUT_SPOTS[n.layout ?? 'balanced'][spot];
  return { x: frame.cx - frame.w / 2, y: frame.bottom - frame.h, w: frame.w, h: frame.h };
}
