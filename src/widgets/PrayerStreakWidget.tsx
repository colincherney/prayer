import { Capsule, Circle, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden, containerBackground, font, foregroundColor, frame, kerning, lineLimit,
  minimumScaleFactor, privacySensitive, strokeBorder, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerStreakWidgetProps } from '@/lib/prayerStreak';

const PrayerStreakWidget = (props: PrayerStreakWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const now = new Date(Math.max(Date.now(), environment.date?.getTime() ?? 0));
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const expiresAt = props.expiresAt ?? 0;
  const count = expiresAt > now.getTime() ? props.count ?? 0 : 0;
  const prayedToday = count > 0 && props.prayedToday && expiresAt > midnight;
  const loaded = props.count !== undefined;
  const status = prayedToday ? 'Prayed today' : count > 0 ? 'Pray by midnight' : 'Start a streak';
  const dark = environment.colorScheme === 'dark';
  const background = props.appearance?.background ?? (dark ? '#1C2D52' : '#FBF7EF');
  const ink = props.appearance?.ink ?? (dark ? '#EAEFFA' : '#1F2A44');
  const secondary = props.appearance?.secondary ?? (dark ? '#BCC9E2' : '#3A4663');
  const accent = props.appearance?.accent ?? (dark ? '#D4A574' : '#A4582C');
  const badgeFill = props.appearance?.badge ?? (dark ? '#172645' : '#EFE5D2');
  const line = props.appearance?.line ?? (dark ? 'rgba(234,239,250,0.12)' : 'rgba(31,42,68,0.10)');
  const design = props.appearance?.design ?? 'default';
  const widgetModifiers = [
    frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
    containerBackground(background, 'widget'),
    widgetURL('prayer:///explore'),
  ];
  const badge = (size: number, symbolSize: number) => (
    <ZStack modifiers={[frame({ width: size, height: size }), accessibilityHidden(), privacySensitive()]}>
      <Circle modifiers={[foregroundColor(badgeFill), strokeBorder({ shape: 'circle', content: line })]} />
      <Image systemName={prayedToday ? 'checkmark' : 'flame.fill'} size={symbolSize} color={accent} />
    </ZStack>
  );

  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack spacing={14} modifiers={widgetModifiers}>
        <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' })]}>
          <Text modifiers={[
            font({ size: 12, weight: 'semibold', design }), foregroundColor(accent), kerning(0.8), lineLimit(1),
          ]}>
            PRAYER CHECK-IN
          </Text>
          <Spacer minLength={0} />
          <Text modifiers={[
            font({ size: 27, design, weight: 'semibold' }), foregroundColor(ink),
            lineLimit(2), minimumScaleFactor(0.75), privacySensitive(),
          ]}>
            {loaded ? status : 'Open to check in'}
          </Text>
          <Spacer minLength={0} />
          {count > 0 ? (
            <Text modifiers={[
              font({ size: 13, weight: 'semibold', design }), foregroundColor(secondary),
              lineLimit(1), minimumScaleFactor(0.75), privacySensitive(),
            ]}>
              {`${count}-day streak`}
            </Text>
          ) : null}
        </VStack>
        {badge(68, 27)}
      </HStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={4} modifiers={widgetModifiers}>
      <HStack spacing={3}>
        <Text modifiers={[
          font({ size: 10, design, weight: 'semibold' }), foregroundColor(accent),
          kerning(0.8), lineLimit(1), minimumScaleFactor(0.72),
        ]}>
          PRAYER STREAK
        </Text>
        <Spacer minLength={0} />
        {badge(24, 11)}
      </HStack>
      <Spacer minLength={0} />
      {loaded ? (
        <HStack alignment="firstTextBaseline" spacing={5} modifiers={[privacySensitive()]}>
          <Text modifiers={[
            font({ size: 38, design, weight: 'semibold' }), foregroundColor(ink),
            lineLimit(1), minimumScaleFactor(0.55),
          ]}>
            {count}
          </Text>
          <Text modifiers={[font({ size: 15, design }), foregroundColor(secondary)]}>
            {count === 1 ? 'day' : 'days'}
          </Text>
        </HStack>
      ) : (
        <Text modifiers={[font({ size: 18, design }), foregroundColor(ink), lineLimit(2), minimumScaleFactor(0.75)]}>
          Open to load your streak
        </Text>
      )}
      <Spacer minLength={0} />
      <Capsule modifiers={[foregroundColor(line), frame({ height: 1 }), accessibilityHidden()]} />
      {loaded ? (
        <Text modifiers={[
          font({ size: 11, weight: 'semibold', design }), foregroundColor(accent), lineLimit(1),
          minimumScaleFactor(0.8), privacySensitive(),
        ]}>
          {status}
        </Text>
      ) : null}
    </VStack>
  );
};

export default createWidget('PrayerStreakWidget', PrayerStreakWidget, {});
