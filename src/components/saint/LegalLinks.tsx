import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { FONTS, Theme, useThemedStyles } from './theme';

const LEGAL_LINKS = [
  { label: 'Terms of Use', href: 'https://saintcentral.app/terms' },
  { label: 'Privacy Policy', href: 'https://saintcentral.app/privacy' },
  { label: 'Apple EULA', href: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/' },
] as const;

export function LegalLinks() {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.links}>
      {LEGAL_LINKS.map(({ label, href }) => (
        <ExternalLink key={href} href={href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityHint="Opens in your browser"
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
            <Text style={styles.label}>{label}</Text>
          </Pressable>
        </ExternalLink>
      ))}
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  link: { minHeight: 44, paddingHorizontal: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: theme.inkSoft, textDecorationLine: 'underline' },
});
