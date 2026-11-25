import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { BiblePassageReader } from '@/components/saint/BiblePassageReader';
import { PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import { ArrowIcon, BackIcon, CloseIcon, PenIcon } from '@/components/saint/Icons';
import { EASE_OUT, enterFade, enterUp } from '@/components/saint/motion';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import Svg, { Circle, Path } from 'react-native-svg';

import { BIBLE_BOOKS } from '@/lib/bibleBooks';
import { fetchBibleTotals, fetchReadChapters } from '@/lib/bibleProgress';
import { BIBLE_VERSIONS, useBibleVersion } from '@/lib/bibleVersion';
import { LOCAL_KEYS, readLocal, writeLocal } from '@/lib/localCache';
import { useAccountLevel, XP } from '@/lib/pet';

type Place = { book: number; chapter: number };

/** A clock face with its hands turned back: what you've read. */
function HistoryIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <Path d="M3 4v4h4" />
      <Path d="M12 8v4.5l3 2" />
      <Circle cx={12} cy={12} r={0.01} />
    </Svg>
  );
}
const refOf = ({ book, chapter }: Place) => `${BIBLE_BOOKS[book].name} ${chapter}`;
const shownRef = (place: Place) => refOf(place).replace(/^Psalms /, 'Psalm ');
const LIST_MOTION = LinearTransition.duration(260).easing(EASE_OUT);

/** The whole Bible: find a book, pick a chapter, read it in either version, and carry on from where you stopped. */
export default function BibleScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const account = useAccountLevel();
  const [version, setVersion] = useBibleVersion();
  const [testament, setTestament] = useState<'old' | 'new'>('new');
  const [query, setQuery] = useState('');
  const [openBook, setOpenBook] = useState<number | null>(null);
  const [readInBook, setReadInBook] = useState<Set<number>>(new Set());
  const [reading, setReading] = useState<Place | null>(null);
  const [totals, setTotals] = useState<{ reads: number; notes: number } | null>(null);
  const [lastRead, setLastRead] = useState<Place | undefined>(() => {
    const saved = readLocal<Place>(LOCAL_KEYS.bibleLastRead);
    return saved && BIBLE_BOOKS[saved.book] && saved.chapter >= 1 && saved.chapter <= BIBLE_BOOKS[saved.book].chapters ? saved : undefined;
  });

  // Totals and the open book's read marks catch up whenever you come back from reading.
  const openName = openBook !== null ? BIBLE_BOOKS[openBook].name : null;
  const refresh = useCallback(() => {
    const controller = new AbortController();
    fetchBibleTotals(controller.signal).then(t => { if (!controller.signal.aborted) setTotals(t); }, () => {});
    if (openName) {
      fetchReadChapters(openName, controller.signal).then(r => { if (!controller.signal.aborted) setReadInBook(r); }, () => {});
    }
    return () => controller.abort();
  }, [openName]);
  useFocusEffect(refresh);

  const searching = query.trim().length > 0;
  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BIBLE_BOOKS.map((b, i) => ({ ...b, index: i })).filter(b =>
      q ? b.name.toLowerCase().includes(q) : b.testament === testament,
    );
  }, [testament, query]);
  const references = useMemo(() => (reading ? [refOf(reading)] : []), [reading]);

  const read = (place: Place) => {
    setReading(place);
    setLastRead(place);
    writeLocal(LOCAL_KEYS.bibleLastRead, place).catch(() => {});
  };
  const closeReader = () => {
    setReading(null);
    refresh();
  };
  const step = (delta: 1 | -1) => {
    if (!reading) return;
    let { book, chapter } = reading;
    chapter += delta;
    if (chapter < 1) {
      book -= 1;
      chapter = BIBLE_BOOKS[book]?.chapters ?? 0;
    } else if (chapter > BIBLE_BOOKS[book].chapters) {
      book += 1;
      chapter = 1;
    }
    if (BIBLE_BOOKS[book]) read({ book, chapter });
  };
  const atStart = reading?.book === 0 && reading.chapter === 1;
  const atEnd = reading?.book === BIBLE_BOOKS.length - 1 && reading.chapter === BIBLE_BOOKS[reading.book].chapters;
  const toggleBook = (index: number) => {
    setReadInBook(new Set());
    setOpenBook(openBook === index ? null : index);
  };

  const onAccent = theme.isDark ? theme.bg : theme.accentInk;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} haptic={null} accessibilityRole="button" accessibilityLabel="Back" style={styles.roundBtn}>
            <BackIcon size={16} color={theme.ink} />
          </PressScale>
          {account ? (
            <View style={styles.levelPill} accessible accessibilityLabel={`Account level ${account.level}`}>
              <Text style={styles.levelText}>Level {account.level}</Text>
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: `${Math.min(100, (account.xpInLevel / account.xpForLevel) * 100)}%` }]} />
              </View>
            </View>
          ) : null}
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          The <Text style={styles.titleAccent}>Bible</Text>
        </Text>
        <Text style={styles.subtitle}>
          Every chapter you finish feeds your companion {XP.bibleRead} XP, and every note {XP.bibleNote} more.
        </Text>

        {totals && (totals.reads > 0 || totals.notes > 0) ? (
          <Text style={styles.earned}>
            {totals.reads * XP.bibleRead + totals.notes * XP.bibleNote} XP earned from the Bible so far
          </Text>
        ) : null}

        {lastRead ? (
          <Animated.View entering={enterUp(0)}>
            <PressScale onPress={() => read(lastRead)} haptic="press" scaleTo={0.98} accessibilityRole="button"
              accessibilityLabel={`Continue reading ${shownRef(lastRead)}`} style={styles.continueCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLabel}>Pick up where you left off</Text>
                <Text style={styles.continueRef}>{shownRef(lastRead)}</Text>
              </View>
              <View style={[styles.continueGo, { backgroundColor: theme.accent }]}>
                <ArrowIcon size={16} color={onAccent} />
              </View>
            </PressScale>
          </Animated.View>
        ) : null}

        {/* What you've read, and every note you've taken. */}
        <View style={styles.shortcuts}>
          <PressScale onPress={() => router.push({ pathname: '/bibleHistory', params: { tab: 'history' } })} haptic="press" scaleTo={0.97}
            accessibilityRole="button" accessibilityLabel={`Reading history${totals ? `, ${totals.reads} chapters` : ''}`} style={styles.shortcut}>
            <View style={styles.shortcutIcon}><HistoryIcon color={theme.pillInk} /></View>
            <Text style={styles.shortcutTitle}>History</Text>
            <Text style={styles.shortcutSub}>{totals ? `${totals.reads} ${totals.reads === 1 ? 'chapter' : 'chapters'}` : 'What you read'}</Text>
          </PressScale>
          <PressScale onPress={() => router.push({ pathname: '/bibleHistory', params: { tab: 'notes' } })} haptic="press" scaleTo={0.97}
            accessibilityRole="button" accessibilityLabel={`My notes${totals ? `, ${totals.notes}` : ''}`} style={styles.shortcut}>
            <View style={styles.shortcutIcon}><PenIcon size={16} color={theme.pillInk} /></View>
            <Text style={styles.shortcutTitle}>My notes</Text>
            <Text style={styles.shortcutSub}>{totals ? `${totals.notes} ${totals.notes === 1 ? 'note' : 'notes'}` : 'Everything you wrote'}</Text>
          </PressScale>
        </View>

        <SlidingSegments
          theme={theme}
          value={version}
          onChange={setVersion}
          segments={BIBLE_VERSIONS.map(v => ({ key: v.key, label: v.label }))}
          style={styles.versions}
        />

        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={text => { setQuery(text); setOpenBook(null); }}
            placeholder="Find a book"
            placeholderTextColor={theme.muted}
            selectionColor={theme.accent}
            keyboardAppearance={theme.isDark ? 'dark' : 'default'}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Find a book"
            style={styles.searchInput}
          />
          {searching ? (
            <PressScale onPress={() => setQuery('')} haptic={null} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.searchClear}>
              <CloseIcon size={14} color={theme.inkSoft} />
            </PressScale>
          ) : null}
        </View>

        {!searching ? (
          <SlidingSegments
            theme={theme}
            value={testament}
            onChange={t => { setTestament(t); setOpenBook(null); }}
            segments={[{ key: 'old', label: 'Old Testament' }, { key: 'new', label: 'New Testament' }]}
            style={styles.testaments}
          />
        ) : null}

        <Animated.View key={searching ? 'search' : testament} entering={enterFade(220)} layout={LIST_MOTION} style={styles.list}>
          {books.length === 0 ? (
            <Text style={styles.empty}>No book by that name.</Text>
          ) : books.map((b, i) => {
            const open = openBook === b.index;
            return (
              <Animated.View key={b.name} layout={LIST_MOTION} style={i > 0 && styles.bookDivider}>
                <PressScale
                  onPress={() => (b.chapters === 1 ? read({ book: b.index, chapter: 1 }) : toggleBook(b.index))}
                  haptic="select"
                  scaleTo={0.99}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${b.name}, ${b.chapters} ${b.chapters === 1 ? 'chapter' : 'chapters'}`}
                  style={styles.bookRow}>
                  <Text style={[styles.bookName, open && styles.bookNameOpen]}>{b.name}</Text>
                  <Text style={styles.bookCount}>{b.chapters === 1 ? '1 chapter' : `${b.chapters}`}</Text>
                  <View style={[styles.chevron, open && styles.chevronOpen]}>
                    <ArrowIcon size={12} color={theme.inkSoft} />
                  </View>
                </PressScale>
                {open ? (
                  <Animated.View entering={enterFade(200)} style={styles.chapters}>
                    {Array.from({ length: b.chapters }, (_, c) => {
                      const done = readInBook.has(c + 1);
                      const here = lastRead?.book === b.index && lastRead.chapter === c + 1;
                      return (
                        <PressScale
                          key={c}
                          onPress={() => read({ book: b.index, chapter: c + 1 })}
                          haptic="press"
                          scaleTo={0.92}
                          accessibilityRole="button"
                          accessibilityLabel={`${b.name} chapter ${c + 1}${done ? ', read' : ''}`}
                          style={[styles.chapterChip, done && styles.chapterChipDone, here && styles.chapterChipHere]}>
                          <Text style={[styles.chapterText, done && styles.chapterTextDone, here && { color: onAccent }]}>{c + 1}</Text>
                        </PressScale>
                      );
                    })}
                  </Animated.View>
                ) : null}
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {reading ? (
        <BiblePassageReader
          references={references}
          onClose={closeReader}
          backLabel="Back to the Bible"
          onPrevChapter={atStart ? undefined : () => step(-1)}
          onNextChapter={atEnd ? undefined : () => step(1)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingBottom: 56, width: '100%', maxWidth: 680, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 6 },
  roundBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, paddingHorizontal: 14, borderRadius: 18,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  levelText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.ink, fontVariant: ['tabular-nums'] },
  levelTrack: { width: 54, height: 4, borderRadius: 2, backgroundColor: theme.line, overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: 2, backgroundColor: theme.accent },
  title: { fontFamily: FONTS.display, fontSize: 40, lineHeight: 46, color: theme.ink, marginTop: 10, paddingHorizontal: 6 },
  titleAccent: { color: theme.accent },
  subtitle: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 21, color: theme.inkSoft, marginTop: 6, paddingHorizontal: 6 },
  earned: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.pillInk, marginTop: 10, paddingHorizontal: 6 },
  stats: {
    marginTop: 18, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: 20,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: FONTS.display, fontSize: 24, color: theme.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: FONTS.body, fontSize: 12, color: theme.inkSoft },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: theme.line },
  continueCard: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
    shadowColor: '#000', shadowOpacity: theme.isDark ? 0.3 : 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  continueLabel: { fontFamily: FONTS.body, fontSize: 13, color: theme.inkSoft },
  continueRef: { fontFamily: FONTS.display, fontSize: 26, color: theme.ink, marginTop: 2 },
  continueGo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', gap: 10, marginTop: 12 },
  shortcut: {
    flex: 1, padding: 16, borderRadius: 20, gap: 2,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  shortcutIcon: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pillBg, marginBottom: 8,
  },
  shortcutTitle: { fontFamily: FONTS.bodySemi, fontSize: 15, color: theme.ink },
  shortcutSub: { fontFamily: FONTS.body, fontSize: 12.5, color: theme.inkSoft, fontVariant: ['tabular-nums'] },
  versions: { marginTop: 22 },
  search: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: 16, paddingLeft: 16,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  searchInput: { flex: 1, minHeight: 48, fontFamily: FONTS.body, fontSize: 16, color: theme.ink },
  searchClear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  testaments: { marginTop: 12 },
  list: {
    marginTop: 12, borderRadius: 22, overflow: 'hidden',
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  empty: { fontFamily: FONTS.body, fontSize: 15, color: theme.inkSoft, textAlign: 'center', paddingVertical: 28 },
  bookDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  bookRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18 },
  bookName: { flex: 1, fontFamily: FONTS.display, fontSize: 19, color: theme.ink },
  bookNameOpen: { color: theme.accent },
  bookCount: { fontFamily: FONTS.body, fontSize: 13, color: theme.inkSoft, fontVariant: ['tabular-nums'] },
  chevron: { width: 20, alignItems: 'center' },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  chapters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 18, paddingTop: 2 },
  chapterChip: {
    width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgSoft,
  },
  chapterChipDone: { backgroundColor: theme.pillBg },
  chapterChipHere: { backgroundColor: theme.accent },
  chapterText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: theme.ink, fontVariant: ['tabular-nums'] },
  chapterTextDone: { color: theme.pillInk },
});
