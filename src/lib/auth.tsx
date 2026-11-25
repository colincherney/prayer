import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { LOCAL_KEYS, readLocal, writeLocal } from './localCache';
import { initializePurchases, purchasesAvailable, signOutOfPurchases } from './purchases';
import { clearWinter, refreshAllEvents } from './winterEvent';
import { passwordCheckClient, supabase } from './supabase';

/** Which emailed code is being entered: sign-in, a new sign-up, or a guest adding an email to their account. */
export type EmailCodeKind = 'email' | 'signup' | 'email_change';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  accountTourPending: boolean;
  finishAccountTour: () => void;
  emailSignInCodes: boolean;
  setEmailSignInCodes: (enabled: boolean) => Promise<{ error: string | null }>;
  /** Signs in with a password or reports which email code the app needs next. */
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; kind?: EmailCodeKind; signedIn?: boolean }>;
  /** Creates the account; Supabase emails a code that confirms it. */
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null; signedIn: boolean }>;
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
  /** Checks the reset code and sets the new password before returning to normal sign-in. */
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ error: string | null }>;
  /** Emails a one-time code to the signed-in account's address, to confirm deleting it. */
  sendDeleteCode: (email: string) => Promise<{ error: string | null }>;
  /** Starts moving a signed-in account to a new email; Supabase emails a code that has to be entered first. */
  changeEmail: (newEmail: string) => Promise<{ error: string | null }>;
  /** Re-reads the user from the server, so a just-confirmed email is noticed without signing in again. */
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const PASSWORD_MIN = 8;
// Match the symbols in Supabase Auth's required character set.
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export const PASSWORD_REQUIREMENTS = `Use at least ${PASSWORD_MIN} characters, including uppercase and lowercase letters, a digit, and a symbol.`;

/** Validate new passwords. Existing credentials still go through the regular sign-in flow. */
export function passwordProblem(pw: string): string | null {
  const characters = Array.from(pw);
  const shortBy = PASSWORD_MIN - characters.length;
  const missing: string[] = [];
  if (shortBy > 0) missing.push(`${shortBy} more character${shortBy === 1 ? '' : 's'}`);
  if (!/[a-z]/.test(pw)) missing.push('a lowercase letter');
  if (!/[A-Z]/.test(pw)) missing.push('an uppercase letter');
  if (!/[0-9]/.test(pw)) missing.push('a digit');
  if (!characters.some(character => PASSWORD_SYMBOLS.includes(character))) missing.push('a symbol');
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
  if (/rate limit/i.test(message)) return 'Too many emails have gone out in the last hour. Please try again a bit later.';
  return message;
}

/** How long a phone stays remembered after a code is entered on it. */
export const REMEMBER_DAYS = 30;
const rememberKey = (email: string) => `remembered-phone:${email.trim().toLowerCase()}`;
const EMAIL_SIGN_IN_CODES = 'email_sign_in_codes_enabled_at';

// This account preference controls the app's sign-in flow. Supabase treats password and email OTP as separate sign-in methods.
function emailCodeEnrollment(user: User | null | undefined): string | null {
  if (!user) return null;
  const enabledAt: unknown = user.user_metadata[EMAIL_SIGN_IN_CODES];
  return typeof enabledAt === 'string' && enabledAt ? `${user.id}:${enabledAt}` : null;
}

// A remembered phone only skips the emailed code; the password is still checked by Supabase every time.
async function isRemembered(email: string, enrollment: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(rememberKey(email));
    const remembered: { enrollment: string; until: number } | null = stored ? JSON.parse(stored) : null;
    return remembered?.enrollment === enrollment && Number.isFinite(remembered.until) && remembered.until > Date.now();
  } catch {
    return false;
  }
}

async function rememberPhone(email: string, enrollment: string) {
  try {
    const until = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem(rememberKey(email), JSON.stringify({ enrollment, until }));
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

type AccountTourStatus = 'pending' | 'finished';
type AccountTours = Partial<Record<string, AccountTourStatus>>;

function readAccountTours(): AccountTours {
  const saved = readLocal<AccountTours | string[]>(LOCAL_KEYS.accountTours);
  // Earlier versions kept only the IDs with a pending tour.
  return Array.isArray(saved) ? Object.fromEntries(saved.map(id => [id, 'pending'])) : saved ?? {};
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountTours, setAccountTours] = useState(readAccountTours);

  const sessionUserId = session?.user.id;
  const isGuest = session?.user.is_anonymous === true;
  const accountUserId = isGuest ? undefined : sessionUserId;

  function updateAccountTour(userId: string, status: AccountTourStatus) {
    const current = readAccountTours();
    if (current[userId] === status || current[userId] === 'finished') return;
    const next = { ...current, [userId]: status };
    writeLocal(LOCAL_KEYS.accountTours, next).catch(() => {});
    setAccountTours(next);
  }

  useEffect(() => {
    if (!accountUserId || !purchasesAvailable) return;
    const refresh = () => initializePurchases(accountUserId).catch(() => {});
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => listener.remove();
  }, [accountUserId]);

  useEffect(() => {
    let userId: string | null | undefined;
    supabase.auth.getSession().then(({ data, error }) => {
      // A saved login the server no longer knows (expired, or signed out elsewhere): drop it on this phone so the
      // app starts clean at sign-in instead of retrying a dead token.
      if (error && /refresh token/i.test(error.message)) {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
      setSession(data.session);
      setLoading(false);
      userId ??= data.session?.user.id ?? null;
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Another account now (signed out, a guest, someone else logging in): the last account's event progress (its
      // companions, its stages) must not carry over. Then load the new account's, outside this callback (Supabase
      // calls made inside it can stall).
      const nextId = next?.user.id ?? null;
      if (userId !== undefined && nextId !== userId) {
        clearWinter();
        if (nextId) setTimeout(() => refreshAllEvents(true).catch(() => {}), 0);
      }
      userId = nextId;
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

  const setEmailSignInCodes: AuthContextValue['setEmailSignInCodes'] = async enabled => {
    if (!session?.user.email || session.user.is_anonymous) {
      return { error: 'Sign in with an email address to change this setting.' };
    }
    const { error } = await supabase.auth.updateUser({
      data: { [EMAIL_SIGN_IN_CODES]: enabled ? new Date().toISOString() : null },
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
    if (!data.session) return { error: 'Could not start your sign-in. Please try again.' };

    const enrollment = emailCodeEnrollment(data.session.user);
    if (!enrollment || await isRemembered(email, enrollment)) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (!sessionError) return { error: null, signedIn: true };
      await passwordCheckClient.auth.signOut({ scope: 'local' });
      return { error: friendlyError(sessionError.message) };
    }

    // Drop the password session before starting the opted-in code step.
    await passwordCheckClient.auth.signOut({ scope: 'local' });
    const sent = await sendSignInCode(email);
    return { error: sent.error, kind: 'email' };
  };

  const signUpWithPassword: AuthContextValue['signUpWithPassword'] = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.session) updateAccountTour(data.session.user.id, 'pending');
    return { error: friendlyError(error?.message), signedIn: Boolean(data.session) };
  };

  const verifyEmailCode: AuthContextValue['verifyEmailCode'] = async (email, code, kind, remember) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: kind });
    if (!error && data.user) {
      const guestUpgrade = kind === 'email_change' && session?.user.is_anonymous && session.user.id === data.user.id;
      if (kind === 'signup' || guestUpgrade) updateAccountTour(data.user.id, 'pending');
    }
    if (!error && remember && kind === 'email') {
      const enrollment = emailCodeEnrollment(data.user);
      if (enrollment) await rememberPhone(email, enrollment);
    }
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

  const tourStatus = sessionUserId ? accountTours[sessionUserId] : undefined;

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isGuest,
        accountTourPending: tourStatus === 'pending' || (isGuest && tourStatus !== 'finished'),
        finishAccountTour: () => {
          if (sessionUserId) updateAccountTour(sessionUserId, 'finished');
        },
        emailSignInCodes: emailCodeEnrollment(session?.user) !== null,
        setEmailSignInCodes,
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
