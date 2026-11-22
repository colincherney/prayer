import { Capsule, Circle, Ellipse, HStack, Overlay, ProgressView, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityHint,
  accessibilityLabel,
  activityBackgroundTint,
  environment,
  font,
  foregroundColor,
  frame,
  kerning,
  labelsHidden,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  offset,
  padding,
  progressViewStyle,
  rotationEffect,
  shadow,
  strokeBorder,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

type PrayerStreakActivityProps = {
  count: number;
  updatedAt: number;
  expiresAt: number;
  prayerWeek?: { days: boolean[]; endsAt: number };
};

const PrayerStreakActivity = (props: PrayerStreakActivityProps, context: LiveActivityEnvironment) => {
  'widget';

  const now = Date.now();
  const expiresAt = new Date(props.expiresAt);
  const finalDayStart = new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate() - 1);
  const expired = context.isStale || props.expiresAt <= now;
  const dark = context.colorScheme === 'dark';
  const smallInk = dark ? '#EAEFFA' : '#1F2A44';
  const ink = '#FFFFFF';
  const muted = '#A6A6A6';
  const dayLabel = props.count === 1 ? 'day' : 'days';
  const countLabel = expired ? 'Streak expired' : `${props.count} ${dayLabel}`;

  // Match the Little Lamb stage in PipLamb.tsx using shapes the widget renderer can draw.
  const pip = (size: number, portrait = false, lightBackground = false) => {
    const scale = size / (portrait ? 94 : 148);
    const centerY = portrait ? 76 : 109;
    const fleece = '#F7F2E8';
    const shadedFleece = '#EDE6D8';
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
            {oval(66, 122, 26, 26, shadedFleece)}
            {oval(100, 114, 34, 34, shadedFleece)}
            {oval(134, 122, 26, 26, shadedFleece)}
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

  const badge = (size: number) => (
    <ZStack modifiers={[frame({ width: size, height: size }), accessibilityHidden()]}>
      <Circle modifiers={[
        foregroundColor('#CDA86E'),
        frame({ width: size, height: size }),
        strokeBorder({ shape: 'circle', content: '#F0D197', style: { lineWidth: 0.8 } }),
      ]} />
      {pip(size * 0.9)}
    </ZStack>
  );

  const countdown = (size: number, color: string, serif = false) => (
    <Text
      timerInterval={{ lower: new Date(props.updatedAt), upper: expiresAt }}
      countsDown
      modifiers={[
        font({ size, weight: 'semibold', design: serif ? 'serif' : 'default' }),
        foregroundColor(color),
        monospacedDigit(),
        lineLimit(1),
        minimumScaleFactor(0.75),
        multilineTextAlignment('trailing'),
        accessibilityHint('Time until your prayer streak expires'),
      ]}
    />
  );

  const summary = (compact = false) => {
    const heading = [
      font({ size: compact ? 9 : 11, design: 'serif', weight: 'semibold' }),
      kerning(compact ? 1.2 : 1.8),
      foregroundColor(muted),
      lineLimit(1),
      minimumScaleFactor(0.7),
    ];

    return (
      <HStack spacing={compact ? 8 : 12}>
        {badge(compact ? 36 : 62)}
        <VStack alignment="leading" spacing={2} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          <Text modifiers={heading}>PRAYER STREAK</Text>
          {expired ? (
            <Text modifiers={[font({ size: compact ? 16 : 21, design: 'serif' }), foregroundColor(ink)]}>
              {countLabel}
            </Text>
          ) : (
            <Text modifiers={[lineLimit(1), minimumScaleFactor(0.7), accessibilityLabel(countLabel)]}>
              <Text modifiers={[font({ size: compact ? 23 : 31, design: 'serif', weight: 'semibold' }), foregroundColor(ink)]}>
                {props.count}
              </Text>
              <Text modifiers={[font({ size: compact ? 14 : 21, design: 'serif' }), foregroundColor(muted)]}>
                {` ${dayLabel}`}
              </Text>
            </Text>
          )}
        </VStack>
        {expired ? null : (
          <VStack alignment="trailing" spacing={4} modifiers={[frame({ width: compact ? 83 : 106, alignment: 'trailing' })]}>
            <Text modifiers={heading}>EXPIRES IN</Text>
            {countdown(compact ? 19 : 26, ink, true)}
          </VStack>
        )}
      </HStack>
    );
  };

  const weekRow = (prayerWeek: NonNullable<PrayerStreakActivityProps['prayerWeek']>) => {
    const days = prayerWeek.days.map(prayed => prayed && now < prayerWeek.endsAt);
    const prayedCount = days.filter(Boolean).length;
    return (
      <HStack modifiers={[accessibilityElement('ignore'), accessibilityLabel(`Prayed on ${prayedCount} of 7 days this week`)]}>
        <HStack spacing={6}>
          {days.map((prayed, day) => (
            <Circle key={day} modifiers={[
              foregroundColor(prayed ? ink : 'transparent'),
              frame({ width: prayed ? 9 : 7, height: prayed ? 9 : 7 }),
              ...(prayed ? [] : [strokeBorder({ shape: 'circle', content: '#747474', style: { lineWidth: 1 } })]),
              frame({ width: 9, height: 9 }),
            ]} />
          ))}
        </HStack>
        <Spacer minLength={8} />
        <Text modifiers={[font({ size: 13, design: 'serif' }), foregroundColor(muted)]}>this week</Text>
      </HStack>
    );
  };

  return {
    banner: (
      <Overlay modifiers={[activityBackgroundTint('#000000')]}>
        <VStack alignment="leading" spacing={13} modifiers={[frame({ maxWidth: Infinity }), padding({ all: 17 })]}>
          {summary()}
          {props.prayerWeek ? weekRow(props.prayerWeek) : null}
          {expired ? null : (
            <ProgressView
              timerInterval={{ lower: finalDayStart, upper: expiresAt }}
              countsDown
              modifiers={[progressViewStyle('linear'), labelsHidden(), tint(ink), environment('colorScheme', 'dark'), accessibilityHidden()]}
            />
          )}
        </VStack>
        <Overlay.Content>
          <RoundedRectangle cornerRadius={23} modifiers={[
            foregroundColor('transparent'),
            strokeBorder({ shape: 'roundedRectangle', cornerRadius: 23, content: '#303030', style: { lineWidth: 1 } }),
            accessibilityHidden(),
          ]} />
        </Overlay.Content>
      </Overlay>
    ),
    bannerSmall: (
      <VStack alignment="leading" spacing={3} modifiers={[padding({ all: 8 })]}>
        <HStack spacing={4}>
          {pip(16, true, !dark)}
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(smallInk)]}>
            {expired ? countLabel : `${countLabel} of prayer`}
          </Text>
        </HStack>
        {expired ? null : countdown(15, smallInk)}
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
    compactTrailing: expired ? <Text modifiers={[font({ size: 12 })]}>Ended</Text> : countdown(12, ink),
    minimal: pip(20, true),
    expandedBottom: (
      <VStack modifiers={[padding({ horizontal: 10, vertical: 6 })]}>{summary(true)}</VStack>
    ),
  };
};

export default createLiveActivity('PrayerStreak', PrayerStreakActivity);
