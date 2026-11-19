import { useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { DEFAULT_CHAPEL_ORBIT, type ChapelOrbit } from './authChapelOrbit';
import type { createAuthChapelWorld } from './authChapelWorld';

export type ChapelCanvasProps = {
  active: boolean;
  reducedMotion: boolean;
  width: number;
  height: number;
  orbit: SharedValue<ChapelOrbit>;
  ready: boolean;
  onReady: (ready: boolean) => void;
};

export type ChapelSurface = {
  world: ReturnType<typeof createAuthChapelWorld>;
  size: () => [width: number, height: number, pixelRatio: number];
  present?: () => void;
};

export function useChapelPlayback(surface: ChapelSurface | null, { active, reducedMotion, width, height, orbit, onReady }: ChapelCanvasProps) {
  useEffect(() => {
    if (!surface || !active || width <= 0 || height <= 0) return;
    let frame: number;
    let lastFrame: number | undefined;
    let seconds = 0;
    let visible = false;
    let dimensions = '';

    const draw = (now: number) => {
      const elapsed = lastFrame === undefined ? 0 : now - lastFrame;
      if (elapsed > 29 || lastFrame === undefined) {
        lastFrame = now;
        try {
          const [pixelWidth, pixelHeight, ratio] = surface.size();
          if (pixelWidth > 0 && pixelHeight > 0) {
            const size = `${pixelWidth}:${pixelHeight}:${ratio}`;
            if (dimensions !== size) {
              surface.world.resize(pixelWidth, pixelHeight, ratio);
              dimensions = size;
            }
            if (!reducedMotion) seconds += Math.min(elapsed, 60) / 1000;
            surface.world.render(reducedMotion ? DEFAULT_CHAPEL_ORBIT : orbit.get(), seconds);
            surface.present?.();
            if (!visible) {
              visible = true;
              onReady(true);
            }
          }
        } catch (error) {
          if (__DEV__) console.warn('The 3D chapel is unavailable.', error);
          onReady(false);
          return;
        }
      }
      if (!reducedMotion || !visible) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, height, onReady, orbit, reducedMotion, surface, width]);
}
