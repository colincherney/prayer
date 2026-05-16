import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const BOOK_SPINES: Array<[string, number]> = [
  ['#a83a26', 60],
  ['#c69a59', 54],
  ['#3a4f6a', 62],
  ['#7a4530', 50],
  ['#d4b87a', 58],
  ['#1f2a3a', 56],
  ['#c25a36', 60],
];

export const LamplitScene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 402 874"
      preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="wall-l" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1f2a3a" />
          <Stop offset="0.6" stopColor="#27384e" />
          <Stop offset="1" stopColor="#1a2433" />
        </LinearGradient>
        <RadialGradient id="lamp-l" cx="0.5" cy="0.42" rx="0.55" ry="0.55" fx="0.5" fy="0.42">
          <Stop offset="0" stopColor="#fff0c8" stopOpacity={0.65} />
          <Stop offset="0.25" stopColor="#f3c97a" stopOpacity={0.38} />
          <Stop offset="0.6" stopColor="#c08148" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#c08148" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="window-l"
          cx="0.18"
          cy="0.22"
          rx="0.22"
          ry="0.22"
          fx="0.18"
          fy="0.22">
          <Stop offset="0" stopColor="#f5cba2" stopOpacity={0.95} />
          <Stop offset="0.6" stopColor="#d99566" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#d99566" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="floor-pool"
          cx="0.5"
          cy="0.5"
          rx="0.5"
          ry="0.5"
          fx="0.5"
          fy="0.5">
          <Stop offset="0" stopColor="#f5cba2" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#f5cba2" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* base wall */}
      <Rect width="402" height="874" fill="url(#wall-l)" />

      {/* distant small window with dawn light */}
      <Rect x="40" y="170" width="64" height="98" rx="4" fill="#f3b88a" opacity={0.92} />
      <Line x1="72" y1="170" x2="72" y2="268" stroke="#1f2a3a" strokeWidth={2} />
      <Line x1="40" y1="219" x2="104" y2="219" stroke="#1f2a3a" strokeWidth={2} />
      <Rect
        x="36"
        y="166"
        width="72"
        height="106"
        fill="none"
        stroke="#0e1421"
        strokeWidth={4}
      />

      {/* dawn light wash spilling from the window */}
      <Rect width="402" height="874" fill="url(#window-l)" />

      {/* bookshelf behind chair (right side) */}
      <G translateX={280} translateY={210}>
        <Rect x="0" y="0" width="120" height="320" fill="#0e1421" />
        {[0, 1, 2, 3].map(i => (
          <G key={i} translateX={0} translateY={i * 80}>
            <Rect x="6" y="14" width="108" height="60" fill="#1a2433" />
            {BOOK_SPINES.map(([color, h], j) => (
              <Rect
                key={j}
                x={8 + j * 14.6}
                y={14 + (60 - h)}
                width="13"
                height={h}
                fill={color}
              />
            ))}
            <Rect x="6" y="74" width="108" height="6" fill="#3a2a18" />
          </G>
        ))}
      </G>

      {/* warm lamp halo over the upper-center, painted on top of the room */}
      <Rect width="402" height="874" fill="url(#lamp-l)" />

      {/* floor */}
      <Rect x="0" y="700" width="402" height="174" fill="#2a1f15" />
      <Ellipse cx="201" cy="720" rx="240" ry="48" fill="url(#floor-pool)" />

      {/* armchair (front, lower-left) */}
      <G translateX={150} translateY={580}>
        <Path d="M -20 0 Q -50 -80 60 -90 Q 170 -80 140 0 Z" fill="#5d3a26" />
        <Path d="M -20 0 Q -50 -80 60 -90 Q 170 -80 140 0 Z" fill="#000" opacity={0.18} />
        <Rect x="-40" y="-20" width="36" height="100" rx="14" fill="#6d4530" />
        <Rect x="140" y="-20" width="36" height="100" rx="14" fill="#5e3a25" />
        <Rect x="-20" y="40" width="160" height="50" rx="14" fill="#8a5a3c" />
        <Rect x="-16" y="44" width="152" height="6" rx="3" fill="#a8754f" opacity={0.7} />
        {/* tiny open bible resting on left armrest */}
        <G translateX={-22} translateY={-26} scale={0.32}>
          <Path
            d="M -100 -4 Q 0 -10 100 -4 L 100 4 Q 0 -2 -100 4 Z"
            fill="#e3b97a"
            opacity={0.9}
          />
          <Path
            d="M -100 0 Q -50 -8 0 -2 Q 50 -8 100 0 L 95 -68 Q 50 -76 0 -70 Q -50 -76 -95 -68 Z"
            fill="#f6ecd2"
            stroke="#b89968"
            strokeWidth={0.4}
          />
          <Path
            d="M 0 -2 Q -3 -36 0 -70"
            stroke="#a07f4f"
            strokeWidth={0.6}
            fill="none"
            opacity={0.4}
          />
        </G>
      </G>

      {/* side table + lamp (right of chair) */}
      <G translateX={338} translateY={560}>
        <Rect x="-30" y="60" width="60" height="80" fill="#3a2a18" />
        <Rect x="-34" y="56" width="68" height="10" fill="#54381f" />
        <Rect x="-3" y="20" width="6" height="40" fill="#7a4d22" />
        <Ellipse cx="0" cy="60" rx={14} ry={4} fill="#7a4d22" />
        <Path
          d="M -28 18 L 28 18 L 20 -22 L -20 -22 Z"
          fill="#c4a25a"
          stroke="#7a4d22"
          strokeWidth={1}
        />
        <Ellipse cx="0" cy="18" rx={28} ry={4} fill="#fff4d0" opacity={0.9} />
        {/* glow under the shade */}
        <Circle cx="0" cy="22" r={36} fill="#fff0c8" opacity={0.18} />
      </G>
    </Svg>
  </View>
);
