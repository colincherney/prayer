import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { keyframe, useLoop, useMotionEnabled } from '@/components/pets/anim';
import { Pet, petStageName } from '@/components/pets/registry';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { savePetName, usePetProgress, XP, XP_PER_LEVEL } from '@/lib/pet';
import { useQuests } from '@/lib/quests';

const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);

/** Space kept clear at the bottom for the floating tab bar. */
const TAB_BAR_SPACE = 92;
const SIDE_PAD = 16;

// Hero proportions, all relative to the arc diameter D.
const ARC_SWEEP_DEG = 200; // the arc runs 200 degrees, over the top of the dome
const ARC_START_DEG = 190; // measured counter-clockwise from 3 o'clock; 190 is just below 9 o'clock
const PET_FRACTION = 0.749; // pet width as a share of D
const HERO_HEIGHT_PER_D = 1.0; // LV label + arc + name/XP block stacked come to about 0.98 * D tall
const MIN_ARC = 200;

// Action grid proportions.
const ORB_OF_COL = 0.372; // regular orb = this share of the column width (40% smaller than the original 0.62)...
const REFLECT_OF_ORB = 0.85; // the bottom-center orb is a little smaller, like the close button in the reference
const ORB_CHROME = 48; // ...capped by the room left after the two caption lines
const ORB_MIN = 31;
const ORB_MAX = 55;
const CENTER_OF_COL = 0.492;
const CENTER_MAX = 71;
const ICON_OF_ORB = 0.76; // icons are 20% bigger than the original 0.38-of-orb, against orbs 40% smaller

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type IconProps = { color: string; size: number };

const strokeProps = {
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const ShareIcon = ({ color, size }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke={color} {...strokeProps} />
  </Svg>
);
const FlameIcon = ({ color, size }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10Z" stroke={color} {...strokeProps} />
    <Path d="M12 9v11" stroke={color} {...strokeProps} />
  </Svg>
);
const HeartOrbIcon = ({ color, size }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"
      stroke={color}
      {...strokeProps}
      strokeWidth={1.9}
    />
  </Svg>
);
const GroupIcon = ({ color, size }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={9} cy={8} r={3.5} stroke={color} {...strokeProps} />
    <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" stroke={color} {...strokeProps} />
    <Path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" stroke={color} {...strokeProps} />
    <Path d="M18.5 14.5a6.5 6.5 0 0 1 3 5.5" stroke={color} {...strokeProps} />
  </Svg>
);
const StarIcon = ({ color, size }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.4l-5.6 4.1 2.1-6.7L3 8.8h6.8Z" stroke={color} {...strokeProps} />
  </Svg>
);
const JournalIcon = ({ color, size }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z" stroke={color} {...strokeProps} />
    <Path d="M5 17a3 3 0 0 1 3-3h11" stroke={color} {...strokeProps} />
    <Path d="M9 8h6" stroke={color} {...strokeProps} />
  </Svg>
);

type ActionCellProps = {
  name: string;
  /** XP line under the name; empty keeps the row aligned. */
  xp: string;
  label: string;
  onPress: () => void;
  icon: (color: string, size: number) => React.ReactNode;
  colW: number;
  orb: number;
  /** Height of the orb slot, so every orb in a row lines up. */
  slot: number;
  primary?: boolean;
  badge?: boolean;
};

function ActionCell({ name, xp, label, onPress, icon, colW, orb, slot, primary, badge }: ActionCellProps) {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const textW = colW - 6;
  return (
    <View style={[styles.cell, { width: colW }]}>
      <View style={{ height: slot, width: colW, alignItems: 'center', justifyContent: 'center' }}>
        {primary ? <PulseRing orb={orb} color={THEME.accent} /> : null}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            styles.orb,
            {
              width: orb,
              height: orb,
              borderRadius: orb / 2,
              backgroundColor: primary ? THEME.accent : THEME.surface,
              borderWidth: primary ? 0 : 2,
              borderColor: THEME.accent,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}>
          {icon(primary ? THEME.accentInk : THEME.ink, Math.round(orb * ICON_OF_ORB))}
        </Pressable>
        {badge ? (
          <View
            pointerEvents="none"
            style={[
              styles.badge,
              { top: (slot - orb) / 2 + orb * 0.02, left: (colW + orb) / 2 - 14 - orb * 0.02 },
            ]}
          />
        ) : null}
      </View>
      <Text
        style={[styles.caption, { width: textW }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {name}
      </Text>
      <Text style={[styles.xpTag, { width: textW }]} numberOfLines={1}>
        {xp || ' '}
      </Text>
    </View>
  );
}

function Ring({ v, color, width, size }: { v: SharedValue<number>; color: string; width: number; size: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: v.value === 0 ? 0 : 0.95 * (1 - v.value),
    transform: [{ scale: 0.3 + 1.6 * v.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2 },
        { borderColor: color, borderWidth: width },
        style,
      ]}
    />
  );
}

/** Two expanding rings centered on the pet's box when it levels up. */
function LevelUpRings({ trigger, box }: { trigger: boolean; box: { top: number; left: number; w: number; h: number } }) {
  const { theme: THEME } = useTheme();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  useEffect(() => {
    if (!trigger) return;
    a.value = 0;
    b.value = 0;
    a.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) });
    b.value = withDelay(180, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  }, [trigger, a, b]);
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: box.top,
        left: box.left,
        width: box.w,
        height: box.h,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ring v={a} color={THEME.accent} width={4} size={box.w * 0.8} />
      <Ring v={b} color={THEME.ink} width={2} size={box.w * 0.8} />
    </View>
  );
}

/** Point on the arc, `deg` counter-clockwise from 3 o'clock, in SVG coordinates. */
function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/** Soft glow ring around the primary orb: grows 8pt to 14pt while fading, 2.6s loop. */
function PulseRing({ orb, color }: { orb: number; color: string }) {
  const enabled = useMotionEnabled(true);
  const p = useLoop(2600, 0, enabled, 0);
  const widest = orb + 28;
  const style = useAnimatedStyle(() => {
    const spread = keyframe(p.value, [0, 0.5, 1], [8, 14, 8]);
    return {
      opacity: keyframe(p.value, [0, 0.5, 1], [0.14, 0.05, 0.14]),
      transform: [{ scale: (orb + spread * 2) / widest }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: widest, height: widest, borderRadius: widest / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

type HeroArcProps = {
  width: number;
  height: number;
  top: number;
  path: string;
  len: number;
  cx: number;
  cy: number;
  r: number;
  stroke: number;
  knobR: number;
  pct: number;
  track: string;
  fill: string;
  knobColor: string;
};

/** The level arc: the fill and the knob glide to the new XP over 0.5s. */
function HeroArc({ width, height, top, path, len, cx, cy, r, stroke, knobR, pct, track, fill, knobColor }: HeroArcProps) {
  const p = useSharedValue(pct);
  useEffect(() => {
    p.value = withTiming(pct, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [pct, p]);
  const fillProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value / 100) }));
  const knobProps = useAnimatedProps(() => {
    const rad = ((ARC_START_DEG - ARC_SWEEP_DEG * (p.value / 100)) * Math.PI) / 180;
    return { cx: cx + r * Math.cos(rad), cy: cy - r * Math.sin(rad) };
  });
  const start = arcPoint(cx, cy, r, ARC_START_DEG);
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top }}>
      <Path d={path} stroke={track} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <APath
        d={path}
        stroke={fill}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        animatedProps={fillProps}
      />
      <ACircle cx={start.x} cy={start.y} r={knobR} fill={knobColor} animatedProps={knobProps} />
    </Svg>
  );
}

/** XP bar fill that slides to its new width over 0.5s. */
function XpFill({ pct, color }: { pct: number; color: string }) {
  const p = useSharedValue(pct);
  useEffect(() => {
    p.value = withTiming(pct, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [pct, p]);
  const style = useAnimatedStyle(() => ({ width: `${p.value}%` }));
  return <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: color }, style]} />;
}

type Size = { w: number; h: number };

export default function PrayLauncherScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME, name: themeName } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { progress, name, setName, petId, leveledUp } = usePetProgress();
  const quests = useQuests();
  const questsDone = quests.quests.filter(x => x.slot !== 'bonus' && quests.statusOf(x) === 'done').length;
  const [hero, setHero] = useState<Size | null>(null);
  const [actions, setActions] = useState<Size | null>(null);

  // Level-up hop: 0.9s, up 40pt and 1.12x at 30%, squashed to 0.94x at 62%, settled by the end.
  const hop = useSharedValue(1);
  useEffect(() => {
    if (!leveledUp) return;
    hop.value = 0;
    hop.value = withTiming(1, { duration: 900, easing: Easing.linear });
  }, [leveledUp, hop]);
  const hopStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: keyframe(hop.value, [0, 0.3, 0.62, 1], [0, -40, 0, 0]) },
      { scale: keyframe(hop.value, [0, 0.3, 0.62, 1], [1, 1.12, 0.94, 1]) },
    ],
  }));

  // The pet grows a little with each level, with a springy settle.
  const petScale = 1 + Math.min((progress.level - 1) * 0.02, 0.08);
  const growth = useSharedValue(petScale);
  useEffect(() => {
    growth.value = withSpring(petScale, { damping: 8, stiffness: 140 });
  }, [petScale, growth]);
  const growthStyle = useAnimatedStyle(() => ({ transform: [{ scale: growth.value }] }));

  // Level-up toast: slides in over the first ~12% of 2.2s, holds, fades out by the end.
  const toastIn = useSharedValue(0);
  useEffect(() => {
    if (!leveledUp) {
      toastIn.value = 0;
      return;
    }
    toastIn.value = withSequence(
      withTiming(1, { duration: 264 }),
      withDelay(1600, withTiming(0, { duration: 336 })),
    );
  }, [leveledUp, toastIn]);
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastIn.value,
    transform: [{ translateY: (1 - toastIn.value) * -10 }, { scale: 0.9 + 0.1 * toastIn.value }],
  }));

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const onHero = (e: LayoutChangeEvent) => setHero({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const onActions = (e: LayoutChangeEvent) =>
    setActions({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const needsContrastBoost = themeName === 'cream' || themeName === 'forest' || themeName === 'pink';
  const pct = Math.round((progress.xpInLevel / XP_PER_LEVEL) * 100);

  const rename = () => {
    if (Platform.OS !== 'ios') return;
    Alert.prompt('Name your companion', undefined, async (text: string) => {
      const next = text.trim().slice(0, 16);
      if (!next) return;
      await savePetName(petId, next);
      setName(next);
    }, 'plain-text', name);
  };

  // ---- Hero sizing: D is the arc diameter; everything in the hero scales from it. ----
  let heroNode: React.ReactNode = null;
  if (hero) {
    const D = Math.max(MIN_ARC, Math.min(hero.w - SIDE_PAD * 2, (hero.h - 4) / HERO_HEIGHT_PER_D));
    const stroke = Math.max(3, D * 0.012);
    const knobR = Math.max(6, D * 0.022);
    const pad = knobR + 4;
    const r = D / 2 - pad;
    const cx = D / 2;
    const cy = pad + r;
    const start = arcPoint(cx, cy, r, ARC_START_DEG);
    const end = arcPoint(cx, cy, r, ARC_START_DEG - ARC_SWEEP_DEG);
    const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
    const arcLen = r * ((ARC_SWEEP_DEG * Math.PI) / 180);
    const arcH = start.y + pad;
    const lvH = D * 0.15;
    const petW = D * PET_FRACTION;
    const petH = (petW * 260) / 240;
    const chordY = lvH + start.y;
    // The artboard has a little empty space under the shadow; sink the pet so its base sits on the chord.
    const petTop = chordY - petH + petH * 0.1;
    const nameTop = lvH + arcH + 2;
    const petBox = { top: petTop, left: (D - petW) / 2, w: petW, h: petH };

    heroNode = (
      <View style={{ width: D, height: nameTop + D * 0.3, alignSelf: 'center' }}>
        <View style={[styles.lvRow, { height: lvH }]} pointerEvents="none">
          <Text style={[styles.lvLabel, { fontSize: D * 0.05 }]}>LV</Text>
          <Text style={[styles.lvNum, { fontSize: D * 0.12, lineHeight: D * 0.14 }]}>{progress.level}</Text>
        </View>
        <HeroArc
          width={D}
          height={arcH}
          top={lvH}
          path={arcPath}
          len={arcLen}
          cx={cx}
          cy={cy}
          r={r}
          stroke={stroke}
          knobR={knobR}
          pct={pct}
          track={THEME.line}
          fill={THEME.accent}
          knobColor={THEME.ink}
        />
        <LevelUpRings trigger={leveledUp} box={petBox} />
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: petBox.top,
              left: petBox.left,
              width: petW,
              height: petH,
              transformOrigin: '50% 100%',
            },
            growthStyle,
          ]}>
          <Animated.View style={hopStyle}>
            <Pet id={petId} stage={progress.stage} size={petW} interactive />
          </Animated.View>
        </Animated.View>
        {leveledUp ? (
          <Animated.View style={[styles.toast, { top: lvH + D * 0.02 }, toastStyle]} pointerEvents="none">
            <Text style={styles.toastText}>
              {name} reached Level {progress.level}!
            </Text>
          </Animated.View>
        ) : null}

        <View style={[styles.nameBlock, { top: nameTop }]}>
          <Pressable onPress={rename} style={styles.nameRow} accessibilityLabel="Rename your companion">
            <Text style={[styles.petName, { fontSize: D * 0.095 }]} numberOfLines={1}>
              {name}
            </Text>
            {Platform.OS === 'ios' ? (
              <Svg width={D * 0.05} height={D * 0.05} viewBox="0 0 24 24">
                <Path d="M12 20h9" stroke={THEME.muted} {...strokeProps} strokeWidth={2} />
                <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke={THEME.muted} {...strokeProps} strokeWidth={2} />
              </Svg>
            ) : null}
          </Pressable>
          <View style={[styles.xpTrack, { width: D * 0.62, height: Math.max(5, D * 0.018) }]}>
            <XpFill pct={pct} color={THEME.accent} />
          </View>
          <Text style={[styles.xpText, { fontSize: Math.max(12, D * 0.045) }]}>
            {progress.xpInLevel} / {XP_PER_LEVEL} XP · {petStageName(petId, progress.stage)}
          </Text>
        </View>
      </View>
    );
  }

  // ---- Action layout: four orbs at the corners, "Pray right now" in the middle, Journal at the bottom center. ----
  let gridNode: React.ReactNode = null;
  if (actions) {
    const W = actions.w;
    const H = actions.h;
    const colW = (W - SIDE_PAD * 2) / 3;
    const orb = clamp(Math.min(colW * ORB_OF_COL, (H - 2 * ORB_CHROME) / 2), ORB_MIN, ORB_MAX);
    const center = clamp(Math.min(colW * CENTER_OF_COL, (H - 2 * ORB_CHROME) / 2), orb, CENTER_MAX);
    const reflect = Math.max(ORB_MIN, orb * REFLECT_OF_ORB);
    const cellH = (o: number) => o + ORB_CHROME;

    const xLeft = SIDE_PAD;
    const xRight = W - SIDE_PAD - colW;
    const xMid = (W - colW) / 2;

    // Corners: top pair flush with the top, bottom pair flush with the bottom.
    const yTop = 0;
    const yBottomCorner = H - cellH(orb);
    // Journal sits at the very bottom of the middle column; the middle orb floats above it,
    // as close to the vertical midpoint of the corner orbs as that column allows.
    const yReflect = H - cellH(reflect);
    const midOrbCenter = (yTop + orb / 2 + yBottomCorner + orb / 2) / 2;
    const yCenter = Math.max(0, Math.min(midOrbCenter - center / 2, yReflect - cellH(center) - 2));

    const at = (x: number, y: number) => ({ position: 'absolute' as const, left: x, top: y });

    gridNode = (
      <View style={{ flex: 1 }}>
        <View style={at(xLeft, yTop)}>
          <ActionCell
            colW={colW}
            orb={orb}
            slot={orb}
            name="Share request"
            xp={`+${XP.share} XP`}
            label="Share a prayer request"
            icon={(c, s) => <ShareIcon color={c} size={s} />}
            onPress={() => router.push('/prayerRequest')}
          />
        </View>
        <View style={at(xRight, yTop)}>
          <ActionCell
            colW={colW}
            orb={orb}
            slot={orb}
            badge
            name="Pray for others"
            xp={`+${XP.prayed} XP`}
            label="Pray for others"
            icon={(c, s) => <FlameIcon color={c} size={s} />}
            onPress={() => router.push('/explore')}
          />
        </View>
        <View style={at(xMid, yCenter)}>
          <ActionCell
            colW={colW}
            orb={center}
            slot={center}
            primary
            name="Pray right now"
            xp="+15 XP"
            label="Pray right now"
            icon={(c, s) => <HeartOrbIcon color={c} size={s} />}
            onPress={() => router.push('/pair')}
          />
        </View>
        <View style={at(xLeft, yBottomCorner)}>
          <ActionCell
            colW={colW}
            orb={orb}
            slot={orb}
            name="Pray with group"
            xp="+10 XP"
            label="Pray with your group"
            icon={(c, s) => <GroupIcon color={c} size={s} />}
            onPress={() => router.push('/groups')}
          />
        </View>
        <View style={at(xRight, yBottomCorner)}>
          <ActionCell
            colW={colW}
            orb={orb}
            slot={orb}
            name="Meet the pets"
            xp=""
            label="Meet the companions"
            icon={(c, s) => <StarIcon color={c} size={s} />}
            onPress={() => router.push('/pets')}
          />
        </View>
        <View style={at(xMid, yReflect)}>
          <ActionCell
            colW={colW}
            orb={reflect}
            slot={reflect}
            name="Journal"
            xp={`+${XP.journal} XP`}
            label="Open your journal"
            icon={(c, s) => <JournalIcon color={c} size={s} />}
            onPress={() => router.push('/biography')}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <View style={styles.header}>
        <Text
          style={[styles.title, needsContrastBoost && { fontFamily: FONTS.displaySemi }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          How will you pray?
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Choose where your heart is right now.
        </Text>
      </View>

      <View style={{ flex: 1, paddingBottom: TAB_BAR_SPACE }}>
        <View style={{ flex: 1.1 }} onLayout={onHero}>
          {heroNode}
          {/* Your companion, dressed as a pilgrim, has today's quests waiting. */}
          <Pressable
            onPress={() => router.push('/quests')}
            accessibilityRole="button"
            accessibilityLabel={`Quests, ${questsDone} of 4 done today`}
            style={({ pressed }) => [styles.questBadge, pressed && { transform: [{ scale: 0.95 }] }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M6 3h11a2 2 0 0 1 2 2v12H8a2 2 0 0 0 0 4h11" stroke={THEME.accent} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M8 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2 M10 8h6 M10 12h4" stroke={THEME.accent} strokeWidth={1.8} fill="none" strokeLinecap="round" />
            </Svg>
            <Text style={styles.questBadgeText}>Quests</Text>
            <Text style={styles.questBadgeCount}>{questsDone}/4</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }} onLayout={onActions}>
          {gridNode}
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  // Expo Go draws its own floating tools button in the top-right corner; leave room for it in dev so the title can't run under it.
  header: { paddingLeft: 22, paddingTop: 10, paddingBottom: 6, paddingRight: __DEV__ ? 76 : 22 },
  title: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 40, color: THEME.ink },
  subtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: THEME.inkSoft,
    marginTop: 2,
  },
  lvRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    gap: 4,
    paddingLeft: 4,
  },
  lvLabel: { fontFamily: FONTS.bodySemi, letterSpacing: 1, color: THEME.inkSoft },
  lvNum: { fontFamily: FONTS.displaySemi, color: THEME.ink },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    width: 230,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: THEME.accent,
  },
  toastText: { textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 14, color: THEME.accentInk },
  questBadge: {
    position: 'absolute',
    right: 16,
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  questBadgeText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.ink },
  questBadgeCount: { fontFamily: FONTS.bodySemi, fontSize: 11.5, color: THEME.accent },
  nameBlock: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petName: { fontFamily: FONTS.displaySemi, color: THEME.ink },
  xpTrack: { borderRadius: 999, backgroundColor: THEME.line, overflow: 'hidden' },
  xpText: { fontFamily: FONTS.bodyMed, color: THEME.inkSoft },
  cell: { alignItems: 'center', gap: 4 },
  orb: { alignItems: 'center', justifyContent: 'center' },
  caption: { fontFamily: FONTS.bodyMed, fontSize: 13, color: THEME.ink, textAlign: 'center' },
  xpTag: { fontFamily: FONTS.bodySemi, fontSize: 11.5, color: THEME.accent, textAlign: 'center' },
  badge: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E88A86',
    borderWidth: 2,
    borderColor: THEME.bg,
  },
});
