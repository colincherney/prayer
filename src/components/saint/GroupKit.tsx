import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, PressableProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import Svg, { Path } from 'react-native-svg';

import { authHaptic } from './authHaptics';
import { FONTS, Theme } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A button that gives under the finger: shrinks a touch on press, springs back on release, with a light tap of
 * haptics. Reduce Motion keeps the haptic and drops the scale.
 */
export function PressScale({
  style,
  haptic = 'press',
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  children,
  ...rest
}: Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  haptic?: 'press' | 'select' | 'success' | null;
  scaleTo?: number;
}) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={e => {
        if (!reduce) scale.set(withTiming(scaleTo, { duration: 110, easing: Easing.out(Easing.quad) }));
        onPressIn?.(e);
      }}
      onPressOut={e => {
        if (!reduce) scale.set(withSpring(1, { damping: 14, stiffness: 320 }));
        onPressOut?.(e);
      }}
      onPress={e => {
        if (haptic) authHaptic(haptic);
        onPress?.(e);
      }}
      style={[style, animated, disabled && { opacity: 0.6 }]}>
      {children}
    </AnimatedPressable>
  );
}

type Segment<K extends string> = { key: K; label: string; count?: number; dot?: boolean };

/** An iOS-style segmented control whose raised thumb slides between segments. */
export function SlidingSegments<K extends string>({
  segments,
  value,
  onChange,
  theme,
  style,
}: {
  segments: readonly Segment<K>[];
  value: K;
  onChange: (key: K) => void;
  theme: Theme;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex(s => s.key === value));
  const segW = width > 0 ? (width - PAD * 2) / segments.length : 0;
  const x = useSharedValue(0);
  const target = index * segW;
  useEffect(() => {
    if (segW <= 0) return;
    x.set(reduce ? target : withSpring(target, { damping: 22, stiffness: 260, mass: 0.8 }));
  }, [target, segW, reduce, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) {
      x.set(index * ((w - PAD * 2) / segments.length));
      setWidth(w);
    }
  };

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="tablist"
      style={[{ flexDirection: 'row', padding: PAD, borderRadius: 14, backgroundColor: theme.bgSoft }, style]}>
      {segW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: PAD,
              bottom: PAD,
              left: PAD,
              width: segW,
              borderRadius: 11,
              backgroundColor: theme.surface,
              shadowColor: '#000',
              shadowOpacity: theme.isDark ? 0.35 : 0.1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            thumb,
          ]}
        />
      ) : null}
      {segments.map(s => {
        const active = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => {
              if (active) return;
              authHaptic('select');
              onChange(s.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${s.label}${s.count !== undefined ? `, ${s.count}` : ''}${s.dot ? ', new prayers' : ''}`}
            style={segStyles.item}>
            <Text style={[segStyles.label, { color: active ? theme.ink : theme.inkSoft }]}>{s.label}</Text>
            {s.count !== undefined ? (
              <Text style={[segStyles.count, { color: active ? theme.ink : theme.inkSoft }]}>{s.count}</Text>
            ) : null}
            {s.dot ? <View style={[segStyles.dot, { backgroundColor: theme.accent }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const PAD = 3;

const segStyles = StyleSheet.create({
  item: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  count: { fontFamily: FONTS.body, fontSize: 13, fontVariant: ['tabular-nums'] },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

/**
 * A mini prayer candle: soft wax with a drip, a wick, a holder. `lit` gives it a flame and a faint glow, for a prayer
 * someone has prayed for; unlit, it waits with a bare wick.
 */
export function PrayerCandle({ size = 18, color, lit = false }: { size?: number; color: string; lit?: boolean }) {
  const line = { stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {lit ? (
        <>
          {/* flame, its bright heart, and the glow around it */}
          <Path
            d="M12 2.6 C13.7 4.3 14.3 5.8 13.7 7.1 C13.3 8 12.7 8.5 12 8.5 C11.3 8.5 10.7 8 10.3 7.1 C9.7 5.8 10.3 4.3 12 2.6 Z"
            fill={color}
            fillOpacity={0.3}
            strokeWidth={1.4}
            {...line}
          />
          <Path
            d="M12 5.4 C12.6 6.1 12.8 6.7 12.5 7.2 C12.4 7.4 12.2 7.5 12 7.5 C11.8 7.5 11.6 7.4 11.5 7.2 C11.2 6.7 11.4 6.1 12 5.4 Z"
            fill={color}
          />
          <Path d="M7.4 4.6 L8.4 5.3 M16.6 4.6 L15.6 5.3 M7.3 8.2 H8.3 M16.7 8.2 H15.7" fill="none" strokeWidth={1.2} {...line} />
        </>
      ) : null}
      {/* wick */}
      <Path d="M12 10.2 V8.6" fill="none" strokeWidth={1.4} {...line} />
      {/* wax, and a drip */}
      <Path
        d="M9.6 11 C9.6 10.5 10 10.2 10.5 10.2 H13.5 C14 10.2 14.4 10.5 14.4 11 V18.6 H9.6 Z"
        fill={color}
        fillOpacity={0.16}
        strokeWidth={1.5}
        {...line}
      />
      <Path d="M11 10.4 V12.4 C11 13 11.8 13 11.8 12.4 V11.4" fill="none" strokeWidth={1.1} {...line} />
      {/* holder */}
      <Path d="M7.6 18.8 H16.4 L15.6 20.8 H8.4 Z" fill={color} fillOpacity={0.35} strokeWidth={1.5} {...line} />
    </Svg>
  );
}
