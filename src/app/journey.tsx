import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { DawnLandscape } from '@/components/saint/DawnLandscape';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

type SeasonName = 'Doubt' | 'Healing' | 'Waiting' | 'Community' | 'Discipline' | 'Growth';

type Pin = {
  id: string;
  season: SeasonName;
  label: string;
  sub: string;
  moments: number;
  note: string;
  x: number; // % across the scrollable content (oldest at left, newest at right)
  y: number; // % down the visible screen area
  current?: boolean;
};

const SEASON_TONE: Record<SeasonName, { dot: string; ink: string }> = {
  Growth: { dot: '#8aa978', ink: '#2b4a26' },
  Healing: { dot: '#c19090', ink: '#6b2e3a' },
  Waiting: { dot: '#7e93ad', ink: '#2c4566' },
  Doubt: { dot: '#b5a280', ink: '#5a4b30' },
  Discipline: { dot: '#9a82b0', ink: '#4a3270' },
  Community: { dot: '#a8b88a', ink: '#3a5a32' },
};

// Pins chronological — leftmost is oldest, rightmost is current.
const PINS: Pin[] = [
  { id: 'doubt', season: 'Doubt', label: 'The hard winter', sub: 'Jan 2024', moments: 29,
    note: 'Honest questions. Stopped pretending things were fine.', x: 7, y: 62 },
  { id: 'healing', season: 'Healing', label: 'Therapy begins', sub: 'Mar 2024', moments: 78,
    note: 'Naming old wounds for the first time.', x: 22, y: 48 },
  { id: 'waiting', season: 'Waiting', label: 'Dad’s diagnosis', sub: 'Aug 2024', moments: 56,
    note: 'Holding things you cannot fix.', x: 38, y: 64 },
  { id: 'community', season: 'Community', label: 'Small group', sub: 'Nov 2024', moments: 41,
    note: 'New friendships, harder honesty.', x: 55, y: 46 },
  { id: 'discipline', season: 'Discipline', label: 'Daily prayer', sub: 'Feb 2025', moments: 64,
    note: '6am quiet, before the kids wake.', x: 72, y: 58 },
  { id: 'growth', season: 'Growth', label: 'You are here', sub: 'Today', moments: 38,
    note: 'Forgiveness. Returning to scripture daily.', x: 88, y: 42, current: true },
];

// Horizontal scrollable content is this many screen-widths wide.
const CONTENT_W_MULT = 2;

const PinView: React.FC<{
  pin: Pin;
  active: boolean;
  onPress: () => void;
  contentW: number;
  contentH: number;
}> = ({ pin, active, onPress, contentW, contentH }) => {
  const styles = useThemedStyles(makeStyles);
  const tone = SEASON_TONE[pin.season];
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pin.current) return;
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pin.current, pulse]);

  const left = (pin.x / 100) * contentW - 60;
  const top = (pin.y / 100) * contentH - 14;
  const labelBelow = !!pin.current;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.pinContainer, { left, top, width: 120 }]}>
      <View
        style={[
          styles.pinLabel,
          labelBelow
            ? { position: 'absolute', top: 30, left: 0, right: 0 }
            : { position: 'absolute', bottom: 30, left: 0, right: 0 },
        ]}>
        <Text style={styles.pinLabelTitle} numberOfLines={1}>
          {pin.label}
        </Text>
        <Text style={[styles.pinLabelSub, { color: tone.dot }]} numberOfLines={1}>
          {pin.season} · {pin.sub}
        </Text>
      </View>

      {pin.current ? (
        <Animated.View
          style={[
            styles.pinPulse,
            {
              borderColor: tone.dot,
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) },
              ],
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.pinDot,
          {
            width: active ? 18 : 14,
            height: active ? 18 : 14,
            borderRadius: active ? 9 : 7,
            backgroundColor: tone.dot,
          },
        ]}
      />
    </Pressable>
  );
};

const GlassPill: React.FC<{ onPress?: () => void; children: React.ReactNode; circle?: boolean }> = ({
  onPress,
  children,
  circle,
}) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.glassPill,
        circle ? { width: 42, paddingHorizontal: 0 } : null,
        pressed && { opacity: 0.85 },
      ]}>
      {children}
    </Pressable>
  );
};

const StatsChip: React.FC<{ n: string; label: string }> = ({ n, label }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipNum}>{n}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
};

export default function JourneyScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<string>('growth');
  const win = Dimensions.get('window');
  const [size, setSize] = useState({ w: win.width, h: win.height });
  const activePin = PINS.find(p => p.id === active) || PINS[PINS.length - 1];

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#3a4258' }} />;

  const contentW = size.w * CONTENT_W_MULT;
  const contentH = size.h;

  // Build the winding path through the pins, in pixel coords for the SVG.
  const pts = PINS.map(p => ({
    x: (p.x / 100) * contentW,
    y: (p.y / 100) * contentH,
  }));
  const pathD =
    `M ${pts[0].x} ${pts[0].y}` +
    pts
      .slice(1)
      .map((pt, i) => {
        const prev = pts[i];
        const cx1 = prev.x + (pt.x - prev.x) * 0.55;
        const cy1 = prev.y;
        const cx2 = pt.x - (pt.x - prev.x) * 0.55;
        const cy2 = pt.y;
        return ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
      })
      .join('');

  return (
    <View
      style={styles.root}
      onLayout={e =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Static landscape covering the entire screen */}
      <DawnLandscape />

      {/* Horizontal scroll — pins + path travel sideways across the static landscape */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ width: contentW, height: contentH }}>
        <View style={{ width: contentW, height: contentH }}>
          <Svg
            width={contentW}
            height={contentH}
            viewBox={`0 0 ${contentW} ${contentH}`}
            style={StyleSheet.absoluteFill}
            pointerEvents="none">
            <Defs>
              <SvgLinearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#f0c8a8" stopOpacity={0.5} />
                <Stop offset="40%" stopColor="#f0c8a8" stopOpacity={0.85} />
                <Stop offset="100%" stopColor="#fbe6c4" stopOpacity={0.95} />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={pathD}
              stroke="url(#pathGrad)"
              strokeWidth={3}
              fill="none"
              strokeDasharray="2 8"
              strokeLinecap="round"
            />
          </Svg>

          {PINS.map(p => (
            <PinView
              key={p.id}
              pin={p}
              active={active === p.id}
              onPress={() => setActive(p.id)}
              contentW={contentW}
              contentH={contentH}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky top bar — back + Seasons */}
      <View
        style={[styles.topBarWrap, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none">
        <GlassPill circle onPress={() => router.back()}>
          <BackIcon size={18} color={THEME.ink} />
        </GlassPill>
        <GlassPill onPress={() => router.push('/seasons')}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M12 3c-3.5 0-6 2.5-6 6v6c0 3.5 2.5 6 6 6s6-2.5 6-6V9c0-3.5-2.5-6-6-6zM12 3v18"
              stroke={THEME.ink}
              strokeWidth={1.5}
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.glassPillText}>Seasons</Text>
        </GlassPill>
      </View>

      {/* Sticky hero title — sits over the static landscape, above the scroll */}
      <View
        style={[styles.heroBlock, { top: insets.top + 70 }]}
        pointerEvents="box-none">
        <Text style={styles.eyebrow}>The land you&apos;ve walked</Text>
        <Text style={styles.heroTitle}>
          Your <Text style={styles.heroTitleItalic}>journey</Text>
        </Text>
        <View
          style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}
          pointerEvents="box-none">
          <StatsChip n="6" label="seasons" />
          <StatsChip n="1,247" label="moments" />
          <StatsChip n="11" label="answered" />
        </View>
      </View>

      {/* Sticky bottom info card — updates when a pin is tapped */}
      <View
        style={[styles.infoCardWrap, { bottom: insets.bottom + 16 }]}
        pointerEvents="box-none">
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={[styles.infoDot, { backgroundColor: SEASON_TONE[activePin.season].dot }]}
            />
            <Text style={[styles.infoEyebrow, { color: SEASON_TONE[activePin.season].dot }]}>
              {activePin.season} · {activePin.sub}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.infoMoments}>{activePin.moments} moments</Text>
          </View>
          <Text style={styles.infoTitle}>{activePin.label}</Text>
          <Text style={styles.infoNote}>{activePin.note}</Text>
        </View>
      </View>

      {/* Sticky FAB */}
      <Pressable
        onPress={() => {
          // Placeholder — Add Moment sheet
        }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 150 },
          pressed && { opacity: 0.9 },
        ]}>
        <Svg width={26} height={26} viewBox="0 0 24 24">
          <Path
            d="M12 5v14M5 12h14"
            stroke="#fdf6e7"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const makeStyles = (THEME: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#3a4258',
      overflow: 'hidden',
    },

    // STICKY CHROME
    topBarWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      zIndex: 100,
    },
    heroBlock: {
      position: 'absolute',
      left: 22,
      right: 22,
      zIndex: 50,
    },
    eyebrow: {
      fontFamily: FONTS.bodySemi,
      fontSize: 11.5,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: 'rgba(40,57,79,0.7)',
    },
    heroTitle: {
      fontFamily: FONTS.display,
      fontSize: 52,
      lineHeight: 56,
      color: '#2a3a52',
      marginTop: 6,
      letterSpacing: -0.7,
    },
    heroTitleItalic: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      color: '#c5613b',
    },

    glassPill: {
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: 'rgba(244,235,222,0.82)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,253,247,0.7)',
    },
    glassPillText: {
      fontFamily: FONTS.bodySemi,
      fontSize: 14,
      color: '#2a3a52',
    },

    statChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: 'rgba(244,235,222,0.85)',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,253,247,0.7)',
    },
    statChipNum: {
      fontFamily: FONTS.display,
      fontSize: 18,
      lineHeight: 20,
      color: '#2a3a52',
      letterSpacing: -0.5,
    },
    statChipLabel: {
      marginTop: 2,
      fontSize: 9.5,
      fontFamily: FONTS.bodySemi,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: '#7d745f',
    },

    // PINS
    pinContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 16,
      height: 28,
    },
    pinLabel: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(244,235,222,0.92)',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,253,247,0.6)',
    },
    pinLabelTitle: {
      fontFamily: FONTS.display,
      fontSize: 13,
      color: '#2a3a52',
    },
    pinLabelSub: {
      fontSize: 8.5,
      fontFamily: FONTS.bodySemi,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    pinPulse: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      top: 7,
      left: 53,
    },
    pinDot: {
      borderWidth: 2,
      borderColor: 'rgba(244,235,222,0.95)',
    },

    // BOTTOM INFO CARD — fixed
    infoCardWrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 50,
    },
    infoCard: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: 'rgba(245,236,223,0.96)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,253,247,0.6)',
    },
    infoDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: 'rgba(245,236,223,0.94)',
    },
    infoEyebrow: {
      fontFamily: FONTS.bodySemi,
      fontSize: 10.5,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    infoMoments: {
      fontFamily: FONTS.bodySemi,
      fontSize: 11,
      color: '#2a3a52',
    },
    infoTitle: {
      fontFamily: FONTS.display,
      fontSize: 22,
      lineHeight: 26,
      color: '#2a3a52',
      letterSpacing: -0.4,
      marginTop: 8,
    },
    infoNote: {
      marginTop: 6,
      fontFamily: FONTS.body,
      fontSize: 13.5,
      lineHeight: 19,
      color: '#7d745f',
    },

    fab: {
      position: 'absolute',
      right: 22,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#2a3a52',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
  });
