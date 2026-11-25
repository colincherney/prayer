import { type Href, router } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/saint/HapticPressable';

import { useAuth } from '@/lib/auth';
import { showPrayerStreakActivityControls } from '@/lib/prayerStreakActivity';

import { ArrowIcon, HeartIcon, PenIcon, PrayingIcon } from './Icons';
import { SafeAreaView } from './SafeArea';
import { FONTS, type Theme, useTheme, useThemedStyles } from './theme';

export const SIMPLE_PRAYER_ACTIONS = [
  { title: 'Request prayer', detail: 'Share an anonymous request', href: '/prayerRequest', Icon: HeartIcon },
  { title: 'Pray for others', detail: 'Read requests from the community', href: '/explore', Icon: PrayingIcon },
  { title: 'Journal', detail: 'Write and revisit your reflections', href: '/biography', Icon: PenIcon },
] satisfies { title: string; detail: string; href: Href; Icon: typeof PenIcon }[];

export function SimplePage({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function SimpleHome() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { session } = useAuth();
  const streakUserId = Platform.OS === 'ios' ? session?.user.id : undefined;
  return (
    <SimplePage>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Saint Central</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/appMode')}
          style={({ pressed }) => [styles.settings, pressed && styles.pressed]}>
          <Text style={styles.settingsLabel}>Settings</Text>
        </Pressable>
      </View>

      <Text accessibilityRole="header" style={styles.heading}>Prayer</Text>

      <View style={styles.actions}>
        {SIMPLE_PRAYER_ACTIONS.map(({ title, detail, href, Icon }) => (
          <Pressable key={title} accessibilityRole="button" onPress={() => router.push(href)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <View style={styles.actionIcon}><Icon size={22} color={theme.pillInk} /></View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionDetail}>{detail}</Text>
            </View>
            <ArrowIcon size={17} color={theme.pillInk} />
          </Pressable>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/myPrayers')}
        style={({ pressed }) => [styles.history, pressed && styles.pressed]}>
        <Text style={styles.settingsLabel}>My prayer requests</Text>
        <ArrowIcon size={15} color={theme.pillInk} />
      </Pressable>
      {streakUserId ? (
        <Pressable accessibilityRole="button" onPress={() => showPrayerStreakActivityControls(streakUserId)}
          style={({ pressed }) => [styles.streak, pressed && styles.pressed]}>
          <Text style={styles.settingsLabel}>Prayer streak Live Activity</Text>
          <ArrowIcon size={15} color={theme.pillInk} />
        </Pressable>
      ) : null}
    </SimplePage>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28 },
    column: { width: '100%', maxWidth: 500, alignSelf: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    brand: { flexShrink: 1, fontFamily: FONTS.bodySemi, fontSize: 15, color: theme.ink },
    settings: {
      minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 12,
      borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
    },
    settingsLabel: { fontFamily: FONTS.bodyMed, fontSize: 14, color: theme.accent },
    heading: {
      marginTop: 44, marginBottom: 22, color: theme.ink, fontFamily: FONTS.displaySemi,
      fontSize: 40, letterSpacing: -1.6,
    },
    actions: { gap: 10 },
    action: {
      minHeight: 84, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13,
      borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    },
    actionIcon: {
      width: 42, height: 42, borderRadius: 12, backgroundColor: theme.pillBg,
      alignItems: 'center', justifyContent: 'center',
    },
    actionCopy: { flex: 1, gap: 4 },
    actionTitle: { fontFamily: FONTS.bodySemi, fontSize: 17, color: theme.ink },
    actionDetail: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 18, color: theme.muted },
    history: {
      minHeight: 44, alignSelf: 'flex-start', marginTop: 16, flexDirection: 'row',
      alignItems: 'center', gap: 8,
    },
    streak: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
    pressed: { opacity: 0.7 },
});
