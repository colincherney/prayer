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
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { JournalDesk, JournalEmptyArt, JournalFlourish } from '@/components/pets/JournalArt';
import { useAppDisplay } from '@/components/saint/appDisplay';
import { authHaptic } from '@/components/saint/authHaptics';
import { PrimaryButton } from '@/components/saint/Common';
import { PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import { DURATION, EASE_DRAWER, EASE_OUT, enterFade, enterUp } from '@/components/saint/motion';
import { ArrowIcon, BackIcon, CloseIcon, PenIcon } from '@/components/saint/Icons';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useTheme, FONTS } from '@/components/saint/theme';
import { supabase } from '@/lib/supabase';
import { refreshAllEvents } from '@/lib/winterEvent';
import { useAuth } from '@/lib/auth';
import { type BibleVersion, useBibleVersion } from '@/lib/bibleVersion';



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

/** The local calendar day ('YYYY-MM-DD') a timestamp falls on, so an evening entry isn't filed under tomorrow (UTC). */
function localDayKey(iso: string | Date): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// ── Small components ──────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Text and icons placed on the accent: the dark themes' accent is a light tan, so they take the dark ground. */
function useOnAccent() {
  const { theme: THEME } = useTheme();
  return THEME.isDark ? THEME.bg : THEME.accentInk;
}

function themeOf(id: string) {
  return ENTRY_THEMES.find(t => t.id === id) ?? ENTRY_THEMES[ENTRY_THEMES.length - 1];
}

function ThemeDot({ themeId, size = 8 }: { themeId: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: themeOf(themeId).color }} />;
}

function DotsIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx={4} cy={9} r={1.5} fill={color} />
      <Circle cx={9} cy={9} r={1.5} fill={color} />
      <Circle cx={14} cy={9} r={1.5} fill={color} />
    </Svg>
  );
}

/** An open book, for scripture. */
function BookIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 6.5 C10.2 5.2 7.4 4.8 4 5.2 V18.4 C7.4 18 10.2 18.4 12 19.7 C13.8 18.4 16.6 18 20 18.4 V5.2 C16.6 4.8 13.8 5.2 12 6.5 Z" />
      <Path d="M12 6.5 V19.6" />
    </Svg>
  );
}

function FilterChip({ active, onPress, color, children }: {
  active: boolean; onPress: () => void; color?: string; children: string;
}) {
  const { theme: THEME } = useTheme();
  return (
    <Pressable
      onPress={() => { if (!active) authHaptic('select'); onPress(); }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, {
        backgroundColor: active ? THEME.ink : THEME.surface,
        borderColor: active ? THEME.ink : THEME.line,
      }]}>
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipLabel, { color: active ? THEME.bg : THEME.inkSoft }]}>{children}</Text>
    </Pressable>
  );
}

// ── Bible version picker ──────────────────────────────────────────────────────
function BibleVersionPicker({ version, onSelect }: { version: BibleVersion; onSelect: (v: BibleVersion) => void }) {
  const { theme: THEME } = useTheme();
  return (
    <View style={styles.versionBlock}>
      <Text style={[styles.versionLabel, { color: THEME.ink }]}>Bible for verses</Text>
      <SlidingSegments
        theme={THEME}
        value={version}
        onChange={onSelect}
        segments={[
          { key: 'KJV', label: 'King James' },
          { key: 'CPVD', label: 'Catholic' },
        ]}
      />
    </View>
  );
}

// ── Compose card: the way in to a new entry ───────────────────────────────────
function ComposeCard({ onNew }: { onNew: () => void }) {
  const { theme: THEME } = useTheme();
  const onAccent = useOnAccent();
  return (
    <PressScale
      onPress={onNew}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel="Write a new journal entry"
      style={[styles.composeCard, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.composePrompt, { color: THEME.ink }]}>What is God teaching you today?</Text>
        <Text style={[styles.composeHint, { color: THEME.inkSoft }]}>Tap to write. Private to you.</Text>
      </View>
      <View style={[styles.composeBtn, { backgroundColor: THEME.accent, shadowColor: THEME.accent }]}>
        <PenIcon size={19} color={onAccent} />
      </View>
    </PressScale>
  );
}

// ── Entry card (list) ─────────────────────────────────────────────────────────
function EntryCard({ entry, onOpen, index }: { entry: Entry; onOpen: (e: Entry) => void; index: number }) {
  const { theme: THEME } = useTheme();
  const t = themeOf(entry.theme);
  const d = entry.createdAt ? new Date(entry.createdAt) : null;

  return (
    <Animated.View entering={enterUp(index)}>
      <PressScale
        onPress={() => onOpen(entry)}
        haptic={null}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${entry.title}, ${entry.dateLong}`}
        style={[styles.entryCard, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
        <View style={styles.entryDate}>
          <Text style={[styles.entryDay, { color: THEME.ink }]}>{d ? d.getDate() : ''}</Text>
          <Text style={[styles.entryMonth, { color: THEME.inkSoft }]}>{d ? MONTHS_SHORT[d.getMonth()] : ''}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.entryCardTitle, { color: THEME.ink }]} numberOfLines={2}>{entry.title}</Text>
          <Text style={[styles.entryCardBody, { color: THEME.inkSoft }]} numberOfLines={2}>{entry.body}</Text>
          <View style={styles.entryMeta}>
            <ThemeDot themeId={entry.theme} size={7} />
            <Text style={[styles.entryMetaText, { color: THEME.inkSoft }]}>{t.label}</Text>
            {entry.verse ? (
              <>
                <View style={[styles.entryMetaSep, { backgroundColor: THEME.line }]} />
                <BookIcon size={13} color={THEME.inkSoft} />
                <Text style={[styles.entryMetaText, { color: THEME.inkSoft, flexShrink: 1 }]} numberOfLines={1}>
                  {entry.verse.ref}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </PressScale>
    </Animated.View>
  );
}

// ── Entry detail ──────────────────────────────────────────────────────────────
function EntryDetail({
  entry, onBack, visible, bibleVersion, onEdit, onDelete,
}: {
  entry: Entry | null; onBack: () => void; visible: boolean; bibleVersion: BibleVersion;
  onEdit: () => void; onDelete: () => void;
}) {
  const { simple } = useAppDisplay();
  const { theme: THEME } = useTheme();
  const anim = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const [fetchedVerseText, setFetchedVerseText] = useState<string | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);

  const detailAnimStyle = useAnimatedStyle(() => ({
    opacity: anim.get(),
    transform: [{ translateY: interpolate(anim.get(), [0, 1], [40, 0], Extrapolation.CLAMP) }],
  }));

  useEffect(() => {
    // Opens with a soft settle; closes a little quicker, so going back never drags.
    anim.set(withTiming(visible ? 1 : 0, { duration: visible ? DURATION.enter : 220, easing: EASE_OUT }));
  }, [visible]);

  useEffect(() => {
    if (!entry?.verse?.ref || !visible) { setFetchedVerseText(null); return; }
    let cancelled = false;
    // Clear the last entry's text first, so it never shows under this entry's reference while loading.
    setFetchedVerseText(null);
    setVerseLoading(true);
    fetchVerseText(entry.verse.ref, bibleVersion)
      .then(text => {
        if (!cancelled) setFetchedVerseText(text);
      })
      // Offline or a failed lookup: fall back to the text saved with the entry, never a spinner that never stops.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setVerseLoading(false);
      });
    return () => { cancelled = true; };
  }, [entry?.verse?.ref, bibleVersion, visible]);

  if (!entry || (simple && !visible)) return null;

  const entryTheme = themeOf(entry.theme);
  const displayVerseText = fetchedVerseText ?? entry.verse?.text ?? '';

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, {
      backgroundColor: THEME.bg,
      zIndex: 10,
    }, detailAnimStyle]}>
      <ScrollView
        contentContainerStyle={[{ paddingTop: insets.top + 8, paddingBottom: 48 }, simple && styles.simpleColumn]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.detailNav}>
          <PressScale onPress={onBack} haptic={null} accessibilityRole="button" accessibilityLabel="Back"
            style={[styles.roundBtn, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <BackIcon size={16} color={THEME.ink} />
          </PressScale>
          <Text style={[styles.detailNavDate, { color: THEME.inkSoft }]}>{entry.dateLong}</Text>
          <PressScale
            haptic={null}
            accessibilityRole="button"
            accessibilityLabel="Entry options"
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
            style={[styles.roundBtn, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <DotsIcon color={THEME.ink} />
          </PressScale>
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 12 }}>
          <View style={[styles.detailBadge, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <ThemeDot themeId={entry.theme} size={8} />
            <Text style={[styles.detailBadgeText, { color: THEME.ink }]}>{entryTheme.label}</Text>
          </View>

          <Text style={[styles.detailTitle, { color: THEME.ink }]}>
            {entry.title}
            {!simple && <Text style={{ color: THEME.accent }}>.</Text>}
          </Text>

          <Text style={[styles.detailBody, { color: THEME.inkSoft }]}>{entry.body}</Text>

          {entry.verse && (
            <View style={[styles.detailVerseCard, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
              <BookIcon size={20} color={THEME.accent} />
              {verseLoading ? (
                <ActivityIndicator size="small" color={THEME.accent} style={{ marginVertical: 14, alignSelf: 'flex-start' }} />
              ) : (
                <Text style={[styles.detailVerseText, { color: THEME.ink }]}>{displayVerseText}</Text>
              )}
              <Text style={[styles.detailVerseRef, { color: THEME.inkSoft }]}>
                {entry.verse.ref}
                {' · '}
                {bibleVersion === 'KJV' ? 'King James' : 'Catholic Bible'}
              </Text>
            </View>
          )}

          {!simple && (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <JournalFlourish color={THEME.accent} />
            </View>
          )}
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
      scrollY.get(),
      [center - band * 2, center - band, center, center + band, center + band * 2],
      [0.12, 0.4, 1, 0.4, 0.12],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.get(),
      [center - band * 2, center - band, center, center + band, center + band * 2],
      [0.8, 0.9, 1, 0.9, 0.8],
      Extrapolation.CLAMP,
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
      scrollY.set(selectedIdx * WHEEL_ITEM_H);
    }
  }, [selectedIdx, items.length]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
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
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
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
    <View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.bg, zIndex: 30 }]}>
      {/* Header */}
      <View style={[styles.vpHeader, { paddingTop: insets.top + 8, borderBottomColor: THEME.line }]}>
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.textBtn}>
          <Text style={[styles.vpCancel, { color: THEME.inkSoft }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.vpTitle, { color: THEME.ink }]}>Pick a verse</Text>
        <Pressable
          onPress={() => verseRef && previewText && onConfirm(verseRef, previewText)}
          disabled={!verseRef || !previewText}
          accessibilityRole="button"
          style={styles.textBtn}>
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
          <Text style={[styles.vpPreview, { color: THEME.muted }]}>
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
  const { simple } = useAppDisplay();
  const { theme: THEME } = useTheme();
  const anim = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [theme, setTheme] = useState('gratitude');
  const [verseRef, setVerseRef] = useState('');
  const [versePreviewText, setVersePreviewText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const onAccent = useOnAccent();

  const composerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(anim.get(), [0, 1], [800, 0], Extrapolation.CLAMP) }],
  }));

  useEffect(() => {
    // A sheet rising over the journal.
    anim.set(withTiming(visible ? 1 : 0, { duration: visible ? DURATION.sheet : 280, easing: EASE_DRAWER }));
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
  if (simple && !visible) return null;

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, {
      backgroundColor: THEME.bg,
      zIndex: 20,
    }, composerAnimStyle]}>
      <KeyboardAvoidingView style={[{ flex: 1 }, simple && styles.simpleColumn]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.composerHeader, { paddingTop: insets.top + 8, borderBottomColor: THEME.line }]}>
          <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }} accessibilityRole="button" style={styles.textBtn}>
            <Text style={[styles.composerCancel, { color: THEME.inkSoft }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.composerTitle, { color: THEME.ink }]}>{isEdit ? 'Edit entry' : 'New entry'}</Text>
          <PressScale
            onPress={() => { if (canSave) onSave({ title, body, theme, verseRef }, editEntry?.id); }}
            disabled={!canSave}
            haptic={canSave ? 'success' : null}
            accessibilityRole="button"
            style={[styles.composerSaveBtn, { backgroundColor: canSave ? THEME.accent : THEME.line }]}>
            <Text style={[styles.composerSaveText, { color: canSave ? onAccent : THEME.inkSoft }]}>
              {isEdit ? 'Update' : 'Save'}
            </Text>
          </PressScale>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.composerBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <TextInput
            value={title} onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={THEME.muted}
            selectionColor={THEME.accent}
            accessibilityLabel="Title"
            keyboardAppearance={simple && THEME.isDark ? 'dark' : 'default'}
            editable={visible}
            style={[styles.composerTitleInput, { color: THEME.ink }]}
          />

          <TextInput
            value={body} onChangeText={setBody}
            placeholder={simple ? 'Write a private reflection…' : 'What happened with God today? Write plainly. Nobody sees it unless you choose to share.'}
            placeholderTextColor={THEME.muted}
            selectionColor={THEME.accent}
            accessibilityLabel="Journal entry"
            keyboardAppearance={simple && THEME.isDark ? 'dark' : 'default'}
            multiline
            editable={visible}
            style={[styles.composerBodyInput, { color: THEME.ink }]}
          />

          {!simple && <>
          <Text style={[styles.composerLabel, { color: THEME.ink }]}>Category</Text>
          <View style={styles.composerChips}>
            {ENTRY_THEMES.map(t => (
              <FilterChip key={t.id} active={theme === t.id} color={t.color}
                onPress={() => setTheme(t.id)}>{t.label}</FilterChip>
            ))}
          </View>

          <Text style={[styles.composerLabel, { color: THEME.ink }]}>Verse</Text>
          <PressScale
            onPress={() => setPickerOpen(true)}
            haptic={null}
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={verseRef ? `Verse ${verseRef}. Change` : 'Pick a verse from scripture'}
            style={[styles.composerVersePick, {
              backgroundColor: THEME.surface,
              borderColor: verseRef ? THEME.accent : THEME.line,
            }]}>
            <BookIcon size={20} color={verseRef ? THEME.accent : THEME.inkSoft} />
            {verseRef ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.composerVerseRef, { color: THEME.ink }]}>{verseRef}</Text>
                {versePreviewText ? (
                  <Text style={[styles.composerVersePreview, { color: THEME.inkSoft }]} numberOfLines={2}>
                    {versePreviewText}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.composerVersePlaceholder, { color: THEME.inkSoft }]}>
                Add a verse (optional)
              </Text>
            )}
            {verseRef ? (
              <Pressable
                onPress={(e) => { e.stopPropagation(); setVerseRef(''); setVersePreviewText(''); }}
                accessibilityRole="button"
                accessibilityLabel="Remove verse"
                style={styles.verseClear}>
                <CloseIcon size={16} color={THEME.inkSoft} />
              </Pressable>
            ) : (
              <ArrowIcon size={16} color={THEME.inkSoft} />
            )}
          </PressScale>

          <Text style={[styles.composerQuote, { color: THEME.inkSoft }]}>
            &ldquo;Write the vision; make it plain on tablets.&rdquo; Habakkuk 2:2
          </Text>
          </>}
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
      const key = e.createdAt ? localDayKey(e.createdAt) : null;
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

  const todayKey = localDayKey(new Date());
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
        <Pressable onPress={prevMonth} accessibilityRole="button" accessibilityLabel="Previous month"
          style={[styles.calNavBtn, { backgroundColor: THEME.bg, borderColor: THEME.line }]}>
          <BackIcon size={14} color={THEME.ink} />
        </Pressable>
        <Text style={[styles.calMonthLabel, { color: THEME.ink }]}>
          {CAL_MONTHS[calMonth.month]}{' '}
          <Text style={{ color: THEME.accent }}>{calMonth.year}</Text>
        </Text>
        <Pressable onPress={nextMonth} accessibilityRole="button" accessibilityLabel="Next month"
          style={[styles.calNavBtn, { backgroundColor: THEME.bg, borderColor: THEME.line }]}>
          <ArrowIcon size={14} color={THEME.ink} />
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

        return (
          <View key={wi} style={styles.calWeekRow}>
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
                      { color: isSelected ? (THEME.isDark ? THEME.bg : THEME.accentInk) : info ? THEME.ink : THEME.muted },
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
  const { simple } = useAppDisplay();
  const { theme: THEME } = useTheme();
  // Guests have a real (anonymous) account too, so their journal is saved like anyone's, and comes with them if they
  // create an account later.
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
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
  // Shared with the Quests reader: pick a version in either place and both remember it.
  const [bibleVersion, setBibleVersion] = useBibleVersion();

  useFocusEffect(useCallback(() => {
    if (!session) return;
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
  }, [session]));

  const allEntries = entries;

  const filtered = useMemo(() => {
    if (selectedDate) return allEntries.filter(e => !!e.createdAt && localDayKey(e.createdAt) === selectedDate);
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
      if (session) {
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

    if (session) {
      const { data: row, error } = await supabase.from('biography_entries').insert({
        user_id: session.user.id,
        title: data.title || 'Untitled entry',
        body: data.body,
        theme: data.theme,
        verse_ref: data.verseRef || null,
        shared: false,
      }).select('id, created_at').single();

      if (error || !row) {
        // Don't let it look saved and then vanish: take it back off the list and say so.
        setEntries(prev => prev.filter(e => e.id !== optimistic.id));
        Alert.alert('Couldn’t save your entry', 'Check your connection and try again.');
        return;
      }
      // Journal entries count toward event challenges: show it on the event straight away.
      refreshAllEvents(true).catch(() => {});
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
    if (session) {
      const numericId = entryId.replace('bio-', '');
      await supabase.from('biography_entries').delete().eq('id', numericId);
    }
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const selectedLabel = selectedDate
    ? (() => { const d = new Date(selectedDate + 'T12:00:00'); return `${CAL_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; })()
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar barStyle={THEME.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingTop: insets.top + 8, paddingBottom: simple ? insets.bottom + 28 : 110 }, simple && styles.simpleColumn]}
        showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <PressScale onPress={() => router.back()} haptic={null} accessibilityRole="button" accessibilityLabel="Back"
            style={[styles.roundBtn, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <BackIcon size={16} color={THEME.ink} />
          </PressScale>
        </View>

        {simple ? (
          <View style={styles.simpleHeading}>
            <Text accessibilityRole="header" style={[styles.simpleTitle, { color: THEME.ink }]}>Journal</Text>
            <PrimaryButton label="New entry" onPress={() => setView('new')} />
          </View>
        ) : <>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={[styles.heroTitle, { color: THEME.ink }]}>
            My <Text style={{ color: THEME.accent }}>Biography</Text>
          </Text>
          <Text style={[styles.heroSubtitle, { color: THEME.inkSoft }]}>
            A journal of your walk with God: prayers, reflections, answered moments.
          </Text>
        </View>

        {/* The study: your companion keeps you company at the desk while you write. */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.deskShadow}>
            <JournalDesk width={screenW - 32} accent={THEME.accent} entryCount={allEntries.length} />
          </View>
        </View>

        {/* Write a new entry */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <ComposeCard onNew={() => setView('new')} />
        </View>

        {/* Journal section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: THEME.ink }]}>Your journal</Text>
          <Text style={[styles.sectionCount, { color: THEME.inkSoft }]}>
            {allEntries.length} {allEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <SlidingSegments
            theme={THEME}
            value={journalView}
            onChange={v => { setJournalView(v); if (v === 'list') setSelectedDate(null); }}
            segments={[
              { key: 'list', label: 'List' },
              { key: 'calendar', label: 'Calendar' },
            ]}
          />
        </View>

        {/* Calendar */}
        {journalView === 'calendar' && (
          <Animated.View entering={enterFade(220)} style={{ marginTop: 14 }}>
            <CalendarView
              entries={allEntries}
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              selectedDate={selectedDate}
              onDayPress={setSelectedDate}
            />
            {selectedLabel ? (
              <Text style={[styles.selectedDay, { color: THEME.inkSoft }]}>{selectedLabel}</Text>
            ) : null}
          </Animated.View>
        )}

        {/* Filter chips — only in list mode */}
        {journalView === 'list' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            <FilterChip active={activeTheme === 'all'} onPress={() => setActiveTheme('all')}>All</FilterChip>
            {ENTRY_THEMES.map(t => (
              <FilterChip key={t.id} active={activeTheme === t.id} color={t.color}
                onPress={() => setActiveTheme(t.id)}>{t.label}</FilterChip>
            ))}
          </ScrollView>
        )}
        </>}

        {/* Entry list */}
        <View key={`${journalView}-${activeTheme}-${selectedDate ?? ''}`} style={{ paddingHorizontal: 16, marginTop: journalView === 'calendar' ? 14 : 0, gap: 10 }}>
          {loading && allEntries.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={THEME.accent} />
            </View>
          ) : (
            <>
              {filtered.map((e, i) => (
                <EntryCard key={e.id} entry={e} index={i}
                  onOpen={entry => { setOpenEntry(entry); setView('detail'); }} />
              ))}
              {!simple && filtered.length === 0 && allEntries.length === 0 && (
                <View style={{ alignItems: 'center', marginTop: 18 }}>
                  <JournalEmptyArt accent={THEME.accent} />
                </View>
              )}
              {filtered.length === 0 && (
                <Text style={[styles.emptyState, { color: THEME.inkSoft }]}>
                  {allEntries.length === 0
                    ? (simple ? 'Your journal is empty.' : 'Your journal is empty.\nShare a prayer or write your first entry.')
                    : selectedDate
                    ? 'No entries on this day.'
                    : 'No entries in this category yet.'}
                </Text>
              )}
            </>
          )}
        </View>

        {!simple && <View style={{ paddingHorizontal: 16 }}>
          <BibleVersionPicker version={bibleVersion} onSelect={setBibleVersion} />
          <View style={{ alignItems: 'center', marginTop: 28 }}>
            <JournalFlourish color={THEME.accent} />
          </View>
          <Text style={[styles.footer, { color: THEME.inkSoft }]}>
            The beginning is in here somewhere.
          </Text>
        </View>}
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
  simpleColumn: { width: '100%', maxWidth: 548, alignSelf: 'center' },
  simpleHeading: { paddingHorizontal: 22, paddingVertical: 18, gap: 18 },
  simpleTitle: { fontFamily: FONTS.displaySemi, fontSize: 36, letterSpacing: -1 },
  // Shared
  roundBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },

  // Top
  topBar: { paddingHorizontal: 22, paddingTop: 0 },
  titleBlock: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 18 },
  heroTitle: {
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  heroSubtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, marginTop: 6 },
  deskShadow: {
    borderRadius: 26,
    shadowColor: '#2A1A10',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  // Compose card
  composeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  composePrompt: { fontFamily: FONTS.display, fontSize: 18, lineHeight: 24 },
  composeHint: { fontFamily: FONTS.body, fontSize: 13, marginTop: 4 },
  composeBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 12,
  },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 24, letterSpacing: -0.3 },
  sectionCount: { fontFamily: FONTS.body, fontSize: 13, fontVariant: ['tabular-nums'] },
  selectedDay: { fontFamily: FONTS.bodySemi, fontSize: 13, textAlign: 'center', marginTop: 12 },

  // Bible version
  versionBlock: { marginTop: 32, gap: 10 },
  versionLabel: { fontFamily: FONTS.bodySemi, fontSize: 14, paddingHorizontal: 6 },

  // Calendar
  calWrap: {
    marginHorizontal: 16,
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
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontFamily: FONTS.display,
    fontSize: 13,
  },

  // Filter chips
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { fontFamily: FONTS.bodySemi, fontSize: 13 },

  // Entry card
  entryCard: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  entryDate: { width: 44, alignItems: 'center', paddingTop: 2 },
  entryDay: { fontFamily: FONTS.display, fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'] },
  entryMonth: { fontFamily: FONTS.bodySemi, fontSize: 12, marginTop: 1 },
  entryCardTitle: {
    fontFamily: FONTS.display,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  entryCardBody: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  entryMetaText: { fontFamily: FONTS.bodySemi, fontSize: 12.5 },
  entryMetaSep: { width: 1, height: 12, marginHorizontal: 4 },

  // Detail
  detailNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  detailNavDate: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  detailBadgeText: { fontFamily: FONTS.bodySemi, fontSize: 13 },
  detailTitle: {
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  detailBody: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 12,
  },
  detailVerseCard: {
    marginTop: 18,
    padding: 22,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
  },
  detailVerseText: { fontFamily: FONTS.display, fontSize: 20, lineHeight: 30 },
  detailVerseRef: { fontFamily: FONTS.bodySemi, fontSize: 13 },

  // Composer
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composerCancel: { fontFamily: FONTS.body, fontSize: 15 },
  composerTitle: { fontFamily: FONTS.bodySemi, fontSize: 16 },
  composerSaveBtn: {
    minHeight: 38,
    minWidth: 76,
    paddingHorizontal: 18,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSaveText: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  composerBody: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 100 },
  composerLabel: { fontFamily: FONTS.bodySemi, fontSize: 14, marginBottom: 10, marginTop: 8 },
  composerTitleInput: {
    fontFamily: FONTS.display,
    fontSize: 30,
    letterSpacing: -0.4,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  composerBodyInput: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 28,
    minHeight: 180,
    textAlignVertical: 'top',
    paddingHorizontal: 0,
    paddingTop: 10,
    marginBottom: 18,
  },
  composerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  composerVersePick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
  },
  composerVerseRef: { fontFamily: FONTS.bodySemi, fontSize: 14, marginBottom: 3 },
  composerVersePreview: { fontFamily: FONTS.display, fontSize: 14, lineHeight: 20 },
  composerVersePlaceholder: { flex: 1, fontFamily: FONTS.body, fontSize: 15 },
  verseClear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  composerQuote: {
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: 13,
  },

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
  vpPreview: { fontFamily: FONTS.display, fontSize: 18, lineHeight: 28 },

  // Footer
  emptyState: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: FONTS.display,
    fontSize: 13,
    lineHeight: 22,
  },
});
