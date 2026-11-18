import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { CormorantGaramond_600SemiBold_Italic } from '@expo-google-fonts/cormorant-garamond/600SemiBold_Italic';
import { useFonts } from 'expo-font';
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

import { AuthChapel } from './AuthChapel';
import { BackIcon, ShieldIcon, SparkleIcon } from './Icons';
import { SafeAreaView } from './SafeArea';
import { AUTH_SCENE_THEME, AuthAppearance, useAuthTheme } from './authAppearance';
import { authHaptic } from './authHaptics';
import { FONTS, mixColors, useTheme, type Theme } from './theme';
import { useSaintFonts } from './useFonts';

const OLIVE_LEAF = require('../../../assets/images/auth-edge-leaf.webp');
const ENTER_STEP = FadeIn.duration(165);
const CHAPEL_FONTS = { CormorantGaramond_600SemiBold, CormorantGaramond_600SemiBold_Italic };
const SERIF_FALLBACK = Platform.OS === 'ios' || Platform.OS === 'web' ? 'Georgia' : 'serif';
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

export function AuthScreen({ children, onBack, step, immersive = false }: {
  children: ReactNode;
  onBack?: () => void;
  step?: string;
  immersive?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { theme: appTheme } = useTheme();
  const theme = immersive ? AUTH_SCENE_THEME : appTheme;
  const ready = useSaintFonts();
  const reducedMotion = useReducedMotion();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [welcomeMastheadHeight, setWelcomeMastheadHeight] = useState(0);
  const [welcomeBodyHeight, setWelcomeBodyHeight] = useState(0);
  const wide = immersive && width >= 900;
  const compact = immersive && !wide;
  const shortForm = compact && step !== 'welcome' && height - top - bottom < 610;
  const mobileWelcome = compact && step === 'welcome';
  const paddingTop = compact ? 6 : immersive ? 24 : height > 700 ? Math.min(height * 0.1, 91) : 26;
  const paddingBottom = compact ? 8 : 24;
  const paddingHorizontal = immersive ? (wide ? 34 : width < 360 ? 16 : 20) : width < 370 ? 24 : 42;
  const availableHeight = viewportHeight || height - top - bottom;
  const innerHeight = availableHeight - paddingTop - paddingBottom;
  // Let the illustration give up space before any buttons, text, or legal links need to scroll.
  const welcomeHeight = innerHeight - welcomeMastheadHeight - welcomeBodyHeight - COMPACT_CONTENT_MARGIN;
  const chapelHeight = wide
    ? Math.min(744, Math.max(220, innerHeight))
    : Math.floor(Math.min(300, width * 0.73, welcomeHeight) / 4) * 4;
  const welcomeMeasured = welcomeMastheadHeight > 0 && welcomeBodyHeight > 0;
  const showChapel = wide || (mobileWelcome && welcomeMeasured && chapelHeight >= 96);
  const canScroll = viewportHeight > 0 && contentHeight - viewportHeight > 1;
  const chapel = showChapel ? <AuthChapel height={chapelHeight} /> : null;

  if (!ready) return <View style={[styles.safe, { backgroundColor: theme.bg }]} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {immersive ? (
        <LinearGradient
          pointerEvents="none"
          colors={['#0B1220', '#18263E', '#0B1220']}
          locations={[0, 0.35, 0.83]}
          start={{ x: 0.03, y: 0 }}
          end={{ x: wide ? 1 : 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <OliveLeafBackdrop theme={theme} wide={width >= 720} />
      )}
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
          contentContainerStyle={[styles.scroll, (wide || (mobileWelcome && !canScroll)) && styles.centerScroll, { paddingTop, paddingBottom, paddingHorizontal }]}>
          <View style={wide ? styles.wideLayout : styles.stack}>
            {wide ? <View style={styles.chapelColumn}>{chapel}</View> : null}
            <View style={[styles.shell, immersive && styles.chapelShell, wide && styles.wideShell]}>
              <View
                onLayout={mobileWelcome ? event => setWelcomeMastheadHeight(Math.ceil(event.nativeEvent.layout.height)) : undefined}
                style={[styles.masthead, immersive && styles.chapelMasthead, compact && styles.compactMasthead]}>
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
                <View style={styles.wordmark}>
                  {immersive ? (
                    <View aria-hidden style={styles.wordmarkIcon}>
                      <SparkleIcon size={15} color={theme.accent} />
                    </View>
                  ) : null}
                  <Text style={[styles.brandText, { color: theme.ink }]}>Saint Central</Text>
                </View>
              </View>
              {!wide ? chapel : null}
              <AuthAppearance.Provider value={immersive ? theme : null}>
                <Animated.View
                  key={step}
                  entering={step && !reducedMotion ? ENTER_STEP : undefined}
                  onLayout={mobileWelcome ? event => setWelcomeBodyHeight(Math.ceil(event.nativeEvent.layout.height)) : undefined}
                  style={[styles.content, immersive && styles.chapelContent, compact && styles.compactContent, shortForm && styles.shortFormContent, wide && styles.panel]}>
                  {wide ? <LinearGradient pointerEvents="none" colors={['#172235', theme.cardDark]} style={styles.panelGradient} /> : null}
                  {children}
                </Animated.View>
              </AuthAppearance.Provider>
            </View>
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
  const theme = useAuthTheme();
  const immersive = theme === AUTH_SCENE_THEME;
  const { width, height } = useWindowDimensions();
  const compact = immersive && width < 900;
  const narrowForm = compact && !centered && width < 360;
  const [fontsLoaded] = useFonts(CHAPEL_FONTS);
  const serif = fontsLoaded ? 'CormorantGaramond_600SemiBold' : SERIF_FALLBACK;
  const italic = fontsLoaded ? 'CormorantGaramond_600SemiBold_Italic' : SERIF_FALLBACK;

  return (
    <View style={[styles.heading, narrowForm && styles.narrowFormHeading]}>
      <Text accessibilityRole="header" style={[
        styles.title,
        centered && styles.welcomeTitle,
        immersive && [styles.chapelTitle, centered && styles.chapelWelcomeTitle, { fontFamily: serif }],
        compact && styles.compactTitle,
        narrowForm && styles.narrowFormTitle,
        compact && centered && (height < 700 ? styles.shortWelcomeTitle : styles.compactWelcomeTitle),
        { color: theme.ink },
      ]}>
        {title}
        {accent && (
          <Text style={[
            styles.titleAccent,
            immersive && { fontFamily: italic, fontStyle: fontsLoaded ? 'normal' : 'italic' },
            { color: theme.isDark ? theme.accent : theme.pillInk },
          ]}>{immersive && centered ? '\n' : ' '}{accent}</Text>
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
  const theme = useAuthTheme();

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
  const theme = useAuthTheme();

  return (
    <View style={[styles.privacy, { backgroundColor: theme.bgSoft }]}>
      <ShieldIcon size={16} color={theme.pillInk} />
      <Text style={[styles.privacyText, { color: theme.inkSoft }]}>{children}</Text>
    </View>
  );
}

export function AuthMessage({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const theme = useAuthTheme();
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

const COMPACT_CONTENT_MARGIN = 4;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  leaf: { position: 'absolute' },
  scroll: { flexGrow: 1, alignItems: 'center' },
  centerScroll: { justifyContent: 'center' },
  stack: { width: '100%', alignItems: 'center' },
  wideLayout: { width: '100%', maxWidth: 1270, flexDirection: 'row', alignItems: 'center', gap: 24 },
  chapelColumn: { flex: 1 },
  shell: { width: '100%', maxWidth: 420, gap: 22 },
  chapelShell: { maxWidth: 460, gap: 0 },
  wideShell: { flex: 1, maxWidth: 474, paddingBottom: 14 },
  masthead: { minHeight: 72, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 52 },
  chapelMasthead: { minHeight: 58, marginBottom: 4 },
  compactMasthead: { minHeight: 44, marginBottom: 0 },
  wordmark: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  wordmarkIcon: { width: 32, height: 32, borderWidth: 1, borderColor: '#E7C59852', borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#263047' },
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
  chapelContent: { marginTop: 8, gap: 12 },
  compactContent: { marginTop: COMPACT_CONTENT_MARGIN, gap: 8 },
  shortFormContent: { gap: 5 },
  panel: { padding: 32, borderRadius: 28, borderWidth: 1, borderColor: AUTH_SCENE_THEME.line, boxShadow: '0 24px 70px #04091399' },
  panelGradient: { ...StyleSheet.absoluteFill, borderRadius: 27 },
  heading: { gap: 7, marginBottom: 4 },
  narrowFormHeading: { gap: 5, marginBottom: 0 },
  title: { fontFamily: FONTS.displaySemi, fontSize: 32, lineHeight: 40, letterSpacing: -1.15 },
  welcomeTitle: { fontSize: 39, lineHeight: 47, textAlign: 'center' },
  chapelTitle: { fontSize: 44, lineHeight: 47, letterSpacing: -0.7 },
  chapelWelcomeTitle: { fontSize: 57, lineHeight: 53, letterSpacing: -1.3 },
  compactTitle: { fontSize: 39, lineHeight: 43 },
  narrowFormTitle: { fontSize: 33, lineHeight: 37 },
  compactWelcomeTitle: { fontSize: 48, lineHeight: 45 },
  shortWelcomeTitle: { fontSize: 42, lineHeight: 39 },
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
