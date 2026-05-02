import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, SectionLabel } from '@/components/saint/Common';
import {
  HeartIcon,
  PrayingIcon,
  ShieldIcon,
  SparkleIcon,
} from '@/components/saint/Icons';
import { FONTS, THEME } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

const MY_REQUESTS = [
  {
    id: 'r1',
    text: 'My mother starts chemo Monday. Praying for strength.',
    prayedCount: 47,
    age: '12m ago',
    notes: 3,
    status: 'active' as const,
  },
  {
    id: 'r2',
    text: 'Job interview tomorrow. Clarity and peace.',
    prayedCount: 19,
    age: '4h ago',
    notes: 1,
    status: 'active' as const,
  },
  {
    id: 'r3',
    text: 'Marriage feels distant. Tenderness, please.',
    prayedCount: 88,
    age: '3d ago',
    notes: 6,
    status: 'answered' as const,
  },
];

const STATS = {
  prayersOffered: 142,
  requestsShared: 8,
  encouragementSent: 27,
  streak: 12,
};

const RECENT = [
  { Icon: PrayingIcon, text: '14 strangers prayed for you in the last hour.' },
  { Icon: HeartIcon, text: 'Someone in Texas sent you a note of encouragement.' },
  { Icon: SparkleIcon, text: 'You were paired with a friend in Ohio. Amen.' },
];

const StatTile: React.FC<{ value: number; label: string; accent?: boolean }> = ({ value, label, accent }) => (
  <View
    style={[
      styles.statTile,
      {
        backgroundColor: accent ? THEME.cardDark : THEME.surface,
        borderColor: accent ? THEME.cardDark : THEME.line,
      },
    ]}>
    <Text
      style={[
        styles.statValue,
        { color: accent ? THEME.cardDarkInk : THEME.ink },
      ]}>
      {value}
    </Text>
    <Text
      style={[
        styles.statLabel,
        { color: accent ? THEME.cardDarkInk : THEME.ink, opacity: accent ? 0.78 : 0.65 },
      ]}>
      {label}
    </Text>
  </View>
);

export default function MeScreen() {
  const fontsLoaded = useSaintFonts();
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
          <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>Always anonymous</Pill>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>walk</Text>
          </Text>
          <Text style={styles.subtitle}>A quiet record of prayers held — yours and theirs.</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatTile value={STATS.prayersOffered} label="prayers offered for others" />
          <StatTile value={STATS.requestsShared} label="requests you've shared" />
          <StatTile value={STATS.encouragementSent} label="notes of encouragement" />
          <StatTile value={STATS.streak} label="day quiet-time streak" accent />
        </View>

        <SectionLabel style={{ paddingHorizontal: 22 }}>Your requests</SectionLabel>
        <View style={{ paddingHorizontal: 22, gap: 10 }}>
          {MY_REQUESTS.map(r => (
            <View key={r.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <Text
                  style={[
                    styles.requestStatus,
                    { color: r.status === 'answered' ? THEME.accent : THEME.muted },
                  ]}>
                  {r.status === 'answered' ? '✓ MARKED ANSWERED' : `ACTIVE · ${r.age.toUpperCase()}`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <PrayingIcon size={13} color={THEME.muted} />
                  <Text style={styles.countText}>{r.prayedCount}</Text>
                </View>
              </View>
              <Text style={styles.requestBody}>&ldquo;{r.text}&rdquo;</Text>
              {r.notes > 0 && (
                <View style={styles.notesRow}>
                  <HeartIcon size={13} color={THEME.accent} />
                  <Text style={styles.notesText}>
                    {r.notes} {r.notes === 1 ? 'note' : 'notes'} of encouragement
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <SectionLabel style={{ paddingHorizontal: 22 }}>Recent</SectionLabel>
        <View style={{ paddingHorizontal: 22, gap: 8 }}>
          {RECENT.map((n, i) => (
            <View key={i} style={styles.recentRow}>
              <View style={styles.recentIcon}>
                <n.Icon size={15} color={THEME.ink} />
              </View>
              <Text style={styles.recentText}>{n.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  title: {
    fontFamily: FONTS.display,
    fontSize: 48,
    lineHeight: 50,
    color: THEME.ink,
    marginTop: 18,
    letterSpacing: -0.6,
  },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    marginTop: 8,
  },
  statsGrid: {
    paddingHorizontal: 22,
    paddingTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    width: '48%',
    flexGrow: 1,
    minWidth: '48%',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  statLabel: { fontFamily: FONTS.body, fontSize: 11.5, lineHeight: 16, marginTop: 8 },
  requestCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestStatus: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.2 },
  countText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  requestBody: { fontFamily: FONTS.display, fontSize: 16, lineHeight: 22, color: THEME.ink },
  notesRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.inkSoft },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: THEME.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: THEME.inkSoft, lineHeight: 19 },
});
