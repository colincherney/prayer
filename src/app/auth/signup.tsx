import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, PrimaryButton, Squiggle } from '@/components/saint/Common';
import {
  ArrowIcon,
  BackIcon,
  CheckIcon,
  ShieldIcon,
  SparkleIcon,
} from '@/components/saint/Icons';
import { FONTS, THEME } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';

type FieldKey = 'email' | 'pass' | null;

export default function SignUpScreen() {
  const fontsLoaded = useSaintFonts();
  const { signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<FieldKey>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const canSubmit = email.includes('@') && password.length >= 6 && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const { error: e } = await signUpWithPassword(email.trim(), password);
    setBusy(false);
    if (e) {
      setError(e);
      return;
    }
    setConfirmSent(true);
  };

  if (confirmSent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
        <View style={styles.confirmRoot}>
          <View style={styles.confirmIcon}>
            <CheckIcon size={28} color={THEME.pillInk} />
          </View>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Squiggle color={THEME.accent} w={56} />
          </View>
          <Text style={styles.confirmTitle}>
            Check your <Text style={styles.confirmTitleItalic}>inbox</Text>.
          </Text>
          <Text style={styles.confirmBody}>
            We sent a confirmation link to {email.trim()}. Tap it, then come back
            and log in.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 22, paddingBottom: 16 }}>
          <PrimaryButton
            label="Back to log in"
            bg={THEME.cardDark}
            fg={THEME.cardDarkInk}
            rightIcon={<ArrowIcon size={16} color={THEME.cardDarkInk} />}
            onPress={() => router.replace('/auth/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <BackIcon size={16} color={THEME.ink} />
            </Pressable>
            <View style={styles.sparkles}>
              <SparkleIcon size={11} color={THEME.muted} />
              <SparkleIcon size={7} color={THEME.muted} />
              <SparkleIcon size={9} color={THEME.muted} />
            </View>
          </View>

          <View style={styles.hero}>
            <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
              Always anonymous
            </Pill>
            <Text style={styles.title}>
              Make some{'\n'}
              <Text style={styles.titleItalic}>space</Text>.
            </Text>
            <View style={{ marginTop: 12 }}>
              <Squiggle color={THEME.accent} w={62} />
            </View>
            <Text style={styles.subtitle}>
              Your prayers and reflections will find their way back to you here.
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrap,
                  focused === 'email' && styles.inputWrapFocused,
                ]}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  placeholderTextColor={THEME.muted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  focused === 'pass' && styles.inputWrapFocused,
                ]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  placeholder="At least 6 characters"
                  placeholderTextColor={THEME.muted}
                  secureTextEntry={!showPass}
                  autoComplete="new-password"
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8}>
                  <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.helper}>
              Used only to bring your prayers back. Never shown to anyone.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? '' : 'Create account'}
            onPress={onSubmit}
            disabled={!canSubmit}
            bg={THEME.cardDark}
            fg={THEME.cardDarkInk}
            rightIcon={
              busy ? (
                <ActivityIndicator color={THEME.cardDarkInk} />
              ) : (
                <ArrowIcon size={16} color={THEME.cardDarkInk} />
              )
            }
            style={{ marginBottom: 14 }}
          />
          <Pressable onPress={() => router.replace('/auth/login')} hitSlop={8}>
            <Text style={styles.swap}>
              Already have an account?{' '}
              <Text style={styles.swapStrong}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  scroll: { paddingBottom: 12 },
  topRow: {
    paddingHorizontal: 22,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.45,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontFamily: FONTS.displaySemi,
    fontSize: 56,
    lineHeight: 58,
    letterSpacing: -1.2,
    color: THEME.ink,
    marginTop: 22,
  },
  titleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: THEME.inkSoft,
    marginTop: 14,
    maxWidth: 290,
  },
  form: { paddingHorizontal: 22, gap: 14 },
  label: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.6,
    color: THEME.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapFocused: {
    borderColor: THEME.accent,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: THEME.ink,
    paddingVertical: 16,
    flex: 1,
  },
  showHide: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: THEME.pillInk,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  helper: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 17,
    color: THEME.muted,
    marginTop: 2,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.accent,
    marginTop: 4,
  },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  swap: {
    textAlign: 'center',
    fontFamily: FONTS.body,
    fontSize: 13,
    color: THEME.inkSoft,
    paddingVertical: 8,
  },
  swapStrong: {
    fontFamily: FONTS.bodySemi,
    color: THEME.ink,
  },
  confirmRoot: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  confirmTitle: {
    fontFamily: FONTS.displaySemi,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: THEME.ink,
    textAlign: 'center',
  },
  confirmTitleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  confirmBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: THEME.inkSoft,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 320,
  },
});
