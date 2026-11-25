import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import { BackIcon } from '@/components/saint/Icons';
import { enterFade } from '@/components/saint/motion';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { type BibleChapter, fetchBiblePassages } from '@/lib/biblePassages';
import { BIBLE_VERSIONS, bibleVersionName, useBibleVersion } from '@/lib/bibleVersion';

export function BiblePassageReader({ references, onClose }: { references: readonly string[]; onClose: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [version, saveVersion] = useBibleVersion();
  const [wholeChapter, setWholeChapter] = useState(false);
  // undefined while the first load runs, null when it failed. A later load keeps the old text up (dimmed) until the
  // new one arrives, so switching versions never flashes an empty page.
  const [chapters, setChapters] = useState<BibleChapter[] | null>();
  const [loading, setLoading] = useState(true);
  // Which version and length the text on screen is, so it fades in only when new text arrives.
  const [shown, setShown] = useState('');
  const [attempt, setAttempt] = useState(0);
  const list = useRef<SectionList<BibleChapter['data'][number], BibleChapter>>(null);
  const jumpToReading = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchBiblePassages(references, controller.signal, { version, wholeChapter }).then(
      result => {
        if (controller.signal.aborted) return;
        setChapters(result);
        setShown(`${version}-${wholeChapter}`);
        setLoading(false);
      },
      () => {
        if (controller.signal.aborted) return;
        setChapters(null);
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [references, version, wholeChapter, attempt]);

  // Opening the whole chapter lands you where the reading starts, not at verse 1.
  useEffect(() => {
    if (loading || !chapters || !jumpToReading.current) return;
    jumpToReading.current = false;
    const sectionIndex = chapters.findIndex(c => c.data.some(v => v.inReading));
    if (sectionIndex < 0) return;
    const itemIndex = chapters[sectionIndex].data.findIndex(v => v.inReading);
    if (itemIndex <= 0) return;
    requestAnimationFrame(() => list.current?.scrollToLocation({ sectionIndex, itemIndex, viewOffset: 24, animated: true }));
  }, [loading, chapters]);

  const partial = chapters?.some(c => c.partial) ?? false;
  const chapterNames = chapters ? [...new Set(chapters.map(c => c.title))] : [];
  const toggleWhole = () => {
    jumpToReading.current = !wholeChapter;
    setLoading(true);
    setWholeChapter(w => !w);
  };
  const setVersion = (next: typeof version) => {
    setLoading(true);
    saveVersion(next);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <PressScale onPress={onClose} haptic={null} accessibilityRole="button" accessibilityLabel="Back to Quests" style={styles.backButton}>
              <BackIcon size={16} color={theme.ink} />
            </PressScale>
            <View style={styles.heading}>
              <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
                {references.length === 1 ? references[0] : 'Bible readings'}
              </Text>
              <Text style={styles.version}>
                {bibleVersionName(version)}
                {wholeChapter ? ' · Whole chapter' : ''}
              </Text>
            </View>
          </View>
          <SlidingSegments
            theme={theme}
            value={version}
            onChange={setVersion}
            segments={BIBLE_VERSIONS.map(v => ({ key: v.key, label: v.label }))}
          />
        </View>

        {chapters === undefined ? (
          <ActivityIndicator style={styles.loading} color={theme.accent} accessibilityLabel="Loading Bible passage" />
        ) : chapters === null ? (
          <View style={styles.message}>
            <Text style={styles.error} accessibilityLiveRegion="polite">Couldn’t load this passage.</Text>
            <Pressable accessibilityRole="button" style={styles.retry} onPress={() => {
              setChapters(undefined);
              setLoading(true);
              setAttempt(value => value + 1);
            }}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View key={shown} entering={enterFade(220)} style={[styles.body, loading && styles.stale]}>
            <SectionList
              ref={list}
              sections={chapters}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.reading}
              keyExtractor={(verse, i) => `${verse.number}-${i}`}
              onScrollToIndexFailed={() => {}}
              renderSectionHeader={({ section }) => chapters.length > 1 || wholeChapter ? (
                <Text accessibilityRole="header" style={styles.chapter}>{section.title}</Text>
              ) : null}
              renderItem={({ item }) => {
                const marked = wholeChapter && partial && item.inReading;
                return (
                  <View style={[styles.verse, marked && styles.verseMarked]}>
                    <Text style={[styles.verseNumber, marked && styles.verseNumberMarked]}>{item.number}</Text>
                    <Text selectable style={styles.verseText}>{item.text}</Text>
                  </View>
                );
              }}
              ListFooterComponent={partial ? (
                <PressScale
                  onPress={toggleWhole}
                  haptic="select"
                  scaleTo={0.98}
                  accessibilityRole="button"
                  style={styles.wholeButton}>
                  <Text style={styles.wholeButtonText}>
                    {wholeChapter ? 'Show just the reading' : `Read all of ${chapterNames.join(' and ')}`}
                  </Text>
                </PressScale>
              ) : undefined}
            />
          </Animated.View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: {
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.line,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
  heading: { flex: 1 },
  title: { fontFamily: FONTS.display, fontSize: 28, color: theme.ink },
  version: { fontFamily: FONTS.body, fontSize: 12, color: theme.inkSoft },
  loading: { marginTop: 36 },
  message: { alignItems: 'center', gap: 12, padding: 28 },
  error: { fontFamily: FONTS.body, fontSize: 15, color: theme.ink },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 22, backgroundColor: theme.accent },
  retryText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.accentInk },
  body: { flex: 1 },
  stale: { opacity: 0.45 },
  reading: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 36, width: '100%', maxWidth: 680, alignSelf: 'center' },
  chapter: { fontFamily: FONTS.display, fontSize: 22, color: theme.ink, marginTop: 10, marginBottom: 12 },
  verse: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  // The verses the quest asked for, picked out softly when the whole chapter is showing.
  verseMarked: { backgroundColor: theme.bgSoft, borderRadius: 12, marginHorizontal: -10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  verseNumber: { minWidth: 24, fontFamily: FONTS.bodySemi, fontSize: 12, color: theme.inkSoft, marginTop: 5 },
  verseNumberMarked: { color: theme.pillInk },
  verseText: { flex: 1, fontFamily: FONTS.display, fontSize: 20, lineHeight: 29, color: theme.ink },
  wholeButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.line,
  },
  wholeButtonText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: theme.ink },
});
