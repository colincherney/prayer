import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ITEM_META, Offset } from './nookData';
import { ItemLayer, NOOK_H, NOOK_W } from './NookScene';

const LONG_PRESS_MS = 220;

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
};

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

/**
 * One piece of decor. Press and hold it for a moment, then drag it anywhere inside the nook.
 * (The hold keeps normal scrolling working when a finger just swipes across the page.)
 */
export function NookItem({ id, offset, scale, editable, art, tapLabel, onTap, onMove }: Props) {
  const meta = ITEM_META[id];
  const x = useSharedValue(offset.x);
  const y = useSharedValue(offset.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lift = useSharedValue(0);

  // Follow outside changes, such as a reset.
  useEffect(() => {
    x.set(offset.x);
    y.set(offset.y);
  }, [offset.x, offset.y, x, y]);

  const { base, hit } = meta;
  // Keep the grabbable part of the piece inside the nook.
  const minX = -(hit.x + base.x);
  const maxX = NOOK_W - (hit.x + hit.w + base.x);
  const minY = -(hit.y + base.y);
  const maxY = NOOK_H - (hit.y + hit.h + base.y);

  const layerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: base.x + x.value },
      { translateY: base.y + y.value },
      { scale: 1 + 0.05 * lift.value },
    ],
    transformOrigin: `${hit.x + hit.w / 2}px ${hit.y + hit.h / 2}px`,
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
      if (onMove) runOnJS(onMove)(id, { x: x.get(), y: y.get() });
    })
    .onFinalize(() => {
      lift.set(withTiming(0, { duration: 160 }));
    });

  const tap = Gesture.Tap()
    .maxDuration(LONG_PRESS_MS)
    .onEnd((_e, success) => {
      if (success && onTap) runOnJS(onTap)();
    });

  const zoneStyle = { position: 'absolute' as const, left: hit.x, top: hit.y, width: hit.w, height: hit.h };

  return (
    <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, top: 0, width: NOOK_W, height: NOOK_H }, layerStyle]}>
      <ItemLayer>{art}</ItemLayer>
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
