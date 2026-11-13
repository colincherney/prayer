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

import { EmailCodeStep } from '@/components/saint/EmailCodeStep';
import { BackIcon } from '@/components/saint/Icons';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Step = 'form' | 'newCode' | 'currentCode' | 'done';

/**
 * Moves a signed-in account to a new email. Nothing changes until the code sent to the new address is entered.
 * If "Secure email change" is on in Supabase, a second code also goes to the current address and is asked for next.
 */
export default function ChangeEmailScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { session, changeEmail, refreshUser, verifyEmailCode } = useAuth();
  const currentEmail = session?.user?.email ?? '';
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const newEmail = email.trim().toLowerCase();
  const canSubmit = newEmail.includes('@') && newEmail !== currentEmail.toLowerCase() && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const { error: e } = await changeEmail(newEmail);
    setBusy(false);
    if (e) {
      setError(
        /already been registered|already registered|email_exists/i.test(e)
            ? 'That email already belongs to another account.'
            : e,
      );
      return;
    }
    setStep('newCode');
  };

  // Supabase only accepts each code together with the address it was sent to, and the person may enter
  // either inbox's code on either screen. So try the new address first, then the current one.
  const verifyEitherInbox = async (code: string) => {
    const asNew = await verifyEmailCode(newEmail, code, 'email_change');
    if (!asNew.error || !currentEmail) return asNew;
    const asCurrent = await verifyEmailCode(currentEmail, code, 'email_change');
    return asCurrent.error ? asNew : asCurrent;
  };

  // After a code is accepted, the account has moved only if the server now reports the new email.
  // If it hasn't, Supabase is also waiting on the code sent to the current address.
  const afterCode = async () => {
    const { data } = await supabase.auth.getUser();
    await refreshUser();
    setStep(data.user?.email?.toLowerCase() === newEmail ? 'done' : step === 'newCode' ? 'currentCode' : 'done');
  };

  if (step === 'newCode') {
    return (
      <EmailCodeStep
        email={newEmail}
        kind="email_change"
        message={`Codes went to ${newEmail} and to your current email, ${currentEmail}. Enter either one; we’ll ask for the other next. (If only ${newEmail} got one, enter that.)`}
        onBack={() => setStep('form')}
        onVerified={afterCode}
        verify={verifyEitherInbox}
      />
    );
  }

  if (step === 'currentCode') {
    return (
      <EmailCodeStep
        email={newEmail}
        kind="email_change"
        message={`One more: enter the code from the other inbox, the one you haven’t used yet (${newEmail} or ${currentEmail}). Each code only works once.`}
        onBack={() => setStep('form')}
        onVerified={afterCode}
        verify={verifyEitherInbox}
      />
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

          {step === 'done' ? (
            <>
              <Text style={styles.title}>
                Email <Text style={styles.titleItalic}>updated</Text>.
              </Text>
              <Text style={styles.body}>
                You&apos;ll sign in with {session?.user?.email ?? newEmail} from now on. Everything else stays the same.
              </Text>
              <Pressable onPress={() => router.back()} style={styles.primary}>
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                Change your <Text style={styles.titleItalic}>email</Text>.
              </Text>
              <Text style={styles.body}>
                Right now you sign in with {currentEmail}. We&apos;ll send a code to the new address to make sure it&apos;s
                yours.
              </Text>

              <Text style={styles.label}>New email</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={onSubmit}
                  placeholder="you@example.com"
                  placeholderTextColor={THEME.muted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={onSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                style={[styles.primary, !canSubmit && { opacity: 0.5 }]}>
                {busy ? <ActivityIndicator color={THEME.accentInk} /> : <Text style={styles.primaryText}>Send code</Text>}
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
