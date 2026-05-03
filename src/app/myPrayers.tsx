import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SectionLabel } from '@/components/saint/Common';
import {
  BackIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  PrayingIcon,
} from '@/components/saint/Icons';
import {
  FONTS,
  Theme,
  useTheme,
  useThemedStyles,
} from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { relativeTime } from '@/lib/time';

/* -------------------- Types -------------------- */

type Reflection = {
  id: string;
  content: string;
  age: string;
};

type UpdateKind = 'progress' | 'answered' | 'setback' | 'note';
type UpdateVisibility = 'public' | 'private';
type PrayerStatus = 'active' | 'progress' | 'answered' | 'setback';

type PrayerUpdate = {
  id: string;
  kind: UpdateKind;
  note: string;
  visibility: UpdateVisibility;
  age: string;
};

type MyPrayer = {
  id: string;
  text: string;
  age: string;
  createdAt: string;
  status: PrayerStatus;
  prayedCount: number;
  reflections: Reflection[];
  updates: PrayerUpdate[];
};

const KIND_LABEL: Record<UpdateKind, string> = {
  progress: 'Progress',
  answered: 'Answered',
  setback: 'Setback',
  note: 'Reflection',
};

const STATUS_LABEL: Record<PrayerStatus, string> = {
  active: 'Active',
  progress: 'Progress',
  answered: 'Answered',
  setback: 'Setback',
};

const statusColor = (status: PrayerStatus, theme: Theme) => {
  switch (status) {
    case 'answered':
      return { bg: theme.cardDark, fg: theme.cardDarkInk };
    case 'progress':
      return { bg: theme.accentSoft, fg: theme.ink };
    case 'setback':
      return { bg: theme.pillBg, fg: theme.pillInk };
    case 'active':
    default:
      return { bg: theme.bgSoft, fg: theme.muted };
  }
};

/* -------------------- Calendar helpers -------------------- */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type Cell = { day: number | null; date: Date | null; key: string };

const buildCells = (firstOfMonth: Date): Cell[] => {
  const year = firstOfMonth.getFullYear();
  const month = firstOfMonth.getMonth();
  const firstDay = firstOfMonth.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, date: null, key: `pad-${i}` });
  }
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    cells.push({ day: d, date, key: dayKey(date) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, date: null, key: `tail-${cells.length}` });
  }
  return cells;
};

/* -------------------- Screen -------------------- */

export default function MyPrayersScreen() {
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [myPrayers, setMyPrayers] = useState<MyPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateTarget, setUpdateTarget] = useState<MyPrayer | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    const userId = session.user.id;
    const { data } = await supabase
      .from('prayers')
      .select(
        'id, body, created_at, status, prayer_interactions(action), reflections(id, content, created_at), prayer_updates(id, kind, note, visibility, created_at)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const prayers: MyPrayer[] = (data ?? []).map(p => {
      const rawReflections =
        (p.reflections as { id: string; content: string; created_at: string }[] | null) ?? [];
      const reflections = rawReflections
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .map(r => ({
          id: r.id,
          content: r.content,
          age: relativeTime(r.created_at),
        }));
      const rawUpdates =
        (p.prayer_updates as {
          id: string;
          kind: UpdateKind;
          note: string;
          visibility: UpdateVisibility;
          created_at: string;
        }[] | null) ?? [];
      const updates = rawUpdates
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .map(u => ({
          id: u.id,
          kind: u.kind,
          note: u.note,
          visibility: u.visibility,
          age: relativeTime(u.created_at),
        }));
      return {
        id: p.id as string,
        text: (p.body as string) ?? '',
        age: relativeTime(p.created_at as string),
        createdAt: p.created_at as string,
        status: ((p.status as PrayerStatus) ?? 'active'),
        prayedCount: ((p.prayer_interactions as { action: string }[] | null) ?? []).filter(
          i => i.action === 'prayed',
        ).length,
        reflections,
        updates,
      };
    });

    setMyPrayers(prayers);
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  // Day → count of prayers created on that day
  const dayCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of myPrayers) {
      const k = dayKey(new Date(p.createdAt));
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [myPrayers]);

  const cells = useMemo(() => buildCells(viewMonth), [viewMonth]);

  const filteredPrayers = useMemo(() => {
    if (!selectedDay) return myPrayers;
    return myPrayers.filter(p => dayKey(new Date(p.createdAt)) === selectedDay);
  }, [myPrayers, selectedDay]);

  const goPrevMonth = () =>
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () =>
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon size={16} color={THEME.ink} />
          </Pressable>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>prayers</Text>
          </Text>
          <Text style={styles.subtitle}>
            A record of every request — held, reflected on, returned to.
          </Text>
        </View>

        {/* Calendar */}
        <View style={{ paddingHorizontal: 22, marginTop: 22 }}>
          <View style={styles.calendarCard}>
            <View style={styles.calHeader}>
              <Pressable onPress={goPrevMonth} hitSlop={10} style={styles.calNavBtn}>
                <BackIcon size={14} color={THEME.ink} />
              </Pressable>
              <Text style={styles.calMonth}>
                {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </Text>
              <Pressable onPress={goNextMonth} hitSlop={10} style={styles.calNavBtn}>
                <View style={{ transform: [{ scaleX: -1 }] }}>
                  <BackIcon size={14} color={THEME.ink} />
                </View>
              </Pressable>
            </View>

            <View style={styles.dowRow}>
              {DOW.map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.dowText}>{d}</Text>
              ))}
            </View>

            <View style={styles.gridWrap}>
              {cells.map(c => {
                const count = c.key && c.day ? dayCounts.get(c.key) ?? 0 : 0;
                const isSelected = c.key === selectedDay;
                const isToday =
                  c.date && dayKey(c.date) === dayKey(new Date());
                if (!c.day) {
                  return <View key={c.key} style={styles.dayCell} />;
                }
                return (
                  <Pressable
                    key={c.key}
                    onPress={() =>
                      setSelectedDay(prev => (prev === c.key ? null : c.key))
                    }
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: THEME.cardDark, borderRadius: 10 },
                    ]}>
                    <Text
                      style={[
                        styles.dayNum,
                        {
                          color: isSelected
                            ? THEME.cardDarkInk
                            : count > 0
                            ? THEME.ink
                            : THEME.muted,
                          fontFamily: count > 0 ? FONTS.bodySemi : FONTS.body,
                        },
                        isToday && !isSelected && { color: THEME.accent },
                      ]}>
                      {c.day}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          styles.dayDot,
                          {
                            backgroundColor: isSelected
                              ? THEME.cardDarkInk
                              : THEME.accent,
                          },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {selectedDay && (
              <Pressable onPress={() => setSelectedDay(null)} style={styles.clearChip}>
                <Text style={styles.clearChipText}>Clear filter</Text>
              </Pressable>
            )}
          </View>
        </View>

        <SectionLabel style={{ paddingHorizontal: 22 }}>
          {selectedDay
            ? `On ${MONTH_NAMES[new Date(selectedDay).getMonth()]} ${new Date(selectedDay).getDate()}`
            : `All requests · ${myPrayers.length}`}
        </SectionLabel>

        {loading ? (
          <View style={{ paddingTop: 20, alignItems: 'center' }}>
            <ActivityIndicator color={THEME.accent} />
          </View>
        ) : filteredPrayers.length === 0 ? (
          <View style={{ paddingHorizontal: 22 }}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {selectedDay
                  ? 'Nothing was offered up on this day.'
                  : "You haven't shared a prayer yet. When you do, it'll be held here."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 22, gap: 10 }}>
            {filteredPrayers.map(r => {
              const sc = statusColor(r.status, THEME);
              return (
                <View key={r.id} style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: sc.fg }]}>
                          {STATUS_LABEL[r.status].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.requestStatus, { color: THEME.muted }]}>
                        · {r.age.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <PrayingIcon size={13} color={THEME.muted} />
                      <Text style={styles.countText}>{r.prayedCount}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestBody}>&ldquo;{r.text}&rdquo;</Text>

                  {r.updates.length > 0 && (
                    <View style={styles.notesBlock}>
                      <Text style={styles.updatesHeading}>Your reflections</Text>
                      <View style={{ marginTop: 8, gap: 8 }}>
                        {r.updates.map(u => (
                          <View key={u.id} style={styles.updateCard}>
                            <View style={styles.updateRow}>
                              <Text style={[styles.updateKind, { color: THEME.pillInk }]}>
                                {KIND_LABEL[u.kind]}
                              </Text>
                              <View style={styles.updateMeta}>
                                {u.visibility === 'private' ? (
                                  <LockIcon size={11} color={THEME.muted} />
                                ) : (
                                  <GlobeIcon size={11} color={THEME.muted} />
                                )}
                                <Text style={styles.updateAge}>{u.age}</Text>
                              </View>
                            </View>
                            <Text style={styles.updateNote}>{u.note}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {r.reflections.length > 0 && (
                    <View style={styles.notesBlock}>
                      <View style={styles.notesHeading}>
                        <HeartIcon size={13} color={THEME.accent} />
                        <Text style={styles.notesText}>
                          {r.reflections.length}{' '}
                          {r.reflections.length === 1 ? 'note' : 'notes'} of encouragement
                        </Text>
                      </View>
                      <View style={{ marginTop: 10, gap: 8 }}>
                        {r.reflections.map(n => (
                          <View key={n.id} style={styles.noteCard}>
                            <Text style={styles.noteContent}>&ldquo;{n.content}&rdquo;</Text>
                            <Text style={styles.noteAge}>Anonymous · {n.age}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <Pressable
                    onPress={() => setUpdateTarget(r)}
                    style={({ pressed }) => [
                      styles.reflectBtn,
                      pressed && { opacity: 0.7 },
                    ]}>
                    <Text style={styles.reflectBtnText}>+ Add reflection</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ReflectSheet
        prayer={updateTarget}
        onClose={() => setUpdateTarget(null)}
        onSubmitted={async () => {
          setUpdateTarget(null);
          await loadData();
        }}
      />
    </SafeAreaView>
  );
}

/* -------------------- ReflectSheet -------------------- */

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ReflectSheet: React.FC<{
  prayer: MyPrayer | null;
  onClose: () => void;
  onSubmitted: () => void | Promise<void>;
}> = ({ prayer, onClose, onSubmitted }) => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [kind, setKind] = useState<UpdateKind>('progress');
  const [visibility, setVisibility] = useState<UpdateVisibility>('public');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const slide = useSharedValue(SCREEN_HEIGHT);
  const fade = useSharedValue(0);

  const visible = prayer !== null;

  useEffect(() => {
    if (visible) {
      setKind('progress');
      setVisibility('public');
      setNote('');
      setError(null);
      setMounted(true);
      slide.value = SCREEN_HEIGHT;
      fade.value = 0;
      fade.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
      slide.value = withTiming(0, {
        duration: 320,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    } else if (mounted) {
      fade.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
      slide.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 240, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [visible, mounted, slide, fade]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value }],
  }));

  const canSubmit = note.trim().length > 0 && !busy;

  const onSubmit = async () => {
    if (!prayer || !canSubmit) return;
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase.functions.invoke('submit-prayer-update', {
      body: {
        prayer_id: prayer.id,
        kind,
        note: note.trim(),
        visibility,
      },
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    if (data?.ok === false) {
      setError(
        data.reason === 'moderation_blocked'
          ? "This reflection doesn't fit our community guidelines. Try rewording."
          : 'Something went wrong — please try again.',
      );
      return;
    }
    await onSubmitted();
  };

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      <Animated.View style={[styles.sheetBackdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrap}
        pointerEvents="box-none">
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.sheetHandle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}>
            <Text style={styles.sheetTitle}>
              How is this <Text style={styles.sheetTitleItalic}>prayer</Text> sitting now?
            </Text>
            {prayer ? (
              <Text style={styles.sheetPrayerEcho} numberOfLines={2}>
                &ldquo;{prayer.text}&rdquo;
              </Text>
            ) : null}

            <Text style={styles.sheetLabel}>Where it is</Text>
            <View style={styles.kindRow}>
              {(['progress', 'answered', 'setback', 'note'] as UpdateKind[]).map(k => {
                const active = kind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setKind(k)}
                    style={[
                      styles.kindChip,
                      {
                        backgroundColor: active ? THEME.cardDark : THEME.surface,
                        borderColor: active ? THEME.cardDark : THEME.line,
                      },
                    ]}>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMed,
                        fontSize: 13,
                        color: active ? THEME.cardDarkInk : THEME.inkSoft,
                      }}>
                      {KIND_LABEL[k]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>Your reflection</Text>
            <View style={styles.sheetTextareaCard}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What's changed? What are you noticing?"
                placeholderTextColor={THEME.muted}
                multiline
                maxLength={1000}
                style={styles.sheetTextarea}
              />
              <Text style={styles.sheetCount}>{note.length}/1000</Text>
            </View>

            <Text style={styles.sheetLabel}>Who can see this</Text>
            <View style={styles.visRow}>
              {(['public', 'private'] as UpdateVisibility[]).map(v => {
                const active = visibility === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setVisibility(v)}
                    style={[
                      styles.visChip,
                      {
                        backgroundColor: active ? THEME.pillBg : THEME.surface,
                        borderColor: active ? THEME.pillInk : THEME.line,
                      },
                    ]}>
                    {v === 'public' ? (
                      <GlobeIcon size={13} color={active ? THEME.pillInk : THEME.muted} />
                    ) : (
                      <LockIcon size={13} color={active ? THEME.pillInk : THEME.muted} />
                    )}
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMed,
                        fontSize: 12.5,
                        color: active ? THEME.pillInk : THEME.inkSoft,
                      }}>
                      {v === 'public' ? 'People who prayed' : 'Just me'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={styles.sheetError}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.sheetActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.sheetCancel,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={busy ? 'Saving…' : 'Save reflection'}
                disabled={!canSubmit}
                onPress={onSubmit}
              />
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* -------------------- Styles -------------------- */

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 44,
    color: THEME.ink,
    marginTop: 6,
    letterSpacing: -0.6,
  },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    marginTop: 8,
  },

  /* Calendar */
  calendarCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSoft,
  },
  calMonth: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  dowRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  dowText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    color: THEME.muted,
    letterSpacing: 0.6,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayNum: {
    fontSize: 14,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  clearChip: {
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: THEME.bgSoft,
  },
  clearChipText: {
    fontFamily: FONTS.bodyMed,
    fontSize: 11.5,
    color: THEME.inkSoft,
    letterSpacing: 0.4,
  },

  /* Request cards */
  emptyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  emptyText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: THEME.inkSoft,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestStatus: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.2 },
  countText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  requestBody: { fontFamily: FONTS.display, fontSize: 16, lineHeight: 22, color: THEME.ink },
  notesBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  notesHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.inkSoft },
  noteCard: {
    backgroundColor: THEME.bgSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteContent: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: THEME.ink,
  },
  noteAge: { fontFamily: FONTS.body, fontSize: 11, color: THEME.muted, marginTop: 6 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  updatesHeading: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11.5,
    letterSpacing: 0.6,
    color: THEME.inkSoft,
    textTransform: 'uppercase',
  },
  updateCard: {
    backgroundColor: THEME.bgSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  updateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  updateKind: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  updateMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  updateAge: { fontFamily: FONTS.body, fontSize: 11, color: THEME.muted },
  updateNote: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.ink },
  reflectBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    backgroundColor: THEME.bgSoft,
  },
  reflectBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
    color: THEME.inkSoft,
  },

  /* Sheet */
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.line,
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 30,
    color: THEME.ink,
    letterSpacing: -0.4,
  },
  sheetTitleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  sheetPrayerEcho: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: THEME.muted,
    marginTop: 8,
  },
  sheetLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11.5,
    letterSpacing: 1.4,
    color: THEME.muted,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetTextareaCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  sheetTextarea: {
    fontFamily: FONTS.body,
    fontSize: 14.5,
    lineHeight: 20,
    color: THEME.ink,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  sheetCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: THEME.muted,
    textAlign: 'right',
    marginTop: 6,
  },
  visRow: { flexDirection: 'row', gap: 8 },
  visChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetError: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    color: THEME.accent,
    marginTop: 12,
  },
  sheetCancel: {
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: THEME.inkSoft,
  },
});
