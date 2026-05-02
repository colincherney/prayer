import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export const ShieldIcon: React.FC<IconProps> = ({ size = 12, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12">
    <Path
      d="M6 1 L10 2.5 V6 C10 8 8 10 6 11 C4 10 2 8 2 6 V2.5 Z"
      stroke={color}
      strokeWidth={1.2}
      fill="none"
    />
  </Svg>
);

export const PenIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path
      d="M3 13 L3 15 L5 15 L13 7 L11 5 Z M11 5 L13 3 L15 5 L13 7"
      stroke={color}
      strokeWidth={1.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

export const FlameIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path
      d="M9 2 C 9 5, 6 6, 6 10 C 6 13, 7.5 15, 9 15 C 10.5 15, 12 13, 12 10 C 12 8, 10.5 7.5, 10.5 6 C 10.5 4.5, 9 3, 9 2 Z"
      stroke={color}
      strokeWidth={1.4}
      fill="none"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path
      d="M9 2 L11 7 L16 7.5 L12 11 L13 16 L9 13.5 L5 16 L6 11 L2 7.5 L7 7 Z"
      stroke={color}
      strokeWidth={1.2}
      fill="none"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ArrowIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path
      d="M3 9 L14 9 M10 5 L14 9 L10 13"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path d="M3 5 L15 5 M3 9 L15 9 M3 13 L15 13" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path d="M4 4 L14 14 M14 4 L4 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

export const PrayingIcon: React.FC<IconProps> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path
      d="M11 3 C 10 5 8.5 6 7.5 8 C 6.5 10 6 13 7 16 L 9.5 18 L 11 17 L 11 6 Z"
      stroke={color}
      strokeWidth={1.3}
      fill="none"
      strokeLinejoin="round"
    />
    <Path
      d="M11 3 C 12 5 13.5 6 14.5 8 C 15.5 10 16 13 15 16 L 12.5 18 L 11 17 L 11 6 Z"
      stroke={color}
      strokeWidth={1.3}
      fill="none"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path
      d="M3 10 L11 3 L19 10 V18 H13 V13 H9 V18 H3 Z"
      stroke={color}
      strokeWidth={1.3}
      fill="none"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Circle cx={11} cy={8} r={3.5} stroke={color} strokeWidth={1.3} fill="none" />
    <Path
      d="M4 19 C 4 14, 8 13, 11 13 C 14 13, 18 14, 18 19"
      stroke={color}
      strokeWidth={1.3}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size = 12, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12">
    <Path d="M6 1 L7 5 L11 6 L7 7 L6 11 L5 7 L1 6 L5 5 Z" fill={color} opacity={0.7} />
  </Svg>
);

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = 18,
  color = 'currentColor',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path
      d="M9 15 C 4 12, 2 9, 2 6 C 2 4, 3.5 3, 5 3 C 6.5 3, 8 4, 9 5.5 C 10 4, 11.5 3, 13 3 C 14.5 3, 16 4, 16 6 C 16 9, 14 12, 9 15 Z"
      stroke={color}
      strokeWidth={1.4}
      strokeLinejoin="round"
      fill={filled ? color : 'none'}
    />
  </Svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 14 14">
    <Circle cx={7} cy={7} r={5.5} stroke={color} strokeWidth={1.2} fill="none" />
    <Path
      d="M7 1.5 C 4 4, 4 10, 7 12.5 M7 1.5 C 10 4, 10 10, 7 12.5"
      stroke={color}
      strokeWidth={1.2}
      fill="none"
    />
    <Path d="M1.5 7 H12.5" stroke={color} strokeWidth={1.2} />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 14 14">
    <Rect x={3} y={6} width={8} height={6} rx={1.2} stroke={color} strokeWidth={1.2} fill="none" />
    <Path
      d="M5 6 V4.5 C 5 3.2 6 2 7 2 C 8 2 9 3.2 9 4.5 V6"
      stroke={color}
      strokeWidth={1.2}
      fill="none"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path
      d="M3 9 L7 13 L15 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const MicIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Rect x={6.5} y={2} width={5} height={9} rx={2.5} stroke={color} strokeWidth={1.3} fill="none" />
    <Path
      d="M3.5 9 C 3.5 12, 6 14, 9 14 C 12 14, 14.5 12, 14.5 9 M 9 14 V16"
      stroke={color}
      strokeWidth={1.3}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export const BackIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path
      d="M10 3 L5 8 L10 13"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
