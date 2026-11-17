import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon, ShieldIcon } from './Icons';
import { SafeAreaView } from './SafeArea';
import { authHaptic } from './authHaptics';
import { FONTS, mixColors, useTheme, type Theme } from './theme';
import { useSaintFonts } from './useFonts';

const OLIVE_LEAF = require('../../../assets/images/auth-edge-leaf.webp');
const ENTER_STEP = FadeIn.duration(165);
const EDGE_LEAVES = [
  { side: 'left', offset: 18, top: '4%', size: 35, angle: -16, opacity: 0.78 },
  { side: 'left', offset: -5, top: '9%', size: 24, angle: -68, opacity: 0.58 },
  { side: 'left', offset: 2, top: '24%', size: 23, angle: 40, opacity: 0.66 },
  { side: 'left', offset: -6, top: '51%', size: 33, angle: -38, opacity: 0.77 },
  { side: 'left', offset: 6, top: '75%', size: 17, angle: 25, opacity: 0.53 },
  { side: 'left', offset: 14, top: '93%', size: 31, angle: 146, opacity: 0.72 },
  { side: 'right', offset: 6, top: '6%', size: 25, angle: 116, opacity: 0.66 },
  { side: 'right', offset: -5, top: '18%', size: 32, angle: 62, opacity: 0.77 },
  { side: 'right', offset: 3, top: '39%', size: 19, angle: -44, opacity: 0.56 },
  { side: 'right', offset: -2, top: '64%', size: 26, angle: 51, opacity: 0.69 },
  { side: 'right', offset: 6, top: '86%', size: 35, angle: 170, opacity: 0.8 },
  { side: 'right', offset: 35, top: '95%', size: 20, angle: 44, opacity: 0.59 },
] as const;

export function backFromAuth() {
  if (router.canGoBack()) router.back();
  else router.replace('/auth');
}

function OliveLeafBackdrop({ theme, wide }: { theme: Theme; wide: boolean }) {
  const insets = useSafeAreaInsets();
  const scale = wide ? 1.35 : 1;

  return (
    <View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.backdrop}>
      <LinearGradient
        colors={[mixColors(theme.bg, theme.bgSoft, 0.55), theme.bg, mixColors(theme.bg, theme.bgSoft, 0.3)]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, insets]}>
        {EDGE_LEAVES.map(({ side, offset, top, size, angle, opacity }) => (
          <Image
            key={`${side}-${top}`}
            source={OLIVE_LEAF}
            contentFit="contain"
            accessible={false}
            style={[
              styles.leaf,
              {
                [side]: offset * scale,
                top,
                width: size * scale,
                height: size * 0.42 * scale,
                opacity,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function AuthScreen({ children, onBack, step }: {
  children: ReactNode;
  onBack?: () => void;
  step?: string;
}) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const ready = useSaintFonts();
  const reducedMotion = useReducedMotion();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const canScroll = viewportHeight > 0 && contentHeight - viewportHeight > 1;
  const paddingTop = height > 700 ? Math.min(height * 0.1, 91) : 26;
  const paddingHorizontal = width < 370 ? 24 : 42;

  if (!ready) return <View style={[styles.safe, { backgroundColor: theme.bg }]} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <OliveLeafBackdrop theme={theme} wide={width >= 720} />
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_, measuredHeight) => setContentHeight(measuredHeight)}
          scrollEnabled={canScroll}
          bounces={false}
          overScrollMode={canScroll ? 'auto' : 'never'}
          showsVerticalScrollIndicator={canScroll}
          testID="auth-scroll"
          contentContainerStyle={[styles.scroll, { paddingTop, paddingHorizontal }]}>
          <View style={styles.shell}>
            <View style={styles.masthead}>
              {onBack && (
                <Pressable
                  onPress={() => {
                    authHaptic('select');
                    onBack();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  style={({ pressed }) => [
                    styles.backButton,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                    pressed && styles.pressed,
                  ]}>
                  <BackIcon size={18} color={theme.ink} />
                </Pressable>
              )}
              <Text style={[styles.brandText, { color: theme.ink }]}>Saint Central</Text>
            </View>
            <Animated.View
              key={step}
              entering={step && !reducedMotion ? ENTER_STEP : undefined}
              style={styles.content}>
              {children}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeading({ title, accent, centered, children }: {
  title: string;
  accent?: string;
  centered?: boolean;
  children?: ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={[styles.title, centered && styles.welcomeTitle, { color: theme.ink }]}>
        {title}
        {accent && (
          <Text style={[styles.titleAccent, { color: theme.isDark ? theme.accent : theme.pillInk }]}> {accent}</Text>
        )}
      </Text>
      {children && <Text style={[styles.description, centered && styles.centered, { color: theme.inkSoft }]}>{children}</Text>}
    </View>
  );
}

export function AuthTextLink({ label, onPress, disabled, end }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  end?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => {
        authHaptic('select');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.textLink, end && styles.textLinkEnd, (pressed || disabled) && styles.pressed]}>
      <Text style={[styles.linkText, { color: theme.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function AuthPrivacy({ children }: { children: string }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.privacy, { backgroundColor: theme.bgSoft }]}>
      <ShieldIcon size={16} color={theme.pillInk} />
      <Text style={[styles.privacyText, { color: theme.inkSoft }]}>{children}</Text>
    </View>
  );
}

export function AuthMessage({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const { theme } = useTheme();
  const color = error ? (theme.isDark ? '#FFBEAB' : '#922F27') : theme.inkSoft;

  return (
    <Text
      accessibilityRole={error ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.message, { color }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  leaf: { position: 'absolute' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 24 },
  shell: { width: '100%', maxWidth: 420, gap: 22 },
  masthead: { minHeight: 72, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 52 },
  brandText: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.25, textAlign: 'center', textTransform: 'uppercase' },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: 14 },
  heading: { gap: 7, marginBottom: 4 },
  title: { fontFamily: FONTS.displaySemi, fontSize: 32, lineHeight: 40, letterSpacing: -1.15 },
  welcomeTitle: { fontSize: 39, lineHeight: 47, textAlign: 'center' },
  titleAccent: { fontFamily: FONTS.displayItalic },
  description: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 22 },
  centered: { textAlign: 'center' },
  pressed: { opacity: 0.68 },
  textLink: { minHeight: 44, paddingVertical: 10, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  textLinkEnd: { alignSelf: 'flex-end' },
  linkText: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  privacyText: { flex: 1, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18 },
  message: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19 },
});
