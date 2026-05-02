// Saint Central — design tokens (cream theme, the reference default)

export const THEME = {
  bg: '#F5EFE6',
  bgSoft: '#EDE5D7',
  surface: '#FBF7EF',
  ink: '#1F2A44',
  inkSoft: '#3A4663',
  muted: '#8A8470',
  line: 'rgba(31,42,68,0.10)',
  cardDark: '#3A4860',
  cardDarkInk: '#F5EFE6',
  accent: '#C8643C',
  accentSoft: '#E5B697',
  pillBg: '#EFE5D2',
  pillInk: '#A4582C',
};

export type Theme = typeof THEME;

export const FONTS = {
  display: 'PlayfairDisplay_500Medium',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  displayItalic: 'PlayfairDisplay_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const VERSES = [
  { text: 'Pray without ceasing', ref: '1 Thessalonians 5:17' },
  { text: 'Be still, and know that I am God', ref: 'Psalm 46:10' },
  { text: 'Where two or three gather, there am I', ref: 'Matthew 18:20' },
  { text: 'Cast your cares on Him', ref: '1 Pet 5:7' },
  { text: "Bear one another's burdens", ref: 'Gal 6:2' },
];
