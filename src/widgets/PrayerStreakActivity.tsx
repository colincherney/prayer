import { Capsule, Ellipse, HStack, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden,
  accessibilityHint,
  accessibilityLabel,
  activityBackgroundTint,
  font,
  foregroundColor,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  offset,
  padding,
  rotationEffect,
  shadow,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

type PrayerStreakActivityProps = {
  count: number;
  updatedAt: number;
  expiresAt: number;
};

const PrayerStreakActivity = (props: PrayerStreakActivityProps, environment: LiveActivityEnvironment) => {
  'widget';

  const expired = environment.isStale || props.expiresAt <= Date.now();
  const dark = environment.colorScheme === 'dark';
  const background = dark ? '#0F1A33' : '#F5EFE6';
  const ink = dark ? '#EAEFFA' : '#1F2A44';
  const muted = dark ? '#BDC7DC' : '#58637A';
  const countLabel = expired ? 'Streak expired' : `${props.count} ${props.count === 1 ? 'day' : 'days'}`;

  // Match the Little Lamb stage in PipLamb.tsx using shapes the widget renderer can draw.
  const pip = (size: number, portrait = false, lightBackground = false) => {
    const scale = size / (portrait ? 94 : 148);
    const centerY = portrait ? 76 : 109;
    const fleece = '#F7F2E8';
    const gold = '#F2C462';
    const ear = '#E9D3BA';
    const face = '#F1E2CC';
    const features = '#2B2420';
    const cheek = '#E8998A99';
    const mint = '#8FC6A9';
    const position = (x: number, y: number) => offset({ x: (x - 100) * scale, y: (y - centerY) * scale });
    const oval = (x: number, y: number, rx: number, ry: number, color: string, angle = 0) => (
      <Ellipse modifiers={[
        foregroundColor(color),
        frame({ width: 2 * rx * scale, height: 2 * ry * scale }),
        ...(angle ? [rotationEffect(angle)] : []),
        position(x, y),
      ]} />
    );
    const hoof = (x: number) => (
      <Capsule modifiers={[
        foregroundColor('#4A3F3A'),
        frame({ width: 11 * scale, height: 38 * scale }),
        position(x, 159),
      ]} />
    );
    return (
      <ZStack modifiers={[
        frame({ width: size, height: size }),
        ...(lightBackground ? [shadow({ color: '#4A3F3A44', radius: 0.8, y: 0.45 })] : []),
        accessibilityHidden(),
      ]}>
        {portrait ? null : (
          <>
            {hoof(77.5)}
            {hoof(122.5)}
            {oval(66, 122, 26, 26, fleece)}
            {oval(100, 114, 34, 34, fleece)}
            {oval(134, 122, 26, 26, fleece)}
            {oval(82, 142, 24, 24, fleece)}
            {oval(118, 142, 24, 24, fleece)}
            {oval(90, 110, 11, 2, mint, 18)}
            {oval(110, 110, 11, 2, mint, -18)}
            {oval(100, 115, 5.5, 5.5, gold)}
          </>
        )}
        {oval(72, 80, 14, 7, ear, -22)}
        {oval(128, 80, 14, 7, ear, 22)}
        {oval(100, 88, 25, 23, face)}
        {oval(90, 66, 9, 9, fleece)}
        {oval(100, 62, 10, 10, fleece)}
        {oval(110, 66, 9, 9, fleece)}
        {oval(91, 88, 3.6, 3.6, features)}
        {oval(109, 88, 3.6, 3.6, features)}
        {oval(85, 97, 4, 4, cheek)}
        {oval(115, 97, 4, 4, cheek)}
        {oval(98, 100, 2.7, 1.2, features, 20)}
        {oval(102, 100, 2.7, 1.2, features, -20)}
        <Ellipse modifiers={[
          foregroundColor('transparent'),
          frame({ width: 44 * scale, height: 14 * scale }),
          strokeBorder({ shape: 'ellipse', content: gold, style: { lineWidth: 4 * scale } }),
          position(100, 46),
        ]} />
      </ZStack>
    );
  };

  const countdown = (size: number, color: string) => (
    <Text
      timerInterval={{ lower: new Date(props.updatedAt), upper: new Date(props.expiresAt) }}
      countsDown
      modifiers={[
        font({ size, weight: 'semibold' }),
        foregroundColor(color),
        monospacedDigit(),
        lineLimit(1),
        minimumScaleFactor(0.75),
        multilineTextAlignment('trailing'),
        accessibilityHint('Time until your prayer streak expires'),
      ]}
    />
  );

  return {
    banner: (
      <HStack spacing={10} modifiers={[padding({ horizontal: 16, vertical: 14 }), activityBackgroundTint(background)]}>
        {pip(40, false, !dark)}
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundColor(muted)]}>Prayer streak</Text>
          <Text modifiers={[font({ size: 19, weight: 'semibold' }), foregroundColor(ink), lineLimit(1)]}>
            {countLabel}
          </Text>
        </VStack>
        <Spacer minLength={4} />
        {expired ? null : (
          <VStack alignment="trailing" spacing={2}>
            <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundColor(muted)]}>Expires in</Text>
            {countdown(19, ink)}
          </VStack>
        )}
      </HStack>
    ),
    bannerSmall: (
      <VStack alignment="leading" spacing={3} modifiers={[padding({ all: 8 })]}>
        <HStack spacing={4}>
          {pip(16, true, !dark)}
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(ink)]}>
            {expired ? countLabel : `${countLabel} of prayer`}
          </Text>
        </HStack>
        {expired ? null : countdown(15, ink)}
      </VStack>
    ),
    compactLeading: (
      <HStack spacing={3}>
        {pip(16, true)}
        {expired ? null : (
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), accessibilityLabel(`${countLabel} prayer streak`)]}>
            {props.count}
          </Text>
        )}
      </HStack>
    ),
    compactTrailing: expired ? <Text modifiers={[font({ size: 12 })]}>Ended</Text> : countdown(12, '#FFFFFF'),
    minimal: pip(20, true),
    expandedBottom: (
      <HStack spacing={8} modifiers={[padding({ horizontal: 10, vertical: 6 })]}>
        {pip(34)}
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12 }), foregroundColor('#BDC7DC')]}>Prayer streak</Text>
          <Text modifiers={[font({ size: 17, weight: 'semibold' })]}>{countLabel}</Text>
        </VStack>
        <Spacer minLength={4} />
        {expired ? null : (
          <VStack alignment="trailing" spacing={2}>
            <Text modifiers={[font({ size: 12 }), foregroundColor('#BDC7DC')]}>Expires in</Text>
            {countdown(17, '#FFFFFF')}
          </VStack>
        )}
      </HStack>
    ),
  };
};

export default createLiveActivity('PrayerStreak', PrayerStreakActivity);
