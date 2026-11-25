import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { enterUp } from '@/components/saint/motion';

import { SafeAreaView } from '@/components/saint/SafeArea';
import { authHaptic } from '@/components/saint/authHaptics';
import { PressScale } from '@/components/saint/GroupKit';

import { lyingFeetOffset } from '@/components/pets/LyingPets';
import { PeekingPet } from '@/components/pets/ScreenPet';
import {
  ArrowIcon,
  BackIcon,
  FlameIcon,
  LockIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { LOCAL_KEYS, readForUser, writeForUser } from '@/lib/localCache';
import { supabase } from '@/lib/supabase';

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  memberCount: number;
};

export default function GroupsScreen() {
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // Last time's list draws instantly; the fresh one replaces it when it arrives.
  const [saved] = useState(() =>
    readForUser<{ mine: GroupRow[]; pub: GroupRow[] }>(LOCAL_KEYS.groupsList, session?.user.id),
  );
  const [myGroups, setMyGroups] = useState<GroupRow[]>(saved?.mine ?? []);
  const [publicGroups, setPublicGroups] = useState<GroupRow[]>(saved?.pub ?? []);
  const [loading, setLoading] = useState(!saved);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState<string | null>(null); // group id or 'code'
  const [error, setError] = useState<string | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  // People often paste the whole share message ("Join our prayer circle … use
  // code K7DM3P …") instead of just the code — pull the code out for them.
  const onCodeChange = (t: string) => {
    const upper = t.toUpperCase();
    const fromMessage = upper.match(/CODE\s*:?\s*([A-Z0-9]{4,8})/);
    setCode((fromMessage ? fromMessage[1] : upper).replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  const load = useCallback(async () => {
    if (!session) return;
    const me = session.user.id;

    const [mine, pub] = await Promise.all([
      supabase
        .from('group_members')
        .select('group_id, groups(id, name, description, is_public, group_members(count))')
        .eq('user_id', me),
      supabase
        .from('groups')
        .select('id, name, description, is_public, group_members(count)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    // A failed request keeps whatever is on screen (the saved list) instead of blanking it.
    if (mine.error || pub.error) {
      setLoading(false);
      return;
    }

    type EmbeddedGroup = {
      id: string;
      name: string;
      description: string | null;
      is_public: boolean;
      group_members: { count: number }[];
    };

    const toRow = (g: EmbeddedGroup): GroupRow => ({
      id: g.id,
      name: g.name,
      description: g.description,
      is_public: g.is_public,
      memberCount: g.group_members?.[0]?.count ?? 0,
    });

    const mineRows = (mine.data ?? [])
      .map(m => m.groups as unknown as EmbeddedGroup | null)
      .filter((g): g is EmbeddedGroup => !!g)
      .map(toRow);
    const mineIds = new Set(mineRows.map(g => g.id));

    const pubRows = ((pub.data ?? []) as unknown as EmbeddedGroup[]).map(toRow).filter(g => !mineIds.has(g.id));
    setMyGroups(mineRows);
    setPublicGroups(pubRows);
    setLoading(false);
    writeForUser(LOCAL_KEYS.groupsList, me, { mine: mineRows, pub: pubRows });
  }, [session]);

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

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const joinWithCode = async () => {
    const trimmed = code.trim();
    if (!trimmed || joining) return;
    setError(null);
    setJoining('code');
    const { data, error: e } = await supabase.rpc('join_group', { p_code: trimmed });
    setJoining(null);
    authHaptic(e ? 'error' : 'success');
    if (e) {
      setError(
        e.message.includes('invalid_code')
          ? "That code doesn't match any group. Double-check it with whoever shared it."
          : e.message,
      );
      return;
    }
    setCode('');
    router.push({ pathname: '/group/[id]', params: { id: data as string } });
  };

  const joinPublic = async (groupId: string) => {
    if (joining) return;
    setPublicError(null);
    setJoining(groupId);
    const { error: e } = await supabase.rpc('join_group', { p_group_id: groupId });
    setJoining(null);
    authHaptic(e ? 'error' : 'success');
    if (e) {
      setPublicError('Couldn’t join that circle. Check your connection and try again.');
      return;
    }
    router.push({ pathname: '/group/[id]', params: { id: groupId } });
  };


  // One row of an inset grouped list: your groups open, open circles join.
  const GroupRowItem = ({ group, mine, last }: { group: GroupRow; mine: boolean; last: boolean }) => (
    <Pressable
      onPress={() =>
        mine
          ? router.push({ pathname: '/group/[id]', params: { id: group.id } })
          : joinPublic(group.id)
      }
      accessibilityRole="button"
      accessibilityLabel={mine ? `Open ${group.name}` : `Join ${group.name}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: THEME.bgSoft }]}>
      <View style={styles.rowChip}>
        {group.is_public ? (
          <FlameIcon size={17} color={THEME.pillInk} />
        ) : (
          <LockIcon size={16} color={THEME.pillInk} />
        )}
      </View>
      <View style={[styles.rowBody, !last && styles.rowDivider]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          {group.description ? (
            <Text style={styles.groupDesc} numberOfLines={2}>
              {group.description}
            </Text>
          ) : null}
          <Text style={styles.groupMeta}>
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            {' · '}
            {group.is_public ? 'Public' : 'Private'}
          </Text>
        </View>
        {mine ? (
          <ArrowIcon size={16} color={THEME.muted} />
        ) : joining === group.id ? (
          <View style={styles.joinBtn}>
            <ActivityIndicator size="small" color={THEME.pillInk} />
          </View>
        ) : (
          <View style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>Join</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  const canJoin = code.length >= 4 && joining !== 'code';
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  // Text on accent buttons: the dark themes' accent is a light tan, so it takes the dark ground.
  const onAccent = THEME.isDark ? THEME.bg : THEME.accentInk;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={THEME.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accent} />}>
        <View style={styles.topBar}>
          <PressScale
            onPress={() => router.back()}
            haptic={null}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.roundBtn}>
            <BackIcon size={16} color={THEME.ink} />
          </PressScale>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Pray together</Text>
          <View style={styles.anonLine}>
            <ShieldIcon size={13} color={THEME.muted} />
            <Text style={styles.subtitle}>Every circle is anonymous. No names, ever.</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Join with a code */}
          <View style={styles.codeCard}>
            <Text style={styles.codeTitle}>Join with a code</Text>
            <Text style={styles.codeHint}>From your church, a friend, or a group you were invited to.</Text>
            <View style={styles.codeRow}>
              <TextInput
                value={code}
                onChangeText={onCodeChange}
                onSubmitEditing={joinWithCode}
                returnKeyType="go"
                placeholder="K7DM3P"
                placeholderTextColor={THEME.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Group code"
                selectionColor={THEME.accent}
                onFocus={() => setCodeFocused(true)}
                onBlur={() => setCodeFocused(false)}
                style={[styles.codeInput, codeFocused && { borderColor: THEME.accent, borderWidth: 1.5 }]}
              />
              <PressScale
                onPress={joinWithCode}
                disabled={!canJoin}
                haptic={null}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canJoin }}
                style={[styles.codeBtn, { backgroundColor: canJoin ? THEME.accent : THEME.line }]}>
                {joining === 'code' ? (
                  <ActivityIndicator size="small" color={onAccent} />
                ) : (
                  <Text style={[styles.codeBtnText, { color: canJoin ? onAccent : THEME.inkSoft }]}>
                    Join
                  </Text>
                )}
              </PressScale>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Your groups. Your companion climbs up from behind this list, lies along its top, dozes, and slips back down. */}
          <Text style={styles.sectionTitle}>Your groups</Text>
          <View style={{ marginTop: 76 }}>
            <View pointerEvents="none" style={{ position: 'absolute', right: 26, top: 3 - lyingFeetOffset(124) }}>
              <PeekingPet size={124} />
            </View>
            {loading ? (
              <View style={styles.list}>
                <ActivityIndicator color={THEME.accent} style={{ marginVertical: 28 }} />
              </View>
            ) : myGroups.length === 0 ? (
              <View style={[styles.list, styles.emptyBox]}>
                <UsersIcon size={26} color={THEME.muted} />
                <Text style={styles.emptyTitle}>No circles yet</Text>
                <Text style={styles.emptyText}>
                  Enter a code above, join an open circle below, or start your own.
                </Text>
              </View>
            ) : (
              <Animated.View entering={enterUp(0)} style={styles.list}>
                {myGroups.map((g, i) => (
                  <GroupRowItem key={g.id} group={g} mine last={i === myGroups.length - 1} />
                ))}
              </Animated.View>
            )}
          </View>

          <PressScale
            onPress={() => router.push('/createGroup')}
            accessibilityRole="button"
            style={styles.createBtn}>
            <UsersIcon size={18} color={THEME.cardDarkInk} />
            <Text style={styles.createBtnText}>Start a new group</Text>
          </PressScale>

          {/* Public groups */}
          {publicGroups.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Open circles</Text>
              <Text style={styles.sectionHint}>Public groups anyone can join. Still no names.</Text>
              {publicError ? <Text style={[styles.errorText, { marginTop: 0, marginBottom: 12 }]}>{publicError}</Text> : null}
              <Animated.View entering={enterUp(2)} style={styles.list}>
                {publicGroups.map((g, i) => (
                  <GroupRowItem key={g.id} group={g} mine={false} last={i === publicGroups.length - 1} />
                ))}
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  topBar: { paddingHorizontal: 22, paddingTop: 8 },
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
  titleBlock: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: THEME.ink,
  },
  anonLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, color: THEME.inkSoft },
  body: { paddingHorizontal: 16 },
  codeCard: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    padding: 18,
  },
  codeTitle: { fontFamily: FONTS.bodySemi, fontSize: 16, color: THEME.ink },
  codeHint: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 18, color: THEME.muted, marginTop: 3 },
  codeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  codeInput: {
    flex: 1,
    minHeight: 50,
    backgroundColor: THEME.bg,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    paddingHorizontal: 16,
    fontFamily: FONTS.bodySemi,
    fontSize: 18,
    letterSpacing: 4,
    color: THEME.ink,
  },
  codeBtn: {
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 50,
  },
  codeBtnText: { fontFamily: FONTS.bodySemi, fontSize: 15 },
  errorText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: THEME.ink,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: THEME.ink,
    marginTop: 32,
    paddingHorizontal: 6,
  },
  sectionHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: THEME.muted,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  list: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  rowChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 14,
    paddingVertical: 15,
    paddingRight: 16,
    minHeight: 72,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: THEME.line },
  emptyBox: { padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 19, color: THEME.ink, marginTop: 4 },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.inkSoft,
    textAlign: 'center',
  },
  groupName: { fontFamily: FONTS.display, fontSize: 18, color: THEME.ink },
  groupDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: THEME.inkSoft,
    marginTop: 2,
  },
  groupMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.muted,
    marginTop: 4,
  },
  joinBtn: {
    minHeight: 36,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.pillInk,
    borderRadius: 9999,
    paddingHorizontal: 16,
  },
  joinBtnText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: THEME.pillInk },
  createBtn: {
    marginTop: 14,
    minHeight: 54,
    backgroundColor: THEME.cardDark,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 15,
    color: THEME.cardDarkInk,
  },
});
