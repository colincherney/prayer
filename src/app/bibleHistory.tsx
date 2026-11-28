import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { router } from '@/lib/nav';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import { ArrowIcon, BackIcon, PenIcon } from '@/components/saint/Icons';
import { enterFade, enterUp } from '@/components/saint/motion';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { type BiblePlace, placeOf, shownBibleRef, useBibleReader } from '@/components/saint/useBibleReader';
import {
  type BibleHighlight,
  type BibleNote,
  type BibleRead,
  deleteNote,
  fetchAllHighlights,
  fetchAllNotes,
  fetchLastBiblePlace,
  fetchReadHistory,
  HIGHLIGHT_SWATCH,
  HIGHLIGHT_WASH,
} from '@/lib/bibleProgress';
import { XP } from '@/lib/pet';
import { LOCAL_KEYS, readLocal } from '@/lib/localCache';
import { BIBLE_BOOKS } from '@/lib/bibleBooks';
import { PageLoader } from '@/components/saint/PageLoader';

type Tab = 'history' | 'notes' | 'highlights';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today", "Yesterday", or "Nov 18" (with the year once it isn't this one). */
function dayLabel(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${MONTHS[m - 1]} ${d}${y !== today.getFullYear() ? `, ${y}` : ''}`;
}
const noteDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Everything you've done with the Bible: the chapters you read, day by day, and every note you took. */
export default function BibleHistoryScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'notes' || params.tab === 'highlights' ? params.tab : 'history');
  const [reads, setReads] = useState<BibleRead[] | null>();
  const [notes, setNotes] = useState<BibleNote[] | null>();
  const [marks, setMarks] = useState<BibleHighlight[] | null>();
  /** Where you left off: the chapter this phone last opened, or the account's latest one on a new phone. */
  const [lastPlace, setLastPlace] = useState<BiblePlace | null>(null);

  const load = useCallback(() => {
    const controller = new AbortController();
    const saved = readLocal<BiblePlace>(LOCAL_KEYS.bibleLastRead);
    if (saved && BIBLE_BOOKS[saved.book] && saved.chapter >= 1 && saved.chapter <= BIBLE_BOOKS[saved.book].chapters) setLastPlace(saved);
    else {
      fetchLastBiblePlace(controller.signal).then(
        last => { if (!controller.signal.aborted) setLastPlace(last ? placeOf(last.book, last.chapter) : null); },
        () => {},
      );
    }
    fetchReadHistory(controller.signal).then(
      r => { if (!controller.signal.aborted) setReads(r); },
      () => { if (!controller.signal.aborted) setReads(null); },
    );
    fetchAllNotes(controller.signal).then(
      n => { if (!controller.signal.aborted) setNotes(n); },
      () => { if (!controller.signal.aborted) setNotes(null); },
    );
    fetchAllHighlights(controller.signal).then(
      h => { if (!controller.signal.aborted) setMarks(h); },
      () => { if (!controller.signal.aborted) setMarks(null); },
    );
    return () => controller.abort();
  }, []);
  useFocusEffect(load);
  // Back from a chapter: a new read or note shows up here straight away.
  const { open, reader } = useBibleReader(undefined, () => { load(); });

  const openAt = (book: string, chapter: number) => {
    const place = placeOf(book, chapter);
    if (place) open(place);
  };

  const removeNote = (note: BibleNote) => {
    Alert.alert('Delete this note?', 'Its XP goes with it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setNotes(prev => prev?.filter(n => n.id !== note.id));
          deleteNote(note.id).catch(load);
        },
      },
    ]);
  };

  // Reads grouped by the day they were finished.
  const days: { day: string; items: BibleRead[] }[] = [];
  for (const r of reads ?? []) {
    const last = days[days.length - 1];
    if (last?.day === r.read_on) last.items.push(r);
    else days.push({ day: r.read_on, items: [r] });
  }
  const list = tab === 'history' ? reads : tab === 'notes' ? notes : marks;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} haptic={null} accessibilityRole="button" accessibilityLabel="Back" style={styles.roundBtn}>
            <BackIcon size={16} color={theme.ink} />
          </PressScale>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Your <Text style={styles.titleAccent}>reading</Text>
        </Text>
        <Text style={styles.subtitle}>What you’ve read and what you wrote along the way. Only you can see it.</Text>

        {lastPlace ? (
          <Animated.View entering={enterUp(0)}>
            <PressScale onPress={() => open(lastPlace)} haptic="press" scaleTo={0.98} accessibilityRole="button"
              accessibilityLabel={`Continue reading ${shownBibleRef(lastPlace)}`} style={styles.continueCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLabel}>Pick up where you left off</Text>
                <Text style={styles.continueRef}>{shownBibleRef(lastPlace)}</Text>
              </View>
              <View style={[styles.continueGo, { backgroundColor: theme.accent }]}>
                <ArrowIcon size={16} color={theme.isDark ? theme.bg : theme.accentInk} />
              </View>
            </PressScale>
          </Animated.View>
        ) : null}

        <SlidingSegments
          theme={theme}
          value={tab}
          onChange={setTab}
          segments={[
            { key: 'history', label: 'History', count: reads?.length },
            { key: 'notes', label: 'Notes', count: notes?.length },
            { key: 'highlights', label: 'Marked', count: marks?.length },
          ]}
          style={styles.tabs}
        />

        <Animated.View key={tab} entering={enterFade(220)}>
          {list === undefined ? (
            <PageLoader style={styles.loading} color={theme.accent} />
          ) : list === null ? (
            <Text style={styles.empty}>Couldn’t load this right now. Pull back in a moment.</Text>
          ) : list.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {tab === 'history' ? 'Nothing read yet' : tab === 'notes' ? 'No notes yet' : 'No highlights yet'}
              </Text>
              <Text style={styles.empty}>
                {tab === 'history'
                  ? `Read a chapter to the end and it shows up here, with +${XP.bibleRead} XP for your companion.`
                  : tab === 'notes'
                    ? `Tap a verse while you read and choose Note. Each one gives +${XP.bibleNote} XP.`
                    : `Tap a verse while you read and pick a colour. Each highlight gives +${XP.bibleHighlight} XP.`}
              </Text>
            </View>
          ) : tab === 'history' ? (
            days.map((d, di) => (
              <Animated.View key={d.day} entering={enterUp(di)} style={styles.section}>
                <Text style={styles.sectionTitle}>{dayLabel(d.day)}</Text>
                <View style={styles.card}>
                  {d.items.map((r, i) => (
                    <PressScale key={`${r.book}-${r.chapter}`} onPress={() => openAt(r.book, r.chapter)} haptic="press" scaleTo={0.99}
                      accessibilityRole="button" accessibilityLabel={`Read ${r.book} ${r.chapter} again`}
                      style={[styles.row, i > 0 && styles.rowDivider]}>
                      <Text style={styles.rowRef}>{r.book === 'Psalms' ? 'Psalm' : r.book} {r.chapter}</Text>
                      <Text style={styles.rowXp}>+{XP.bibleRead} XP</Text>
                      <ArrowIcon size={12} color={theme.inkSoft} />
                    </PressScale>
                  ))}
                </View>
              </Animated.View>
            ))
          ) : tab === 'highlights' ? (
            <View style={styles.notes}>
              {(marks ?? []).map((h, i) => {
                const place = placeOf(h.book, h.chapter);
                return (
                  <Animated.View key={`${h.book}-${h.chapter}-${h.verse}`} entering={enterUp(i)}>
                    <PressScale onPress={() => openAt(h.book, h.chapter)} haptic="press" scaleTo={0.99}
                      accessibilityRole="button" accessibilityLabel={`Open ${h.book} ${h.chapter}:${h.verse}`} style={styles.markRow}>
                      <View style={[styles.markDot, { backgroundColor: HIGHLIGHT_SWATCH[h.color] }]} />
                      <Text style={styles.markRef}>
                        <Text style={{ backgroundColor: HIGHLIGHT_WASH[h.color] }}>
                          {place ? shownBibleRef(place) : `${h.book} ${h.chapter}`}:{h.verse}
                        </Text>
                      </Text>
                      <Text style={styles.noteDate}>{dayLabel(noteDay(h.created_at))}</Text>
                      <ArrowIcon size={12} color={theme.inkSoft} />
                    </PressScale>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={styles.notes}>
              {(notes ?? []).map((n, i) => {
                const place = placeOf(n.book, n.chapter);
                return (
                  <Animated.View key={n.id} entering={enterUp(i)}>
                    <PressScale onPress={() => openAt(n.book, n.chapter)} onLongPress={() => removeNote(n)} haptic="press" scaleTo={0.99}
                      accessibilityRole="button" accessibilityHint="Opens the chapter. Long press to delete." style={styles.noteCard}>
                      <View style={styles.noteHead}>
                        <PenIcon size={13} color={theme.pillInk} />
                        <Text style={styles.noteRef}>
                          {place ? shownBibleRef(place) : `${n.book} ${n.chapter}`}
                          {n.verse ? `:${n.verse}` : ''}
                        </Text>
                        <Text style={styles.noteDate}>{dayLabel(noteDay(n.created_at))}</Text>
                      </View>
                      <Text style={styles.noteBody}>{n.body}</Text>
                    </PressScale>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
      {reader}
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  continueCard: {
    marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
    shadowColor: '#000', shadowOpacity: theme.isDark ? 0.3 : 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  continueLabel: { fontFamily: FONTS.body, fontSize: 13, color: theme.inkSoft },
  continueRef: { fontFamily: FONTS.display, fontSize: 26, color: theme.ink, marginTop: 2 },
  continueGo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingBottom: 56, width: '100%', maxWidth: 680, alignSelf: 'center' },
  topBar: { paddingTop: 8, paddingBottom: 6 },
  roundBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  title: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 42, color: theme.ink, marginTop: 8, paddingHorizontal: 6 },
  titleAccent: { color: theme.accent },
  subtitle: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 21, color: theme.inkSoft, marginTop: 6, paddingHorizontal: 6 },
  tabs: { marginTop: 20 },
  loading: { marginTop: 40 },
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 22, color: theme.ink },
  empty: { fontFamily: FONTS.body, fontSize: 14.5, lineHeight: 21, color: theme.inkSoft, textAlign: 'center' },
  section: { marginTop: 22 },
  sectionTitle: { fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.inkSoft, marginBottom: 8, paddingHorizontal: 6 },
  card: { borderRadius: 20, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  rowRef: { flex: 1, fontFamily: FONTS.display, fontSize: 18, color: theme.ink },
  rowXp: { fontFamily: FONTS.bodySemi, fontSize: 12, color: theme.pillInk },
  notes: { gap: 10, marginTop: 18 },
  markRow: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: 18,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  markDot: { width: 12, height: 12, borderRadius: 6 },
  markRef: { flex: 1, fontFamily: FONTS.display, fontSize: 18, color: theme.ink },
  noteCard: { padding: 16, borderRadius: 20, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  noteRef: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.ink },
  noteDate: { fontFamily: FONTS.body, fontSize: 12, color: theme.inkSoft },
  noteBody: { fontFamily: FONTS.display, fontSize: 17, lineHeight: 25, color: theme.ink },
});
