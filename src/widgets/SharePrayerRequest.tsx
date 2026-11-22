import { Capsule, Circle, HStack, Image, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  offset,
  rotationEffect,
  shadow,
  strokeBorder,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetAppearanceProps } from '@/lib/prayerWidgetAppearance';

// Bundled into the extension via initialLayout, so this works before the first
// app launch and doesn't need the app's JavaScript process to be running.
const SharePrayerRequest = (props: PrayerWidgetAppearanceProps, environment: WidgetEnvironment) => {
  'widget';

  const appearance = props.appearance;
  const dark = appearance?.isDark ?? environment.colorScheme === 'dark';
  const tinted = environment.widgetRenderingMode === 'accented';
  const background = appearance?.background ?? (dark ? '#1C2D52' : '#FBF7EF');
  const backgroundSoft = appearance?.backgroundSoft ?? appearance?.badge ?? (dark ? '#172645' : '#EFE5D2');
  const ink = appearance?.ink ?? (dark ? '#EAEFFA' : '#1F2A44');
  const accent = appearance?.accent ?? (dark ? '#D4A574' : '#A4582C');
  const glow = appearance?.accentSoft ?? (dark ? '#9F7B54' : '#E5B697');
  const design = appearance?.design ?? 'serif';
  const primary = tinted ? foregroundStyle({ type: 'hierarchical', style: 'primary' }) : foregroundStyle(ink);
  const highlight = tinted ? primary : foregroundStyle(accent);

  const note = (
    <ZStack modifiers={[frame({ width: 66, height: 44 }), accessibilityHidden()]}>
      <Circle modifiers={[
        foregroundStyle({ type: 'radialGradient', colors: [glow, 'transparent'], center: { x: 0.5, y: 0.5 }, startRadius: 0, endRadius: 23 }),
        frame({ width: 46, height: 46 }),
      ]} />
      <ZStack modifiers={[frame({ width: 42, height: 29 }), rotationEffect(-10)]}>
        <RoundedRectangle cornerRadius={5} modifiers={[
          foregroundStyle('#FFF3DC'),
          strokeBorder({ shape: 'roundedRectangle', cornerRadius: 5, content: '#D9B995', style: { lineWidth: 0.75 } }),
          shadow({ color: '#55332333', radius: 3, y: 2 }),
        ]} />
        <Capsule modifiers={[foregroundStyle('#D9B995'), frame({ width: 23, height: 1 }), rotationEffect(32), offset({ x: -10, y: -2 })]} />
        <Capsule modifiers={[foregroundStyle('#D9B995'), frame({ width: 23, height: 1 }), rotationEffect(-32), offset({ x: 10, y: -2 })]} />
        <ZStack modifiers={[frame({ width: 13, height: 13 }), offset({ y: 4 })]}>
          <Circle modifiers={[
            foregroundStyle('#A95242'), strokeBorder({ shape: 'circle', content: '#CF7B63', style: { lineWidth: 1 } }),
          ]} />
          <Image systemName="heart.fill" size={6} color="#FFF3DC" />
        </ZStack>
      </ZStack>
      <Image systemName="sparkle" size={11} color={accent} modifiers={[offset({ x: 25, y: -15 })]} />
      <Image systemName="sparkle" size={6} color={accent} modifiers={[offset({ x: -26, y: 12 })]} />
    </ZStack>
  );

  return (
    <VStack
      alignment="leading"
      spacing={2}
      modifiers={[
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
        containerBackground(tinted ? background : {
          type: 'linearGradient', colors: [background, backgroundSoft], startPoint: { x: 0, y: 1 }, endPoint: { x: 1, y: 0 },
        }, 'widget'),
        widgetURL('prayer:///prayerRequest'),
        accessibilityElement('ignore'),
        accessibilityLabel('Share a prayer request. Opens Saint Central.'),
      ]}>
      {tinted ? (
        <Image systemName="envelope.fill" size={25} modifiers={[frame({ width: 46, height: 44 }), accessibilityHidden()]} />
      ) : note}
      <Spacer minLength={0} />
      <VStack alignment="leading" spacing={5}>
        <Text modifiers={[font({ size: 20, weight: 'semibold', design }), primary, lineLimit(2), minimumScaleFactor(0.8)]}>
          Share a prayer request
        </Text>
        <HStack spacing={4}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), highlight, lineLimit(1), minimumScaleFactor(0.8)]}>
            Write a request
          </Text>
          <Image systemName="arrow.up.right" size={8} modifiers={[highlight, accessibilityHidden()]} />
        </HStack>
      </VStack>
    </VStack>
  );
};

export default createWidget('SharePrayerRequest', SharePrayerRequest, {});
