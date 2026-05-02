import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, PrimaryButton, ScriptureTicker, Squiggle } from '@/components/saint/Common';
import { HeroIllustration } from '@/components/saint/Hero';
import { ArrowIcon, ShieldIcon, SparkleIcon } from '@/components/saint/Icons';
import { FONTS, THEME, VERSES } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';

export default function AuthWelcomeScreen() {
  const fontsLoaded = useSaintFonts();
  const { signInAnonymously } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;
  }

  const onSkip = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await signInAnonymously();
    setBusy(false);
    if (e) {
      setError(e);
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <View style={{ marginTop: 8, marginBottom: 14 }}>
        <ScriptureTicker verses={VERSES.slice(0, 3)} speed={26} />
      </View>

      <View style={styles.pillRow}>
        <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
          Anonymous Prayer
        </Pill>
        <View style={styles.sparkles}>
          <SparkleIcon size={11} color={THEME.muted} />
          <SparkleIcon size={7} color={THEME.muted} />
          <SparkleIcon size={9} color={THEME.muted} />
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.title}>
            Saint{'\n'}
            <Text style={styles.titleItalic}>Central</Text>
          </Text>
          <View style={{ marginTop: 14 }}>
            <Squiggle color={THEME.accent} w={68} />
          </View>
          <Text style={styles.subtitle}>
            Pray anonymously.{'\n'}
            Lift others. Find <Text style={styles.subtitleItalic}>hope</Text>.
          </Text>
          <View style={{ marginTop: 10 }}>
            <Squiggle color={THEME.accent} w={36} opacity={0.5} />
          </View>
        </View>
        <View style={styles.illustration} pointerEvents="none">
          <HeroIllustration width={210} height={230} />
        </View>
      </View>

      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <ScriptureTicker verses={VERSES.slice(2, 5)} speed={22} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Create an account"
          bg={THEME.cardDark}
          fg={THEME.cardDarkInk}
          rightIcon={<ArrowIcon size={16} color={THEME.cardDarkInk} />}
          onPress={() => router.push('/auth/signup')}
          style={{ marginBottom: 10 }}
        />
        <PrimaryButton
          label="Log in"
          bg={THEME.surface}
          fg={THEME.ink}
          rightIcon={<ArrowIcon size={16} color={THEME.ink} />}
          onPress={() => router.push('/auth/login')}
          style={styles.outline}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          onPress={busy ? undefined : onSkip}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}>
          {busy ? (
            <ActivityIndicator color={THEME.inkSoft} />
          ) : (
            <Text style={styles.skipBtnText}>Continue without an account</Text>
          )}
        </Pressable>
        <Text style={styles.skipFootnote}>
          Pray and post anonymously — nothing will be saved to a recoverable
          account.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  pillRow: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sparkles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.45,
  },
  hero: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 240,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 4,
    zIndex: 2,
    justifyContent: 'flex-start',
  },
  title: {
    fontFamily: FONTS.displaySemi,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.2,
    color: THEME.ink,
  },
  titleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 23,
    color: THEME.inkSoft,
    marginTop: 16,
    maxWidth: 240,
  },
  subtitleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  illustration: {
    position: 'absolute',
    right: -10,
    top: 24,
    width: 210,
    height: 230,
    opacity: 0.95,
  },
  actions: { paddingHorizontal: 22, paddingBottom: 16 },
  outline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.line,
  },
  dividerText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: THEME.muted,
  },
  skipBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    borderStyle: 'dashed',
  },
  skipBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    letterSpacing: 0.6,
    color: THEME.inkSoft,
  },
  skipFootnote: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 17,
    color: THEME.muted,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 18,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.accent,
    textAlign: 'center',
    marginTop: 12,
  },
});
