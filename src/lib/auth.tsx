import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { signOutOfPurchases } from './purchases';
import { supabase } from './supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAnonymously: () => Promise<{ error: string | null }>;
  /**
   * Turns the current anonymous session into a real account by attaching an email and password to the same user.
   * Everything already saved (prayers, notes, companion progress) stays, because the user id does not change.
   * Supabase emails a confirmation link; the account becomes permanent once it is tapped.
   */
  upgradeToAccount: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Re-reads the user from the server, so a just-confirmed email is noticed without signing in again. */
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signInWithPassword: AuthContextValue['signInWithPassword'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword: AuthContextValue['signUpWithPassword'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signInAnonymously: AuthContextValue['signInAnonymously'] = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error?.message ?? null };
  };

  const upgradeToAccount: AuthContextValue['upgradeToAccount'] = async (email, password) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    return { error: error?.message ?? null };
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
        signInAnonymously,
        upgradeToAccount,
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
