import { Capsule, Ellipse, HStack, Mask, Rectangle, Spacer, Text, UnevenRoundedRectangle, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden, containerBackground, font, foregroundColor, frame, lineLimit,
  minimumScaleFactor, offset, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

const QuietPrayerWidget = (_props: object, environment: WidgetEnvironment) => {
  'widget';

  const dark = environment.colorScheme === 'dark';
  const medium = environment.widgetFamily === 'systemMedium';
  const background = dark ? '#242641' : '#F5EFE6';
  const ink = dark ? '#F9EAD9' : '#2B263D';
  const accent = dark ? '#F0BDA4' : '#845245';
  const wood = '#63463F';
  const scale = medium ? 1 : 0.24;
  const shape = (width: number, height: number, x: number, y: number, color: string) => [
    foregroundColor(color), frame({ width: width * scale, height: height * scale }),
    offset({ x: x * scale, y: y * scale }),
  ];

  // The layered sunrise and woodwork echo the Window Seat prayer room.
  const window = (
    <ZStack modifiers={[frame({ width: 94 * scale, height: 110 * scale }), accessibilityHidden()]}>
      <UnevenRoundedRectangle topLeadingRadius={39 * scale} topTrailingRadius={39 * scale}
        bottomLeadingRadius={3 * scale} bottomTrailingRadius={3 * scale} modifiers={shape(78, 100, 0, 0, wood)} />
      <Mask>
        <ZStack modifiers={[frame({ width: 68 * scale, height: 90 * scale })]}>
          <Rectangle modifiers={shape(68, 90, 0, 0, '#F3CDB6')} />
          <Ellipse modifiers={shape(54, 54, 9, 14, '#F7D49A')} />
          <Ellipse modifiers={shape(24, 24, 10, 7, '#FFF1C8')} />
          <Ellipse modifiers={shape(100, 37, -12, 48, '#BC856F')} />
          <Ellipse modifiers={shape(100, 33, 22, 52, '#8D5D54')} />
          <Rectangle modifiers={shape(3, 90, 0, 0, wood)} />
          <Rectangle modifiers={shape(68, 3, 0, 8, wood)} />
        </ZStack>
        <Mask.Content>
          <UnevenRoundedRectangle topLeadingRadius={34 * scale} topTrailingRadius={34 * scale}
            modifiers={[frame({ width: 68 * scale, height: 90 * scale })]} />
        </Mask.Content>
      </Mask>
      <Capsule modifiers={shape(91, 6, 0, 49, '#8E6253')} />
    </ZStack>
  );

  const prayer = (
    <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' })]}>
      <HStack spacing={4}>
        <Text modifiers={[font({ size: medium ? 13 : 11, weight: 'semibold' }), foregroundColor(accent), lineLimit(1)]}>Quiet prayer</Text>
        {!medium ? <Spacer minLength={0} /> : null}
        {!medium ? window : null}
      </HStack>
      <Spacer minLength={0} />
      <Text modifiers={[font({ design: 'serif', size: medium ? 22 : 16 }), foregroundColor(ink), lineLimit(3), minimumScaleFactor(0.74)]}>
        Lord, quiet my heart. Guide me. Amen.
      </Text>
      <Spacer minLength={0} />
      <Text modifiers={[font({ size: medium ? 12 : 10, weight: 'semibold' }), foregroundColor(accent), lineLimit(1), minimumScaleFactor(0.8)]}>Open prayer journal →</Text>
    </VStack>
  );

  return (
    <HStack spacing={12} modifiers={[
      containerBackground(background, 'widget'), widgetURL('prayer:///biography'),
      frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
    ]}>
      {prayer}
      {medium ? window : null}
    </HStack>
  );
};

export default createWidget('QuietPrayerWidget', QuietPrayerWidget, {});
