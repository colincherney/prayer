// Recolors pet art the way an SVG <feColorMatrix> filter would, without needing filter support: the monthly
// companions' radiant stages (and Dawn's chick) are drawn through color filters in design/ZodiacEvo.dc.html.
// Like the browser, the math runs in linear RGB.

type Matrix = [number, number, number, number, number, number, number, number, number, number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (c: number) => Math.min(1, Math.max(0, c));

function saturate(s: number): Matrix {
  return [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0,
  ];
}

/** Each step is a 3x4 matrix (rows R, G, B; the 4th column is the offset). Steps apply in order. */
const TINTS = {
  // Rory, Mountain Guardian: a snow-white tiger (saturate 0.1, then brightened).
  white: [saturate(0.1), [1.1, 0, 0, 0.12, 0, 1.1, 0, 0.13, 0, 0, 1.15, 0.17]],
  // Mochi of the Moon: cool moonlight.
  moon: [[0.9, 0, 0, 0.04, 0, 0.9, 0, 0.04, 0, 0, 1, 0.1]],
  // Long, Pearl Dragon: gold.
  gold: [[0.6, 0.5, 0.1, 0.1, 0.45, 0.45, 0.1, 0.05, 0.15, 0.2, 0.1, 0]],
  // Ribbon, Jade Coil: jade green.
  jade: [[0.6, 0, 0, 0, 0, 0.95, 0.1, 0, 0, 0.35, 0.75, 0.05]],
  // Eggshell Dawn: a yellow chick.
  chick: [[1, 0, 0, 0, 0, 0.92, 0, 0, 0, 0, 0.45, 0]],
} satisfies Record<string, Matrix[]>;

export type TintName = keyof typeof TINTS;

const cache = new Map<string, string>();

/** The color `hex` comes out as through the named filter. */
export function tint(name: TintName, hex: string): string {
  const key = `${name}${hex}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  let rgb = [0, 2, 4].map(i => toLinear(parseInt(h.slice(i, i + 2), 16) / 255));
  for (const m of TINTS[name]) {
    rgb = [0, 1, 2].map(r => clamp(m[r * 4] * rgb[0] + m[r * 4 + 1] * rgb[1] + m[r * 4 + 2] * rgb[2] + m[r * 4 + 3]));
  }
  const out = `#${rgb.map(c => Math.round(toSrgb(c) * 255).toString(16).padStart(2, '0')).join('')}`;
  cache.set(key, out);
  return out;
}
