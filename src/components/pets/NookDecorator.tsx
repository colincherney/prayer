import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal,
  Pressable,
  PressableProps,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { CloseIcon } from '@/components/saint/Icons';
import { FONTS } from '@/components/saint/theme';
import { itemProductId, owns, sceneProductId } from '@/lib/store';
import { useReleases } from '@/lib/releases';

import { CosmeticIcon } from './CosmeticIcon';
import { NookStats, NookView } from './Nook';
import { SmoothMotion } from './Fx';
import { ArtFullScene, ART_H, ART_TOP, ART_W, hasArtScene } from './NookArt';
import { NOOK_W } from './NookScene';
import {
  isEasterSet,
  isSanctuarySet,
  Lighting,
  NookState,
  Offset,
  ROWS,
  SCENES,
  TINTS,
  toggleItem,
} from './nookData';
import { PipStage } from './PipLamb';
import { PetId } from './registry';
import { useNookTransition } from './useNookTransition';

type Props = {
  nook: NookState;
  owned: ReadonlySet<string>;
  stats: NookStats;
  lighting: Lighting;
  petId: PetId;
  petName: string;
  stage: PipStage;
  onSave: (nook: NookState) => Promise<void>;
  onClose: () => void;
  onBrowse: (destination: '/store' | '/quests') => void;
};

type Selection = { kind: 'scene' | 'item'; id: string } | null;
type History = { now: NookState; past: NookState[] };

const BG = '#14112A';
const PANEL = '#221C3E';
const RAIL = 'rgba(34,28,62,0.82)';
const CONTROL = 'rgba(20,17,42,0.86)';
const ACCENT = '#E8913A';
const INK = '#F2E9D8';
const SOFT = '#B5A8D0';
const SAVED = '#5FBF8A';

const HISTORY_LIMIT = 30;
const TAP_SLOP = 10;
const TAP_MS = 300;
const GRID = 26;
const NO_OFFSET: Offset = { x: 0, y: 0 };
const TOTAL_PIECES = ROWS.reduce((sum, row) => sum + row.items.length, 0);
const ALL_ITEMS = ROWS.flatMap(row => row.items);

type IconProps = { color?: string };
const stroke = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function MenuIcon({ color = INK }: IconProps) {
  return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M4 7H20M4 12H20M4 17H20" stroke={color} {...stroke} /></Svg>;
}
function GridIcon({ color = INK }: IconProps) {
  return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M4 4H20V20H4ZM4 9.3H20M4 14.7H20M9.3 4V20M14.7 4V20" stroke={color} {...stroke} /></Svg>;
}
function ResetIcon({ color = INK, size = 22 }: IconProps & { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 5V10H9M4.6 10A8 8 0 1 1 4 13" stroke={color} {...stroke} /></Svg>;
}
function UndoIcon({ color = INK }: IconProps) {
  return <Svg width={28} height={28} viewBox="0 0 24 24"><Path d="M9 5L4 10L9 15M4 10H14A6 6 0 0 1 14 22H11" stroke={color} {...stroke} /></Svg>;
}
function BagIcon({ color = ACCENT }: IconProps) {
  return <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M5 8H19L18 21H6ZM9 11V6A3 3 0 0 1 15 6V11" stroke={color} {...stroke} /></Svg>;
}
function TrashIcon({ color = ACCENT }: IconProps) {
  return <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 7H20M9 7V4H15V7M6 7L7 21H17L18 7M10 11V17M14 11V17" stroke={color} {...stroke} /></Svg>;
}
function ChevronIcon({ left }: { left: boolean }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24"><Path d={left ? 'M15 5L8 12L15 19' : 'M9 5L16 12L9 19'} stroke={INK} {...stroke} /></Svg>;
}
function LockIcon() {
  return <Svg width={9} height={9} viewBox="0 0 24 24"><Path d="M5 11H19V21H5ZM8 11V7A4 4 0 0 1 16 7V11" stroke={INK} {...stroke} strokeWidth={3} /></Svg>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Buttons call this so the tap that pressed them doesn't also clear the selection. */
const ClaimTap = createContext<() => void>(() => {});

/** A pressable with the same soft press feedback as the Me page's buttons. */
function Press({ style, children, onPress, ...props }: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const claimTap = useContext(ClaimTap);
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pressed.get() * 0.05 }] }));
  const to = (value: number) => {
    if (reducedMotion) return;
    pressed.set(withTiming(value, { duration: 110 }));
  };
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={event => {
        claimTap();
        onPress?.(event);
      }}
      onPressIn={() => to(1)}
      onPressOut={() => to(0)}
      style={[style, motion]}
      {...props}>
      {children}
    </AnimatedPressable>
  );
}

function Tile({ kind, id, label, selected, placed, locked, onPress, disabled }: {
  kind: 'scene' | 'item';
  id: string;
  label: string;
  selected: boolean;
  placed: boolean;
  locked: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`${label}${locked ? ', not in your collection yet' : placed ? ', in your nook' : ''}`}
      accessibilityState={{ selected }}
      style={[styles.tile, placed && styles.tilePlaced, selected && styles.tileSelected]}>
      <CosmeticIcon kind={kind} id={id} size={38} />
      {placed && kind === 'item' ? <View style={styles.tileDot} /> : null}
      {locked ? <View style={styles.tileLock}><LockIcon /></View> : null}
    </Press>
  );
}

/** A full-screen, game-style builder: the scene fills the screen, parts run down the left, tools sit in the corners. */
export function NookDecorator({ nook, owned, stats, lighting, petId, petName, stage, onSave, onClose, onBrowse }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAvailable } = useReleases();
  // The tab bar's height can be counted in this inset, but this page covers the tab bar.
  const bottomInset = Math.min(insets.bottom, 34);
  const reducedMotion = useReducedMotion();
  const [railOpen, setRailOpen] = useState(true);
  const railShift = useSharedValue(0);
  const railMotion = useAnimatedStyle(() => ({
    opacity: 1 - railShift.get(),
    transform: [{ translateX: railShift.get() * -96 }],
  }));
  const toggleRail = (open: boolean) => {
    setRailOpen(open);
    railShift.set(reducedMotion ? (open ? 0 : 1) : withTiming(open ? 0 : 1, { duration: 200 }));
  };
  const [history, setHistory] = useState<History>({ now: nook, past: [] });
  const [selected, setSelected] = useState<Selection>(null);
  const [showAll, setShowAll] = useState(false);
  const [grid, setGrid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { motionStyle, dismiss } = useNookTransition(onClose, true);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deselectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const tapClaimed = useRef(false);
  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    if (deselectTimer.current) clearTimeout(deselectTimer.current);
  }, []);

  // Stable, so the nook and its pieces don't re-render every time the selection or a panel changes.
  const claimTap = useCallback(() => {
    tapClaimed.current = true;
  }, []);
  const onTouchStart = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    touchStart.current = { x: pageX, y: pageY, t: Date.now() };
    tapClaimed.current = false;
  };
  /** A tap that no button or piece took clears the selection. The wait lets a tap on a piece arrive from the gesture thread. */
  const onTouchEnd = (event: GestureResponderEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const { pageX, pageY } = event.nativeEvent;
    if (Math.hypot(pageX - start.x, pageY - start.y) > TAP_SLOP || Date.now() - start.t > TAP_MS) return;
    if (deselectTimer.current) clearTimeout(deselectTimer.current);
    deselectTimer.current = setTimeout(() => {
      if (!tapClaimed.current) setSelected(null);
    }, 120);
  };

  const draft = history.now;
  const has = (id: string) => draft.items.includes(id);
  const busy = saving || saved;

  /** Every change to the nook goes through here, so it can be undone. */
  const commit = useCallback((update: (current: NookState) => NookState) => {
    setHistory(current => {
      const next = update(current.now);
      if (next === current.now) return current;
      return { now: next, past: [...current.past.slice(-(HISTORY_LIMIT - 1)), current.now] };
    });
  }, []);
  const onTapItem = useCallback((id: string) => {
    claimTap();
    setSelected({ kind: 'item', id });
  }, [claimTap]);
  const onMoveItem = useCallback((id: string, offset: Offset) => {
    setSelected({ kind: 'item', id });
    commit(current => current.items.includes(id)
      ? { ...current, offsets: { ...current.offsets, [id]: offset } }
      : current);
  }, [commit]);
  const undo = () => {
    setSelected(null);
    setHistory(current => {
      if (current.past.length === 0) return current;
      return { now: current.past[current.past.length - 1], past: current.past.slice(0, -1) };
    });
  };

  // The art is 390x844, so scale it to cover the screen, then line the 342x440 nook up with the part of the art it shows.
  const artScale = Math.max(width / ART_W, height / ART_H);
  const nookWidth = ART_W * artScale;
  const nookLeft = (width - nookWidth) / 2;
  const nookTop = (height - ART_H * artScale) / 2 + ART_TOP * artScale;
  const nookScale = nookWidth / NOOK_W;

  const scene = SCENES.find(s => s.id === draft.scene) ?? SCENES[0];
  const sceneOwned = (id: string) => {
    const def = SCENES.find(s => s.id === id);
    return !def?.locked || owns(owned, sceneProductId(id));
  };
  const itemOwned = (id: string) => {
    const def = ALL_ITEMS.find(item => item.id === id);
    return !def?.locked || owns(owned, itemProductId(id));
  };

  const tapScene = (id: string) => {
    setSelected({ kind: 'scene', id });
    if (sceneOwned(id)) commit(current => current.scene === id ? current : { ...current, scene: SCENES.find(s => s.id === id)!.id });
  };
  const tapItem = (id: string) => {
    if (!itemOwned(id)) {
      setSelected({ kind: 'item', id });
      return;
    }
    const isSelected = selected?.kind === 'item' && selected.id === id;
    if (has(id) && isSelected) {
      commit(current => toggleItem(current, id));
      setSelected(null);
    } else {
      if (!has(id)) commit(current => toggleItem(current, id));
      setSelected({ kind: 'item', id });
    }
  };
  const removeSelected = () => {
    if (selected?.kind !== 'item') return;
    const { id } = selected;
    commit(current => current.items.includes(id) ? toggleItem(current, id) : current);
    setSelected(null);
  };
  const resetPositions = () => {
    setMenuOpen(false);
    commit(current => Object.keys(current.offsets).length === 0 ? current : { ...current, offsets: {} });
  };
  const clearNook = () => {
    setMenuOpen(false);
    setSelected(null);
    commit(current => current.items.length === 0 ? current : { ...current, items: [], offsets: {} });
  };
  const goStore = () => dismiss(() => onBrowse('/store'));

  const save = async () => {
    if (busy) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setSaving(false);
      setSaved(true);
      savedTimer.current = setTimeout(() => dismiss(), 650);
    } catch {
      setError('Your changes could not be saved. Please try again.');
      setSaving(false);
    }
  };

  const selectedItem = selected?.kind === 'item' ? ALL_ITEMS.find(item => item.id === selected.id) : undefined;
  const selectedScene = selected?.kind === 'scene' ? SCENES.find(s => s.id === selected.id) : undefined;
  const selectedRow = selectedItem ? ROWS.find(row => row.items.includes(selectedItem)) : undefined;
  const selectedOwned = selectedItem ? itemOwned(selectedItem.id) : selectedScene ? sceneOwned(selectedScene.id) : true;
  const selectedPlaced = !!selectedItem && has(selectedItem.id);
  const chipNote = !selectedOwned
    ? selectedItem?.earned ?? 'Not in your collection yet'
    : selectedScene
      ? 'Your backdrop'
      : selectedPlaced ? 'Hold it to move it' : 'Tap again to add';

  const gridPath = useMemo(() => {
    let d = '';
    for (let x = GRID; x < width; x += GRID) d += `M${x} 0V${height}`;
    for (let y = GRID; y < height; y += GRID) d += `M0 ${y}H${width}`;
    return d;
  }, [width, height]);

  // Set progress: the Easter set once the room leans that way, otherwise the sanctuary.
  const easterFocus = draft.scene === 'easter' || has('wreath') || has('chimes');
  const setDone = easterFocus ? isEasterSet(draft) : isSanctuarySet(draft);
  const setParts = easterFocus
    ? [draft.scene === 'easter', has('wreath'), has('chimes')]
    : [draft.scene === 'chapel', has('cushion'), has('censer'), has('glass')];
  const setName = easterFocus ? 'Easter set' : 'Sanctuary set';
  const setText = setDone ? `${setName} complete ✦` : `${setName}: ${setParts.filter(Boolean).length} / ${setParts.length}`;

  const barTop = insets.top + 8;
  const stackBottom = 26 + bottomInset;
  const showPanel = !!selectedItem || (!!selectedScene && !selectedOwned);
  const canRemove = selectedPlaced;
  const drawsFullScene = hasArtScene(draft.scene) || has('prayerweb');

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => { if (!busy) dismiss(); }}>
      <Animated.View style={[styles.root, motionStyle]}>
        <ClaimTap.Provider value={claimTap}>
        {/* Decorating is all about the scene, so its animations skip the 30fps cap. */}
        <SmoothMotion.Provider value>
        <GestureHandlerRootView onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={[styles.root, { backgroundColor: scene.bg }]}>
          <StatusBar barStyle="light-content" />

          {drawsFullScene ? (
            <ArtFullScene id={draft.scene} web={has('prayerweb')} webOffset={draft.offsets.prayerweb ?? NO_OFFSET} width={width} height={height} />
          ) : null}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: TINTS[lighting] }]} />
          <LinearGradient pointerEvents="none" colors={[BG, 'transparent']} style={styles.topFade} />
          <LinearGradient pointerEvents="none" colors={['transparent', BG]} style={styles.bottomFade} />

          <View style={{ position: 'absolute', left: nookLeft, top: nookTop }}>
            <NookView
              nook={draft}
              stats={stats}
              lighting={lighting}
              petId={petId}
              stage={stage}
              width={nookWidth}
              compact
              fullBleed
              editable={!busy}
              snap={grid ? GRID / nookScale : 0}
              onTapItem={onTapItem}
              onMoveItem={onMoveItem}
            />
          </View>

          {grid ? (
            <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Path d={gridPath} stroke="rgba(232,145,58,0.16)" strokeWidth={1} fill="none" />
            </Svg>
          ) : null}

          <View style={[styles.topBar, { top: barTop }]}>
            <Press onPress={() => setMenuOpen(open => !open)} disabled={busy} hitSlop={4}
              accessibilityLabel="Menu" accessibilityState={{ expanded: menuOpen }} style={[styles.control, styles.menuButton]}>
              <MenuIcon />
            </Press>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>DECORATING</Text>
              <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>{petName}&apos;s place</Text>
            </View>
            <Press onPress={() => dismiss()} disabled={busy} hitSlop={4} accessibilityLabel="Cancel decorating" style={[styles.control, styles.closeButton]}>
              <CloseIcon size={18} color={INK} />
            </Press>
            <Press onPress={save} disabled={busy} hitSlop={4} accessibilityLabel={saved ? 'Saved' : 'Save your nook'}
              style={[styles.saveButton, saved && styles.saveDone]}>
              {saving ? <ActivityIndicator size="small" color={BG} /> : <Text style={styles.saveText}>{saved ? 'Saved' : 'Save'}</Text>}
            </Press>
          </View>

          <Animated.View pointerEvents={railOpen ? 'box-none' : 'none'} accessibilityElementsHidden={!railOpen}
            importantForAccessibility={railOpen ? 'auto' : 'no-hide-descendants'} style={[StyleSheet.absoluteFill, railMotion]}>
          <View style={[styles.rail, { top: barTop + 52, bottom: 214 + bottomInset }]}>
            <Press onPress={() => toggleRail(false)} hitSlop={6} accessibilityLabel="Hide the parts list" style={styles.railClose}>
              <ChevronIcon left />
            </Press>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              <Text accessibilityRole="header" style={[styles.section, selectedScene && styles.sectionActive]}>Scenes</Text>
              {SCENES.filter(s => (isAvailable(sceneProductId(s.id)) && (showAll || sceneOwned(s.id))) || s.id === draft.scene).map(s => (
                <Tile key={s.id} kind="scene" id={s.id} label={s.name} disabled={busy}
                  selected={selectedScene?.id === s.id}
                  placed={draft.scene === s.id}
                  locked={!sceneOwned(s.id)}
                  onPress={() => tapScene(s.id)} />
              ))}
              {ROWS.map(row => (
                <React.Fragment key={row.slot}>
                  <Text accessibilityRole="header" style={[styles.section, selectedRow?.slot === row.slot && styles.sectionActive]}>{row.label}</Text>
                  {row.items.filter(item => (isAvailable(itemProductId(item.id)) && (showAll || itemOwned(item.id))) || has(item.id)).map(item => (
                    <Tile key={item.id} kind="item" id={item.id} label={item.name} disabled={busy}
                      selected={selectedItem?.id === item.id}
                      placed={has(item.id)}
                      locked={!itemOwned(item.id)}
                      onPress={() => tapItem(item.id)} />
                  ))}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.tools, { bottom: stackBottom }]}>
            <Press onPress={() => setShowAll(all => !all)} disabled={busy}
              accessibilityLabel={showAll ? 'Showing all pieces. Switch to your collection' : 'Showing your collection. Switch to all pieces'}
              accessibilityState={{ selected: showAll }} style={[styles.tool, styles.toggle]}>
              <Text style={[styles.toggleText, !showAll && styles.toggleActive]}>Mine</Text>
              <View style={styles.toggleDivider} />
              <Text style={[styles.toggleText, showAll && styles.toggleActive]}>All</Text>
            </Press>
            <Press onPress={() => setGrid(on => !on)} disabled={busy} accessibilityLabel="Snap grid"
              accessibilityState={{ selected: grid }} style={[styles.tool, grid && styles.toolOn]}>
              <GridIcon color={grid ? ACCENT : INK} />
            </Press>
            <Press onPress={resetPositions} disabled={busy} accessibilityLabel="Reset positions" style={styles.tool}>
              <ResetIcon />
            </Press>
          </View>

          </Animated.View>

          {railOpen ? null : (
            <Press onPress={() => toggleRail(true)} hitSlop={2} accessibilityLabel="Show the parts list"
              style={[styles.control, styles.railOpen, { top: barTop + 52 }]}>
              <ChevronIcon left={false} />
            </Press>
          )}

          {showPanel ? (
            <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(160)} style={[styles.panel, { bottom: 24 + bottomInset }]}>
              <Text numberOfLines={1} style={styles.readoutText}>{selectedItem?.name ?? selectedScene?.name}</Text>
              <Text numberOfLines={2} style={styles.panelNote}>{chipNote}</Text>
              <View style={styles.panelActions}>
                {!selectedOwned ? (
                  <Press onPress={selectedItem?.earned ? () => dismiss(() => onBrowse('/quests')) : goStore} accessibilityRole="link" style={styles.panelStore}>
                    <Text style={styles.panelStoreText}>{selectedItem?.earned ? 'Quests' : 'Store'}</Text>
                  </Press>
                ) : null}
                {canRemove ? (
                  <Press onPress={removeSelected} disabled={busy} accessibilityLabel="Remove piece" style={styles.panelButton}>
                    <Text style={styles.panelButtonText}>Remove</Text>
                  </Press>
                ) : null}
                <Press onPress={() => setSelected(null)} accessibilityLabel="Done with this piece" style={styles.panelButton}>
                  <Text style={styles.panelButtonText}>Done</Text>
                </Press>
              </View>
            </Animated.View>
          ) : (
            <View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.readout, { bottom: 30 + bottomInset }]}>
              <Text numberOfLines={1} style={styles.readoutText}>Scene: {scene.name}</Text>
              <Text style={styles.readoutText}>Pieces: {draft.items.length} / {TOTAL_PIECES}</Text>
              <Text numberOfLines={1} style={[styles.readoutText, setDone && styles.readoutDone]}>{setText}</Text>
            </View>
          )}

          <Press onPress={undo} disabled={busy || history.past.length === 0} accessibilityLabel="Undo"
            accessibilityState={{ disabled: busy || history.past.length === 0 }}
            style={[styles.undo, { bottom: 30 + bottomInset }, history.past.length === 0 && styles.undoEmpty]}>
            <UndoIcon />
          </Press>

          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { top: barTop + 52 }]}>{error}</Text>
          ) : null}

          {menuOpen ? (
            <>
              <Pressable accessibilityLabel="Close menu" onPress={() => setMenuOpen(false)} style={StyleSheet.absoluteFill} />
              <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(140)} style={[styles.menu, { top: barTop + 50 }]}>
                <Press onPress={goStore} accessibilityRole="link" style={styles.menuRow}>
                  <BagIcon />
                  <Text style={styles.menuText}>Store</Text>
                </Press>
                <Press onPress={resetPositions} style={styles.menuRow}>
                  <ResetIcon color={ACCENT} size={18} />
                  <Text style={styles.menuText}>Reset positions</Text>
                </Press>
                <Press onPress={clearNook} style={styles.menuRow}>
                  <TrashIcon />
                  <Text style={styles.menuText}>Clear the nook</Text>
                </Press>
                <Text style={styles.menuHint}>Tap a piece to add it. Hold a piece in the nook to move it.</Text>
              </Animated.View>
            </>
          ) : null}
        </GestureHandlerRootView>
        </SmoothMotion.Provider>
        </ClaimTap.Provider>
      </Animated.View>
    </Modal>
  );
}

const shadow = { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 };

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  topFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 230 },

  topBar: { position: 'absolute', left: 14, right: 14, height: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  control: { height: 42, borderRadius: 12, backgroundColor: CONTROL, alignItems: 'center', justifyContent: 'center', ...shadow },
  menuButton: { width: 46 },
  closeButton: { width: 42 },
  titleBlock: { flex: 1, marginLeft: 4 },
  eyebrow: { fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 2, color: ACCENT },
  title: { fontFamily: FONTS.displaySemi, fontSize: 19, color: INK },
  saveButton: { width: 82, height: 42, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', ...shadow },
  saveDone: { backgroundColor: SAVED },
  saveText: { fontFamily: FONTS.bodyBold, fontSize: 15, color: BG },

  rail: { position: 'absolute', left: 10, width: 68, borderRadius: 14, backgroundColor: RAIL, overflow: 'hidden' },
  railClose: { height: 34, alignItems: 'center', justifyContent: 'center' },
  railOpen: { position: 'absolute', left: 10, width: 44, height: 44 },
  railContent: { alignItems: 'center', gap: 6, paddingBottom: 8 },
  section: {
    alignSelf: 'stretch',
    paddingVertical: 6,
    marginTop: 2,
    backgroundColor: 'rgba(242,233,216,0.08)',
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    textAlign: 'center',
    color: INK,
  },
  sectionActive: { color: ACCENT },
  tile: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(242,233,216,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePlaced: { borderColor: 'rgba(232,145,58,0.45)', backgroundColor: 'rgba(232,145,58,0.14)' },
  tileSelected: { borderColor: ACCENT },
  tileDot: { position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  tileLock: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tools: { position: 'absolute', left: 10, gap: 8 },
  tool: { width: 68, height: 48, borderRadius: 12, backgroundColor: CONTROL, alignItems: 'center', justifyContent: 'center', ...shadow },
  toolOn: { backgroundColor: 'rgba(232,145,58,0.2)' },
  toggle: { flexDirection: 'row', gap: 3, paddingHorizontal: 4 },
  toggleText: { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 6, overflow: 'hidden', fontFamily: FONTS.bodyBold, fontSize: 10, color: INK },
  toggleActive: { backgroundColor: ACCENT, color: BG },
  toggleDivider: { width: 1.5, height: 22, backgroundColor: INK },

  readout: { position: 'absolute', left: 92, right: 92, alignItems: 'center' },
  readoutText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: INK,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  readoutDone: { color: ACCENT },

  panel: { position: 'absolute', left: 88, right: 88, alignItems: 'center' },
  panelNote: { fontFamily: FONTS.body, fontSize: 12, textAlign: 'center', color: SOFT },
  panelActions: { marginTop: 8, flexDirection: 'row', gap: 8 },
  panelButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242,233,216,0.25)',
    backgroundColor: 'rgba(20,17,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelButtonText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: INK },
  panelStore: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  panelStoreText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: BG },

  undo: { position: 'absolute', right: 14, width: 68, height: 68, borderRadius: 12, backgroundColor: CONTROL, alignItems: 'center', justifyContent: 'center', ...shadow },
  undoEmpty: { opacity: 0.45 },

  error: {
    position: 'absolute',
    left: 92,
    right: 14,
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,17,42,0.92)',
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: '#F2B8A8',
  },

  menu: { position: 'absolute', left: 14, width: 220, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 16, backgroundColor: PANEL, ...shadow },
  menuRow: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: INK },
  menuHint: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: SOFT },
});
