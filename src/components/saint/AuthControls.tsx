import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { ArrowIcon } from './Icons';
import { authHaptic } from './authHaptics';
import { FONTS, mixColors, useTheme } from './theme';

const BUTTON_DEPTH = 6;
const RELEASE_SPRING = { damping: 15, stiffness: 265, mass: 0.65, overshootClamping: true };

export function AuthButton({ label, busyLabel, busy, disabled, secondary, icon: Icon, onPress }: {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  icon?: ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const press = useSharedValue(0);
  const unavailable = disabled && !busy;
  const lifted = !disabled && !busy;
  const ink = unavailable ? theme.inkSoft : secondary ? theme.ink : '#362522';
  const top = secondary ? mixColors(theme.surface, theme.ink, 0.08) : '#FFE8B4';
  const face = secondary ? theme.surface : '#EFB975';
  const edge = secondary ? mixColors(theme.surface, '#241F27', 0.28) : '#A3663D';
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lifted ? press.get() * (BUTTON_DEPTH - 1) : 0 }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lifted && !reducedMotion ? press.get() * 3 : 0 }],
  }));

  return (
    <Pressable
      onPressIn={() => press.set(reducedMotion ? 1 : withTiming(1, { duration: 80 }))}
      onPressOut={() => press.set(reducedMotion ? 0 : withSpring(0, RELEASE_SPRING))}
      onPress={() => {
        authHaptic(secondary ? 'select' : 'press');
        onPress();
      }}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      style={styles.button}>
      {lifted ? <View pointerEvents="none" style={[styles.edge, { backgroundColor: edge }]} /> : null}
      <Animated.View
        pointerEvents="none"
        testID="auth-button-face"
        style={[
          styles.face,
          faceStyle,
          {
            backgroundColor: unavailable ? theme.bgSoft : face,
            borderColor: unavailable || secondary ? theme.line : '#FFF0CB9E',
          },
        ]}>
        {!unavailable ? (
          <LinearGradient colors={[top, face]} style={StyleSheet.absoluteFill} />
        ) : null}
        {Icon ? (
          <View style={[styles.icon, { backgroundColor: secondary ? theme.bgSoft : '#AD6E3D22' }]}>
            <Icon size={19} color={ink} />
          </View>
        ) : null}
        <Text style={[styles.buttonText, { color: ink }]}>{busy ? busyLabel ?? label : label}</Text>
        {busy ? <ActivityIndicator size="small" color={ink} /> : (
          <Animated.View style={arrowStyle}><ArrowIcon size={18} color={ink} /></Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export type AuthMode = 'login' | 'signup';

export function AuthModeSwitch({ active, onSelect, disabled }: {
  active: AuthMode;
  onSelect: (mode: AuthMode) => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const target = active === 'login' ? 0 : 1;
  const position = useSharedValue(target);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    position.set(reducedMotion ? target : withSpring(target, RELEASE_SPRING));
  }, [position, reducedMotion, target]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() * width / 2 }] }));

  return (
    <View style={[styles.track, { backgroundColor: theme.bgSoft, borderColor: theme.line }]}>
      <View accessibilityRole="tablist" onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.segments}>
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.thumb, { backgroundColor: theme.surface, borderColor: theme.line }, thumbStyle]}
          />
        ) : null}
        {(['login', 'signup'] as const).map(mode => (
          <Pressable
            key={mode}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === active, disabled }}
            disabled={disabled}
            onPress={() => {
              if (mode === active) return;
              authHaptic('select');
              onSelect(mode);
            }}
            style={({ pressed }) => [styles.segment, pressed && styles.segmentPressed]}>
            <Text style={[styles.segmentText, { color: mode === active ? theme.ink : theme.inkSoft }]}>
              {mode === 'login' ? 'Log in' : 'Sign up'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 19, paddingBottom: BUTTON_DEPTH },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BUTTON_DEPTH,
    bottom: 0,
    borderRadius: 19,
    boxShadow: '0 5px 13px #100B2226',
  },
  face: {
    minHeight: 56,
    borderRadius: 19,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { flex: 1, fontFamily: FONTS.bodyBold, fontSize: 15, lineHeight: 21 },
  track: { padding: 4, borderWidth: 1, borderRadius: 16 },
  segments: { flexDirection: 'row' },
  thumb: {
    position: 'absolute',
    width: '50%',
    top: 0,
    bottom: 0,
    borderRadius: 11,
    borderWidth: 1,
    boxShadow: '0 2px 3px #110B1830',
  },
  segment: { flex: 1, minHeight: 44, padding: 5, alignItems: 'center', justifyContent: 'center' },
  segmentPressed: { opacity: 0.68 },
  segmentText: { fontFamily: FONTS.bodySemi, fontSize: 14, textAlign: 'center' },
});
