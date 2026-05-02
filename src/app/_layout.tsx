import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SaintThemeProvider, THEME } from '@/components/saint/theme';
import { AuthProvider, useAuth } from '@/lib/auth';

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
