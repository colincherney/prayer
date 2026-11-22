import { Capsule, Ellipse, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden, containerBackground, font, foregroundColor, frame, lineLimit,
  minimumScaleFactor, offset, privacySensitive, rotationEffect, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerStreakWidgetProps } from '@/lib/prayerStreak';

const PrayerStreakWidget = (props: PrayerStreakWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const dark = environment.colorScheme === 'dark';
  const medium = environment.widgetFamily === 'systemMedium';
  const background = dark ? '#1F2A3A' : '#F5EFE6';
  const ink = dark ? '#FFF0DC' : '#1F2A44';
  const accent = dark ? '#F3C97A' : '#815034';
  const now = new Date(Math.max(Date.now(), environment.date?.getTime() ?? 0));
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const expiresAt = props.expiresAt ?? 0;
  const count = expiresAt > now.getTime() ? props.count ?? 0 : 0;
  const prayedToday = count > 0 && props.prayedToday && expiresAt > midnight;
  const detail = prayedToday ? 'Prayed today' : count > 0 ? 'Pray by midnight' : 'Begin with one prayer';
  const scale = medium ? 1.3 : 0.7;
  const shape = (width: number, height: number, x: number, y: number, color: string) => [
    foregroundColor(color), frame({ width: width * scale, height: height * scale }),
    offset({ x: x * scale, y: y * scale }),
  ];

  // The candle and warm pools of light come from the Lamplit prayer room.
  const candle = (
    <ZStack modifiers={[frame({ width: 64 * scale, height: 78 * scale }), accessibilityHidden()]}>
      <Ellipse modifiers={shape(64, 68, 0, -3, dark ? '#544438' : '#EEDCC4')} />
      <Ellipse modifiers={shape(48, 55, 0, -6, dark ? '#78553C' : '#F4E2C7')} />
      <Ellipse modifiers={shape(54, 8, 0, 30, dark ? '#332C2B' : '#D5BD9C')} />
      <Capsule modifiers={shape(42, 7, 0, 27, dark ? '#A66A46' : '#B67A52')} />
      <Capsule modifiers={shape(22, 35, 0, 11, '#F4D7AE')} />
      <Ellipse modifiers={shape(21, 6, 0, -5, '#FDEDD0')} />
      <Capsule modifiers={shape(2, 7, 0, -8, '#5E3D28')} />
      <Ellipse modifiers={[rotationEffect(12), ...shape(12, 20, 0, -20, '#E88335')]} />
      <Ellipse modifiers={shape(6, 11, 0, -18, '#FFF0BD')} />
    </ZStack>
  );

  return (
    <VStack alignment="leading" spacing={3} modifiers={[
      frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
      containerBackground(background, 'widget'),
      widgetURL('prayer:///explore'),
    ]}>
      <Text modifiers={[font({ size: medium ? 19 : 15, design: 'serif', weight: 'semibold' }), foregroundColor(ink), lineLimit(1), minimumScaleFactor(0.8)]}>
        Prayer streak
      </Text>
      <Spacer minLength={0} />
      <HStack spacing={7} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
        {props.count === undefined ? (
          <Text modifiers={[font({ size: medium ? 21 : 14, design: 'serif' }), foregroundColor(ink), lineLimit(3), minimumScaleFactor(0.75)]}>
            Open to load your streak
          </Text>
        ) : (
          <VStack alignment="leading" spacing={0} modifiers={[privacySensitive()]}>
            <Text modifiers={[font({ size: medium ? 43 : 33, design: 'serif', weight: 'semibold' }), foregroundColor(ink), lineLimit(1), minimumScaleFactor(0.6)]}>
              {count}
            </Text>
            <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundColor(accent), lineLimit(1)]}>
              {count === 1 ? 'day' : 'days'}
            </Text>
          </VStack>
        )}
        <Spacer minLength={0} />
        {candle}
      </HStack>
      <Spacer minLength={0} />
      {props.count === undefined ? null : (
        <HStack spacing={4} modifiers={[privacySensitive()]}>
          {prayedToday ? <Image systemName="checkmark" size={9} color={accent} modifiers={[accessibilityHidden()]} /> : null}
          <Text modifiers={[font({ size: medium ? 13 : 10, weight: 'semibold' }), foregroundColor(accent), lineLimit(1), minimumScaleFactor(0.75)]}>
            {detail}
          </Text>
        </HStack>
      )}
    </VStack>
  );
};

export default createWidget('PrayerStreakWidget', PrayerStreakWidget, {});
