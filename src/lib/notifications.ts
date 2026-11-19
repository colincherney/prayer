import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
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
  daily_reminder_minute: number | null;
  reflection_reminder_enabled: boolean;
  reflection_reminder_interval_days: number;
  reflection_reminder_hour: number;
  timezone: string | null;
};

export const DEFAULT_PREFS: NotificationPrefs = {
  comments_enabled: true,
  social_proof_enabled: true,
  daily_reminder_enabled: false,
  daily_reminder_hour: null,
  daily_reminder_minute: null,
  reflection_reminder_enabled: false,
  reflection_reminder_interval_days: 2,
  reflection_reminder_hour: 19,
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
    importance: AndroidImportance.DEFAULT,
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

  // Goes through the register_push_token RPC (SECURITY DEFINER) so a token
  // already owned by a previous user on this device can be re-claimed —
  // a plain upsert would 42501 against the per-user RLS UPDATE policy.
  const { error: tErr } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: platform,
  });
  if (tErr) throw tErr;

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
  if (pErr) throw pErr;
}

export async function loadPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('comments_enabled, social_proof_enabled, daily_reminder_enabled, daily_reminder_hour, daily_reminder_minute, reflection_reminder_enabled, reflection_reminder_interval_days, reflection_reminder_hour, timezone')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEFAULT_PREFS, timezone: detectTimezone() };
  return {
    comments_enabled: data.comments_enabled ?? true,
    social_proof_enabled: data.social_proof_enabled ?? true,
    daily_reminder_enabled: data.daily_reminder_enabled ?? false,
    daily_reminder_hour: data.daily_reminder_hour ?? null,
    daily_reminder_minute: data.daily_reminder_minute ?? null,
    reflection_reminder_enabled: data.reflection_reminder_enabled ?? false,
    reflection_reminder_interval_days: data.reflection_reminder_interval_days ?? 2,
    reflection_reminder_hour: data.reflection_reminder_hour ?? 19,
    timezone: data.timezone ?? detectTimezone(),
  };
}

export type GroupNotificationPrefs = {
  groupId: string;
  name: string;
  enabled: boolean;
};

export async function loadGroupNotificationPrefs(userId: string): Promise<GroupNotificationPrefs[]> {
  const [memberships, preferences] = await Promise.all([
    supabase.from('group_members').select('group_id, groups(name)').eq('user_id', userId),
    supabase.from('group_notification_preferences').select('group_id, prayers_enabled').eq('user_id', userId),
  ]);
  if (memberships.error) throw memberships.error;
  if (preferences.error) throw preferences.error;
  const enabledByGroup = new Map((preferences.data ?? []).map(p => [p.group_id, p.prayers_enabled]));
  return (memberships.data ?? []).flatMap(m => {
    const group = m.groups as unknown as { name: string } | null;
    return group ? [{ groupId: m.group_id as string, name: group.name, enabled: enabledByGroup.get(m.group_id) ?? true }] : [];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadGroupPrayerNotificationPref(userId: string, groupId: string): Promise<boolean> {
  const { data, error } = await supabase.from('group_notification_preferences')
    .select('prayers_enabled').eq('user_id', userId).eq('group_id', groupId).maybeSingle();
  if (error) throw error;
  return data?.prayers_enabled ?? true;
}

export async function updateGroupPrayerNotificationPref(userId: string, groupId: string, enabled: boolean) {
  const { error } = await supabase.from('group_notification_preferences').upsert({
    user_id: userId, group_id: groupId, prayers_enabled: enabled, updated_at: new Date().toISOString(),
  }, { onConflict: 'group_id,user_id' });
  if (error) throw error;
}

export async function enablePushNotifications(userId: string): Promise<boolean> {
  const token = await registerForPushNotifications();
  if (!token) return false;
  await savePushToken(userId, token);
  return true;
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
