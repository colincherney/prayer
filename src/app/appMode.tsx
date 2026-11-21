import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useAppDisplay } from '@/components/saint/appDisplay';
import { ArrowIcon, BackIcon, CheckIcon } from '@/components/saint/Icons';
import { LegalLinks } from '@/components/saint/LegalLinks';
import { SimplePage } from '@/components/saint/SimpleHome';
import { FONTS, type Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useAuth } from '@/lib/auth';

export default function AppModeScreen() {
  const { simple, simpleColor, updateDisplay } = useAppDisplay();
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isGuest, session, signOut } = useAuth();

  return (
    <SimplePage>
      <Pressable accessibilityRole="button" accessibilityLabel="Back"
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <BackIcon size={18} color={theme.ink} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.heading}>Display</Text>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Simple mode</Text>
            <Text style={styles.description}>Keep the app focused on prayer requests and journaling.</Text>
          </View>
          <Switch accessibilityLabel="Simple mode" value={simple} trackColor={{ true: theme.accent }}
            onValueChange={value => updateDisplay({ simple: value })} />
        </View>
        {simple && (
          <View style={styles.appearance}>
            <Text style={styles.label}>Appearance</Text>
            <View style={styles.options}>
              {(['light', 'dark'] as const).map(color => {
                const selected = simpleColor === color;
                return (
                  <Pressable key={color} accessibilityRole="radio" accessibilityState={{ checked: selected }}
                    onPress={() => updateDisplay({ simpleColor: color })}
                    style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}>
                    <Text style={[styles.optionText, selected && styles.selectedText]}>{color === 'light' ? 'Light' : 'Dark'}</Text>
                    {selected && <CheckIcon size={16} color={theme.pillInk} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {simple && session && (
        <View style={styles.account}>
          <Text accessibilityRole="header" style={styles.label}>Account</Text>
          {isGuest && (
            <Pressable accessibilityRole="button" onPress={() => router.push('/createAccount')} style={styles.link}>
              <Text style={styles.linkText}>Create an account</Text>
              <ArrowIcon size={16} color={theme.accent} />
            </Pressable>
          )}
          {!isGuest && session.user.email && (
            <Pressable accessibilityRole="button" onPress={() => router.push('/changeEmail')} style={styles.link}>
              <Text style={styles.linkText}>Change email</Text>
              <ArrowIcon size={16} color={theme.accent} />
            </Pressable>
          )}
          <Pressable accessibilityRole="button" onPress={async () => { await signOut(); router.replace('/auth'); }} style={styles.link}>
            <Text style={styles.linkText}>Sign out</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/deleteAccount')} style={styles.link}>
            <Text style={styles.linkText}>Delete account</Text>
          </Pressable>
          <LegalLinks />
        </View>
      )}
    </SimplePage>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  back: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
  },
  heading: {
    marginTop: 24, marginBottom: 22, color: theme.ink, fontFamily: FONTS.displaySemi,
    fontSize: 34, letterSpacing: -1,
  },
  card: { borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  switchCopy: { flex: 1, gap: 4 },
  label: { fontFamily: FONTS.bodySemi, color: theme.ink, fontSize: 16 },
  description: { fontFamily: FONTS.body, color: theme.muted, fontSize: 13, lineHeight: 19 },
  appearance: { borderTopWidth: 1, borderColor: theme.line, padding: 16, gap: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexGrow: 1, flexBasis: 100, minHeight: 46, paddingHorizontal: 12, paddingVertical: 8, gap: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.line, borderRadius: 10, backgroundColor: theme.bg,
  },
  selected: { backgroundColor: theme.pillBg, borderColor: theme.accent },
  optionText: { fontFamily: FONTS.bodyMed, fontSize: 14, color: theme.inkSoft },
  selectedText: { color: theme.pillInk },
  account: { marginTop: 28 },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontFamily: FONTS.body, fontSize: 14, color: theme.accent },
  pressed: { opacity: 0.7 },
});
