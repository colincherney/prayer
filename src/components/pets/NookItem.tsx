import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DecorSpotId, ITEM_META, ItemPlacement } from './nookData';
import { hasNookImage, NookImage } from './NookImages';
import { ItemLayer, NOOK_H, NOOK_W } from './NookScene';

const LONG_PRESS_MS = 220;
/** Spare canvas around a piece. Canvases are kept small because an animated piece redraws all of its canvas. */
const CANVAS_MARGIN = 8;

type Props = {
  id: string;
  placement: ItemPlacement;
  targets: ItemPlacement[];
  /** Screen dp per nook unit, so a finger movement can be turned into nook units. */
  scale: number;
  /** Only the Me page's nook can be edited; previews and the full-screen view are look-only. */
  editable: boolean;
  /** The piece's drawing (an `ItemArt`). */
  art: React.ReactNode;
  tapLabel: string;
  /** Tapping a piece (without dragging) can do something: brighten the lantern, shake the plant, set the mobile swinging. */
  onTap?: () => void;
  /** Called once when a drag ends. */
  onMove?: (id: string, spot: DecorSpotId) => void;
};

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

/**
 * Pieces fit their decorating spot. Dragging to the other side snaps them into its matching spot.
 */
export function NookItem({ id, placement, targets, scale, editable, art, tapLabel, onTap, onMove }: Props) {
  const meta = ITEM_META[id];
  const { hit } = meta;
  const reducedMotion = useReducedMotion();
  const fit = placement.scale;
  const frameWidth = hit.w * fit * scale;
  const frameHeight = hit.h * fit * scale;
  const canMove = targets.length > 1;
  const x = useSharedValue(placement.x);
  const y = useSharedValue(placement.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lift = useSharedValue(0);

  // Presets, undo, and swapping another piece into this spot all move the artwork with its touch area.
  useEffect(() => {
    x.set(withTiming(placement.x, { duration: reducedMotion ? 0 : 180 }));
    y.set(withTiming(placement.y, { duration: reducedMotion ? 0 : 180 }));
  }, [placement.x, placement.y, reducedMotion, x, y]);

  const layerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() * scale },
      { translateY: y.get() * scale },
      { scale: 1 + 0.05 * lift.get() },
    ],
    transformOrigin: '50% 100%',
  }));

  const pan = Gesture.Pan()
    .enabled(editable && canMove)
    .activateAfterLongPress(LONG_PRESS_MS)
    .onBegin(() => {
      startX.set(x.get());
      startY.set(y.get());
    })
    .onStart(() => {
      lift.set(withTiming(1, { duration: 120 }));
    })
    .onUpdate(e => {
      x.set(clamp(startX.get() + e.translationX / scale, 0, NOOK_W - hit.w * fit));
      y.set(clamp(startY.get() + e.translationY / scale, 0, NOOK_H - hit.h * fit));
    })
    .onEnd(() => {
      let destination = targets[0];
      let distance = Number.POSITIVE_INFINITY;
      for (const target of targets) {
        const nextDistance = (x.get() - target.x) ** 2 + (y.get() - target.y) ** 2;
        if (nextDistance < distance) {
          distance = nextDistance;
          destination = target;
        }
      }
      x.set(withTiming(destination.x, { duration: reducedMotion ? 0 : 180 }));
      y.set(withTiming(destination.y, { duration: reducedMotion ? 0 : 180 }));
      if (onMove && destination.spot !== placement.spot) scheduleOnRN(onMove, id, destination.spot);
    })
    .onFinalize((_event, success) => {
      lift.set(withTiming(0, { duration: 160 }));
      if (!success) {
        x.set(withTiming(placement.x, { duration: reducedMotion ? 0 : 180 }));
        y.set(withTiming(placement.y, { duration: reducedMotion ? 0 : 180 }));
      }
    });

  const tap = Gesture.Tap()
    .maxDuration(LONG_PRESS_MS)
    .onEnd((_e, success) => {
      if (success && onTap) scheduleOnRN(onTap);
    });

  const bleed = CANVAS_MARGIN + Math.max(0, -hit.x, -hit.y, hit.x + hit.w - NOOK_W, hit.y + hit.h - NOOK_H);
  const grounded = ['left', 'right', 'accentLeft', 'accentRight'].includes(placement.spot);

  return (
    <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, top: 0, width: frameWidth, height: frameHeight }, layerStyle]}>
      {grounded ? <View pointerEvents="none" style={{ position: 'absolute', left: frameWidth * 0.1, bottom: -2 * scale, width: frameWidth * 0.8, height: 5 * scale, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.2)' }} /> : null}
      {hasNookImage(id) ? <NookImage id={id} style={{ width: frameWidth, height: frameHeight }} /> : (
        <View pointerEvents="none" style={{ position: 'absolute', left: -hit.x * scale * fit, top: -hit.y * scale * fit, width: NOOK_W * scale, height: NOOK_H * scale, transform: [{ scale: fit }], transformOrigin: '0px 0px', opacity: placement.spot === 'atmosphere' ? 0.25 : 1 }}>
          <ItemLayer bleed={bleed}>{art}</ItemLayer>
        </View>
      )}
      {editable ? (
        <GestureDetector gesture={Gesture.Race(pan, tap)}>
          <View accessibilityRole="button" accessibilityLabel={`${tapLabel}.${canMove ? ' Hold and drag to switch sides.' : ' Tap to select.'}`} style={StyleSheet.absoluteFill} />
        </GestureDetector>
      ) : onTap ? (
        <Pressable accessibilityLabel={tapLabel} onPress={onTap} style={StyleSheet.absoluteFill} />
      ) : null}
    </Animated.View>
  );
}
