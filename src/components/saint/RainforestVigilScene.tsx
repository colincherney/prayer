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

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

type Star = { cx: number; cy: number; r: number; o: number };
type Firefly = {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  tx: number;
  ty: number;
  pulse: number;
};

function buildSeeded() {
  const rand = seeded(91011);
  const stars: Star[] = Array.from({ length: 110 }, () => {
    const big = rand() >= 0.85;
    return {
      cx: rand() * 402,
      cy: rand() * 360,
      r: big ? 1 + rand() * 1.2 : 0.5 + rand() * 0.8,
      o: 0.4 + rand() * 0.6,
    };
  });
  const fireflies: Firefly[] = Array.from({ length: 14 }, () => ({
    x: 6 + rand() * 88,
    y: 50 + rand() * 32,
    size: 2.4 + rand() * 1.6,
    duration: 7 + rand() * 7,
    delay: rand() * 12,
    tx: (rand() - 0.5) * 80,
    ty: -40 - rand() * 60,
    pulse: 1.4 + rand() * 1.6,
  }));
  return { stars, fireflies };
}

const FLARE_STARS: Array<[number, number]> = [
  [60, 80],
  [180, 40],
  [360, 300],
  [40, 260],
];

// One firefly — a small glowing dot that drifts upward + pulses in brightness.
// Mirrors the CSS `firefly-drift` + `firefly-pulse` animations in the design.
const FireflyDot: React.FC<{ f: Firefly }> = ({ f }) => {
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(f.delay * 1000),
        Animated.timing(drift, {
          toValue: 1,
          duration: f.duration * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: f.pulse * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: f.pulse * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    driftLoop.start();
    pulseLoop.start();
    return () => {
      driftLoop.stop();
      pulseLoop.stop();
    };
  }, [drift, pulse, f.delay, f.duration, f.pulse]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, f.tx] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, f.ty] });
  // Fade in at 15% and out after 85% — same shape as the CSS keyframes.
  const driftOpacity = drift.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.95, 0.95, 0],
  });
  const brightness = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const opacity = Animated.multiply(driftOpacity, brightness);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${f.x}%`,
        top: `${f.y}%`,
        width: f.size,
        height: f.size,
        borderRadius: f.size / 2,
        backgroundColor: '#fff4a8',
        shadowColor: '#f5d36a',
        shadowOpacity: 0.9,
        shadowRadius: 8,
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
};

// Pulsing warm window of the hut in the canopy.
const HutWindowGlow: React.FC = () => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 2500,
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
      style={{ width: 8, height: 8, backgroundColor: '#f5b96a', opacity }}
    />
  );
};

export const RainforestVigilScene: React.FC = () => {
  const { stars, fireflies } = useMemo(buildSeeded, []);

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
          <LinearGradient id="sky-j" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#08111c" />
            <Stop offset="0.32" stopColor="#0e2230" />
            <Stop offset="0.58" stopColor="#15403a" />
            <Stop offset="0.78" stopColor="#1d5448" />
            <Stop offset="1" stopColor="#0c2a28" />
          </LinearGradient>
          <RadialGradient
            id="moon-j"
            cx="0.5"
            cy="0.5"
            rx="0.5"
            ry="0.5"
            fx="0.5"
            fy="0.5">
            <Stop offset="0" stopColor="#fff5dc" stopOpacity={1} />
            <Stop offset="0.6" stopColor="#fbe2a8" stopOpacity={0.85} />
            <Stop offset="1" stopColor="#fbe2a8" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="moon-halo-j"
            cx="0.5"
            cy="0.5"
            rx="0.5"
            ry="0.5"
            fx="0.5"
            fy="0.5">
            <Stop offset="0" stopColor="#cdebdc" stopOpacity={0.4} />
            <Stop offset="0.6" stopColor="#cdebdc" stopOpacity={0.08} />
            <Stop offset="1" stopColor="#cdebdc" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="fog-j" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#5d8a76" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#5d8a76" stopOpacity={0} />
          </LinearGradient>
          <RadialGradient
            id="pool-j"
            cx="0.5"
            cy="0.5"
            rx="0.55"
            ry="0.55"
            fx="0.5"
            fy="0.5">
            <Stop offset="0" stopColor="#7ec9a8" stopOpacity={0.22} />
            <Stop offset="0.6" stopColor="#1d5448" stopOpacity={0.04} />
            <Stop offset="1" stopColor="#0c2a28" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="leaf-near" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#061a14" />
            <Stop offset="1" stopColor="#020807" />
          </LinearGradient>
          <LinearGradient id="leaf-mid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0d2820" />
            <Stop offset="1" stopColor="#06140f" />
          </LinearGradient>
          <LinearGradient id="leaf-far" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#163d31" />
            <Stop offset="1" stopColor="#0a221a" />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect width="402" height="874" fill="url(#sky-j)" />

        {/* Nebula wash */}
        <Ellipse
          cx="280"
          cy="180"
          rx="220"
          ry="80"
          fill="#3a5a7a"
          opacity={0.18}
          transform="rotate(-14 280 180)"
        />
        <Ellipse
          cx="100"
          cy="120"
          rx="160"
          ry="50"
          fill="#5d8a76"
          opacity={0.16}
          transform="rotate(8 100 120)"
        />

        {/* Moon */}
        <Circle cx="306" cy="160" r={86} fill="url(#moon-halo-j)" />
        <Circle cx="306" cy="160" r={32} fill="url(#moon-j)" />

        {/* Stars */}
        {stars.map((st, i) => (
          <Circle
            key={i}
            cx={st.cx}
            cy={st.cy}
            r={st.r}
            fill="#f4f1d9"
            opacity={st.o}
          />
        ))}
        {FLARE_STARS.map(([cx, cy], i) => (
          <G key={'f' + i}>
            <Circle cx={cx} cy={cy} r={2} fill="#fff" />
            <Line
              x1={cx - 7}
              y1={cy}
              x2={cx + 7}
              y2={cy}
              stroke="#fff"
              strokeWidth={0.5}
              opacity={0.6}
            />
            <Line
              x1={cx}
              y1={cy - 7}
              x2={cx}
              y2={cy + 7}
              stroke="#fff"
              strokeWidth={0.5}
              opacity={0.6}
            />
          </G>
        ))}

        {/* Fog mountains */}
        <Path
          d="M 0 460 Q 80 410 160 440 Q 240 470 320 420 Q 380 390 402 430 L 402 540 L 0 540 Z"
          fill="url(#fog-j)"
        />
        <Path
          d="M 0 480 Q 100 450 200 470 Q 300 490 402 460 L 402 560 L 0 560 Z"
          fill="#0e2230"
          opacity={0.55}
        />

        {/* Misty light pool behind UI */}
        <Ellipse cx="201" cy="480" rx={240} ry={220} fill="url(#pool-j)" />

        {/* Far canopy silhouettes */}
        <G fill="url(#leaf-far)" opacity={0.92}>
          <Path d="M 0 540 Q 30 470 60 540 Z" />
          <Path d="M 50 540 Q 90 460 130 540 Z" />
          <Path d="M 120 540 Q 160 480 200 540 Z" />
          <Path d="M 190 540 Q 230 470 270 540 Z" />
          <Path d="M 260 540 Q 300 460 340 540 Z" />
          <Path d="M 330 540 Q 370 480 402 540 Z" />
        </G>

        {/* Mid canopy */}
        <G fill="url(#leaf-mid)">
          <Path d="M 0 600 Q 60 540 120 590 Q 180 540 240 580 Q 300 540 360 580 Q 380 580 402 590 L 402 700 L 0 700 Z" />
          <Ellipse cx="360" cy="560" rx={60} ry={32} />
          <Rect x="356" y="572" width="6" height="80" />
          <Ellipse cx="36" cy="572" rx={48} ry={28} />
          <Rect x="33" y="586" width="6" height="80" />
        </G>

        {/* Hut in the canopy — body, roof, halo. Window glow is overlaid below. */}
        <G translateX={120} translateY={584}>
          <Rect x="-10" y="-8" width="20" height="16" fill="#06140f" />
          <Polygon points="-12,-8 12,-8 0,-18" fill="#06140f" />
          <Circle cx="0" cy="0" r={22} fill="#f5b96a" opacity={0.08} />
        </G>

        {/* Near canopy — heavy bottom silhouette */}
        <G fill="url(#leaf-near)">
          <Path d="M 0 700 Q 50 660 100 690 Q 150 660 200 690 Q 250 660 300 690 Q 350 660 402 690 L 402 874 L 0 874 Z" />
        </G>

        {/* Top-left monstera */}
        <G translateX={-6} translateY={40} rotation={-22} fill="url(#leaf-near)">
          <Path d="M 0 0 Q 10 -20 40 -18 Q 80 -16 100 6 Q 130 30 122 70 Q 116 110 80 130 Q 50 142 20 130 Q -10 116 -8 76 Q -6 36 0 0 Z" />
          <Ellipse
            cx="40"
            cy="40"
            rx={14}
            ry={6}
            fill="#06140f"
            transform="rotate(-10 40 40)"
          />
          <Ellipse
            cx="70"
            cy="70"
            rx={16}
            ry={6}
            fill="#06140f"
            transform="rotate(-22 70 70)"
          />
          <Ellipse
            cx="40"
            cy="92"
            rx={12}
            ry={5}
            fill="#06140f"
            transform="rotate(-30 40 92)"
          />
          <Path
            d="M 100 6 Q 130 30 122 70"
            fill="none"
            stroke="#7ec9a8"
            strokeWidth={1.2}
            opacity={0.55}
          />
        </G>

        {/* Top-right palm frond */}
        <G translateX={408} translateY={30} rotation={28} fill="url(#leaf-near)">
          <Path d="M 0 0 Q -20 -2 -40 6 Q -70 20 -90 50 Q -110 90 -100 130 Q -90 160 -60 170 Q -30 170 -10 150 Q 10 130 14 90 Q 18 50 6 16 Z" />
          <G stroke="#020807" strokeWidth={2} fill="none">
            <Path d="M -10 10 L -88 60" />
            <Path d="M -14 30 L -98 80" />
            <Path d="M -14 50 L -94 110" />
            <Path d="M -10 80 L -78 142" />
            <Path d="M -2 110 L -50 160" />
          </G>
          <Path
            d="M -90 50 Q -110 90 -100 130"
            fill="none"
            stroke="#7ec9a8"
            strokeWidth={1.2}
            opacity={0.5}
          />
        </G>

        {/* Hanging vine — left */}
        <G stroke="#020807" strokeWidth={2} fill="none">
          <Path d="M 14 0 Q 28 80 18 160 Q 8 240 22 320 Q 36 400 16 480" />
          <Path
            d="M 22 90 Q 36 86 38 96 Q 26 100 22 92 Z"
            fill="#06140f"
            stroke="none"
          />
          <Path
            d="M 12 180 Q -4 174 -2 188 Q 14 192 14 182 Z"
            fill="#06140f"
            stroke="none"
          />
          <Path
            d="M 26 280 Q 42 280 40 292 Q 26 294 24 284 Z"
            fill="#06140f"
            stroke="none"
          />
          <Path
            d="M 8 380 Q -8 380 -4 392 Q 12 392 12 384 Z"
            fill="#06140f"
            stroke="none"
          />
        </G>

        {/* Hanging vine — right */}
        <G stroke="#020807" strokeWidth={2} fill="none">
          <Path d="M 388 0 Q 372 80 384 160 Q 396 240 380 320 Q 366 400 384 480" />
          <Path
            d="M 380 100 Q 364 96 366 110 Q 380 114 384 104 Z"
            fill="#06140f"
            stroke="none"
          />
          <Path
            d="M 388 200 Q 404 196 402 208 Q 388 214 384 204 Z"
            fill="#06140f"
            stroke="none"
          />
          <Path
            d="M 376 300 Q 360 300 362 312 Q 376 314 380 304 Z"
            fill="#06140f"
            stroke="none"
          />
        </G>

        {/* Bottom-left big leaf */}
        <G translateX={0} translateY={820} rotation={-18} fill="url(#leaf-near)">
          <Path d="M 0 0 Q 30 -40 80 -50 Q 130 -54 150 -30 Q 130 -10 80 0 Q 30 12 0 0 Z" />
          <Path
            d="M 0 0 Q 60 -20 150 -30"
            stroke="#143028"
            strokeWidth={1.2}
            fill="none"
          />
        </G>
        {/* Bottom-right big leaf */}
        <G translateX={402} translateY={840} rotation={22} fill="url(#leaf-near)">
          <Path d="M 0 0 Q -30 -40 -80 -50 Q -130 -54 -150 -30 Q -130 -10 -80 0 Q -30 12 0 0 Z" />
          <Path
            d="M 0 0 Q -60 -20 -150 -30"
            stroke="#143028"
            strokeWidth={1.2}
            fill="none"
          />
        </G>
      </Svg>

      {/* Hut window glow — pulses warmly through the canopy */}
      <View
        style={{
          position: 'absolute',
          left: `${((120 - 4) / 402) * 100}%`,
          top: `${((584 - 4) / 874) * 100}%`,
        }}>
        <HutWindowGlow />
      </View>

      {/* Fireflies — drift upward + pulse brightness */}
      <View
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
        pointerEvents="none">
        {fireflies.map((f, i) => (
          <FireflyDot key={i} f={f} />
        ))}
      </View>
    </View>
  );
};
