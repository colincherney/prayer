import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationPrefs = {
  comments_enabled: boolean;
  social_proof_enabled: boolean;
  daily_reminder_enabled: boolean;
  daily_reminder_hour: number | null;
  timezone: string | null;
};

export const DEFAULT_PREFS: NotificationPrefs = {
  comments_enabled: true,
  social_proof_enabled: true,
  daily_reminder_enabled: false,
  daily_reminder_hour: null,
  timezone: null,
};

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Prayer notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#208AEF',
  });
}

// Returns the Expo push token, or null if unavailable / denied.
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators can't receive push

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data ?? null;
  } catch (e) {
    console.warn('expo push token failed', e);
    return null;
  }
}

// Persists the push token + ensures a preferences row exists with the user's tz.
export async function savePushToken(userId: string, token: string) {
  const platform: 'ios' | 'android' | 'web' =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  const { error: tErr } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
  if (tErr) console.warn('push_tokens upsert failed', tErr);

  // Ensure a prefs row exists so cron jobs can read defaults; capture timezone.
  const tz = detectTimezone();
  const { error: pErr } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        timezone: tz,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id', ignoreDuplicates: false },
    );
  if (pErr) console.warn('prefs upsert failed', pErr);
}

export async function loadPrefs(userId: string): Promise<NotificationPrefs> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('comments_enabled, social_proof_enabled, daily_reminder_enabled, daily_reminder_hour, timezone')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return { ...DEFAULT_PREFS, timezone: detectTimezone() };
  return {
    comments_enabled: data.comments_enabled ?? true,
    social_proof_enabled: data.social_proof_enabled ?? true,
    daily_reminder_enabled: data.daily_reminder_enabled ?? false,
    daily_reminder_hour: data.daily_reminder_hour ?? null,
    timezone: data.timezone ?? detectTimezone(),
  };
}

export async function updatePrefs(userId: string, patch: Partial<NotificationPrefs>) {
  const tz = detectTimezone();
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        timezone: tz,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}
