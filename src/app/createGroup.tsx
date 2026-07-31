import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, ScreenHeader, SectionLabel, Squiggle } from '@/components/saint/Common';
import { GlobeIcon, LockIcon, UsersIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { supabase } from '@/lib/supabase';

export default function CreateGroupScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; code: string | null } | null>(null);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const onCreate = async () => {
    if (name.trim().length < 3 || busy) return;
    setError(null);
    setBusy(true);
    const { data, error: e } = await supabase.functions.invoke('create-group', {
      body: {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      },
    });
    setBusy(false);
    if (e) {
      setError(e.message.includes('invalid_name') ? 'Name must be 3–60 characters.' : e.message);
      return;
    }
    if (data?.ok === false) {
      setError(
        data.reason === 'moderation_blocked'
          ? "That name or description doesn't fit our community guidelines — try rewording it."
          : 'Something went wrong — please try again.',
      );
      return;
    }
    setCreated({ id: data.id as string, code: (data.invite_code as string | null) ?? null });
  };

  const onShareCode = () => {
    if (!created?.code) return;
    Share.share({
      message: `Join our prayer circle "${name.trim()}" on Saint Central — use code ${created.code}. Everyone stays anonymous.`,
    }).catch(() => {});
  };

  // Success state — show the code once the group exists.
  if (created) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
        <View style={styles.doneRoot}>
          <View style={styles.doneInner}>
            <View style={styles.doneIconWrap}>
              <UsersIcon size={36} color={THEME.pillInk} />
            </View>
            <Squiggle color={THEME.accent} w={56} />
            <Text style={styles.doneTitle}>
              Your circle is <Text style={styles.doneTitleItalic}>open</Text>.
            </Text>
            {created.code ? (
              <>
                <Text style={styles.doneBody}>
                  Share this code with your church. Anyone who enters it joins —
                  no names, only prayer.
                </Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{created.code}</Text>
                </View>
                <Pressable onPress={onShareCode} style={styles.shareBtn}>
                  <Text style={styles.shareBtnText}>Share the code</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.doneBody}>
                Your group is public — anyone can find it under Open circles and
                join with one tap.
              </Text>
            )}
          </View>
          <PrimaryButton
            label="Go to your group"
            bg={THEME.cardDark}
            fg={THEME.cardDarkInk}
            onPress={() =>
              router.replace({ pathname: '/group/[id]', params: { id: created.id } })
            }
            style={{ marginHorizontal: 22, marginBottom: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Start a group"
          subtitle="A circle that prays for one another."
          onBack={() => router.back()}
          theme={THEME}
        />

        <View style={{ paddingHorizontal: 22 }}>
          <SectionLabel theme={THEME} style={{ marginTop: 0 }}>
            Group name
          </SectionLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. St. Mary's Youth Group"
            placeholderTextColor={THEME.muted}
            maxLength={60}
            style={styles.input}
          />

          <SectionLabel theme={THEME}>
            Description <Text style={{ fontFamily: FONTS.body }}>(optional)</Text>
          </SectionLabel>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="A short line so members know they're in the right place."
            placeholderTextColor={THEME.muted}
            multiline
            maxLength={240}
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          />

          <SectionLabel theme={THEME}>Who can join?</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                {
                  pub: false,
                  Icon: LockIcon,
                  title: 'With a code',
                  desc: 'You get a code to share. Only people you give it to can join.',
                },
                {
                  pub: true,
                  Icon: GlobeIcon,
                  title: 'Anyone',
                  desc: 'Listed publicly. Anyone in the app can join.',
                },
              ] as const
            ).map(opt => {
              const active = isPublic === opt.pub;
              return (
                <Pressable
                  key={String(opt.pub)}
                  onPress={() => setIsPublic(opt.pub)}
                  style={[
                    styles.accessCard,
                    {
                      backgroundColor: active ? THEME.cardDark : THEME.surface,
                      borderColor: active ? THEME.cardDark : THEME.line,
                    },
                  ]}>
                  <opt.Icon size={16} color={active ? THEME.cardDarkInk : THEME.ink} />
                  <Text
                    style={[
                      styles.accessTitle,
                      { color: active ? THEME.cardDarkInk : THEME.ink },
                    ]}>
                    {opt.title}
                  </Text>
                  <Text
                    style={[
                      styles.accessDesc,
                      { color: active ? THEME.cardDarkInk : THEME.inkSoft, opacity: 0.75 },
                    ]}>
                    {opt.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            label={busy ? '' : 'Create group'}
            disabled={name.trim().length < 3 || busy}
            onPress={onCreate}
            rightIcon={busy ? <ActivityIndicator color={THEME.accentInk} /> : undefined}
            style={{ marginTop: 28 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  input: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: THEME.ink,
  },
  accessCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  accessTitle: { fontFamily: FONTS.display, fontSize: 18, marginTop: 8, marginBottom: 4 },
  accessDesc: { fontFamily: FONTS.body, fontSize: 11.5, lineHeight: 16 },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.accent,
    marginTop: 18,
    textAlign: 'center',
  },
  doneRoot: { flex: 1, justifyContent: 'space-between', paddingTop: 60 },
  doneInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  doneIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  doneTitle: {
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 40,
    color: THEME.ink,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  doneTitleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  doneBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 23,
    color: THEME.inkSoft,
    textAlign: 'center',
    maxWidth: 300,
  },
  codeBox: {
    marginTop: 24,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    paddingVertical: 18,
    paddingHorizontal: 36,
  },
  codeText: {
    fontFamily: FONTS.displaySemi,
    fontSize: 34,
    letterSpacing: 8,
    color: THEME.ink,
  },
  shareBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 9999,
    backgroundColor: THEME.pillBg,
  },
  shareBtnText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.pillInk },
});
