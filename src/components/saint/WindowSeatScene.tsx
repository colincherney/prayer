import React from 'react';
import { View } from 'react-native';
import Svg, {
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

// Wood-floor grain lines, spaced every 18px across the 402-wide floor.
// Same visual idea as the design's repeating <pattern>, expanded inline so
// we don't depend on react-native-svg's pattern fill (uneven Android support).
const FLOOR_GRAIN_X = Array.from({ length: 23 }, (_, i) => 6 + i * 18);

export const WindowSeatScene: React.FC = () => (
  <View style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} pointerEvents="none">
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 402 874"
      preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="wall-w" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e8d8be" />
          <Stop offset="1" stopColor="#c9b189" />
        </LinearGradient>
        <LinearGradient id="sky-w" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f3cdb6" />
          <Stop offset="0.35" stopColor="#f5b8a0" />
          <Stop offset="0.7" stopColor="#f7d49a" />
          <Stop offset="1" stopColor="#f9e4b1" />
        </LinearGradient>
        <RadialGradient id="sun-w" cx="0.55" cy="0.7" rx="0.42" ry="0.42" fx="0.55" fy="0.7">
          <Stop offset="0" stopColor="#fff5d6" stopOpacity={1} />
          <Stop offset="0.3" stopColor="#fde2a8" stopOpacity={0.85} />
          <Stop offset="0.7" stopColor="#f4b78a" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#f4b78a" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="beam-w" cx="0.5" cy="0.18" rx="0.7" ry="0.7" fx="0.5" fy="0.18">
          <Stop offset="0" stopColor="#fff1c8" stopOpacity={0.5} />
          <Stop offset="0.6" stopColor="#f7d49a" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#f7d49a" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* wall */}
      <Rect width="402" height="874" fill="url(#wall-w)" />

      {/* Arched window: shadow halo behind the frame */}
      <Path
        d="M 46 700 L 46 280 Q 46 78 201 78 Q 356 78 356 280 L 356 700 Z"
        fill="#3a2a18"
        opacity={0.22}
      />
      {/* outer arch frame */}
      <Path
        d="M 54 700 L 54 282 Q 54 86 201 86 Q 348 86 348 282 L 348 700 Z"
        fill="#3a2a18"
      />
      {/* inner sky */}
      <Path
        d="M 70 696 L 70 286 Q 70 102 201 102 Q 332 102 332 286 L 332 696 Z"
        fill="url(#sky-w)"
      />
      {/* sun wash inside the window pane */}
      <Rect x="70" y="102" width="262" height="594" fill="url(#sun-w)" />
      {/* horizon hills */}
      <Path
        d="M 70 540 Q 130 500 200 524 Q 270 548 332 514 L 332 696 L 70 696 Z"
        fill="#b78566"
        opacity={0.7}
      />
      <Path
        d="M 70 580 Q 140 558 220 572 Q 290 582 332 560 L 332 696 L 70 696 Z"
        fill="#8d5d44"
        opacity={0.65}
      />
      {/* distant chapel */}
      <G translateX={248} translateY={512}>
        <Rect x="-12" y="-8" width="24" height="22" fill="#5e3d28" />
        <Path d="M -14 -8 L 14 -8 L 0 -24 Z" fill="#5e3d28" />
        <Rect x="-1" y="-32" width="2" height="10" fill="#5e3d28" />
        <Line x1="-3" y1="-28" x2="3" y2="-28" stroke="#5e3d28" strokeWidth={2} />
      </G>
      {/* mullions */}
      <Line x1="201" y1="102" x2="201" y2="696" stroke="#3a2a18" strokeWidth={6} />
      <Line x1="70" y1="410" x2="332" y2="410" stroke="#3a2a18" strokeWidth={6} />
      <Path
        d="M 70 286 Q 70 102 201 102 Q 332 102 332 286"
        fill="none"
        stroke="#3a2a18"
        strokeWidth={6}
      />
      {/* sill */}
      <Rect x="44" y="696" width="316" height="14" fill="#54381f" />
      <Rect x="44" y="710" width="316" height="6" fill="#3a2a18" />

      {/* beam of light spilling out from the window */}
      <Path d="M 70 696 L 332 696 L 392 874 L 10 874 Z" fill="url(#beam-w)" />

      {/* cushion on sill */}
      <G translateX={201} translateY={696}>
        <Ellipse cx="0" cy="0" rx="180" ry="10" fill="#000" opacity={0.25} />
        <Path
          d="M -150 -4 Q -160 -30 -120 -38 L 120 -38 Q 160 -30 150 -4 Z"
          fill="#d9b691"
          stroke="#a8835f"
          strokeWidth={1}
        />
        <Path
          d="M -150 -4 Q -160 -30 -120 -38"
          fill="none"
          stroke="#a8835f"
          strokeWidth={1}
          opacity={0.7}
        />
        {/* tassel */}
        <Ellipse cx="-130" cy="-2" rx="6" ry="6" fill="#c25a36" />
        <Line x1="-130" y1="2" x2="-130" y2="14" stroke="#c25a36" strokeWidth={2} />
      </G>

      {/* small bible sitting on sill, right side */}
      <G translateX={280} translateY={668}>
        <Rect x="-30" y="-3" width="60" height="6" fill="#1f2a3a" />
        <Rect x="-30" y="-8" width="60" height="6" fill="#27384e" />
        <Rect x="-2" y="-12" width="4" height="14" fill="#c25a36" />
      </G>

      {/* floor */}
      <Rect x="0" y="716" width="402" height="158" fill="#7a5435" />
      {FLOOR_GRAIN_X.map(x => (
        <Line
          key={x}
          x1={x}
          y1={716}
          x2={x + 3}
          y2={874}
          stroke="#000"
          strokeWidth={0.3}
          opacity={0.18}
        />
      ))}
    </Svg>
  </View>
);
