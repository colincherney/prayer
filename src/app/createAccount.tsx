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
import { SafeAreaView } from '@/components/saint/SafeArea';

import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { EmailCodeStep } from '@/components/saint/EmailCodeStep';
import { passwordProblem, PASSWORD_MIN, useAuth } from '@/lib/auth';

const PERKS = [
  'Keep your prayers, notes and companion if you change phones.',
  'Buy cosmetics without ever losing them.',
  'Nothing changes about staying anonymous to everyone else.',
];

/**
 * Turns an anonymous session into a real account without starting over: the same user, now with an email and
 * password, so everything built so far comes along.
 */
export default function CreateAccountScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isGuest, upgradeToAccount, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const pwProblem = passwordProblem(password);
  const canSubmit = email.includes('@') && !pwProblem && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const { error: e } = await upgradeToAccount(email.trim(), password);
    setBusy(false);
    if (e) {
      // Supabase's email sender has a small hourly limit; say what happened instead of showing its raw message.
      setError(
        /already been registered|already registered|email_exists/i.test(e)
            ? 'That email already has its own account. Deleting this guest account doesn\'t remove it. To use that account, sign out and log in with the email instead.'
            : e,
      );
      return;
    }
    setSentTo(email.trim());
  };

  const done = sentTo !== null && !isGuest;

  // The emailed code turns this guest session into a permanent account; refreshing then shows "all set".
  if (sentTo && isGuest) {
    return (
      <EmailCodeStep email={sentTo} kind="email_change" onBack={() => setSentTo(null)} onVerified={refreshUser} />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
            <BackIcon size={16} color={THEME.ink} />
          </Pressable>

          {!isGuest && sentTo === null ? (
            <>
              <Text style={styles.title}>
                You already have <Text style={styles.titleItalic}>an account</Text>.
              </Text>
              <Text style={styles.body}>Nothing more to do here.</Text>
              <Pressable onPress={() => router.back()} style={styles.primary}>
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            </>
          ) : done ? (
            <>
              <Text style={styles.title}>
                You&apos;re <Text style={styles.titleItalic}>all set</Text>.
              </Text>
              <Text style={styles.body}>
                Your account is saved. Everything you built is still here, and you can log in from any device.
              </Text>
              <Pressable onPress={() => router.back()} style={styles.primary}>
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                Keep what you&apos;ve <Text style={styles.titleItalic}>built</Text>.
              </Text>
              <Text style={styles.body}>
                Add an email and password to the session you&apos;re already using. It&apos;s the same you, so nothing is
                lost.
              </Text>
              <View style={{ gap: 8, marginTop: 14 }}>
                {PERKS.map(p => (
                  <View key={p} style={styles.perkRow}>
                    <View style={styles.perkDot} />
                    <Text style={styles.perkText}>{p}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={THEME.muted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={`At least ${PASSWORD_MIN} characters`}
                  placeholderTextColor={THEME.muted}
                  secureTextEntry={!showPass}
                  autoComplete="new-password"
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8}>
                  <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              {password && pwProblem ? <Text style={styles.helper}>{pwProblem}</Text> : null}
              <Text style={styles.helper}>Used only to bring your things back. Never shown to anyone.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={onSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                style={[styles.primary, !canSubmit && { opacity: 0.5 }]}>
                {busy ? <ActivityIndicator color={THEME.accentInk} /> : <Text style={styles.primaryText}>Create my account</Text>}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 40 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.display, fontSize: 38, lineHeight: 42, color: THEME.ink, marginTop: 20 },
  titleItalic: { fontFamily: FONTS.display, color: THEME.accent },
  body: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 22, color: THEME.inkSoft, marginTop: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  perkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: THEME.accent, marginTop: 7 },
  perkText: { flex: 1, fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.muted },
  label: { fontFamily: FONTS.bodySemi, fontSize: 12, letterSpacing: 0.6, color: THEME.muted, marginTop: 22, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  input: { flex: 1, fontFamily: FONTS.body, fontSize: 16, color: THEME.ink },
  showHide: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.accent },
  helper: { fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 18, color: THEME.muted, marginTop: 10 },
  error: { fontFamily: FONTS.body, fontSize: 13, color: '#D4574E', marginTop: 12 },
  primary: {
    marginTop: 24,
    height: 54,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: THEME.accentInk },
});
