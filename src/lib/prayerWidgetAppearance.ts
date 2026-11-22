export type PrayerWidgetAppearance = {
  background: string;
  ink: string;
  secondary: string;
  accent: string;
  badge: string;
  line: string;
  design: 'default' | 'serif';
  backgroundSoft?: string;
  accentSoft?: string;
  isDark?: boolean;
};

export type PrayerWidgetAppearanceProps = { appearance?: PrayerWidgetAppearance };
