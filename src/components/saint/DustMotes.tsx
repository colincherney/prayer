import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type Mote = {
  startX: number;
  startY: number;
  size: number;
  tx: number;
  ty: number;
  duration: number;
  delay: number;
  peakOpacity: number;
};

function seededMotes(count: number, seed: number): Mote[] {
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

const Mote: React.FC<{ mote: Mote }> = ({ mote }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(mote.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: mote.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, mote.delay, mote.duration]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, mote.tx],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, mote.ty],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, mote.peakOpacity, mote.peakOpacity, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${mote.startX}%`,
        top: `${mote.startY}%`,
        width: mote.size,
        height: mote.size,
        borderRadius: mote.size / 2,
        backgroundColor: '#fde4c6',
        shadowColor: '#fde4c6',
        shadowOpacity: 0.9,
        shadowRadius: mote.size * 2,
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
};

export const DustMotes: React.FC<{ count?: number; seed?: number }> = ({
  count = 22,
  seed = 1337,
}) => {
  const motes = useMemo(() => seededMotes(count, seed), [count, seed]);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {motes.map((m, i) => (
        <Mote key={i} mote={m} />
      ))}
    </View>
  );
};
