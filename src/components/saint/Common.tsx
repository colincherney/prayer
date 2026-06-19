import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONTS, THEME, Theme } from './theme';
import { BackIcon } from './Icons';

/* -------------------- Squiggle -------------------- */
export const Squiggle: React.FC<{ color?: string; w?: number; opacity?: number }> = ({
  color = THEME.accent,
  w = 56,
  opacity = 1,
}) => (
  <Svg width={w} height={10} viewBox="0 0 56 10" style={{ opacity }}>
    <Path
      d="M 2 5 Q 8 1, 14 5 T 26 5 T 38 5 T 50 5"
      stroke={color}
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

/* -------------------- Pill -------------------- */
export const Pill: React.FC<{
  bg?: string;
  fg?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ bg = THEME.pillBg, fg = THEME.pillInk, icon, children, style }) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 9999,
        backgroundColor: bg,
      },
      style,
    ]}>
    {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
    <Text
      style={{
        color: fg,
        fontSize: 11,
        letterSpacing: 1.5,
        fontFamily: FONTS.bodySemi,
        textTransform: 'uppercase',
      }}>
      {children}
    </Text>
  </View>
);

/* -------------------- RoundIcon -------------------- */
export const RoundIcon: React.FC<{
  bg: string;
  size?: number;
  onPress?: (e: GestureResponderEvent) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ bg, size = 44, onPress, children, style }) => (
  <Pressable
    onPress={onPress}
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
      },
      style,
    ]}>
    {children}
  </Pressable>
);

/* -------------------- ScriptureTicker (animated marquee) -------------------- */
export const ScriptureTicker: React.FC<{
  verses: { text: string; ref: string }[];
  theme?: Theme;
  speed?: number; // pixels per second
}> = ({ verses, theme = THEME, speed = 28 }) => {
  const text = verses.map(v => `${v.text}  •  ${v.ref}`).join('   •   ');
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textWidth <= 0) return;
    translateX.setValue(0);
    const duration = (textWidth / speed) * 1000;
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -textWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [textWidth, speed, translateX]);

  return (
    <View style={{ width: '100%', overflow: 'hidden', height: 22, justifyContent: 'center' }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX }],
        }}>
        <Text
          onLayout={e => setTextWidth(e.nativeEvent.layout.width)}
          numberOfLines={1}
          style={{
            fontFamily: FONTS.displayItalic,
            fontStyle: 'italic',
            fontSize: 13,
            color: theme.muted,
            letterSpacing: 0.3,
            paddingRight: 40,
          }}>
          {text}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FONTS.displayItalic,
            fontStyle: 'italic',
            fontSize: 13,
            color: theme.muted,
            letterSpacing: 0.3,
            paddingRight: 40,
          }}>
          {text}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FONTS.displayItalic,
            fontStyle: 'italic',
            fontSize: 13,
            color: theme.muted,
            letterSpacing: 0.3,
            paddingRight: 40,
          }}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};

/* -------------------- ScreenHeader -------------------- */
export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  theme?: Theme;
}> = ({ title, subtitle, onBack, right, theme = THEME }) => (
  <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18 }}>
    {(onBack || right) && (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <BackIcon size={16} color={theme.ink} />
          </Pressable>
        ) : (
          <View />
        )}
        {right}
      </View>
    )}
    <Text
      style={{
        fontFamily: FONTS.display,
        fontSize: 36,
        lineHeight: 36,
        color: theme.ink,
        marginTop: 14,
        marginBottom: 6,
        letterSpacing: -0.4,
      }}>
      {title}
    </Text>
    {subtitle ? (
      <Text
        style={{
          fontFamily: FONTS.displayItalic,
          fontStyle: 'italic',
          fontSize: 13,
          color: theme.muted,
        }}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

/* -------------------- SectionLabel -------------------- */
export const SectionLabel: React.FC<{
  children: React.ReactNode;
  theme?: Theme;
  style?: StyleProp<ViewStyle>;
}> = ({ children, theme = THEME, style }) => (
  <View style={[{ marginTop: 24, marginBottom: 12 }, style]}>
    <Text
      style={{
        fontFamily: FONTS.bodySemi,
        fontSize: 11.5,
        letterSpacing: 1.6,
        color: theme.muted,
        textTransform: 'uppercase',
      }}>
      {children}
    </Text>
  </View>
);

/* -------------------- PrimaryButton (rounded pill, accent) -------------------- */
export const PrimaryButton: React.FC<{
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  bg?: string;
  fg?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ label, onPress, disabled, rightIcon, bg, fg = '#FFF', style }) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    style={[
      {
        backgroundColor: disabled ? THEME.line : bg ?? THEME.accent,
        borderRadius: 9999,
        paddingVertical: 17,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      },
      style,
    ]}>
    <Text
      style={{
        color: fg,
        fontFamily: FONTS.bodySemi,
        fontSize: 15,
        letterSpacing: 0.4,
      }}>
      {label}
    </Text>
    {rightIcon}
  </Pressable>
);
