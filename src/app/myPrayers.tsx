import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Path } from 'react-native-svg';

import { PrimaryButton, Squiggle } from '@/components/saint/Common';
import { ArrowIcon, BackIcon, CloseIcon, GlobeIcon, HeartIcon, LockIcon, PenIcon, PrayingIcon } from '@/components/saint/Icons';
import { PageAmbience } from '@/components/saint/PageAmbience';
import { SafeAreaView } from '@/components/saint/SafeArea';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import {
  fetchPrayerHistory, fetchPrayerStats, MyPrayer, PrayerFilter, PrayerStats, UpdateKind, UpdateVisibility,
} from '@/lib/prayerHistory';
import { supabase } from '@/lib/supabase';

const KIND_LABEL: Record<UpdateKind, string> = {
  progress: 'Progress', answered: 'Answered', setback: 'Setback', note: 'Reflection',
};
const STATUS_LABEL = { active: 'Ongoing', progress: 'Progress', answered: 'Answered', setback: 'Setback' };
const FILTERS: { id: PrayerFilter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'ongoing', label: 'Ongoing' }, { id: 'answered', label: 'Answered' },
];
const monthFormatter = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });
const formatDate = (iso: string) => dateFormatter.format(new Date(iso));
const monthOf = (prayer: MyPrayer) => monthFormatter.format(new Date(prayer.createdAt));
const numberOf = (n: number | undefined) => n === undefined ? '—' : n.toLocaleString();

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7}>
      <Circle cx={10.5} cy={10.5} r={6.5} />
      <Path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </Svg>
  );
}

function PrayerCard({ prayer, onPress }: { prayer: MyPrayer; onPress: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${STATUS_LABEL[prayer.status]} prayer, ${formatDate(prayer.createdAt)}. ${prayer.text}`}
      accessibilityHint="Read this prayer, its notes, and updates" onPress={onPress}
      style={({ pressed }) => [styles.prayerCard, pressed && styles.pressed]}>
      <View style={styles.prayerTop}>
        <Text style={styles.smallText}>{formatDate(prayer.createdAt)}</Text>
        <View style={[styles.statusBadge, prayer.status === 'answered' && styles.answeredBadge]}>
          <Text style={[styles.statusText, prayer.status === 'answered' && { color: theme.pillInk }]}>
            {prayer.status === 'answered' ? '✦ ' : '• '}{STATUS_LABEL[prayer.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.prayerText} numberOfLines={3}>{prayer.text}</Text>
      <View style={styles.prayerFooter}>
        <View style={styles.prayerMeta}>
          <Text style={styles.smallText}>{prayer.prayedCount.toLocaleString()} {prayer.prayedCount === 1 ? 'prayer' : 'prayers'} for you</Text>
          {prayer.reflections.length > 0 ? <Text style={styles.smallText}>· {prayer.reflections.length} {prayer.reflections.length === 1 ? 'note' : 'notes'}</Text> : null}
          {prayer.updates.length > 0 ? <Text style={styles.smallText}>· {prayer.updates.length} {prayer.updates.length === 1 ? 'update' : 'updates'}</Text> : null}
        </View>
        <ArrowIcon size={16} color={theme.accent} />
      </View>
      {prayer.groupName ? <Text style={styles.groupText} numberOfLines={1}>Shared in {prayer.groupName}</Text> : null}
    </Pressable>
  );
}

export default function MyPrayersScreen() {
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { theme, name: themeName } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<PrayerStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [myPrayers, setMyPrayers] = useState<MyPrayer[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<PrayerFilter>('all');
  const [oldestFirst, setOldestFirst] = useState(false);
  const [revision, setRevision] = useState(0);
  const [updateTarget, setUpdateTarget] = useState<MyPrayer | null>(null);
  const historyRequest = useRef(0);
  const moreInFlight = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setStats(null);
    setStatsError(false);
    if (!userId) return;
    fetchPrayerStats(userId).then(next => {
      if (!cancelled) setStats(next);
    }).catch(() => {
      if (!cancelled) setStatsError(true);
    });
    return () => { cancelled = true; };
  // Retrying or saving an update refreshes the counts even while focused.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, revision]));

  useFocusEffect(useCallback(() => {
    const request = ++historyRequest.current;
    setHistoryLoading(true);
    setHistoryError(false);
    setLoadingMore(false);
    moreInFlight.current = false;
    setMyPrayers([]);
    setTotal(null);
    if (!userId) {
      setHistoryLoading(false);
      return;
    }
    fetchPrayerHistory({ userId, search: debouncedSearch, filter, oldestFirst }).then(page => {
      if (historyRequest.current !== request) return;
      setMyPrayers(page.prayers);
      setTotal(page.total);
    }).catch(() => {
      if (historyRequest.current === request) setHistoryError(true);
    }).finally(() => {
      if (historyRequest.current === request) setHistoryLoading(false);
    });
    return () => { historyRequest.current++; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, debouncedSearch, filter, oldestFirst, revision]));

  const loadMore = async () => {
    if (!userId || moreInFlight.current || historyLoading || total === null || myPrayers.length >= total) return;
    const request = historyRequest.current;
    moreInFlight.current = true;
    setLoadingMore(true);
    setHistoryError(false);
    try {
      const page = await fetchPrayerHistory({ userId, search: debouncedSearch, filter, oldestFirst, offset: myPrayers.length });
      if (historyRequest.current !== request) return;
      setMyPrayers(current => {
        const seen = new Set(current.map(p => p.id));
        return [...current, ...page.prayers.filter(p => !seen.has(p.id))];
      });
      setTotal(page.total);
    } catch {
      if (historyRequest.current === request) setHistoryError(true);
    } finally {
      if (historyRequest.current === request) {
        moreInFlight.current = false;
        setLoadingMore(false);
      }
    }
  };

  const resetFilters = () => { setSearch(''); setDebouncedSearch(''); setFilter('all'); };
  const emptyHistory = !debouncedSearch && filter === 'all';

  if (!fontsLoaded) return <View style={styles.safe} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <PageAmbience name={themeName} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Me" onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <BackIcon size={18} color={theme.ink} />
        </Pressable>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Saint <Text style={{ color: theme.accent }}>Central</Text></Text>
          <Squiggle color={theme.accent} w={118} waves={9} />
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList data={myPrayers} keyExtractor={p => p.id}
        style={styles.list} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <View style={styles.pageHeading}>
              <Text accessibilityRole="header" style={styles.title}>Your prayer calendar</Text>
              <Text style={styles.subtitle}>The care you give. The prayers you carry.</Text>
            </View>

            <View style={styles.offeredCard}>
              <View style={styles.offeredTop}>
                <View style={styles.heroIcon}><PrayingIcon size={22} color={theme.accent} /></View>
                <Text style={styles.eyebrow}>A little good, added up</Text>
                <Text style={styles.allTime}>ALL TIME</Text>
              </View>
              <View style={styles.offeredValueRow}>
                <Text style={styles.offeredValue}>{numberOf(stats?.offered)}</Text>
                <Text style={styles.offeredLabel}>times you’ve prayed{ '\n' }for others</Text>
              </View>
              <View style={styles.offeredBottom}>
                <Text style={styles.weekText}>{stats ? `${stats.offeredThisWeek.toLocaleString()} in the last 7 days` : 'Your prayers make a difference.'}</Text>
                <HeartIcon size={16} color={theme.accent} />
              </View>
            </View>

            {statsError ? (
              <View style={styles.inlineNotice} accessibilityLiveRegion="polite">
                <Text style={styles.smallText}>Your stats couldn’t load.</Text>
                <Pressable accessibilityRole="button" onPress={() => setRevision(r => r + 1)} style={styles.textButton}>
                  <Text style={styles.linkText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <PenIcon size={17} color={theme.accent} />
                  <View style={styles.statCopy}>
                    <Text style={styles.statValue}>{numberOf(stats?.shared)}</Text>
                    <Text style={styles.statLabel}>Prayers shared</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <PrayingIcon size={19} color={theme.accent} />
                  <View style={styles.statCopy}>
                    <Text style={styles.statValue}>{numberOf(stats?.prayersReceived)}</Text>
                    <Text style={styles.statLabel}>Prayers for you</Text>
                  </View>
                </View>
              </View>
              <View style={styles.notesSummary}>
                <Text style={styles.notesText}><Text style={styles.notesCount}>{numberOf(stats?.notesSent)}</Text> notes sent</Text>
                <Text style={styles.smallText}>·</Text>
                <Text style={styles.notesText}><Text style={styles.notesCount}>{numberOf(stats?.notesReceived)}</Text> notes received</Text>
              </View>
            </View>

            <View style={styles.historyHeading}>
              <View style={styles.historyTitleBlock}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>Your prayers</Text>
                <Text style={styles.smallText}>Come back to any chapter.</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => router.push('/prayerRequest')}
                style={({ pressed }) => [styles.newPrayer, pressed && styles.pressed]}>
                <Text style={styles.newPrayerText}>+ New prayer</Text>
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <SearchIcon color={theme.inkSoft} />
              <TextInput accessibilityLabel="Search your prayer history" value={search} onChangeText={setSearch}
                placeholder="Find an old prayer…" placeholderTextColor={theme.inkSoft} returnKeyType="search"
                autoCorrect={false} style={styles.searchInput} />
              {search ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={styles.clearSearch}>
                  <CloseIcon size={15} color={theme.inkSoft} />
                </Pressable>
              ) : null}
            </View>
            <View accessibilityRole="tablist" style={styles.filters}>
              {FILTERS.map(f => (
                <Pressable key={f.id} accessibilityRole="tab" accessibilityState={{ selected: filter === f.id }}
                  onPress={() => setFilter(f.id)} style={[styles.filter, filter === f.id && styles.filterActive]}>
                  <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}{stats ? ` · ${numberOf(f.id === 'all' ? stats.shared : f.id === 'answered' ? stats.answered : stats.shared - stats.answered)}` : ''}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.resultsRow}>
              <Text accessibilityLiveRegion="polite" style={styles.smallText}>
                {historyLoading ? 'Finding your prayers…' : total === null ? 'Your prayer history' : `${total.toLocaleString()} ${total === 1 ? 'prayer' : 'prayers'}${debouncedSearch ? ' found' : ''}`}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Sort by ${oldestFirst ? 'newest' : 'oldest'} first`}
                onPress={() => setOldestFirst(value => !value)} style={styles.sortButton}>
                <Text style={styles.sortText}>{oldestFirst ? 'Oldest first ↑' : 'Newest first ↓'}</Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <>
            {index === 0 || monthOf(item) !== monthOf(myPrayers[index - 1]) ? (
              <View style={styles.monthHeading}>
                <Text accessibilityRole="header" style={styles.monthText}>{monthOf(item)}</Text>
                <View style={styles.monthLine} />
              </View>
            ) : null}
            <PrayerCard prayer={item} onPress={() => setUpdateTarget(item)} />
          </>
        )}
        ListEmptyComponent={historyLoading ? (
          <View style={styles.emptyCard}><ActivityIndicator color={theme.accent} accessibilityLabel="Loading prayer history" /></View>
        ) : historyError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn’t load your prayers</Text>
            <Text style={styles.emptyText}>Try again to pick up where you left off.</Text>
            <PrimaryButton label="Try again" onPress={() => setRevision(r => r + 1)} />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <PrayingIcon size={32} color={theme.accent} />
            <Text style={styles.emptyTitle}>{emptyHistory ? 'A place for your prayers' : 'No prayers found'}</Text>
            <Text style={styles.emptyText}>{emptyHistory ? 'When you share a prayer, you can return to it here. Your notes and updates will stay with it.' : debouncedSearch ? 'Try a different word or clear your filters.' : filter === 'answered' ? 'Prayers you mark as answered will appear here.' : 'You don’t have any ongoing prayers right now.'}</Text>
            <PrimaryButton label={emptyHistory ? 'Share your first prayer' : 'See all prayers'}
              onPress={emptyHistory ? () => router.push('/prayerRequest') : resetFilters} />
          </View>
        )}
        ListFooterComponent={myPrayers.length > 0 ? (
          <View style={styles.listFooter}>
            {historyError ? <Text accessibilityLiveRegion="polite" style={styles.emptyText}>More prayers couldn’t load. Give it another try.</Text> : null}
            {total !== null && myPrayers.length < total ? (
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: loadingMore }} disabled={loadingMore}
                onPress={loadMore} style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}>
                {loadingMore ? <ActivityIndicator color={theme.accent} /> : <Text style={styles.linkText}>{historyError ? 'Try again' : 'Load more prayers'}</Text>}
              </Pressable>
            ) : (
              <Text style={styles.endText}>You’re all caught up with this chapter.</Text>
            )}
          </View>
        ) : undefined}
      />
      <ReflectSheet prayer={updateTarget} onClose={() => setUpdateTarget(null)} onSubmitted={() => {
        setUpdateTarget(null);
        setRevision(r => r + 1);
      }} />
    </SafeAreaView>
  );
}
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
  const [editing, setEditing] = useState(false);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [displayPrayer, setDisplayPrayer] = useState(prayer);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const timeline = useMemo(() => displayPrayer ? [
    ...displayPrayer.reflections.map(r => ({ id: `note-${r.id}`, label: 'A note of encouragement', content: r.content, createdAt: r.createdAt, private: false })),
    ...displayPrayer.updates.map(u => ({ id: `update-${u.id}`, label: KIND_LABEL[u.kind], content: u.note, createdAt: u.createdAt, private: u.visibility === 'private' })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], [displayPrayer]);

  const slide = useSharedValue(SCREEN_HEIGHT);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (prayer) {
      const frame = requestAnimationFrame(() => {
      setDisplayPrayer(prayer);
      setEditing(false);
      setBusy(false);
      setKind('progress');
      setVisibility('public');
      setNote('');
      setError(null);
      setMounted(true);
      slide.set(SCREEN_HEIGHT);
      fade.set(0);
      fade.set(withTiming(1, { duration: reducedMotion ? 0 : 180, easing: Easing.out(Easing.quad) }));
      slide.set(withTiming(0, {
        duration: reducedMotion ? 0 : 320,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }));
      });
      return () => cancelAnimationFrame(frame);
    } else {
      fade.set(withTiming(0, { duration: reducedMotion ? 0 : 160, easing: Easing.in(Easing.quad) }));
      slide.set(withTiming(
        SCREEN_HEIGHT,
        { duration: reducedMotion ? 0 : 240, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      ));
    }
  }, [prayer, slide, fade, reducedMotion]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.get() }],
  }));

  const canSubmit = note.trim().length > 0 && !busy;

  const onSubmit = async () => {
    if (!prayer || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
    const { data, error: e } = await supabase.functions.invoke('submit-prayer-update', {
      body: {
        prayer_id: prayer.id,
        kind,
        note: note.trim(),
        visibility,
      },
    });
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
    } catch {
      setError('Your update couldn’t be saved. Please try again.');
    } finally {
      setBusy(false);
    }
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
        <Animated.View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }, sheetStyle]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeading}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>{editing ? 'Add an update' : 'Your prayer'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close prayer" onPress={onClose} style={styles.sheetClose}>
              <CloseIcon size={18} color={THEME.ink} />
            </Pressable>
          </View>
          <ScrollView
            ref={scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}>
            {displayPrayer ? (
              <>
                <View style={styles.detailMeta}>
                  <Text style={styles.smallText}>{formatDate(displayPrayer.createdAt)}</Text>
                  <View style={styles.statusBadge}><Text style={styles.statusText}>{STATUS_LABEL[displayPrayer.status]}</Text></View>
                </View>
                <View style={styles.detailPrayer}>
                  <Text selectable style={styles.detailBody}>{displayPrayer.text}</Text>
                  <Text style={styles.smallText}>{displayPrayer.prayedCount.toLocaleString()} {displayPrayer.prayedCount === 1 ? 'prayer' : 'prayers'} for you · {displayPrayer.groupName ?? 'Community'}</Text>
                </View>
              </>
            ) : null}

            {editing ? <>
            <Text style={styles.sheetLabel}>Where it is</Text>
            <View style={styles.kindRow}>
              {(['progress', 'answered', 'setback', 'note'] as UpdateKind[]).map(k => {
                const active = kind === k;
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setKind(k)}
                    style={[
                      styles.kindChip,
                      {
                        backgroundColor: active ? THEME.pillBg : THEME.surface,
                        borderColor: active ? THEME.pillInk : THEME.line,
                      },
                    ]}>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMed,
                        fontSize: 13,
                        color: active ? THEME.pillInk : THEME.inkSoft,
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
                accessibilityLabel="Your prayer update"
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
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
            </> : <>
              <Text accessibilityRole="header" style={styles.timelineHeading}>Notes & updates</Text>
              {timeline.length ? timeline.map(entry => (
                <View key={entry.id} style={styles.timelineEntry}>
                  <View style={styles.timelineTop}>
                    <Text style={styles.timelineLabel}>{entry.label}</Text>
                    <Text style={styles.smallText}>{formatDate(entry.createdAt)}</Text>
                  </View>
                  <Text selectable style={styles.timelineBody}>{entry.content}</Text>
                  {entry.private ? <View style={styles.timelinePrivate}><LockIcon size={12} color={THEME.inkSoft} /><Text style={styles.smallText}>Only you</Text></View> : null}
                </View>
              )) : <Text style={styles.timelineBody}>No notes or updates yet. You can add what’s changed, or simply leave a reflection for yourself.</Text>}
            </>}
          </ScrollView>

          <View style={styles.sheetActions}>
            {editing ? <>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => { setEditing(false); setError(null); }}
              style={({ pressed }) => [
                styles.sheetCancel,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={styles.sheetCancelText}>Back</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={busy ? 'Saving…' : 'Save update'}
                disabled={!canSubmit}
                onPress={onSubmit}
              />
            </View>
            </> : <View style={{ flex: 1 }}>
              <PrimaryButton label="Add an update" onPress={() => { setEditing(true); scroll.current?.scrollTo({ y: 0, animated: false }); }} />
            </View>}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  pressed: { opacity: 0.65 },
  header: { width: '100%', maxWidth: 500, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.bgSoft, alignItems: 'center', justifyContent: 'center' },
  brandBlock: { flex: 1, alignItems: 'center' },
  brand: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 30, color: theme.ink },
  headerSpacer: { width: 44 },
  list: { flex: 1 },
  page: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: 22 },
  pageHeading: { paddingTop: 14, paddingBottom: 22, gap: 6 },
  title: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 38, color: theme.ink },
  subtitle: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 20, color: theme.inkSoft },
  offeredCard: { borderRadius: 26, padding: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
  offeredTop: { flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' },
  heroIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.pillBg, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 11, lineHeight: 16, color: theme.inkSoft },
  allTime: { fontFamily: FONTS.bodySemi, fontSize: 9, lineHeight: 14, letterSpacing: 1, color: theme.inkSoft },
  offeredValueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 10, marginBottom: 14 },
  offeredValue: { fontFamily: FONTS.display, fontSize: 58, lineHeight: 70, color: theme.accent, fontVariant: ['lining-nums', 'tabular-nums'], flexShrink: 1 },
  offeredLabel: { fontFamily: FONTS.bodySemi, fontSize: 15, lineHeight: 22, color: theme.ink, flexShrink: 1 },
  offeredBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  weekText: { flex: 1, fontFamily: FONTS.bodyMed, fontSize: 12, lineHeight: 18, color: theme.inkSoft },
  statsCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 22, marginTop: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 17, alignItems: 'center', gap: 14 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, minWidth: 0 },
  statCopy: { flexShrink: 1, minWidth: 0 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: theme.line },
  statValue: { fontFamily: FONTS.display, fontSize: 27, lineHeight: 34, color: theme.ink, fontVariant: ['lining-nums', 'tabular-nums'] },
  statLabel: { fontFamily: FONTS.bodyMed, fontSize: 11, lineHeight: 17, color: theme.inkSoft },
  notesSummary: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  notesText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 18, color: theme.inkSoft },
  notesCount: { fontFamily: FONTS.bodySemi, color: theme.ink },
  inlineNotice: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  linkText: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 20, color: theme.accent },
  historyHeading: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 18 },
  historyTitleBlock: { flexGrow: 1, gap: 3 },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 26, lineHeight: 34, color: theme.ink },
  newPrayer: { minHeight: 44, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.bgSoft, justifyContent: 'center' },
  newPrayerText: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 20, color: theme.ink },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.line, borderRadius: 17, backgroundColor: theme.surface, paddingLeft: 15, paddingRight: 4, minHeight: 50 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 14, fontFamily: FONTS.body, fontSize: 13, lineHeight: 20, color: theme.ink },
  clearSearch: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', padding: 4, borderRadius: 17, marginTop: 12, backgroundColor: theme.bgSoft, gap: 4 },
  filter: { flex: 1, minHeight: 44, paddingHorizontal: 4, paddingVertical: 12, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  filterActive: { backgroundColor: theme.surface, borderColor: theme.line },
  filterText: { fontFamily: FONTS.bodyMed, fontSize: 12, lineHeight: 18, color: theme.inkSoft, textAlign: 'center' },
  filterTextActive: { fontFamily: FONTS.bodySemi, color: theme.ink },
  resultsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  smallText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 18, color: theme.inkSoft },
  sortButton: { minHeight: 44, justifyContent: 'center', paddingLeft: 6 },
  sortText: { fontFamily: FONTS.bodySemi, fontSize: 11, lineHeight: 18, color: theme.inkSoft },
  monthHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 14 },
  monthText: { fontFamily: FONTS.bodySemi, fontSize: 11, lineHeight: 18, color: theme.inkSoft },
  monthLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.line },
  prayerCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 22, padding: 18, marginBottom: 12 },
  prayerTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusBadge: { borderRadius: 9, backgroundColor: theme.bgSoft, paddingHorizontal: 9, paddingVertical: 4 },
  answeredBadge: { backgroundColor: theme.pillBg },
  statusText: { fontFamily: FONTS.bodySemi, fontSize: 10, lineHeight: 15, color: theme.inkSoft },
  prayerText: { fontFamily: FONTS.display, fontSize: 20, lineHeight: 28, color: theme.ink, marginTop: 12 },
  prayerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  prayerMeta: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  groupText: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 16, color: theme.inkSoft, marginTop: 6 },
  emptyCard: { padding: 24, gap: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.line, borderRadius: 22, backgroundColor: theme.surface, marginTop: 10 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 30, textAlign: 'center', color: theme.ink },
  emptyText: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 21, textAlign: 'center', color: theme.inkSoft },
  listFooter: { paddingTop: 10, paddingBottom: 10, gap: 12 },
  loadMore: { minHeight: 50, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.surface },
  endText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 18, textAlign: 'center', color: theme.inkSoft, paddingVertical: 10 },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10, maxHeight: '92%', width: '100%', maxWidth: 500, alignSelf: 'center' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.line, marginBottom: 16 },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  sheetTitle: { fontFamily: FONTS.display, fontSize: 28, lineHeight: 36, color: theme.ink },
  sheetClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.bgSoft, alignItems: 'center', justifyContent: 'center' },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 },
  detailPrayer: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 20, padding: 18, gap: 14 },
  detailBody: { fontFamily: FONTS.display, fontSize: 23, lineHeight: 32, color: theme.ink },
  timelineHeading: { fontFamily: FONTS.display, fontSize: 23, lineHeight: 30, color: theme.ink, marginTop: 24, marginBottom: 12 },
  timelineEntry: { borderLeftWidth: 2, borderLeftColor: theme.line, paddingLeft: 16, paddingVertical: 4, marginBottom: 16, gap: 6 },
  timelineTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  timelineLabel: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 18, color: theme.ink },
  timelineBody: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 23, color: theme.inkSoft },
  timelinePrivate: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sheetLabel: { fontFamily: FONTS.bodySemi, fontSize: 11, lineHeight: 18, color: theme.inkSoft, marginTop: 18, marginBottom: 9 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  sheetTextareaCard: { backgroundColor: theme.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: theme.line },
  sheetTextarea: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 22, color: theme.ink, minHeight: 100, textAlignVertical: 'top' },
  sheetCount: { fontFamily: FONTS.body, fontSize: 11, color: theme.inkSoft, textAlign: 'right', marginTop: 6 },
  visRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  visChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, minHeight: 44 },
  sheetError: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 20, color: theme.accent, marginTop: 12 },
  sheetActions: { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, marginTop: 12 },
  sheetCancel: { minHeight: 50, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, justifyContent: 'center' },
  sheetCancelText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.inkSoft },
});
