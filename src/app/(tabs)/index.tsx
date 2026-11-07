import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StatusBar, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { HomePet } from '@/components/pets/HomePet';
import { useAppearanceMode } from '@/components/saint/appearanceMode';
import { ChristmasScene } from '@/components/saint/ChristmasScene';
import { DustMotes } from '@/components/saint/DustMotes';
import { HalloweenScene } from '@/components/saint/HalloweenScene';
import { HeroIllustration } from '@/components/saint/Hero';
import { PenIcon, PrayingIcon, ShieldIcon, SparkleIcon } from '@/components/saint/Icons';
import { LamplitScene } from '@/components/saint/LamplitScene';
import { MONTHLY_ROOMS, MonthlyRoomName } from '@/components/saint/monthlyRooms';
import { MONTHLY_SCENES } from '@/components/saint/monthlyScenes';
import { PRAYER_ROOM_LABELS, PrayerRoomName, usePrayerRoom } from '@/components/saint/prayerRoom';
import { RainforestVigilScene } from '@/components/saint/RainforestVigilScene';
import { StarlitGardenScene } from '@/components/saint/StarlitGardenScene';
import {
  CHRISTMAS_VERSES,
  FONTS,
  HALLOWEEN_VERSES,
  THANKSGIVING_VERSES,
  Theme,
  useTheme,
  VERSES,
} from '@/components/saint/theme';
import { ThanksgivingScene } from '@/components/saint/ThanksgivingScene';
import { useSaintFonts } from '@/components/saint/useFonts';
import { WindowSeatScene } from '@/components/saint/WindowSeatScene';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ROOM_SCENES: Partial<Record<PrayerRoomName, React.ComponentType>> = {
  lamp: LamplitScene,
  window: WindowSeatScene,
  stars: StarlitGardenScene,
  jungle: RainforestVigilScene,
  halloween: HalloweenScene,
  thanksgiving: ThanksgivingScene,
  christmas: ChristmasScene,
  ...MONTHLY_SCENES,
};
const SEASONAL_VERSES: Partial<Record<PrayerRoomName, typeof VERSES>> = {
  halloween: HALLOWEEN_VERSES,
  thanksgiving: THANKSGIVING_VERSES,
  christmas: CHRISTMAS_VERSES,
};

/** Choose readable button ink for both pale room highlights and saturated theme accents. */
function accentInk(color: string) {
  const channels = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? '#090F0D' : '#FFFFFF';
}

function HomeAction({ onPress, accessibilityLabel, children, style }: {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const press = useSharedValue(0);
  const feedback = useAnimatedStyle(() => ({
    opacity: 1 - press.get() * 0.2,
    transform: [{ scale: reducedMotion ? 1 : 1 - press.get() * 0.025 }],
  }));
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => press.set(withTiming(1, { duration: reducedMotion ? 0 : 120 }))}
      onPressOut={() => press.set(withTiming(0, { duration: reducedMotion ? 0 : 200 }))}
      style={[style, feedback]}>
      {children}
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const fontsLoaded = useSaintFonts();
  const { mode } = useAppearanceMode();
  const { theme } = useTheme();
  const { name: roomName } = usePrayerRoom();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isRoom = mode === 'room';
  const actionInk = accentInk(theme.accent);
  const canvasWidth = Math.min(width - insets.left - insets.right, 560);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);
  // Measure the flex space left by the header and controls, rather than making the page taller than the screen.
  const portalHeight = Math.max(1, stageSize?.height ?? height - insets.top - insets.bottom - 236);
  const portalWidth = Math.max(1, Math.min(stageSize?.width ?? canvasWidth - 48, portalHeight * 0.82, 360));
  const compact = (contentHeight ?? height - insets.top - insets.bottom) < 620;
  const showVerse = portalHeight >= 330;
  const classicRoom = ['lamp', 'window', 'stars', 'jungle'].includes(roomName);
  const artHeight = portalWidth * (classicRoom ? 874 / 402 : 844 / 390);
  const vignetteSize = Math.max(1, Math.min(portalWidth - 12, portalHeight * 0.64, 260));
  const Scene = ROOM_SCENES[roomName] ?? LamplitScene;
  const monthly = isRoom && roomName in MONTHLY_ROOMS ? MONTHLY_ROOMS[roomName as MonthlyRoomName] : undefined;
  const verse = isRoom ? monthly?.verses.top[0] ?? SEASONAL_VERSES[roomName]?.[0] ?? VERSES[2] : VERSES[2];
  const settingLabel = isRoom ? PRAYER_ROOM_LABELS[roomName] : `${theme.name} theme`;

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient pointerEvents="none" colors={[theme.bg, theme.bgSoft, theme.bg]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View onLayout={event => setContentHeight(event.nativeEvent.layout.height)} style={[styles.canvas, { maxWidth: canvasWidth }]}>
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={1.4} style={styles.wordmark}>Saint Central</Text>
            <HomeAction
              onPress={() => router.push('/customization')}
              accessibilityLabel={`Change your prayer room or theme. Current setting: ${settingLabel}`}
              style={styles.appearanceButton}>
              <SparkleIcon size={19} color={theme.accent} />
            </HomeAction>
          </View>

          <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(550)} style={styles.welcome}>
            <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
              maxFontSizeMultiplier={1.3} style={styles.title}>
              Come as <Text style={styles.titleItalic}>you are.</Text>
            </Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.roomLabel}>{settingLabel}</Text>
          </Animated.View>

          <View
            style={styles.stage}
            onLayout={event => {
              const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
              setStageSize(current => current?.width === nextWidth && current.height === nextHeight
                ? current : { width: nextWidth, height: nextHeight });
            }}>
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.duration(750)}
              style={[styles.portal, {
                width: portalWidth,
                height: portalHeight,
                borderTopLeftRadius: portalWidth / 2,
                borderTopRightRadius: portalWidth / 2,
              }]}>
              {isRoom ? (
                <>
                  <View pointerEvents="box-none" style={{ position: 'absolute', top: -artHeight * 0.04, width: portalWidth, height: artHeight }}>
                    <Scene />
                    <HomePet variant={roomName} accent={theme.accent} sceneSize={{ width: portalWidth, height: artHeight }} />
                  </View>
                  <DustMotes count={6} />
                </>
              ) : (
                <View pointerEvents="box-none" style={styles.themeScene}>
                  <View style={{ width: vignetteSize, height: vignetteSize }}>
                    <View pointerEvents="none"><HeroIllustration width={vignetteSize} height={vignetteSize} /></View>
                    <HomePet variant="theme" accent={theme.accent} sceneSize={{ width: vignetteSize, height: vignetteSize }} />
                  </View>
                </View>
              )}
              <LinearGradient pointerEvents="none" colors={['transparent', theme.bgSoft]}
                locations={[0, 1]} style={[styles.portalFade, { height: showVerse ? 160 : 40 }]} />
              {showVerse ? (
                <View pointerEvents="none" style={styles.verse}>
                  <View style={styles.verseRule} />
                  <Text numberOfLines={3} maxFontSizeMultiplier={1.2} style={styles.verseText}>&ldquo;{verse.text}.&rdquo;</Text>
                  <Text maxFontSizeMultiplier={1.2} style={styles.verseReference}>{verse.ref}</Text>
                </View>
              ) : null}
            </Animated.View>
          </View>

          <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(650)} style={styles.footer}>
            {!compact ? <Text maxFontSizeMultiplier={1.3} style={styles.invitation}>A little prayer can be a new beginning.</Text> : null}
            <View style={styles.actions}>
              <HomeAction onPress={() => router.push('/pair')} accessibilityLabel="Share a prayer anonymously"
                style={[styles.action, styles.primaryAction]}>
                <PenIcon size={17} color={actionInk} />
                <Text maxFontSizeMultiplier={1.6} style={[styles.actionLabel, { color: actionInk }]}>Share a prayer</Text>
              </HomeAction>
              <HomeAction onPress={() => router.push('/explore')} accessibilityLabel="Pray for someone"
                style={[styles.action, styles.secondaryAction]}>
                <PrayingIcon size={18} color={theme.ink} />
                <Text maxFontSizeMultiplier={1.6} style={[styles.actionLabel, { color: theme.ink }]}>Pray for others</Text>
              </HomeAction>
            </View>
            <View style={styles.reassurance}>
              <ShieldIcon size={11} color={theme.inkSoft} />
              <Text maxFontSizeMultiplier={1.4} style={styles.reassuranceText}>Always anonymous. Always welcome.</Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: theme.bg },
  safe: { flex: 1 },
  canvas: { flex: 1, width: '100%', alignSelf: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 8, minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  wordmark: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 30, letterSpacing: -0.4, color: theme.ink, flexShrink: 1 },
  appearanceButton: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' },
  welcome: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14, alignItems: 'center' },
  title: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 44, letterSpacing: -1.2, color: theme.ink, textAlign: 'center' },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: theme.accent },
  roomLabel: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 17, color: theme.inkSoft, marginTop: 5, letterSpacing: 0.8 },
  stage: { flex: 1, minHeight: 0, marginHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  portal: { overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, backgroundColor: theme.bgSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line },
  themeScene: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  portalFade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  verse: { position: 'absolute', bottom: 21, left: 22, right: 22, alignItems: 'center' },
  verseRule: { width: 22, height: 1, backgroundColor: theme.accent, opacity: 0.65, marginBottom: 12 },
  verseText: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 16, lineHeight: 23, textAlign: 'center', color: theme.ink },
  verseReference: { fontFamily: FONTS.body, fontSize: 9, lineHeight: 15, color: theme.inkSoft, marginTop: 7 },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12, flexShrink: 0 },
  invitation: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 13, lineHeight: 20, color: theme.inkSoft, textAlign: 'center', marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 56, paddingHorizontal: 13, paddingVertical: 14, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  primaryAction: { backgroundColor: theme.accent },
  secondaryAction: { backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line },
  actionLabel: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  reassurance: { minHeight: 32, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  reassuranceText: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 16, color: theme.inkSoft, flexShrink: 1, textAlign: 'center' },
});
