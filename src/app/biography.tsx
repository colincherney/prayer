import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
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
  { id: 'health',        label: 'Health',        glyph: '✦', color: '#85c4a0' },
  { id: 'family',        label: 'Family',        glyph: '❖', color: '#d8aa6a' },
  { id: 'work',          label: 'Work',          glyph: '◇', color: '#5fa8c8' },
  { id: 'grief',         label: 'Grief',         glyph: '❍', color: '#8a96c0' },
  { id: 'gratitude',     label: 'Gratitude',     glyph: '✥', color: '#b8a84a' },
  { id: 'faith',         label: 'Faith',         glyph: '◐', color: '#9875d8' },
  { id: 'relationships', label: 'Relationships', glyph: '◉', color: '#c86a8f' },
  { id: 'other',         label: 'Other',         glyph: '·', color: '#8a9a8a' },
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
  const book = BOOK_NAMES[m[1].trim().toLowerCase()];
  if (!book) return null;
  return { book, chapter: m[2], verse: afterColon };
}

async function fetchVerseText(ref: string, version: BibleVersion): Promise<string | null> {
  const parsed = parseVerseRef(ref);
  if (!parsed) return null;
  const { data } = await supabase
    .from(version === 'KJV' ? 'KJV' : 'CPVD')
    .select('text')
    .eq('book', parsed.book)
    .eq('chapter', parsed.chapter)
    .eq('verse', parsed.verse)
    .maybeSingle();
  return data ? (data.text as string) : null;
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
  entry, onBack, visible, bibleVersion,
}: {
  entry: Entry | null; onBack: () => void; visible: boolean; bibleVersion: BibleVersion;
}) {
  const { theme: THEME } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [fetchedVerseText, setFetchedVerseText] = useState<string | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 280, useNativeDriver: true }).start();
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
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      zIndex: 10,
    }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        <View style={styles.detailNav}>
          <Pressable onPress={onBack} style={[styles.detailNavBtn, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <Text style={[styles.detailNavBtnText, { color: THEME.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.detailNavDate, { color: THEME.muted }]}>{entry.date.toUpperCase()}</Text>
          <View style={[styles.detailNavBtn, { opacity: 0 }]} />
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

// ── New entry composer ────────────────────────────────────────────────────────
function NewEntryComposer({
  visible, onClose, onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title: string; body: string; theme: string; verseRef: string }) => void;
}) {
  const { theme: THEME } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [theme, setTheme] = useState('gratitude');
  const [verseRef, setVerseRef] = useState('');

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 340, useNativeDriver: true }).start();
    if (!visible) { setTitle(''); setBody(''); setTheme('gratitude'); setVerseRef(''); }
  }, [visible]);

  const canSave = body.trim().length > 0;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, {
      backgroundColor: THEME.bg,
      zIndex: 20,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] }) }],
    }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.composerHeader, { paddingTop: insets.top + 16, borderBottomColor: THEME.line }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.composerCancel, { color: THEME.muted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.composerTitle, { color: THEME.accent }]}>✥ NEW JOURNAL ENTRY</Text>
          <Pressable
            onPress={() => { if (canSave) onSave({ title, body, theme, verseRef }); }}
            style={[styles.composerSaveBtn, { backgroundColor: canSave ? THEME.accent : THEME.surface }]}>
            <Text style={[styles.composerSaveText, { color: canSave ? THEME.cardDarkInk : THEME.muted }]}>Save</Text>
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
            style={[styles.composerBodyInput, {
              color: THEME.ink, backgroundColor: THEME.surface, borderColor: THEME.line,
            }]}
          />

          <Text style={[styles.composerLabel, { color: THEME.muted }]}>VERSE (OPTIONAL)</Text>
          <View style={[styles.composerVerseRow, { backgroundColor: THEME.surface, borderColor: THEME.line }]}>
            <Text style={{ color: THEME.accent, fontSize: 14 }}>✥</Text>
            <TextInput
              value={verseRef} onChangeText={setVerseRef}
              placeholder="e.g. Psalm 46:10"
              placeholderTextColor={THEME.muted}
              style={[styles.composerVerseInput, { color: THEME.ink }]}
            />
          </View>

          <Text style={[styles.composerQuote, { color: THEME.muted }]}>
            "Write the vision; make it plain on tablets." — Habakkuk 2:2
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function BiographyScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const { session, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState('all');
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
    if (activeTheme === 'all') return allEntries;
    return allEntries.filter(e => e.theme === activeTheme);
  }, [activeTheme, allEntries]);

  const handleSave = async (data: {
    title: string; body: string; theme: string; verseRef: string;
  }) => {
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

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, {
            backgroundColor: THEME.surface,
            borderColor: THEME.line,
          }]}>
            <Text style={[styles.backBtnText, { color: THEME.ink }]}>‹</Text>
          </Pressable>
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
              Prayer reflections + your own entries
            </Text>
          </View>
          <Text style={[styles.sectionCount, { color: THEME.muted }]}>
            {filtered.length} / {allEntries.length}
          </Text>
        </View>

        {/* Filter chips */}
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

        {/* Entry list */}
        <View style={{ paddingHorizontal: 22 }}>
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
      />
      <NewEntryComposer
        visible={view === 'new'}
        onClose={() => setView('list')}
        onSave={handleSave}
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 26, letterSpacing: -0.3 },
  sectionSubtitle: { fontFamily: FONTS.body, fontSize: 11.5, marginTop: 2 },
  sectionCount: { fontFamily: FONTS.body, fontSize: 12 },

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
  composerVerseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
  },
  composerVerseInput: {
    flex: 1,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 16,
  },
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
