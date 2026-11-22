import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef, useState } from 'react';
import { Appearance, AppState, Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccountTour } from '@/components/saint/AccountTour';
import { AppearanceModeProvider } from '@/components/saint/appearanceMode';
import { AppDisplayProvider, useAppDisplay } from '@/components/saint/appDisplay';
import { PrayerRoomProvider } from '@/components/saint/prayerRoom';
import { SaintThemeProvider, THEMES, useTheme } from '@/components/saint/theme';
import { saintWidgetFontDesign, useSaintFonts } from '@/components/saint/useFonts';
import { AuthProvider, useAuth } from '@/lib/auth';
import { syncCloudProgress } from '@/lib/cloudProgress';
import { markLaunched } from '@/lib/launch';
import { preloadLocal } from '@/lib/localCache';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { notificationDestination } from '@/lib/notificationDestination';
import { preloadPet } from '@/lib/pet';
import { refreshPrayerStreakActivity, setPrayerStreakActivityUser } from '@/lib/prayerStreakActivity';
import { refreshPrayerStreakWidget, setPrayerStreakWidgetUser, setPrayerWidgetTheme } from '@/lib/prayerStreakWidget';
import { localDay } from '@/lib/quests';
import { PETS } from '@/components/pets/registry';
import { preloadReleases, ReleasesProvider } from '@/lib/releases';
import { preloadWinter } from '@/lib/winterEvent';
import { preloadWinterLook } from '@/components/saint/winterLord';
import { WinterGate } from '@/components/winter/WinterGate';
import { DropGate } from '@/components/drops/DropGate';

const useNotificationResponse = Platform.OS === 'web' ? () => null : Notifications.useLastNotificationResponse;

// Keep home beneath a cold-start widget link so Back and Return home work.
export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => {});
// Match the RN root view background to the splash so there's no white
// frame exposed as the native splash fades out into the app.
const splashBackground = Appearance.getColorScheme() === 'dark' ? THEMES.navy.bg : THEMES.cream.bg;
SystemUI.setBackgroundColorAsync(splashBackground).catch(() => {});

function RootStack() {
  const { session, loading, accountTourPending, finishAccountTour } = useAuth();
  const { simple } = useAppDisplay();
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const fontsLoaded = useSaintFonts();
  const notificationResponse = useNotificationResponse();
  const handledNotification = useRef<string | null>(null);
  const pendingWidgetDestination = useRef<'/prayerRequest' | '/explore' | '/biography' | null>(null);

  const currentScreen = segments[0];
  const widgetDestination = currentScreen === 'prayerRequest' || currentScreen === 'explore' || currentScreen === 'biography'
    ? `/${currentScreen}` as const
    : null;
  const inAuth = currentScreen === 'auth';
  // On the right side of the sign-in wall: signed out on the auth screens, or signed in anywhere else.
  const navSettled = !loading && !session === inAuth;
  // Let a linked widget destination open before the tour.
  const showAccountTour = navSettled && fontsLoaded && accountTourPending &&
    (currentScreen === '(tabs)' || currentScreen === 'createAccount');

  useEffect(() => {
    if (loading) return;
    if (!session) {
      if (widgetDestination) pendingWidgetDestination.current = widgetDestination;
      if (!inAuth) router.replace('/auth');
      return;
    }
    if (pendingWidgetDestination.current) {
      if (widgetDestination === pendingWidgetDestination.current) pendingWidgetDestination.current = null;
      else router.replace(pendingWidgetDestination.current);
    } else if (inAuth) {
      router.replace('/');
    }
  }, [session, loading, widgetDestination, inAuth, router]);

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

  const signedInId = session?.user?.id;
  useEffect(() => {
    if (Platform.OS === 'ios') setPrayerWidgetTheme(theme, saintWidgetFontDesign());
  }, [theme]);

  useEffect(() => {
    if (loading || Platform.OS !== 'ios') return;
    setPrayerStreakActivityUser(signedInId ?? null);
    setPrayerStreakWidgetUser(signedInId ?? null);
    if (!signedInId) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshPrayerStreakActivity(signedInId);
        refreshPrayerStreakWidget(signedInId);
      }
    });
    return () => subscription.remove();
  }, [loading, signedInId]);

  // Register the device for push notifications once we have a session.
  useEffect(() => {
    if (!signedInId || !navSettled || accountTourPending) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotifications();
      if (cancelled || !token) return;
      await savePushToken(signedInId, token);
    })().catch(error => console.warn('Push registration failed', error));
    return () => {
      cancelled = true;
    };
  }, [signedInId, navSettled, accountTourPending]);

  // The last response includes taps that launch the app. Wait for sign-in and navigation.
  useEffect(() => {
    if (!notificationResponse || !signedInId || !navSettled || showAccountTour) return;
    const request = notificationResponse.notification.request;
    if (handledNotification.current === request.identifier) return;
    handledNotification.current = request.identifier;
    const destination = notificationDestination(request.content.data);
    if (destination && (!simple || destination === '/' || destination === '/myPrayers')) {
      router.push(destination);
    }
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [notificationResponse, signedInId, navSettled, showAccountTour, router, simple]);

  return (
    <ThemeProvider value={(simple ? theme.isDark : colorScheme === 'dark') ? DarkTheme : DefaultTheme}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="explore" options={{ presentation: 'card' }} />
      <Stack.Screen name="prayerRequest" options={{ presentation: 'card' }} />
      <Stack.Screen name="myPrayers" options={{ presentation: 'card' }} />
      <Stack.Screen name="biography" options={{ presentation: 'card' }} />
      <Stack.Screen name="appMode" options={{ presentation: 'card' }} />
      <Stack.Screen name="createAccount" options={{ presentation: 'card' }} />
      <Stack.Screen name="changeEmail" options={{ presentation: 'card' }} />
      <Stack.Screen name="deleteAccount" options={{ presentation: 'card' }} />
      <Stack.Screen name="store" options={{ presentation: 'card' }} />
      <Stack.Protected guard={!simple}>
        <Stack.Screen name="pair" options={{ presentation: 'card' }} />
        <Stack.Screen name="notificationSettings" options={{ presentation: 'card' }} />
        <Stack.Screen name="customization" options={{ presentation: 'card' }} />
        <Stack.Screen name="pets" options={{ presentation: 'card' }} />
        <Stack.Screen name="companion/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="groups" options={{ presentation: 'card' }} />
        <Stack.Screen name="group/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="groupNook" options={{ presentation: 'card' }} />
        <Stack.Screen name="quests" options={{ presentation: 'card' }} />
        <Stack.Screen name="trinkets" options={{ presentation: 'card' }} />
        <Stack.Screen name="createGroup" options={{ presentation: 'card' }} />
        <Stack.Screen name="winter" options={{ presentation: 'card' }} />
        <Stack.Screen name="beloved" options={{ presentation: 'card' }} />
        <Stack.Screen name="swamp" options={{ presentation: 'card' }} />
        <Stack.Screen name="patchNotes" options={{ presentation: 'card' }} />
      </Stack.Protected>
    </Stack>
    {showAccountTour ? (
      <AccountTour
        key={signedInId}
        onDone={finishAccountTour}
        onGetPlus={() => {
          finishAccountTour();
          if (currentScreen === 'createAccount') router.dismissTo('/store');
          else router.push('/store');
        }}
      />
    ) : null}
    {/* The running event's intro clip and evolution moments, over whatever screen is showing (home only). */}
    {!showAccountTour && !simple && navSettled && session ? <WinterGate /> : null}
    {/* "What's new": companions and wallpapers that just dropped, shown once each. */}
    {!showAccountTour && !simple && navSettled && session ? <DropGate /> : null}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // The splash stays up during these quick reads, so no screen ever draws the default pet first.
  const [preloaded, setPreloaded] = useState(false);
  useEffect(() => {
    Promise.all([preloadPet(), preloadReleases(), preloadLocal(), preloadWinter(), preloadWinterLook()]).finally(() => setPreloaded(true));
  }, []);
  if (!preloaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppDisplayProvider>
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
      </AppDisplayProvider>
    </GestureHandlerRootView>
  );
}
