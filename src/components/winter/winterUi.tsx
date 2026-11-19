import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { DriftLayer, Flake, SnowFall, Star, Twinkles } from '@/components/saint/SceneParticles';
import { FROST_LORD_ART, FROST_LORD_FRAMES } from '@/components/pets/FrostLordPet';
import { realStart, shortDate, useWinterEvent } from '@/lib/winterEvent';

// The Long Winter's look, from the design pack: navy, gold, aurora teal and cream, all in Playfair Display, no italics.

export const W = {
  navy: '#0F1834',
  navyDeep: '#0B1230',
  sheet: '#10182A',
  card: '#1A2340',
  cardOn: '#183040',
  gold: '#E9C46A',
  teal: '#5FE3C0',
  cream: '#FBF4E6',
  ice: '#BFE6FF',
  muted: 'rgba(251,244,230,0.66)',
  faint: 'rgba(251,244,230,0.38)',
  line: 'rgba(251,244,230,0.10)',
  track: 'rgba(251,244,230,0.12)',
} as const;

export const WF = {
  regular: 'PlayfairDisplay_400Regular',
  medium: 'PlayfairDisplay_500Medium',
  semi: 'PlayfairDisplay_600SemiBold',
  bold: 'PlayfairDisplay_700Bold',
} as const;

/** The event screens always use Playfair Display, whatever font the rest of the app is in. */
export function useWinterFonts(): boolean {
  const [loaded] = useFonts({ PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });
  return loaded;
}

const STARS: Star[] = [
  [20, 30, 1.2, 0], [70, 80, 1, 0.35], [130, 20, 1.3, 0.7], [190, 64, 1, 0.1], [250, 26, 1.2, 0.45],
  [320, 52, 1.3, 0.8], [370, 120, 1, 0.2], [30, 170, 1.1, 0.55], [350, 210, 1.1, 0.9], [110, 240, 1, 0.3],
].map(([x, y, r, phase]) => [x / 390, y / 420, r, phase] as Star);
const SNOW: Flake[] = [[24, 2, 0], [96, 1.6, 0.17], [168, 2.2, 0.33], [240, 1.6, 0.5], [312, 2, 0.67], [370, 1.6, 0.83]]
  .map(([x, r, phase]) => [x / 390, r, phase] as Flake);

const BackdropSky = React.memo(function BackdropSky() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="wbSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1230" />
          <Stop offset="0.6" stopColor="#18285A" />
          <Stop offset="1" stopColor="#2C4A7A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={420} fill="url(#wbSky)" />
    </Svg>
  );
});

const BackdropAurora = React.memo(function BackdropAurora() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="wbAur" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5FE3C0" stopOpacity={0.55} />
          <Stop offset="0.55" stopColor="#5FE3C0" stopOpacity={0.15} />
          <Stop offset="1" stopColor="#6E8BFF" stopOpacity={0.35} />
        </LinearGradient>
      </Defs>
      <Path d="M-40 140 C40 60 140 170 230 110 C300 64 350 120 430 90 L430 190 C350 220 290 170 220 220 C130 280 40 190 -40 260 Z" fill="url(#wbAur)" opacity={0.6} />
      <Path d="M-40 230 C70 190 160 250 250 210 C320 180 370 220 430 200 L430 250 C370 270 320 230 250 262 C160 300 70 245 -40 290 Z" fill="#6E8BFF" opacity={0.18} />
    </Svg>
  );
});

const BackdropHills = React.memo(function BackdropHills() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="xMidYMid slice">
      <Polygon points="-20,420 80,300 180,420" fill="#24396A" />
      <Polygon points="80,300 66,320 80,316 94,320" fill="#C9D9F0" />
      <Polygon points="210,420 320,280 440,420" fill="#24396A" />
      <Polygon points="320,280 304,302 320,297 336,302" fill="#C9D9F0" />
    </Svg>
  );
});

/**
 * The arctic sky behind the event screens: a navy gradient, a drifting aurora, stars and falling snow. The still parts
 * are SVGs drawn once; the motion is native view transforms (see SceneParticles). `animated={false}` for a still
 * copy, like the home banner, which sits on a home scene that already moves.
 */
export function AuroraBackdrop({ hills = false, animated = true }: { hills?: boolean; animated?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <BackdropSky />
      <View style={StyleSheet.absoluteFill}>
        <DriftLayer reach={22} duration={28000} animated={animated}>
          <BackdropAurora />
        </DriftLayer>
      </View>
      <Twinkles stars={STARS} animated={animated} />
      {hills ? (
        <View style={StyleSheet.absoluteFill}>
          <BackdropHills />
        </View>
      ) : null}
      {animated ? <SnowFall flakes={SNOW} duration={9000} /> : null}
    </View>
  );
}

/**
 * The Frost Lord line's art for a stage; stage 0 (not met yet) is Snowcap as a silhouette. `height` sizes the bear
 * (the original 1120 px frame), so all three stand at the same scale; the Mage's and Lord's hats rise above it.
 */
export function StageImage({ stage, height, dim }: { stage: number; height: number; dim?: boolean }) {
  const s = (Math.min(3, Math.max(1, stage)) as 1 | 2 | 3);
  const f = FROST_LORD_FRAMES[s];
  const scale = height / f.body;
  const silhouette = stage < 1 || dim;
  return (
    <Image
      source={FROST_LORD_ART[s]}
      accessibilityIgnoresInvertColors
      style={{ height: f.h * scale, width: f.w * scale, tintColor: silhouette ? 'rgba(191,230,255,0.28)' : undefined }}
      resizeMode="contain"
    />
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: W.track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const BANNER_KEY = 'winter.bannerDismissed';

/**
 * The home screen's banner (design: home-winter-banner@3x.png): only while the event is on and switched on in the
 * database, opens the event screen, and can be put away for the rest of the day.
 */
export function WinterBanner({ style }: { style?: object }) {
  const fontsLoaded = useWinterFonts();
  const { state, phase, today } = useWinterEvent();
  const [dismissedOn, setDismissedOn] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    AsyncStorage.getItem(BANNER_KEY).then(setDismissedOn).catch(() => setDismissedOn(null));
  }, []);
  if (!fontsLoaded || !state || !state.event.is_active || phase !== 'live' || dismissedOn === undefined || dismissedOn === today) {
    return null;
  }
  const stage = state.progress?.stage_unlocked ?? 0;
  const dismiss = () => {
    setDismissedOn(today);
    AsyncStorage.setItem(BANNER_KEY, today).catch(() => {});
  };
  return (
    <Pressable
      onPress={() => router.push('/winter')}
      accessibilityRole="button"
      accessibilityLabel={`${state.event.title}, winter event, ${shortDate(realStart(state.event))} to ${shortDate(state.event.ends_on)}. Opens the event.`}
      style={({ pressed }) => [banner.wrap, style, pressed && { opacity: 0.9 }]}>
      {/* still: the home scene behind it already moves */}
      <AuroraBackdrop hills animated={false} />
      <View style={banner.text}>
        <Text style={banner.kicker} numberOfLines={1}>
          WINTER EVENT · {shortDate(realStart(state.event)).toUpperCase()} TO {shortDate(state.event.ends_on).toUpperCase()}
        </Text>
        <Text style={banner.title} numberOfLines={2}>{state.event.title}</Text>
      </View>
      <View style={banner.art} pointerEvents="none">
        {/* small enough that the Lord's whole hat fits the 96pt banner */}
        <StageImage stage={Math.max(stage, 3)} height={74} dim={stage < 3} />
        {stage >= 1 && stage < 3 ? (
          <View style={banner.current}>
            <StageImage stage={stage} height={70} />
          </View>
        ) : null}
      </View>
      <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Hide the winter banner for today" style={banner.close}>
        <Text style={banner.closeText}>×</Text>
      </Pressable>
    </Pressable>
  );
}

const banner = StyleSheet.create({
  wrap: { height: 96, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(191,230,255,0.18)' },
  text: { flex: 1, paddingLeft: 18, paddingRight: 6, gap: 2 },
  kicker: { fontFamily: WF.semi, fontSize: 9.5, letterSpacing: 1.6, color: W.ice },
  title: { fontFamily: WF.bold, fontSize: 26, lineHeight: 30, color: W.cream },
  art: { width: 112, height: 96, alignItems: 'center', justifyContent: 'flex-end', marginRight: 10 },
  current: { position: 'absolute', left: -18, bottom: 0 },
  close: { position: 'absolute', top: 6, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,11,30,0.45)' },
  closeText: { color: W.cream, fontSize: 15, lineHeight: 17, fontFamily: WF.semi },
});
