import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { ArrowIcon } from './Icons';
import { useAuthTheme } from './authAppearance';
import { authHaptic } from './authHaptics';
import { FONTS, mixColors } from './theme';

const RELEASE_SPRING = { damping: 15, stiffness: 265, mass: 0.65, overshootClamping: true };

/**
 * A flat button in the active theme's colours: the main action filled with the accent, the secondary one outlined on
 * the page's surface. No raised edge or gradient; a press just dims it.
 */
export function AuthButton({ label, busyLabel, busy, disabled, secondary, compact, icon: Icon, onPress }: {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  icon?: ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
}) {
  const theme = useAuthTheme();
  const unavailable = disabled && !busy;
  const ink = unavailable ? theme.inkSoft : secondary ? theme.ink : theme.accentInk;
  const fill = unavailable ? theme.bgSoft : secondary ? theme.surface : theme.accent;
  const border = unavailable || secondary ? theme.line : theme.accent;

  return (
    <Pressable
      onPress={() => {
        authHaptic(secondary ? 'select' : 'press');
        onPress();
      }}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      testID="auth-button-face"
      style={({ pressed }) => [
        styles.face,
        compact && styles.compactButton,
        compact && styles.compactFace,
        { backgroundColor: fill, borderColor: border },
        pressed && styles.pressed,
      ]}>
      {Icon && !compact ? (
        <View style={[styles.icon, { backgroundColor: secondary ? theme.bgSoft : mixColors(theme.accent, theme.accentInk, 0.14) }]}>
          <Icon size={19} color={ink} />
        </View>
      ) : null}
      <Text style={[styles.buttonText, compact && styles.compactButtonText, { color: ink }]}>{busy ? busyLabel ?? label : label}</Text>
      {busy ? <ActivityIndicator size="small" color={ink} /> : (
        !compact && <ArrowIcon size={18} color={ink} />
      )}
    </Pressable>
  );
}

export type AuthMode = 'login' | 'signup';

export function AuthModeSwitch({ active, onSelect, disabled }: {
  active: AuthMode;
  onSelect: (mode: AuthMode) => void;
  disabled?: boolean;
}) {
  const theme = useAuthTheme();
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
  compactButton: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
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
  compactFace: { minHeight: 48, paddingHorizontal: 8, paddingVertical: 6 },
  buttonText: { flex: 1, fontFamily: FONTS.bodyBold, fontSize: 15, lineHeight: 21 },
  compactButtonText: { textAlign: 'center' },
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
