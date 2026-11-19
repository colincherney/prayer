import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityLabel,
  containerBackground,
  font,
  foregroundColor,
  frame,
  lineLimit,
  minimumScaleFactor,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Bundled into the extension via initialLayout, so this works before the first
// app launch and doesn't need the app's JavaScript process to be running.
const SharePrayerRequest = (_props: object, environment: WidgetEnvironment) => {
  'widget';

  // Widget functions run in isolation; keep their constants inside the function.
  const dark = environment.colorScheme === 'dark';
  const background = dark ? '#0F1A33' : '#F5EFE6';
  const ink = dark ? '#EAEFFA' : '#1F2A44';
  const accent = dark ? '#D4A574' : '#C8643C';

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
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 9, weight: 'semibold' }), foregroundColor(accent), lineLimit(1)]}>
          SAINT CENTRAL
        </Text>
        <Spacer minLength={0} />
        <Image systemName="square.and.pencil" size={18} color={accent} />
      </HStack>
      <Spacer minLength={0} />
      <Text
        modifiers={[
          font({ size: 19, weight: 'semibold' }),
          foregroundColor(ink),
          lineLimit(3),
          minimumScaleFactor(0.8),
        ]}>
        {'Share a\nprayer request'}
      </Text>
      <Spacer minLength={0} />
      <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundColor(accent), lineLimit(1)]}>
        Tap to share →
      </Text>
    </VStack>
  );
};

export default createWidget('SharePrayerRequest', SharePrayerRequest, {});
