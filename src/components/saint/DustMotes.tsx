import { useIsFocused } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useReducedMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type DustMote = {
  startX: number;
  startY: number;
  size: number;
  tx: number;
  ty: number;
  duration: number;
  delay: number;
  peakOpacity: number;
};

function seededMotes(count: number, seed: number): DustMote[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    startX: rand() * 100,
    startY: 60 + rand() * 40,
    size: 1.6 + rand() * 3,
    tx: (rand() - 0.5) * 80,
    ty: -260 - rand() * 200,
    duration: 14000 + rand() * 22000,
    delay: rand() * 30000,
    peakOpacity: 0.4 + rand() * 0.5,
  }));
}

const Mote: React.FC<{ mote: DustMote; running: boolean }> = ({ mote, running }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!running) return;
    const easing = Easing.linear;
    const from = progress.get();
    // Carries on from where it paused. Only a fresh mote waits out its delay.
    progress.set(
      withSequence(
        withDelay(
          from > 0 ? 0 : mote.delay,
          withTiming(1, { duration: mote.duration * (1 - from), easing }),
        ),
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withDelay(mote.delay, withTiming(1, { duration: mote.duration, easing })),
          ),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, mote.delay, mote.duration, running]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 0.1, 0.9, 1], [0, mote.peakOpacity, mote.peakOpacity, 0]),
      transform: [
        { translateX: interpolate(p, [0, 1], [0, mote.tx]) },
        { translateY: interpolate(p, [0, 1], [0, mote.ty]) },
      ],
    };
  });

  // A soft halo around a dot. A real shadow looks the same here, but iOS re-renders it on every frame.
  const halo = mote.size * 3;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${mote.startX}%`,
          top: `${mote.startY}%`,
          width: halo,
          height: halo,
          marginLeft: -mote.size,
          marginTop: -mote.size,
          borderRadius: halo / 2,
          backgroundColor: 'rgba(253, 228, 198, 0.16)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}>
      <View style={{ width: mote.size, height: mote.size, borderRadius: mote.size / 2, backgroundColor: '#fde4c6' }} />
    </Animated.View>
  );
};

export const DustMotes: React.FC<{ count?: number; seed?: number }> = ({
  count = 22,
  seed = 1337,
}) => {
  const motes = useMemo(() => seededMotes(count, seed), [count, seed]);
  const reducedMotion = useReducedMotion();
  const focused = useIsFocused();
  if (reducedMotion) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {motes.map((m, i) => (
        <Mote key={i} mote={m} running={focused} />
      ))}
    </View>
  );
};
