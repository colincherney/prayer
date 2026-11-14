import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppearanceModeProvider } from '@/components/saint/appearanceMode';
import { PrayerRoomProvider } from '@/components/saint/prayerRoom';
import { SaintThemeProvider } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { AuthProvider, useAuth } from '@/lib/auth';
import { syncCloudProgress } from '@/lib/cloudProgress';
import { markLaunched } from '@/lib/launch';
import { preloadLocal } from '@/lib/localCache';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { notificationDestination } from '@/lib/notificationDestination';
import { preloadPet } from '@/lib/pet';
import { localDay } from '@/lib/quests';
import { PETS } from '@/components/pets/registry';
import { preloadReleases, ReleasesProvider } from '@/lib/releases';

const SPLASH_BG = '#0F1A33';

// Keep home beneath a cold-start widget link so Back and Return home work.
export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => {});
// Match the RN root view background to the splash so there's no white
// frame exposed as the native splash fades out into the app.
SystemUI.setBackgroundColorAsync(SPLASH_BG).catch(() => {});

function RootStack() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const fontsLoaded = useSaintFonts();
  const notificationResponse = Notifications.useLastNotificationResponse();
  const handledNotification = useRef<string | null>(null);
  const pendingPrayerRequest = useRef(false);

  const currentScreen = segments[0];
  const inAuth = currentScreen === 'auth';
  // On the right side of the sign-in wall: signed out on the auth screens, or signed in anywhere else.
  const navSettled = !loading && !session === inAuth;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      // Remember the widget's destination while the user signs in or continues
      // anonymously. Keep the request form behind the existing sign-in wall.
      if (currentScreen === 'prayerRequest') pendingPrayerRequest.current = true;
      if (!inAuth) router.replace('/auth');
      return;
    }
    if (pendingPrayerRequest.current) {
      if (currentScreen === 'prayerRequest') pendingPrayerRequest.current = false;
      else router.replace('/prayerRequest');
    } else if (inAuth) {
      router.replace('/');
    }
  }, [session, loading, currentScreen, inAuth, router]);

  // Hide the native splash only once auth, fonts, and navigation are all
  // settled — so the splash transitions directly to a fully-rendered
  // first screen with no white frame between.
  useEffect(() => {
    if (navSettled && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      markLaunched();
    }
  }, [navSettled, fontsLoaded]);

  // Bring personal progress (nook, shelf, names, quests) in from the account, and upload this phone's if it's new.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    syncCloudProgress(userId, localDay(), PETS.map(p => p.id));
  }, [session?.user?.id]);

  // Register the device for push notifications once we have a session.
  const signedInId = session?.user?.id;
  useEffect(() => {
    if (!signedInId) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotifications();
      if (cancelled || !token) return;
      await savePushToken(signedInId, token);
    })().catch(error => console.warn('Push registration failed', error));
    return () => {
      cancelled = true;
    };
  }, [signedInId]);

  // The last response includes taps that launch the app. Wait for sign-in and navigation.
  useEffect(() => {
    if (!notificationResponse || !signedInId || !navSettled) return;
    const request = notificationResponse.notification.request;
    if (handledNotification.current === request.identifier) return;
    handledNotification.current = request.identifier;
    const destination = notificationDestination(request.content.data);
    if (destination) router.push(destination);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [notificationResponse, signedInId, navSettled, router]);

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
      <Stack.Screen name="pets" options={{ presentation: 'card' }} />
      <Stack.Screen name="companion/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="store" options={{ presentation: 'card' }} />
      <Stack.Screen name="createAccount" options={{ presentation: 'card' }} />
      <Stack.Screen name="changeEmail" options={{ presentation: 'card' }} />
      <Stack.Screen name="deleteAccount" options={{ presentation: 'card' }} />
      <Stack.Screen name="groups" options={{ presentation: 'card' }} />
      <Stack.Screen name="group/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="groupNook" options={{ presentation: 'card' }} />
      <Stack.Screen name="quests" options={{ presentation: 'card' }} />
      <Stack.Screen name="trinkets" options={{ presentation: 'card' }} />
      <Stack.Screen name="createGroup" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // The splash stays up during these quick reads, so no screen ever draws the default pet first.
  const [preloaded, setPreloaded] = useState(false);
  useEffect(() => {
    Promise.all([preloadPet(), preloadReleases(), preloadLocal()]).finally(() => setPreloaded(true));
  }, []);
  if (!preloaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ReleasesProvider>
        <SaintThemeProvider>
          <PrayerRoomProvider>
            <AppearanceModeProvider>
              <AuthProvider>
                <RootStack />
              </AuthProvider>
            </AppearanceModeProvider>
          </PrayerRoomProvider>
        </SaintThemeProvider>
        </ReleasesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
