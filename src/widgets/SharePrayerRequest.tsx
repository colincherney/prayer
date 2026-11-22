import { Circle, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityLabel,
  containerBackground,
  font,
  foregroundColor,
  frame,
  lineLimit,
  minimumScaleFactor,
  strokeBorder,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetAppearanceProps } from '@/lib/prayerWidgetAppearance';

// Bundled into the extension via initialLayout, so this works before the first
// app launch and doesn't need the app's JavaScript process to be running.
const SharePrayerRequest = (props: PrayerWidgetAppearanceProps, environment: WidgetEnvironment) => {
  'widget';

  const dark = environment.colorScheme === 'dark';
  const background = props.appearance?.background ?? (dark ? '#1C2D52' : '#FBF7EF');
  const ink = props.appearance?.ink ?? (dark ? '#EAEFFA' : '#1F2A44');
  const accent = props.appearance?.accent ?? (dark ? '#D4A574' : '#A4582C');
  const badge = props.appearance?.badge ?? (dark ? '#172645' : '#EFE5D2');
  const line = props.appearance?.line ?? (dark ? 'rgba(234,239,250,0.12)' : 'rgba(31,42,68,0.10)');
  const design = props.appearance?.design ?? 'default';

  return (
    <VStack
      alignment="leading"
      spacing={6}
      modifiers={[
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
        containerBackground(background, 'widget'),
        widgetURL('prayer:///prayerRequest'),
        accessibilityElement('ignore'),
        accessibilityLabel('Share a prayer request. Opens Saint Central.'),
      ]}>
      <ZStack modifiers={[frame({ width: 32, height: 32 })]}>
        <Circle modifiers={[foregroundColor(badge), strokeBorder({ shape: 'circle', content: line })]} />
        <Image systemName="square.and.pencil" size={15} color={accent} />
      </ZStack>
      <Spacer minLength={0} />
      <Text
        modifiers={[
          font({ size: 19, weight: 'semibold', design }),
          foregroundColor(ink),
          lineLimit(3),
          minimumScaleFactor(0.8),
        ]}>
        Share your prayer
      </Text>
      <Spacer minLength={0} />
      <Text modifiers={[font({ size: 11, weight: 'semibold', design }), foregroundColor(accent), lineLimit(1), minimumScaleFactor(0.8)]}>
        Write a request →
      </Text>
    </VStack>
  );
};

export default createWidget('SharePrayerRequest', SharePrayerRequest, {});
