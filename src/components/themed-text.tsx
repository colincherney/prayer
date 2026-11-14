import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FONTS } from '@/components/saint/theme';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.bodyMed,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.bodyBold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.body,
  },
  title: {
    fontSize: 48,
    fontFamily: FONTS.displaySemi,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: FONTS.displaySemi,
  },
  link: {
    fontFamily: FONTS.bodyMed,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: FONTS.bodyMed,
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
