// @refresh reset
// 3D log-cabin prayer room — experimental test screen (branch: 3d-test).
import type { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '@/components/saint/SafeArea';

import { CABIN_VIEWS, type CabinView, type CabinViewName } from '@/components/saint/cabinWorld';
import { FONTS } from '@/components/saint/theme';

type World = ReturnType<typeof import('@/components/saint/cabinWorld').createCabinWorld>;

const SPOTS: { id: CabinViewName; label: string }[] = [
  { id: 'door', label: 'Doorway' },
  { id: 'kneeler', label: 'Kneel' },
  { id: 'chair', label: 'Armchair' },
  { id: 'shelf', label: 'Books' },
];

const PITCH_LIMIT = 0.75;

export default function Cabin3DScreen() {
  const [Native, setNative] = useState<typeof GLView | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [spot, setSpot] = useState<CabinViewName>('door');

  // Camera state lives in refs so the render loop reads it without re-rendering React.
  const current = useRef<CabinView>({ ...CABIN_VIEWS.door });
  const target = useRef<CabinView>({ ...CABIN_VIEWS.door });
  const look = useRef({ yaw: 0, pitch: 0 });
  const drag = useRef({ yaw: 0, pitch: 0 });
  const worldRef = useRef<World | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    import('expo-gl')
      .then(({ GLView }) => alive && setNative(() => GLView))
      .catch(e => alive && setFailed(String(e)));
    return () => {
      alive = false;
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        drag.current = { ...look.current };
      },
      onPanResponderMove: (_, g) => {
        look.current.yaw = drag.current.yaw + g.dx * 0.006;
        look.current.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, drag.current.pitch + g.dy * 0.004));
      },
    }),
  ).current;

  const goTo = (id: CabinViewName) => {
    setSpot(id);
    target.current = { ...CABIN_VIEWS[id] };
    look.current = { yaw: 0, pitch: 0 };
  };

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    try {
      if (typeof gl.texImage3D !== 'function') throw new Error('Expo GL did not provide a WebGL 2 context.');
      const { createCabinWorld } = await import('@/components/saint/cabinWorld');
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const canvas = {
        width: w,
        height: h,
        style: {},
        // Same trick as the auth chapel: hand Three the validated WebGL 2 context via the canvas.
        getContext: (type: string) => (type === 'webgl2' ? gl : null),
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as HTMLCanvasElement;
      const world = createCabinWorld({ canvas });
      worldRef.current = world;
      world.resize(w, h, 1);

      let last = 0;
      let seconds = 0;
      let shown = false;
      const tick = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
        last = now;
        seconds += dt;
        const c = current.current;
        const t = target.current;
        const k = 1 - Math.exp(-dt * 3.2);
        c.x += (t.x - c.x) * k;
        c.y += (t.y - c.y) * k;
        c.z += (t.z - c.z) * k;
        const yawGoal = t.yaw + look.current.yaw;
        let dy = yawGoal - c.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        c.yaw += dy * Math.min(1, k * 2.2);
        c.pitch += (t.pitch + look.current.pitch - c.pitch) * Math.min(1, k * 2.2);
        try {
          world.render(c, seconds);
          gl.endFrameEXP();
        } catch (e) {
          setFailed(String(e));
          return;
        }
        if (!shown) {
          shown = true;
          setReady(true);
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      if (__DEV__) console.warn('Cabin 3D failed to start', e);
      setFailed(String(e));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {Native && !failed && (
        <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
          <Native style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} msaaSamples={4} />
        </View>
      )}
      {!ready && !failed && <Text style={styles.loading}>Lighting the fire…</Text>}
      {failed && (
        <Text style={styles.loading}>
          {Platform.OS === 'web' ? 'Open this on your phone — the 3D test uses Expo GL.' : `3D unavailable: ${failed}`}
        </Text>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="box-none">
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>The Cabin</Text>
            <Text style={styles.sub}>3D test · drag to look around</Text>
          </View>
        </View>
        <View style={styles.spots} pointerEvents="box-none">
          {SPOTS.map(s => (
            <Pressable key={s.id} onPress={() => goTo(s.id)} style={[styles.pill, spot === s.id && styles.pillOn]}>
              <Text style={[styles.pillText, spot === s.id && styles.pillTextOn]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14182a' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  back: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(20,24,42,0.55)', borderWidth: 1, borderColor: 'rgba(245,203,162,0.25)',
  },
  backText: { color: '#f5e6c8', fontSize: 26, marginTop: -3 },
  title: { color: '#f5e6c8', fontFamily: FONTS.displaySemi, fontSize: 20, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  sub: { color: 'rgba(245,230,200,0.75)', fontFamily: FONTS.body, fontSize: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  spots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 18, paddingHorizontal: 16, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: 'rgba(20,24,42,0.6)', borderWidth: 1, borderColor: 'rgba(245,203,162,0.3)',
  },
  pillOn: { backgroundColor: '#f3c97a', borderColor: '#f3c97a' },
  pillText: { color: '#f5e6c8', fontFamily: FONTS.bodyMed, fontSize: 13 },
  pillTextOn: { color: '#2a1f15' },
  loading: { position: 'absolute', alignSelf: 'center', top: '48%', color: 'rgba(245,230,200,0.8)', fontFamily: FONTS.body, paddingHorizontal: 24, textAlign: 'center' },
});
