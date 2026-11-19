import { useEffect, useRef, useState } from 'react';

import { useChapelPlayback, type ChapelCanvasProps, type ChapelSurface } from './authChapelPlayback';

export function AuthChapelCanvas(props: ChapelCanvasProps) {
  const { active, onReady, ready } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [surface, setSurface] = useState<ChapelSurface | null>(null);
  const [lost, setLost] = useState(false);
  useChapelPlayback(surface, { ...props, active: active && !lost });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    let dispose: (() => void) | undefined;
    const onLoss = (event: Event) => {
      event.preventDefault();
      onReady(false);
      setLost(true);
    };
    const onRestore = () => setLost(false);
    canvas.addEventListener('webglcontextlost', onLoss);
    canvas.addEventListener('webglcontextrestored', onRestore);
    import('./authChapelWorld').then(({ createAuthChapelWorld }) => {
      if (!alive || !canvas.getContext('webgl2', { alpha: true, antialias: true })) return;
      const world = createAuthChapelWorld({ canvas });
      dispose = world.dispose;
      setSurface({
        world,
        size: () => [canvas.clientWidth, canvas.clientHeight, Math.min(window.devicePixelRatio || 1, 1.75)],
      });
    }).catch(() => {
      if (alive) onReady(false);
    });
    return () => {
      alive = false;
      dispose?.();
      canvas.removeEventListener('webglcontextlost', onLoss);
      canvas.removeEventListener('webglcontextrestored', onRestore);
    };
  }, [onReady]);

  return <canvas
    ref={canvasRef}
    aria-hidden="true"
    data-testid="auth-chapel-canvas"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: ready ? 1 : 0, pointerEvents: 'none' }}
  />;
}
