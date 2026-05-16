import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// Seeded RNG so star + grass placement is stable across renders.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

type Star = { cx: number; cy: number; r: number; o: number };

function buildStars(): Star[] {
  const rand = seeded(24601);
  return Array.from({ length: 140 }, () => {
    const big = rand() >= 0.85;
    return {
      cx: rand() * 402,
      cy: rand() * 540,
      r: big ? 1 + rand() * 1.3 : 0.5 + rand() * 0.8,
      o: 0.35 + rand() * 0.6,
    };
  });
}

const FEATURE_STARS: Array<{ cx: number; cy: number; r: number }> = [
  { cx: 88, cy: 180, r: 2.2 },
  { cx: 290, cy: 130, r: 2.4 },
  { cx: 350, cy: 320, r: 1.9 },
  { cx: 60, cy: 380, r: 1.8 },
  { cx: 200, cy: 90, r: 2.1 },
];

const GRASS_X = [20, 30, 90, 130, 170, 240, 280, 320, 360, 392];

const LAMPPOSTS: Array<{ x: number; h: number; pulse: number }> = [
  { x: 60, h: 70, pulse: 3 },
  { x: 342, h: 70, pulse: 3.7 },
];

// A small pulsing warm rectangle that sits inside each lamppost — gives the
// scene a sense of life without the perf cost of animating every star.
const LamppostGlow: React.FC<{ pulse: number }> = ({ pulse }) => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: pulse * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: pulse * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, pulse]);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        backgroundColor: '#f5b96a',
        opacity,
      }}
    />
  );
};

// Pulsing chapel window — focal warm point on the distant hill.
const ChapelWindowGlow: React.FC = () => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View
      style={{
        width: 6,
        height: 10,
        backgroundColor: '#f5b96a',
        opacity,
      }}
    />
  );
};

export const StarlitGardenScene: React.FC = () => {
  const stars = useMemo(buildStars, []);

  return (
    <View
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 402 874"
        preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* Night sky — deep indigo top fading to dawn-rose at the horizon */}
          <LinearGradient id="sky-st" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0a0e22" />
            <Stop offset="0.3" stopColor="#13183a" />
            <Stop offset="0.6" stopColor="#26284f" />
            <Stop offset="0.78" stopColor="#5a4068" />
            <Stop offset="0.9" stopColor="#a06458" />
            <Stop offset="1" stopColor="#d99477" />
          </LinearGradient>
          <RadialGradient
            id="moon-st"
            cx="0.5"
            cy="0.5"
            rx="0.5"
            ry="0.5"
            fx="0.5"
            fy="0.5">
            <Stop offset="0" stopColor="#fff7e0" stopOpacity={1} />
            <Stop offset="0.6" stopColor="#fde6b8" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#fde6b8" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="moon-halo-st"
            cx="0.5"
            cy="0.5"
            rx="0.5"
            ry="0.5"
            fx="0.5"
            fy="0.5">
            <Stop offset="0" stopColor="#fff5d6" stopOpacity={0.45} />
            <Stop offset="0.6" stopColor="#fff5d6" stopOpacity={0.08} />
            <Stop offset="1" stopColor="#fff5d6" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="lantern-glow-st"
            cx="0.5"
            cy="0.5"
            rx="0.5"
            ry="0.5"
            fx="0.5"
            fy="0.5">
            <Stop offset="0" stopColor="#fff1c0" stopOpacity={0.85} />
            <Stop offset="0.4" stopColor="#f5b96a" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#f5b96a" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Sky */}
        <Rect width="402" height="874" fill="url(#sky-st)" />

        {/* Milky-way smear */}
        <G opacity={0.35}>
          <Ellipse
            cx="240"
            cy="240"
            rx="320"
            ry="36"
            fill="#a8b8e8"
            opacity={0.18}
            transform="rotate(-22 240 240)"
          />
          <Ellipse
            cx="240"
            cy="240"
            rx="280"
            ry="22"
            fill="#cbd6ff"
            opacity={0.22}
            transform="rotate(-22 240 240)"
          />
        </G>

        {/* Moon halo + moon */}
        <Circle cx="92" cy="170" r={84} fill="url(#moon-halo-st)" />
        <Circle cx="92" cy="170" r={34} fill="url(#moon-st)" />
        <G opacity={0.18}>
          <Circle cx="86" cy="166" r={4} fill="#c9a884" />
          <Circle cx="100" cy="174" r={3} fill="#c9a884" />
          <Circle cx="92" cy="182" r={2} fill="#c9a884" />
        </G>

        {/* Star field — static, twinkle isn't supported by SMIL on RN-SVG native */}
        {stars.map((st, i) => (
          <Circle
            key={i}
            cx={st.cx}
            cy={st.cy}
            r={st.r}
            fill="#fff"
            opacity={st.o}
          />
        ))}
        {/* Feature stars with cross flares */}
        {FEATURE_STARS.map((b, i) => (
          <G key={'b' + i}>
            <Circle cx={b.cx} cy={b.cy} r={b.r} fill="#fff" />
            <Line
              x1={b.cx - 8}
              y1={b.cy}
              x2={b.cx + 8}
              y2={b.cy}
              stroke="#fff"
              strokeWidth={0.5}
              opacity={0.6}
            />
            <Line
              x1={b.cx}
              y1={b.cy - 8}
              x2={b.cx}
              y2={b.cy + 8}
              stroke="#fff"
              strokeWidth={0.5}
              opacity={0.6}
            />
          </G>
        ))}

        {/* Distant tree line silhouette */}
        <G fill="#0c1224" opacity={0.85}>
          <Path
            d="M 0 540 L 22 530 L 38 540 L 56 524 L 78 540 L 98 520 L 118 540 L 138 528 L 160 540 L 184 522 L 202 540 L 224 526 L 248 540 L 270 530 L 296 540 L 322 522 L 350 540 L 376 530 L 402 540 L 402 600 L 0 600 Z"
          />
        </G>

        {/* Hills */}
        <Path
          d="M 0 610 Q 80 580 160 600 Q 240 620 320 590 Q 380 568 402 596 L 402 740 L 0 740 Z"
          fill="#16203a"
        />
        <Path
          d="M 0 670 Q 100 644 200 666 Q 300 686 402 656 L 402 760 L 0 760 Z"
          fill="#0e1628"
        />

        {/* Distant chapel on the hill — body, roof, steeple, cross.
            Lit window is drawn separately as an Animated.View overlay. */}
        <G translateX={228} translateY={584}>
          <Circle cx="0" cy="14" r={22} fill="#f5b96a" opacity={0.18} />
          <Rect x="-12" y="0" width="24" height="26" fill="#0a0e22" />
          <Polygon points="-14,0 14,0 0,-18" fill="#0a0e22" />
          <Rect x="-1.5" y="-32" width="3" height="14" fill="#0a0e22" />
          <Line
            x1="-3"
            y1="-28"
            x2="3"
            y2="-28"
            stroke="#1a2440"
            strokeWidth={1.4}
          />
        </G>

        {/* Lantern halos pooling along the path */}
        <Ellipse cx="60" cy="740" rx={80} ry={50} fill="url(#lantern-glow-st)" />
        <Ellipse cx="200" cy="780" rx={120} ry={70} fill="url(#lantern-glow-st)" />
        <Ellipse cx="340" cy="740" rx={80} ry={50} fill="url(#lantern-glow-st)" />

        {/* Ground */}
        <Rect x="0" y="740" width="402" height="134" fill="#1a1410" />
        {/* Path */}
        <Path d="M 100 874 Q 200 800 300 874 Z" fill="#3a2a18" opacity={0.7} />
        <Path d="M 120 874 Q 200 820 280 874 Z" fill="#54381f" opacity={0.5} />

        {/* Lamppost frames (the glowing lantern bulb is overlaid below) */}
        {LAMPPOSTS.map((p, i) => (
          <G key={i} translateX={p.x} translateY={740}>
            <Rect x="-1.5" y={-p.h} width={3} height={p.h} fill="#0e1421" />
            <Rect
              x="-7"
              y={-p.h - 14}
              width={14}
              height={14}
              fill="#0e1421"
              stroke="#1a2440"
              strokeWidth={0.6}
            />
            <Polygon
              points={`-8,${-p.h - 14} 8,${-p.h - 14} 0,${-p.h - 22}`}
              fill="#0e1421"
            />
            <Rect x="-5" y="-3" width="10" height="3" fill="#0e1421" />
          </G>
        ))}

        {/* Foreground grass tufts */}
        <G stroke="#0a0e16" strokeWidth={1.2} fill="none" opacity={0.9}>
          {GRASS_X.map(x => (
            <G key={x} translateX={x} translateY={856}>
              <Path d="M 0 0 Q -2 -10 -1 -22" />
              <Path d="M 3 0 Q 5 -8 2 -16" />
              <Path d="M -3 0 Q -6 -6 -8 -18" />
            </G>
          ))}
        </G>

        {/* Subtle ground mist */}
        <Ellipse cx="201" cy="800" rx={240} ry={18} fill="#fff" opacity={0.04} />
      </Svg>

      {/* Animated overlays for the warm focal points. Positioned in % so they
          ride the same 402×874 aspect as the SVG. */}
      <View style={{ position: 'absolute', inset: 0 }}>
        {/* Chapel window glow ≈ (228, 600) in 402×874 space */}
        <View
          style={{
            position: 'absolute',
            left: `${(225 / 402) * 100}%`,
            top: `${(592 / 874) * 100}%`,
          }}>
          <ChapelWindowGlow />
        </View>
        {/* Lamppost lights — sit inside each lantern box */}
        {LAMPPOSTS.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${((p.x - 5) / 402) * 100}%`,
              top: `${((740 - p.h - 12) / 874) * 100}%`,
            }}>
            <LamppostGlow pulse={p.pulse} />
          </View>
        ))}
      </View>
    </View>
  );
};
