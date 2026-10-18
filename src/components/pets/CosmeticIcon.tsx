import React from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

export type CosmeticKind = 'scene' | 'item' | 'bundle';

type Props = {
  kind: CosmeticKind;
  /** Scene id, item id, or anything for the bundle. */
  id: string;
  size?: number;
};

const STAR = 'M16 5 L18 14 L27 16 L18 18 L16 27 L14 18 L5 16 L14 14 Z';

/** A small circular thumbnail of a nook scene, drawn from the same colors as the scene itself. */
function SceneArt({ id }: { id: string }) {
  switch (id) {
    case 'night':
      return (
        <>
          <Rect width={32} height={32} fill="#0D1828" />
          <Circle cx={22} cy={10} r={5} fill="#F2E9D8" />
          <Circle cx={24.5} cy={8.5} r={4.5} fill="#0D1828" />
          <G fill="#F2E9D8">
            <Circle cx={8} cy={9} r={1} />
            <Circle cx={14} cy={17} r={0.8} />
            <Circle cx={25} cy={22} r={0.9} />
            <Circle cx={9} cy={24} r={0.8} />
          </G>
        </>
      );
    case 'chapel':
      return (
        <>
          <Rect width={32} height={32} fill="#17141F" />
          <Polygon points="12,15 20,15 24,28 8,28" fill="#F2C462" opacity={0.25} />
          <Path d="M11 24 V14 A5 5 0 0 1 21 14 V24 Z" fill="#2A2236" stroke="#C9A24B" strokeWidth={1.4} />
          <Path d="M16 9 V24 M11 17 H21" stroke="#C9A24B" strokeWidth={1} />
          <Rect x={0} y={25} width={32} height={7} fill="#1F1A28" />
        </>
      );
    case 'grove':
      return (
        <>
          <Rect width={32} height={32} fill="#12211C" />
          <Circle cx={23} cy={9} r={7} fill="#F2C462" opacity={0.25} />
          <Circle cx={23} cy={9} r={3} fill="#F2C462" opacity={0.85} />
          <Ellipse cx={16} cy={32} rx={20} ry={9} fill="#1E3A2E" />
          <Path d="M8 26 C9 22 8 20 9 17" stroke="#3A3026" strokeWidth={2} fill="none" strokeLinecap="round" />
          <G fill="#2F4B3A">
            <Circle cx={8} cy={15} r={5} />
            <Circle cx={12} cy={13} r={4} />
          </G>
        </>
      );
    case 'desert':
      return (
        <>
          <Rect width={32} height={32} fill="#1B1730" />
          <Circle cx={22} cy={10} r={7} fill="#F7E3B5" opacity={0.2} />
          <Path d="M22 5 L23 9 L27 10 L23 11 L22 15 L21 11 L17 10 L21 9 Z" fill="#FFF3C4" />
          <Path d="M0 22 C6 18 12 19 18 22 C24 25 28 22 32 20 V32 H0 Z" fill="#3A2E3A" />
          <Path d="M0 27 C8 24 14 26 20 28 C25 29 29 27 32 26 V32 H0 Z" fill="#4A3A40" />
        </>
      );
    case 'meadow':
      return (
        <>
          <Rect width={32} height={32} fill="#10251F" />
          <Ellipse cx={9} cy={32} rx={20} ry={11} fill="#173A2E" />
          <Ellipse cx={26} cy={33} rx={16} ry={9} fill="#1C4636" />
          <G fill="#F2E07A">
            <Circle cx={8} cy={13} r={1.4} />
            <Circle cx={22} cy={10} r={1.2} />
            <Circle cx={26} cy={17} r={1.4} />
          </G>
          <G fill="#E8998A">
            <Circle cx={6} cy={25} r={1.8} />
            <Circle cx={24} cy={26} r={1.8} />
          </G>
          <G fill="#F7F2E8">
            <Circle cx={15} cy={27} r={1.5} />
            <Circle cx={29} cy={23} r={1.4} />
          </G>
        </>
      );
    case 'aurora':
      return (
        <>
          <Rect width={32} height={32} fill="#0A1424" />
          <Path d="M0 10 C6 5 12 14 18 9 C23 5 28 11 32 8 V17 C27 20 23 14 18 18 C12 23 6 15 0 19 Z" fill="#5FD3A8" opacity={0.5} />
          <Path d="M0 17 C7 12 13 20 19 15 C24 12 28 17 32 14 V22 C28 25 24 20 19 23 C13 27 7 21 0 25 Z" fill="#9C84E8" opacity={0.4} />
          <G fill="#F2E9D8">
            <Circle cx={6} cy={6} r={0.9} />
            <Circle cx={25} cy={5} r={0.8} />
          </G>
        </>
      );
    case 'advent':
      return (
        <>
          <Rect width={32} height={32} fill="#1A120E" />
          <G fill="#F2A93B" opacity={0.45}>
            <Circle cx={7} cy={17} r={4} />
            <Circle cx={25} cy={20} r={5} />
            <Circle cx={16} cy={25} r={3} />
          </G>
          <Path d="M-2 6 Q8 13 16 8 Q24 13 34 6" stroke="#2F5B3A" strokeWidth={3} fill="none" strokeLinecap="round" />
          <G fill="#C0453A">
            <Circle cx={5} cy={9} r={1.4} />
            <Circle cx={11} cy={11} r={1.4} />
            <Circle cx={16} cy={8} r={1.4} />
            <Circle cx={22} cy={11} r={1.4} />
            <Circle cx={27} cy={9} r={1.4} />
          </G>
          <Rect x={0} y={27} width={32} height={5} fill="#24180F" />
        </>
      );
    case 'harvest':
      return (
        <>
          <Rect width={32} height={32} fill="#140F2A" />
          <Rect x={0} y={12} width={32} height={12} fill="#5A2F4A" opacity={0.3} />
          <Circle cx={22} cy={9} r={8} fill="#F6E2B0" opacity={0.2} />
          <Circle cx={22} cy={9} r={5} fill="#F4E3B5" />
          <G fill="#F2E9D8">
            <Circle cx={7} cy={6} r={0.9} />
            <Circle cx={13} cy={12} r={0.8} />
            <Circle cx={28} cy={18} r={0.8} />
          </G>
          <Path d="M0 21 C8 17 16 19 24 18 C28 17.5 31 18 32 17.5 V32 H0 Z" fill="#2A1B3A" />
          <G fill="#1E1430">
            <Rect x={5} y={15} width={6} height={6} />
            <Polygon points="4.5,15.2 8,12 11.5,15.2" />
          </G>
          <Path d="M0 26 C9 23 18 25 26 23.5 C29 23 31 23.5 32 23 V32 H0 Z" fill="#22162F" />
          <G>
            <Ellipse cx={10} cy={27} rx={3.2} ry={3.4} fill="#E07E34" />
            <Rect x={9.4} y={22.8} width={1.2} height={1.6} fill="#4A2E1A" />
            <Ellipse cx={23} cy={28} rx={2.6} ry={2.8} fill="#C9672A" />
          </G>
        </>
      );
    default:
      return (
        <>
          <Rect width={32} height={32} fill="#2A2238" />
          <Rect x={0} y={14} width={32} height={10} fill="#E8A9A0" opacity={0.18} />
          <Circle cx={16} cy={24} r={9} fill="#F7E3B5" opacity={0.25} />
          <Circle cx={16} cy={24} r={5} fill="#FFF3C4" opacity={0.9} />
          <Path d="M-2 25 C6 22 11 23 16 24 C22 25 27 22 34 22 V32 H-2 Z" fill="#3A2E48" />
          <Path d="M7 20 V25 M5 22 H9 M12 19 V24 M10 21 H14" stroke="#1E1830" strokeWidth={1} />
        </>
      );
  }
}

/** A small glyph for a piece of decor. Drawn on a transparent 32x32 canvas. */
function ItemArt({ id }: { id: string }) {
  switch (id) {
    case 'rug':
      return (
        <>
          <Ellipse cx={16} cy={19} rx={13} ry={7} fill="#2E4B5E" />
          <Ellipse cx={16} cy={19} rx={10} ry={4.6} fill="none" stroke="#8FC6A9" strokeWidth={1.2} strokeDasharray="2 2.4" />
        </>
      );
    case 'cushion':
      return (
        <>
          <Rect x={4} y={13} width={24} height={11} rx={5} fill="#1E2E5A" stroke="#C9A24B" strokeWidth={1.4} />
          <Rect x={7} y={15} width={18} height={3.5} rx={1.7} fill="#2A3E72" />
          <G fill="#F2C462">
            <Circle cx={4.5} cy={13.5} r={1.6} />
            <Circle cx={27.5} cy={13.5} r={1.6} />
            <Circle cx={4.5} cy={23.5} r={1.6} />
            <Circle cx={27.5} cy={23.5} r={1.6} />
          </G>
        </>
      );
    case 'wreath':
      return (
        <>
          <Circle cx={16} cy={17} r={9} fill="none" stroke="#8DAA62" strokeWidth={5} />
          <Circle cx={16} cy={17} r={9} fill="none" stroke="#1E3326" strokeWidth={1} opacity={0.5} />
          <G fill="#FFFBF2">
            <Circle cx={16} cy={8} r={2} />
            <Circle cx={8} cy={13} r={1.8} />
            <Circle cx={24} cy={13} r={1.8} />
            <Circle cx={10} cy={24} r={1.8} />
            <Circle cx={22} cy={24} r={1.8} />
          </G>
        </>
      );
    case 'lantern':
      return (
        <>
          <Path d="M12 7 Q16 2 20 7" stroke="#C9A24B" strokeWidth={1.6} fill="none" />
          <Polygon points="10,10 16,6 22,10" fill="#C9A24B" />
          <Rect x={11} y={10} width={10} height={14} rx={2} fill="#2A2236" stroke="#C9A24B" strokeWidth={1.4} />
          <Ellipse cx={16} cy={17} rx={2.2} ry={3.8} fill="#FFE08A" />
          <Rect x={9} y={24} width={14} height={3} rx={1} fill="#C9A24B" />
        </>
      );
    case 'censer':
      return (
        <>
          <Path d="M16 13 C12 9 19 7 16 3" stroke="#E6E9EE" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Path d="M8 17 Q16 28 24 17 Z" fill="#B9BFC9" />
          <Path d="M9 17 Q16 9 23 17 Z" fill="#D6DBE2" />
          <Circle cx={16} cy={11} r={1.6} fill="#C9A24B" />
          <Rect x={14} y={24} width={4} height={4} fill="#8A6A45" />
          <Ellipse cx={16} cy={29} rx={7} ry={1.8} fill="#8A6A45" />
        </>
      );
    case 'plant':
      return (
        <>
          <Ellipse cx={16} cy={12} rx={2.6} ry={8} fill="#8DAA62" />
          <Ellipse cx={10} cy={15} rx={2.6} ry={7} fill="#6E8B4E" transform="rotate(-45 10 15)" />
          <Ellipse cx={22} cy={15} rx={2.6} ry={7} fill="#6E8B4E" transform="rotate(45 22 15)" />
          <Ellipse cx={13} cy={9} rx={2} ry={5} fill="#6E8B4E" transform="rotate(-20 13 9)" />
          <Rect x={8} y={21} width={16} height={3.5} rx={1.5} fill="#C98760" />
          <Polygon points="9.5,24.5 22.5,24.5 20.5,30 11.5,30" fill="#B5734A" />
        </>
      );
    case 'scripture':
      return (
        <>
          <Path d="M9 29 L16 17 L23 29" stroke="#8A6A45" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M4 16 L16 12 L16 4 L4 8 Z" fill="#F3EBDD" />
          <Path d="M28 16 L16 12 L16 4 L28 8 Z" fill="#FFF8EC" />
          <Path d="M6.5 9.5 L13.5 7.5 M6.5 12 L13.5 10 M18.5 7.5 L25.5 9.5 M18.5 10 L25.5 12" stroke="#C9B89A" strokeWidth={0.8} />
        </>
      );
    case 'cross':
      return (
        <>
          <Rect x={13.5} y={3} width={5} height={26} rx={1.5} fill="#7A5C3E" />
          <Rect x={6} y={10} width={20} height={5} rx={1.5} fill="#7A5C3E" />
        </>
      );
    case 'glass':
      return (
        <>
          <Path d="M5 29 V13 A11 9 0 0 1 27 13 V29" stroke="#C9A24B" strokeWidth={2} fill="none" />
          <Circle cx={10} cy={13} r={2.4} fill="#8FC6A9" />
          <Circle cx={16} cy={8.5} r={2.6} fill="#F2C462" />
          <Circle cx={22} cy={13} r={2.4} fill="#9C84E8" />
          <Circle cx={16} cy={19} r={2.4} fill="#E8998A" />
        </>
      );
    case 'tapestry':
      return (
        <>
          <Path d="M5 4 H27" stroke="#8A6A45" strokeWidth={1.6} strokeLinecap="round" />
          <Rect x={7} y={5} width={18} height={21} rx={1.5} fill="#3A2A4A" />
          <Rect x={8.5} y={6.5} width={15} height={18} rx={1} fill="none" stroke="#C9A24B" strokeWidth={0.9} />
          <SvgText x={16} y={14.5} textAnchor="middle" fontSize={7.5} fill="#F2C462">Α</SvgText>
          <SvgText x={16} y={22.5} textAnchor="middle" fontSize={7.5} fill="#F2C462">Ω</SvgText>
          <Path d="M9 26 V29 M12.5 26 V29 M16 26 V29 M19.5 26 V29 M23 26 V29" stroke="#C9A24B" strokeWidth={0.9} />
        </>
      );
    case 'lamp':
      return (
        <>
          <Path d="M16 1 V9" stroke="#8A6A45" strokeWidth={1.2} strokeDasharray="1.6 1.2" />
          <Circle cx={16} cy={16} r={9} fill="#F2A93B" opacity={0.25} />
          <Path d="M8 15 Q16 24 24 15 L22 12 L10 12 Z" fill="#B5734A" />
          <Path d="M22 12 L26 10.5 L24 14.5 Z" fill="#B5734A" />
          <Ellipse cx={26} cy={8} rx={1.6} ry={3} fill="#FFE08A" />
        </>
      );
    case 'mobile':
      return (
        <>
          <Path d="M16 1 V8 M5 8 H27" stroke="#C9A24B" strokeWidth={1.4} />
          <Path d="M7 8 V14 M16 8 V18 M25 8 V12" stroke="#C9A24B" strokeWidth={1} />
          <Path d="M7 14 l1 2.5 2.5 0.5 -2.5 0.5 -1 2.5 -1 -2.5 -2.5 -0.5 2.5 -0.5 Z" fill="#F2C462" />
          <Path d="M16 18 l1.3 3 3 0.7 -3 0.7 -1.3 3 -1.3 -3 -3 -0.7 3 -0.7 Z" fill="#F7E3B5" />
          <Path d="M25 12 l1 2.2 2.2 0.5 -2.2 0.5 -1 2.2 -1 -2.2 -2.2 -0.5 2.2 -0.5 Z" fill="#F2C462" />
        </>
      );
    case 'chimes':
      return (
        <>
          <Path d="M16 1 V7" stroke="#C9A24B" strokeWidth={1.2} />
          <Ellipse cx={16} cy={8} rx={9} ry={2.4} fill="#C9A24B" />
          <G fill="#B5DCC6">
            <Rect x={8.5} y={10} width={2.4} height={12} rx={1.2} />
            <Rect x={13} y={10} width={2.4} height={17} rx={1.2} />
            <Rect x={17.6} y={10} width={2.4} height={14} rx={1.2} />
            <Rect x={22} y={10} width={2.4} height={10} rx={1.2} />
          </G>
          <Circle cx={16} cy={29} r={1.8} fill="#C9A24B" />
        </>
      );
    case 'jackolantern':
      return (
        <>
          <Ellipse cx={10} cy={19} rx={6} ry={8} fill="#C9672A" />
          <Ellipse cx={22} cy={19} rx={6} ry={8} fill="#C9672A" />
          <Ellipse cx={16} cy={19} rx={8} ry={8.6} fill="#E07E34" />
          <Rect x={15} y={7.5} width={2} height={4} fill="#4A2E1A" />
          <Path d="M11 16 L13.4 13.6 L15.6 16 Z M21 16 L18.6 13.6 L16.4 16 Z" fill="#FFE08A" />
          <Path d="M11 21.5 Q16 26 21 21.5 Q16 23.6 11 21.5 Z" fill="#FFE08A" />
        </>
      );
    case 'hay':
      return (
        <>
          <Rect x={4} y={14} width={24} height={13} rx={4} fill="#D9B24A" />
          <Path d="M6 18 H26 M6 22 H26" stroke="#B8902E" strokeWidth={1} />
          <Path d="M8 14 l1.5 -4 M13 14 l-1 -5 M19 14 l1.5 -4.5 M24 14 l-1.5 -4" stroke="#E8C86A" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M11 14 V27 M21 14 V27" stroke="#9C7424" strokeWidth={1.4} />
        </>
      );
    case 'wheat':
      return (
        <>
          <Path d="M10 29 L12.5 12 M16 29 L16 9 M22 29 L19.5 12" stroke="#C9A24B" strokeWidth={1.8} strokeLinecap="round" />
          <G fill="#F2C462">
            <Ellipse cx={12.5} cy={9} rx={2.4} ry={5.4} />
            <Ellipse cx={16} cy={6} rx={2.4} ry={5.4} />
            <Ellipse cx={19.5} cy={9} rx={2.4} ry={5.4} />
          </G>
          <Path d="M10 21 L22 21" stroke="#C9433A" strokeWidth={2} />
        </>
      );
    case 'autumnwreath':
      return (
        <>
          <Circle cx={16} cy={16} r={9} fill="none" stroke="#6E8B4E" strokeWidth={4} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
            const a = (i * 45 * Math.PI) / 180;
            return (
              <Ellipse
                key={i}
                cx={16 + 9 * Math.cos(a)}
                cy={16 + 9 * Math.sin(a)}
                rx={3.4}
                ry={1.8}
                fill={['#C9433A', '#E8913A', '#F2C462'][i % 3]}
                transform={`rotate(${i * 45 + 90} ${16 + 9 * Math.cos(a)} ${16 + 9 * Math.sin(a)})`}
              />
            );
          })}
        </>
      );
    case 'web':
      return (
        <>
          <Path d="M2 2 L28 28 M2 2 L30 11 M2 2 L11 30" stroke="#B9BFC9" strokeWidth={0.9} />
          <Path d="M14 3 Q12 12 3 14 M22 5 Q19 19 5 22 M29 9 Q25 26 9 29" stroke="#B9BFC9" strokeWidth={0.9} fill="none" />
          <Path d="M20 2 V13" stroke="#B9BFC9" strokeWidth={0.8} />
          <Circle cx={20} cy={15} r={2.4} fill="#8A6FA6" />
          <Path d="M18 14 L15.5 12 M18 16 L15 17 M22 14 L24.5 12 M22 16 L25 17" stroke="#8A6FA6" strokeWidth={0.9} strokeLinecap="round" />
        </>
      );
    case 'bats':
      return (
        <>
          {[[16, 9, 0.9], [8, 20, 0.7], [24, 19, 0.75]].map(([x, y, sc], i) => (
            <G key={i} transform={`translate(${x} ${y}) scale(${sc})`}>
              <Path d="M0 0 Q-7 -6 -14 -2 Q-10 0 -8 4 Q-4 1 0 4 Q4 1 8 4 Q10 0 14 -2 Q7 -6 0 0 Z" fill="#8A6FA6" />
              <Ellipse cx={0} cy={1.5} rx={2.8} ry={4} fill="#8A6FA6" />
              <Circle cx={-1} cy={-0.5} r={0.7} fill="#F2C462" />
              <Circle cx={1} cy={-0.5} r={0.7} fill="#F2C462" />
            </G>
          ))}
        </>
      );
    case 'garland':
      return (
        <>
          <Path d="M2 6 Q16 20 30 6" stroke="#8A6A45" strokeWidth={1.4} fill="none" />
          {[[6, 9], [11.5, 12.2], [16, 13.2], [20.5, 12.2], [26, 9]].map(([x, y], i) => (
            <G key={i}>
              <Polygon points={`${x - 3},${y} ${x + 3},${y} ${x},${y + 8}`} fill="#E8913A" />
              <Polygon points={`${x - 3},${y} ${x + 3},${y} ${x + 2},${y + 2.6} ${x - 2},${y + 2.6}`} fill="#F2C462" />
              <Polygon points={`${x - 1},${y + 5.4} ${x + 1},${y + 5.4} ${x},${y + 8}`} fill="#FFFBF2" />
            </G>
          ))}
        </>
      );
    default:
      return <Path d={STAR} fill="#F2C462" />;
  }
}

/** Tiny picture for any nook cosmetic: scenes are round thumbnails, decor is a glyph, the bundle is a gold sparkle. */
export function CosmeticIcon({ kind, id, size = 28 }: Props) {
  if (kind === 'scene') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Defs>
          <ClipPath id={`clip-${id}`}>
            <Circle cx={16} cy={16} r={15.5} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#clip-${id})`}>
          <SceneArt id={id} />
        </G>
        <Circle cx={16} cy={16} r={15.5} fill="none" stroke="#3A4C60" strokeWidth={1} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {kind === 'bundle' ? (
        <>
          <Circle cx={16} cy={16} r={14} fill="#F2C462" opacity={0.18} />
          <Path d={STAR} fill="#F2C462" />
          <Circle cx={25} cy={7} r={1.6} fill="#F7E3B5" />
          <Circle cx={6} cy={25} r={1.3} fill="#F7E3B5" />
        </>
      ) : (
        <ItemArt id={id} />
      )}
    </Svg>
  );
}
