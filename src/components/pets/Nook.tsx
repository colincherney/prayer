import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

import { Fx, PetMotion, SmoothMotion } from './Fx';
import { PipStage } from './PipLamb';
import { Acting } from './petActing';
import { Pet, PetId } from './registry';
import { useLoop, useMotionEnabled } from './anim';
import {
  GREETINGS,
  Lighting,
  NookState,
  Offset,
  DecorSpotId,
  DECOR_SPOTS,
  arrangeNook,
  placementForItem,
  spotFrame,
  spotsForItem,
  GREAT_WEB,
  PRAYER_LIGHTS,
  SHOWN_COLLECTION_DECOR,
  SCENES,
  TINTS,
  isEasterSet,
  isSanctuarySet,
  webLevelFor,
} from './nookData';
import { hasArtScene } from './NookArt';
import { NookItem } from './NookItem';
import { ItemArt, NOOK_H, NOOK_W, NookEffects, NookScale, PrayerWeb, SceneBackdrop } from './NookScene';
import { useNookTransition } from './useNookTransition';

export type NookStats = { offered: number; shared: number; sent: number; received: number };

type Props = {
  nook: NookState;
  stats: NookStats;
  lighting: Lighting;
  petId: PetId;
  stage: PipStage;
  /** Hides the four stat boxes, for small previews where they would crowd the scene. */
  compact?: boolean;
  /** Let the scene blend into a surrounding page instead of framing it as a card. */
  immersive?: boolean;
  /** Rendered width in dp; the 342x440 scene is scaled to fit. */
  width: number;
  /** Lets decor be dragged (press and hold, then move). Needs a gesture-handler root above it. */
  editable?: boolean;
  /** Called when a dragged piece is dropped. */
  onMoveItem?: (id: string, spot: DecorSpotId) => void;
  onMoveItemFreely?: (id: string, position: Offset) => void;
  /** Called when a piece is tapped. */
  onTapItem?: (id: string) => void;
  showSpots?: boolean;
  selectedItem?: string;
  /** The caller draws the scene, tint and Prayer web full screen behind this view (the decorator). */
  fullBleed?: boolean;
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
/** On the Me page the pet is drawn a little larger, as the scene's hero. */
const HERO_PET = 1.16;
/** Puts the pet's feet on the rug. */
const PET_TOP = 198;
/** Back to front, so floor pieces sit under the lantern and plant, and hanging pieces are on top. */
/** Collection pieces go back to front by spot: rugs and wall art, then floor and side pieces, then overhead and ambience. */
const LAYER_RANK: Record<string, number> = { wall: 0, floor: 1, left: 2, right: 2, hang: 3, ambience: 4 };
const COLLECTION_LAYERS = [...SHOWN_COLLECTION_DECOR]
  .sort((a, b) => LAYER_RANK[a.slot] - LAYER_RANK[b.slot])
  .map(d => d.id);
const ITEM_ORDER = [
  GREAT_WEB,
  PRAYER_LIGHTS,
  'glass',
  'tapestry',
  'rose',
  'cross',
  'treeL',
  'treeR',
  'bluerug',
  'rug',
  'wreath',
  'cushion',
  'bench',
  'candles',
  'lily',
  'lantern',
  'censer',
  'plant',
  'scripture',
  'lamp',
  'mobile',
  'chimes',
  'bats',
  'garland',
  'lights',
  'dove',
  'prayerweb',
  'web',
  'autumnwreath',
  'hay',
  'jackolantern',
  'pilgrimlantern',
  'wheat',
  ...COLLECTION_LAYERS,
];
const ITEM_LABEL: Record<string, string> = {
  [GREAT_WEB]: 'Great web',
  [PRAYER_LIGHTS]: 'Prayer lights',
  glass: 'Stained glass',
  tapestry: 'Alpha and Omega banner',
  cross: 'Olivewood cross',
  bluerug: 'Woven rug',
  rug: 'Prayer rug',
  candles: 'Candle',
  lily: 'Lily pot',
  treeL: 'Olive tree',
  treeR: 'Olive tree',
  bench: 'Prayer bench',
  rose: 'Rose window',
  lights: 'String lights',
  dove: 'Hanging dove',
  prayerweb: 'Prayer web',
  wreath: 'Lily wreath',
  cushion: 'Prayer cushion',
  lantern: 'Lantern post',
  censer: 'Incense',
  plant: 'Fig plant',
  scripture: 'Scripture stand',
  lamp: 'Clay oil lamp',
  mobile: 'Star mobile',
  chimes: 'Chimes',
  hay: 'Hay bale',
  jackolantern: "Jack-o'-lantern",
  pilgrimlantern: "Pilgrim's lantern",
  wheat: 'Wheat sheaf',
  autumnwreath: 'Autumn wreath',
  web: 'Spiderweb',
  bats: 'Friendly bats',
  garland: 'Candy corn garland',
  ...Object.fromEntries(SHOWN_COLLECTION_DECOR.map(d => [d.id, d.name])),
};

function SleepingPet({ awake, eyesUp, warm, size }: { awake: boolean; eyesUp: boolean; warm: boolean; size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 200 200" width={size} height={size}>
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

function Zzz({ top, px }: { top: number; px: number }) {
  const enabled = useMotionEnabled(useContext(PetMotion));
  const sizes: [number, number, number][] = [
    [214, 20, 16],
    [220, 16, 20],
    [226, 12, 24],
  ];
  return (
    <>
      {sizes.map(([left, dy, size], i) => (
        <ZLetter key={i} left={left * px} top={(top + dy) * px} size={size * px} px={px} delay={i * 1200} enabled={enabled} />
      ))}
    </>
  );
}

function ZLetter({ left, top, size, px, delay, enabled }: { left: number; top: number; size: number; px: number; delay: number; enabled: boolean }) {
  const p = useLoop(3600, delay, enabled, 0.2);
  const style = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: v < 0.2 ? v / 0.2 : 1 - (v - 0.2) / 0.8,
      transform: [{ translateX: 18 * v * px }, { translateY: -46 * v * px }, { scale: 0.7 + 0.45 * v }],
    };
  });
  return (
    <Animated.Text
      style={[
        { position: 'absolute', left, top, fontSize: size, color: '#B5DCC6', fontFamily: FONTS.display },
        style,
      ]}>
      z
    </Animated.Text>
  );
}

function CornerStat({ value, label, at, px }: { value: number; label: string; at: Record<string, number>; px: number }) {
  const place = Object.fromEntries(Object.entries(at).map(([k, v]) => [k, v * px]));
  return (
    <View style={[styles.stat, { width: 128 * px, paddingVertical: 10 * px, paddingHorizontal: 14 * px, borderRadius: 18 * px }, place]}>
      <Text style={[styles.statValue, { fontSize: 30 * px, lineHeight: 32 * px }]}>{value}</Text>
      <Text style={[styles.statLabel, { marginTop: 4 * px, fontSize: 12 * px, lineHeight: 16 * px }]}>{label}</Text>
    </View>
  );
}

/** "Your nook": themed scene with the sleeping pet, prayer web, decor and the four prayer stats in the corners. */
/** Memoized so a parent's unrelated state changes (a selection, a panel) don't redraw the whole scene. */
export const NookView = memo(function NookView({
  nook: savedNook,
  stats,
  lighting,
  petId,
  stage,
  width,
  onDoubleTap,
  bare,
  compact,
  immersive,
  editable,
  onMoveItem,
  onMoveItemFreely,
  onTapItem,
  showSpots,
  selectedItem,
  fullBleed,
}: ViewProps) {
  const nook = useMemo(() => arrangeNook(savedNook), [savedNook]);
  const freeMove = nook.placementMode === 'free';
  const scale = width / NOOK_W;
  // Keeps the pet uncapped when a parent (the decorator) has already lifted the cap.
  const smoothAround = useContext(SmoothMotion);
  // The pet sets its own motion, so pass along a page that has turned motion off (the decorator).
  const motionAround = useContext(PetMotion);
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
  // The pet's box, in dp. The hero pet grows from the bottom centre of its usual spot, so its feet stay put.
  const petSize = PET * scale * (immersive ? HERO_PET : 1);
  const petLeft = (96 + PET / 2) * scale - petSize / 2;
  const petTop = (PET_TOP + PET) * scale - petSize;
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.get() * scale }] }));
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
  const tapFor = (id: string): (() => void) | undefined =>
    id === 'lantern'
      ? () => setLanternBright(b => !b)
      : id === 'plant'
        ? tapPlant
        : id === 'lamp' || id === 'mobile' || id === 'chimes'
          ? tapHang
          : undefined;
  const sceneBgStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(scene.bg, { duration: 600 }),
  }));
  const doubleTap = useDoubleTap(onDoubleTap);
  const sanctuary = isSanctuarySet(nook);
  const easter = isEasterSet(nook);

  return (
    <View style={{ width, height: NOOK_H * scale }} {...doubleTap}>
      <NookScale.Provider value={scale}>
      <Animated.View
        accessibilityRole="image"
        accessibilityLabel={`Your nook: ${scene.name} scene, pet ${awake ? 'awake' : 'sleeping'}${compact ? '' : ', with your prayer stats around it'}.${onDoubleTap ? ` Double tap to ${bare ? 'close full screen' : 'view full screen'}.` : ''}`}
        style={[
          styles.frame,
          { width: NOOK_W * scale, height: NOOK_H * scale, borderRadius: 28 * scale },
          (bare || immersive || fullBleed) && styles.frameBare,
          fullBleed ? styles.frameClear : sceneBgStyle,
        ]}>
        {fullBleed && hasArtScene(nook.scene) ? null : <SceneBackdrop scene={nook.scene} bg={scene.bg} />}
        {fullBleed ? null : <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: TINTS[lighting] }]} />}
        {!freeMove && (has(PRAYER_LIGHTS) || has(GREAT_WEB)) ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}><PrayerWeb level={webLevel} web={has(GREAT_WEB)} lights={has(PRAYER_LIGHTS)} /></View> : null}
        {editable && !freeMove && (showSpots || selectedItem) ? DECOR_SPOTS.filter(spot => spot.id !== 'atmosphere' && (showSpots || spotsForItem(selectedItem!).includes(spot.id))).map(spot => {
          const box = spotFrame(nook, spot.id);
          return <View key={spot.id} pointerEvents="none" style={{ position: 'absolute', left: box.x * scale, top: box.y * scale, width: box.w * scale, height: box.h * scale, borderRadius: 12 * scale, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(242,196,98,0.48)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONTS.bodySemi, fontSize: 9 * scale, color: '#F2E9D8', backgroundColor: 'rgba(20,17,42,0.55)', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 5 }}>{spot.label}</Text>
          </View>;
        }) : null}
        {ITEM_ORDER.filter(id => has(id) && (freeMove || (id !== GREAT_WEB && id !== PRAYER_LIGHTS))).map(id => (
          <NookItem
            key={id}
            id={id}
            placement={placementForItem(nook, id)}
            targets={spotsForItem(id).map(spot => placementForItem(nook, id, spot))}
            scale={scale}
            editable={!!editable}
            freeMove={freeMove}
            selected={selectedItem === id}
            tapLabel={ITEM_LABEL[id]}
            onTap={onTapItem ? () => { tapFor(id)?.(); onTapItem(id); } : tapFor(id)}
            onMove={onMoveItem}
            onMoveFreely={onMoveItemFreely}
            sceneLayer={id === GREAT_WEB || id === PRAYER_LIGHTS ? <PrayerWeb level={webLevel} web={id === GREAT_WEB} lights={id === PRAYER_LIGHTS} /> : undefined}
            art={fullBleed && !freeMove && id === 'prayerweb' ? null : <ItemArt id={id} lanternBright={lanternBright} leafOn={leafOn} hangFast={hangFast} />}
          />
        ))}
        <NookEffects warmLight={warm} easterSet={easter} sanctuarySet={sanctuary} />

        <View pointerEvents="none" style={{ position: 'absolute', left: petLeft, top: petTop, width: petSize, height: petSize }}>
          <Animated.View style={hopStyle}>
            <View>
            {/* On the Me page the pet is what people watch, so it alone skips the 30fps cap. */}
            <SmoothMotion.Provider value={!!immersive || !!fullBleed || smoothAround}>
            {petId === 'lamb' ? (
              <SleepingPet awake={awake} eyesUp={hangUp} warm={warm} size={petSize} />
            ) : (
              <Acting petId={petId} size={petSize}>
                <Pet id={petId} stage={stage} size={petSize} animated={motionAround} />
              </Acting>
            )}
            </SmoothMotion.Provider>
            </View>
          </Animated.View>
        </View>
        {/* Only the upper part of the pet wakes it, so the rug and other floor pieces under it stay grabbable. */}
        <View pointerEvents={editable && freeMove ? 'none' : 'auto'} style={{ position: 'absolute', left: 96 * scale, top: PET_TOP * scale, width: PET * scale, height: PET * 0.72 * scale }}>
          <Pressable onPress={wake} accessibilityRole="button" accessibilityLabel="Say hello to your pet" style={{ flex: 1 }} />
        </View>
        {petId === 'lamb' && !awake && <Zzz top={PET_TOP} px={scale} />}
        {awake && (
          <View style={{ position: 'absolute', left: 81 * scale, top: (PET_TOP - 34) * scale, width: 180 * scale, alignItems: 'center' }}>
            <Text style={[styles.greeting, { fontSize: 13 * scale, paddingVertical: 6 * scale, paddingHorizontal: 12 * scale }]}>{GREETINGS[lighting]}</Text>
          </View>
        )}

        {sanctuary && !immersive && <View pointerEvents="none" style={[styles.sanctuaryRing, { borderRadius: 28 * scale }]} />}

        {compact ? null : (
          <>
            <CornerStat value={stats.offered} label="prayers offered for others" at={{ left: 10, top: 14 }} px={scale} />
            <CornerStat value={stats.shared} label="requests you've shared" at={{ right: 10, top: 14 }} px={scale} />
            <CornerStat value={stats.sent} label="notes of encouragement sent" at={{ left: 10, bottom: 14 }} px={scale} />
            <CornerStat value={stats.received} label="notes received on your prayers" at={{ right: 10, bottom: 14 }} px={scale} />
          </>
        )}
      </Animated.View>
      </NookScale.Provider>
    </View>
  );
});

/** "Your nook". Double tap it to open it full screen; double tap again (or tap the X) to close. */
export function Nook(props: Props) {
  const [full, setFull] = useState(false);
  return (
    <>
      <NookView {...props} onDoubleTap={() => setFull(true)} />
      {full ? <FullscreenNook {...props} onClose={() => setFull(false)} /> : null}
    </>
  );
}

function FullscreenNook({ onClose, ...props }: Props & { onClose: () => void }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scene = SCENES.find(sc => sc.id === props.nook.scene) ?? SCENES[0];
  const { motionStyle, dismiss } = useNookTransition(onClose);
  // Fill the screen width, or the height if the screen is short and wide.
  const fullW = Math.min(sw, (sh - insets.top - insets.bottom) * (NOOK_W / NOOK_H));

  return (
      <Modal
        visible
        transparent
        animationType="none"
        statusBarTranslucent
        supportedOrientations={['portrait']}
        onRequestClose={() => dismiss()}>
        <Animated.View style={[styles.fullBackdrop, { backgroundColor: scene.bg }, motionStyle]}>
          <NookView {...props} editable={false} width={fullW} bare onDoubleTap={() => dismiss()} />
          <Pressable
            onPress={() => dismiss()}
            accessibilityRole="button"
            accessibilityLabel="Close full screen"
            style={[styles.closeBtn, { top: insets.top + 10 }]}>
            <Text style={styles.closeText}>{'\u00D7'}</Text>
          </Pressable>
          <Text style={[styles.fullHint, { bottom: insets.bottom + 14 }]}>Double tap to close</Text>
        </Animated.View>
      </Modal>
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
  frameClear: { backgroundColor: 'transparent' },
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
