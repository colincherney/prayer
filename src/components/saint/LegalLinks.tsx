import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { useAuthTheme } from './authAppearance';
import { FONTS } from './theme';

const LEGAL_LINKS = [
  { label: 'Terms of Use', href: 'https://saintcentral.app/terms' },
  { label: 'Privacy Policy', href: 'https://saintcentral.app/privacy' },
  { label: 'Apple EULA', href: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/' },
] as const;

export function LegalLinks() {
  const theme = useAuthTheme();

  return (
    <View style={styles.links}>
      {LEGAL_LINKS.map(({ label, href }) => (
        <ExternalLink key={href} href={href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityHint="Opens in your browser"
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.label, { color: theme.inkSoft }]}>{label}</Text>
          </Pressable>
        </ExternalLink>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, marginTop: 4 },
  link: { minHeight: 44, paddingHorizontal: 4, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, textDecorationLine: 'underline' },
});
