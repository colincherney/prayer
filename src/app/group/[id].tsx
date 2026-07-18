import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, PrimaryButton, ScreenHeader, SectionLabel } from '@/components/saint/Common';
import {
  CheckIcon,
  GlobeIcon,
  LockIcon,
  PrayingIcon,
  ShieldIcon,
} from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { relativeTime } from '@/lib/time';

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
  age: string;
  mine: boolean;
  prayedCount: number;
  prayedByMe: boolean;
};

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [prayers, setPrayers] = useState<GroupPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !id) return;
    const me = session.user.id;

    const [groupRes, membersRes, prayersRes] = await Promise.all([
      supabase
        .from('groups')
        .select('id, name, description, is_public, invite_code')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('group_members').select('user_id, role').eq('group_id', id),
      supabase
        .from('prayers')
        .select('id, body, category, created_at, user_id, prayer_interactions(action, user_id)')
        .eq('group_id', id)
        .eq('approved', 'y')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (groupRes.error || !groupRes.data) {
      setError(groupRes.error?.message ?? 'This group is private or no longer exists.');
      setLoading(false);
      return;
    }

    const members = membersRes.data ?? [];
    const myMembership = members.find(m => m.user_id === me);

    setGroup({
      id: groupRes.data.id,
      name: groupRes.data.name,
      description: groupRes.data.description,
      is_public: groupRes.data.is_public,
      invite_code: groupRes.data.invite_code,
      memberCount: members.length,
      myRole: (myMembership?.role as 'owner' | 'member' | undefined) ?? null,
    });

    setPrayers(
      (prayersRes.data ?? []).map(p => {
        const interactions =
          (p.prayer_interactions as { action: string; user_id: string }[] | null) ?? [];
        const prayed = interactions.filter(i => i.action === 'prayed');
        return {
          id: p.id as string,
          text: (p.body as string) ?? '',
          category: (p.category as string | null) ?? 'Other',
          age: relativeTime(p.created_at as string),
          mine: p.user_id === me,
          prayedCount: prayed.length,
          prayedByMe: prayed.some(i => i.user_id === me),
        };
      }),
    );
    setError(null);
    setLoading(false);
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

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const onPray = async (prayer: GroupPrayer) => {
    if (!session || prayer.prayedByMe || prayer.mine) return;
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
    if (e) {
      setPrayers(prev =>
        prev.map(p =>
          p.id === prayer.id
            ? { ...p, prayedByMe: false, prayedCount: Math.max(0, p.prayedCount - 1) }
            : p,
        ),
      );
    }
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={THEME.accent} />
        </View>
      ) : error || !group ? (
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
          showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title={group.name}
            subtitle={group.description ?? undefined}
            onBack={() => router.back()}
            theme={THEME}
          />

          <View style={{ paddingHorizontal: 22 }}>
            <View style={styles.metaRow}>
              <Pill
                icon={
                  group.is_public ? (
                    <GlobeIcon size={11} color={THEME.pillInk} />
                  ) : (
                    <LockIcon size={11} color={THEME.pillInk} />
                  )
                }>
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              </Pill>
              <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
                Anonymous
              </Pill>
            </View>

            {/* Invite code — every member can pass it along */}
            {group.myRole && group.invite_code ? (
              <Pressable onPress={onShareCode} style={styles.codeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeLabel}>GROUP CODE — TAP TO SHARE</Text>
                  <Text style={styles.codeValue}>{group.invite_code}</Text>
                </View>
                <Text style={styles.codeHint}>
                  Only people with this code can join and see these prayers.
                </Text>
              </Pressable>
            ) : null}

            {group.myRole ? (
              <PrimaryButton
                label="Share a prayer with this group"
                onPress={() =>
                  router.push({
                    pathname: '/prayerRequest',
                    params: { groupId: group.id, groupName: group.name },
                  })
                }
                style={{ marginTop: 16 }}
              />
            ) : null}

            <SectionLabel theme={THEME}>Prayers in this circle</SectionLabel>
            {prayers.length === 0 ? (
              <View style={styles.emptyBox}>
                <PrayingIcon size={26} color={THEME.muted} />
                <Text style={styles.emptyBoxText}>
                  No prayers here yet. Be the first to share what weighs on your
                  heart — no one will know it&apos;s you.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {prayers.map(p => (
                  <View key={p.id} style={styles.prayerCard}>
                    <View style={styles.prayerMetaRow}>
                      <Text style={styles.prayerMeta}>
                        {p.category.toUpperCase()} · {p.age.toUpperCase()}
                      </Text>
                      {p.mine ? (
                        <Text style={[styles.prayerMeta, { color: THEME.accent }]}>
                          YOURS
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.prayerText}>&ldquo;{p.text}&rdquo;</Text>
                    <View style={styles.prayerFootRow}>
                      <Text style={styles.prayedCount}>
                        {p.prayedCount}{' '}
                        {p.prayedCount === 1 ? 'has prayed' : 'have prayed'}
                      </Text>
                      {p.mine ? (
                        <Pressable
                          onPress={() => onDeletePrayer(p)}
                          hitSlop={8}
                          style={({ pressed }) => pressed && { opacity: 0.6 }}>
                          <Text style={styles.removeText}>Remove</Text>
                        </Pressable>
                      ) : p.prayedByMe ? (
                        <View style={styles.prayedChip}>
                          <CheckIcon size={12} color={THEME.accent} />
                          <Text style={styles.prayedChipText}>Prayed</Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => onPray(p)}
                          style={({ pressed }) => [
                            styles.prayBtn,
                            pressed && { opacity: 0.8 },
                          ]}>
                          <PrayingIcon size={14} color={THEME.accentInk} />
                          <Text style={styles.prayBtnText}>I prayed</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {group.myRole === 'member' ? (
              <Pressable onPress={onLeave} style={styles.leaveBtn}>
                <Text style={styles.leaveBtnText}>Leave group</Text>
              </Pressable>
            ) : group.myRole === 'owner' ? (
              <Pressable onPress={onDeleteGroup} style={styles.leaveBtn}>
                <Text style={styles.deleteBtnText}>Delete this group</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  metaRow: { flexDirection: 'row', gap: 8 },
  codeCard: {
    marginTop: 16,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    padding: 16,
    gap: 8,
  },
  codeLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 1.6,
    color: THEME.muted,
  },
  codeValue: {
    fontFamily: FONTS.displaySemi,
    fontSize: 28,
    letterSpacing: 6,
    color: THEME.ink,
    marginTop: 4,
  },
  codeHint: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: THEME.muted,
  },
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
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  emptyBoxText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: THEME.inkSoft,
    textAlign: 'center',
  },
  prayerCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    padding: 18,
  },
  prayerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  prayerMeta: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    letterSpacing: 1.4,
    color: THEME.muted,
  },
  prayerText: {
    fontFamily: FONTS.display,
    fontSize: 17,
    lineHeight: 25,
    color: THEME.ink,
  },
  prayerFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  prayedCount: { fontFamily: FONTS.body, fontSize: 12, color: THEME.inkSoft },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.accent,
    borderRadius: 9999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  prayBtnText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.accentInk },
  prayedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  prayedChipText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.accent },
  leaveBtn: {
    marginTop: 28,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  leaveBtnText: { fontFamily: FONTS.body, fontSize: 13, color: THEME.muted },
  deleteBtnText: { fontFamily: FONTS.body, fontSize: 13, color: THEME.accent },
  removeText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.muted },
});
