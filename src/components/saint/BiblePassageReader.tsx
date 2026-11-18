import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { BackIcon } from '@/components/saint/Icons';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { fetchBiblePassages } from '@/lib/biblePassages';

type Chapters = Awaited<ReturnType<typeof fetchBiblePassages>>;

export function BiblePassageReader({ references, onClose }: { references: readonly string[]; onClose: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [chapters, setChapters] = useState<Chapters | null>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchBiblePassages(references, controller.signal).then(
      result => { if (!controller.signal.aborted) setChapters(result); },
      () => { if (!controller.signal.aborted) setChapters(null); },
    );
    return () => controller.abort();
  }, [references, attempt]);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to Quests" style={styles.backButton}>
            <BackIcon size={16} color={theme.ink} />
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title} accessibilityRole="header">{references.length === 1 ? references[0] : 'Bible readings'}</Text>
            <Text style={styles.version}>King James Version</Text>
          </View>
        </View>

        {chapters === undefined ? (
          <ActivityIndicator style={styles.loading} color={theme.accent} accessibilityLabel="Loading Bible passage" />
        ) : chapters === null ? (
          <View style={styles.message}>
            <Text style={styles.error} accessibilityLiveRegion="polite">Couldn’t load this passage.</Text>
            <Pressable accessibilityRole="button" style={styles.retry} onPress={() => {
              setChapters(undefined);
              setAttempt(value => value + 1);
            }}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <SectionList
            sections={chapters}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.reading}
            keyExtractor={verse => String(verse.number)}
            renderSectionHeader={({ section }) => chapters.length > 1 ? (
              <Text accessibilityRole="header" style={styles.chapter}>{section.title}</Text>
            ) : null}
            renderItem={({ item }) => (
              <View style={styles.verse}>
                <Text style={styles.verseNumber}>{item.number}</Text>
                <Text selectable style={styles.verseText}>{item.text}</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
  heading: { flex: 1 },
  title: { fontFamily: FONTS.display, fontSize: 28, color: theme.ink },
  version: { fontFamily: FONTS.body, fontSize: 12, color: theme.inkSoft },
  loading: { marginTop: 36 },
  message: { alignItems: 'center', gap: 12, padding: 28 },
  error: { fontFamily: FONTS.body, fontSize: 15, color: theme.ink },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 22, backgroundColor: theme.accent },
  retryText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.accentInk },
  reading: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 28, width: '100%', maxWidth: 680, alignSelf: 'center' },
  chapter: { fontFamily: FONTS.display, fontSize: 22, color: theme.ink, marginTop: 10, marginBottom: 12 },
  verse: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  verseNumber: { minWidth: 24, fontFamily: FONTS.bodySemi, fontSize: 12, color: theme.inkSoft, marginTop: 5 },
  verseText: { flex: 1, fontFamily: FONTS.display, fontSize: 20, lineHeight: 29, color: theme.ink },
});
