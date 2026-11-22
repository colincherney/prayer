import { Capsule, Circle, Ellipse, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement, accessibilityHidden, accessibilityLabel, containerBackground, font, foregroundStyle,
  frame, kerning, lineLimit, minimumScaleFactor, offset, privacySensitive, rotationEffect, strokeBorder, widgetURL,
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
  const status = !loaded ? 'Open to check in' : prayedToday ? 'Prayed today' : count > 0 ? 'Pray by midnight' : 'Start a streak';
  const dayLabel = count === 1 ? 'day' : 'days';
  const appearance = props.appearance;
  const dark = appearance?.isDark ?? environment.colorScheme === 'dark';
  const tinted = environment.widgetRenderingMode === 'accented';
  const medium = environment.widgetFamily === 'systemMedium';
  const background = appearance?.background ?? (dark ? '#1C2D52' : '#FBF7EF');
  const backgroundSoft = appearance?.backgroundSoft ?? appearance?.badge ?? (dark ? '#172645' : '#EFE5D2');
  const ink = appearance?.ink ?? (dark ? '#EAEFFA' : '#1F2A44');
  const secondary = appearance?.secondary ?? (dark ? '#BCC9E2' : '#3A4663');
  const accent = appearance?.accent ?? (dark ? '#D4A574' : '#A4582C');
  const glow = appearance?.accentSoft ?? (dark ? '#9F7B54' : '#E5B697');
  const design = appearance?.design ?? 'serif';
  const primary = tinted ? foregroundStyle({ type: 'hierarchical', style: 'primary' }) : foregroundStyle(ink);
  const subtle = tinted ? foregroundStyle({ type: 'hierarchical', style: 'secondary' }) : foregroundStyle(secondary);
  const highlight = tinted ? primary : foregroundStyle(accent);

  const widgetModifiers = [
    frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
    containerBackground(tinted ? background : {
      type: 'linearGradient', colors: [background, backgroundSoft], startPoint: { x: 0, y: 1 }, endPoint: { x: 1, y: 0 },
    }, 'widget'),
    widgetURL('prayer:///explore'),
  ];

  // Use Pip's Little Lamb colors and proportions within the isolated widget layout.
  const size = medium ? 108 : 34;
  const scale = size / (medium ? 150 : 83);
  const centerY = medium ? 105 : 75;
  const fleece = '#F7F2E8';
  const shadedFleece = '#EDE6D8';
  const gold = prayedToday ? '#F2C462' : '#C99A5C';
  const features = '#2B2420';
  const position = (x: number, y: number) => offset({ x: (x - 100) * scale, y: (y - centerY) * scale });
  const oval = (x: number, y: number, rx: number, ry: number, color: string, angle = 0) => (
    <Ellipse modifiers={[
      foregroundStyle(color), frame({ width: 2 * rx * scale, height: 2 * ry * scale }),
      rotationEffect(angle), position(x, y),
    ]} />
  );
  const hoof = (x: number) => (
    <Capsule modifiers={[foregroundStyle('#4A3F3A'), frame({ width: 11 * scale, height: 38 * scale }), position(x, 155)]} />
  );
  const pip = (
    <ZStack modifiers={[frame({ width: size, height: size }), accessibilityHidden(), privacySensitive()]}>
      {tinted ? <Image systemName={prayedToday ? 'checkmark.seal.fill' : 'flame.fill'} size={medium ? 44 : 18} /> : (
        <>
          <Circle modifiers={[
            foregroundStyle({
              type: 'radialGradient', colors: [glow, 'transparent'], center: { x: 0.5, y: 0.5 }, startRadius: 0, endRadius: size / 2,
            }),
            frame({ width: size, height: size }),
          ]} />
          {medium ? (
            <>
              {oval(100, 170, 54, 6, '#43302826')}
              {hoof(77.5)}
              {hoof(122.5)}
              {oval(66, 122, 26, 26, shadedFleece)}
              {oval(100, 114, 34, 34, shadedFleece)}
              {oval(134, 122, 26, 26, shadedFleece)}
              {oval(82, 141, 24, 24, fleece)}
              {oval(118, 141, 24, 24, fleece)}
              {oval(90, 110, 11, 2, '#8FC6A9', 18)}
              {oval(110, 110, 11, 2, '#8FC6A9', -18)}
              {oval(100, 115, 5.5, 5.5, gold)}
            </>
          ) : null}
          {oval(72, 80, 14, 7, '#E9D3BA', -22)}
          {oval(128, 80, 14, 7, '#E9D3BA', 22)}
          {oval(100, 88, 25, 23, '#F1E2CC')}
          {oval(90, 66, 9, 9, fleece)}
          {oval(100, 62, 10, 10, fleece)}
          {oval(110, 66, 9, 9, fleece)}
          {oval(91, 88, 3.6, prayedToday ? 1.6 : 3.6, features, prayedToday ? -15 : 0)}
          {oval(109, 88, 3.6, prayedToday ? 1.6 : 3.6, features, prayedToday ? 15 : 0)}
          {oval(85, 97, 4, 4, '#E8998A99')}
          {oval(115, 97, 4, 4, '#E8998A99')}
          {oval(98, 100, 2.7, 1.2, features, 20)}
          {oval(102, 100, 2.7, 1.2, features, -20)}
          <Ellipse modifiers={[
            foregroundStyle('transparent'), frame({ width: 44 * scale, height: 14 * scale }),
            strokeBorder({ shape: 'ellipse', content: gold, style: { lineWidth: 4 * scale } }), position(100, 46),
          ]} />
          {medium && prayedToday ? (
            <>
              <Image systemName="sparkle" size={15} color={accent} modifiers={[position(151, 60)]} />
              <Image systemName="sparkle" size={9} color={accent} modifiers={[position(45, 69)]} />
            </>
          ) : null}
        </>
      )}
    </ZStack>
  );

  const content = (
    <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' })]}>
      <HStack spacing={4}>
        <Text modifiers={[
          font({ size: medium ? 11 : 10, weight: 'semibold' }), highlight,
          kerning(0.8), lineLimit(1), minimumScaleFactor(0.72),
        ]}>
          PRAYER STREAK
        </Text>
        {!medium ? <Spacer minLength={0} /> : null}
        {!medium ? pip : null}
      </HStack>
      <Spacer minLength={0} />
      {loaded ? (
        <HStack alignment="firstTextBaseline" spacing={5} modifiers={[
          accessibilityElement('ignore'), accessibilityLabel(`${count} ${dayLabel}`), privacySensitive(),
        ]}>
          <Text modifiers={[
            font({ size: medium ? 44 : 39, design, weight: 'semibold' }), primary,
            lineLimit(1), minimumScaleFactor(0.55),
          ]}>
            {count}
          </Text>
          <Text modifiers={[font({ size: medium ? 17 : 14, design }), subtle, lineLimit(1)]}>
            {dayLabel}
          </Text>
        </HStack>
      ) : (
        <Text modifiers={[font({ size: medium ? 26 : 20, design, weight: 'medium' }), primary, lineLimit(2), minimumScaleFactor(0.75)]}>
          {status}
        </Text>
      )}
      <Spacer minLength={0} />
      {loaded ? (
        <HStack spacing={4} modifiers={[privacySensitive()]}>
          <Image systemName={prayedToday ? 'checkmark.circle.fill' : 'arrow.up.right'} size={prayedToday ? 11 : 8}
            modifiers={[highlight, accessibilityHidden()]} />
          <Text modifiers={[font({ size: medium ? 12 : 11, weight: 'semibold' }), highlight, lineLimit(1), minimumScaleFactor(0.8)]}>
            {status}
          </Text>
        </HStack>
      ) : <Image systemName="arrow.up.right" size={9} modifiers={[highlight, accessibilityHidden()]} />}
    </VStack>
  );

  return (
    <HStack spacing={12} modifiers={widgetModifiers}>
      {content}
      {medium ? pip : null}
    </HStack>
  );
};

export default createWidget('PrayerStreakWidget', PrayerStreakWidget, {});
