import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SaintThemeProvider, THEME } from '@/components/saint/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'auth';
    if (!session && !inAuth) {
      router.replace('/auth');
    } else if (session && inAuth) {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

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

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="explore" options={{ presentation: 'card' }} />
      <Stack.Screen name="prayerRequest" options={{ presentation: 'card' }} />
      <Stack.Screen name="pair" options={{ presentation: 'card' }} />
      <Stack.Screen name="myPrayers" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SaintThemeProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </SaintThemeProvider>
    </ThemeProvider>
  );
}
