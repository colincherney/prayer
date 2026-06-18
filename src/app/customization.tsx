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
  PRAYER_ROOM_LABELS,
  PRAYER_ROOM_ORDER,
  PRAYER_ROOMS,
  PrayerRoomName,
  usePrayerRoom,
} from '@/components/saint/prayerRoom';
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
  const { name: roomName, setRoom } = usePrayerRoom();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.themeRow}>
      {THEME_ORDER.map(key => {
        const t = THEMES[key];
        const active = roomName === 'none' && key === name;
        return (
          <Pressable
            key={key}
            onPress={() => {
              setTheme(key as ThemeName);
              setRoom('none');
            }}
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

// Tiny stand-in for each room's full SVG — just enough atmosphere to tell
// the scenes apart at swatch size.
const PrayerRoomPreview: React.FC<{ room: PrayerRoomName }> = ({ room }) => {
  const palette = PRAYER_ROOMS[room];
  if (room === 'window') {
    return (
      <View
        style={{
          width: '100%',
          height: 64,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#e8d8be',
        }}>
        {/* arched window */}
        <View
          style={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            top: 6,
            bottom: 14,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            backgroundColor: '#3a2a18',
            padding: 2,
          }}>
          <View
            style={{
              flex: 1,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: '#f5b8a0',
            }}
          />
        </View>
        {/* floor */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 10,
            backgroundColor: '#7a5435',
          }}
        />
      </View>
    );
  }
  if (room === 'stars') {
    // Starlit Garden — indigo sky fading to dawn-rose, moon halo, tiny stars,
    // a chapel silhouette, lampposts pooling warmth on a path.
    return (
      <View
        style={{
          width: '100%',
          height: 64,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#0a0e22',
        }}>
        {/* dawn strip near the horizon */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 12,
            height: 18,
            backgroundColor: '#a06458',
            opacity: 0.65,
          }}
        />
        {/* moon */}
        <View
          style={{
            position: 'absolute',
            left: 10,
            top: 10,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#fff7e0',
          }}
        />
        {/* tiny stars */}
        {[
          [22, 14],
          [38, 8],
          [60, 18],
          [76, 6],
          [92, 16],
        ].map(([left, top], i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: '#fff',
            }}
          />
        ))}
        {/* chapel silhouette */}
        <View
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 14,
            marginLeft: -4,
            width: 8,
            height: 8,
            backgroundColor: '#0a0e22',
          }}
        />
        {/* lamppost halos */}
        <View
          style={{
            position: 'absolute',
            left: '20%',
            bottom: 0,
            width: 28,
            height: 14,
            borderRadius: 14,
            backgroundColor: '#f5b96a',
            opacity: 0.35,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: '20%',
            bottom: 0,
            width: 28,
            height: 14,
            borderRadius: 14,
            backgroundColor: '#f5b96a',
            opacity: 0.35,
          }}
        />
        {/* ground */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 8,
            backgroundColor: '#1a1410',
          }}
        />
      </View>
    );
  }
  if (room === 'jungle') {
    // Rainforest Vigil — teal-emerald sky, moon, layered canopy silhouettes,
    // hut window glow, fireflies above.
    return (
      <View
        style={{
          width: '100%',
          height: 64,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#08111c',
        }}>
        {/* moon */}
        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 8,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#fff5dc',
          }}
        />
        {/* stars */}
        {[
          [12, 10],
          [28, 6],
          [44, 14],
          [68, 8],
        ].map(([left, top], i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top,
              width: 1.5,
              height: 1.5,
              borderRadius: 1,
              backgroundColor: '#f4f1d9',
            }}
          />
        ))}
        {/* far canopy */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 18,
            height: 18,
            backgroundColor: '#163d31',
            opacity: 0.9,
          }}
        />
        {/* mid canopy */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 8,
            height: 16,
            backgroundColor: '#0d2820',
          }}
        />
        {/* near canopy */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 12,
            backgroundColor: '#061a14',
          }}
        />
        {/* hut window glow */}
        <View
          style={{
            position: 'absolute',
            left: '28%',
            bottom: 22,
            width: 4,
            height: 4,
            backgroundColor: '#f5b96a',
          }}
        />
        {/* a firefly or two */}
        <View
          style={{
            position: 'absolute',
            left: '55%',
            top: 32,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: '#fff4a8',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: '70%',
            top: 38,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: '#fff4a8',
          }}
        />
      </View>
    );
  }
  // lamp — dusky scene with a warm halo
  return (
    <View
      style={{
        width: '100%',
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: palette.bg,
      }}>
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: 8,
          marginLeft: -22,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#f5cba2',
          opacity: 0.55,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: 16,
          marginLeft: -12,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#fff0c8',
          opacity: 0.85,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 14,
          backgroundColor: '#2a1f15',
        }}
      />
    </View>
  );
};

const PrayerRoomPicker: React.FC = () => {
  const { name, setRoom } = usePrayerRoom();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.roomRow}>
      {PRAYER_ROOM_ORDER.map(key => {
        const active = key === name;
        return (
          <Pressable
            key={key}
            onPress={() => setRoom(key)}
            style={[
              styles.roomSwatch,
              {
                borderColor: active ? THEME.accent : THEME.line,
                backgroundColor: THEME.surface,
              },
            ]}>
            <PrayerRoomPreview room={key} />
            <Text style={[styles.roomName, { color: THEME.ink }]}>
              {PRAYER_ROOM_LABELS[key]}
            </Text>
            {active ? (
              <View style={[styles.roomCheck, { backgroundColor: THEME.accent }]} />
            ) : null}
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
    let cancelled = false;
    (async () => {
      const current = await getCurrentAppIcon();
      if (!cancelled) setActive(current);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(async (choice: AppIconChoice) => {
    if (pending || choice === active) return;
    setPending(choice);
    const result = await setAppIconChoice(choice);
    setPending(null);
    if (result === null || result !== choice) {
      const current = await getCurrentAppIcon();
      setActive(current);
      Alert.alert(
        'Couldn’t change icon',
        'Make sure the app was installed from a build that includes this version. Try reopening the app.',
      );
      return;
    }
    setActive(result);
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
            <Text style={styles.subLabel}>Prayer room</Text>
            <PrayerRoomPicker />
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

  roomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roomSwatch: {
    // 2 columns: each swatch takes ~half, minus the 10px gap.
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  roomName: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingBottom: 6,
  },
  roomCheck: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -9,
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
