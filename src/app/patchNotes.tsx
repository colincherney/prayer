import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { copyFor, DecorArt } from '@/components/drops/DropShowcase';
import { COLLECTION_SCENES } from '@/components/pets/collectionData';
import { Pet, PetId } from '@/components/pets/registry';
import { TrinketArt } from '@/components/pets/Trinket';
import { TrinketId } from '@/components/pets/trinketArt';
import { BackIcon } from '@/components/saint/Icons';
import { PageAmbience } from '@/components/saint/PageAmbience';
import { PRAYER_ROOMS, PrayerRoomName } from '@/components/saint/prayerRoom';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { DropItem, loadDropHistory, markPatchNotesSeen, mondayOf } from '@/lib/drops';
import { shortDate, useWinterEvent } from '@/lib/winterEvent';

// Patch notes: everything that has dropped, week by week, newest first, so people can see the app keeps growing.
// It reads the same release schedule as "What's new" (public.content_releases), so it's always up to date.

const THUMB = 48;

function Thumb({ item }: { item: DropItem }) {
  if (item.kind === 'pet') return <Pet id={item.id as PetId} stage={1} size={THUMB} animated={false} />;
  if (item.kind === 'trinket') return <TrinketArt id={item.id as TrinketId} size={THUMB} animated={false} />;
  if (item.kind === 'item') return <DecorArt id={item.id} size={THUMB} />;
  if (item.kind === 'room') {
    const p = PRAYER_ROOMS[item.id as PrayerRoomName];
    return (
      <View style={[thumb.swatch, { backgroundColor: p?.bg ?? '#333' }]}>
        <View style={[thumb.hill, { backgroundColor: p?.bgSoft ?? '#555' }]} />
        <View style={[thumb.dot, { backgroundColor: p?.accent ?? '#fff' }]} />
      </View>
    );
  }
  const scene = COLLECTION_SCENES.find(s => s.id === item.id);
  return (
    <View style={[thumb.swatch, { backgroundColor: scene?.bg ?? '#3A4860' }]}>
      <View style={[thumb.hill, { backgroundColor: scene?.sw ?? '#fff', opacity: 0.6 }]} />
    </View>
  );
}

const thumb = StyleSheet.create({
  swatch: { width: THUMB, height: THUMB, borderRadius: 12, overflow: 'hidden' },
  hill: { position: 'absolute', left: -8, right: -8, bottom: -14, height: 28, borderRadius: 20 },
  dot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4 },
});

export default function PatchNotesScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme, name: themeName } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { state: winter, today, devToday } = useWinterEvent();
  const [weeks, setWeeks] = useState<{ weekOf: string; items: DropItem[] }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDropHistory(today, winter, __DEV__ ? devToday : null)
      .then(list => {
        if (cancelled) return;
        setWeeks(list);
        // Seeing the page clears the "new" badge in Settings.
        const newest = list[0]?.items[list[0].items.length - 1]?.day;
        if (newest) markPatchNotesSeen(newest);
      })
      .catch(() => setWeeks([]));
    return () => {
      cancelled = true;
    };
    // winter is read for the event's start date only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, devToday, !!winter]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  const thisWeek = mondayOf(today);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <PageAmbience name={themeName} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
          <BackIcon size={15} color={theme.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Patch <Text style={styles.titleAccent}>notes</Text></Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.intro}>Something new arrives almost every week. Here&apos;s everything that has dropped, newest first.</Text>

      {weeks === null ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
      ) : weeks.length === 0 ? (
        <Text style={styles.empty}>Nothing has dropped yet. Check back soon.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {weeks.map(({ weekOf, items }) => (
            <View key={weekOf} style={styles.week}>
              <View style={styles.weekHead}>
                <Text style={styles.weekTitle}>{weekOf === thisWeek ? 'This week' : `Week of ${shortDate(weekOf)}`}</Text>
                {weekOf === thisWeek ? <View style={styles.newPill}><Text style={styles.newPillText}>NEW</Text></View> : null}
              </View>
              {[...items].reverse().map(item => {
                const copy = copyFor(item);
                return (
                  <View key={item.key} style={styles.row}>
                    <View style={styles.thumbWrap}><Thumb item={item} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.kind}>{copy.label.replace('NEW ', '')} · {shortDate(item.day)}</Text>
                      <Text numberOfLines={1} style={styles.name}>{copy.title}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line },
  title: { fontFamily: FONTS.display, fontSize: 26, color: t.ink },
  titleAccent: { color: t.accent },
  intro: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: t.inkSoft, paddingHorizontal: 24, marginTop: 10, textAlign: 'center' },
  empty: { fontFamily: FONTS.body, fontSize: 15, color: t.muted, textAlign: 'center', marginTop: 40 },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 60, gap: 14 },
  week: { borderRadius: 20, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 10 },
  weekHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekTitle: { fontFamily: FONTS.displaySemi, fontSize: 17, color: t.ink },
  newPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: t.accent },
  newPillText: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 1, color: t.accentInk },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbWrap: { width: THUMB + 8, height: THUMB + 8, borderRadius: 14, backgroundColor: t.bgSoft, alignItems: 'center', justifyContent: 'center' },
  kind: { fontFamily: FONTS.bodySemi, fontSize: 10.5, letterSpacing: 1.2, color: t.accent },
  name: { fontFamily: FONTS.bodySemi, fontSize: 15, color: t.ink, marginTop: 2 },
});
