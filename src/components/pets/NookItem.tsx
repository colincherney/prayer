import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ITEM_META, Offset } from './nookData';
import { ItemLayer, NOOK_H, NOOK_W } from './NookScene';

const LONG_PRESS_MS = 220;
/** Spare canvas around a piece. Canvases are kept small because an animated piece redraws all of its canvas. */
const CANVAS_MARGIN = 8;

type Props = {
  id: string;
  /** How far the user has dragged this piece from its default spot. */
  offset: Offset;
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
  onMove?: (id: string, offset: Offset) => void;
  /** Rounds where a dragged piece lands to this many nook units. */
  snap?: number;
};

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

/**
 * One piece of decor. Press and hold it for a moment, then drag it anywhere inside the nook.
 * (The hold keeps normal scrolling working when a finger just swipes across the page.)
 */
export function NookItem({ id, offset, scale, editable, art, tapLabel, onTap, onMove, snap = 0 }: Props) {
  const meta = ITEM_META[id];
  const { base, hit } = meta;
  // Keep the grabbable part of the piece inside the nook.
  const minX = -(hit.x + base.x);
  const maxX = NOOK_W - (hit.x + hit.w + base.x);
  const minY = -(hit.y + base.y);
  const maxY = NOOK_H - (hit.y + hit.h + base.y);
  // Saved spots are held to the same limits, but a piece that hangs past the edge by design keeps its default spot.
  const savedX = clamp(offset.x, Math.min(minX, 0), Math.max(maxX, 0));
  const savedY = clamp(offset.y, Math.min(minY, 0), Math.max(maxY, 0));
  const x = useSharedValue(savedX);
  const y = useSharedValue(savedY);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lift = useSharedValue(0);

  // Follow outside changes, such as a reset.
  useEffect(() => {
    x.set(savedX);
    y.set(savedY);
  }, [savedX, savedY, x, y]);

  const layerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (base.x + x.get()) * scale },
      { translateY: (base.y + y.get()) * scale },
      { scale: 1 + 0.05 * lift.get() },
    ],
    transformOrigin: `${(hit.x + hit.w / 2) * scale}px ${(hit.y + hit.h / 2) * scale}px`,
  }));

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onBegin(() => {
      startX.set(x.get());
      startY.set(y.get());
    })
    .onStart(() => {
      lift.set(withTiming(1, { duration: 120 }));
    })
    .onUpdate(e => {
      x.set(clamp(startX.get() + e.translationX / scale, minX, maxX));
      y.set(clamp(startY.get() + e.translationY / scale, minY, maxY));
    })
    .onEnd(() => {
      if (snap > 0) {
        x.set(clamp(Math.round(x.get() / snap) * snap, minX, maxX));
        y.set(clamp(Math.round(y.get() / snap) * snap, minY, maxY));
      }
      if (onMove) scheduleOnRN(onMove, id, { x: x.get(), y: y.get() });
    })
    .onFinalize(() => {
      lift.set(withTiming(0, { duration: 160 }));
    });

  const tap = Gesture.Tap()
    .maxDuration(LONG_PRESS_MS)
    .onEnd((_e, success) => {
      if (success && onTap) scheduleOnRN(onTap);
    });

  const bleed = CANVAS_MARGIN + Math.max(0, -hit.x, -hit.y, hit.x + hit.w - NOOK_W, hit.y + hit.h - NOOK_H);
  const zoneStyle = { position: 'absolute' as const, left: hit.x * scale, top: hit.y * scale, width: hit.w * scale, height: hit.h * scale };

  return (
    <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, top: 0, width: NOOK_W * scale, height: NOOK_H * scale }, layerStyle]}>
      <ItemLayer bleed={bleed}>{art}</ItemLayer>
      {editable ? (
        <GestureDetector gesture={Gesture.Race(pan, tap)}>
          <View accessibilityLabel={`${tapLabel}. Press and hold, then drag to move.`} style={zoneStyle} />
        </GestureDetector>
      ) : onTap ? (
        <Pressable accessibilityLabel={tapLabel} onPress={onTap} style={zoneStyle} />
      ) : null}
    </Animated.View>
  );
}
