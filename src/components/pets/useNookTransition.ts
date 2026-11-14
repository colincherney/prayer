import { useEffect, useRef } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** Native modals only host the scene; Reanimated owns their entrance and dismissal. */
export function useNookTransition(onClose: () => void, slide = false) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const closing = useRef(false);

  useEffect(() => {
    progress.set(withTiming(1, { duration: reducedMotion ? 0 : 300, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);

  const motionStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: slide && !reducedMotion ? (1 - progress.get()) * 28 : 0 }],
  }));

  const dismiss = (afterClose?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    const finish = () => {
      onClose();
      afterClose?.();
    };
    progress.set(withTiming(0, { duration: reducedMotion ? 0 : 200 }, finished => {
      if (finished) scheduleOnRN(finish);
    }));
  };

  return { motionStyle, dismiss };
}
