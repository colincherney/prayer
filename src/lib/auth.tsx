import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { initializePurchases, purchasesAvailable, signOutOfPurchases } from './purchases';
import { passwordCheckClient, supabase } from './supabase';

/** Which emailed code is being entered: sign-in, a new sign-up, or a guest adding an email to their account. */
export type EmailCodeKind = 'email' | 'signup' | 'email_change';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  /**
   * Step one of sign-in: checks the password without signing in, then emails a code.
   * `kind` says which code was sent: 'email' for a normal sign-in, 'signup' when the account was never confirmed.
   * On a phone remembered for this email, there's no code: `signedIn` is true and the person is already in.
   */
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; kind?: EmailCodeKind; signedIn?: boolean }>;
  /** Creates the account; Supabase emails a code that confirms it. */
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Step two: the emailed code signs the person in. `remember` skips the code on this phone for a while. */
  verifyEmailCode: (
    email: string,
    code: string,
    kind: EmailCodeKind,
    remember?: boolean,
  ) => Promise<{ error: string | null }>;
  resendEmailCode: (email: string, kind: EmailCodeKind) => Promise<{ error: string | null }>;
  signInAnonymously: () => Promise<{ error: string | null }>;
  /**
   * Turns the current anonymous session into a real account by attaching an email and password to the same user.
   * Everything already saved (prayers, notes, companion progress) stays, because the user id does not change.
   * Supabase emails a code; the account becomes permanent once it's entered (verifyEmailCode with 'email_change').
   */
  upgradeToAccount: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Emails a password-reset code (Supabase's "Reset password" template). */
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /**
   * Checks the reset code and sets the new password without signing in here,
   * so the person still logs in afterwards with the password and the emailed sign-in code.
   */
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ error: string | null }>;
  /** Emails a one-time code to the signed-in account's address, to confirm deleting it. */
  sendDeleteCode: (email: string) => Promise<{ error: string | null }>;
  /** Starts moving a signed-in account to a new email; Supabase emails a code that has to be entered first. */
  changeEmail: (newEmail: string) => Promise<{ error: string | null }>;
  /** Re-reads the user from the server, so a just-confirmed email is noticed without signing in again. */
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

/**
 * The password rule set in Supabase (Authentication → Sign In / Providers → Email): at least 12 characters with a
 * lowercase letter, an uppercase letter, a digit and a symbol. Keep the two in step. Returns what's still missing,
 * or null when the password is fine. Only new passwords are checked; logging in accepts older, shorter ones.
 */
export const PASSWORD_MIN = 12;
export function passwordProblem(pw: string): string | null {
  const missing: string[] = [];
  if (pw.length < PASSWORD_MIN) missing.push(`${PASSWORD_MIN - pw.length} more character${PASSWORD_MIN - pw.length === 1 ? '' : 's'}`);
  if (!/[a-z]/.test(pw)) missing.push('a lowercase letter');
  if (!/[A-Z]/.test(pw)) missing.push('an uppercase letter');
  if (!/\d/.test(pw)) missing.push('a number');
  if (!/[^A-Za-z0-9]/.test(pw)) missing.push('a symbol');
  return missing.length ? `Still needs ${missing.join(', ')}.` : null;
}

/** Seconds Supabase says to wait before another email can go to this account (one email per address per minute). */
export function emailCooldown(message: string | null | undefined): number | null {
  const m = message ? /after (\d+) seconds?/i.exec(message) : null;
  return m ? Number(m[1]) : null;
}

/** Turns Supabase's email errors into plain words; anything else passes through unchanged. */
function friendlyError(message: string | undefined | null): string | null {
  if (!message) return null;
  const wait = emailCooldown(message);
  if (wait !== null) {
    return `A code was just sent to this account. You can ask for another in ${wait} second${wait === 1 ? '' : 's'}.`;
  }
  if (/weak|password should|password is known/i.test(message)) {
    return `Pick a stronger password: at least ${PASSWORD_MIN} characters with upper and lower case letters, a number and a symbol.`;
  }
  if (/rate limit/i.test(message)) return 'Too many emails have gone out in the last hour. Please try again a bit later.';
  return message;
}

/** How long a phone stays remembered after a code is entered on it. */
export const REMEMBER_DAYS = 30;
const rememberKey = (email: string) => `remembered-phone:${email.trim().toLowerCase()}`;

// A remembered phone only skips the emailed code; the password is still checked by Supabase every time.
async function isRemembered(email: string): Promise<boolean> {
  try {
    const until = Number(await AsyncStorage.getItem(rememberKey(email)));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

async function rememberPhone(email: string) {
  try {
    await AsyncStorage.setItem(rememberKey(email), String(Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000));
  } catch {}
}

/** Forgets this phone for an email, so the next sign-in asks for a code again. */
export async function forgetPhone(email: string | null | undefined) {
  if (!email) return;
  try {
    await AsyncStorage.removeItem(rememberKey(email));
  } catch {}
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const purchasingUserId = session?.user.is_anonymous ? undefined : session?.user.id;
  useEffect(() => {
    if (!purchasingUserId || !purchasesAvailable) return;
    const refresh = () => initializePurchases(purchasingUserId).catch(() => {});
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => listener.remove();
  }, [purchasingUserId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const sendSignInCode = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    return { error: friendlyError(error?.message) };
  };

  const signInWithPassword: AuthContextValue['signInWithPassword'] = async (email, password) => {
    const { data, error } = await passwordCheckClient.auth.signInWithPassword({ email, password });
    if (error?.code === 'email_not_confirmed') {
      // Right password, but the sign-up code was never entered: send a fresh one and confirm that instead.
      const resent = await supabase.auth.resend({ type: 'signup', email });
      return { error: friendlyError(resent.error?.message), kind: 'signup' };
    }
    if (error) return { error: friendlyError(error.message) };
    if (data.session && (await isRemembered(email))) {
      // A code was entered on this phone recently: hand the password's session straight to the app.
      const moved = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (!moved.error) return { error: null, signedIn: true };
    }
    // The password was right. Drop that session so the code is the only way in.
    await passwordCheckClient.auth.signOut({ scope: 'local' });
    const sent = await sendSignInCode(email);
    return { error: sent.error, kind: 'email' };
  };

  const signUpWithPassword: AuthContextValue['signUpWithPassword'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: friendlyError(error?.message) };
  };

  const verifyEmailCode: AuthContextValue['verifyEmailCode'] = async (email, code, kind, remember) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: kind });
    if (!error && remember && kind !== 'email_change') await rememberPhone(email);
    return { error: friendlyError(error?.message) };
  };

  const resendEmailCode: AuthContextValue['resendEmailCode'] = async (email, kind) => {
    if (kind === 'email') return sendSignInCode(email);
    const { error } = await supabase.auth.resend({ type: kind, email });
    return { error: friendlyError(error?.message) };
  };

  const signInAnonymously: AuthContextValue['signInAnonymously'] = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: friendlyError(error?.message) };
  };

  const upgradeToAccount: AuthContextValue['upgradeToAccount'] = async (email, password) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    return { error: friendlyError(error?.message) };
  };

  const sendPasswordReset: AuthContextValue['sendPasswordReset'] = async email => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: friendlyError(error?.message) };
  };

  const resetPasswordWithCode: AuthContextValue['resetPasswordWithCode'] = async (email, code, newPassword) => {
    // The throwaway client holds the short recovery session, so the app itself never becomes signed in here.
    const verified = await passwordCheckClient.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (verified.error) return { error: friendlyError(verified.error.message) };
    const { error } = await passwordCheckClient.auth.updateUser({ password: newPassword });
    await passwordCheckClient.auth.signOut({ scope: 'local' });
    return { error: friendlyError(error?.message) };
  };

  const changeEmail: AuthContextValue['changeEmail'] = async newEmail => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return { error: friendlyError(error?.message) };
  };

  const refreshUser: AuthContextValue['refreshUser'] = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) setSession(data.session);
  };

  const signOut = async () => {
    await signOutOfPurchases();
    await supabase.auth.signOut();
  };

  const isGuest = session?.user?.is_anonymous === true;

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isGuest,
        signInWithPassword,
        signUpWithPassword,
        verifyEmailCode,
        resendEmailCode,
        signInAnonymously,
        upgradeToAccount,
        changeEmail,
        sendDeleteCode: sendSignInCode,
        sendPasswordReset,
        resetPasswordWithCode,
        refreshUser,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
