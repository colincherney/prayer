import { Capsule, Ellipse, HStack, Mask, Rectangle, Spacer, Text, UnevenRoundedRectangle, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden, containerBackground, font, foregroundColor, frame, kerning, lineLimit,
  minimumScaleFactor, offset, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetAppearanceProps } from '@/lib/prayerWidgetAppearance';

const QuietPrayerWidget = (props: PrayerWidgetAppearanceProps, environment: WidgetEnvironment) => {
  'widget';

  const dark = environment.colorScheme === 'dark';
  const medium = environment.widgetFamily === 'systemMedium';
  const background = props.appearance?.background ?? (dark ? '#1C2D52' : '#FBF7EF');
  const ink = props.appearance?.ink ?? (dark ? '#EAEFFA' : '#1F2A44');
  const accent = props.appearance?.accent ?? (dark ? '#D4A574' : '#A4582C');
  const design = props.appearance?.design ?? 'default';
  const wood = '#63463F';
  const scale = medium ? 0.9 : 0.28;
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
      <Capsule modifiers={shape(91, 6, 0, 49, accent)} />
    </ZStack>
  );

  const prayer = (
    <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' })]}>
      <HStack spacing={4}>
        <Text modifiers={[
          font({ size: medium ? 12 : 10, weight: 'semibold', design }), foregroundColor(accent),
          kerning(0.8), lineLimit(1), minimumScaleFactor(0.8),
        ]}>
          QUIET PRAYER
        </Text>
        {!medium ? <Spacer minLength={0} /> : null}
        {!medium ? window : null}
      </HStack>
      <Spacer minLength={0} />
      <Text modifiers={[font({ design, size: medium ? 22 : 16, weight: 'medium' }), foregroundColor(ink), lineLimit(3), minimumScaleFactor(0.74)]}>
        Lord, quiet my heart. Guide me. Amen.
      </Text>
      <Spacer minLength={0} />
      <Text modifiers={[
        font({ size: medium ? 12 : 11, weight: 'semibold', design }), foregroundColor(accent),
        lineLimit(1), minimumScaleFactor(0.8),
      ]}>
        Open journal →
      </Text>
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
