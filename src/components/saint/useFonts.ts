import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_500Medium_Italic } from '@expo-google-fonts/inter/500Medium_Italic';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { type FontSource, useFonts } from 'expo-font';

import { winterLordActiveAtLaunch } from './winterLord';

// Every screen's styles use the `Saint_*` names in FONTS (theme.ts). Which files those names point to is decided
// once per launch: Playfair Display (with no italics) during the Winter Lord event, Inter the rest of the year.
// Styles are built when their files load, so this swap is how the font can follow the database dates without
// rewriting every screen. A font change therefore takes effect the next time the app opens.
let fontSet: Record<string, FontSource> | null = null;

function pickFonts(): Record<string, FontSource> {
  if (!fontSet) {
    fontSet = winterLordActiveAtLaunch()
      ? {
          Saint_400: PlayfairDisplay_400Regular,
          Saint_500: PlayfairDisplay_500Medium,
          Saint_500Italic: PlayfairDisplay_500Medium,
          Saint_600: PlayfairDisplay_600SemiBold,
          Saint_700: PlayfairDisplay_700Bold,
        }
      : {
          Saint_400: Inter_400Regular,
          Saint_500: Inter_500Medium,
          Saint_500Italic: Inter_500Medium_Italic,
          Saint_600: Inter_600SemiBold,
          Saint_700: Inter_700Bold,
        };
  }
  return fontSet;
}

export function useSaintFonts() {
  const [loaded] = useFonts(pickFonts());
  return loaded;
}

export function saintWidgetFontDesign() {
  return pickFonts().Saint_400 === PlayfairDisplay_400Regular ? 'serif' : 'default';
}
