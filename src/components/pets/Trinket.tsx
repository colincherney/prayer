import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';

import { PetMotion } from './Fx';
import { TRINKET_ART, TRINKET_INFO, TrinketId } from './trinketArt';

export const RARITY_COLOR = { common: '#8FC6A9', rare: '#6E9BEA', epic: '#B98AF0', legendary: '#F2C462' } as const;

/** One trinket's art at `size` dp. `dim` shows a not-yet-earned piece as a faded silhouette. */
export function TrinketArt({ id, size = 96, animated = true, dim }: { id: TrinketId; size?: number; animated?: boolean; dim?: boolean }) {
  const Art = TRINKET_ART[id];
  return (
    <PetMotion.Provider value={animated && !dim}>
      <Svg viewBox="0 0 120 120" width={size} height={size} opacity={dim ? 0.28 : 1} accessibilityRole="image" accessibilityLabel={TRINKET_INFO[id].name}>
        <Art />
      </Svg>
    </PetMotion.Provider>
  );
}

/** A trinket you can tap: it jumps and says its line (design: `rxjump` and the bubble). */
export function TapTrinket({ id, size = 96, children }: { id: TrinketId; size?: number; children?: React.ReactNode }) {
  const jump = useSharedValue(0);
  const [saying, setSaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -16 * jump.get() }, { rotate: `${-4 * jump.get()}deg` }, { scaleY: 1 + 0.06 * jump.get() }],
  }));
  const onPress = () => {
    jump.set(withSequence(withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 420, easing: Easing.bounce })));
    setSaying(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaying(false), 1500);
  };
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Tap ${TRINKET_INFO[id].name}`} style={{ alignItems: 'center' }}>
      {saying ? (
        <View style={styles.bubble} pointerEvents="none">
          <Text style={styles.bubbleText}>{TRINKET_INFO[id].sound}</Text>
        </View>
      ) : null}
      <Animated.View style={style}>{children ?? <TrinketArt id={id} size={size} />}</Animated.View>
    </Pressable>
  );
}

/** A wooden shelf with your earned trinkets standing on it, beside your companion's nook. */
export function TrinketShelf({ earned, width, onPress }: { earned: TrinketId[]; width: number; onPress: () => void }) {
  const size = 58;
  const shown = earned.slice(-Math.max(1, Math.floor((width - 20) / (size - 4))));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Trinket shelf, ${earned.length} earned`}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', minHeight: size, gap: -4 }}>
        {shown.length ? (
          shown.map(id => <TrinketArt key={id} id={id} size={size} />)
        ) : (
          <Text style={[styles.empty, { width: width - 40 }]}>Earn keepsakes through prayer to fill your shelf.</Text>
        )}
      </View>
      <Svg width={width} height={16} viewBox={`0 0 ${width} 16`}>
        <Rect x={4} y={0} width={width - 8} height={8} rx={2} fill="#8A5A3C" />
        <Rect x={4} y={6} width={width - 8} height={3} fill="#6B4228" />
        <Path d={`M22 9 L26 16 M${width - 22} 9 L${width - 26} 16`} stroke="#6B4228" strokeWidth={4} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    top: -6,
    zIndex: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F2E9D8',
  },
  bubbleText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: '#1A2230' },
  empty: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 13, color: '#9A8F7E', textAlign: 'center', paddingBottom: 8 },
});
