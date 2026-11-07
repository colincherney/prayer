// Catalog and derived state for the Me-page nook, from design/Me.dc.html.

import { COLLECTION_DECOR, COLLECTION_SCENE_IDS, COLLECTION_SCENES } from './collectionData';

export type SceneId =
  | 'night' | 'chapel' | 'grove' | 'desert' | 'meadow' | 'aurora' | 'advent' | 'easter' | 'harvest'
  | (typeof COLLECTION_SCENE_IDS)[number];
export type SlotId = 'floor' | 'left' | 'right' | 'wall' | 'hang' | 'ambience';

/** How far a piece has been dragged from its default spot, in the nook's own 342x440 units. */
export type Offset = { x: number; y: number };

/**
 * `items` holds every equipped piece (any number per spot). `offsets` holds only pieces that have been dragged,
 * so removing a piece also removes its entry and it returns to its default spot next time.
 */
export type NookState = {
  scene: SceneId;
  items: string[];
  offsets: Record<string, Offset>;
  /** 2 since the prayer lights became a removable piece. Older saves had them built in. */
  v?: 2;
};

/** The big glowing web with light lines to the centre. It grows with prayers offered, and is drawn by NookView. */
export const PRAYER_LIGHTS = 'prayerlights';

/** The pet always stands on one rug. The blue one is the default, and choosing another swaps it out. */
export const DEFAULT_RUG = 'bluerug';
const RUGS = [DEFAULT_RUG, 'rug'];
export const isRug = (id: string) => RUGS.includes(id);

/** Leaves at most one rug in the list. */
function withOneRug(items: string[]): string[] {
  if (items.filter(isRug).length <= 1) return items;
  return items.filter(id => id !== DEFAULT_RUG);
}

export const DEFAULT_NOOK: NookState = {
  scene: 'grove',
  items: ['bluerug', 'cross', 'treeL', 'treeR', 'prayerweb', PRAYER_LIGHTS],
  offsets: {},
  v: 2,
};

/** Turns anything read from storage into a valid NookState. Understands the older one-item-per-spot format. */
export function migrateNook(raw: unknown): NookState {
  const r = (raw ?? {}) as { scene?: SceneId; items?: unknown; offsets?: unknown; slots?: Record<string, string | null>; v?: number };
  const known = new Set(ROWS.flatMap(row => row.items.map(it => it.id)));
  let items: string[];
  if (Array.isArray(r.items)) items = r.items.filter((id): id is string => typeof id === 'string' && known.has(id));
  else if (r.slots) items = [DEFAULT_RUG, ...Object.values(r.slots).filter((id): id is string => typeof id === 'string' && known.has(id))];
  else items = [...DEFAULT_NOOK.items];
  items = withOneRug(Array.from(new Set(items)));
  // Saves from before the prayer lights could be removed always showed them, so they keep them.
  if (r.v !== 2 && !items.includes(PRAYER_LIGHTS)) items.push(PRAYER_LIGHTS);
  const offsets: Record<string, Offset> = {};
  if (r.offsets && typeof r.offsets === 'object') {
    for (const [id, o] of Object.entries(r.offsets as Record<string, Offset>)) {
      if (items.includes(id) && typeof o?.x === 'number' && typeof o?.y === 'number') offsets[id] = { x: o.x, y: o.y };
    }
  }
  const scene = SCENES.some(sc => sc.id === r.scene) ? (r.scene as SceneId) : DEFAULT_NOOK.scene;
  return { scene, items, offsets, v: 2 };
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
  bluerug: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 55, y: 316, w: 232, h: 46 } },
  rug: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 55, y: 316, w: 232, h: 46 } },
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
  garland: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 100, y: 14, w: 142, h: 40 } },
};
for (const d of COLLECTION_DECOR) {
  ITEM_META[d.id] = { slot: d.slot, base: { x: 0, y: 0 }, hit: d.hit };
}

/** Equip or unequip a piece. Unequipping also forgets where it was dragged to. */
export function toggleItem(n: NookState, id: string): NookState {
  if (isRug(id)) {
    const placing = !n.items.includes(id);
    const offsets = { ...n.offsets };
    for (const rug of RUGS) delete offsets[rug];
    return { ...n, items: [...n.items.filter(x => !isRug(x)), ...(placing ? [id] : [])], offsets };
  }
  if (n.items.includes(id)) {
    const offsets = { ...n.offsets };
    delete offsets[id];
    return { ...n, items: n.items.filter(x => x !== id), offsets };
  }
  return { ...n, items: [...n.items, id] };
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
      { id: 'candles', name: 'Candle trio', sw: '#F3EBDD', locked: false },
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
      { id: PRAYER_LIGHTS, name: 'Prayer lights', sw: '#F2C462', locked: false },
      { id: 'lamp', name: 'Clay oil lamp', sw: '#B5734A', locked: false },
      { id: 'mobile', name: 'Star mobile', sw: '#F7E3B5', locked: true },
      { id: 'chimes', name: 'Chimes', sw: '#B5DCC6', locked: true },
      { id: 'bats', name: 'Friendly bats', sw: '#241A38', locked: true },
      { id: 'garland', name: 'Candy corn garland', sw: '#E8913A', locked: true },
    ],
  },
  {
    slot: 'ambience',
    label: 'Ambience',
    items: [],
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
for (const d of COLLECTION_DECOR) {
  ROWS.find(row => row.slot === d.slot)?.items.push({ id: d.id, name: d.name, sw: d.sw, locked: true });
}