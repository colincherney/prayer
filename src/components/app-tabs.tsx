import { Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { useTheme } from '@/components/saint/theme';

function channels(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ];
}

// Builds an rgba string from one of the theme's 6-digit hex tokens. Used for the
// bar's separator and ripple, which need the ink color at partial strength.
function inkAlpha(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Blends `amount` of the theme's ink into its background. The palettes' own
// step-tokens (`bgSoft`, `surface`) sit inconsistent distances from `bg` — on
// some themes they barely move, on others they move the wrong way — so the bar
// derives its own tint instead. Because it is pulled toward ink, it always
// darkens a light palette and lightens a dark one.
function shiftFromBackground(bg: string, ink: string, amount: number): string {
  const from = channels(bg);
  const to = channels(ink);
  const hex = from
    .map((v, i) => Math.round(v + (to[i] - v) * amount).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

export default function AppTabs() {
  // Follow the Saint theme (and the active prayer room) rather than the system
  // light/dark scheme — the screens behind the bar are painted from this same
  // palette, so anything else leaves the bar a color the app never uses.
  const { theme: THEME } = useTheme();

  return (
    <NativeTabs
      // A deliberate tonal step away from the page's `bg`, so the bar reads as
      // its own surface rather than an extension of the screen behind it.
      backgroundColor={shiftFromBackground(THEME.bg, THEME.ink, 0.12)}
      // Without this, iOS swaps in a scroll-edge appearance that forces the
      // background to null and the separator to transparent — the bar dissolves
      // into the page whenever content sits at the top. Keeping it opaque is
      // what actually stops the blending.
      disableTransparentOnScrollEdge
      // Hairline along the bar's top edge, so it stays defined even where the
      // page color happens to sit close to `bgSoft`.
      shadowColor={inkAlpha(THEME.ink, 0.22)}
      tintColor={THEME.accent}
      indicatorColor={THEME.accentSoft}
      rippleColor={inkAlpha(THEME.ink, 0.12)}
      iconColor={{ default: THEME.muted, selected: THEME.ink }}
      labelStyle={{
        default: { color: THEME.muted },
        selected: { color: THEME.ink },
      }}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Pray">
        <Label>Pray</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="me">
        <Label>Me</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
