import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import { PrayerRoomName } from '@/components/saint/prayerRoom';
import { usePetProgress } from '@/lib/pet';

import { Pet } from './registry';

export type HomePetVariant = PrayerRoomName | 'theme';

type Spot = {
  size: number;
  /** Where the pet's feet are horizontally, as a share of the screen width. */
  x: number;
  /** Where its feet are vertically, in dp from the top of the hero area. */
  feetY: number;
};

// The artboard every pet is drawn on has a little empty space under the feet.
const FEET = 0.92;

/**
 * Where the companion sits on each home screen. These were measured against the room art on a 393-wide screen:
 * the window seat's right pane, the lamplit room's back bookshelf, the garden and jungle's open hero space,
 * and the theme illustration's stone path toward the church and cross.
 */
const SPOTS: Record<HomePetVariant, Spot> = {
  window: { size: 100, x: 0.68, feetY: 215 },
  lamp: { size: 100, x: 0.845, feetY: 151 },
  stars: { size: 124, x: 0.78, feetY: 163 },
  jungle: { size: 124, x: 0.78, feetY: 163 },
  // All Hallows' Eve: sitting on top of the big pumpkin in the scene.
  halloween: { size: 96, x: 0.744, feetY: 184 },
  theme: { size: 72, x: 0.644, feetY: 192 },
};

/** What the companion sits on, where the room art doesn't already give it somewhere to sit. */
function Perch({ variant, width, accent }: { variant: HomePetVariant; width: number; accent: string }) {
  const h = 40;
  const cx = width / 2;
  const rx = width * 0.46;
  switch (variant) {
    case 'window':
      // A little stack of two books.
      return (
        <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
          <Rect x={cx - 34} y={18} width={68} height={14} rx={2.5} fill="#1b2a3f" />
          <Rect x={cx - 34} y={18} width={68} height={10} rx={2.5} fill="#27384e" />
          <Rect x={cx - 31} y={29} width={62} height={2.6} rx={1.3} fill="#f3e6cc" />
          <Rect x={cx - 34} y={18} width={5} height={10} rx={2} fill="#14202f" />
          <Rect x={cx - 24} y={21.5} width={26} height={2} rx={1} fill="#f2c462" opacity={0.8} />
          <Rect x={cx - 25} y={9} width={50} height={10} rx={2.5} fill="#7a4d22" />
          <Rect x={cx - 22} y={17.2} width={44} height={2} rx={1} fill="#f3e6cc" />
          <Rect x={cx - 25} y={9} width={4} height={8} rx={1.5} fill="#54381f" />
        </Svg>
      );
    case 'stars':
      return (
        <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
          <Ellipse cx={cx} cy={24} rx={rx} ry={11} fill="#161b38" />
          <Ellipse cx={cx} cy={21} rx={rx} ry={11} fill="#2a3258" />
          <Ellipse cx={cx - rx * 0.25} cy={17} rx={rx * 0.5} ry={4} fill="#3a4468" />
          <G stroke="#2f4b3a" strokeWidth={2} strokeLinecap="round">
            <Path d={`M${cx - rx - 2} 30 l-3 -8 M${cx - rx + 4} 31 l1 -9`} />
            <Path d={`M${cx + rx + 2} 30 l3 -8 M${cx + rx - 4} 31 l-1 -9`} />
          </G>
        </Svg>
      );
    case 'jungle':
      return (
        <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
          <Path
            d={`M${cx - rx} 22 C${cx - rx * 0.5} 4 ${cx + rx * 0.5} 4 ${cx + rx} 22 C${cx + rx * 0.5} 38 ${cx - rx * 0.5} 38 ${cx - rx} 22 Z`}
            fill="#2d7a5a"
          />
          <Path d={`M${cx - rx} 22 H${cx + rx}`} stroke="#1d5448" strokeWidth={2} />
          <Path d={`M${cx - rx * 0.4} 22 l-8 -9 M${cx + rx * 0.1} 22 l-8 10 M${cx + rx * 0.5} 22 l-6 -8`} stroke="#1d5448" strokeWidth={1.4} />
        </Svg>
      );
    case 'theme':
      // The stone is already part of the illustration; just a soft shadow under the feet.
      return (
        <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
          <Ellipse cx={cx} cy={20} rx={rx * 0.7} ry={4} fill={accent} opacity={0.25} />
        </Svg>
      );
    default:
      // The bookshelf board in the lamplit room is where the pet sits, so nothing extra is drawn.
      return null;
  }
}

/**
 * The player's companion, sitting in the hero area of the home screen so it is part of whichever room or theme
 * is showing. Drop it inside the hero view (it positions itself absolutely). Tapping it plays its reaction.
 */
export function HomePet({ variant, accent = '#8FC6A9' }: { variant: HomePetVariant; accent?: string }) {
  const { petId, progress } = usePetProgress();
  const { width: screenW } = useWindowDimensions();
  const spot = SPOTS[variant];
  const perchW = Math.round(spot.size * 1.15);
  const petH = (spot.size * 260) / 240;
  const feetInPet = FEET * petH;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: spot.x * screenW - perchW / 2,
        top: spot.feetY - feetInPet,
        width: perchW,
        height: petH + 30,
        alignItems: 'center',
      }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: feetInPet - 14 }}>
        <Perch variant={variant} width={perchW} accent={accent} />
      </View>
      <Pet id={petId} stage={progress.stage} size={spot.size} interactive />
    </View>
  );
}
