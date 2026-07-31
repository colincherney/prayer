import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill, ScreenHeader, SectionLabel } from '@/components/saint/Common';
import {
  ArrowIcon,
  GlobeIcon,
  LockIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
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

  const [myGroups, setMyGroups] = useState<GroupRow[]>([]);
  const [publicGroups, setPublicGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState<string | null>(null); // group id or 'code'
  const [error, setError] = useState<string | null>(null);

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

    setMyGroups(mineRows);
    setPublicGroups(
      ((pub.data ?? []) as unknown as EmbeddedGroup[])
        .map(toRow)
        .filter(g => !mineIds.has(g.id)),
    );
    setLoading(false);
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
    setError(null);
    setJoining(groupId);
    const { error: e } = await supabase.rpc('join_group', { p_group_id: groupId });
    setJoining(null);
    if (e) {
      setError(e.message);
      return;
    }
    router.push({ pathname: '/group/[id]', params: { id: groupId } });
  };

  const GroupCard = ({ group, mine }: { group: GroupRow; mine: boolean }) => (
    <Pressable
      onPress={() =>
        mine
          ? router.push({ pathname: '/group/[id]', params: { id: group.id } })
          : joinPublic(group.id)
      }
      style={({ pressed }) => [styles.groupCard, pressed && { opacity: 0.85 }]}>
      <View style={styles.groupChip}>
        {group.is_public ? (
          <GlobeIcon size={16} color={THEME.ink} />
        ) : (
          <LockIcon size={16} color={THEME.ink} />
        )}
      </View>
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
          {group.is_public ? 'public' : 'private'}
        </Text>
      </View>
      {mine ? (
        <ArrowIcon size={16} color={THEME.muted} />
      ) : joining === group.id ? (
        <ActivityIndicator size="small" color={THEME.accent} />
      ) : (
        <View style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>Join</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Pray together"
          subtitle="Your church, your circle — still fully anonymous."
          onBack={() => router.back()}
          theme={THEME}
        />

        <View style={{ paddingHorizontal: 22 }}>
          <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
            No names, ever
          </Pill>

          {/* Join with a code */}
          <SectionLabel theme={THEME}>Have a group code?</SectionLabel>
          <View style={styles.codeRow}>
            <TextInput
              value={code}
              onChangeText={onCodeChange}
              placeholder="e.g. K7DM3P"
              placeholderTextColor={THEME.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.codeInput}
            />
            <Pressable
              onPress={joinWithCode}
              disabled={!code.trim() || joining === 'code'}
              style={[
                styles.codeBtn,
                { backgroundColor: code.trim() ? THEME.accent : THEME.line },
              ]}>
              {joining === 'code' ? (
                <ActivityIndicator size="small" color={THEME.accentInk} />
              ) : (
                <Text
                  style={[
                    styles.codeBtnText,
                    { color: code.trim() ? THEME.accentInk : THEME.muted },
                  ]}>
                  Join
                </Text>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* My groups */}
          <SectionLabel theme={THEME}>Your groups</SectionLabel>
          {loading ? (
            <ActivityIndicator color={THEME.accent} style={{ marginVertical: 20 }} />
          ) : myGroups.length === 0 ? (
            <View style={styles.emptyBox}>
              <UsersIcon size={26} color={THEME.muted} />
              <Text style={styles.emptyText}>
                You haven&apos;t joined a circle yet. Enter your church&apos;s code
                above, browse below, or start your own.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {myGroups.map(g => (
                <GroupCard key={g.id} group={g} mine />
              ))}
            </View>
          )}

          {/* Create */}
          <Pressable
            onPress={() => router.push('/createGroup')}
            style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}>
            <UsersIcon size={18} color={THEME.cardDarkInk} />
            <Text style={styles.createBtnText}>Start a new group</Text>
          </Pressable>

          {/* Public groups */}
          {publicGroups.length > 0 && (
            <>
              <SectionLabel theme={THEME}>Open circles</SectionLabel>
              <View style={{ gap: 10 }}>
                {publicGroups.map(g => (
                  <GroupCard key={g.id} group={g} mine={false} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.bodySemi,
    fontSize: 16,
    letterSpacing: 4,
    color: THEME.ink,
  },
  codeBtn: {
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  codeBtnText: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.accent,
    marginTop: 12,
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
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: THEME.inkSoft,
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontFamily: FONTS.display, fontSize: 18, color: THEME.ink },
  groupDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    color: THEME.inkSoft,
    marginTop: 2,
  },
  groupMeta: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: THEME.muted,
    marginTop: 4,
  },
  joinBtn: {
    backgroundColor: THEME.pillBg,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinBtnText: { fontFamily: FONTS.bodySemi, fontSize: 12.5, color: THEME.pillInk },
  createBtn: {
    marginTop: 14,
    backgroundColor: THEME.cardDark,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: THEME.cardDarkInk,
  },
});
