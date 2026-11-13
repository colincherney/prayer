import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { EmailCodeStep } from '@/components/saint/EmailCodeStep';
import { BackIcon } from '@/components/saint/Icons';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { forgetPhone, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/** Calls the delete-account function, turning its error replies into readable text. */
async function deleteOnServer(code?: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('delete-account', { body: code ? { code } : {} });
  if (!error && data?.ok !== false) return { error: null };
  let message: string | undefined = data?.error;
  // A refused request comes back as an error whose body holds the function's own message.
  const context = (error as { context?: Response } | null)?.context;
  if (!message && context && typeof context.json === 'function') {
    try {
      message = (await context.json())?.error;
    } catch {}
  }
  if (message === 'code_required') message = 'Enter the code we emailed you.';
  return { error: message || error?.message || 'Could not delete the account. Please try again in a moment.' };
}

/**
 * Deleting an account with an email needs a code sent to that email, and the delete-account function checks it,
 * so someone holding an unlocked phone can't wipe the account. Guests have no email, so they just confirm.
 */
export default function DeleteAccountScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { session, isGuest, signOut, sendDeleteCode } = useAuth();
  const email = session?.user?.email ?? '';
  const needsCode = !isGuest && !!email;
  const [step, setStep] = useState<'confirm' | 'code'>('confirm');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const finish = async () => {
    await forgetPhone(email);
    await signOut();
    router.replace('/auth');
  };

  const onContinue = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    if (needsCode) {
      const { error: e } = await sendDeleteCode(email);
      setBusy(false);
      if (e) setError(e);
      else setStep('code');
      return;
    }
    const { error: e } = await deleteOnServer();
    if (e) {
      setBusy(false);
      setError(e);
      return;
    }
    await finish();
  };

  if (step === 'code') {
    return (
      <EmailCodeStep
        email={email}
        kind="email"
        message={`We sent a code to ${email}. Enter it to permanently delete your account. This can't be undone.`}
        onBack={() => setStep('confirm')}
        verify={code => deleteOnServer(code)}
        onVerified={finish}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <BackIcon size={16} color={THEME.ink} />
        </Pressable>

        <Text style={styles.title}>
          Delete your <Text style={styles.titleItalic}>account</Text>?
        </Text>
        <Text style={styles.body}>
          This permanently removes your account, your prayers, the notes you sent, and the prayers others sent in
          response. It can&apos;t be undone.
        </Text>
        {needsCode ? (
          <Text style={styles.body}>To make sure it&apos;s really you, we&apos;ll email a code to {email}.</Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onContinue}
          disabled={busy}
          accessibilityRole="button"
          style={[styles.danger, busy && { opacity: 0.6 }]}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.dangerText}>{needsCode ? 'Email me a code' : 'Delete my account'}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.cancel} hitSlop={8}>
          <Text style={styles.cancelText}>Keep my account</Text>
        </Pressable>
      </ScrollView>
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
  error: { fontFamily: FONTS.body, fontSize: 13, color: '#D4574E', marginTop: 14 },
  danger: {
    marginTop: 28,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#A8402F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: '#FFFFFF' },
  cancel: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  cancelText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.ink },
});
