import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { BelovedForm, setBelovedForm, useBelovedForm } from '@/lib/belovedForm';

import { BELOVED_SKIN, heartPath, SkinContext, StageImage, WF, useWinterFonts } from './winterUi';

// The Beloved's two looks, side by side: the marble statue and the Seraph, her neon spirit form. Tap one to wear it
// everywhere (home, Prayer Pals, the event). Before she's earned, the Seraph shows locked with what it takes.

const P = BELOVED_SKIN.palette;

/** The neon city behind the Seraph tile: a night gradient, pink and cyan scanlines and a rain of glitch pixels. */
const NeonBack = React.memo(function NeonBack() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="bfNeon" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0E0726" />
          <Stop offset="0.7" stopColor="#24104A" />
          <Stop offset="1" stopColor="#3A1460" />
        </LinearGradient>
      </Defs>
      <Rect width={100} height={120} fill="url(#bfNeon)" />
      <Path d="M8 120 L8 70 L22 70 L22 120 M76 120 L76 58 L92 58 L92 120" stroke="#5FF4FF" strokeWidth={0.8} fill="none" opacity={0.55} />
      <Path d="M30 120 L30 84 L44 84 L44 120 M58 120 L58 76 L68 76 L68 120" stroke="#FF4FA8" strokeWidth={0.8} fill="none" opacity={0.55} />
      <Rect y={108} width={100} height={0.8} fill="#FF4FA8" opacity={0.8} />
      {[[12, 20], [84, 14], [70, 40], [20, 50], [50, 10], [90, 92]].map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width={2} height={2} fill={i % 2 ? '#5FF4FF' : '#FF4FA8'} opacity={0.8} />
      ))}
    </Svg>
  );
});

const RoseBack = React.memo(function RoseBack() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="bfRose" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6D3DB" />
          <Stop offset="1" stopColor="#FFF5F2" />
        </LinearGradient>
      </Defs>
      <Rect width={100} height={120} fill="url(#bfRose)" />
      <Path d={heartPath(16, 18, 4)} fill="#E8879B" opacity={0.6} />
      <Path d={heartPath(86, 30, 3)} fill="#FFFFFF" opacity={0.9} />
    </Svg>
  );
});

export function BelovedFormSwitch({ unlocked, lockedText, style }: {
  /** The Beloved reached (all the challenges done): both looks can be picked. */
  unlocked: boolean;
  /** Under the locked Seraph: what it takes. */
  lockedText?: string;
  style?: object;
}) {
  const fontsLoaded = useWinterFonts();
  const form = useBelovedForm();
  if (!fontsLoaded) return null;
  const tile = (key: BelovedForm, name: string, sub: string) => {
    const on = unlocked && form === key;
    const locked = !unlocked && key === 'spirit';
    const spirit = key === 'spirit';
    return (
      <Pressable
        key={key}
        disabled={!unlocked}
        onPress={() => setBelovedForm(key)}
        accessibilityRole="button"
        accessibilityState={{ selected: on, disabled: !unlocked }}
        accessibilityLabel={locked ? `${name}, locked. ${lockedText ?? ''}` : `${name}${on ? ', wearing now' : ''}`}
        style={({ pressed }) => [s.tile, on && (spirit ? s.tileOnSpirit : s.tileOn), pressed && { opacity: 0.9 }]}>
        <View style={s.art}>
          {spirit ? <NeonBack /> : <RoseBack />}
          <View style={s.figure} pointerEvents="none">
            <StageImage stage={3} height={96} form={key} dim={!unlocked} />
          </View>
          {on ? (
            <View style={[s.badge, spirit && { backgroundColor: '#FF4FA8' }]}>
              <Text style={s.badgeText}>✓</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.name, spirit && on && { color: '#C2337F' }]}>{name}</Text>
        <Text numberOfLines={2} style={s.sub}>{locked ? lockedText ?? 'Locked' : on ? 'Wearing now' : sub}</Text>
      </Pressable>
    );
  };
  return (
    <SkinContext.Provider value={BELOVED_SKIN}>
      <View style={[s.wrap, style]}>
        <Text style={s.label}>{unlocked ? 'HER TWO FORMS · TAP TO SWITCH' : 'HER TWO FORMS'}</Text>
        <View style={s.row}>
          {tile('marble', 'Marble', 'The statue come to life')}
          {tile('spirit', 'Seraph', 'Her neon spirit form')}
        </View>
      </View>
    </SkinContext.Provider>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 14, padding: 12, borderRadius: 18, backgroundColor: P.card },
  label: { fontFamily: WF.semi, fontSize: 11, letterSpacing: 2, color: P.ice, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 16, padding: 6, paddingBottom: 10, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#FFFFFF' },
  tileOn: { borderColor: P.gold },
  tileOnSpirit: { borderColor: '#FF4FA8', shadowColor: '#5FF4FF', shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  art: { height: 120, borderRadius: 12, overflow: 'hidden' },
  figure: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end' },
  badge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: P.gold, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontFamily: WF.bold, fontSize: 11 },
  name: { fontFamily: WF.bold, fontSize: 15, color: P.cream, marginTop: 8, textAlign: 'center' },
  sub: { fontFamily: WF.regular, fontSize: 11.5, lineHeight: 15, color: P.muted, textAlign: 'center', marginTop: 2 },
});
