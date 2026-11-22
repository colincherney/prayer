import { Capsule, Circle, Ellipse, HStack, Image, Mask, Rectangle, Spacer, Text, UnevenRoundedRectangle, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden, containerBackground, font, foregroundStyle, frame, italic, kerning, lineLimit,
  minimumScaleFactor, offset, shadow, widgetURL, type ShapeStyle,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PrayerWidgetAppearanceProps } from '@/lib/prayerWidgetAppearance';

const QuietPrayerWidget = (props: PrayerWidgetAppearanceProps, environment: WidgetEnvironment) => {
  'widget';

  const appearance = props.appearance;
  const dark = appearance?.isDark ?? environment.colorScheme === 'dark';
  const tinted = environment.widgetRenderingMode === 'accented';
  const medium = environment.widgetFamily === 'systemMedium';
  const background = appearance?.background ?? (dark ? '#1C2D52' : '#FBF7EF');
  const backgroundSoft = appearance?.backgroundSoft ?? appearance?.badge ?? (dark ? '#172645' : '#EFE5D2');
  const ink = appearance?.ink ?? (dark ? '#EAEFFA' : '#1F2A44');
  const accent = appearance?.accent ?? (dark ? '#D4A574' : '#A4582C');
  const glow = appearance?.accentSoft ?? (dark ? '#9F7B54' : '#E5B697');
  const design = appearance?.design ?? 'serif';
  const primary = tinted ? foregroundStyle({ type: 'hierarchical', style: 'primary' }) : foregroundStyle(ink);
  const highlight = tinted ? primary : foregroundStyle(accent);
  const wood = dark ? '#634A49' : '#805A4B';
  const scale = medium ? 1 : 0.28;
  const shape = (width: number, height: number, x: number, y: number, style: ShapeStyle) => [
    foregroundStyle(style), frame({ width: width * scale, height: height * scale }),
    offset({ x: x * scale, y: y * scale }),
  ];

  // Recreate the Window Seat in daylight or moonlight using native widget shapes.
  const window = tinted ? (
    <Image systemName={dark ? 'moon.stars' : 'sun.horizon'} size={medium ? 48 : 21} modifiers={[
      frame({ width: medium ? 104 : 29, height: medium ? 104 : 29 }), accessibilityHidden(),
    ]} />
  ) : (
    <ZStack modifiers={[frame({ width: 112 * scale, height: 112 * scale }), accessibilityHidden()]}>
      <Circle modifiers={shape(112, 112, 0, 0, {
        type: 'radialGradient', colors: [glow, 'transparent'], center: { x: 0.5, y: 0.5 }, startRadius: 0, endRadius: 56 * scale,
      })} />
      <UnevenRoundedRectangle topLeadingRadius={42 * scale} topTrailingRadius={42 * scale}
        bottomLeadingRadius={4 * scale} bottomTrailingRadius={4 * scale} modifiers={[
          ...shape(84, 100, 0, 0, wood), shadow({ color: '#31202C44', radius: 4 * scale, y: 3 * scale }),
        ]} />
      <Mask>
        <ZStack modifiers={[frame({ width: 74 * scale, height: 90 * scale })]}>
          <Rectangle modifiers={shape(74, 90, 0, 0, {
            type: 'linearGradient', colors: dark ? ['#202B54', '#62739A'] : ['#D69E8F', '#F8DCAC'],
            startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 1 },
          })} />
          <Circle modifiers={shape(53, 53, 13, -13, {
            type: 'radialGradient', colors: [dark ? '#D0D9F5' : '#FFF0C9', 'transparent'],
            center: { x: 0.5, y: 0.5 }, startRadius: 0, endRadius: 26 * scale,
          })} />
          <Circle modifiers={shape(19, 19, 13, -13, dark ? '#F3EBD3' : '#FFF4CF')} />
          {dark ? <Image systemName="sparkle" size={8 * scale} color="#F3EBD3" modifiers={[offset({ x: -14 * scale, y: -22 * scale })]} /> : null}
          <Ellipse modifiers={shape(102, 38, -21, 35, dark ? '#414D70' : '#AE897F')} />
          <Ellipse modifiers={shape(104, 36, 22, 44, dark ? '#333F60' : '#8B6864')} />
          <Ellipse modifiers={shape(105, 23, -17, 48, dark ? '#273552' : '#706769')} />
          <Rectangle modifiers={shape(3, 90, 0, 0, wood)} />
          <Rectangle modifiers={shape(74, 3, 0, 6, wood)} />
        </ZStack>
        <Mask.Content>
          <UnevenRoundedRectangle topLeadingRadius={37 * scale} topTrailingRadius={37 * scale}
            bottomLeadingRadius={2 * scale} bottomTrailingRadius={2 * scale}
            modifiers={[frame({ width: 74 * scale, height: 90 * scale })]} />
        </Mask.Content>
      </Mask>
      <Capsule modifiers={shape(96, 6, 0, 49, wood)} />
      <Capsule modifiers={shape(88, 1.5, 0, 47, '#D4A978')} />
    </ZStack>
  );

  const prayer = (
    <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' })]}>
      <HStack spacing={4}>
        <Text modifiers={[
          font({ size: medium ? 11 : 10, weight: 'semibold' }), highlight,
          kerning(0.8), lineLimit(1), minimumScaleFactor(0.8),
        ]}>
          QUIET PRAYER
        </Text>
        {!medium ? <Spacer minLength={0} /> : null}
        {!medium ? window : null}
      </HStack>
      <Spacer minLength={0} />
      <Text modifiers={[
        font({ design, size: medium ? 23 : 17, weight: 'medium' }), italic(), primary, lineLimit(3), minimumScaleFactor(0.75),
      ]}>
        Lord, quiet my heart. Guide me. Amen.
      </Text>
      <Spacer minLength={0} />
      <HStack spacing={4}>
        <Text modifiers={[font({ size: medium ? 12 : 11, weight: 'semibold' }), highlight, lineLimit(1), minimumScaleFactor(0.8)]}>
          Open journal
        </Text>
        <Image systemName="arrow.up.right" size={8} modifiers={[highlight, accessibilityHidden()]} />
      </HStack>
    </VStack>
  );

  return (
    <HStack spacing={12} modifiers={[
      containerBackground(tinted ? background : {
        type: 'linearGradient', colors: [background, backgroundSoft], startPoint: { x: 0, y: 1 }, endPoint: { x: 1, y: 0 },
      }, 'widget'),
      widgetURL('prayer:///biography'),
      frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
    ]}>
      {prayer}
      {medium ? window : null}
    </HStack>
  );
};

export default createWidget('QuietPrayerWidget', QuietPrayerWidget, {});
