import React, { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { FONTS } from '@/components/saint/theme';

import { Fx } from './Fx';
import { PipStage } from './PipLamb';
import { Pet, PetId } from './registry';
import { useLoop, useMotionEnabled } from './anim';
import {
  GREETINGS,
  Lighting,
  NookState,
  Offset,
  SCENES,
  TINTS,
  isEasterSet,
  isSanctuarySet,
  webLevelFor,
} from './nookData';
import { NookItem } from './NookItem';
import { ItemArt, NOOK_H, NOOK_W, NookEffects, PrayerWeb, SceneBackdrop } from './NookScene';

export type NookStats = { offered: number; shared: number; sent: number; received: number };

type Props = {
  nook: NookState;
  stats: NookStats;
  lighting: Lighting;
  petId: PetId;
  stage: PipStage;
  /** Hides the four stat boxes, for small previews where they would crowd the scene. */
  compact?: boolean;
  /** Rendered width in dp; the 342x440 scene is scaled to fit. */
  width: number;
  /** Lets decor be dragged (press and hold, then move). Needs a gesture-handler root above it. */
  editable?: boolean;
  /** Called when a dragged piece is dropped. */
  onMoveItem?: (id: string, offset: Offset) => void;
};

type ViewProps = Props & {
  /** Called when the nook is tapped twice in quick succession. */
  onDoubleTap?: () => void;
  /** Full-screen mode: square corners, no border. */
  bare?: boolean;
};

const DOUBLE_TAP_MS = 350;
const TAP_SLOP = 14;

/** Detects a double tap from raw touches, so taps on pets and decor inside the nook still work. */
export function useDoubleTap(onDoubleTap?: () => void) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  return {
    onTouchStart: (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      start.current = { x: pageX, y: pageY, t: Date.now() };
    },
    onTouchEnd: (e: GestureResponderEvent) => {
      const s0 = start.current;
      start.current = null;
      if (!s0 || !onDoubleTap) return;
      const { pageX, pageY } = e.nativeEvent;
      const now = Date.now();
      // A drag or a long press is not a tap.
      if (Math.hypot(pageX - s0.x, pageY - s0.y) > TAP_SLOP || now - s0.t > 300) {
        last.current = null;
        return;
      }
      const prev = last.current;
      if (prev && now - prev.t < DOUBLE_TAP_MS && Math.hypot(pageX - prev.x, pageY - prev.y) < 60) {
        last.current = null;
        onDoubleTap();
        return;
      }
      last.current = { x: pageX, y: pageY, t: now };
    },
  };
}

const PET = 150;
const NO_OFFSET: Offset = { x: 0, y: 0 };
/** Back to front, so floor pieces sit under the lantern and plant, and hanging pieces are on top. */
const ITEM_ORDER = [
  'glass',
  'tapestry',
  'cross',
  'rug',
  'wreath',
  'cushion',
  'lantern',
  'censer',
  'plant',
  'scripture',
  'lamp',
  'mobile',
  'chimes',
  'bats',
  'garland',
  'web',
  'autumnwreath',
  'hay',
  'jackolantern',
  'wheat',
];
const ITEM_LABEL: Record<string, string> = {
  glass: 'Stained glass',
  tapestry: 'Alpha and Omega banner',
  cross: 'Wooden cross',
  rug: 'Woven rug',
  wreath: 'Lily wreath',
  cushion: 'Prayer cushion',
  lantern: 'Lantern',
  censer: 'Incense',
  plant: 'Fig plant',
  scripture: 'Scripture stand',
  lamp: 'Clay oil lamp',
  mobile: 'Star mobile',
  chimes: 'Chimes',
  hay: 'Hay bale',
  jackolantern: "Jack-o'-lantern",
  wheat: 'Wheat sheaf',
  autumnwreath: 'Autumn wreath',
  web: 'Spiderweb',
  bats: 'Friendly bats',
  garland: 'Candy corn garland',
};

function SleepingPet({ awake, eyesUp, warm }: { awake: boolean; eyesUp: boolean; warm: boolean }) {
  return (
    <View style={{ width: PET, height: PET }}>
      <Svg viewBox="0 0 200 200" width={PET} height={PET}>
        <Ellipse cx={100} cy={174} rx={62} ry={8} fill="#000" opacity={0.3} />
        <Fx kind="breathe" ox={100} oy={174}>
          <G fill="#F7F2E8">
            <Circle cx={58} cy={144} r={26} />
            <Circle cx={100} cy={136} r={34} />
            <Circle cx={142} cy={144} r={26} />
            <Circle cx={80} cy={156} r={22} />
            <Circle cx={120} cy={156} r={22} />
          </G>
          <Ellipse cx={68} cy={108} rx={14} ry={7} fill="#E9D3BA" transform="rotate(-40 68 108)" />
          <Ellipse cx={132} cy={108} rx={14} ry={7} fill="#E9D3BA" transform="rotate(40 132 108)" />
          <Ellipse cx={100} cy={114} rx={25} ry={22} fill="#F1E2CC" />
          <G fill="#F7F2E8">
            <Circle cx={90} cy={94} r={9} />
            <Circle cx={100} cy={90} r={10} />
            <Circle cx={110} cy={94} r={9} />
          </G>
          <Circle cx={85} cy={123} r={4} fill="#E8998A" opacity={0.6} />
          <Circle cx={115} cy={123} r={4} fill="#E8998A" opacity={0.6} />
        </Fx>
        {warm && (
          <Fx kind="glow">
            <Ellipse cx={70} cy={136} rx={22} ry={12} fill="#F2C462" />
          </Fx>
        )}
        {!awake && (
          <>
            <Path d="M85 114 Q90 119 95 114 M105 114 Q110 119 115 114" stroke="#2B2420" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            <Path d="M98 125 Q100 127 102 125" stroke="#2B2420" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </>
        )}
        {awake && !eyesUp && (
          <>
            <Circle cx={90} cy={113} r={3.6} fill="#2B2420" />
            <Circle cx={110} cy={113} r={3.6} fill="#2B2420" />
            <Path d="M96 123 Q100 127 104 123" stroke="#2B2420" strokeWidth={2} fill="none" strokeLinecap="round" />
          </>
        )}
        {awake && eyesUp && (
          <>
            <Circle cx={90} cy={113} r={4} fill="#2B2420" />
            <Circle cx={110} cy={113} r={4} fill="#2B2420" />
            <Circle cx={90.5} cy={110} r={1.5} fill="#FFFFFF" />
            <Circle cx={110.5} cy={110} r={1.5} fill="#FFFFFF" />
            <Ellipse cx={100} cy={124} rx={2.6} ry={3} fill="#2B2420" />
          </>
        )}
      </Svg>
    </View>
  );
}

function Zzz({ top }: { top: number }) {
  const enabled = useMotionEnabled(true);
  const sizes: [number, number, number][] = [
    [214, 20, 16],
    [220, 16, 20],
    [226, 12, 24],
  ];
  return (
    <>
      {sizes.map(([left, dy, size], i) => (
        <ZLetter key={i} left={left} top={top + dy} size={size} delay={i * 1200} enabled={enabled} />
      ))}
    </>
  );
}

function ZLetter({ left, top, size, delay, enabled }: { left: number; top: number; size: number; delay: number; enabled: boolean }) {
  const p = useLoop(3600, delay, enabled, 0.2);
  const style = useAnimatedStyle(() => {
    const v = p.value;
    return {
      opacity: v < 0.2 ? v / 0.2 : 1 - (v - 0.2) / 0.8,
      transform: [{ translateX: 18 * v }, { translateY: -46 * v }, { scale: 0.7 + 0.45 * v }],
    };
  });
  return (
    <Animated.Text
      style={[
        { position: 'absolute', left, top, fontSize: size, color: '#B5DCC6', fontFamily: FONTS.displayItalic },
        style,
      ]}>
      z
    </Animated.Text>
  );
}

function CornerStat({ value, label, style }: { value: number; label: string; style: object }) {
  return (
    <View style={[styles.stat, style]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** "Your nook": themed scene with the sleeping pet, prayer web, decor and the four prayer stats in the corners. */
export function NookView({
  nook,
  stats,
  lighting,
  petId,
  stage,
  width,
  onDoubleTap,
  bare,
  compact,
  editable,
  onMoveItem,
}: ViewProps) {
  const scale = width / NOOK_W;
  const has = (id: string) => nook.items.includes(id);
  const scene = SCENES.find(s => s.id === nook.scene) ?? SCENES[0];
  const webLevel = webLevelFor(stats.offered);

  const [awake, setAwake] = useState(false);
  const [lanternBright, setLanternBright] = useState(false);
  const [leafOn, setLeafOn] = useState(false);
  const [hangFast, setHangFast] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const later = (key: string, ms: number, fn: () => void) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, ms);
  };
  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const hop = useSharedValue(0);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value }] }));
  const wake = () => {
    setAwake(true);
    hop.set(withSequence(
      withTiming(-22, { duration: 280, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 520, easing: Easing.bounce }),
    ));
    later('wake', 2600, () => setAwake(false));
  };
  const tapPlant = () => {
    setLeafOn(false);
    requestAnimationFrame(() => setLeafOn(true));
    later('leaf', 1700, () => setLeafOn(false));
  };
  const tapHang = () => {
    setHangFast(true);
    later('hang', 2000, () => setHangFast(false));
  };

  const hangUp = has('mobile') || has('chimes');
  const warm = has('lantern') || has('censer') || has('lamp');
  const petTop = has('rug') || has('cushion') || has('wreath') ? 156 : 150;
  const tapFor = (id: string): (() => void) | undefined =>
    id === 'lantern'
      ? () => setLanternBright(b => !b)
      : id === 'plant'
        ? tapPlant
        : id === 'lamp' || id === 'mobile' || id === 'chimes'
          ? tapHang
          : undefined;
  const petTopSV = useSharedValue(petTop);
  useEffect(() => {
    petTopSV.value = withTiming(petTop, { duration: 400, easing: Easing.inOut(Easing.quad) });
  }, [petTop, petTopSV]);
  const petPosStyle = useAnimatedStyle(() => ({ top: petTopSV.value }));
  const sceneBgStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(scene.bg, { duration: 600 }),
  }));
  const doubleTap = useDoubleTap(onDoubleTap);
  const sanctuary = isSanctuarySet(nook);
  const easter = isEasterSet(nook);

  return (
    <View style={{ width, height: NOOK_H * scale }} {...doubleTap}>
      <Animated.View
        accessibilityRole="image"
        accessibilityLabel={`Your nook: ${scene.name} scene, pet ${awake ? 'awake' : 'sleeping'}, with your prayer stats around it. Double tap to ${bare ? 'close full screen' : 'view full screen'}.`}
        style={[
          styles.frame,
          bare && styles.frameBare,
          { transform: [{ scale }], transformOrigin: '0% 0%' },
          sceneBgStyle,
        ]}>
        <SceneBackdrop scene={nook.scene} bg={scene.bg} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: TINTS[lighting] }]} />
        <PrayerWeb level={webLevel} />
        {ITEM_ORDER.filter(has).map(id => (
          <NookItem
            key={id}
            id={id}
            offset={nook.offsets[id] ?? NO_OFFSET}
            scale={scale}
            editable={!!editable}
            tapLabel={ITEM_LABEL[id]}
            onTap={tapFor(id)}
            onMove={onMoveItem}
            art={<ItemArt id={id} lanternBright={lanternBright} leafOn={leafOn} hangFast={hangFast} />}
          />
        ))}
        <NookEffects warmLight={warm} easterSet={easter} sanctuarySet={sanctuary} />

        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 96, width: PET, height: PET }, petPosStyle]}>
          <Animated.View style={hopStyle}>
            {petId === 'lamb' ? (
              <SleepingPet awake={awake} eyesUp={hangUp} warm={warm} />
            ) : (
              <Pet id={petId} stage={stage} size={PET} />
            )}
          </Animated.View>
        </Animated.View>
        {/* Only the upper part of the pet wakes it, so the rug and other floor pieces under it stay grabbable. */}
        <Animated.View style={[{ position: 'absolute', left: 96, width: PET, height: PET * 0.72 }, petPosStyle]}>
          <Pressable onPress={wake} accessibilityLabel="Wake your pet" style={{ flex: 1 }} />
        </Animated.View>
        {petId === 'lamb' && !awake && <Zzz top={petTop} />}
        {awake && (
          <View style={{ position: 'absolute', left: 81, top: petTop - 34, width: 180, alignItems: 'center' }}>
            <Text style={styles.greeting}>{GREETINGS[lighting]}</Text>
          </View>
        )}

        {sanctuary && <View pointerEvents="none" style={styles.sanctuaryRing} />}

        {compact ? null : (
          <>
            <CornerStat value={stats.offered} label="prayers offered for others" style={{ left: 10, top: 14 }} />
            <CornerStat value={stats.shared} label="requests you've shared" style={{ right: 10, top: 14 }} />
            <CornerStat value={stats.sent} label="notes of encouragement sent" style={{ left: 10, bottom: 14 }} />
            <CornerStat value={stats.received} label="notes received on your prayers" style={{ right: 10, bottom: 14 }} />
          </>
        )}
      </Animated.View>
    </View>
  );
}

/** "Your nook". Double tap it to open it full screen; double tap again (or tap the X) to close. */
export function Nook(props: Props) {
  const [full, setFull] = useState(false);
  const { width: sw, height: sh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scene = SCENES.find(sc => sc.id === props.nook.scene) ?? SCENES[0];
  // Fill the screen width, or the height if the screen is short and wide.
  const fullW = Math.min(sw, (sh - insets.top - insets.bottom) * (NOOK_W / NOOK_H));

  return (
    <>
      <NookView {...props} onDoubleTap={() => setFull(true)} />
      <Modal
        visible={full}
        animationType="fade"
        statusBarTranslucent
        supportedOrientations={['portrait']}
        onRequestClose={() => setFull(false)}>
        <View style={[styles.fullBackdrop, { backgroundColor: scene.bg }]}>
          <NookView {...props} editable={false} width={fullW} bare onDoubleTap={() => setFull(false)} />
          <Pressable
            onPress={() => setFull(false)}
            accessibilityRole="button"
            accessibilityLabel="Close full screen"
            style={[styles.closeBtn, { top: insets.top + 10 }]}>
            <Text style={styles.closeText}>{'\u00D7'}</Text>
          </Pressable>
          <Text style={[styles.fullHint, { bottom: insets.bottom + 14 }]}>Double tap to close</Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: NOOK_W,
    height: NOOK_H,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2B3A',
  },
  frameBare: { borderRadius: 0, borderWidth: 0 },
  fullBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22,32,45,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#F2E9D8', fontSize: 26, lineHeight: 28 },
  fullHint: { position: 'absolute', alignSelf: 'center', fontFamily: FONTS.body, fontSize: 12, color: 'rgba(242,233,216,0.55)' },
  stat: {
    position: 'absolute',
    width: 128,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(22,32,45,0.6)',
    borderWidth: 1,
    borderColor: '#2A3A4E',
  },
  statValue: { fontFamily: FONTS.displaySemi, fontSize: 30, lineHeight: 32, color: '#F2E9D8' },
  statLabel: { marginTop: 4, fontFamily: FONTS.body, fontSize: 12, lineHeight: 16, color: '#C9C0AF' },
  greeting: {
    overflow: 'hidden',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F2E9D8',
    color: '#1A2230',
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
  },
  sanctuaryRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F2C462',
    opacity: 0.7,
  },
});
