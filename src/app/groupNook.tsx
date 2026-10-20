import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hearth, HEARTH_DECOR, HearthIcon, HearthMember } from '@/components/pets/Hearth';
import { isPetId } from '@/components/pets/registry';
import { ScreenHeader } from '@/components/saint/Common';
import { CheckIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { usePetProgress } from '@/lib/pet';
import { supabase } from '@/lib/supabase';

/** Decorating a group's hearth. Lives on its own page so the group's prayers stay uncluttered. */
export default function GroupNookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fontsLoaded = useSaintFonts();
  const { session } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width: screenW } = useWindowDimensions();
  const { petId: myPetId, progress } = usePetProgress();

  const [name, setName] = useState('');
  const [others, setOthers] = useState<HearthMember[]>([]);
  const [decor, setDecor] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flare, setFlare] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!session || !id) return;
      let cancelled = false;
      (async () => {
        const me = session.user.id;
        const [groupRes, membersRes, nookRes] = await Promise.all([
          supabase.from('groups').select('name').eq('id', id).maybeSingle(),
          supabase.from('group_members').select('user_id, pet_id, pet_stage').eq('group_id', id),
          supabase.from('group_nooks').select('decor').eq('group_id', id).maybeSingle(),
        ]);
        if (cancelled) return;
        const members = membersRes.data ?? [];
        setName(groupRes.data?.name ?? '');
        setIsMember(members.some(m => m.user_id === me));
        setOthers(
          members
            .filter(m => m.user_id !== me)
            .map(m => ({
              petId: isPetId(m.pet_id) ? m.pet_id : 'lamb',
              stage: ([1, 2, 3].includes(m.pet_stage as number) ? m.pet_stage : 1) as HearthMember['stage'],
            })),
        );
        const saved = (nookRes.data?.decor as unknown) ?? [];
        setDecor(Array.isArray(saved) ? saved.filter((d): d is string => typeof d === 'string') : []);
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [session, id]),
  );

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const toggle = async (itemId: string) => {
    if (!id || saving) return;
    const before = decor;
    const next = before.includes(itemId) ? before.filter(d => d !== itemId) : [...before, itemId];
    setDecor(next);
    setFlare(f => f + 1);
    setSaving(true);
    setError(null);
    const { error: e } = await supabase.rpc('save_group_nook', { p_group: id, p_decor: next });
    setSaving(false);
    if (e) {
      setDecor(before);
      setError('Could not save that change. Please try again.');
    }
  };

  const members: HearthMember[] = [{ petId: myPetId, stage: progress.stage }, ...others];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Decorate the hearth"
          subtitle={name ? `${name}'s shared cabin nook` : 'Your circle’s shared cabin nook'}
          onBack={() => router.back()}
          theme={THEME}
        />
        {loading ? (
          <ActivityIndicator color={THEME.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ paddingHorizontal: 22 }}>
            <Hearth width={screenW - 44} members={members} decor={decor} flare={flare} toastText="Looking cozy" />
            <Text style={styles.note}>
              {isMember
                ? 'Everyone in the group sees what you place here. Tap a piece to put it up or take it down.'
                : 'Only members can decorate this hearth.'}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {isMember ? (
              <View style={styles.grid}>
                {HEARTH_DECOR.map(d => {
                  const on = decor.includes(d.id);
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => toggle(d.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${d.name}, ${on ? 'on the hearth, tap to remove' : 'tap to add'}`}
                      style={({ pressed }) => [
                        styles.card,
                        on && { borderColor: THEME.accent, backgroundColor: THEME.surface },
                        pressed && { transform: [{ scale: 0.97 }] },
                      ]}>
                      <View style={[styles.swatch, { borderColor: on ? THEME.accent : d.sw + '66' }]}>
                        <HearthIcon id={d.id} size={30} />
                        {on ? (
                          <View style={[styles.check, { backgroundColor: THEME.accent }]}>
                            <CheckIcon size={9} color="#1A130A" />
                          </View>
                        ) : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{d.name}</Text>
                        <Text style={styles.cardWhere}>{d.where}</Text>
                      </View>
                      <Text style={[styles.cardState, on && { color: THEME.accent }]}>{on ? 'Placed' : 'Add'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    note: {
      fontFamily: FONTS.displayItalic,
      fontStyle: 'italic',
      fontSize: 13,
      lineHeight: 19,
      color: THEME.inkSoft,
      marginTop: 12,
    },
    error: { fontFamily: FONTS.body, fontSize: 12, color: THEME.accent, marginTop: 10 },
    grid: { marginTop: 18, gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: THEME.line,
      backgroundColor: THEME.bg,
    },
    swatch: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1.5,
      backgroundColor: '#16202D',
      alignItems: 'center',
      justifyContent: 'center',
    },
    check: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardName: { fontFamily: FONTS.display, fontSize: 17, color: THEME.ink },
    cardWhere: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted, marginTop: 2 },
    cardState: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.muted },
  });
