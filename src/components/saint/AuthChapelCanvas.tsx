// @refresh reset
import type { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useLayoutEffect, useRef, useState } from 'react';
import { PixelRatio, StyleSheet } from 'react-native';

import { useChapelPlayback, type ChapelCanvasProps, type ChapelSurface } from './authChapelPlayback';

export function AuthChapelCanvas(props: ChapelCanvasProps) {
  if (!props.active || props.width <= 0 || props.height <= 0) return null;

  // Expo GL's native view emits its surface-created callback once per view.
  return <NativeChapelSurface key={`${props.width}:${props.height}`} {...props} />;
}

function NativeChapelSurface(props: ChapelCanvasProps) {
  const { height, width, onReady } = props;
  const [NativeCanvas, setNativeCanvas] = useState<typeof GLView | null>(null);
  const [surface, setSurface] = useState<ChapelSurface | null>(null);
  const lifecycle = useRef<{ generation: number; surface: ChapelSurface | null }>({ generation: 0, surface: null });
  useChapelPlayback(surface, props);

  useLayoutEffect(() => {
    let alive = true;
    const context = lifecycle.current;
    import('expo-gl').then(({ GLView }) => {
      if (alive) setNativeCanvas(() => GLView);
    }).catch(error => {
      if (!alive) return;
      if (__DEV__) console.warn('The chapel could not load Expo GL.', error);
      onReady(false);
    });
    return () => {
      alive = false;
      context.generation++;
      context.surface?.world.dispose();
      context.surface = null;
      onReady(false);
    };
  }, [onReady]);

  const create = async (gl: ExpoWebGLRenderingContext) => {
    const context = lifecycle.current;
    const version = ++context.generation;
    try {
      if (typeof gl.texImage3D !== 'function') throw new Error('Expo GL did not provide a WebGL 2 context.');
      const { createAuthChapelWorld } = await import('./authChapelWorld');
      if (version !== context.generation) return;
      // Expo GL reports the viewport at context creation. Some native views start with a zero viewport.
      const drawableWidth = gl.drawingBufferWidth || PixelRatio.getPixelSizeForLayoutSize(width);
      const drawableHeight = gl.drawingBufferHeight || PixelRatio.getPixelSizeForLayoutSize(height);
      // Three.js uses the canvas for dimensions and browser context events. Expo owns the native surface.
      const canvas = {
        width: drawableWidth,
        height: drawableHeight,
        // Some Expo Go builds gave WebGL 2 contexts the WebGL 1 prototype. Three checks that prototype
        // for an injected context, so expose the already-validated context through the canvas instead.
        getContext: (type: string) => type === 'webgl2' ? gl : null,
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as HTMLCanvasElement;
      const world = createAuthChapelWorld({ canvas }, { portableMaterials: true });
      const next: ChapelSurface = {
        world,
        size: () => [drawableWidth, drawableHeight, 1],
        present: () => gl.endFrameEXP(),
      };
      context.surface?.world.dispose();
      context.surface = next;
      setSurface(next);
    } catch (error) {
      if (version !== context.generation) return;
      if (__DEV__) console.warn('The chapel could not initialize Three.js.', error);
      onReady(false);
    }
  };

  return NativeCanvas ? (
    <NativeCanvas
      onContextCreate={create}
      testID="auth-chapel-native-canvas"
      msaaSamples={2}
      collapsable={false}
      pointerEvents="none"
      style={[styles.canvas, { width, height }]}
    />
  ) : null;
}

const styles = StyleSheet.create({
  canvas: { position: 'absolute', top: 0, left: 0 },
});
