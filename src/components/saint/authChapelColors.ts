// The colours of the 3D chapel on the sign-in screen, matched to the home wallpaper that's picked (or the event look
// that's on): a snowy chapel for the Long Winter, a marble and rose one for the Beloved, a mossy one in the fen, and so
// on. Wallpapers without their own set get one worked out from their palette (its sky, accent and soft accent).

import type { PrayerRoomName, PrayerRoomPalette } from './prayerRoom';
import { mixColors } from './theme';

export const CHAPEL_COLOR_KEYS = [
  // the floating island: four rock faces, the grass on top and the three paving stones
  'rock0', 'rock1', 'rock2', 'rock3', 'earth', 'path0', 'path1', 'path2',
  // the chapel
  'wall', 'pale', 'door', 'roof', 'roof2', 'trim', 'glass', 'glass2', 'gold', 'goldGlow',
  // the garden
  'leaves0', 'leaves1', 'leaves2', 'bark', 'boulder', 'flame',
  // the rings and drifting motes, and the light
  'ring', 'motes', 'sky', 'ground', 'key', 'edge',
] as const;
export type ChapelColorKey = (typeof CHAPEL_COLOR_KEYS)[number];
export type ChapelColors = Record<ChapelColorKey, string>;

/** The original dusk chapel (also what the still poster shows). */
export const DEFAULT_CHAPEL_COLORS: ChapelColors = {
  rock0: '#263B5B', rock1: '#485675', rock2: '#172A45', rock3: '#324664', earth: '#677568',
  path0: '#B9A18A', path1: '#847F78', path2: '#C9B29D',
  wall: '#A19487', pale: '#C6B8A3', door: '#343650', roof: '#414865', roof2: '#505573', trim: '#52556F',
  glass: '#FFC764', glass2: '#F0A16D', gold: '#E7B875', goldGlow: '#825527',
  leaves0: '#5D8979', leaves1: '#799A7C', leaves2: '#3E6C65', bark: '#665951', boulder: '#718392', flame: '#FFD993',
  ring: '#EEC38B', motes: '#FCE3AF', sky: '#ABC9F7', ground: '#89644F', key: '#FFE1AE', edge: '#87B4FF',
};

/** Hand-made sets for the wallpapers that deserve one; everything else falls back to `derive`. */
const ROOM_CHAPELS: Partial<Record<PrayerRoomName, Partial<ChapelColors>>> = {
  // Lamplit Corner: the original dusk chapel
  lamp: {},
  // The Long Winter: snow on the island and the roof, ice-blue rock, aurora-teal glass
  winter: {
    rock0: '#3A5680', rock1: '#5A7AA6', rock2: '#24395E', rock3: '#4A6894', earth: '#E8F0F8',
    path0: '#C9D9F0', path1: '#A6B8D2', path2: '#DCE6F4',
    wall: '#D8DEE8', pale: '#F4F6FA', door: '#22306A', roof: '#E6EEF8', roof2: '#C9D9F0', trim: '#7F95BC',
    glass: '#E9C46A', glass2: '#5FE3C0', gold: '#E9C46A',
    leaves0: '#E8F0F8', leaves1: '#C9D9F0', leaves2: '#2E5A5E', bark: '#4A5468', boulder: '#9FB6D6', flame: '#BFE6FF',
    ring: '#5FE3C0', motes: '#FFFFFF', sky: '#9FDDF8', ground: '#5A6E9A', key: '#E6F2FF', edge: '#5FE3C0',
  },
  // The Beloved: a marble chapel with a rose roof in a rose garden, blush light
  beloved: {
    rock0: '#E3C9C4', rock1: '#F0DAD4', rock2: '#CDAFAA', rock3: '#E8D2CB', earth: '#8FA872',
    path0: '#F4EDE2', path1: '#E3D6CA', path2: '#FFF8F5',
    wall: '#F4EBE4', pale: '#FFF8F5', door: '#8A3A52', roof: '#C2546F', roof2: '#D86A84', trim: '#E3D4C8',
    glass: '#F4B6C4', glass2: '#E8879B', gold: '#C9A35A',
    leaves0: '#8FA872', leaves1: '#E07C93', leaves2: '#7E9A64', bark: '#8A6A5A', boulder: '#E8879B', flame: '#FFC2D0',
    ring: '#E8879B', motes: '#FFFFFF', sky: '#FFE3EA', ground: '#C99AA6', key: '#FFF1EC', edge: '#F4B6C4',
  },
  // The Swamp King: dark wood and moss, a mossy roof, wisp-blue glass, dusk-violet light
  swamp: {
    rock0: '#3B3348', rock1: '#4A4058', rock2: '#2A2436', rock3: '#3E4A3C', earth: '#3E6B4A',
    path0: '#6A5440', path1: '#4A3A2C', path2: '#7A6450',
    wall: '#5A4A3C', pale: '#7A6A58', door: '#1B1622', roof: '#3E6B4A', roof2: '#5E8A4E', trim: '#36291F',
    glass: '#6FC3FF', glass2: '#C9A35A', gold: '#C9A35A',
    leaves0: '#2E4A3A', leaves1: '#3E6B4A', leaves2: '#253024', bark: '#36291F', boulder: '#4A5A4A', flame: '#6FC3FF',
    ring: '#6FC3FF', motes: '#F2D27A', sky: '#C9B8D8', ground: '#2A3644', key: '#E8B97A', edge: '#6FC3FF',
  },
  // The Sword of the Spirit: ice-white walls, navy door and roof, sky-blue glass, gold trim, teal night light
  sword: {
    rock0: '#163A4C', rock1: '#1E4A5E', rock2: '#0E2A3A', rock3: '#22566A', earth: '#3FA9C9',
    path0: '#BFEAF6', path1: '#8FC8DA', path2: '#E6F8FF',
    wall: '#E6F8FF', pale: '#FFFFFF', door: '#2A3A4E', roof: '#2A3A4E', roof2: '#3B4E66', trim: '#D8B45A',
    glass: '#7FDDF2', glass2: '#D8B45A', gold: '#D8B45A',
    leaves0: '#3FA9C9', leaves1: '#7FDDF2', leaves2: '#1E5F7A', bark: '#2A3A4E', boulder: '#5A8AA0', flame: '#BFEAF6',
    ring: '#7FDDF2', motes: '#FFFFFF', sky: '#BFEAF6', ground: '#163A4C', key: '#E6F8FF', edge: '#7FDDF2',
  },
  // God With Us: a white chapel in the snow, red trim, warm candlelit glass
  christmas: {
    rock0: '#1C2B4C', rock1: '#2C3E64', rock2: '#122040', rock3: '#24365A', earth: '#F2F4F8',
    path0: '#D8DEE8', path1: '#B8C2D2', path2: '#E8ECF2',
    wall: '#E8E2D6', pale: '#F6F2EA', door: '#8A2A24', roof: '#F0F2F6', roof2: '#D8DEE8', trim: '#C9433A',
    glass: '#F2C462', glass2: '#C9433A', gold: '#F2C462',
    leaves0: '#2E5A3E', leaves1: '#F2F4F8', leaves2: '#1E4A30', bark: '#4A3A30', boulder: '#B8C2D2', flame: '#F2C462',
    ring: '#F2C462', motes: '#FFFFFF', sky: '#B8D0F0', ground: '#4A5A7A', key: '#FFE8C0', edge: '#8FB0E8',
  },
  // All Hallows' Eve: plum stone, autumn trees, pumpkin-orange glass
  halloween: {
    rock0: '#2A2048', rock1: '#3A2E5A', rock2: '#1C1636', rock3: '#322650', earth: '#5A4A2E',
    path0: '#8A6A4A', path1: '#6A5040', path2: '#9A7A58',
    wall: '#6A5A6E', pale: '#8A7A88', door: '#2A1A2A', roof: '#3A2A4A', roof2: '#4A3A5A', trim: '#2A2038',
    glass: '#E8913A', glass2: '#F2C462', gold: '#E8913A',
    leaves0: '#B8702C', leaves1: '#E8913A', leaves2: '#7A3A1E', bark: '#3A2A20', boulder: '#5A4A6A', flame: '#E8913A',
    ring: '#E8913A', motes: '#F2C462', sky: '#8A7ACB', ground: '#3A2A20', key: '#FFD08A', edge: '#9A7AE8',
  },
  // Give Thanks: honey stone, a terracotta roof and golden fields
  thanksgiving: {
    rock0: '#8A6A44', rock1: '#A6845A', rock2: '#6A5034', rock3: '#9A7A50', earth: '#C9A24B',
    path0: '#E8D2A8', path1: '#C9AE84', path2: '#F3DDB2',
    wall: '#E3CDA4', pale: '#F3E2C2', door: '#5A3A22', roof: '#B5562E', roof2: '#C8643C', trim: '#7A4A2A',
    glass: '#F2C462', glass2: '#E8913A', gold: '#E9B44A',
    leaves0: '#C8643C', leaves1: '#E8A24B', leaves2: '#8A4A22', bark: '#5A3A22', boulder: '#B89B78', flame: '#F2C462',
    ring: '#E8A24B', motes: '#FFE3A8', sky: '#FFE6B8', ground: '#8A5A34', key: '#FFE1AE', edge: '#F2B66A',
  },
  // Window Seat: warm cream walls, a terracotta roof, daylight
  window: {
    rock0: '#9C8062', rock1: '#B89B78', rock2: '#8A6E52', rock3: '#C9AE8A', earth: '#8FA66E',
    path0: '#E8D8BE', path1: '#C9B496', path2: '#F3E6CC',
    wall: '#E8D8BE', pale: '#F3E6CC', door: '#27384E', roof: '#C25A36', roof2: '#DBA087', trim: '#7A5A3C',
    glass: '#FFD58A', glass2: '#DBA087', gold: '#E7B875',
    sky: '#FFF1D8', ground: '#B08A60', key: '#FFF4E0', edge: '#FFD8B0',
  },
  // Rainforest Vigil: deep green stone, a mossy roof, fireflies
  jungle: {
    rock0: '#16303A', rock1: '#24484A', rock2: '#0C2028', rock3: '#1E3C40', earth: '#3E7A5A',
    roof: '#2E5A4A', roof2: '#3E7A5A', trim: '#1E3C34', glass: '#C8F28A', glass2: '#7EC9A8',
    leaves0: '#2E7A5A', leaves1: '#4F8F72', leaves2: '#1E5A40', flame: '#C8F28A',
    ring: '#7EC9A8', motes: '#C8F28A', sky: '#7EC9A8', edge: '#4F8F72',
  },
};

/** A set worked out from a wallpaper's palette: rock from its sky, the roof and glass from its accents. */
function derive(p: PrayerRoomPalette): ChapelColors {
  const dark = p.statusBar === 'light-content';
  const base = dark ? mixColors(p.bg, '#FFFFFF', 0.14) : mixColors(p.bg, '#000000', 0.32);
  const roof = dark ? mixColors(p.bgSoft, '#FFFFFF', 0.16) : mixColors(p.accent, '#000000', 0.12);
  return {
    ...DEFAULT_CHAPEL_COLORS,
    rock0: base, rock1: mixColors(base, '#FFFFFF', 0.16), rock2: mixColors(base, '#000000', 0.22), rock3: mixColors(base, '#FFFFFF', 0.07),
    earth: mixColors(DEFAULT_CHAPEL_COLORS.earth, p.accentSoft, 0.35),
    wall: mixColors(DEFAULT_CHAPEL_COLORS.wall, p.accent, 0.16),
    pale: mixColors(DEFAULT_CHAPEL_COLORS.pale, p.accent, 0.12),
    door: mixColors(p.bg, '#000000', 0.25),
    roof, roof2: mixColors(roof, '#FFFFFF', 0.12), trim: mixColors(roof, '#000000', 0.12),
    glass: mixColors('#FFC764', p.accent, 0.45), glass2: p.accent,
    leaves0: mixColors(DEFAULT_CHAPEL_COLORS.leaves0, p.accent, 0.15),
    leaves1: mixColors(DEFAULT_CHAPEL_COLORS.leaves1, p.accentSoft, 0.2),
    flame: mixColors('#FFD993', p.accent, 0.3),
    ring: mixColors('#EEC38B', p.accent, 0.5), motes: mixColors('#FCE3AF', p.accent, 0.3),
    sky: mixColors('#ABC9F7', p.accent, 0.35), ground: mixColors('#89644F', p.bg, 0.3),
    key: mixColors('#FFE1AE', p.accent, 0.2), edge: mixColors('#87B4FF', p.accentSoft, 0.4),
  };
}

/** The chapel's colours for a wallpaper. */
export function chapelColorsFor(room: PrayerRoomName, palette: PrayerRoomPalette): ChapelColors {
  const own = ROOM_CHAPELS[room];
  return own ? { ...DEFAULT_CHAPEL_COLORS, ...own } : derive(palette);
}
