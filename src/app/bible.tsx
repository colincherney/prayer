import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BiblePassageReader } from '@/components/saint/BiblePassageReader';
import { PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import { ArrowIcon, BackIcon } from '@/components/saint/Icons';
import { enterFade } from '@/components/saint/motion';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { BIBLE_BOOKS } from '@/lib/bibleBooks';
import { BIBLE_VERSIONS, useBibleVersion } from '@/lib/bibleVersion';
import { LOCAL_KEYS, readLocal, writeLocal } from '@/lib/localCache';

type Place = { book: number; chapter: number };
const refOf = ({ book, chapter }: Place) => `${BIBLE_BOOKS[book].name} ${chapter}`;

/** The whole Bible: pick a book and a chapter, read it in either version, and carry on from where you stopped. */
export default function BibleScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [version, setVersion] = useBibleVersion();
  const [testament, setTestament] = useState<'old' | 'new'>('new');
  const [openBook, setOpenBook] = useState<number | null>(null);
  const [reading, setReading] = useState<Place | null>(null);
  const [lastRead, setLastRead] = useState<Place | undefined>(() => {
    const saved = readLocal<Place>(LOCAL_KEYS.bibleLastRead);
    return saved && BIBLE_BOOKS[saved.book] && saved.chapter >= 1 && saved.chapter <= BIBLE_BOOKS[saved.book].chapters ? saved : undefined;
  });

  const books = useMemo(
    () => BIBLE_BOOKS.map((b, i) => ({ ...b, index: i })).filter(b => b.testament === testament),
    [testament],
  );
  const references = useMemo(() => (reading ? [refOf(reading)] : []), [reading]);

  const read = (place: Place) => {
    setReading(place);
    setLastRead(place);
    writeLocal(LOCAL_KEYS.bibleLastRead, place).catch(() => {});
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} haptic={null} accessibilityRole="button" accessibilityLabel="Back" style={styles.roundBtn}>
            <BackIcon size={16} color={theme.ink} />
          </PressScale>
        </View>

        <Text accessibilityRole="header" style={styles.title}>The Bible</Text>
        <Text style={styles.subtitle}>Read any book, any chapter. Pick the version you love.</Text>

        <SlidingSegments
          theme={theme}
          value={version}
          onChange={setVersion}
          segments={BIBLE_VERSIONS.map(v => ({ key: v.key, label: v.label }))}
          style={styles.versions}
        />

        {lastRead ? (
          <PressScale onPress={() => read(lastRead)} haptic="press" scaleTo={0.98} accessibilityRole="button"
            accessibilityLabel={`Continue reading ${refOf(lastRead)}`} style={styles.continueCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueLabel}>Continue reading</Text>
              <Text style={styles.continueRef}>{refOf(lastRead).replace(/^Psalms/, 'Psalm')}</Text>
            </View>
            <View style={styles.continueGo}>
              <ArrowIcon size={16} color={theme.isDark ? theme.bg : theme.accentInk} />
            </View>
          </PressScale>
        ) : null}

        <SlidingSegments
          theme={theme}
          value={testament}
          onChange={t => { setTestament(t); setOpenBook(null); }}
          segments={[{ key: 'old', label: 'Old Testament' }, { key: 'new', label: 'New Testament' }]}
          style={styles.testaments}
        />

        <View key={testament} style={styles.list}>
          {books.map((b, i) => {
            const open = openBook === b.index;
            return (
              <View key={b.name} style={[styles.bookWrap, i > 0 && styles.bookDivider]}>
                <PressScale
                  onPress={() => (b.chapters === 1 ? read({ book: b.index, chapter: 1 }) : setOpenBook(open ? null : b.index))}
                  haptic="select"
                  scaleTo={0.99}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${b.name}, ${b.chapters} ${b.chapters === 1 ? 'chapter' : 'chapters'}`}
                  style={styles.bookRow}>
                  <Text style={styles.bookName}>{b.name}</Text>
                  <Text style={styles.bookCount}>{b.chapters}</Text>
                </PressScale>
                {open ? (
                  <Animated.View entering={enterFade(200)} style={styles.chapters}>
                    {Array.from({ length: b.chapters }, (_, c) => (
                      <PressScale
                        key={c}
                        onPress={() => read({ book: b.index, chapter: c + 1 })}
                        haptic="press"
                        scaleTo={0.92}
                        accessibilityRole="button"
                        accessibilityLabel={`${b.name} chapter ${c + 1}`}
                        style={styles.chapterChip}>
                        <Text style={styles.chapterText}>{c + 1}</Text>
                      </PressScale>
                    ))}
                  </Animated.View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {reading ? (
        <BiblePassageReader
          references={references}
          onClose={() => setReading(null)}
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
  content: { paddingHorizontal: 16, paddingBottom: 48, width: '100%', maxWidth: 680, alignSelf: 'center' },
  topBar: { paddingTop: 8, paddingBottom: 6 },
  roundBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  title: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 42, color: theme.ink, marginTop: 8, paddingHorizontal: 6 },
  subtitle: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 21, color: theme.inkSoft, marginTop: 4, paddingHorizontal: 6 },
  versions: { marginTop: 18 },
  continueCard: {
    marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20,
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  continueLabel: { fontFamily: FONTS.body, fontSize: 13, color: theme.inkSoft },
  continueRef: { fontFamily: FONTS.display, fontSize: 22, color: theme.ink, marginTop: 2 },
  continueGo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent },
  testaments: { marginTop: 22 },
  list: {
    marginTop: 12, borderRadius: 20, overflow: 'hidden',
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  bookWrap: {},
  bookDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  bookRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  bookName: { flex: 1, fontFamily: FONTS.display, fontSize: 18, color: theme.ink },
  bookCount: { fontFamily: FONTS.body, fontSize: 13, color: theme.inkSoft, fontVariant: ['tabular-nums'] },
  chapters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 16 },
  chapterChip: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgSoft,
  },
  chapterText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: theme.ink, fontVariant: ['tabular-nums'] },
});
