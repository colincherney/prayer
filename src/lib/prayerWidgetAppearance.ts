export type PrayerWidgetAppearance = {
  background: string;
  ink: string;
  secondary: string;
  accent: string;
  badge: string;
  line: string;
  design: 'default' | 'serif';
};

export type PrayerWidgetAppearanceProps = { appearance?: PrayerWidgetAppearance };
