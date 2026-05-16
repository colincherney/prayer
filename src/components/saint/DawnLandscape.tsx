import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Stop, Circle, Rect } from 'react-native-svg';

// ── MeDawnHero — compact landscape behind the Me page title ────────────────
export const MeDawnHero: React.FC<{ height?: number; style?: StyleProp<ViewStyle> }> = ({
  height = 360,
  style,
}) => (
  <View style={[{ height, width: '100%', overflow: 'hidden' }, style]}>
    <LinearGradient
      colors={['#f4d8b6', '#ecc8a8', '#e0bcb2', '#d4c1b6', '#f5ecdf']}
      locations={[0, 0.2, 0.4, 0.6, 1]}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
    {/* sun glow + sun */}
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 360"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Defs>
        <RadialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0%" stopColor="#fbe6c4" stopOpacity={1} />
          <Stop offset="35%" stopColor="#fbe6c4" stopOpacity={0.4} />
          <Stop offset="65%" stopColor="#fbe6c4" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="sunCore" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0%" stopColor="#fff4dc" stopOpacity={1} />
          <Stop offset="60%" stopColor="#f1cd96" stopOpacity={1} />
          <Stop offset="100%" stopColor="#f1cd96" stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id="meHill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#c7b59d" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#f5ecdf" stopOpacity={0.95} />
        </SvgLinearGradient>
      </Defs>

      {/* sun glow */}
      <Rect x={210} y={20} width={200} height={200} fill="url(#sunGlow)" />
      {/* sun core */}
      <Rect x={246} y={36} width={48} height={48} fill="url(#sunCore)" />

      {/* distant mountains */}
      <Path
        d="M0 220 L40 195 L80 210 L130 178 L180 205 L230 188 L290 210 L340 190 L400 205 L400 280 L0 280 Z"
        fill="#a09098"
        opacity={0.32}
      />

      {/* near hills */}
      <Path
        d="M0 290 C 80 250, 160 270, 240 260 C 320 250, 360 280, 400 270 L400 360 L0 360 Z"
        fill="url(#meHill)"
      />

      {/* warm dawn vignette overlay */}
      <Rect x={0} y={0} width={400} height={360} fill="url(#sunGlow)" opacity={0.12} />
    </Svg>

    {/* fade-to-bg at bottom for seamless transition */}
    <LinearGradient
      colors={['rgba(245,236,223,0)', '#f5ecdf']}
      locations={[0, 0.92]}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }}
    />
  </View>
);

// ── DawnLandscape — full-screen Journey Map landscape ──────────────────────
export const DawnLandscape: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }, style]}>
    <LinearGradient
      colors={[
        '#efddc1',
        '#e7c7ad',
        '#d9b3a8',
        '#b89db1',
        '#8e9eb8',
        '#6b7c9a',
      ]}
      locations={[0, 0.22, 0.42, 0.6, 0.8, 1]}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />

    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 874"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Defs>
        <RadialGradient id="dlSunGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0%" stopColor="#fbe6c4" stopOpacity={1} />
          <Stop offset="30%" stopColor="#fbe6c4" stopOpacity={0.4} />
          <Stop offset="60%" stopColor="#fbe6c4" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="dlSunCore" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0%" stopColor="#fff4dc" stopOpacity={1} />
          <Stop offset="60%" stopColor="#f1cd96" stopOpacity={1} />
          <Stop offset="100%" stopColor="#f1cd96" stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id="dlHillGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#5b6680" stopOpacity={1} />
          <Stop offset="100%" stopColor="#3a445c" stopOpacity={1} />
        </SvgLinearGradient>
        <SvgLinearGradient id="dlRiverGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#b6a5b8" stopOpacity={0.7} />
          <Stop offset="100%" stopColor="#7e8aa6" stopOpacity={1} />
        </SvgLinearGradient>
        <SvgLinearGradient id="dlForeground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#2d3550" stopOpacity={0} />
          <Stop offset="50%" stopColor="#2d3550" stopOpacity={1} />
          <Stop offset="100%" stopColor="#232a44" stopOpacity={1} />
        </SvgLinearGradient>
        <SvgLinearGradient id="dlTopFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#f4e4c8" stopOpacity={0.7} />
          <Stop offset="100%" stopColor="#f4e4c8" stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>

      {/* sun glow */}
      <Rect x={186} y={20} width={260} height={260} fill="url(#dlSunGlow)" />
      {/* sun core */}
      <Rect x={290} y={80} width={60} height={60} fill="url(#dlSunCore)" />

      {/* distant mountains */}
      <Path
        d="M0 420 L40 380 L70 395 L110 360 L150 390 L190 375 L240 400 L280 370 L320 390 L360 365 L400 395 L400 600 L0 600 Z"
        fill="#a8959a"
        opacity={0.5}
      />

      {/* mid mountains */}
      <Path
        d="M0 490 L30 450 L60 470 L100 420 L140 460 L180 435 L220 465 L260 430 L300 460 L340 440 L380 465 L400 450 L400 680 L0 680 Z"
        fill="#7d7a99"
        opacity={0.82}
      />

      {/* near hills */}
      <Path
        d="M0 600 C 60 540, 120 550, 200 580 C 280 610, 340 550, 400 570 L400 770 L0 770 Z"
        fill="url(#dlHillGrad)"
      />

      {/* river */}
      <Path
        d="M0 770 L0 660 C 80 650, 140 710, 200 690 C 260 670, 320 710, 400 680 L400 770 Z"
        fill="url(#dlRiverGrad)"
      />

      {/* foreground grass */}
      <Rect x={0} y={780} width={400} height={94} fill="url(#dlForeground)" />

      {/* top-of-screen warm fade for title legibility */}
      <Rect x={0} y={0} width={400} height={280} fill="url(#dlTopFade)" />
    </Svg>
  </View>
);
