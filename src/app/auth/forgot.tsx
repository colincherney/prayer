import { useLocalSearchParams } from 'expo-router';
import { router } from '@/lib/nav';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/saint/AuthControls';
import { AuthField } from '@/components/saint/AuthField';
import {
  AuthHeading,
  AuthMessage,
  AuthScreen,
  AuthTextLink,
  backFromAuth,
} from '@/components/saint/AuthScreen';
import { authHaptic } from '@/components/saint/authHaptics';
import { CODE_LENGTH } from '@/components/saint/EmailCodeStep';
import { emailCooldown, passwordProblem, PASSWORD_REQUIREMENTS, useAuth } from '@/lib/auth';

type Step = 'email' | 'reset' | 'done';

const RESEND_WAIT_S = 60;

/** Forgot password: email a code, then enter it with a new password. Afterwards the person logs in as usual. */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordReset, resetPasswordWithCode } = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const [step, setStep] = useState<Step>('email');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

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
    authHaptic(e ? 'error' : 'success');
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

  const pwProblem = passwordProblem(password);
  const canReset = code.length >= CODE_LENGTH && !pwProblem && !busy;

  const onReset = async () => {
    if (!canReset) return;
    setBusy(true);
    setError(null);
    setNote(null);
    const { error: e } = await resetPasswordWithCode(cleanEmail, code, password);
    setBusy(false);
    authHaptic(e ? 'error' : 'success');
    if (e) {
      setError(friendly(e));
      return;
    }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <AuthScreen immersive step="done" onBack={() => router.replace('/auth/login')}>
        <AuthHeading title="Password" accent="reset.">
          Log in with your new password to pick up where you left off.
        </AuthHeading>
        <AuthButton label="Back to log in" onPress={() => router.replace('/auth/login')} />
      </AuthScreen>
    );
  }

  const enteringEmail = step === 'email';

  return (
    <AuthScreen immersive step={step} onBack={() => (enteringEmail ? backFromAuth() : setStep('email'))}>
      {enteringEmail ? (
        <>
          <AuthHeading title="Forgot your" accent="password?">
            Enter your email to get a code for setting a new password.
          </AuthHeading>
          <AuthField
            key="email"
            label="Email address"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendCode}
            editable={!busy}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="send"
          />
        </>
      ) : (
        <>
          <AuthHeading title="Reset your" accent="password.">
            If {cleanEmail} has an account, a code is on its way. Enter it with your new password.
          </AuthHeading>
          <AuthField
            key="code"
            label="Password reset code"
            value={code}
            onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 10))}
            placeholder={'0'.repeat(CODE_LENGTH)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            editable={!busy}
            autoFocus
            maxLength={10}
          />
          <AuthField
            label="New password"
            password
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onReset}
            editable={!busy}
            placeholder="Choose a password"
            autoComplete="new-password"
            returnKeyType="done"
          />
          {!password ? <AuthMessage>{PASSWORD_REQUIREMENTS}</AuthMessage> : pwProblem ? <AuthMessage>{pwProblem}</AuthMessage> : null}
        </>
      )}

      {error ? <AuthMessage error>{error}</AuthMessage> : null}
      {note ? <AuthMessage>{note}</AuthMessage> : null}
      {enteringEmail ? (
        <AuthButton
          label={wait > 0 ? `Send code (${wait}s)` : 'Send code'}
          busyLabel="Sending code…"
          busy={busy}
          disabled={!cleanEmail.includes('@') || busy || wait > 0}
          onPress={sendCode}
        />
      ) : (
        <>
          <AuthButton
            label="Set new password"
            busyLabel="Setting password…"
            busy={busy}
            disabled={!canReset}
            onPress={onReset}
          />
          <AuthTextLink
            label={wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
            disabled={wait > 0 || busy}
            onPress={sendCode}
          />
        </>
      )}
    </AuthScreen>
  );
}
