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
import { shortDate, useEvents } from '@/lib/winterEvent';

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
  const { states: eventStates, today, devToday } = useEvents();
  const eventsLoaded = Object.values(eventStates).filter(Boolean).length;
  const [weeks, setWeeks] = useState<{ weekOf: string; items: DropItem[] }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDropHistory(today, Object.values(eventStates), __DEV__ ? devToday : null)
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
    // the events are read for their start dates only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, devToday, eventsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  const thisWeek = mondayOf(today);
  // The latest week gets its own card at the top; everything older goes into one tidy box per month below it.
  const latest = weeks?.[0] ?? null;
  const months = groupByMonth((weeks ?? []).slice(1).flatMap(w => w.items));

  const itemRow = (item: DropItem) => {
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
  };

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
      ) : !latest ? (
        <Text style={styles.empty}>Nothing has dropped yet. Check back soon.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* The latest drop, open */}
          <View style={[styles.week, styles.latest]}>
            <View style={styles.weekHead}>
              <Text style={styles.weekTitle}>{latest.weekOf === thisWeek ? 'This week' : `Week of ${shortDate(latest.weekOf)}`}</Text>
              <View style={styles.newPill}><Text style={styles.newPillText}>{latest.weekOf === thisWeek ? 'NEW' : 'LATEST'}</Text></View>
            </View>
            {[...latest.items].reverse().map(itemRow)}
          </View>

          {/* Everything older, one box per month, closed until tapped */}
          {months.length ? <Text style={styles.sectionLabel}>EARLIER</Text> : null}
          {months.map(month => (
            <MonthBox key={month.key} title={month.title} items={month.items} styles={styles} renderItem={itemRow} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Drops grouped by calendar month, newest month first, each month's items newest first. */
function groupByMonth(items: DropItem[]): { key: string; title: string; items: DropItem[] }[] {
  const byMonth = new Map<string, DropItem[]>();
  for (const item of items) {
    const key = item.day.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), item]);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, list]) => ({
      key,
      title: `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
      items: [...list].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0)),
    }));
}

/** One month, closed: its name, how many things dropped, and a peek at a few of them. Tap to open. */
function MonthBox({ title, items, styles, renderItem }: {
  title: string;
  items: DropItem[];
  styles: ReturnType<typeof makeStyles>;
  renderItem: (item: DropItem) => React.ReactNode;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.week}>
      <Pressable onPress={() => setOpen(o => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${items.length} new things`} style={styles.monthHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekTitle}>{title}</Text>
          <Text style={styles.monthCount}>{items.length} new {items.length === 1 ? 'thing' : 'things'}</Text>
        </View>
        {!open ? (
          <View style={styles.peek}>
            {items.slice(0, 3).map(item => (
              <View key={item.key} style={styles.peekThumb}><View style={styles.peekScale}><Thumb item={item} /></View></View>
            ))}
          </View>
        ) : null}
        <Text style={[styles.chevron, { color: theme.inkSoft }]}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open ? items.map(renderItem) : null}
    </View>
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
  latest: { borderColor: t.accent, borderWidth: 1.5 },
  sectionLabel: { fontFamily: FONTS.bodyBold, fontSize: 11, letterSpacing: 1.6, color: t.inkSoft, marginTop: 8, marginLeft: 4 },
  monthHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  monthCount: { fontFamily: FONTS.body, fontSize: 12.5, color: t.inkSoft, marginTop: 2 },
  peek: { flexDirection: 'row' },
  peekThumb: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden', marginLeft: -8, backgroundColor: t.bgSoft, borderWidth: 2, borderColor: t.surface, alignItems: 'center', justifyContent: 'center' },
  peekScale: { transform: [{ scale: 0.7 }] },
  chevron: { fontSize: 14, marginLeft: 4 },
  weekTitle: { fontFamily: FONTS.displaySemi, fontSize: 17, color: t.ink },
  newPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: t.accent },
  newPillText: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 1, color: t.accentInk },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbWrap: { width: THUMB + 8, height: THUMB + 8, borderRadius: 14, backgroundColor: t.bgSoft, alignItems: 'center', justifyContent: 'center' },
  kind: { fontFamily: FONTS.bodySemi, fontSize: 10.5, letterSpacing: 1.2, color: t.accent },
  name: { fontFamily: FONTS.bodySemi, fontSize: 15, color: t.ink, marginTop: 2 },
});
