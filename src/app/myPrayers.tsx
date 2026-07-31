import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { PrimaryButton } from '@/components/saint/Common';
import {
  ArrowIcon,
  BackIcon,
  CloseIcon,
  GlobeIcon,
  LockIcon,
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
  createdAt: string;
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

type Interaction = { action: string; createdAt: string };

type MyPrayer = {
  id: string;
  text: string;
  age: string;
  createdAt: string;
  status: PrayerStatus;
  prayedCount: number;
  interactions: Interaction[];
  reflections: Reflection[];
  updates: PrayerUpdate[];
  // Where this prayer was shared — null = public community, string = group name
  groupName: string | null;
};

const KIND_LABEL: Record<UpdateKind, string> = {
  progress: 'Progress',
  answered: 'Answered',
  setback: 'Setback',
  note: 'Reflection',
};

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const dayKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Prayer-room palettes give `cardDark` an rgba alpha meant for cards sitting
// over the room's illustrated scene art. The bottom-sheet modals here float
// over the whole page instead, so that transparency lets the page underneath
// show through and blend with the sheet's own content — strip the alpha so
// the sheet is always a solid backing.
const opaque = (color: string): string => {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,[^)]+)?\)/);
  return m ? `rgb(${m[1]}, ${m[2]}, ${m[3]})` : color;
};

const formatJoined = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const formatShortDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
};

/* -------------------- CandleRow -------------------- */

const CandleRow: React.FC<{ data: number[]; theme: Theme }> = ({
  data,
  theme,
}) => {
  const max = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={candleStyles.row}>
      {data.map((v, i) => {
        const intensity = v / max;
        const flameH = 8 + intensity * 16;
        const isToday = i === data.length - 1;
        const haloOpacity = 0.18 + intensity * 0.32;
        return (
          <View key={i} style={candleStyles.col}>
            <View style={candleStyles.flameWrap}>
              <View
                style={[
                  candleStyles.halo,
                  {
                    backgroundColor: theme.accentSoft,
                    opacity: haloOpacity,
                    transform: [{ scale: 0.8 + intensity * 0.6 }],
                  },
                ]}
              />
              <LinearGradient
                colors={[
                  theme.cardDarkInk,
                  theme.accentSoft,
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[
                  candleStyles.flame,
                  {
                    height: flameH,
                    shadowColor: isToday ? theme.accentSoft : 'transparent',
                    shadowOpacity: isToday ? 0.7 : 0,
                    shadowRadius: isToday ? 8 : 0,
                  },
                ]}
              />
            </View>
            <View
              style={[
                candleStyles.body,
                { backgroundColor: theme.cardDarkInk },
              ]}
            />
            <View style={candleStyles.baseShadow} />
            <Text
              style={[
                candleStyles.dayLabel,
                {
                  color: isToday
                    ? theme.accentSoft
                    : 'rgba(255,255,255,0.40)',
                },
              ]}>
              {days[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const candleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  flameWrap: {
    height: 30,
    width: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  flame: {
    width: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  body: {
    width: 8,
    height: 26,
    borderRadius: 2,
    opacity: 0.92,
  },
  baseShadow: {
    width: 18,
    height: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginTop: -2,
  },
  dayLabel: {
    marginTop: 2,
    fontSize: 9.5,
    letterSpacing: 0.6,
    fontFamily: FONTS.bodySemi,
  },
});

/* -------------------- ReachRadar -------------------- */

const ReachRadar: React.FC<{ accent: string; accentSoft: string }> = ({
  accent,
  accentSoft,
}) => {
  const dots = useMemo(() => {
    const out: { x: number; y: number; size: number; cls: 'gold' | 'soft' | 'faint' }[] = [];
    let seed = 1;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 70; i++) {
      const r = 26 + rnd() * 78;
      const th = rnd() * Math.PI * 2;
      const x = 110 + Math.cos(th) * r;
      const y = 110 + Math.sin(th) * r;
      const intensity = rnd();
      const size = intensity > 0.85 ? 5 : intensity > 0.55 ? 3.4 : 2.4;
      const cls: 'gold' | 'soft' | 'faint' =
        intensity > 0.6 ? 'gold' : intensity > 0.3 ? 'soft' : 'faint';
      out.push({ x, y, size, cls });
    }
    return out;
  }, []);

  return (
    <View style={{ width: 220, height: 220, alignSelf: 'center' }}>
      <Svg width={220} height={220} viewBox="0 0 220 220">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accentSoft} stopOpacity={0.55} />
            <Stop offset="60%" stopColor={accentSoft} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={accentSoft} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {[40, 65, 90].map((r, i) => (
          <Circle
            key={i}
            cx={110}
            cy={110}
            r={r}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={0.7}
            strokeDasharray={i === 1 ? '2 4' : undefined}
            fill="none"
          />
        ))}

        <Circle cx={110} cy={110} r={80} fill="url(#halo)" />

        {dots.map((d, i) => (
          <Circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.size}
            fill={
              d.cls === 'gold'
                ? accentSoft
                : d.cls === 'soft'
                ? `${accentSoft}80`
                : 'rgba(255,255,255,0.25)'
            }
          />
        ))}

        {/* center candle glyph */}
        <G x={110} y={110}>
          <Ellipse cx={0} cy={14} rx={14} ry={3} fill="rgba(0,0,0,0.5)" />
          <Path
            d="M0 -10 C -3 -6, -3 -2, 0 2 C 3 -2, 3 -6, 0 -10 Z"
            fill="#fdf3d8"
          />
          <Rect x={-4} y={2} width={8} height={12} rx={1} fill="#f4ede0" />
        </G>

        <Circle
          cx={110}
          cy={110}
          r={14}
          fill="none"
          stroke={accentSoft}
          strokeOpacity={0.45}
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
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
  const [weekSheetOpen, setWeekSheetOpen] = useState(false);
  const [reachSheetOpen, setReachSheetOpen] = useState(false);
  const [allSheetOpen, setAllSheetOpen] = useState(false);

  // Sequence modal transitions: never present a second Modal while another
  // is still dismissing (iOS silently drops/crashes the second present).
  // Wait for the close animation (~280ms in useSheetAnimation, 240ms in
  // ReflectSheet) before mounting the next one.
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (handoffTimer.current) clearTimeout(handoffTimer.current);
    },
    [],
  );
  const handoffToReflect = useCallback((p: MyPrayer) => {
    if (handoffTimer.current) clearTimeout(handoffTimer.current);
    handoffTimer.current = setTimeout(() => {
      setUpdateTarget(p);
      handoffTimer.current = null;
    }, 320);
  }, []);

  const loadData = useCallback(async () => {
    if (!session) return;
    const userId = session.user.id;
    const { data } = await supabase
      .from('prayers')
      .select(
        'id, body, created_at, status, group_id, groups(name), prayer_interactions(action, created_at), reflections(id, content, created_at), prayer_updates(id, kind, note, visibility, created_at)',
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
          createdAt: r.created_at,
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
      const rawInteractions =
        (p.prayer_interactions as { action: string; created_at: string }[] | null) ?? [];
      const interactions: Interaction[] = rawInteractions.map(i => ({
        action: i.action,
        createdAt: i.created_at,
      }));
      const groupRow = p.groups as { name: string } | null;
      return {
        id: p.id as string,
        text: (p.body as string) ?? '',
        age: relativeTime(p.created_at as string),
        createdAt: p.created_at as string,
        status: ((p.status as PrayerStatus) ?? 'active'),
        prayedCount: interactions.filter(i => i.action === 'prayed').length,
        interactions,
        reflections,
        updates,
        groupName: groupRow?.name ?? null,
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

  /* -------------------- Derived data -------------------- */

  // Prayer being "carried" — most recent active prayer with the most prayers,
  // falling back to the most recent active prayer.
  const carrying = useMemo(() => {
    const active = myPrayers.filter(p => p.status !== 'answered');
    if (active.length === 0) return myPrayers[0] ?? null;
    return [...active].sort((a, b) => b.prayedCount - a.prayedCount)[0] ?? null;
  }, [myPrayers]);

  // Last 7 days of "candles lit" — count of `prayed` interactions per day,
  // ending today.
  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets[dayKeyOf(d)] = 0;
    }
    for (const p of myPrayers) {
      for (const it of p.interactions) {
        if (it.action !== 'prayed') continue;
        const k = dayKeyOf(new Date(it.createdAt));
        if (k in buckets) buckets[k] += 1;
      }
    }
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(buckets[dayKeyOf(d)] ?? 0);
    }
    return out;
  }, [myPrayers]);

  const totalThisWeek = week.reduce((a, b) => a + b, 0);

  // Latest note left on any of my prayers.
  const latestNote = useMemo(() => {
    let best: { reflection: Reflection; prayer: MyPrayer } | null = null;
    for (const p of myPrayers) {
      const r = p.reflections[0];
      if (!r) continue;
      if (
        !best ||
        new Date(r.createdAt).getTime() >
          new Date(best.reflection.createdAt).getTime()
      ) {
        best = { reflection: r, prayer: p };
      }
    }
    return best;
  }, [myPrayers]);

  // Most recently answered prayer.
  const lastAnswered = useMemo(
    () => myPrayers.find(p => p.status === 'answered') ?? null,
    [myPrayers],
  );

  // Top prayers this week — sorted by interactions in last 7 days.
  const topThisWeek = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffMs = cutoff.getTime();
    return myPrayers
      .map(p => ({
        prayer: p,
        thisWeek: p.interactions.filter(
          i =>
            i.action === 'prayed' &&
            new Date(i.createdAt).getTime() >= cutoffMs,
        ).length,
      }))
      .filter(x => x.thisWeek > 0)
      .sort((a, b) => b.thisWeek - a.thisWeek)
      .slice(0, 3);
  }, [myPrayers]);

  // All notes from strangers across all prayers, newest first.
  const allNotes = useMemo(() => {
    const out: { reflection: Reflection; prayer: MyPrayer }[] = [];
    for (const p of myPrayers) {
      for (const r of p.reflections) {
        out.push({ reflection: r, prayer: p });
      }
    }
    out.sort(
      (a, b) =>
        new Date(b.reflection.createdAt).getTime() -
        new Date(a.reflection.createdAt).getTime(),
    );
    return out;
  }, [myPrayers]);

  const totalReach = useMemo(
    () =>
      myPrayers.reduce(
        (s, p) =>
          s + p.interactions.filter(i => i.action === 'prayed').length,
        0,
      ),
    [myPrayers],
  );

  const joined = formatJoined(session?.user?.created_at ?? null);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}>
        {/* Brand row */}
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtnSurface}>
            <BackIcon size={15} color={THEME.ink} />
          </Pressable>
          <Text style={styles.brandText}>
            Saint <Text style={{ fontFamily: FONTS.body }}>Central</Text>
          </Text>
          <View style={styles.brandSpacer} />
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              My{'\n'}
              <Text style={styles.titleItalic}>Prayers</Text>
            </Text>
            <Text style={styles.subtitle}>Anonymous · since {joined}</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={THEME.accent} />
          </View>
        ) : myPrayers.length === 0 ? (
          <View style={{ paddingHorizontal: 22, marginTop: 8 }}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                You haven&rsquo;t shared a prayer yet. When you do, it&rsquo;ll
                be held here.
              </Text>
              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  label="Share a prayer"
                  onPress={() => router.push('/prayerRequest')}
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Carrying card */}
            {carrying && (
              <Pressable
                onPress={() => setUpdateTarget(carrying)}
                style={styles.carryingCard}>
                <View
                  style={[
                    styles.carryingHalo,
                    { backgroundColor: THEME.accentSoft },
                  ]}
                />
                <View style={styles.carryingTop}>
                  <View style={styles.carryingTopLeft}>
                    <View
                      style={[
                        styles.glowDot,
                        {
                          backgroundColor: THEME.accentSoft,
                          shadowColor: THEME.accentSoft,
                        },
                      ]}
                    />
                    <Text style={[styles.eyebrow, { color: THEME.accent }]}>
                      Carrying
                    </Text>
                  </View>
                  <ArrowIcon size={13} color={THEME.muted} />
                </View>
                <Text style={styles.carryingBody} numberOfLines={3}>
                  &ldquo;{carrying.text}&rdquo;
                </Text>
                <View
                  style={[
                    styles.carryingFooter,
                    { borderTopColor: THEME.line },
                  ]}>
                  <Text style={styles.carryingFooterText}>
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemi,
                        color: THEME.accent,
                      }}>
                      {carrying.prayedCount}
                    </Text>{' '}
                    {carrying.prayedCount === 1 ? 'soul is' : 'souls are'}{' '}
                    praying with you tonight.
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Lifted up for you */}
            <Pressable
              onPress={() => setWeekSheetOpen(true)}
              style={styles.darkPanel}>
              <View style={styles.darkPanelHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.eyebrow,
                      { color: THEME.accentSoft, marginBottom: 4 },
                    ]}>
                    This week
                  </Text>
                  <Text style={styles.darkTitle}>Lifted up for you</Text>
                </View>
                <View
                  style={[
                    styles.iconBtnRoundLight,
                    { backgroundColor: THEME.cardDarkInk },
                  ]}>
                  <ArrowIcon size={14} color={THEME.cardDark} />
                </View>
              </View>

              <Text style={styles.darkPoetic}>
                A long table{'\n'}of candles.
              </Text>

              <View style={{ marginTop: 18 }}>
                <CandleRow data={week} theme={THEME} />
              </View>

              <View style={styles.weekMetaRow}>
                <Text style={styles.weekMetaMuted}>Mon — today</Text>
                <Text style={styles.weekMetaSoft}>
                  {totalThisWeek} {totalThisWeek === 1 ? 'candle' : 'candles'}{' '}
                  lit
                </Text>
              </View>

              {carrying && (
                <Pressable
                  onPress={() => setUpdateTarget(carrying)}
                  style={styles.featuredPill}>
                  <View style={styles.featuredPillTop}>
                    <Text
                      style={[
                        styles.eyebrowSm,
                        { color: THEME.accentSoft },
                      ]}>
                      Top prayer · today
                    </Text>
                    <ArrowIcon size={12} color="rgba(255,255,255,0.55)" />
                  </View>
                  <Text style={styles.featuredPillBody} numberOfLines={2}>
                    {carrying.text}
                  </Text>
                  <View style={styles.featuredPillStats}>
                    <Text style={styles.featuredPillStat}>
                      <Text style={styles.featuredPillStatNum}>
                        {carrying.prayedCount}
                      </Text>{' '}
                      prayers
                    </Text>
                    <View style={styles.featuredPillDivider} />
                    <Text style={styles.featuredPillStat}>
                      <Text style={styles.featuredPillStatNum}>
                        {carrying.reflections.length}
                      </Text>{' '}
                      notes
                    </Text>
                  </View>
                </Pressable>
              )}
            </Pressable>

            {/* Reach */}
            <Pressable
              onPress={() => setReachSheetOpen(true)}
              style={[styles.darkPanel, { marginTop: 16 }]}>
              <View style={styles.darkPanelHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.eyebrow,
                      { color: THEME.accentSoft, marginBottom: 4 },
                    ]}>
                    Reach
                  </Text>
                  <Text style={styles.darkTitle}>Strangers praying</Text>
                </View>
                <View
                  style={[
                    styles.iconBtnRoundDarkBordered,
                    { borderColor: 'rgba(255,255,255,0.18)' },
                  ]}>
                  <ArrowIcon size={14} color="#fff" />
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <ReachRadar
                  accent={THEME.accent}
                  accentSoft={THEME.accentSoft}
                />
              </View>
              <Text style={styles.reachCaption}>
                Each glow is someone, somewhere,{'\n'}holding you in the dark.
              </Text>
            </Pressable>

            {/* Latest note */}
            {latestNote && (
              <Pressable
                onPress={() => setUpdateTarget(latestNote.prayer)}
                style={styles.noteCardOuter}>
                <View style={styles.noteCardTop}>
                  <Text style={[styles.eyebrow, { color: THEME.accent }]}>
                    A note arrived · {latestNote.reflection.age}
                  </Text>
                  <ArrowIcon size={13} color={THEME.muted} />
                </View>
                <Text style={styles.noteCardBody}>
                  <Text style={{ color: THEME.accent }}>&ldquo;</Text>
                  {latestNote.reflection.content}
                  <Text style={{ color: THEME.accent }}>&rdquo;</Text>
                </Text>
                <Text style={styles.noteCardMeta}>
                  — Anonymous ·{' '}
                  {latestNote.prayer.text.slice(0, 42)}
                  {latestNote.prayer.text.length > 42 ? '…' : ''}
                </Text>
              </Pressable>
            )}

            {/* Recently answered */}
            {lastAnswered && (
              <Pressable
                onPress={() => setUpdateTarget(lastAnswered)}
                style={[
                  styles.answeredCard,
                  { borderColor: `${THEME.accent}55` },
                ]}>
                <LinearGradient
                  colors={[
                    `${THEME.accentSoft}33`,
                    `${THEME.accentSoft}0A`,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill as any}
                />
                <View
                  style={[
                    styles.answeredHalo,
                    { backgroundColor: THEME.accentSoft },
                  ]}
                />
                <View style={styles.answeredTop}>
                  <Text style={[styles.eyebrow, { color: THEME.accent }]}>
                    ✦ Answered · {formatShortDate(lastAnswered.createdAt)}
                  </Text>
                  <ArrowIcon size={13} color={THEME.muted} />
                </View>
                <Text style={styles.answeredBody} numberOfLines={2}>
                  {lastAnswered.text}
                </Text>
                <Text style={styles.answeredMeta}>
                  {lastAnswered.prayedCount} prayers ·{' '}
                  {lastAnswered.reflections.length} notes · move to thanksgiving
                  →
                </Text>
              </Pressable>
            )}

            {/* Recent prayers */}
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent prayers</Text>
              <Pressable
                onPress={() => setAllSheetOpen(true)}
                style={styles.recentAllRow}
                hitSlop={10}>
                <Text style={styles.recentAllText}>
                  All · {myPrayers.length}
                </Text>
                <ArrowIcon size={11} color={THEME.muted} />
              </Pressable>
            </View>
            <View style={styles.recentList}>
              {myPrayers.slice(0, 5).map((p, i) => {
                const isAnswered = p.status === 'answered';
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setUpdateTarget(p)}
                    style={[
                      styles.recentRow,
                      i > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: THEME.line,
                      },
                    ]}>
                    <View
                      style={[
                        styles.recentDot,
                        {
                          backgroundColor: isAnswered
                            ? THEME.accentSoft
                            : THEME.accent,
                          shadowColor: isAnswered
                            ? THEME.accentSoft
                            : 'transparent',
                          shadowOpacity: isAnswered ? 0.55 : 0,
                          shadowRadius: 5,
                        },
                      ]}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.recentRowTitle} numberOfLines={1}>
                        {p.text}
                      </Text>
                      <Text style={styles.recentRowMeta}>
                        {p.prayedCount} {p.prayedCount === 1 ? 'prayer' : 'prayers'} · {p.age} · {p.groupName ? `${p.groupName}` : 'Community'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.recentRowMark,
                        { color: isAnswered ? THEME.accent : THEME.muted },
                      ]}>
                      {isAnswered ? '✦' : '↗'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating compose */}
      <Pressable
        onPress={() => router.push('/prayerRequest')}
        style={[
          styles.floatingBtn,
          { backgroundColor: THEME.cardDark, shadowColor: THEME.cardDark },
        ]}>
        <View
          style={[
            styles.floatingPlus,
            { backgroundColor: THEME.accentSoft },
          ]}>
          <Text style={[styles.floatingPlusText, { color: THEME.cardDark }]}>
            +
          </Text>
        </View>
        <Text style={[styles.floatingLabel, { color: THEME.cardDarkInk }]}>
          New prayer
        </Text>
      </Pressable>

      <ReflectSheet
        prayer={updateTarget}
        onClose={() => setUpdateTarget(null)}
        onSubmitted={async () => {
          setUpdateTarget(null);
          await loadData();
        }}
      />

      <WeekSheet
        open={weekSheetOpen}
        onClose={() => setWeekSheetOpen(false)}
        week={week}
        total={totalThisWeek}
        topPrayers={topThisWeek}
        onOpenPrayer={p => {
          setWeekSheetOpen(false);
          handoffToReflect(p);
        }}
      />

      <ReachSheet
        open={reachSheetOpen}
        onClose={() => setReachSheetOpen(false)}
        notes={allNotes}
        totalReach={totalReach}
        onOpenPrayer={p => {
          setReachSheetOpen(false);
          handoffToReflect(p);
        }}
      />

      <AllPrayersSheet
        open={allSheetOpen}
        onClose={() => setAllSheetOpen(false)}
        prayers={myPrayers}
        onOpenPrayer={p => {
          setAllSheetOpen(false);
          handoffToReflect(p);
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

/* -------------------- DarkSheet wrapper -------------------- */

const useSheetAnimation = (open: boolean) => {
  const [mounted, setMounted] = useState(false);
  const slide = useSharedValue(SCREEN_HEIGHT);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      slide.value = SCREEN_HEIGHT;
      fade.value = 0;
      fade.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      slide.value = withTiming(0, {
        duration: 380,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    } else if (mounted) {
      fade.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) });
      slide.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 280, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [open, mounted, slide, fade]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value }],
  }));
  return { mounted, backdropStyle, sheetStyle };
};

/* -------------------- WeekSheet -------------------- */

const BigCandleRow: React.FC<{ data: number[]; theme: Theme }> = ({
  data,
  theme,
}) => {
  const max = Math.max(...data, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    <View style={bigCandleStyles.row}>
      {data.map((v, i) => {
        const intensity = v / max;
        const flameH = 14 + intensity * 30;
        const isToday = i === data.length - 1;
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - (data.length - 1 - i));
        const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayDate.getDay()];
        return (
          <View key={i} style={bigCandleStyles.col}>
            <Text
              style={[
                bigCandleStyles.count,
                {
                  color: v > 0 ? theme.accentSoft : 'rgba(255,255,255,0.30)',
                  fontFamily: FONTS.bodySemi,
                },
              ]}>
              {v}
            </Text>
            <View style={bigCandleStyles.flameWrap}>
              <View
                style={[
                  bigCandleStyles.halo,
                  {
                    backgroundColor: theme.accentSoft,
                    opacity: 0.18 + intensity * 0.42,
                    transform: [{ scale: 0.8 + intensity * 0.7 }],
                  },
                ]}
              />
              <LinearGradient
                colors={[
                  theme.cardDarkInk,
                  theme.accentSoft,
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[
                  bigCandleStyles.flame,
                  {
                    height: flameH,
                    shadowColor: isToday ? theme.accentSoft : 'transparent',
                    shadowOpacity: isToday ? 0.8 : 0,
                    shadowRadius: isToday ? 12 : 0,
                  },
                ]}
              />
            </View>
            <View
              style={[
                bigCandleStyles.body,
                { backgroundColor: theme.cardDarkInk },
              ]}
            />
            <View style={bigCandleStyles.baseShadow} />
            <Text
              style={[
                bigCandleStyles.dayLetter,
                {
                  color: isToday
                    ? theme.accentSoft
                    : 'rgba(255,255,255,0.40)',
                },
              ]}>
              {dayLetter}
            </Text>
            <Text style={bigCandleStyles.dayNum}>
              {dayDate.getDate()}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const bigCandleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 4,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  count: {
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  flameWrap: {
    height: 50,
    width: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    bottom: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  flame: {
    width: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  body: {
    width: 12,
    height: 42,
    borderRadius: 3,
    marginTop: 2,
    opacity: 0.92,
  },
  baseShadow: {
    width: 26,
    height: 5,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginTop: -2,
  },
  dayLetter: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: FONTS.bodySemi,
  },
  dayNum: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.50)',
    fontFamily: FONTS.body,
  },
});

const WeekSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  week: number[];
  total: number;
  topPrayers: { prayer: MyPrayer; thisWeek: number }[];
  onOpenPrayer: (p: MyPrayer) => void;
}> = ({ open, onClose, week, total, topPrayers, onOpenPrayer }) => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { mounted, backdropStyle, sheetStyle } = useSheetAnimation(open);

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
      <View style={styles.darkSheetWrap} pointerEvents="box-none">
        <Animated.View style={[styles.darkSheet, sheetStyle]}>
          <View style={styles.darkSheetHandle} />
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.darkSheetClose}>
            <CloseIcon size={14} color="#fff" />
          </Pressable>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}>
            <Text style={[styles.eyebrow, { color: THEME.accentSoft }]}>
              This week
            </Text>
            <Text style={styles.darkSheetTitle}>
              A long table{'\n'}of candles.
            </Text>

            <View style={styles.bigStatRow}>
              <Text style={styles.bigStatNum}>{total}</Text>
              <Text style={styles.bigStatLabel}>
                {total === 1 ? 'candle lit' : 'candles lit'} for{'\n'}your
                prayers this week
              </Text>
            </View>

            <View style={{ marginTop: 22 }}>
              <BigCandleRow data={week} theme={THEME} />
            </View>

            {topPrayers.length > 0 && (
              <>
                <Text
                  style={[
                    styles.eyebrow,
                    {
                      color: THEME.accentSoft,
                      marginTop: 32,
                      marginBottom: 12,
                    },
                  ]}>
                  Lifted up most
                </Text>
                <View style={{ gap: 10 }}>
                  {topPrayers.map(({ prayer, thisWeek }) => (
                    <Pressable
                      key={prayer.id}
                      onPress={() => onOpenPrayer(prayer)}
                      style={styles.topPrayerCard}>
                      <View style={styles.topPrayerCount}>
                        <Text
                          style={[
                            styles.topPrayerCountNum,
                            { color: THEME.accentSoft },
                          ]}>
                          {thisWeek}
                        </Text>
                        <Text style={styles.topPrayerCountLabel}>
                          {thisWeek === 1 ? 'prayer' : 'prayers'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={styles.topPrayerBody}
                          numberOfLines={3}>
                          &ldquo;{prayer.text}&rdquo;
                        </Text>
                        <Text style={styles.topPrayerMeta}>
                          {prayer.age}
                        </Text>
                      </View>
                      <ArrowIcon
                        size={13}
                        color="rgba(255,255,255,0.5)"
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.darkSheetFooter}>
              Each flame is a stranger pausing for you.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* -------------------- ReachSheet -------------------- */

const PulsingHalo: React.FC<{ color: string }> = ({ color }) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.18, { duration: 2400, easing: Easing.out(Easing.cubic) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(0.15, { duration: 2400, easing: Easing.in(Easing.cubic) }),
      -1,
      true,
    );
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          alignSelf: 'center',
          top: 0,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

const ReachSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  notes: { reflection: Reflection; prayer: MyPrayer }[];
  totalReach: number;
  onOpenPrayer: (p: MyPrayer) => void;
}> = ({ open, onClose, notes, totalReach, onOpenPrayer }) => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { mounted, backdropStyle, sheetStyle } = useSheetAnimation(open);

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
      <View style={styles.darkSheetWrap} pointerEvents="box-none">
        <Animated.View style={[styles.darkSheet, sheetStyle]}>
          <View style={styles.darkSheetHandle} />
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.darkSheetClose}>
            <CloseIcon size={14} color="#fff" />
          </Pressable>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}>
            <Text style={[styles.eyebrow, { color: THEME.accentSoft }]}>
              Reach · live
            </Text>
            <Text style={styles.darkSheetTitle}>Held in the dark.</Text>

            <View style={styles.reachBigRadar}>
              <View
                style={{
                  width: 220,
                  height: 220,
                  alignSelf: 'center',
                  position: 'relative',
                }}>
                <PulsingHalo color={`${THEME.accentSoft}30`} />
                <View style={{ transform: [{ scale: 1.15 }] }}>
                  <ReachRadar
                    accent={THEME.accent}
                    accentSoft={THEME.accentSoft}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.reachPoetic}>
              {totalReach > 0
                ? `In this moment, ${totalReach} ${totalReach === 1 ? 'soul has' : 'souls have'} paused to pray with you.`
                : 'Strangers are gathering. Notes will come.'}
            </Text>

            {notes.length > 0 && (
              <>
                <Text
                  style={[
                    styles.eyebrow,
                    {
                      color: THEME.accentSoft,
                      marginTop: 28,
                      marginBottom: 12,
                    },
                  ]}>
                  Notes from strangers · {notes.length}
                </Text>
                <View style={{ gap: 10 }}>
                  {notes.slice(0, 8).map(({ reflection, prayer }) => (
                    <Pressable
                      key={reflection.id}
                      onPress={() => onOpenPrayer(prayer)}
                      style={styles.reachNoteCard}>
                      <Text style={styles.reachNoteBody}>
                        <Text style={{ color: THEME.accentSoft }}>
                          &ldquo;
                        </Text>
                        {reflection.content}
                        <Text style={{ color: THEME.accentSoft }}>
                          &rdquo;
                        </Text>
                      </Text>
                      <Text style={styles.reachNoteMeta}>
                        Anonymous · {reflection.age} · on &ldquo;
                        {prayer.text.slice(0, 36)}
                        {prayer.text.length > 36 ? '…' : ''}&rdquo;
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* -------------------- AllPrayersSheet -------------------- */

const AllPrayersSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  prayers: MyPrayer[];
  onOpenPrayer: (p: MyPrayer) => void;
}> = ({ open, onClose, prayers, onOpenPrayer }) => {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { mounted, backdropStyle, sheetStyle } = useSheetAnimation(open);

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
      <View style={styles.darkSheetWrap} pointerEvents="box-none">
        <Animated.View style={[styles.lightSheet, sheetStyle]}>
          <View style={styles.lightSheetHandle} />
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={[
              styles.lightSheetClose,
              { backgroundColor: THEME.surface, borderColor: THEME.line },
            ]}>
            <CloseIcon size={14} color={THEME.ink} />
          </Pressable>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}>
            <Text style={[styles.eyebrow, { color: THEME.accent }]}>
              {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'} ·
              all time
            </Text>
            <Text style={styles.lightSheetTitle}>
              Your <Text style={styles.titleItalic}>prayers</Text>
            </Text>
            <View style={[styles.recentList, { marginTop: 18, marginHorizontal: 0 }]}>
              {prayers.map((p, i) => {
                const isAnswered = p.status === 'answered';
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => onOpenPrayer(p)}
                    style={[
                      styles.recentRow,
                      i > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: THEME.line,
                      },
                    ]}>
                    <View
                      style={[
                        styles.recentDot,
                        {
                          backgroundColor: isAnswered
                            ? THEME.accentSoft
                            : THEME.accent,
                          shadowColor: isAnswered
                            ? THEME.accentSoft
                            : 'transparent',
                          shadowOpacity: isAnswered ? 0.55 : 0,
                          shadowRadius: 5,
                        },
                      ]}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.recentRowTitle} numberOfLines={1}>
                        {p.text}
                      </Text>
                      <Text style={styles.recentRowMeta}>
                        {p.prayedCount} {p.prayedCount === 1 ? 'prayer' : 'prayers'} · {p.age} · {p.groupName ?? 'Community'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.recentRowMark,
                        { color: isAnswered ? THEME.accent : THEME.muted },
                      ]}>
                      {isAnswered ? '✦' : '↗'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* -------------------- Styles -------------------- */

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },

  /* Brand row */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 6,
  },
  iconBtnSurface: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  brandSpacer: {
    width: 38,
    height: 38,
  },

  /* Title */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.3,
    color: THEME.ink,
  },
  titleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: FONTS.bodyMed,
    fontSize: 12,
    color: THEME.inkSoft,
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  emptyText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    color: THEME.inkSoft,
    textAlign: 'center',
  },

  /* Carrying card */
  carryingCard: {
    marginHorizontal: 22,
    marginTop: 18,
    backgroundColor: THEME.surface,
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
  },
  carryingHalo: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.28,
  },
  carryingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  carryingTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  eyebrow: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  eyebrowSm: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  carryingBody: {
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: THEME.ink,
  },
  carryingFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  carryingFooterText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14.5,
    color: THEME.inkSoft,
  },

  /* Dark panel */
  darkPanel: {
    marginHorizontal: 22,
    marginTop: 20,
    backgroundColor: THEME.cardDark,
    borderRadius: 26,
    padding: 20,
    overflow: 'hidden',
    shadowColor: THEME.cardDark,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 18,
    elevation: 4,
  },
  darkPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  darkTitle: {
    fontFamily: FONTS.display,
    fontWeight: '500',
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#fff',
  },
  darkPoetic: {
    marginTop: 14,
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: '#fff',
  },
  iconBtnRoundLight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnRoundDarkBordered: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  weekMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
    paddingHorizontal: 2,
  },
  weekMetaMuted: {
    fontFamily: FONTS.bodyMed,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.45)',
  },
  weekMetaSoft: {
    fontFamily: FONTS.bodyMed,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.65)',
  },

  /* Featured pill */
  featuredPill: {
    marginTop: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
  },
  featuredPillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuredPillBody: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 19,
    color: '#fff',
  },
  featuredPillStats: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featuredPillStat: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.60)',
  },
  featuredPillStatNum: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: '#fff',
  },
  featuredPillDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },

  /* Reach */
  reachCaption: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.65)',
  },

  /* Note card */
  noteCardOuter: {
    marginHorizontal: 22,
    marginTop: 16,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  noteCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noteCardBody: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 24,
    color: THEME.ink,
  },
  noteCardMeta: {
    marginTop: 12,
    fontFamily: FONTS.bodyMed,
    fontSize: 11.5,
    color: THEME.muted,
  },

  /* Answered card */
  answeredCard: {
    marginHorizontal: 22,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
  },
  answeredHalo: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.28,
  },
  answeredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  answeredBody: {
    fontFamily: FONTS.display,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: THEME.ink,
  },
  answeredMeta: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.inkSoft,
  },

  /* Recent prayers */
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 22,
    marginTop: 26,
    marginBottom: 10,
  },
  recentTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    letterSpacing: -0.5,
    color: THEME.ink,
  },
  recentAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentAllText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: THEME.muted,
  },
  recentList: {
    marginHorizontal: 22,
    backgroundColor: THEME.surface,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  recentRowTitle: {
    fontFamily: FONTS.bodyMed,
    fontSize: 14.5,
    color: THEME.ink,
    letterSpacing: -0.1,
  },
  recentRowMeta: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: THEME.muted,
  },
  recentRowMark: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
  },

  /* Floating CTA */
  floatingBtn: {
    position: 'absolute',
    right: 22,
    bottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 9999,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  floatingPlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingPlusText: {
    fontFamily: FONTS.bodyMed,
    fontSize: 18,
    lineHeight: 20,
  },
  floatingLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Sheet (preserved) */
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

  /* Dark sheets (Week + Reach) */
  darkSheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  darkSheet: {
    backgroundColor: opaque(THEME.cardDark),
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
  },
  darkSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginBottom: 18,
  },
  darkSheetClose: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  /* Light sheet (All prayers) */
  lightSheet: {
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
  },
  lightSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.line,
    marginBottom: 18,
  },
  lightSheetClose: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lightSheetTitle: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -1,
    color: THEME.ink,
  },
  darkSheetTitle: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -1,
    color: '#fff',
  },
  darkSheetFooter: {
    marginTop: 28,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },

  /* Big stat row (week sheet) */
  bigStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 22,
  },
  bigStatNum: {
    fontFamily: FONTS.display,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -2.5,
    color: '#fff',
  },
  bigStatLabel: {
    flex: 1,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.75)',
  },

  /* Top prayers (week sheet) */
  topPrayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
  },
  topPrayerCount: {
    width: 52,
    alignItems: 'center',
  },
  topPrayerCountNum: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  topPrayerCountLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
  },
  topPrayerBody: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 19,
    color: '#fff',
  },
  topPrayerMeta: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
  },

  /* Reach sheet */
  reachBigRadar: {
    marginTop: 24,
    alignItems: 'center',
    height: 240,
    justifyContent: 'center',
  },
  reachPoetic: {
    marginTop: 8,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
  },
  reachNoteCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
  },
  reachNoteBody: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
  },
  reachNoteMeta: {
    marginTop: 6,
    fontFamily: FONTS.body,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
});
