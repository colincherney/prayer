import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Image } from 'react-native-svg';

import { Star, Twinkles } from './SceneParticles';

// The Sword of the Spirit: the angel sword standing in a still lake under lightning (the sword wallpaper,
// assets/images/gladi/sword-wallpaper.jpg, painted at the 390x844 artboard's shape). The player's own companion floats
// at the same spot as the other seasonal rooms (feet at 290, 318), beside the sword's wings.
//
// The painting is drawn once; what moves (the stars, a glow round the sword's halo, the glints on the water) is
// plain views moved natively, so nothing redraws it.

const WALLPAPER = require('../../../assets/images/gladi/sword-wallpaper.jpg');

const W = 390;
const H = 844;
const STARS: Star[] = [
  [24, 120, 1.2, 0], [90, 210, 1, 0.35], [150, 150, 1.2, 0.7], [250, 180, 1, 0.1], [330, 140, 1.3, 0.45],
  [370, 260, 1, 0.8], [40, 330, 1.1, 0.2], [356, 380, 1.1, 0.55], [60, 470, 1, 0.9], [330, 500, 1.1, 0.3],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);
// light on the water round the blade
const GLINTS: Star[] = [
  [150, 600, 1.8, 0.1], [240, 610, 1.6, 0.5], [110, 650, 1.6, 0.85], [280, 660, 1.8, 0.3], [195, 700, 2, 0.65], [60, 720, 1.4, 0.4],
].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);
// the sword's halo, breathing
const HALO: Star[] = [[195, 295, 3, 0], [120, 300, 2, 0.5], [270, 300, 2, 0.25]].map(([x, y, r, phase]) => [x / W, y / H, r, phase] as Star);

const Painting = React.memo(function Painting() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Image href={WALLPAPER} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
    </Svg>
  );
});

export const SwordScene: React.FC = () => (
  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#0E2A3A' }]} pointerEvents="none">
    <Painting />
    <Twinkles stars={STARS} color="#E6F8FF" />
    <Twinkles stars={HALO} duration={4000} color="#BFEAF6" />
    <Twinkles stars={GLINTS} duration={2800} color="#7FDDF2" />
  </View>
);
