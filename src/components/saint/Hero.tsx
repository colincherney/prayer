import React from 'react';
import Svg, { Defs, Ellipse, Path, RadialGradient, Rect, Stop, G, Polygon, Circle } from 'react-native-svg';

const PALETTE = {
  sky: '#EFE5D0',
  hill: '#C9B98E',
  church: '#D9C9A4',
  cross: '#7A6240',
  stone: '#B8A47A',
  leaf: '#D88A52',
};

export const HeroIllustration: React.FC<{ width?: number; height?: number }> = ({
  width = 200,
  height = 220,
}) => (
  <Svg width={width} height={height} viewBox="0 0 220 220">
    <Defs>
      <RadialGradient id="sky" cx="50%" cy="40%" rx="60%" ry="60%">
        <Stop offset="0" stopColor={PALETTE.sky} stopOpacity={0.9} />
        <Stop offset="1" stopColor={PALETTE.sky} stopOpacity={0} />
      </RadialGradient>
    </Defs>

    <Rect width={220} height={220} fill="url(#sky)" />

    {/* distant hill */}
    <Path
      d="M 0 150 Q 60 130 110 138 T 220 145 L 220 220 L 0 220 Z"
      fill={PALETTE.hill}
      opacity={0.55}
    />

    {/* path stones */}
    <G opacity={0.85}>
      <Ellipse cx={60} cy={195} rx={18} ry={6} fill={PALETTE.stone} opacity={0.7} />
      <Ellipse cx={85} cy={180} rx={14} ry={5} fill={PALETTE.stone} opacity={0.75} />
      <Ellipse cx={105} cy={168} rx={12} ry={4.5} fill={PALETTE.stone} opacity={0.8} />
      <Ellipse cx={120} cy={158} rx={10} ry={4} fill={PALETTE.stone} opacity={0.85} />
      <Ellipse cx={132} cy={150} rx={9} ry={3.5} fill={PALETTE.stone} opacity={0.9} />
    </G>

    {/* church (translated to 150,118) */}
    <G opacity={0.92}>
      <Rect x={150} y={128} width={22} height={18} fill={PALETTE.church} />
      <Polygon points="150,128 161,118 172,128" fill={PALETTE.cross} opacity={0.7} />
      <Rect x={159} y={134} width={4} height={8} fill={PALETTE.cross} opacity={0.6} />
      <Rect x={160} y={114} width={2} height={6} fill={PALETTE.cross} />
      <Rect x={158} y={116} width={6} height={2} fill={PALETTE.cross} />
    </G>

    {/* cross on hill — focal (translated to 120,70) */}
    <G>
      <Rect x={118} y={70} width={4} height={70} fill={PALETTE.cross} />
      <Rect x={106} y={88} width={28} height={4} fill={PALETTE.cross} />
      <Ellipse cx={120} cy={142} rx={14} ry={3} fill={PALETTE.cross} opacity={0.2} />
    </G>

    {/* leaves on right */}
    <G opacity={0.85}>
      <Path
        d="M 175 130 Q 180 115 185 130 Q 188 118 192 130"
        stroke={PALETTE.leaf}
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={180} cy={120} r={3} fill={PALETTE.leaf} opacity={0.8} />
      <Circle cx={188} cy={115} r={2.5} fill={PALETTE.leaf} opacity={0.7} />
      <Circle cx={195} cy={125} r={2} fill={PALETTE.leaf} opacity={0.75} />
      <Path
        d="M 170 200 Q 175 180 180 200"
        stroke={PALETTE.hill}
        strokeWidth={1.2}
        fill="none"
        opacity={0.6}
      />
      <Path
        d="M 195 205 Q 200 188 205 205"
        stroke={PALETTE.hill}
        strokeWidth={1.2}
        fill="none"
        opacity={0.6}
      />
    </G>

    {/* ground wash */}
    <Rect y={200} width={220} height={20} fill={PALETTE.hill} opacity={0.25} />
  </Svg>
);
