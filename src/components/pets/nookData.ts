// Catalog and derived state for the Me-page nook, from design/Me.dc.html.

export type SceneId = 'night' | 'chapel' | 'grove' | 'desert' | 'meadow' | 'aurora' | 'advent' | 'easter';
export type SlotId = 'floor' | 'left' | 'right' | 'wall' | 'hang';

/** How far a piece has been dragged from its default spot, in the nook's own 342x440 units. */
export type Offset = { x: number; y: number };

/**
 * `items` holds every equipped piece (any number per spot). `offsets` holds only pieces that have been dragged,
 * so removing a piece also removes its entry and it returns to its default spot next time.
 */
export type NookState = { scene: SceneId; items: string[]; offsets: Record<string, Offset> };

export const DEFAULT_NOOK: NookState = {
  scene: 'night',
  items: ['rug', 'lantern'],
  offsets: {},
};

/** Turns anything read from storage into a valid NookState. Understands the older one-item-per-spot format. */
export function migrateNook(raw: unknown): NookState {
  const r = (raw ?? {}) as { scene?: SceneId; items?: unknown; offsets?: unknown; slots?: Record<string, string | null> };
  const known = new Set(ROWS.flatMap(row => row.items.map(it => it.id)));
  let items: string[];
  if (Array.isArray(r.items)) items = r.items.filter((id): id is string => typeof id === 'string' && known.has(id));
  else if (r.slots) items = Object.values(r.slots).filter((id): id is string => typeof id === 'string' && known.has(id));
  else items = [...DEFAULT_NOOK.items];
  const offsets: Record<string, Offset> = {};
  if (r.offsets && typeof r.offsets === 'object') {
    for (const [id, o] of Object.entries(r.offsets as Record<string, Offset>)) {
      if (items.includes(id) && typeof o?.x === 'number' && typeof o?.y === 'number') offsets[id] = { x: o.x, y: o.y };
    }
  }
  const scene = SCENES.some(sc => sc.id === r.scene) ? (r.scene as SceneId) : DEFAULT_NOOK.scene;
  return { scene, items: Array.from(new Set(items)), offsets };
}

export type Box = { x: number; y: number; w: number; h: number };
export type ItemMeta = {
  slot: SlotId;
  /** Where the piece is drawn by default, as an offset from its original art position (keeps pieces in one spot from stacking exactly). */
  base: Offset;
  /** The part of the piece you can grab, in nook units at its default spot. */
  hit: Box;
};

export const ITEM_META: Record<string, ItemMeta> = {
  rug: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 73, y: 266, w: 196, h: 44 } },
  cushion: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 100, y: 264, w: 142, h: 44 } },
  wreath: { slot: 'floor', base: { x: 0, y: 0 }, hit: { x: 74, y: 262, w: 196, h: 54 } },
  lantern: { slot: 'left', base: { x: 0, y: 0 }, hit: { x: 46, y: 268, w: 48, h: 74 } },
  censer: { slot: 'left', base: { x: 34, y: 0 }, hit: { x: 52, y: 236, w: 36, h: 108 } },
  plant: { slot: 'right', base: { x: 0, y: 0 }, hit: { x: 262, y: 258, w: 48, h: 86 } },
  scripture: { slot: 'right', base: { x: -34, y: 0 }, hit: { x: 262, y: 264, w: 50, h: 80 } },
  cross: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 268, y: 146, w: 44, h: 80 } },
  glass: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 100, y: 2, w: 142, h: 40 } },
  tapestry: { slot: 'wall', base: { x: 0, y: 0 }, hit: { x: 16, y: 124, w: 70, h: 110 } },
  lamp: { slot: 'hang', base: { x: -62, y: 0 }, hit: { x: 134, y: 78, w: 74, h: 62 } },
  mobile: { slot: 'hang', base: { x: 0, y: 0 }, hit: { x: 120, y: 90, w: 102, h: 56 } },
  chimes: { slot: 'hang', base: { x: 62, y: 0 }, hit: { x: 146, y: 88, w: 50, h: 54 } },
};

/** Equip or unequip a piece. Unequipping also forgets where it was dragged to. */
export function toggleItem(n: NookState, id: string): NookState {
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
export type ItemDef = { id: string; name: string; sw: string; locked: boolean };
export type RowDef = { slot: SlotId; label: string; items: ItemDef[] };

export const SCENES: SceneDef[] = [
  { id: 'night', name: 'Starry night', sw: '#13233A', bg: '#0D1828', locked: false },
  { id: 'chapel', name: 'Quiet chapel', sw: '#2A2236', bg: '#17141F', locked: false },
  { id: 'grove', name: 'Olive grove', sw: '#2F4B3A', bg: '#12211C', locked: false },
  { id: 'desert', name: 'Desert', sw: '#4A3A40', bg: '#1B1730', locked: false },
  { id: 'meadow', name: 'Meadow', sw: '#1C4636', bg: '#10251F', locked: true },
  { id: 'aurora', name: 'Aurora', sw: '#2F7D68', bg: '#0A1424', locked: true },
  { id: 'advent', name: 'Advent', sw: '#8A4A22', bg: '#1A120E', locked: true },
  { id: 'easter', name: 'Easter dawn', sw: '#E8A9A0', bg: '#2A2238', locked: true },
];

export const ROWS: RowDef[] = [
  {
    slot: 'floor',
    label: 'Floor',
    items: [
      { id: 'rug', name: 'Woven rug', sw: '#2E4B5E', locked: false },
      { id: 'cushion', name: 'Prayer cushion', sw: '#1E2E5A', locked: true },
      { id: 'wreath', name: 'Lily wreath', sw: '#8DAA62', locked: true },
    ],
  },
  {
    slot: 'left',
    label: 'Left side',
    items: [
      { id: 'lantern', name: 'Lantern', sw: '#F2C462', locked: false },
      { id: 'censer', name: 'Incense', sw: '#B9BFC9', locked: true },
    ],
  },
  {
    slot: 'right',
    label: 'Right side',
    items: [
      { id: 'plant', name: 'Fig plant', sw: '#6E8B4E', locked: false },
      { id: 'scripture', name: 'Scripture stand', sw: '#C98760', locked: true },
    ],
  },
  {
    slot: 'wall',
    label: 'Wall',
    items: [
      { id: 'cross', name: 'Wooden cross', sw: '#7A5C3E', locked: false },
      { id: 'glass', name: 'Stained glass', sw: '#9C84E8', locked: true },
      { id: 'tapestry', name: 'Alpha & Omega', sw: '#C9A24B', locked: true },
    ],
  },
  {
    slot: 'hang',
    label: 'Overhead',
    items: [
      { id: 'lamp', name: 'Clay oil lamp', sw: '#B5734A', locked: false },
      { id: 'mobile', name: 'Star mobile', sw: '#F7E3B5', locked: true },
      { id: 'chimes', name: 'Chimes', sw: '#B5DCC6', locked: true },
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
