import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackIcon } from '@/components/saint/Icons';
import {
  FONTS,
  Theme,
  ThemeName,
  THEME_ORDER,
  THEMES,
  useTheme,
  useThemedStyles,
} from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import {
  type AppIconChoice,
  getCurrentAppIcon,
  setAppIconChoice,
} from '@/lib/appIcon';

const APP_ICONS: { key: AppIconChoice; label: string; image: number }[] = [
  { key: 'default', label: 'Default', image: require('../../assets/images/icon.png') },
  { key: 'pink', label: 'Pink', image: require('../../assets/images/icon-pink.png') },
];

const ThemePicker: React.FC = () => {
  const { name, setTheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.themeRow}>
      {THEME_ORDER.map(key => {
        const t = THEMES[key];
        const active = key === name;
        return (
          <Pressable
            key={key}
            onPress={() => setTheme(key as ThemeName)}
            style={[
              styles.themeSwatch,
              { borderColor: active ? t.accent : t.line, backgroundColor: t.bg },
            ]}>
            <View style={[styles.themeDotMain, { backgroundColor: t.cardDark }]} />
            <View style={[styles.themeDotAccent, { backgroundColor: t.accent }]} />
            <Text style={[styles.themeName, { color: t.ink }]}>{t.name}</Text>
            {active ? <View style={[styles.themeCheck, { backgroundColor: t.accent }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const AppIconPicker: React.FC = () => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [active, setActive] = useState<AppIconChoice>('default');
  const [pending, setPending] = useState<AppIconChoice | null>(null);

  useEffect(() => {
    setActive(getCurrentAppIcon());
  }, []);

  const onSelect = useCallback(async (choice: AppIconChoice) => {
    if (pending || choice === active) return;
    setPending(choice);
    const ok = await setAppIconChoice(choice);
    setPending(null);
    if (!ok) {
      Alert.alert(
        'Couldn’t change icon',
        'Make sure the app was installed from a build that includes this version. Try reopening the app.',
      );
      return;
    }
    setActive(choice);
  }, [active, pending]);

  return (
    <View style={styles.iconRow}>
      {APP_ICONS.map(({ key, label, image }) => {
        const isActive = active === key;
        const isPending = pending === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            disabled={pending !== null}
            style={[
              styles.iconSwatch,
              {
                borderColor: isActive ? THEME.accent : THEME.line,
                backgroundColor: THEME.surface,
                opacity: pending && !isPending ? 0.5 : 1,
              },
            ]}>
            <Image source={image} style={styles.iconImage} contentFit="cover" />
            <Text style={[styles.iconLabel, { color: THEME.ink }]}>{label}</Text>
            {isActive ? <View style={[styles.iconCheck, { backgroundColor: THEME.accent }]} /> : null}
            {isPending ? (
              <View style={styles.iconPendingOverlay}>
                <ActivityIndicator size="small" color={THEME.accent} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

export default function CustomizationScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtnSurface}>
            <BackIcon size={15} color={THEME.ink} />
          </Pressable>
          <Text style={styles.brandText}>
            Saint <Text style={{ fontFamily: FONTS.body }}>Central</Text>
          </Text>
          <View style={styles.brandSpacer} />
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Make it{'\n'}
              <Text style={styles.titleItalic}>yours</Text>
            </Text>
            <Text style={styles.subtitle}>
              Theme and app icon. The rest stays anonymous.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 22, gap: 18, marginTop: 8 }}>
          <View style={{ gap: 10 }}>
            <Text style={styles.subLabel}>Theme</Text>
            <ThemePicker />
          </View>
          <View style={{ gap: 10 }}>
            <Text style={styles.subLabel}>App icon</Text>
            <AppIconPicker />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 6,
  },
  iconBtnSurface: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  brandSpacer: { width: 38, height: 38 },

  titleRow: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.3,
    color: THEME.ink,
  },
  titleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: THEME.muted,
  },

  subLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
    color: THEME.muted,
  },

  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeSwatch: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  themeDotMain: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  themeDotAccent: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeName: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  themeCheck: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 3,
    borderRadius: 2,
  },

  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconSwatch: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  iconImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  iconLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  iconCheck: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  iconPendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
