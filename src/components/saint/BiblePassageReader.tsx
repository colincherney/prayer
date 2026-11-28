import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { authHaptic, softHaptic } from '@/components/saint/authHaptics';
import { PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import { ArrowIcon, BackIcon, CloseIcon, PenIcon } from '@/components/saint/Icons';
import { DURATION, EASE_DRAWER, EASE_OUT, SPRING_SNAP } from '@/components/saint/motion';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { type BibleChapter, fetchBiblePassages } from '@/lib/biblePassages';
import {
  addNote,
  type BibleNote,
  deleteNote,
  fetchChapterHighlights,
  fetchChapterNotes,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_SWATCH,
  HIGHLIGHT_WASH,
  type HighlightColor,
  markChapterRead,
  removeHighlight,
  setHighlight,
} from '@/lib/bibleProgress';
import { BIBLE_VERSIONS, bibleVersionName, useBibleVersion } from '@/lib/bibleVersion';
import { XP } from '@/lib/pet';
import { PageLoader } from './PageLoader';

type Props = {
  references: readonly string[];
  onClose: () => void;
  backLabel?: string;
  /** For reading straight through: swipe (or the buttons at the end) to step back or on a chapter. */
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
};

const SWIPE_LINE = 80;

export function BiblePassageReader({ references, onClose, backLabel = 'Back to Quests', onPrevChapter, onNextChapter }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width: screenW } = useWindowDimensions();
  const [version, saveVersion] = useBibleVersion();
  const [wholeChapter, setWholeChapter] = useState(false);
  // undefined while the first load runs, null when it failed. A later load keeps the old text up (dimmed) until the
  // new one arrives, so switching versions or chapters never flashes an empty page.
  const [chapters, setChapters] = useState<BibleChapter[] | null>();
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [selected, setSelected] = useState<{ chapter: number; verse: number } | null>(null);
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const jumpToReading = useRef(false);
  const counted = useRef(new Set<string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportH = useRef(0);
  const shortTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chapterTops = useRef(new Map<string, number>());

  const swipeable = !!(onPrevChapter || onNextChapter);
  const first = chapters?.[0];
  const noteChapter = selected?.chapter ?? first?.chapter;
  const book = first?.book;

  useEffect(() => {
    const controller = new AbortController();
    fetchBiblePassages(references, controller.signal, { version, wholeChapter }).then(
      result => {
        if (controller.signal.aborted) return;
        setChapters(result);
        setShown(`${version}-${wholeChapter}-${references.join('|')}`);
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

  // This chapter's notes, newest first.
  useEffect(() => {
    if (!book || !noteChapter) return;
    const controller = new AbortController();
    fetchChapterNotes(book, noteChapter, controller.signal).then(
      found => { if (!controller.signal.aborted) setNotes(found); },
      () => { if (!controller.signal.aborted) setNotes([]); },
    );
    return () => controller.abort();
  }, [book, noteChapter]);

  // Highlights for every chapter on the page, keyed "chapter:verse".
  const [highlights, setHighlights] = useState<Map<string, HighlightColor>>(new Map());
  const chapterList = chapters?.map(c => c.chapter).join(',') ?? '';
  useEffect(() => {
    if (!book || !chapterList) return;
    const controller = new AbortController();
    Promise.all(chapterList.split(',').map(n => fetchChapterHighlights(book, Number(n), controller.signal))).then(
      found => {
        if (controller.signal.aborted) return;
        setHighlights(new Map(found.flat().map(h => [`${h.chapter}:${h.verse}`, h.color])));
      },
      () => {},
    );
    return () => controller.abort();
  }, [book, chapterList]);

  const highlight = (color: HighlightColor) => {
    if (!selected || !book) return;
    const key = `${selected.chapter}:${selected.verse}`;
    const before = highlights.get(key);
    const { chapter, verse } = selected;
    const apply = (value?: HighlightColor) =>
      setHighlights(prev => {
        const next = new Map(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      });
    authHaptic('select');
    if (before === color) {
      // Tapping the colour it already has takes the highlight off again.
      apply(undefined);
      removeHighlight(book, chapter, verse).catch(() => apply(before));
      setSelected(null);
      return;
    }
    apply(color);
    setSelected(null);
    setHighlight(book, chapter, verse, color).then(
      () => { if (!before) flash(`Highlighted · +${XP.bibleHighlight} XP`); },
      () => { apply(before); authHaptic('error'); flash('Couldn’t save that highlight'); },
    );
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (shortTimer.current) clearTimeout(shortTimer.current);
  }, []);

  const flash = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(prev => ({ id: (prev?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  // A chapter counts as read once you reach its end: +3 XP, the first time each day. A quest's few verses don't count
  // (the quest pays for those); the whole chapter does.
  const countRead = () => {
    if (!chapters || loading) return;
    if (chapters.some(c => c.partial) && !wholeChapter) return;
    for (const c of chapters) {
      const key = `${c.book} ${c.chapter}`;
      if (counted.current.has(key)) continue;
      counted.current.add(key);
      markChapterRead(c.book, c.chapter).then(earned => {
        if (!earned) return;
        authHaptic('success');
        flash(`${c.title} read · +${XP.bibleRead} XP`);
      });
    }
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 160) countRead();
  };
  // A short chapter that fits on one screen: reaching its end is just staying with it a little while.
  const onContentSize = (_: number, h: number) => {
    if (shortTimer.current) clearTimeout(shortTimer.current);
    if (viewportH.current && h <= viewportH.current + 40) shortTimer.current = setTimeout(countRead, 6000);
  };

  // Opening the whole chapter lands you where the reading starts, not at verse 1.
  const onReadingLayout = (chapterKey: string, y: number) => {
    if (!jumpToReading.current) return;
    jumpToReading.current = false;
    const top = (chapterTops.current.get(chapterKey) ?? 0) + y;
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, top - 24), animated: true }));
  };

  const partial = chapters?.some(c => c.partial) ?? false;
  const chapterNames = chapters ? [...new Set(chapters.map(c => c.title))] : [];

  const resetForNewText = () => {
    setLoading(true);
    setSelected(null);
    setNotesOpen(false);
  };
  const setVersion = (next: typeof version) => {
    if (next === version) return;
    setLoading(true);
    saveVersion(next);
  };
  const toggleWhole = () => {
    jumpToReading.current = !wholeChapter;
    resetForNewText();
    setWholeChapter(w => !w);
  };
  const turn = (dir: number) => {
    const go = dir > 0 ? onNextChapter : onPrevChapter;
    if (!go) return;
    resetForNewText();
    softHaptic();
    // The new chapter's page mounts fresh, so it opens at the top.
    go();
  };

  // Swipe sideways to turn the page: the text follows your finger, past the line you feel a tick, and it turns.
  const dragX = useSharedValue(0);
  const armed = useSharedValue(0);
  const pageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() }] }));
  const canPrev = !!onPrevChapter;
  const canNext = !!onNextChapter;
  const swipe = Gesture.Pan()
    .enabled(swipeable && !notesOpen)
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onUpdate(e => {
      const x = e.translationX;
      const blocked = (x > 0 && !canPrev) || (x < 0 && !canNext);
      // Nowhere to go that way: rising friction instead of a hard stop.
      dragX.set(blocked ? (x * 50) / (50 + Math.abs(x)) : x * 0.9);
      const next = !blocked && Math.abs(x) > SWIPE_LINE ? Math.sign(x) : 0;
      if (next !== armed.get()) {
        armed.set(next);
        if (next !== 0) scheduleOnRN(authHaptic, 'select');
      }
    })
    .onEnd(e => {
      const x = e.translationX;
      const blocked = (x > 0 && !canPrev) || (x < 0 && !canNext);
      const fling = Math.abs(e.velocityX) > 700 && Math.sign(e.velocityX) === Math.sign(x);
      armed.set(0);
      if (!blocked && x !== 0 && (Math.abs(x) > SWIPE_LINE || fling)) {
        const dir = x < 0 ? 1 : -1;
        // The page slides off, the next one comes in from the other side and settles.
        dragX.set(
          withTiming(-dir * screenW, { duration: 200, easing: EASE_OUT }, finished => {
            if (!finished) return;
            dragX.set(withSequence(withTiming(dir * 60, { duration: 0 }), withSpring(0, SPRING_SNAP)));
            scheduleOnRN(turn, dir);
          }),
        );
      } else {
        dragX.set(withSpring(0, SPRING_SNAP));
      }
    });

  const saveNote = async () => {
    const body = draft.trim();
    if (!body || !book || !noteChapter || saving) return;
    setSaving(true);
    setNoteError(null);
    try {
      const note = await addNote({
        book,
        chapter: noteChapter,
        verse: selected && selected.chapter === noteChapter ? selected.verse : null,
        version,
        body,
      });
      setNotes(prev => [note, ...prev]);
      setDraft('');
      authHaptic('success');
      flash(`Note saved · +${XP.bibleNote} XP`);
    } catch {
      authHaptic('error');
      setNoteError('Couldn’t save your note. Try again.');
    } finally {
      setSaving(false);
    }
  };
  const removeNote = (note: BibleNote) => {
    Alert.alert('Delete this note?', 'Its XP goes with it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setNotes(prev => prev.filter(n => n.id !== note.id));
          deleteNote(note.id).catch(() => setNotes(prev => [note, ...prev]));
        },
      },
    ]);
  };

  const notedVerses = new Set(notes.filter(n => n.verse !== null).map(n => `${n.chapter}:${n.verse}`));
  const title = references.length === 1 ? references[0].replace(/^Psalms /, 'Psalm ') : 'Bible readings';

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <PressScale onPress={onClose} haptic={null} accessibilityRole="button" accessibilityLabel={backLabel} style={styles.roundBtn}>
              <BackIcon size={16} color={theme.ink} />
            </PressScale>
            <View style={styles.heading}>
              <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>{title}</Text>
              <Text style={styles.version} numberOfLines={1}>
                {bibleVersionName(version)}
                {wholeChapter ? ' · Whole chapter' : ''}
              </Text>
            </View>
            <PressScale
              onPress={() => setNotesOpen(o => !o)}
              haptic="select"
              accessibilityRole="button"
              accessibilityLabel={`Notes, ${notes.length}`}
              style={[styles.roundBtn, notesOpen && styles.roundBtnOn]}>
              <PenIcon size={17} color={notesOpen ? (theme.isDark ? theme.bg : theme.accentInk) : theme.ink} />
              {notes.length > 0 && !notesOpen ? (
                <View style={styles.noteCount}>
                  <Text style={styles.noteCountText}>{notes.length}</Text>
                </View>
              ) : null}
            </PressScale>
          </View>
          <SlidingSegments
            theme={theme}
            value={version}
            onChange={setVersion}
            segments={BIBLE_VERSIONS.map(v => ({ key: v.key, label: v.label }))}
          />
        </View>

        {chapters === undefined ? (
          <PageLoader style={styles.loading} color={theme.accent} accessibilityLabel="Loading Bible passage" />
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
          <GestureDetector gesture={swipe}>
            <Animated.View style={[styles.body, pageStyle]}>
              <Animated.View key={shown} entering={FadeIn.duration(240).easing(EASE_OUT)} style={[styles.body, loading && styles.stale]}>
                <ScrollView
                  ref={scroll}
                  contentContainerStyle={styles.reading}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={200}
                  onScroll={onScroll}
                  onLayout={e => { viewportH.current = e.nativeEvent.layout.height; }}
                  onContentSizeChange={onContentSize}
                  keyboardShouldPersistTaps="handled">
                  {chapters.map(c => {
                    // With the whole chapter open, the quest's verses sit in their own soft block so you keep your place.
                    const firstIn = c.data.findIndex(v => v.inReading);
                    const lastIn = c.data.length - 1 - [...c.data].reverse().findIndex(v => v.inReading);
                    const groups = wholeChapter && c.partial
                      ? [
                          { key: 'before', reading: false, verses: c.data.slice(0, firstIn) },
                          { key: 'reading', reading: true, verses: c.data.slice(firstIn, lastIn + 1) },
                          { key: 'after', reading: false, verses: c.data.slice(lastIn + 1) },
                        ]
                      : [{ key: 'all', reading: false, verses: c.data }];
                    return (
                      <View key={c.key} onLayout={e => chapterTops.current.set(c.key, e.nativeEvent.layout.y)} style={styles.chapterBlock}>
                        <Text style={styles.chapterBook}>{c.title.replace(/ \d+$/, '')}</Text>
                        <Text accessibilityRole="header" style={styles.chapterNumber}>{c.chapter}</Text>
                        {groups.filter(g => g.verses.length).map(g => (
                          <View
                            key={g.key}
                            onLayout={g.reading ? e => onReadingLayout(c.key, e.nativeEvent.layout.y) : undefined}
                            style={g.reading && styles.readingBlock}>
                            <Text style={styles.verseText}>
                              {g.verses.map(v => {
                                const isSelected = selected?.chapter === c.chapter && selected.verse === v.number;
                                const noted = notedVerses.has(`${c.chapter}:${v.number}`);
                                return (
                                  <Text
                                    key={v.number}
                                    onPress={() => {
                                      authHaptic('select');
                                      setSelected(isSelected ? null : { chapter: c.chapter, verse: v.number });
                                    }}
                                    accessibilityHint="Select this verse to take a note on it"
                                    style={[
                                      highlights.has(`${c.chapter}:${v.number}`) && {
                                        backgroundColor: HIGHLIGHT_WASH[highlights.get(`${c.chapter}:${v.number}`)!],
                                      },
                                      isSelected && styles.verseSelected,
                                    ]}>
                                    <Text style={[styles.verseNumber, noted && styles.verseNumberNoted]}>{`${v.number} `}</Text>
                                    {v.text}{' '}
                                  </Text>
                                );
                              })}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}

                  {partial ? (
                    <PressScale onPress={toggleWhole} haptic="select" scaleTo={0.98} accessibilityRole="button" style={styles.pill}>
                      <Text style={styles.pillText}>
                        {wholeChapter ? 'Show just the reading' : `Read all of ${chapterNames.join(' and ')}`}
                      </Text>
                    </PressScale>
                  ) : swipeable ? (
                    <View style={styles.chapterNav}>
                      {onPrevChapter ? (
                        <PressScale onPress={() => turn(-1)} haptic={null} scaleTo={0.98} accessibilityRole="button"
                          accessibilityLabel="Previous chapter" style={[styles.pill, styles.navPill]}>
                          <BackIcon size={14} color={theme.ink} />
                          <Text style={styles.pillText}>Previous</Text>
                        </PressScale>
                      ) : <View style={styles.navPill} />}
                      {onNextChapter ? (
                        <PressScale onPress={() => turn(1)} haptic={null} scaleTo={0.98} accessibilityRole="button"
                          accessibilityLabel="Next chapter" style={[styles.pill, styles.navPill, styles.pillPrimary]}>
                          <Text style={[styles.pillText, styles.pillPrimaryText]}>Next chapter</Text>
                          <ArrowIcon size={14} color={theme.isDark ? theme.bg : theme.accentInk} />
                        </PressScale>
                      ) : <View style={styles.navPill} />}
                    </View>
                  ) : null}
                  {swipeable ? <Text style={styles.hint}>Swipe the page to turn chapters. Tap a verse to take a note.</Text> : null}
                </ScrollView>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        )}

        {toast ? (
          <Animated.View key={toast.id} entering={FadeIn.duration(DURATION.quick).easing(EASE_OUT)} exiting={FadeOut.duration(240)}
            pointerEvents="none" style={styles.toast}>
            <Text style={styles.toastText}>{toast.text}</Text>
          </Animated.View>
        ) : null}

        {/* A verse is picked: highlight it, or write about it. */}
        {selected && !notesOpen ? (
          <Animated.View entering={SlideInDown.duration(DURATION.enter).easing(EASE_DRAWER)} exiting={SlideOutDown.duration(200)} style={styles.verseBar}>
            <View style={styles.verseBarTop}>
              <Text style={styles.verseBarText}>Verse {selected.verse}</Text>
              <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Clear verse" style={styles.iconBtn}>
                <CloseIcon size={15} color={theme.inkSoft} />
              </Pressable>
            </View>
            <View style={styles.verseBarRow}>
              {HIGHLIGHT_COLORS.map(color => {
                const on = highlights.get(`${selected.chapter}:${selected.verse}`) === color;
                return (
                  <PressScale
                    key={color}
                    onPress={() => highlight(color)}
                    haptic={null}
                    scaleTo={0.88}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={on ? `Remove ${color} highlight` : `Highlight ${color}`}
                    style={styles.swatchHit}>
                    <View style={[styles.swatch, { backgroundColor: HIGHLIGHT_SWATCH[color] }, on && styles.swatchOn]}>
                      {on ? <CloseIcon size={12} color="#2A2118" /> : null}
                    </View>
                  </PressScale>
                );
              })}
              <View style={{ flex: 1 }} />
              <PressScale onPress={() => setNotesOpen(true)} haptic="press" accessibilityRole="button" style={styles.verseBarBtn}>
                <PenIcon size={15} color={theme.isDark ? theme.bg : theme.accentInk} />
                <Text style={styles.verseBarBtnText}>Note</Text>
              </PressScale>
            </View>
          </Animated.View>
        ) : null}

        {notesOpen ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap} pointerEvents="box-none">
            <Animated.View entering={SlideInDown.duration(DURATION.sheet).easing(EASE_DRAWER)} exiting={SlideOutDown.duration(240)} style={styles.sheet}>
              <View style={styles.sheetGrip} />
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>
                  {selected ? `Verse ${selected.verse}` : first?.title ?? 'Notes'}
                </Text>
                <Pressable onPress={() => setNotesOpen(false)} accessibilityRole="button" accessibilityLabel="Close notes" style={styles.iconBtn}>
                  <CloseIcon size={16} color={theme.inkSoft} />
                </Pressable>
              </View>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What is God saying to you here?"
                placeholderTextColor={theme.muted}
                selectionColor={theme.accent}
                keyboardAppearance={theme.isDark ? 'dark' : 'default'}
                multiline
                maxLength={2000}
                style={styles.noteInput}
                accessibilityLabel="Your note"
              />
              <PressScale onPress={saveNote} disabled={!draft.trim() || saving} haptic={null} accessibilityRole="button"
                style={[styles.saveBtn, !draft.trim() && styles.saveBtnOff]}>
                {saving ? (
                  <ActivityIndicator size="small" color={theme.isDark ? theme.bg : theme.accentInk} />
                ) : (
                  <Text style={[styles.saveText, !draft.trim() && styles.saveTextOff]}>Save note · +{XP.bibleNote} XP</Text>
                )}
              </PressScale>
              {noteError ? <Text style={styles.noteError} accessibilityLiveRegion="polite">{noteError}</Text> : null}
              <ScrollView style={styles.noteList} contentContainerStyle={styles.noteListContent} keyboardShouldPersistTaps="handled">
                {notes.length === 0 ? (
                  <Text style={styles.emptyNotes}>No notes on this chapter yet. Only you can see them.</Text>
                ) : notes.map(n => (
                  <Pressable key={n.id} onLongPress={() => removeNote(n)} accessibilityHint="Long press to delete" style={styles.noteCard}>
                    <Text style={styles.noteMeta}>
                      {n.verse ? `Verse ${n.verse} · ` : ''}
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.noteBody}>{n.body}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (theme: Theme) => {
  const onAccent = theme.isDark ? theme.bg : theme.accentInk;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    header: {
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.line,
      backgroundColor: theme.bg,
      zIndex: 2,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    roundBtn: {
      width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
    },
    roundBtnOn: { backgroundColor: theme.accent, borderColor: theme.accent },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    noteCount: {
      position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
      alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent,
    },
    noteCountText: { fontFamily: FONTS.bodySemi, fontSize: 10.5, color: onAccent, fontVariant: ['tabular-nums'] },
    heading: { flex: 1, alignItems: 'center' },
    title: { fontFamily: FONTS.display, fontSize: 20, color: theme.ink },
    version: { fontFamily: FONTS.body, fontSize: 12, color: theme.inkSoft, marginTop: 1 },
    toast: {
      position: 'absolute', alignSelf: 'center', bottom: 40, zIndex: 5, paddingHorizontal: 18, paddingVertical: 11,
      borderRadius: 22, backgroundColor: theme.ink,
    },
    toastText: { fontFamily: FONTS.bodySemi, fontSize: 13.5, color: theme.bg },
    loading: { marginTop: 36 },
    message: { alignItems: 'center', gap: 12, padding: 28 },
    error: { fontFamily: FONTS.body, fontSize: 15, color: theme.ink },
    retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 22, backgroundColor: theme.accent },
    retryText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.accentInk },
    body: { flex: 1 },
    stale: { opacity: 0.45 },
    reading: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 140, width: '100%', maxWidth: 640, alignSelf: 'center' },
    chapterBlock: { marginBottom: 28 },
    chapterBook: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.inkSoft, textAlign: 'center' },
    chapterNumber: { fontFamily: FONTS.display, fontSize: 64, lineHeight: 72, color: theme.ink, textAlign: 'center', marginBottom: 14 },
    readingBlock: { backgroundColor: theme.bgSoft, borderRadius: 16, marginHorizontal: -12, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 6 },
    verseText: { fontFamily: FONTS.display, fontSize: 20, lineHeight: 33, color: theme.ink },
    verseNumber: { fontFamily: FONTS.bodySemi, fontSize: 11, color: theme.inkSoft },
    verseNumberNoted: { color: theme.pillInk },
    verseSelected: { textDecorationLine: 'underline', textDecorationColor: theme.accent, textDecorationStyle: 'solid' },
    pill: {
      marginTop: 8, minHeight: 48, borderRadius: 24, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 20, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
    },
    pillText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: theme.ink },
    pillPrimary: { backgroundColor: theme.accent, borderColor: theme.accent },
    pillPrimaryText: { color: onAccent },
    chapterNav: { flexDirection: 'row', gap: 10 },
    navPill: { flex: 1 },
    hint: { fontFamily: FONTS.body, fontSize: 12, color: theme.muted, textAlign: 'center', marginTop: 14 },
    verseBar: {
      position: 'absolute', left: 16, right: 16, bottom: 28, gap: 2,
      paddingVertical: 6, paddingHorizontal: 10, paddingLeft: 18, borderRadius: 26, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line, shadowColor: '#000', shadowOpacity: theme.isDark ? 0.4 : 0.12, shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    verseBarTop: { flexDirection: 'row', alignItems: 'center' },
    verseBarRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -8, paddingBottom: 4 },
    verseBarText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: theme.ink },
    swatchHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    swatch: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    swatchOn: { borderWidth: 2, borderColor: theme.ink },
    verseBarBtn: {
      minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, borderRadius: 22,
      backgroundColor: theme.accent,
    },
    verseBarBtnText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: onAccent },
    sheetWrap: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
    sheet: {
      maxHeight: '72%', gap: 10, paddingHorizontal: 18, paddingBottom: 24, borderTopLeftRadius: 26, borderTopRightRadius: 26,
      backgroundColor: theme.surface, shadowColor: '#000', shadowOpacity: theme.isDark ? 0.45 : 0.14, shadowRadius: 24,
      shadowOffset: { width: 0, height: -6 }, elevation: 10,
    },
    sheetGrip: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: theme.line, marginTop: 8 },
    sheetHead: { flexDirection: 'row', alignItems: 'center' },
    sheetTitle: { flex: 1, fontFamily: FONTS.display, fontSize: 22, color: theme.ink },
    noteInput: {
      minHeight: 96, maxHeight: 180, padding: 14, borderRadius: 16, backgroundColor: theme.bgSoft, textAlignVertical: 'top',
      fontFamily: FONTS.display, fontSize: 17, lineHeight: 24, color: theme.ink,
    },
    saveBtn: { minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent },
    saveBtnOff: { backgroundColor: theme.line },
    saveText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: onAccent },
    saveTextOff: { color: theme.inkSoft },
    noteError: { fontFamily: FONTS.body, fontSize: 13, color: theme.ink },
    noteList: { marginTop: 4 },
    noteListContent: { gap: 10, paddingBottom: 8 },
    emptyNotes: { fontFamily: FONTS.body, fontSize: 14, color: theme.inkSoft, textAlign: 'center', paddingVertical: 12 },
    noteCard: { padding: 14, borderRadius: 16, backgroundColor: theme.bg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line },
    noteMeta: { fontFamily: FONTS.bodySemi, fontSize: 12, color: theme.inkSoft, marginBottom: 4 },
    noteBody: { fontFamily: FONTS.display, fontSize: 16, lineHeight: 23, color: theme.ink },
  });
};
