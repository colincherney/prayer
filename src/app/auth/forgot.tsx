import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { PrimaryButton, Squiggle } from '@/components/saint/Common';
import { ArrowIcon, BackIcon, CheckIcon } from '@/components/saint/Icons';
import { CODE_LENGTH } from '@/components/saint/EmailCodeStep';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, THEME } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { emailCooldown, useAuth } from '@/lib/auth';

type Step = 'email' | 'reset' | 'done';
type FieldKey = 'email' | 'code' | 'pass' | null;

const RESEND_WAIT_S = 60;

/** Forgot password: email a code, then enter it with a new password. Afterwards the person logs in as usual. */
export default function ForgotPasswordScreen() {
  const fontsLoaded = useSaintFonts();
  const params = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordReset, resetPasswordWithCode } = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [focused, setFocused] = useState<FieldKey>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const cleanEmail = email.trim();

  const friendly = (e: string) =>
    /expired|invalid/i.test(e)
        ? 'That code is wrong or has expired. Try again or send a new one.'
        : /same.*password|different from the old/i.test(e)
          ? 'Pick a password different from your old one.'
          : e;

  const sendCode = async () => {
    if (!cleanEmail.includes('@') || busy || wait > 0) return;
    setBusy(true);
    setError(null);
    setNote(null);
    const { error: e } = await sendPasswordReset(cleanEmail);
    setBusy(false);
    if (e) {
      const left = emailCooldown(e);
      if (left !== null) setWait(left);
      setError(friendly(e));
      return;
    }
    if (step === 'reset') setNote('A new code is on its way.');
    setStep('reset');
    setWait(RESEND_WAIT_S);
  };

  const canReset = code.length >= CODE_LENGTH && password.length >= 6 && !busy;

  const onReset = async () => {
    if (!canReset) return;
    setBusy(true);
    setError(null);
    setNote(null);
    const { error: e } = await resetPasswordWithCode(cleanEmail, code, password);
    setBusy(false);
    if (e) {
      setError(friendly(e));
      return;
    }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.doneRoot}>
          <View style={styles.doneIcon}>
            <CheckIcon size={28} color={THEME.pillInk} />
          </View>
          <Text style={styles.doneTitle}>
            Password <Text style={styles.titleItalic}>reset</Text>.
          </Text>
          <Text style={styles.doneBody}>Log in with your new password to pick up where you left off.</Text>
        </View>
        <View style={styles.footer}>
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

  const inputWrap = (key: FieldKey) => [styles.inputWrap, focused === key && styles.inputWrapFocused];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => (step === 'reset' ? setStep('email') : router.back())}
              style={styles.backBtn}
              hitSlop={8}
              accessibilityLabel="Back">
              <BackIcon size={16} color={THEME.ink} />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>
              Forgot your{'\n'}
              <Text style={styles.titleItalic}>password</Text>?
            </Text>
            <View style={{ marginTop: 12 }}>
              <Squiggle color={THEME.accent} w={62} />
            </View>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? 'Enter your email and we’ll send you a code to set a new one.'
                : `If ${cleanEmail} has an account, a code is on its way. Enter it with your new password.`}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'email' ? (
              <View>
                <Text style={styles.label}>Email</Text>
                <View style={inputWrap('email')}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    onSubmitEditing={sendCode}
                    placeholder="you@example.com"
                    placeholderTextColor={THEME.muted}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    style={styles.input}
                  />
                </View>
              </View>
            ) : (
              <>
                <View>
                  <Text style={styles.label}>Code</Text>
                  <View style={inputWrap('code')}>
                    <TextInput
                      value={code}
                      onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 10))}
                      onFocus={() => setFocused('code')}
                      onBlur={() => setFocused(null)}
                      placeholder={'0'.repeat(CODE_LENGTH)}
                      placeholderTextColor={THEME.muted}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      autoFocus
                      maxLength={10}
                      style={[styles.input, styles.codeInput]}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.label}>New password</Text>
                  <View style={inputWrap('pass')}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocused('pass')}
                      onBlur={() => setFocused(null)}
                      onSubmitEditing={onReset}
                      placeholder="At least 6 characters"
                      placeholderTextColor={THEME.muted}
                      secureTextEntry={!showPass}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      style={styles.input}
                    />
                    <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8}>
                      <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable onPress={sendCode} disabled={wait > 0 || busy} hitSlop={8}>
                  <Text style={[styles.resend, wait > 0 && { opacity: 0.5 }]}>
                    {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
                  </Text>
                </Pressable>
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {note ? <Text style={styles.noteText}>{note}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {step === 'email' ? (
            <PrimaryButton
              label={busy ? '' : wait > 0 ? `Send code (${wait}s)` : 'Send code'}
              onPress={sendCode}
              disabled={!cleanEmail.includes('@') || busy || wait > 0}
              bg={THEME.cardDark}
              fg={THEME.cardDarkInk}
              rightIcon={busy ? <ActivityIndicator color={THEME.cardDarkInk} /> : <ArrowIcon size={16} color={THEME.cardDarkInk} />}
            />
          ) : (
            <PrimaryButton
              label={busy ? '' : 'Set new password'}
              onPress={onReset}
              disabled={!canReset}
              bg={THEME.cardDark}
              fg={THEME.cardDarkInk}
              rightIcon={busy ? <ActivityIndicator color={THEME.cardDarkInk} /> : <ArrowIcon size={16} color={THEME.cardDarkInk} />}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  scroll: { paddingBottom: 12 },
  topRow: { paddingHorizontal: 22, paddingTop: 6, flexDirection: 'row' },
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
  hero: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 24 },
  title: {
    fontFamily: FONTS.displaySemi,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.1,
    color: THEME.ink,
  },
  titleItalic: { fontFamily: FONTS.display, color: THEME.accent },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: THEME.inkSoft,
    marginTop: 14,
    maxWidth: 320,
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
  inputWrapFocused: { borderColor: THEME.accent },
  input: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: THEME.ink,
    paddingVertical: 16,
    flex: 1,
  },
  codeInput: { fontFamily: FONTS.bodySemi, fontSize: 22, letterSpacing: 6, paddingVertical: 12 },
  showHide: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: THEME.pillInk,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  resend: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.ink, paddingVertical: 4 },
  errorText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.accent },
  noteText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.pillInk },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  doneRoot: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  doneIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  doneTitle: {
    fontFamily: FONTS.displaySemi,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: THEME.ink,
    textAlign: 'center',
  },
  doneBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: THEME.inkSoft,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 320,
  },
});
