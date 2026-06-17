import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, {
  Circle,
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useTheme, FONTS } from '@/components/saint/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type BibleVersion = 'KJV' | 'CPVD';

const ENTRY_THEMES = [
  { id: 'health',        label: 'Health',        glyph: '✦', color: '#e0876a' },
  { id: 'family',        label: 'Family',        glyph: '❖', color: '#d4a060' },
  { id: 'work',          label: 'Work',          glyph: '◇', color: '#6096b8' },
  { id: 'grief',         label: 'Grief',         glyph: '❍', color: '#8888b4' },
  { id: 'gratitude',     label: 'Gratitude',     glyph: '✥', color: '#c49070' },
  { id: 'faith',         label: 'Faith',         glyph: '◐', color: '#9070c8' },
  { id: 'relationships', label: 'Relationships', glyph: '◉', color: '#c46888' },
  { id: 'other',         label: 'Other',         glyph: '·', color: '#a09888' },
];

type Entry = {
  id: string;
  date: string;
  dateLong: string;
  theme: string;
  title: string;
  body: string;
  verse: { ref: string; text: string } | null;
  shared: boolean;
  createdAt?: string;
};

// ── Bible verse lookup ────────────────────────────────────────────────────────

const BOOK_NAMES: Record<string, string> = {
  gen: 'Genesis', genesis: 'Genesis', ex: 'Exodus', exodus: 'Exodus',
  lev: 'Leviticus', num: 'Numbers', deut: 'Deuteronomy',
  josh: 'Joshua', ruth: 'Ruth',
  '1 sam': '1 Samuel', '1sam': '1 Samuel', '2 sam': '2 Samuel',
  '1 kgs': '1 Kings', '1 kings': '1 Kings', '2 kgs': '2 Kings',
  ezra: 'Ezra', neh: 'Nehemiah', esth: 'Esther',
  job: 'Job',
  ps: 'Psalms', psalm: 'Psalms', psalms: 'Psalms', psa: 'Psalms',
  prov: 'Proverbs', proverbs: 'Proverbs',
  eccl: 'Ecclesiastes', ecclesiastes: 'Ecclesiastes',
  isa: 'Isaiah', isaiah: 'Isaiah', jer: 'Jeremiah', jeremiah: 'Jeremiah',
  lam: 'Lamentations', lamentations: 'Lamentations',
  ezek: 'Ezekiel', ezekiel: 'Ezekiel', dan: 'Daniel', daniel: 'Daniel',
  hos: 'Hosea', joel: 'Joel', amos: 'Amos',
  jonah: 'Jonah', jon: 'Jonah', mic: 'Micah',
  hab: 'Habakkuk', habakkuk: 'Habakkuk', mal: 'Malachi',
  matt: 'Matthew', mt: 'Matthew', matthew: 'Matthew', mark: 'Mark',
  luke: 'Luke', john: 'John', jn: 'John', acts: 'Acts',
  rom: 'Romans', romans: 'Romans',
  '1 cor': '1 Corinthians', '1cor': '1 Corinthians', '2 cor': '2 Corinthians',
  gal: 'Galatians', eph: 'Ephesians', ephesians: 'Ephesians',
  phil: 'Philippians', php: 'Philippians', philippians: 'Philippians',
  col: 'Colossians', '1 thess': '1 Thessalonians', '1 thes': '1 Thessalonians',
  '1 tim': '1 Timothy', '2 tim': '2 Timothy', titus: 'Titus',
  heb: 'Hebrews', hebrews: 'Hebrews',
  jas: 'James', james: 'James',
  '1 pet': '1 Peter', '1pet': '1 Peter', '2 pet': '2 Peter',
  '1 jn': '1 John', '1jn': '1 John', jude: 'Jude',
  rev: 'Revelation', revelation: 'Revelation',
};

function parseVerseRef(ref: string): { book: string; chapter: string; verse: string } | null {
  const colonIdx = ref.lastIndexOf(':');
  if (colonIdx === -1) return null;
  const beforeColon = ref.slice(0, colonIdx).trim();
  const afterColon = ref.slice(colonIdx + 1).trim().split('-')[0].trim();
  const m = beforeColon.match(/^(.*?)\s+(\d+)$/);
  if (!m) return null;
  const rawBook = m[1].trim();
  const book = BOOK_NAMES[rawBook.toLowerCase()] ?? rawBook;
  return { book, chapter: m[2], verse: afterColon };
}

const CPVD_ONLY_BOOKS = new Set([
  'Tobit','Judith','1 Maccabees','2 Maccabees','Wisdom','Sirach','Baruch',
]);

async function fetchVerseText(ref: string, version: BibleVersion): Promise<string | null> {
  const parsed = parseVerseRef(ref);
  if (!parsed) return null;
  const table = CPVD_ONLY_BOOKS.has(parsed.book) ? 'CPVD' : (version === 'KJV' ? 'KJV' : 'CPVD');
  const { data } = await supabase
    .from(table)
    .select('text')
    .eq('book', parsed.book)
    .eq('chapter', parsed.chapter)
    .eq('verse', parsed.verse)
    .limit(1);
  return data?.[0]?.text ?? null;
}

function formatEntryDate(iso: string): string {
  const d = new Date(iso);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${m[d.getMonth()]} ${d.getDate()}`;
}

function formatEntryDateLong(iso: string): string {
  const d = new Date(iso);
  const m = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Book icon (themed) ────────────────────────────────────────────────────────
function BookIcon({ accent, bg }: { accent: string; bg: string }) {
  return (
    <Svg width={52} height={62} viewBox="0 0 52 62">
      <Defs>
        <LinearGradient id="cover" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0.6} />
        </LinearGradient>
      </Defs>
      {/* Book shadow */}
      <Rect x="6" y="8" width="40" height="52" rx="4" fill={accent} opacity={0.12} />
      {/* Book cover */}
      <Rect x="3" y="4" width="40" height="52" rx="4" fill="url(#cover)" />
      {/* Spine */}
      <Rect x="3" y="4" width="6" height="52" rx="3" fill={accent} opacity={0.4} />
      {/* Pages edge */}
      <Rect x="43" y="6" width="4" height="48" rx="1" fill={bg} opacity={0.55} />
      {/* Cross */}
      <Rect x="20" y="20" width="10" height="24" rx="2" fill={bg} opacity={0.85} />
      <Rect x="14" y="27" width="22" height="10" rx="2" fill={bg} opacity={0.85} />
      {/* Bookmark */}
      <Path d="M32 54 L38 54 L38 62 L35 58 L32 62 Z" fill={bg} opacity={0.6} />
    </Svg>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function ThemeDot({ themeId, size = 8 }: { themeId: string; size?: number }) {
  const t = ENTRY_THEMES.find(th => th.id === themeId);
  const { theme: THEME } = useTheme();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: t?.color ?? THEME.accent,
    }} />
  );
}

function FilterChip({ active, onPress, glyph, children }: {
  active: boolean; onPress: () => void; glyph?: string; children: string;
}) {
  const { theme: THEME } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.chip, {
      borderColor: active ? THEME.accent : THEME.line,
      backgroundColor: active ? THEME.accent + '18' : 'transparent',
    }]}>
      {glyph ? <Text style={[styles.chipGlyph, { color: active ? THEME.accent : THEME.muted }]}>{glyph}</Text> : null}
      <Text style={[styles.chipLabel, { color: active ? THEME.accent : THEME.muted }]}>{children}</Text>
    </Pressable>
  );
}

// ── Bible version picker ──────────────────────────────────────────────────────
function BibleVersionPicker({ version, onSelect }: { version: BibleVersion; onSelect: (v: BibleVersion) => void }) {
  const { theme: THEME } = useTheme();
  return (
    <View style={styles.versionRow}>
      {(['KJV', 'CPVD'] as BibleVersion[]).map(v => (
        <Pressable key={v} onPress={() => onSelect(v)} style={[styles.versionChip, {
          borderColor: version === v ? THEME.accent : THEME.line,
          backgroundColor: version === v ? THEME.accent + '18' : 'transparent',
        }]}>
          <Text style={[styles.versionChipText, { color: version === v ? THEME.accent : THEME.muted }]}>
            {v === 'CPVD' ? 'Catholic' : 'KJV'}
          </Text>
        </Pressable>
      ))}
      <Text style={[styles.versionNote, { color: THEME.muted }]}>More versions coming soon</Text>
    </View>
  );
}

// ── Prompt card ───────────────────────────────────────────────────────────────
function PromptCard({ onNew }: { onNew: () => void }) {
  const { theme: THEME } = useTheme();
  return (
    <View style={[styles.promptCard, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
      <View style={[styles.promptIconWrap, { borderColor: THEME.accent + '77', backgroundColor: THEME.pillBg }]}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth={1.6}>
          <Path d="M14 4l6 6-10 10H4v-6L14 4z" />
          <Path d="M13 5l6 6" />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.promptTitle, { color: THEME.ink }]}>What is God teaching you today?</Text>
        <Text style={[styles.promptBody, { color: THEME.muted }]}>
          Write a reflection — your journal builds here alongside your prayers.
        </Text>
      </View>
      <Pressable onPress={onNew} style={[styles.promptButton, {
        backgroundColor: THEME.accent,
        shadowColor: THEME.accent,
      }]}>
        <Text style={[styles.promptPlus, { color: THEME.cardDarkInk }]}>+</Text>
      </Pressable>
    </View>
  );
}

// ── Entry card (list) ─────────────────────────────────────────────────────────
function EntryCard({ entry, onOpen }: { entry: Entry; onOpen: (e: Entry) => void }) {
  const { theme: THEME } = useTheme();
  const entryTheme = ENTRY_THEMES.find(t => t.id === entry.theme);

  return (
    <Pressable onPress={() => onOpen(entry)}
      style={[styles.entryCard, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>

      <View style={styles.entryCardTop}>
        <Text style={[styles.entryCardDate, { color: THEME.muted }]}>{entry.dateLong}</Text>
        <View style={[styles.entryCardBadge, { borderColor: THEME.accent + '66' }]}>
          <ThemeDot themeId={entry.theme} size={6} />
          <Text style={[styles.entryCardBadgeText, { color: THEME.accent }]}>{entryTheme?.label}</Text>
        </View>
      </View>

      <Text style={[styles.entryCardTitle, { color: THEME.ink }]}>{entry.title}</Text>

      <Text style={[styles.entryCardBody, { color: THEME.inkSoft }]} numberOfLines={2}>
        {entry.body}
      </Text>

      <View style={styles.entryCardFooter}>
        <Text style={[styles.entryCardRef, { color: THEME.accent }]}>
          {entry.verse ? entry.verse.ref : 'Journal entry'}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Entry detail ──────────────────────────────────────────────────────────────
function EntryDetail({
  entry, onBack, visible, bibleVersion, onEdit, onDelete,
}: {
  entry: Entry | null; onBack: () => void; visible: boolean; bibleVersion: BibleVersion;
  onEdit: () => void; onDelete: () => void;
}) {
  const { theme: THEME } = useTheme();
  const anim = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const [fetchedVerseText, setFetchedVerseText] = useState<string | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);

  const detailAnimStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ translateY: interpolate(anim.value, [0, 1], [40, 0], Extrapolate.CLAMP) }],
  }));

  useEffect(() => {
    anim.value = withTiming(visible ? 1 : 0, { duration: 280 });
  }, [visible]);

  useEffect(() => {
    if (!entry?.verse?.ref || !visible) { setFetchedVerseText(null); return; }
    let cancelled = false;
    setVerseLoading(true);
    fetchVerseText(entry.verse.ref, bibleVersion).then(text => {
      if (!cancelled) { setFetchedVerseText(text); setVerseLoading(false); }
    });
    return () => { cancelled = true; };
  }, [entry?.verse?.ref, bibleVersion, visible]);

  if (!entry) return null;

  const entryTheme = ENTRY_THEMES.find(t => t.id === entry.theme);
  const displayVerseText = fetchedVerseText ?? entry.verse?.text ?? '';

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, {
      backgroundColor: THEME.bg,
      zIndex: 10,
    }, detailAnimStyle]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        <View style={styles.detailNav}>
          <Pressable onPress={onBack} style={[styles.detailNavBtn, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <Text style={[styles.detailNavBtnText, { color: THEME.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.detailNavDate, { color: THEME.muted }]}>{entry.date.toUpperCase()}</Text>
          <Pressable
            onPress={() => Alert.alert('', '', [
              { text: 'Edit entry', onPress: onEdit },
              { text: 'Delete entry', style: 'destructive', onPress: () =>
                Alert.alert('Delete this entry?', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: onDelete },
                ])
              },
              { text: 'Cancel', style: 'cancel' },
            ])}
            style={[styles.detailNavBtn, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <Text style={[styles.detailNavBtnText, { color: THEME.ink, fontSize: 18 }]}>⋯</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 26 }}>
          <View style={[styles.detailBadge, { borderColor: THEME.accent + '55' }]}>
            <ThemeDot themeId={entry.theme} size={7} />
            <Text style={[styles.detailBadgeText, { color: THEME.accent }]}>
              {entryTheme?.label.toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.detailTitle, { color: THEME.ink }]}>
            {entry.title}
            <Text style={[styles.detailTitleDot, { color: THEME.accent }]}>.</Text>
          </Text>

          <Text style={[styles.detailBody, { color: THEME.inkSoft }]}>{entry.body}</Text>

          {entry.verse && (
            <View style={[styles.detailVerseCard, {
              backgroundColor: THEME.surface, borderColor: THEME.line,
            }]}>
              <View style={[styles.detailVerseBar, { backgroundColor: THEME.accent }]} />
              <View style={styles.detailVerseLabelRow}>
                <Text style={[styles.detailVerseLabel, { color: THEME.accent }]}>SCRIPTURE</Text>
                <Text style={[styles.detailVersionBadge, { color: THEME.muted }]}>
                  {bibleVersion === 'KJV' ? 'King James' : 'Catholic Bible'}
                </Text>
              </View>
              {verseLoading ? (
                <ActivityIndicator size="small" color={THEME.accent} style={{ marginVertical: 10 }} />
              ) : (
                <Text style={[styles.detailVerseText, { color: THEME.ink }]}>"{displayVerseText}"</Text>
              )}
              <Text style={[styles.detailVerseRef, { color: THEME.muted }]}>— {entry.verse.ref}</Text>
            </View>
          )}

          <Text style={[styles.detailDivider, { color: THEME.muted }]}>✥ ✥ ✥</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// ── Verse scroll-wheel picker ─────────────────────────────────────────────────

const BIBLE_BOOKS_KJV = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles',
  'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs',
  'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah',
  'Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah',
  'Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans',
  '1 Corinthians','2 Corinthians','Galatians','Ephesians',
  'Philippians','Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon','Hebrews',
  'James','1 Peter','2 Peter','1 John','2 John','3 John',
  'Jude','Revelation',
];

// Catholic deuterocanonical books inserted at canonical positions
const BIBLE_BOOKS_CPVD = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles',
  'Ezra','Nehemiah',
  'Tobit','Judith',
  'Esther','1 Maccabees','2 Maccabees',
  'Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Wisdom','Sirach',
  'Isaiah','Jeremiah','Lamentations','Baruch',
  'Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah',
  'Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans',
  '1 Corinthians','2 Corinthians','Galatians','Ephesians',
  'Philippians','Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon','Hebrews',
  'James','1 Peter','2 Peter','1 John','2 John','3 John',
  'Jude','Revelation',
];

const WHEEL_ITEM_H = 46;
const WHEEL_VISIBLE = 5;
const WHEEL_H = WHEEL_ITEM_H * WHEEL_VISIBLE;

function WheelItem({ item, index, scrollY, onPress }: {
  item: string; index: number;
  scrollY: SharedValue<number>; onPress: () => void;
}) {
  const { theme: THEME } = useTheme();
  const center = index * WHEEL_ITEM_H;
  const band = WHEEL_ITEM_H;

  const animStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [center - band * 2, center - band, center, center + band, center + band * 2],
      [0.12, 0.4, 1, 0.4, 0.12],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [center - band * 2, center - band, center, center + band, center + band * 2],
      [0.8, 0.9, 1, 0.9, 0.8],
      Extrapolate.CLAMP,
    );
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Pressable
      onPress={onPress}
      style={{ height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
      <Animated.Text
        numberOfLines={1}
        style={[{ fontFamily: FONTS.bodyMed, fontSize: 14, color: THEME.ink, textAlign: 'center' }, animStyle]}>
        {item}
      </Animated.Text>
    </Pressable>
  );
}

function WheelColumn({ items, selectedIdx, onSelect, flex = 1 }: {
  items: string[]; selectedIdx: number;
  onSelect: (i: number) => void; flex?: number;
}) {
  const { theme: THEME } = useTheme();
  const scrollY = useSharedValue(selectedIdx * WHEEL_ITEM_H);
  const ref = useRef<any>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (!isScrolling.current) {
      ref.current?.scrollTo({ y: selectedIdx * WHEEL_ITEM_H, animated: false });
      scrollY.value = selectedIdx * WHEEL_ITEM_H;
    }
  }, [selectedIdx, items.length]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <View style={{ flex, height: WHEEL_H, overflow: 'hidden' }}>
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate={0.985}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
        onScrollBeginDrag={() => { isScrolling.current = true; }}
        onMomentumScrollEnd={e => {
          isScrolling.current = false;
          const idx = Math.max(0, Math.min(Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_H), items.length - 1));
          onSelect(idx);
        }}
        onScroll={scrollHandler}>
        {items.map((item, i) => (
          <WheelItem
            key={i}
            item={item}
            index={i}
            scrollY={scrollY}
            onPress={() => { onSelect(i); ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true }); }}
          />
        ))}
      </Animated.ScrollView>

      {/* Selection lines */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { justifyContent: 'center' }]}>
        <View style={{ height: WHEEL_ITEM_H, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: THEME.accent + '99' }} />
      </View>
      {/* Fade top */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: WHEEL_ITEM_H * 2, backgroundColor: THEME.bg, opacity: 0.82 }} />
      {/* Fade bottom */}
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: WHEEL_ITEM_H * 2, backgroundColor: THEME.bg, opacity: 0.82 }} />
    </View>
  );
}

function VersePicker({ version, onConfirm, onClose }: {
  version: BibleVersion;
  onConfirm: (ref: string, text: string) => void;
  onClose: () => void;
}) {
  const { theme: THEME } = useTheme();
  const insets = useSafeAreaInsets();
  const table = version === 'KJV' ? 'KJV' : 'CPVD';
  const BOOKS = version === 'KJV' ? BIBLE_BOOKS_KJV : BIBLE_BOOKS_CPVD;

  const [bookIdx, setBookIdx] = useState(0);
  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [verseNums, setVerseNums] = useState<string[]>([]);
  const [verseIdx, setVerseIdx] = useState(0);
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load chapters when book changes
  useEffect(() => {
    setChapters([]); setChapterIdx(0); setVerseNums([]); setVerseIdx(0); setPreviewText('');
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from(table).select('chapter')
        .eq('book', BOOKS[bookIdx]);
      if (cancelled || !data) return;
      const unique = [...new Set(data.map((r: any) => String(r.chapter)))];
      unique.sort((a, b) => parseInt(a) - parseInt(b));
      setChapters(unique);
    })();
    return () => { cancelled = true; };
  }, [bookIdx, table]);

  // Load verses when chapter changes
  useEffect(() => {
    setVerseNums([]); setVerseIdx(0); setPreviewText('');
    if (!chapters.length) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from(table).select('verse')
        .eq('book', BOOKS[bookIdx]).eq('chapter', chapters[chapterIdx]);
      if (cancelled || !data) return;
      const unique = [...new Set(data.map((r: any) => String(r.verse)))];
      unique.sort((a, b) => parseInt(a) - parseInt(b));
      setVerseNums(unique);
    })();
    return () => { cancelled = true; };
  }, [chapterIdx, chapters, bookIdx, table]);

  // Fetch preview text when verse changes
  useEffect(() => {
    if (!verseNums.length || !chapters.length) return;
    let cancelled = false;
    setPreviewText('');
    setPreviewLoading(true);
    (async () => {
      const { data } = await supabase.from(table).select('text')
        .eq('book', BOOKS[bookIdx])
        .eq('chapter', chapters[chapterIdx])
        .eq('verse', verseNums[verseIdx])
        .limit(1);
      if (cancelled) return;
      setPreviewText(data?.[0]?.text ?? '');
      setPreviewLoading(false);
    })();
    return () => { cancelled = true; };
  }, [verseIdx, verseNums, chapterIdx, chapters, bookIdx, table]);

  const verseRef = chapters.length && verseNums.length
    ? `${BOOKS[bookIdx]} ${chapters[chapterIdx]}:${verseNums[verseIdx]}`
    : '';

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: THEME.bg, zIndex: 30 }]}>
      {/* Header */}
      <View style={[styles.vpHeader, { paddingTop: insets.top + 14, borderBottomColor: THEME.line }]}>
        <Pressable onPress={onClose} style={{ padding: 6 }}>
          <Text style={[styles.vpCancel, { color: THEME.muted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.vpTitle, { color: THEME.accent }]}>✥ PICK A VERSE</Text>
        <Pressable
          onPress={() => verseRef && previewText && onConfirm(verseRef, previewText)}
          disabled={!verseRef || !previewText}
          style={{ padding: 6 }}>
          <Text style={[styles.vpDone, { color: verseRef && previewText ? THEME.accent : THEME.muted }]}>Done</Text>
        </Pressable>
      </View>

      {/* Three wheels */}
      <View style={[styles.vpWheels, { borderTopColor: THEME.line, borderBottomColor: THEME.line }]}>
        <WheelColumn flex={3} items={BOOKS} selectedIdx={bookIdx} onSelect={setBookIdx} />
        <View style={[styles.vpDivider, { backgroundColor: THEME.line }]} />
        <WheelColumn flex={2} items={chapters.length ? chapters : ['…']} selectedIdx={chapterIdx} onSelect={setChapterIdx} />
        <View style={[styles.vpDivider, { backgroundColor: THEME.line }]} />
        <WheelColumn flex={2} items={verseNums.length ? verseNums : ['…']} selectedIdx={verseIdx} onSelect={setVerseIdx} />
      </View>

      {/* Column labels */}
      <View style={styles.vpLabels}>
        <Text style={[styles.vpLabel, { color: THEME.muted, flex: 3 }]}>Book</Text>
        <View style={{ flex: 2 }}>
          <Text style={[styles.vpLabel, { color: THEME.muted }]}>Chapter</Text>
        </View>
        <View style={{ flex: 2 }}>
          <Text style={[styles.vpLabel, { color: THEME.muted }]}>Verse</Text>
        </View>
      </View>

      {/* Preview */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {verseRef ? (
          <Text style={[styles.vpRef, { color: THEME.accent }]}>{verseRef}</Text>
        ) : null}
        {previewLoading ? (
          <ActivityIndicator color={THEME.accent} style={{ marginTop: 16 }} />
        ) : previewText ? (
          <Text style={[styles.vpPreview, { color: THEME.ink }]}>"{previewText}"</Text>
        ) : (
          <Text style={[styles.vpPreview, { color: THEME.muted, fontStyle: 'italic' }]}>
            Scroll to a verse to preview it here.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ── New entry composer ────────────────────────────────────────────────────────
function NewEntryComposer({
  visible, onClose, onSave, bibleVersion, editEntry,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title: string; body: string; theme: string; verseRef: string }, editId?: string) => void;
  bibleVersion: BibleVersion;
  editEntry?: Entry | null;
}) {
  const { theme: THEME } = useTheme();
  const anim = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [theme, setTheme] = useState('gratitude');
  const [verseRef, setVerseRef] = useState('');
  const [versePreviewText, setVersePreviewText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const composerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(anim.value, [0, 1], [800, 0], Extrapolate.CLAMP) }],
  }));

  useEffect(() => {
    anim.value = withTiming(visible ? 1 : 0, { duration: 340 });
    if (!visible) {
      Keyboard.dismiss();
      setTitle(''); setBody(''); setTheme('gratitude'); setVerseRef(''); setVersePreviewText(''); setPickerOpen(false);
    } else if (editEntry) {
      setTitle(editEntry.title);
      setBody(editEntry.body);
      setTheme(editEntry.theme);
      setVerseRef(editEntry.verse?.ref ?? '');
      setVersePreviewText('');
    }
  }, [visible]);

  const isEdit = !!editEntry;
  const canSave = body.trim().length > 0;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, {
      backgroundColor: THEME.bg,
      zIndex: 20,
    }, composerAnimStyle]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.composerHeader, { paddingTop: insets.top + 16, borderBottomColor: THEME.line }]}>
          <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }}>
            <Text style={[styles.composerCancel, { color: THEME.muted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.composerTitle, { color: THEME.accent }]}>
            {isEdit ? '✥ EDIT ENTRY' : '✥ NEW JOURNAL ENTRY'}
          </Text>
          <Pressable
            onPress={() => { if (canSave) onSave({ title, body, theme, verseRef }, editEntry?.id); }}
            style={[styles.composerSaveBtn, { backgroundColor: canSave ? THEME.accent : THEME.surface }]}>
            <Text style={[styles.composerSaveText, { color: canSave ? THEME.cardDarkInk : THEME.muted }]}>
              {isEdit ? 'Update' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.composerBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Text style={[styles.composerLabel, { color: THEME.muted }]}>TITLE</Text>
          <TextInput
            value={title} onChangeText={setTitle}
            placeholder="A line for today's page"
            placeholderTextColor={THEME.muted}
            editable={visible}
            style={[styles.composerTitleInput, { color: THEME.ink, borderBottomColor: THEME.line }]}
          />

          <Text style={[styles.composerLabel, { color: THEME.muted }]}>CATEGORY</Text>
          <View style={styles.composerChips}>
            {ENTRY_THEMES.map(t => (
              <FilterChip key={t.id} active={theme === t.id} glyph={t.glyph}
                onPress={() => setTheme(t.id)}>{t.label}</FilterChip>
            ))}
          </View>

          <Text style={[styles.composerLabel, { color: THEME.muted }]}>WHAT HAPPENED WITH GOD TODAY?</Text>
          <TextInput
            value={body} onChangeText={setBody}
            placeholder="Write plainly. This is your journal — nobody sees it unless you choose to share."
            placeholderTextColor={THEME.muted}
            multiline
            editable={visible}
            style={[styles.composerBodyInput, {
              color: THEME.ink, backgroundColor: THEME.surface, borderColor: THEME.line,
            }]}
          />

          <Text style={[styles.composerLabel, { color: THEME.muted }]}>VERSE (OPTIONAL)</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.composerVersePick, {
              backgroundColor: THEME.surface,
              borderColor: verseRef ? THEME.accent + '77' : THEME.line,
            }]}>
            <Text style={{ color: THEME.accent, fontSize: 16 }}>✥</Text>
            {verseRef ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.composerVerseRef, { color: THEME.accent }]}>{verseRef}</Text>
                {versePreviewText ? (
                  <Text style={[styles.composerVersePreview, { color: THEME.inkSoft }]} numberOfLines={2}>
                    "{versePreviewText}"
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.composerVersePlaceholder, { color: THEME.muted }]}>
                Pick a verse from scripture
              </Text>
            )}
            {verseRef ? (
              <Pressable onPress={(e) => { e.stopPropagation(); setVerseRef(''); setVersePreviewText(''); }}
                hitSlop={10}>
                <Text style={{ color: THEME.muted, fontSize: 15, paddingLeft: 8 }}>✕</Text>
              </Pressable>
            ) : (
              <Text style={{ color: THEME.muted, fontSize: 18 }}>›</Text>
            )}
          </Pressable>

          <Text style={[styles.composerQuote, { color: THEME.muted }]}>
            "Write the vision; make it plain on tablets." — Habakkuk 2:2
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verse picker overlay */}
      {pickerOpen && (
        <VersePicker
          version={bibleVersion}
          onConfirm={(ref, text) => { setVerseRef(ref); setVersePreviewText(text); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Animated.View>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────
const CAL_MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const CAL_DAY_LABELS = ['S','M','T','W','T','F','S'];

function buildCalGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= total; d++) {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); grid.push(week); }
  return grid;
}

type DayInfo = { themes: string[]; dominant: string; color: string };

function CalendarView({
  entries,
  calMonth,
  setCalMonth,
  selectedDate,
  onDayPress,
}: {
  entries: Entry[];
  calMonth: { year: number; month: number };
  setCalMonth: (m: { year: number; month: number }) => void;
  selectedDate: string | null;
  onDayPress: (date: string | null) => void;
}) {
  const { theme: THEME } = useTheme();

  const dayMap = useMemo(() => {
    const map: Record<string, DayInfo> = {};
    entries.forEach(e => {
      const key = e.createdAt?.slice(0, 10);
      if (!key) return;
      if (!map[key]) map[key] = { themes: [], dominant: 'other', color: '#8a9a8a' };
      map[key].themes.push(e.theme);
    });
    Object.keys(map).forEach(key => {
      const counts: Record<string, number> = {};
      map[key].themes.forEach(t => { counts[t] = (counts[t] ?? 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';
      map[key].dominant = top;
      map[key].color = ENTRY_THEMES.find(t => t.id === top)?.color ?? '#8a9a8a';
    });
    return map;
  }, [entries]);

  const weeks = useMemo(() => buildCalGrid(calMonth.year, calMonth.month), [calMonth]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  const monthPrefix = `${calMonth.year}-${pad(calMonth.month + 1)}`;

  const prevMonth = () => {
    const d = new Date(calMonth.year, calMonth.month - 1, 1);
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
  };
  const nextMonth = () => {
    const d = new Date(calMonth.year, calMonth.month + 1, 1);
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  // Which themes appear this month (for legend)
  const monthThemes = useMemo(() => {
    const seen = new Set<string>();
    Object.keys(dayMap).filter(k => k.startsWith(monthPrefix))
      .forEach(k => dayMap[k].themes.forEach(t => seen.add(t)));
    return ENTRY_THEMES.filter(t => seen.has(t.id));
  }, [dayMap, monthPrefix]);

  return (
    <View style={[styles.calWrap, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
      {/* Month nav */}
      <View style={styles.calNavRow}>
        <Pressable onPress={prevMonth} style={[styles.calNavBtn, { backgroundColor: THEME.bg, borderColor: THEME.line }]}>
          <Text style={[styles.calNavArrow, { color: THEME.ink }]}>‹</Text>
        </Pressable>
        <Text style={[styles.calMonthLabel, { color: THEME.ink }]}>
          {CAL_MONTHS[calMonth.month]}{' '}
          <Text style={{ color: THEME.accent }}>{calMonth.year}</Text>
        </Text>
        <Pressable onPress={nextMonth} style={[styles.calNavBtn, { backgroundColor: THEME.bg, borderColor: THEME.line }]}>
          <Text style={[styles.calNavArrow, { color: THEME.ink }]}>›</Text>
        </Pressable>
      </View>

      {/* Day-of-week labels */}
      <View style={styles.calDayLabels}>
        {CAL_DAY_LABELS.map((l, i) => (
          <Text key={i} style={[styles.calDayLabel, { color: THEME.muted }]}>{l}</Text>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        // Week dominant color for the side bar
        const weekKeys = week
          .filter((d): d is number => d !== null)
          .map(d => `${monthPrefix}-${pad(d)}`);
        const weekThemes = weekKeys.flatMap(k => dayMap[k]?.themes ?? []);
        const wCounts: Record<string, number> = {};
        weekThemes.forEach(t => { wCounts[t] = (wCounts[t] ?? 0) + 1; });
        const wTopId = Object.entries(wCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const wColor = ENTRY_THEMES.find(t => t.id === wTopId)?.color;

        return (
          <View key={wi} style={styles.calWeekRow}>
            <View style={[styles.calWeekBar, { backgroundColor: wColor ? wColor + '66' : 'transparent' }]} />
            {week.map((day, di) => {
              if (day === null) return <View key={di} style={styles.calCell} />;
              const dateKey = `${monthPrefix}-${pad(day)}`;
              const info = dayMap[dateKey];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;

              return (
                <Pressable
                  key={di}
                  style={styles.calCell}
                  onPress={() => info ? onDayPress(isSelected ? null : dateKey) : null}
                  disabled={!info}>
                  <View style={[
                    styles.calDayCircle,
                    isSelected && { backgroundColor: THEME.accent },
                    !isSelected && info && { backgroundColor: info.color + '66' },
                    isToday && !isSelected && { borderWidth: 1.5, borderColor: THEME.accent },
                  ]}>
                    <Text style={[
                      styles.calDayNum,
                      { color: isSelected ? THEME.cardDarkInk : info ? THEME.ink : THEME.muted + '99' },
                      isToday && !isSelected && { color: THEME.accent, fontFamily: FONTS.bodySemi },
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {info && !isSelected && (
                    <View style={styles.calDots}>
                      {[...new Set(info.themes)].slice(0, 3).map((tid, i) => (
                        <View key={i} style={[styles.calDot, {
                          backgroundColor: ENTRY_THEMES.find(t => t.id === tid)?.color ?? THEME.accent,
                        }]} />
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        );
      })}

      {/* Legend — only shows categories present this month */}
      {monthThemes.length > 0 && (
        <View style={[styles.calLegend, { borderTopColor: THEME.line }]}>
          {monthThemes.map(t => (
            <View key={t.id} style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: t.color }]} />
              <Text style={[styles.calLegendText, { color: THEME.muted }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      )}
      {monthThemes.length === 0 && (
        <Text style={[styles.calEmptyMonth, { color: THEME.muted }]}>No entries this month</Text>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function BiographyScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const { session, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'list' | 'detail' | 'new' | 'edit'>('list');
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState('all');
  const [journalView, setJournalView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bibleVersion, setBibleVersion] = useState<BibleVersion>('KJV');

  useFocusEffect(useCallback(() => {
    if (!session || isGuest) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: bioData } = await supabase
        .from('biography_entries')
        .select('id, title, body, theme, verse_ref, shared, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (bioData) {
        setEntries(bioData.map((row: any) => ({
          id: `bio-${row.id}`,
          date: formatEntryDate(row.created_at),
          dateLong: formatEntryDateLong(row.created_at),
          theme: row.theme ?? 'other',
          title: row.title,
          body: row.body,
          verse: row.verse_ref ? { ref: row.verse_ref, text: '' } : null,
          shared: row.shared ?? false,
          createdAt: row.created_at,
        })));
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, isGuest]));

  const allEntries = entries;

  const filtered = useMemo(() => {
    if (selectedDate) return allEntries.filter(e => e.createdAt?.slice(0, 10) === selectedDate);
    if (activeTheme === 'all') return allEntries;
    return allEntries.filter(e => e.theme === activeTheme);
  }, [activeTheme, allEntries, selectedDate]);

  const handleSave = async (
    data: { title: string; body: string; theme: string; verseRef: string },
    editId?: string,
  ) => {
    if (editId) {
      // Update existing entry
      const numericId = editId.replace('bio-', '');
      const updated: Partial<Entry> = {
        theme: data.theme,
        title: data.title || 'Untitled entry',
        body: data.body,
        verse: data.verseRef ? { ref: data.verseRef, text: '' } : null,
      };
      setEntries(prev => prev.map(e => e.id === editId ? { ...e, ...updated } : e));
      setOpenEntry(prev => prev?.id === editId ? { ...prev, ...updated } as Entry : prev);
      setView('detail');
      if (session && !isGuest) {
        await supabase.from('biography_entries').update({
          title: data.title || 'Untitled entry',
          body: data.body,
          theme: data.theme,
          verse_ref: data.verseRef || null,
        }).eq('id', numericId);
      }
      return;
    }

    // Create new entry
    const now = new Date().toISOString();
    const optimistic: Entry = {
      id: 'pending-' + Math.random().toString(36).slice(2),
      date: 'Today',
      dateLong: formatEntryDateLong(now),
      theme: data.theme,
      title: data.title || 'Untitled entry',
      body: data.body,
      verse: data.verseRef ? { ref: data.verseRef, text: '' } : null,
      shared: false,
      createdAt: now,
    };
    setEntries(prev => [optimistic, ...prev]);
    setView('list');

    if (session && !isGuest) {
      const { data: row } = await supabase.from('biography_entries').insert({
        user_id: session.user.id,
        title: data.title || 'Untitled entry',
        body: data.body,
        theme: data.theme,
        verse_ref: data.verseRef || null,
        shared: false,
      }).select('id, created_at').single();

      if (row) {
        setEntries(prev => prev.map(e =>
          e.id === optimistic.id
            ? { ...e, id: `bio-${row.id}`, date: formatEntryDate(row.created_at), dateLong: formatEntryDateLong(row.created_at), createdAt: row.created_at }
            : e
        ));
      }
    }
  };

  const handleDelete = async (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    setView('list');
    if (session && !isGuest) {
      const numericId = entryId.replace('bio-', '');
      await supabase.from('biography_entries').delete().eq('id', numericId);
    }
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}>

        {/* Brand / nav row */}
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, {
            backgroundColor: THEME.surface,
            borderColor: THEME.line,
          }]}>
            <Text style={[styles.backBtnText, { color: THEME.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.brandText, { color: THEME.ink }]}>
            Saint <Text style={{ fontFamily: FONTS.body }}>Central</Text>
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Header with book icon */}
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: THEME.ink }]}>My</Text>
            <Text style={[styles.heroTitleItalic, { color: THEME.accent }]}>Biography</Text>
            <Text style={[styles.heroSubtitle, { color: THEME.muted }]}>
              A journal of your walk with God — prayers, reflections, answered moments.
            </Text>
            <BibleVersionPicker version={bibleVersion} onSelect={setBibleVersion} />
          </View>
          <View style={styles.bookIconWrap}>
            <BookIcon accent={THEME.accent} bg={THEME.bg} />
          </View>
        </View>

        {/* Write new entry prompt */}
        <View style={{ paddingHorizontal: 22, marginTop: 10 }}>
          <PromptCard onNew={() => setView('new')} />
        </View>

        {/* Journal section header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: THEME.ink }]}>Your journal</Text>
            <Text style={[styles.sectionSubtitle, { color: THEME.muted }]}>
              {selectedDate
                ? (() => { const d = new Date(selectedDate + 'T12:00:00'); return `${CAL_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; })()
                : 'Prayer reflections + your own entries'}
            </Text>
          </View>
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => { setJournalView('list'); setSelectedDate(null); }}
              style={[styles.viewToggleBtn, {
                backgroundColor: journalView === 'list' ? THEME.accent : 'transparent',
                borderColor: journalView === 'list' ? THEME.accent : THEME.line,
              }]}>
              <Text style={[styles.viewToggleText, {
                color: journalView === 'list' ? THEME.cardDarkInk : THEME.muted,
              }]}>List</Text>
            </Pressable>
            <Pressable
              onPress={() => setJournalView('calendar')}
              style={[styles.viewToggleBtn, {
                backgroundColor: journalView === 'calendar' ? THEME.accent : 'transparent',
                borderColor: journalView === 'calendar' ? THEME.accent : THEME.line,
              }]}>
              <Text style={[styles.viewToggleText, {
                color: journalView === 'calendar' ? THEME.cardDarkInk : THEME.muted,
              }]}>Calendar</Text>
            </Pressable>
          </View>
        </View>

        {/* Calendar */}
        {journalView === 'calendar' && (
          <CalendarView
            entries={allEntries}
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            selectedDate={selectedDate}
            onDayPress={setSelectedDate}
          />
        )}

        {/* Filter chips — only in list mode */}
        {journalView === 'list' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            <FilterChip active={activeTheme === 'all'} onPress={() => setActiveTheme('all')}>All</FilterChip>
            {ENTRY_THEMES.map(t => (
              <FilterChip key={t.id} active={activeTheme === t.id} glyph={t.glyph}
                onPress={() => setActiveTheme(t.id)}>{t.label}</FilterChip>
            ))}
          </ScrollView>
        )}

        {/* Entry list */}
        <View style={{ paddingHorizontal: 22, marginTop: journalView === 'calendar' ? 14 : 0 }}>
          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={THEME.accent} />
            </View>
          ) : (
            <>
              {filtered.map(e => (
                <EntryCard key={e.id} entry={e}
                  onOpen={entry => { setOpenEntry(entry); setView('detail'); }} />
              ))}
              {filtered.length === 0 && !loading && (
                <Text style={[styles.emptyState, { color: THEME.muted }]}>
                  {allEntries.length === 0
                    ? 'Your journal is empty.\nShare a prayer or write your first entry.'
                    : selectedDate
                    ? 'No entries on this day.'
                    : 'No entries in this category yet.'}
                </Text>
              )}
            </>
          )}

          <Text style={[styles.footer, { color: THEME.muted }]}>
            ✥{'\n'}The beginning is in here somewhere.
          </Text>
        </View>
      </ScrollView>

      <EntryDetail
        entry={openEntry}
        visible={view === 'detail'}
        onBack={() => setView('list')}
        bibleVersion={bibleVersion}
        onEdit={() => setView('edit')}
        onDelete={() => openEntry && handleDelete(openEntry.id)}
      />
      <NewEntryComposer
        visible={view === 'new' || view === 'edit'}
        onClose={() => setView(view === 'edit' ? 'detail' : 'list')}
        onSave={handleSave}
        bibleVersion={bibleVersion}
        editEntry={view === 'edit' ? openEntry : null}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 6,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: FONTS.body,
    marginTop: -2,
  },
  brandText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 16,
  },
  heroTitle: {
    fontFamily: FONTS.display,
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  heroTitleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 2,
  },
  bookIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },

  // Bible version picker
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  versionChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  versionChipText: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 0.6 },
  versionNote: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontStyle: 'italic',
  },

  // Prompt card
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  promptIconWrap: {
    width: 42, height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  promptTitle: {
    fontFamily: FONTS.display,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  promptBody: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, marginTop: 3 },
  promptButton: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  promptPlus: { fontSize: 24, lineHeight: 28, fontFamily: FONTS.body, marginTop: -2 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 26, letterSpacing: -0.3 },
  sectionSubtitle: { fontFamily: FONTS.body, fontSize: 11.5, marginTop: 2 },
  sectionCount: { fontFamily: FONTS.body, fontSize: 12 },

  // View toggle
  viewToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  viewToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 99,
    borderWidth: 1,
  },
  viewToggleText: { fontFamily: FONTS.bodySemi, fontSize: 12 },

  // Calendar
  calWrap: {
    marginHorizontal: 22,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 10,
  },
  calNavBtn: {
    width: 34, height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavArrow: { fontSize: 20, lineHeight: 24, fontFamily: FONTS.body },
  calMonthLabel: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: -0.4 },
  calDayLabels: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bodySemi,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  calWeekRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  calWeekBar: {
    position: 'absolute',
    left: 4,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
  },
  calCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
    gap: 3,
  },
  calDayCircle: {
    width: 34, height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayNum: { fontFamily: FONTS.bodyMed, fontSize: 13.5 },
  calDots: {
    flexDirection: 'row',
    gap: 2,
  },
  calDot: {
    width: 4, height: 4,
    borderRadius: 2,
  },
  calLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  calLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  calLegendText: { fontFamily: FONTS.body, fontSize: 10.5 },
  calEmptyMonth: {
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
  },


  // Filter chips
  chipsRow: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    gap: 7,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipGlyph: { fontSize: 10, opacity: 0.85 },
  chipLabel: { fontFamily: FONTS.bodyMed, fontSize: 12.5, letterSpacing: 0.2 },

  // Entry card
  entryCard: {
    padding: 18,
    marginBottom: 12,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  entryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryCardDate: { fontFamily: FONTS.body, fontSize: 12.5 },
  entryCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    borderWidth: 1,
  },
  entryCardBadgeText: { fontFamily: FONTS.bodyMed, fontSize: 11, letterSpacing: 0.2 },
  entryCardTitle: {
    fontFamily: FONTS.display,
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  entryCardBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  entryCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryCardRef: { fontFamily: FONTS.bodyMed, fontSize: 12.5 },

  // Detail
  detailNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 8,
  },
  detailNavBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailNavBtnText: { fontSize: 22, lineHeight: 24, fontFamily: FONTS.body },
  detailNavDate: { fontFamily: FONTS.bodySemi, fontSize: 10.5, letterSpacing: 2 },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: 20,
  },
  detailBadgeText: { fontFamily: FONTS.bodySemi, fontSize: 10.5, letterSpacing: 1.6 },
  detailTitle: {
    fontFamily: FONTS.display,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  detailTitleDot: { fontFamily: FONTS.displayItalic, fontStyle: 'italic' },
  detailBody: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 27,
    letterSpacing: 0.1,
    marginBottom: 22,
  },
  detailVerseCard: {
    marginVertical: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    overflow: 'hidden',
  },
  detailVerseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailVerseBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  detailVerseLabel: { fontFamily: FONTS.bodySemi, fontSize: 10.5, letterSpacing: 1.8 },
  detailVersionBadge: { fontFamily: FONTS.body, fontSize: 10.5, fontStyle: 'italic' },
  detailVerseText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 29,
  },
  detailVerseRef: { fontFamily: FONTS.body, fontSize: 13, marginTop: 10 },
  detailCandleCard: {
    padding: 16, borderRadius: 22, borderWidth: 1, marginTop: 6,
  },
  detailCandleCount: { fontFamily: FONTS.display, fontSize: 19, lineHeight: 23 },
  detailCandleSub: { fontFamily: FONTS.body, fontSize: 12, marginTop: 4 },
  detailDivider: {
    textAlign: 'center',
    marginTop: 28,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
  },

  // Composer
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composerCancel: { fontFamily: FONTS.body, fontSize: 14, padding: 6 },
  composerTitle: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 1.8 },
  composerSaveBtn: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 99 },
  composerSaveText: { fontFamily: FONTS.bodySemi, fontSize: 13 },
  composerBody: { padding: 22, paddingBottom: 100 },
  composerLabel: { fontFamily: FONTS.bodySemi, fontSize: 10.5, letterSpacing: 2, marginBottom: 10 },
  composerTitleInput: {
    fontFamily: FONTS.display,
    fontSize: 26,
    borderBottomWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginBottom: 22,
    letterSpacing: -0.3,
  },
  composerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  composerBodyInput: {
    fontFamily: FONTS.display,
    fontSize: 16,
    lineHeight: 25,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    minHeight: 160,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  composerVersePick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderRadius: 16,
  },
  composerVerseRef: { fontFamily: FONTS.bodySemi, fontSize: 13, marginBottom: 4 },
  composerVersePreview: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 13, lineHeight: 18 },
  composerVersePlaceholder: { flex: 1, fontFamily: FONTS.body, fontSize: 14 },

  // Verse picker
  vpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  vpCancel: { fontFamily: FONTS.body, fontSize: 14 },
  vpTitle: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 1.8 },
  vpDone: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  vpWheels: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  vpDivider: { width: StyleSheet.hairlineWidth, marginVertical: 8 },
  vpLabels: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  vpLabel: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  vpRef: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: -0.3, marginBottom: 14 },
  vpPreview: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 18, lineHeight: 28 },
  composerQuote: {
    textAlign: 'center',
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
  },

  // Footer
  emptyState: {
    paddingVertical: 36,
    textAlign: 'center',
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 22,
  },
});
