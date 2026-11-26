import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/saint/HapticPressable';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import {
  BELOVED_ART,
  BELOVED_FRAMES,
  FROST_LORD_ART,
  FROST_LORD_FRAMES,
  GLADI_ART,
  GLADI_FRAMES,
  PalFrame,
  SERAPH_ART,
  SERAPH_FRAME,
  VESPER_ART,
  VESPER_FRAMES,
} from '@/components/pets/FrostLordPet';
import { DriftLayer, Flake, SnowFall, Star, Twinkles } from '@/components/saint/SceneParticles';
import { BelovedForm, useBelovedForm } from '@/lib/belovedForm';
import { supabase } from '@/lib/supabase';
import { BELOVED_EVENT_ID, EventId, realStart, shortDate, SWAMP_EVENT_ID, SWORD_EVENT_ID, useEvents, WINTER_EVENT_ID } from '@/lib/winterEvent';

// The look of each seasonal event ("skin"): its colours, backdrop, companion art, intro clip and wording. Every event
// screen, the intro clip, the celebrations and the home banner draw from the skin of the event they belong to, so a
// new event is a new skin plus a row in public.events. All text is Playfair Display, no italics.

export type Palette = {
  navy: string;
  navyDeep: string;
  sheet: string;
  card: string;
  cardOn: string;
  /** The main accent: progress, buttons, rewards. */
  gold: string;
  /** The second accent: the current chapter, the community bar. */
  teal: string;
  cream: string;
  /** Small capitals over titles. */
  ice: string;
  muted: string;
  faint: string;
  line: string;
  track: string;
  /** A light theme (the Beloved): dark text on a pale sheet, so the status bar and the glass buttons go dark too. */
  light?: boolean;
};

/** The see-through buttons over the sky (back, Play clip, Skip, the banner's close). */
export function glass(P: Palette) {
  return P.light
    ? { bg: 'rgba(255,255,255,0.72)', line: 'rgba(194,84,111,0.28)', edge: 'rgba(194,84,111,0.18)' }
    : { bg: 'rgba(15,24,52,0.55)', line: 'rgba(255,255,255,0.25)', edge: 'rgba(191,230,255,0.18)' };
}

/** The Long Winter: navy, gold, aurora teal and cream. */
export const W: Palette = {
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
};

/** The Swamp King: fen navy, gold, wisp blue and dawn cream. */
export const SWAMP_PALETTE: Palette = {
  navy: '#111A26',
  navyDeep: '#0D141E',
  sheet: '#111A26',
  card: '#1B2433',
  cardOn: '#18283A',
  gold: '#C9A35A',
  teal: '#6FC3FF',
  cream: '#FBF4E6',
  ice: '#FFE2B8',
  muted: 'rgba(251,244,230,0.66)',
  faint: 'rgba(251,244,230,0.38)',
  line: 'rgba(251,244,230,0.10)',
  track: 'rgba(251,244,230,0.12)',
};

/** The Beloved: a rose garden by day. Sheet, wine text, rose, blush and gold (from the beloved design pack). */
export const BELOVED_PALETTE: Palette = {
  navy: '#FFF5F7',
  navyDeep: '#F6D3DB',
  sheet: '#FFF8F5',
  card: '#F8ECEA',
  cardOn: '#FCE3E9',
  gold: '#C2546F',
  teal: '#E8879B',
  cream: '#4A2232',
  ice: '#B14B66',
  muted: 'rgba(74,34,50,0.62)',
  faint: 'rgba(74,34,50,0.36)',
  line: 'rgba(74,34,50,0.08)',
  track: 'rgba(194,84,111,0.14)',
  light: true,
};

/** The Sword of the Spirit: deep lake teal, ice white, sky blue and the hilt's gold (from the sword wallpaper). */
export const SWORD_PALETTE: Palette = {
  navy: '#0E2A3A',
  navyDeep: '#0A1F2C',
  sheet: '#0E2A3A',
  card: '#163A4C',
  cardOn: '#1A4A5E',
  gold: '#D8B45A',
  teal: '#7FDDF2',
  cream: '#E6F8FF',
  ice: '#BFEAF6',
  muted: 'rgba(230,248,255,0.66)',
  faint: 'rgba(230,248,255,0.38)',
  line: 'rgba(230,248,255,0.10)',
  track: 'rgba(230,248,255,0.12)',
};

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

/* ------------------------------------------------ backdrops ------------------------------------------------ */
// The still parts are SVGs drawn once; the motion is native view transforms (see SceneParticles). `animated={false}`
// gives a still copy, like the home banner, which sits on a home scene that already moves.

type BackdropProps = { hills?: boolean; animated?: boolean };

const STARS: Star[] = [
  [20, 30, 1.2, 0], [70, 80, 1, 0.35], [130, 20, 1.3, 0.7], [190, 64, 1, 0.1], [250, 26, 1.2, 0.45],
  [320, 52, 1.3, 0.8], [370, 120, 1, 0.2], [30, 170, 1.1, 0.55], [350, 210, 1.1, 0.9], [110, 240, 1, 0.3],
].map(([x, y, r, phase]) => [x / 390, y / 420, r, phase] as Star);
const SNOW: Flake[] = [[24, 2, 0], [96, 1.6, 0.17], [168, 2.2, 0.33], [240, 1.6, 0.5], [312, 2, 0.67], [370, 1.6, 0.83]]
  .map(([x, r, phase]) => [x / 390, r, phase] as Flake);
const WISPS: Star[] = [[60, 330, 2.4, 0], [150, 360, 2, 0.4], [250, 340, 2.6, 0.75], [330, 370, 2, 0.2]]
  .map(([x, y, r, phase]) => [x / 390, y / 420, r, phase] as Star);

const Full = ({ children }: { children: React.ReactNode }) => (
  <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="xMidYMid slice">{children}</Svg>
);

const WinterSky = React.memo(function WinterSky() {
  return (
    <Full>
      <Defs>
        <LinearGradient id="wbSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1230" />
          <Stop offset="0.6" stopColor="#18285A" />
          <Stop offset="1" stopColor="#2C4A7A" />
        </LinearGradient>
      </Defs>
      <Rect width={390} height={420} fill="url(#wbSky)" />
    </Full>
  );
});

const WinterAurora = React.memo(function WinterAurora() {
  return (
    <Full>
      <Defs>
        <LinearGradient id="wbAur" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5FE3C0" stopOpacity={0.55} />
          <Stop offset="0.55" stopColor="#5FE3C0" stopOpacity={0.15} />
          <Stop offset="1" stopColor="#6E8BFF" stopOpacity={0.35} />
        </LinearGradient>
      </Defs>
      <Path d="M-40 140 C40 60 140 170 230 110 C300 64 350 120 430 90 L430 190 C350 220 290 170 220 220 C130 280 40 190 -40 260 Z" fill="url(#wbAur)" opacity={0.6} />
      <Path d="M-40 230 C70 190 160 250 250 210 C320 180 370 220 430 200 L430 250 C370 270 320 230 250 262 C160 300 70 245 -40 290 Z" fill="#6E8BFF" opacity={0.18} />
    </Full>
  );
});

const WinterHills = React.memo(function WinterHills() {
  return (
    <Full>
      <Polygon points="-20,420 80,300 180,420" fill="#24396A" />
      <Polygon points="80,300 66,320 80,316 94,320" fill="#C9D9F0" />
      <Polygon points="210,420 320,280 440,420" fill="#24396A" />
      <Polygon points="320,280 304,302 320,297 336,302" fill="#C9D9F0" />
    </Full>
  );
});

/** The arctic sky: a navy gradient, a drifting aurora, stars and falling snow. */
export function AuroraBackdrop({ hills = false, animated = true }: BackdropProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <WinterSky />
      <View style={StyleSheet.absoluteFill}>
        <DriftLayer reach={22} duration={28000} animated={animated}>
          <WinterAurora />
        </DriftLayer>
      </View>
      <Twinkles stars={STARS} animated={animated} />
      {hills ? <View style={StyleSheet.absoluteFill}><WinterHills /></View> : null}
      {animated ? <SnowFall flakes={SNOW} duration={9000} /> : null}
    </View>
  );
}

const FenSky = React.memo(function FenSky() {
  return (
    <Full>
      <Defs>
        <LinearGradient id="fbSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1E2033" />
          <Stop offset="0.55" stopColor="#3A3350" />
          <Stop offset="1" stopColor="#6A5260" />
        </LinearGradient>
        <RadialGradient id="fbSun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#E8B97A" stopOpacity={0.4} />
          <Stop offset="1" stopColor="#E8B97A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={390} height={420} fill="url(#fbSky)" />
      <Circle cx={195} cy={300} r={130} fill="url(#fbSun)" />
    </Full>
  );
});

const FenMist = React.memo(function FenMist() {
  return (
    <Full>
      <Path d="M-40 250 C60 224 160 266 250 240 C320 220 370 250 430 234 L430 284 C350 300 260 274 170 294 C90 310 20 280 -40 298 Z" fill="#C9B8D8" opacity={0.16} />
    </Full>
  );
});

const FenHills = React.memo(function FenHills() {
  return (
    <Full>
      <Polygon points="-30,420 80,300 200,420" fill="#3B3348" />
      <Polygon points="180,420 300,290 430,420" fill="#3B3348" />
      <Path d="M70 420 L70 300 M70 350 L48 320 M70 330 L88 304" stroke="#141820" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M330 420 L330 330 M330 370 L350 344" stroke="#141820" strokeWidth={4} strokeLinecap="round" fill="none" />
    </Full>
  );
});

/** The fen at dusk: a violet sky with a low sun, drifting mist, stars and blue wisps over the water. */
export function FenBackdrop({ hills = false, animated = true }: BackdropProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <FenSky />
      <Twinkles stars={STARS} animated={animated} />
      <View style={StyleSheet.absoluteFill}>
        <DriftLayer reach={20} duration={30000} breathe={[0.5, 1]} animated={animated}>
          <FenMist />
        </DriftLayer>
      </View>
      {hills ? <View style={StyleSheet.absoluteFill}><FenHills /></View> : null}
      <Twinkles stars={WISPS} duration={3400} color="#6FC3FF" animated={animated} />
    </View>
  );
}

const SWORD_WALLPAPER = require('../../../assets/images/gladi/sword-wallpaper.jpg');
const SWORD_STARS: Star[] = [
  [30, 40, 1.2, 0], [90, 110, 1, 0.35], [150, 30, 1.3, 0.7], [250, 70, 1, 0.1], [330, 40, 1.2, 0.45], [360, 160, 1.1, 0.8],
].map(([x, y, r, phase]) => [x / 390, y / 420, r, phase] as Star);

/** The lake of the sword: the sword wallpaper (its wings and blade in the middle of any crop) and twinkling stars. */
export function SwordBackdrop({ animated = true }: BackdropProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: SWORD_PALETTE.navy }]} pointerEvents="none">
      <Image source={SWORD_WALLPAPER} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <Twinkles stars={SWORD_STARS} color="#E6F8FF" animated={animated} />
    </View>
  );
}

/** A small heart, centred on x with its notch at y, `s` wide each side. */
export function heartPath(x: number, y: number, s: number): string {
  return `M${x} ${y + s * 0.3} C${x} ${y - s * 0.25} ${x - s} ${y - s * 0.25} ${x - s} ${y + s * 0.3} C${x - s} ${y + s * 0.75} ${x - s * 0.2} ${y + s} ${x} ${y + s * 1.3} C${x + s * 0.2} ${y + s} ${x + s} ${y + s * 0.75} ${x + s} ${y + s * 0.3} C${x + s} ${y - s * 0.25} ${x} ${y - s * 0.25} ${x} ${y + s * 0.3} Z`;
}

const ROSE_SPARKLES: Star[] = [
  [40, 60, 1.6, 0], [110, 120, 1.2, 0.35], [300, 50, 1.6, 0.7], [350, 150, 1.3, 0.1], [200, 30, 1.2, 0.5], [70, 220, 1.3, 0.85],
].map(([x, y, r, phase]) => [x / 390, y / 420, r, phase] as Star);
const PETALS: Flake[] = [[18, 3, 0], [80, 2.6, 0.2], [150, 3.2, 0.42], [226, 2.6, 0.6], [298, 3, 0.78], [362, 2.6, 0.9]]
  .map(([x, r, phase]) => [x / 390, r, phase] as Flake);

const RoseSky = React.memo(function RoseSky() {
  return (
    <Full>
      <Defs>
        <LinearGradient id="rbSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F3C6D1" />
          <Stop offset="0.6" stopColor="#F8DCE1" />
          <Stop offset="1" stopColor="#FBEAE5" />
        </LinearGradient>
        <RadialGradient id="rbGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={390} height={420} fill="url(#rbSky)" />
      <Circle cx={195} cy={250} r={170} fill="url(#rbGlow)" />
      {/* the temple of the rose garden, faint, like a memory */}
      <G opacity={0.75}>
        <Polygon points="40,236 195,160 350,236" fill="#F1E6DE" />
        <Rect x={34} y={236} width={322} height={14} fill="#EDE0D6" />
        {[60, 116, 172, 228, 284, 330].map(x => (
          <Rect key={x} x={x - 9} y={250} width={18} height={170} fill="#F3EAE3" />
        ))}
      </G>
      {[[60, 120, 9, '#E8879B'], [330, 96, 7, '#FFFFFF'], [290, 190, 6, '#E8879B'], [96, 300, 6, '#FFFFFF'], [350, 290, 8, '#F4B6C4']].map(([x, y, s, c], i) => (
        <Path key={i} d={heartPath(x as number, y as number, s as number)} fill={c as string} opacity={0.75} />
      ))}
    </Full>
  );
});

const RoseHedge = React.memo(function RoseHedge() {
  return (
    <Full>
      <Path d="M-20 420 L-20 352 Q10 326 44 344 Q70 318 104 340 Q132 316 164 338 Q196 318 226 340 Q258 318 290 340 Q322 318 352 342 Q384 324 410 346 L410 420 Z" fill="#8FA872" />
      <Path d="M-20 420 L-20 380 Q20 362 60 378 Q100 360 140 378 Q180 362 220 378 Q260 360 300 378 Q340 362 410 380 L410 420 Z" fill="#7A9562" />
      {[[30, 352], [92, 344], [150, 356], [214, 346], [272, 356], [336, 348], [60, 386], [182, 390], [300, 388], [370, 372]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={7} fill="#E07C93" />
          <Circle cx={x} cy={y} r={3.2} fill="#C2546F" />
        </G>
      ))}
    </Full>
  );
});

/** The rose garden by day: a blush sky, a faint marble temple, hearts, sparkles and falling rose petals. */
export function RoseBackdrop({ hills = false, animated = true }: BackdropProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <RoseSky />
      <Twinkles stars={ROSE_SPARKLES} duration={3000} color="#FFFFFF" animated={animated} />
      {hills ? <View style={StyleSheet.absoluteFill}><RoseHedge /></View> : null}
      {animated ? <SnowFall flakes={PETALS} duration={11000} color="#E8879B" petal /> : null}
    </View>
  );
}

/* ------------------------------------------------ the skins ------------------------------------------------ */

type Moment = { kicker: string; title: string; body: string; verse: string };

export type EventSkin = {
  id: EventId;
  route: '/winter' | '/beloved' | '/swamp' | '/sword';
  /** "winter prayers", "spring prayers" */
  season: string;
  /** "WINTER EVENT" */
  kicker: string;
  palLine: 'frostLord' | 'beloved' | 'vesper' | 'gladi';
  palette: Palette;
  art: Record<1 | 2 | 3, number>;
  frames: Record<1 | 2 | 3, PalFrame>;
  /** Tint for a stage not reached yet. */
  silhouette: string;
  Backdrop: React.ComponentType<BackdropProps>;
  /** The intro clip's file in the public `event-clips` storage bucket (streamed, then cached; see clipSource). An event
   *  without one goes straight to the end page (the title card and the Begin button). */
  clip?: string;
  /** When the clip reaches its own title card and the app's end page takes over, in seconds (26.9 by default). */
  clipEndAt?: number;
  clipTitle: string;
  clipSubtitle: string;
  /** The one button at the end of the clip. */
  beginLabel: string;
  heroHint: string;
  moments: Record<1 | 2 | 3, Moment>;
  summaryTitle: string;
  /** Dev builds: dates the event screen's "pretend today is…" offers. */
  devDates: string[];
};

export const WINTER_SKIN: EventSkin = {
  id: WINTER_EVENT_ID,
  route: '/winter',
  season: 'winter',
  kicker: 'WINTER EVENT',
  palLine: 'frostLord',
  palette: W,
  art: FROST_LORD_ART,
  frames: FROST_LORD_FRAMES,
  silhouette: 'rgba(191,230,255,0.28)',
  Backdrop: AuroraBackdrop,
  clip: 'face-the-winter-lord.mp4',
  clipTitle: 'Face the\nWinter Lord',
  clipSubtitle: 'Complete the winter challenges\nto bring him home.',
  beginLabel: 'Begin the winter',
  heroHint: 'Pray to meet Snowcap',
  moments: {
    1: { kicker: 'THE LONG WINTER', title: 'Snowcap has arrived', body: 'A little apprentice of the snow walks with you now. Finish the winter challenges and he will grow.', verse: 'He giveth snow like wool. Psalm 147:16' },
    2: { kicker: 'FOUR CHALLENGES DONE', title: 'Your Frost Mage is ready', body: 'Snowcap has grown into the Frost Mage. Finish all ten challenges to crown the Frost Lord.', verse: 'The people that walked in darkness have seen a great light. Isaiah 9:2' },
    3: { kicker: 'ALL TEN CHALLENGES DONE', title: 'The Frost Lord is crowned', body: 'You faced the long winter and brought him home. He is yours to keep, and all five winter keepsakes are on your shelf.', verse: 'He sendeth out his word, and melteth them. Psalm 147:18' },
  },
  summaryTitle: 'Your long winter',
  devDates: ['2026-12-01', '2026-12-24', '2026-12-25', '2027-01-01', '2027-01-10', '2027-01-11', '2027-01-31', '2027-02-01', '2027-02-07', '2027-02-08'],
};

export const SWAMP_SKIN: EventSkin = {
  id: SWAMP_EVENT_ID,
  route: '/swamp',
  season: 'spring',
  kicker: 'SPRING EVENT',
  palLine: 'vesper',
  palette: SWAMP_PALETTE,
  art: VESPER_ART,
  frames: VESPER_FRAMES,
  silhouette: 'rgba(255,226,184,0.26)',
  Backdrop: FenBackdrop,
  clip: 'face-the-swamp-king.mp4',
  clipTitle: 'Face the\nSwamp King',
  clipSubtitle: 'Complete the spring challenges\nto bring him home.',
  beginLabel: 'Enter the fen',
  heroHint: 'Pray to meet Vesper',
  moments: {
    1: { kicker: 'THE SWAMP KING', title: 'Vesper has arrived', body: 'A little wanderer of the fen walks with you now. Finish the spring challenges and he will grow.', verse: 'I waited patiently for the LORD; and he inclined unto me. Psalm 40:1' },
    2: { kicker: 'FOUR CHALLENGES DONE', title: 'Your Fen Warden is ready', body: 'Vesper has grown into the Fen Warden, his blade mended. Finish all ten challenges to crown the Old King.', verse: 'And heard my cry. Psalm 40:1' },
    3: { kicker: 'ALL TEN CHALLENGES DONE', title: 'The Old King is crowned', body: 'You brought him up out of the miry clay. He is yours to keep, and all five spring keepsakes are on your shelf.', verse: 'He set my feet upon a rock. Psalm 40:2' },
  },
  summaryTitle: 'Your season in the fen',
  devDates: ['2027-03-01', '2027-03-15', '2027-03-21', '2027-03-28', '2027-04-01', '2027-04-05', '2027-04-28', '2027-05-01', '2027-05-02'],
};

export const BELOVED_SKIN: EventSkin = {
  id: BELOVED_EVENT_ID,
  route: '/beloved',
  season: 'Valentine',
  kicker: 'VALENTINE EVENT',
  palLine: 'beloved',
  palette: BELOVED_PALETTE,
  art: BELOVED_ART,
  frames: BELOVED_FRAMES,
  silhouette: 'rgba(194,84,111,0.24)',
  Backdrop: RoseBackdrop,
  clip: 'meet-the-beloved.mp4',
  clipEndAt: 27.9,
  clipTitle: 'Meet the\nBeloved',
  clipSubtitle: 'Complete the Valentine challenges\nto bring her to life.',
  beginLabel: 'Begin',
  heroHint: 'Pray to meet your Cherub',
  moments: {
    1: { kicker: 'THE BELOVED', title: 'Your Cherub has arrived', body: 'A little marble cherub flutters in to walk with you. Finish the Valentine challenges and she will grow.', verse: 'For, lo, the winter is past, the rain is over and gone. Song of Solomon 2:11' },
    2: { kicker: 'THREE CHALLENGES DONE', title: 'Your Muse is ready', body: 'The Cherub has grown into the Muse, lyre in hand. Finish all six challenges to awaken The Beloved.', verse: 'The flowers appear on the earth. Song of Solomon 2:12' },
    3: { kicker: 'ALL SIX CHALLENGES DONE', title: 'The Beloved awakens', body: 'The statue has come to life. She is yours to keep, with her Seraph spirit form to switch to and four keepsakes on your shelf.', verse: 'Many waters cannot quench love. Song of Solomon 8:7' },
  },
  summaryTitle: 'Your Valentine season',
  devDates: ['2027-02-01', '2027-02-10', '2027-02-14', '2027-02-21', '2027-02-28', '2027-03-01'],
};

export const SWORD_SKIN: EventSkin = {
  id: SWORD_EVENT_ID,
  route: '/sword',
  season: 'June',
  kicker: 'JUNE EVENT',
  palLine: 'gladi',
  palette: SWORD_PALETTE,
  art: GLADI_ART,
  frames: GLADI_FRAMES,
  silhouette: 'rgba(191,234,246,0.26)',
  Backdrop: SwordBackdrop,
  // no intro clip yet: the end page (title, Shard and Gladius, Begin) shows on its own
  clipTitle: 'The Sword of\nthe Spirit',
  clipSubtitle: 'Complete the June challenges\nto forge Gladius.',
  beginLabel: 'Take up the sword',
  heroHint: 'Pray to meet Shard',
  moments: {
    1: { kicker: 'THE SWORD OF THE SPIRIT', title: 'Shard has arrived', body: 'A little shard of light floats in to walk with you. Finish the June challenges and it will grow.', verse: 'Be strong in the Lord, and in the power of his might. Ephesians 6:10' },
    2: { kicker: 'THREE CHALLENGES DONE', title: 'Gladi is ready', body: 'Shard has grown into Gladi, wings spread and haloed. Finish all six challenges to forge Gladius.', verse: 'Above all, taking the shield of faith. Ephesians 6:16' },
    3: { kicker: 'ALL SIX CHALLENGES DONE', title: 'Gladius is forged', body: 'The sword of the Spirit stands ready. Gladius is yours to keep, and the whole armour of God is on your shelf.', verse: 'The sword of the Spirit, which is the word of God. Ephesians 6:17' },
  },
  summaryTitle: 'Your June with the sword',
  devDates: ['2027-06-01', '2027-06-10', '2027-06-11', '2027-06-21', '2027-06-30', '2027-07-01'],
};

export const SKINS: Record<EventId, EventSkin> = { [WINTER_EVENT_ID]: WINTER_SKIN, [BELOVED_EVENT_ID]: BELOVED_SKIN, [SWAMP_EVENT_ID]: SWAMP_SKIN, [SWORD_EVENT_ID]: SWORD_SKIN };

/**
 * Where an intro clip plays from. The clips live in Supabase Storage (bucket `event-clips`) instead of the app, which
 * keeps about 21 MB out of the download. They're saved for streaming (the index is at the front), and the player
 * keeps a copy on the phone after the first play, so replays don't download again.
 */
export function clipSource(file: string | undefined) {
  if (!file) return null;
  return { uri: supabase.storage.from('event-clips').getPublicUrl(file).data.publicUrl, useCaching: true };
}

/** Which event's skin the components below use. */
export const SkinContext = createContext<EventSkin>(WINTER_SKIN);
export const useSkin = () => useContext(SkinContext);

/* ------------------------------------------------ pieces ------------------------------------------------ */

/**
 * The event companion's art for a stage; stage 0 (not met yet) is the first stage as a silhouette. `height` sizes the
 * figure (its original painted frame), so all three stages stand at the same scale; extended hats rise above it.
 */
export function StageImage({ stage, height, dim, form }: { stage: number; height: number; dim?: boolean; form?: BelovedForm }) {
  const skin = useSkin();
  const picked = useBelovedForm();
  const s = (Math.min(3, Math.max(1, stage)) as 1 | 2 | 3);
  // The Beloved's final stage in her Seraph spirit form: when asked for by `form`, or when it's the look picked and
  // she's been earned
  const spirit = skin.palLine === 'beloved' && s === 3 && (form ? form === 'spirit' : !dim && stage >= 3 && picked === 'spirit');
  const f = spirit ? SERAPH_FRAME : skin.frames[s];
  const scale = height / f.body;
  const silhouette = stage < 1 || dim;
  return (
    <Image
      source={spirit ? SERAPH_ART : skin.art[s]}
      accessibilityIgnoresInvertColors
      style={{ height: f.h * scale, width: f.w * scale, tintColor: silhouette ? skin.silhouette : undefined }}
      resizeMode="contain"
    />
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  const { palette } = useSkin();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: palette.track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const bannerKey = (id: EventId) => (id === WINTER_EVENT_ID ? 'winter.bannerDismissed' : `event.bannerDismissed.${id}`);

/**
 * The home screen's banner for whichever event is running: only while it's on and switched on in the database, opens
 * its screen, and can be put away for the rest of the day.
 */
export function WinterBanner({ style }: { style?: object }) {
  const { liveId } = useEvents();
  if (!liveId) return null;
  return (
    <SkinContext.Provider value={SKINS[liveId]}>
      <EventBanner key={liveId} style={style} />
    </SkinContext.Provider>
  );
}

function EventBanner({ style }: { style?: object }) {
  const skin = useSkin();
  const P = skin.palette;
  const fontsLoaded = useWinterFonts();
  const { states, today } = useEvents();
  const state = states[skin.id];
  const [dismissedOn, setDismissedOn] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    AsyncStorage.getItem(bannerKey(skin.id)).then(setDismissedOn).catch(() => setDismissedOn(null));
  }, [skin.id]);
  if (!fontsLoaded || !state || dismissedOn === undefined || dismissedOn === today) return null;
  const stage = state.progress?.stage_unlocked ?? 0;
  const Backdrop = skin.Backdrop;
  const dismiss = () => {
    setDismissedOn(today);
    AsyncStorage.setItem(bannerKey(skin.id), today).catch(() => {});
  };
  return (
    <Pressable
      onPress={() => router.push(skin.route)}
      accessibilityRole="button"
      accessibilityLabel={`${state.event.title}, ${skin.season} event, ${shortDate(realStart(state.event))} to ${shortDate(state.event.ends_on)}. Opens the event.`}
      style={({ pressed }) => [banner.wrap, { borderColor: glass(P).edge }, style, pressed && { opacity: 0.9 }]}>
      {/* still: the home scene behind it already moves */}
      <Backdrop hills animated={false} />
      <View style={banner.text}>
        <Text style={[banner.kicker, { color: P.ice }]} numberOfLines={1}>
          {skin.kicker} · {shortDate(realStart(state.event)).toUpperCase()} TO {shortDate(state.event.ends_on).toUpperCase()}
        </Text>
        <Text style={[banner.title, { color: P.cream }]} numberOfLines={2}>{state.event.title}</Text>
      </View>
      <View style={banner.art} pointerEvents="none">
        {/* small enough that the final stage's whole hat or crown fits the 96pt banner */}
        <StageImage stage={3} height={74} dim={stage < 3} />
        {stage >= 1 && stage < 3 ? (
          <View style={banner.current}>
            <StageImage stage={stage} height={70} />
          </View>
        ) : null}
      </View>
      <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Hide the event banner for today" style={[banner.close, P.light && { backgroundColor: glass(P).bg }]}>
        <Text style={[banner.closeText, { color: P.cream }]}>×</Text>
      </Pressable>
    </Pressable>
  );
}

const banner = StyleSheet.create({
  wrap: { height: 96, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(191,230,255,0.18)' },
  text: { flex: 1, paddingLeft: 18, paddingRight: 6, gap: 2 },
  kicker: { fontFamily: WF.semi, fontSize: 9.5, letterSpacing: 1.6 },
  title: { fontFamily: WF.bold, fontSize: 26, lineHeight: 30 },
  art: { width: 112, height: 96, alignItems: 'center', justifyContent: 'flex-end', marginRight: 10 },
  current: { position: 'absolute', left: -18, bottom: 0 },
  close: { position: 'absolute', top: 6, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,11,30,0.45)' },
  closeText: { fontSize: 15, lineHeight: 17, fontFamily: WF.semi },
});
