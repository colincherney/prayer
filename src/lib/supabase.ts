import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * A throwaway client used only to check a password during two-step sign-in.
 * It never saves its session, so a correct password alone doesn't sign anyone in;
 * the real session comes from the emailed code on the main client.
 */
export const passwordCheckClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'password-check',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
