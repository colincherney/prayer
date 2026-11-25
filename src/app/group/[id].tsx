import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EASE_OUT, enterFade, enterUp } from '@/components/saint/motion';

import { SafeAreaView } from '@/components/saint/SafeArea';
import { GroupPrayerNotifications } from '@/components/saint/GroupPrayerNotifications';

import { Hearth, HearthMember, HEARTH_SEATS } from '@/components/pets/Hearth';
import { isPetId } from '@/components/pets/registry';
import { PrimaryButton } from '@/components/saint/Common';
import { PrayerCandle, PressScale, SlidingSegments } from '@/components/saint/GroupKit';
import {
  BackIcon,
  CheckIcon,
  FlameIcon,
  HeartIcon,
  LockIcon,
  PenIcon,
  PrayingIcon,
  UsersIcon,
} from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { refreshPrayerStreakActivity } from '@/lib/prayerStreakActivity';
import { refreshPrayerStreakWidget } from '@/lib/prayerStreakWidget';
import { usePetProgress } from '@/lib/pet';
import { LOCAL_KEYS, readForUser, writeForUser } from '@/lib/localCache';
import { supabase } from '@/lib/supabase';
import { refreshAllEvents } from '@/lib/winterEvent';

type GroupInfo = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  invite_code: string | null;
  memberCount: number;
  myRole: 'owner' | 'member' | null;
};

type GroupPrayer = {
  id: string;
  text: string;
  category: string;
  mine: boolean;
  prayedCount: number;
  prayedByMe: boolean;
};

/** What a group page last showed, saved on the phone so reopening it draws instantly. */
type SavedGroupPage = { group: GroupInfo; prayers: GroupPrayer[]; others: HearthMember[]; decor: string[]; at: number };
type SavedGroupPages = Record<string, SavedGroupPage>;
const SAVED_GROUPS_MAX = 12;

function saveGroupPage(userId: string, id: string, page: Omit<SavedGroupPage, 'at'> | null) {
  const all = { ...(readForUser<SavedGroupPages>(LOCAL_KEYS.groupPages, userId) ?? {}) };
  if (page) all[id] = { ...page, at: Date.now() };
  else delete all[id];
  // Keep only the most recently opened groups.
  const kept = Object.entries(all)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, SAVED_GROUPS_MAX);
  writeForUser(LOCAL_KEYS.groupPages, userId, Object.fromEntries(kept));
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [saved] = useState(() =>
    id ? readForUser<SavedGroupPages>(LOCAL_KEYS.groupPages, session?.user.id)?.[id] : undefined,
  );
  const [group, setGroup] = useState<GroupInfo | null>(saved?.group ?? null);
  const [prayers, setPrayers] = useState<GroupPrayer[]>(saved?.prayers ?? []);
  const [loading, setLoading] = useState(!saved);
  const [error, setError] = useState<string | null>(null);

  // The hearth: everyone else's companions (no names), the group's decor, and the flare when someone shares.
  const { width: screenW } = useWindowDimensions();
  const { petId: myPetId, progress: myProgress } = usePetProgress();
  const [others, setOthers] = useState<HearthMember[]>(saved?.others ?? []);
  const [decor, setDecor] = useState<string[]>(saved?.decor ?? []);
  const [flare, setFlare] = useState(0);
  // When a page was last opened from here, so a fast double tap doesn't stack the same page twice.
  const lastOpen = useRef(0);
  const praying = useRef(new Set<string>());

  // Anonymous encouragement notes — one open composer at a time.
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteSending, setNoteSending] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [notesSent, setNotesSent] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'circle' | 'yours'>('circle');
  // How many of your prayers were here when you went to share; on return, a new one flares the fire.
  const flareAfterShare = useRef<number | null>(null);
  const [joiningHere, setJoiningHere] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session || !id) return;
    const me = session.user.id;

    const [groupRes, membersRes, prayersRes, nookRes] = await Promise.all([
      supabase
        .from('groups')
        .select('id, name, description, is_public, invite_code')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('group_members').select('user_id, role, pet_id, pet_stage').eq('group_id', id),
      supabase
        .from('prayers')
        .select('id, body, category, created_at, user_id, prayer_interactions(action, user_id)')
        .eq('group_id', id)
        .eq('approved', 'y')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('group_nooks').select('decor').eq('group_id', id).maybeSingle(),
    ]);

    if (groupRes.error || !groupRes.data) {
      // A network hiccup keeps the saved page on screen; a group that's gone (or private) clears it.
      if (!groupRes.error) {
        saveGroupPage(me, id, null);
        setGroup(null);
      }
      setError(groupRes.error?.message ?? 'This group is private or no longer exists.');
      setLoading(false);
      return;
    }

    const savedDecor = (nookRes.data?.decor as unknown) ?? [];
    const nextDecor = Array.isArray(savedDecor) ? savedDecor.filter((d): d is string => typeof d === 'string') : [];
    setDecor(nextDecor);

    // A failed members request keeps who's here as it was, rather than showing a member as an outsider of an empty group.
    const members = membersRes.data ?? [];
    const nextOthers: HearthMember[] = members
      .filter(m => m.user_id !== me)
      .map(m => ({
        petId: isPetId(m.pet_id) ? m.pet_id : 'lamb',
        stage: ([1, 2, 3].includes(m.pet_stage as number) ? m.pet_stage : 1) as HearthMember['stage'],
      }));
    if (!membersRes.error) setOthers(nextOthers);
    const myMembership = members.find(m => m.user_id === me);

    const fresh: GroupInfo = {
      id: groupRes.data.id,
      name: groupRes.data.name,
      description: groupRes.data.description,
      is_public: groupRes.data.is_public,
      invite_code: groupRes.data.invite_code,
      memberCount: members.length,
      myRole: (myMembership?.role as 'owner' | 'member' | undefined) ?? null,
    };
    setGroup(prev =>
      membersRes.error
        ? { ...fresh, memberCount: prev?.memberCount ?? 0, myRole: prev?.myRole ?? null }
        : fresh,
    );

    // A failed prayers request keeps the list on screen instead of claiming the circle is empty.
    if (prayersRes.error) {
      setError(null);
      setLoading(false);
      return;
    }

    const nextPrayers: GroupPrayer[] = (prayersRes.data ?? []).map(p => {
      const interactions =
        (p.prayer_interactions as { action: string; user_id: string }[] | null) ?? [];
      const prayed = interactions.filter(i => i.action === 'prayed');
      return {
        id: p.id as string,
        text: (p.body as string) ?? '',
        category: (p.category as string | null) ?? 'Other',
        mine: p.user_id === me,
        prayedCount: prayed.length,
        prayedByMe: prayed.some(i => i.user_id === me),
      };
    });
    setPrayers(nextPrayers);
    setError(null);
    setLoading(false);

    // Back from sharing: if a new prayer of yours landed, the fire flares and Yours shows it.
    if (flareAfterShare.current !== null) {
      const mineNow = nextPrayers.filter(p => p.mine).length;
      if (mineNow > flareAfterShare.current) {
        setFlare(f => f + 1);
        setTab('yours');
      }
      flareAfterShare.current = null;
    }

    if (!membersRes.error) {
      saveGroupPage(me, id, { group: fresh, prayers: nextPrayers, others: nextOthers, decor: nextDecor });
    }
  }, [session, id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!cancelled) await load();
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const isMember = !!group?.myRole;
  const groupId = group?.id;
  useEffect(() => {
    if (!groupId || !isMember) return;
    supabase
      .rpc('set_my_group_pet', { p_group: groupId, p_pet: myPetId, p_stage: myProgress.stage })
      .then(({ error: e }) => {
        if (e) console.warn('Could not share pet with the group', e.message);
      });
  }, [groupId, isMember, myPetId, myProgress.stage]);

  const hearthMembers = useMemo<HearthMember[]>(
    () => (isMember ? [{ petId: myPetId, stage: myProgress.stage }, ...others] : others),
    [isMember, myPetId, myProgress.stage, others],
  );

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const openOnce = (open: () => void) => {
    const now = Date.now();
    if (now - lastOpen.current < 1000) return;
    lastOpen.current = now;
    open();
  };

  const openNook = () => {
    if (group?.myRole) openOnce(() => router.push({ pathname: '/groupNook', params: { id: group.id } }));
  };

  const onShareToGroup = () => {
    if (!group) return;
    openOnce(() => {
      flareAfterShare.current = prayers.filter(p => p.mine).length;
      router.push({ pathname: '/prayerRequest', params: { groupId: group.id, groupName: group.name } });
    });
  };

  const onPray = async (prayer: GroupPrayer) => {
    // praying.current: two taps in the same frame can't record the same prayer twice
    if (!session || prayer.prayedByMe || prayer.mine || praying.current.has(prayer.id)) return;
    praying.current.add(prayer.id);
    // Optimistic
    setPrayers(prev =>
      prev.map(p =>
        p.id === prayer.id
          ? { ...p, prayedByMe: true, prayedCount: p.prayedCount + 1 }
          : p,
      ),
    );
    const { error: e } = await supabase.from('prayer_interactions').insert({
      prayer_id: prayer.id,
      user_id: session.user.id,
      action: 'prayed',
    });
    if (!e) {
      refreshPrayerStreakActivity(session.user.id);
      refreshPrayerStreakWidget(session.user.id);
      refreshAllEvents(true).catch(() => {});
    }
    if (e) {
      praying.current.delete(prayer.id);
      setPrayers(prev =>
        prev.map(p =>
          p.id === prayer.id
            ? { ...p, prayedByMe: false, prayedCount: Math.max(0, p.prayedCount - 1) }
            : p,
        ),
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Someone opened a public circle they aren't in yet: join right here.
  const onJoinHere = async () => {
    if (!group || joiningHere) return;
    setJoiningHere(true);
    setJoinError(null);
    const { error: e } = await supabase.rpc('join_group', { p_group_id: group.id });
    if (e) {
      setJoinError('Couldn’t join this circle. Check your connection and try again.');
      setJoiningHere(false);
      return;
    }
    await load();
    setJoiningHere(false);
  };

  const onShareCode = () => {
    if (!group?.invite_code) return;
    Share.share({
      message: `Join our prayer circle "${group.name}" on Saint Central — use code ${group.invite_code}. Everyone stays anonymous.`,
    }).catch(() => {});
  };

  const onLeave = () => {
    if (!group || !session) return;
    Alert.alert('Leave this group?', 'You can rejoin any time with the code.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          const { error: e } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', group.id)
            .eq('user_id', session.user.id);
          if (!e) router.back();
        },
      },
    ]);
  };

  const onOpenNote = (prayerId: string) => {
    setNoteFor(prayerId);
    setNote('');
    setNoteError(null);
  };

  const onSendNote = async (prayer: GroupPrayer) => {
    if (!session || !note.trim() || noteSending) return;
    Keyboard.dismiss();
    setNoteSending(true);
    setNoteError(null);
    const content = note.trim();
    const { data, error: e } = await supabase.functions.invoke('submit-reflection', {
      body: { prayer_id: prayer.id, content },
    });
    setNoteSending(false);
    if (e) {
      setNoteError(e.message);
      return;
    }
    if (data?.ok === false) {
      setNoteError(
        data.reason === 'moderation_blocked'
          ? 'Couldn’t send — try rewording your note.'
          : 'Couldn’t send. Try again.',
      );
      return;
    }
    setNote('');
    setNoteFor(null);
    setNotesSent(prev => {
      const next = new Set(prev);
      next.add(prayer.id);
      return next;
    });
  };

  const onDeletePrayer = (prayer: GroupPrayer) => {
    if (!session || !prayer.mine) return;
    Alert.alert(
      'Remove this prayer?',
      'It will disappear from the group for everyone. This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error: e } = await supabase
              .from('prayers')
              .delete()
              .eq('id', prayer.id)
              .eq('user_id', session.user.id);
            if (e) {
              Alert.alert('Something went wrong', 'Could not remove the prayer — please try again.');
              return;
            }
            setPrayers(prev => prev.filter(p => p.id !== prayer.id));
          },
        },
      ],
    );
  };

  const onDeleteGroup = () => {
    if (!group || !session || group.myRole !== 'owner') return;
    Alert.alert(
      'Delete this group?',
      'Every prayer shared here will be deleted and all members removed. This cannot be undone.',
      [
        { text: 'Keep the group', style: 'cancel' },
        {
          text: 'Delete group',
          style: 'destructive',
          onPress: async () => {
            const { data, error: e } = await supabase
              .from('groups')
              .delete()
              .eq('id', group.id)
              .select('id');
            if (e || !data?.length) {
              Alert.alert('Something went wrong', 'Could not delete the group — please try again.');
              return;
            }
            router.back();
          },
        },
      ],
    );
  };

  // Circle = everyone else's requests to pray for; Yours = what you shared and who prayed.
  const circlePrayers = prayers.filter(p => !p.mine);
  const myPrayers = prayers.filter(p => p.mine);
  // What each of your requests showed last time you opened this group, so new prayers stand out.
  const seenCounts = new Map((saved?.prayers ?? []).map(p => [p.id, p.prayedCount]));
  const newPrayersFor = (p: GroupPrayer) => {
    const before = seenCounts.get(p.id);
    return before === undefined ? 0 : Math.max(0, p.prayedCount - before);
  };
  const yoursHasNew = myPrayers.some(p => newPrayersFor(p) > 0);
  const hearthW = screenW - 32;
  // Text on accent buttons: the dark themes' accent is a light tan, so it takes the dark ground.
  const onAccent = THEME.isDark ? THEME.bg : THEME.accentInk;

  // Cards rise in, a beat apart, whenever a list first shows (and again on switching tabs).
  const enter = enterUp;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={THEME.isDark ? 'light-content' : 'dark-content'} />
      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={THEME.accent} />
        </View>
      ) : !group ? (
        <View style={styles.centerFill}>
          <Text style={styles.emptyTitle}>Couldn&apos;t open this group</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <PrimaryButton
            label="Go back"
            onPress={() => router.back()}
            style={{ marginTop: 24, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accent} />
          }>
          {/* Top bar: back, and Invite for members */}
          <View style={styles.topBar}>
            <PressScale
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              haptic={null}
              style={styles.roundBtn}>
              <BackIcon size={16} color={THEME.ink} />
            </PressScale>
            {group.myRole && group.invite_code ? (
              <PressScale
                onPress={onShareCode}
                accessibilityRole="button"
                accessibilityLabel="Invite someone with the group code"
                style={styles.inviteBtn}>
                <UsersIcon size={15} color={THEME.ink} />
                <Text style={styles.inviteText}>Invite</Text>
              </PressScale>
            ) : null}
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>{group.name}</Text>
            <View style={styles.metaLine}>
              {group.is_public ? (
                <FlameIcon size={13} color={THEME.muted} />
              ) : (
                <LockIcon size={12} color={THEME.muted} />
              )}
              <Text style={styles.metaText}>
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                {' · '}
                {group.is_public ? 'Public' : 'Private'}
                {' · '}
                Anonymous
              </Text>
            </View>
            {group.description ? <Text style={styles.description}>{group.description}</Text> : null}
          </View>

          {/* The hearth: every member's companion rests here. Double-tap to decorate. */}
          <View style={styles.hearthWrap}>
            <View style={styles.hearthShadow}>
              <Hearth
                width={hearthW}
                members={hearthMembers}
                decor={decor}
                flare={flare}
                onDoubleTap={group.myRole ? openNook : undefined}
              />
            </View>
            <Text style={styles.hearthNote}>
              {hearthMembers.length} {hearthMembers.length === 1 ? 'companion' : 'companions'} by the fire
              {hearthMembers.length > HEARTH_SEATS ? ` (${HEARTH_SEATS} fit at once)` : ''}
              {group.myRole ? ' · double-tap to decorate' : ''}
            </Text>
          </View>

          <View style={styles.body}>
            {group.myRole ? (
              <PressScale onPress={onShareToGroup} accessibilityRole="button" style={styles.shareBtn}>
                <PenIcon size={18} color={onAccent} />
                <Text style={styles.shareText}>Share a prayer with this circle</Text>
              </PressScale>
            ) : group.is_public ? (
              <>
                <PressScale
                  onPress={onJoinHere}
                  disabled={joiningHere}
                  accessibilityRole="button"
                  style={styles.shareBtn}>
                  {joiningHere ? (
                    <ActivityIndicator size="small" color={onAccent} />
                  ) : (
                    <>
                      <UsersIcon size={18} color={onAccent} />
                      <Text style={styles.shareText}>Join this circle</Text>
                    </>
                  )}
                </PressScale>
                <Text style={styles.notMember}>
                  Then share prayers here and rest your companion by the fire. Still no names.
                </Text>
                {joinError ? <Text style={styles.joinErrorText}>{joinError}</Text> : null}
              </>
            ) : null}

            <SlidingSegments
              theme={THEME}
              value={tab}
              onChange={setTab}
              style={styles.segment}
              segments={[
                { key: 'circle', label: 'Circle', count: circlePrayers.length },
                { key: 'yours', label: 'Yours', count: myPrayers.length, dot: yoursHasNew },
              ]}
            />

            {tab === 'circle' ? (
              circlePrayers.length === 0 ? (
                <Animated.View key="circle-empty" entering={enterFade(260)} style={styles.emptyBox}>
                  <PrayingIcon size={26} color={THEME.muted} />
                  <Text style={styles.emptyBoxTitle}>Quiet by the fire</Text>
                  <Text style={styles.emptyBoxText}>
                    No one else has shared here yet. Share what weighs on your heart, or invite
                    someone with the code. No one will know it&apos;s you.
                  </Text>
                </Animated.View>
              ) : (
                <View key="circle" style={{ gap: 12 }}>
                  {circlePrayers.map((p, i) => (
                    <Animated.View key={p.id} entering={enter(i)} style={styles.prayerCard}>
                      <Text style={styles.category}>{p.category}</Text>
                      <Text style={styles.prayerText}>{p.text}</Text>
                      <View style={styles.prayerFootRow}>
                        <View style={styles.countRow}>
                          <PrayerCandle size={18} color={p.prayedCount > 0 ? THEME.accent : THEME.muted} lit={p.prayedCount > 0} />
                          <Text style={styles.prayedCount}>
                            {p.prayedCount === 0
                              ? 'Be the first to pray'
                              : `${p.prayedCount} ${p.prayedCount === 1 ? 'has' : 'have'} prayed`}
                          </Text>
                        </View>
                        {notesSent.has(p.id) || noteFor === p.id ? null : (
                          <PressScale
                            onPress={() => onOpenNote(p.id)}
                            haptic="select"
                            scaleTo={0.9}
                            accessibilityRole="button"
                            accessibilityLabel="Send anonymous encouragement"
                            style={styles.heartBtn}>
                            <HeartIcon size={16} color={THEME.inkSoft} />
                          </PressScale>
                        )}
                        {p.prayedByMe ? (
                          <Animated.View entering={enterFade(180)} style={styles.prayedChip}>
                            <CheckIcon size={13} color={THEME.accent} />
                            <Text style={styles.prayedChipText}>Prayed</Text>
                          </Animated.View>
                        ) : (
                          <PressScale
                            onPress={() => onPray(p)}
                            haptic="success"
                            scaleTo={0.94}
                            accessibilityRole="button"
                            accessibilityLabel="I prayed for this"
                            style={styles.prayBtn}>
                            <PrayingIcon size={15} color={onAccent} />
                            <Text style={styles.prayBtnText}>I prayed</Text>
                          </PressScale>
                        )}
                      </View>

                      {/* Anonymous encouragement — same flow as the vigil page. */}
                      {notesSent.has(p.id) ? (
                        <Animated.View entering={enterFade(220)} style={styles.noteSent}>
                          <CheckIcon size={12} color={THEME.accent} />
                          <Text style={styles.noteSentText}>Your encouragement was delivered.</Text>
                        </Animated.View>
                      ) : noteFor === p.id ? (
                        <Animated.View entering={FadeInDown.duration(220).easing(EASE_OUT)} style={styles.noteBox}>
                          <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="A short word of hope, anonymously…"
                            placeholderTextColor={THEME.muted}
                            selectionColor={THEME.accent}
                            multiline
                            autoFocus
                            maxLength={140}
                            style={styles.noteInput}
                          />
                          <View style={styles.noteFooter}>
                            <Pressable
                              onPress={() => setNoteFor(null)}
                              accessibilityRole="button"
                              style={{ minHeight: 44, justifyContent: 'center', paddingRight: 12 }}>
                              <Text style={styles.noteCancel}>Cancel</Text>
                            </Pressable>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <Text style={styles.noteCounter}>{note.length}/140</Text>
                              <PressScale
                                onPress={() => onSendNote(p)}
                                disabled={!note.trim() || noteSending}
                                accessibilityRole="button"
                                style={[
                                  styles.sendNoteBtn,
                                  { backgroundColor: note.trim() && !noteSending ? THEME.accent : THEME.line },
                                ]}>
                                {noteSending ? (
                                  <ActivityIndicator size="small" color={onAccent} />
                                ) : (
                                  <Text
                                    style={[
                                      styles.sendNoteText,
                                      { color: note.trim() ? onAccent : THEME.inkSoft },
                                    ]}>
                                    Send
                                  </Text>
                                )}
                              </PressScale>
                            </View>
                          </View>
                          {noteError ? <Text style={styles.noteErrorText}>{noteError}</Text> : null}
                        </Animated.View>
                      ) : null}
                    </Animated.View>
                  ))}
                </View>
              )
            ) : myPrayers.length === 0 ? (
              <Animated.View key="yours-empty" entering={enterFade(260)} style={styles.emptyBox}>
                <PenIcon size={24} color={THEME.muted} />
                <Text style={styles.emptyBoxTitle}>Nothing shared yet</Text>
                <Text style={styles.emptyBoxText}>
                  What you share here shows up in this tab, with how many in the circle prayed for
                  it. Your name never appears.
                </Text>
              </Animated.View>
            ) : (
              <View key="yours" style={{ gap: 12 }}>
                {myPrayers.map((p, i) => {
                  const fresh = newPrayersFor(p);
                  return (
                    <Animated.View key={p.id} entering={enter(i)} style={styles.prayerCard}>
                      <Text style={styles.category}>{p.category}</Text>
                      <Text style={styles.prayerText}>{p.text}</Text>
                      <View style={styles.yoursFoot}>
                        <View style={styles.yoursBadge}>
                          <PrayerCandle size={24} color={p.prayedCount > 0 ? THEME.accent : THEME.muted} lit={p.prayedCount > 0} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.yoursCount}>
                            {p.prayedCount === 0
                              ? 'No one yet'
                              : `${p.prayedCount} ${p.prayedCount === 1 ? 'person' : 'people'} prayed`}
                          </Text>
                          <Text style={[styles.yoursSub, fresh > 0 && styles.yoursSubNew]}>
                            {fresh > 0
                              ? `${fresh} new since you last looked`
                              : p.prayedCount === 0
                                ? 'Your circle will see it by the fire.'
                                : 'for this, anonymously'}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => onDeletePrayer(p)}
                          accessibilityRole="button"
                          accessibilityLabel="Remove this prayer"
                          style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
                          <Text style={styles.removeText}>Remove</Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {/* About this circle: code, notifications, leave */}
            {group.myRole && group.invite_code ? (
              <PressScale
                onPress={onShareCode}
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={`Group code ${group.invite_code}. Tap to share`}
                style={styles.settings}>
                <View style={styles.codeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>Group code</Text>
                    <Text style={styles.codeHint}>
                      {group.is_public
                        ? 'Anyone can find this circle, or join straight away with the code.'
                        : 'Only people with this code can join and see these prayers.'}
                    </Text>
                  </View>
                  <Text style={styles.codeValue}>{group.invite_code}</Text>
                </View>
              </PressScale>
            ) : null}
            {isMember && session ? (
              <GroupPrayerNotifications userId={session.user.id} groupId={group.id} />
            ) : null}

            {group.myRole === 'member' ? (
              <Pressable onPress={onLeave} style={styles.leaveBtn} accessibilityRole="button">
                <Text style={styles.leaveBtnText}>Leave group</Text>
              </Pressable>
            ) : group.myRole === 'owner' ? (
              <Pressable onPress={onDeleteGroup} style={styles.leaveBtn} accessibilityRole="button">
                <Text style={styles.deleteBtnText}>Delete this group</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


const makeStyles = (THEME: Theme) => {
  const onAccent = THEME.isDark ? THEME.bg : THEME.accentInk;
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  pressed: { opacity: 0.8 },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  inviteText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.ink },
  titleBlock: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 18 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: THEME.ink,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontFamily: FONTS.body, fontSize: 13, color: THEME.muted },
  description: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.inkSoft,
    marginTop: 10,
  },
  hearthWrap: { paddingHorizontal: 16, alignItems: 'center' },
  hearthShadow: {
    borderRadius: 26,
    backgroundColor: '#3E2816',
    shadowColor: '#2A1A10',
    shadowOpacity: THEME.isDark ? 0.5 : 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  hearthNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.muted,
    marginTop: 10,
    textAlign: 'center',
  },
  body: { paddingHorizontal: 16 },
  shareBtn: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 9999,
    backgroundColor: THEME.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    shadowColor: THEME.accent,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  shareText: { fontFamily: FONTS.bodySemi, fontSize: 16, color: onAccent },
  notMember: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.inkSoft,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 12,
  },
  segment: { marginTop: 26, marginBottom: 14 },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: THEME.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: THEME.inkSoft,
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyBoxTitle: { fontFamily: FONTS.display, fontSize: 19, color: THEME.ink, marginTop: 4 },
  emptyBoxText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.inkSoft,
    textAlign: 'center',
  },
  prayerCard: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  category: {
    alignSelf: 'flex-start',
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    color: THEME.pillInk,
    backgroundColor: THEME.pillBg,
    borderRadius: 9999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  prayerText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 26,
    color: THEME.ink,
  },
  prayerFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  countRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  prayedCount: { fontFamily: FONTS.body, fontSize: 13, color: THEME.inkSoft, fontVariant: ['tabular-nums'] },
  prayBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: THEME.accent,
    borderRadius: 9999,
    paddingHorizontal: 18,
  },
  prayBtnText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: onAccent },
  prayedChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  prayedChipText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.ink },
  yoursFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  yoursCount: { fontFamily: FONTS.bodySemi, fontSize: 18, color: THEME.ink, fontVariant: ['tabular-nums'] },
  yoursSub: { fontFamily: FONTS.body, fontSize: 13, color: THEME.inkSoft, marginTop: 2 },
  yoursSubNew: { fontFamily: FONTS.bodySemi, color: THEME.ink },
  yoursBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  removeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  removeText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.inkSoft },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSoft,
    marginRight: 8,
  },
  noteBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    backgroundColor: THEME.bg,
    padding: 12,
  },
  noteInput: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 21,
    color: THEME.ink,
    minHeight: 56,
    textAlignVertical: 'top',
    padding: 0,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  noteCancel: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.inkSoft },
  noteCounter: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  sendNoteBtn: {
    minHeight: 44,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingHorizontal: 18,
  },
  sendNoteText: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  noteErrorText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    color: THEME.ink,
    marginTop: 8,
  },
  noteSent: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  noteSentText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.ink },
  settings: {
    marginTop: 32,
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    overflow: 'hidden',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  codeLabel: { fontFamily: FONTS.bodySemi, fontSize: 15, color: THEME.ink },
  codeHint: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: THEME.muted,
    marginTop: 3,
  },
  codeValue: {
    fontFamily: FONTS.displaySemi,
    fontSize: 22,
    letterSpacing: 3,
    color: THEME.ink,
  },
  leaveBtn: {
    marginTop: 20,
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  leaveBtnText: { fontFamily: FONTS.body, fontSize: 14, color: THEME.inkSoft },
  deleteBtnText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.ink },
  joinErrorText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.ink, textAlign: 'center', marginTop: 8 },
  });
};
