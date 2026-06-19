import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AppearanceModeProvider } from '@/components/saint/appearanceMode';
import { PrayerRoomProvider } from '@/components/saint/prayerRoom';
import { SaintThemeProvider } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { AuthProvider, useAuth } from '@/lib/auth';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';

const SPLASH_BG = '#0F1A33';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Match the RN root view background to the splash so there's no white
// frame exposed as the native splash fades out into the app.
SystemUI.setBackgroundColorAsync(SPLASH_BG).catch(() => {});

function RootStack() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const fontsLoaded = useSaintFonts();
  const [navSettled, setNavSettled] = useState(false);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'auth';
    if (!session && !inAuth) {
      router.replace('/auth');
    } else if (session && inAuth) {
      router.replace('/');
    } else {
      setNavSettled(true);
    }
  }, [session, loading, segments, router]);

  // Hide the native splash only once auth, fonts, and navigation are all
  // settled — so the splash transitions directly to a fully-rendered
  // first screen with no white frame between.
  useEffect(() => {
    if (navSettled && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [navSettled, fontsLoaded]);

  // Register the device for push notifications once we have a session.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotifications();
      if (cancelled || !token) return;
      await savePushToken(session.user.id, token);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Tap-to-navigate: open the relevant prayer when a notification is tapped.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { type?: string; prayer_id?: string }
        | undefined;
      if (data?.type === 'reflection' || data?.type === 'social_proof') {
        router.push('/myPrayers');
      } else if (data?.type === 'daily_reminder') {
        router.push('/');
      }
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SPLASH_BG },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="explore" options={{ presentation: 'card' }} />
      <Stack.Screen name="prayerRequest" options={{ presentation: 'card' }} />
      <Stack.Screen name="pair" options={{ presentation: 'card' }} />
      <Stack.Screen name="myPrayers" options={{ presentation: 'card' }} />
      <Stack.Screen name="notificationSettings" options={{ presentation: 'card' }} />
      <Stack.Screen name="customization" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SaintThemeProvider>
        <PrayerRoomProvider>
          <AppearanceModeProvider>
            <AuthProvider>
              <RootStack />
            </AuthProvider>
          </AppearanceModeProvider>
        </PrayerRoomProvider>
      </SaintThemeProvider>
    </ThemeProvider>
  );
}
