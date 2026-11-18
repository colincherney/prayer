import { router } from 'expo-router';
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

import { AuthField } from '@/components/saint/AuthField';
import { AuthButton } from '@/components/saint/AuthControls';
import { AuthHeading, AuthMessage, AuthTextLink } from '@/components/saint/AuthScreen';
import { PrimaryButton, Squiggle } from '@/components/saint/Common';
import { ArrowIcon, BackIcon, CheckIcon, ShieldIcon } from '@/components/saint/Icons';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { useAuthTheme } from '@/components/saint/authAppearance';
import { authHaptic } from '@/components/saint/authHaptics';
import { FONTS, THEME } from '@/components/saint/theme';
import { type EmailCodeKind, emailCooldown, REMEMBER_DAYS, useAuth } from '@/lib/auth';

// Must match "Email OTP Length" in Supabase (Authentication → Sign In / Providers → Email). This project sends 8.
export const CODE_LENGTH = 8;
const MIN_CODE = CODE_LENGTH;
const MAX_CODE = 10;
const RESEND_WAIT_S = 60;

/**
 * The second step of signing in or up: enter the code we just emailed.
 * A correct code creates the session, and the root layout then leaves the auth screens.
 */
export function EmailCodeStep({
  email,
  kind,
  onBack,
  onVerified,
  message,
  verify,
  authScene = false,
}: {
  email: string;
  kind: EmailCodeKind;
  onBack?: () => void;
  /** Runs after a correct code. Sign-in navigation is handled by RootStack. */
  onVerified?: () => void | Promise<void>;
  /** Replaces the whole "We sent a code to …" line. */
  message?: string;
  /** Checks the code some other way than the usual one for `email` and `kind`. */
  verify?: (code: string) => Promise<{ error: string | null }>;
  authScene?: boolean;
}) {
  const theme = useAuthTheme();
  const { verifyEmailCode, resendEmailCode } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_WAIT_S);
  const canRemember = !verify && kind === 'email';
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const canSubmit = code.length >= MIN_CODE && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setNote(null);
    const { error: e } = verify ? await verify(code) : await verifyEmailCode(email, code, kind, canRemember && remember);
    setBusy(false);
    if (authScene) authHaptic(e ? 'error' : 'success');
    if (e) {
      setError(/expired|invalid/i.test(e) ? 'That code is wrong or has expired. Try again or send a new one.' : e);
      return;
    }
    if (onVerified) await onVerified();
    else if (kind === 'email_change') router.replace('/');
  };

  const onResend = async () => {
    if (wait > 0 || busy) return;
    setError(null);
    setNote(null);
    const { error: e } = await resendEmailCode(email, kind);
    if (authScene) authHaptic(e ? 'error' : 'success');
    if (e) {
      const left = emailCooldown(e);
      if (left !== null) setWait(left);
      else setError(e);
      return;
    }
    setCode('');
    setNote('A new code is on its way.');
    setWait(RESEND_WAIT_S);
  };

  const instructions = kind === 'email'
    ? 'Enter it to finish signing in.'
    : kind === 'signup'
      ? 'Enter it to confirm your account.'
      : 'Enter it to finish creating your account. Everything you’ve built comes with you.';
  const resendLabel = wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code';
  const rememberOption = canRemember ? (
    <Pressable
      onPress={() => {
        if (authScene) authHaptic('select');
        setRemember(r => !r);
      }}
      style={[styles.rememberRow, authScene && { minHeight: 44 }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: remember }}>
      <View style={[
        styles.checkbox,
        remember && styles.checkboxOn,
        authScene && { borderColor: theme.inkSoft, backgroundColor: remember ? theme.ink : 'transparent' },
      ]}>
        {remember ? <CheckIcon size={12} color={authScene ? theme.bg : THEME.cardDarkInk} /> : null}
      </View>
      <Text style={[styles.rememberText, authScene && { color: theme.inkSoft }]}>
        Remember this phone for {REMEMBER_DAYS} days
      </Text>
    </Pressable>
  ) : null;

  if (authScene) {
    return (
      <>
        <AuthHeading title="Check your" accent="inbox.">
          {message ?? <>We sent a code to <Text style={{ fontFamily: FONTS.bodySemi }}>{email}</Text>. {instructions}</>}
        </AuthHeading>
        <AuthField
          label="Email verification code"
          value={code}
          onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, MAX_CODE))}
          onSubmitEditing={onSubmit}
          placeholder={'0'.repeat(CODE_LENGTH)}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          editable={!busy}
          autoFocus
          maxLength={MAX_CODE}
        />
        {error ? <AuthMessage error>{error}</AuthMessage> : null}
        {note ? <AuthMessage>{note}</AuthMessage> : null}
        {rememberOption}
        <AuthButton label="Continue" busyLabel="Checking code…" busy={busy} disabled={!canSubmit} onPress={onSubmit} />
        <AuthTextLink label={resendLabel} disabled={wait > 0 || busy} onPress={onResend} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
              <BackIcon size={16} color={THEME.ink} />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <View style={styles.icon}>
              <ShieldIcon size={24} color={THEME.pillInk} />
            </View>
            <Text style={styles.title}>
              Check your <Text style={styles.titleItalic}>inbox</Text>.
            </Text>
            <View style={{ marginTop: 12 }}>
              <Squiggle color={THEME.accent} w={56} />
            </View>
            <Text style={styles.subtitle}>
              {message ?? (
                <>
                  We sent a code to <Text style={styles.email}>{email}</Text>. {instructions}
                </>
              )}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Code</Text>
            <View style={[styles.inputWrap, styles.inputWrapFocused]}>
              <TextInput
                value={code}
                onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, MAX_CODE))}
                onSubmitEditing={onSubmit}
                placeholder={'0'.repeat(CODE_LENGTH)}
                placeholderTextColor={THEME.muted}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                autoFocus
                maxLength={MAX_CODE}
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {note ? <Text style={styles.noteText}>{note}</Text> : null}

            {rememberOption}

            <Pressable onPress={onResend} disabled={wait > 0} hitSlop={8}>
              <Text style={[styles.resend, wait > 0 && { opacity: 0.5 }]}>
                {resendLabel}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? '' : 'Continue'}
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
          />
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
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.displaySemi,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
    color: THEME.ink,
    marginTop: 22,
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
  email: { fontFamily: FONTS.bodySemi, color: THEME.ink },
  form: { paddingHorizontal: 22, gap: 10 },
  label: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.6,
    color: THEME.muted,
    textTransform: 'uppercase',
  },
  inputWrap: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapFocused: { borderColor: THEME.accent },
  input: {
    fontFamily: FONTS.bodySemi,
    fontSize: 24,
    letterSpacing: 8,
    color: THEME.ink,
    paddingVertical: 14,
  },
  errorText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.accent },
  noteText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.pillInk },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: THEME.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: THEME.cardDark, borderColor: THEME.cardDark },
  rememberText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: THEME.inkSoft },
  resend: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: THEME.ink,
    paddingVertical: 8,
  },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
});
