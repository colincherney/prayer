import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { AuthChapelCanvas } from './AuthChapelCanvas';
import { CHAPEL_CAMERA_ASPECT, DEFAULT_CHAPEL_ORBIT, dragChapelOrbit } from './authChapelOrbit';
import { FONTS } from './theme';

// Both transparent stills come from the default orbit and the first frame of the scene.
const CHAPEL_POSTER = Platform.OS === 'web'
  ? require('../../../assets/images/auth-chapel-render-web.webp')
  : require('../../../assets/images/auth-chapel-render.webp');
const CHAPEL_POSTER_ASPECT = 1440 / 600;

export function AuthChapel({ height }: { height: number }) {
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  const reducedMotion = useReducedMotion();
  const focused = useIsFocused();
  const orbit = useSharedValue(DEFAULT_CHAPEL_ORBIT);
  const dragStart = useSharedValue(DEFAULT_CHAPEL_ORBIT);
  const active = focused && foreground;
  const interactive = ready && active && !reducedMotion;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  const pan = Gesture.Pan().enabled(interactive && width > 0).maxPointers(1).minDistance(4)
    .onStart(() => {
      dragStart.set(orbit.get());
    })
    .onUpdate(event => {
      orbit.set(dragChapelOrbit(dragStart.get(), event.translationX, event.translationY, width, height));
    });
  const posterHeight = Math.min(height, width / CHAPEL_CAMERA_ASPECT);
  const posterWidth = posterHeight * CHAPEL_POSTER_ASPECT;

  return (
    <View
      testID="auth-chapel"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={[styles.stage, { height }]}>
      <View pointerEvents="none" style={styles.center}>
        <View style={[styles.halo, { width: height * 0.67, height: height * 0.67 }]} />
        <AuthChapelCanvas active={active} reducedMotion={reducedMotion} width={width} height={height} orbit={orbit} ready={ready} onReady={setReady} />
        <Image
          testID="auth-chapel-poster"
          source={CHAPEL_POSTER}
          contentFit="contain"
          priority="high"
          accessible={false}
          style={[
            styles.poster,
            {
              width: posterWidth,
              height: posterHeight,
              left: (width - posterWidth) / 2,
              top: (height - posterHeight) / 2,
              opacity: ready ? 0 : 1,
            },
          ]}
        />
        <Text style={[styles.hint, { opacity: interactive ? 1 : 0 }]}>Drag to look around</Text>
      </View>
      <GestureDetector gesture={pan} touchAction="none">
        <View collapsable={false} style={StyleSheet.absoluteFill} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: '100%', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#D1B08818',
    backgroundColor: '#7291CB0C',
    boxShadow: '0 0 85px 25px #596EAD17, inset 0 0 72px #596EAD17',
  },
  poster: { position: 'absolute' },
  hint: { position: 'absolute', bottom: 4, color: '#BABFCC', fontFamily: FONTS.body, fontSize: 11, letterSpacing: 0.7 },
});
