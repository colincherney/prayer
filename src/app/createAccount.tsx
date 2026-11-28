import { router } from '@/lib/nav';
import { useState } from 'react';

import { AuthButton } from '@/components/saint/AuthControls';
import { AuthCredentials } from '@/components/saint/AuthField';
import {
  AuthHeading,
  AuthMessage,
  AuthPrivacy,
  AuthScreen,
} from '@/components/saint/AuthScreen';
import { authHaptic } from '@/components/saint/authHaptics';
import { EmailCodeStep } from '@/components/saint/EmailCodeStep';
import { LegalLinks } from '@/components/saint/LegalLinks';
import { passwordProblem, PASSWORD_REQUIREMENTS, useAuth } from '@/lib/auth';

/**
 * Turns an anonymous session into a real account without starting over: the same user, now with an email and
 * password, so everything built so far comes along.
 */
export default function CreateAccountScreen() {
  const { isGuest, upgradeToAccount, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const pwProblem = passwordProblem(password);
  const cleanEmail = email.trim();
  const canSubmit = cleanEmail.includes('@') && !pwProblem && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const { error: e } = await upgradeToAccount(cleanEmail, password);
    setBusy(false);
    authHaptic(e ? 'error' : 'success');
    if (e) {
      // Supabase's email sender has a small hourly limit; say what happened instead of showing its raw message.
      setError(
        /already been registered|already registered|email_exists/i.test(e)
          ? 'That email already has its own account. Deleting this guest account doesn\'t remove it. To use that account, sign out and log in with the email instead.'
          : e,
      );
      return;
    }
    setSentTo(cleanEmail);
  };

  const done = sentTo !== null && !isGuest;

  const goBack = () => router.back();

  if (sentTo && isGuest) {
    return (
      <AuthScreen step="code" onBack={() => setSentTo(null)}>
        <EmailCodeStep authScene email={sentTo} kind="email_change" onVerified={refreshUser} />
      </AuthScreen>
    );
  }

  if (!isGuest) {
    return (
      <AuthScreen onBack={goBack}>
        {done ? (
          <AuthHeading title="You’re" accent="all set.">
            Your account is ready. Log in on another device to pick up where you left off.
          </AuthHeading>
        ) : (
          <AuthHeading title="You already have" accent="an account." />
        )}
        <AuthButton label="Done" onPress={goBack} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen onBack={goBack}>
      <AuthHeading title="Keep what you’ve" accent="built.">
        Add an email and password to save your prayers, notes, and companion if you change phones.
      </AuthHeading>
      <AuthCredentials
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={onSubmit}
        busy={busy}
        newAccount
      />
      {password ? (
        pwProblem ? <AuthMessage>{pwProblem}</AuthMessage> : null
      ) : (
        <AuthMessage>{PASSWORD_REQUIREMENTS}</AuthMessage>
      )}
      {error ? <AuthMessage error>{error}</AuthMessage> : null}
      <AuthButton
        label="Create my account"
        busyLabel="Creating account…"
        busy={busy}
        disabled={!canSubmit}
        onPress={onSubmit}
      />
      <AuthPrivacy>Your email stays private when you share prayers.</AuthPrivacy>
      <LegalLinks />
    </AuthScreen>
  );
}
