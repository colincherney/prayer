import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, View } from 'react-native';

import { passwordProblem, PASSWORD_MIN, type EmailCodeKind, useAuth } from '@/lib/auth';

import { AuthButton, AuthModeSwitch, type AuthMode } from './AuthControls';
import { AuthCredentials } from './AuthField';
import { AuthHeading, AuthMessage, AuthPrivacy, AuthScreen, AuthTextLink } from './AuthScreen';
import { EmailCodeStep } from './EmailCodeStep';
import { LockIcon, UserIcon } from './Icons';
import { LegalLinks } from './LegalLinks';
import { authHaptic } from './authHaptics';

export function AuthEntry({ initialMode = null }: { initialMode?: AuthMode | null }) {
  const { signInAnonymously, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeKind, setCodeKind] = useState<EmailCodeKind | null>(null);

  const newAccount = mode === 'signup';
  const cleanEmail = email.trim();
  const passwordIssue = newAccount ? passwordProblem(password) : null;
  const passwordReady = newAccount ? !passwordIssue : password.length >= 6;
  const canSubmit = mode !== null && cleanEmail.includes('@') && passwordReady && !busy;

  const chooseMode = useCallback((next: AuthMode | null) => {
    Keyboard.dismiss();
    setPassword('');
    setError(null);
    setMode(next);
  }, []);

  const goBack = useCallback(() => {
    if (mode === null) return false;
    if (busy) return true;
    if (codeKind) {
      Keyboard.dismiss();
      setCodeKind(null);
    } else {
      chooseMode(null);
    }
    return true;
  }, [busy, chooseMode, codeKind, mode]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, [goBack]));

  const onGuest = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: guestError } = await signInAnonymously();
    setBusy(false);
    authHaptic(guestError ? 'error' : 'success');
    if (guestError) setError(guestError);
    // RootStack handles the destination, including requests opened from a widget.
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = newAccount
      ? { ...await signUpWithPassword(cleanEmail, password), kind: 'signup' as const, signedIn: false }
      : await signInWithPassword(cleanEmail, password);
    setBusy(false);

    if (result.error || (!result.signedIn && !result.kind)) {
      authHaptic('error');
      setError(result.error ?? 'Something went wrong. Please try again.');
      return;
    }

    authHaptic('success');
    if (!result.signedIn && result.kind) setCodeKind(result.kind);
  };

  const step = codeKind ? 'code' : mode === null ? 'welcome' : 'credentials';
  const passwordHint = password ? passwordIssue : `Use ${PASSWORD_MIN}+ characters, upper and lowercase letters, a number, and a symbol.`;

  return (
    <AuthScreen step={step} onBack={mode ? goBack : undefined}>
      {codeKind ? (
        <EmailCodeStep authScene email={cleanEmail} kind={codeKind} />
      ) : mode === null ? (
        <>
          <AuthHeading title="Welcome" centered>Pray anonymously and lift others up.</AuthHeading>
          <View style={styles.actions}>
            <AuthButton label="Create account" icon={UserIcon} onPress={() => chooseMode('signup')} disabled={busy} />
            <AuthButton label="Log in" icon={LockIcon} secondary onPress={() => chooseMode('login')} disabled={busy} />
          </View>
          <AuthTextLink label={busy ? 'Opening Saint Central…' : 'Continue as guest'} onPress={onGuest} disabled={busy} />
          {error ? <AuthMessage error>{error}</AuthMessage> : null}
          <AuthPrivacy>You’ll need an account to recover your activity if you change devices.</AuthPrivacy>
          <LegalLinks />
        </>
      ) : (
        <>
          <AuthHeading title={newAccount ? 'Create your account' : 'Welcome back'}>
            {newAccount ? 'Save your prayers, reflections, and companion.' : 'Pick up with your prayers and reflections.'}
          </AuthHeading>
          <AuthModeSwitch active={mode} onSelect={chooseMode} disabled={busy} />
          <AuthCredentials
            key={mode}
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={onSubmit}
            newAccount={newAccount}
            busy={busy}
          />
          {newAccount ? (
            passwordHint ? <AuthMessage>{passwordHint}</AuthMessage> : null
          ) : (
            <View style={styles.recovery}>
              <AuthTextLink
                end
                label="Forgot password?"
                onPress={() => router.push({ pathname: '/auth/forgot', params: { email: cleanEmail } })}
                disabled={busy}
              />
            </View>
          )}
          {error ? <AuthMessage error>{error}</AuthMessage> : null}
          <AuthButton
            label={newAccount ? 'Create account' : 'Log in'}
            busyLabel={newAccount ? 'Creating account…' : 'Logging in…'}
            busy={busy}
            disabled={!canSubmit}
            onPress={onSubmit}
          />
          <AuthPrivacy>Your email stays private when you share prayers.</AuthPrivacy>
          {newAccount ? <LegalLinks /> : null}
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 12, marginTop: 3 },
  recovery: { marginTop: -9, marginBottom: -7 },
});
