import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SectionLabel, Squiggle } from '@/components/saint/Common';
import {
  ArrowIcon,
  BackIcon,
  GlobeIcon,
  LockIcon,
  PrayingIcon,
  ShieldIcon,
} from '@/components/saint/Icons';
import { FONTS, THEME } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

const CATEGORIES = [
  { id: 'health', label: 'Health' },
  { id: 'family', label: 'Family' },
  { id: 'work', label: 'Work' },
  { id: 'grief', label: 'Grief' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'faith', label: 'Faith' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'other', label: 'Other' },
];

const URGENCY_LABELS = ['No urgency', 'Gentle', 'Heavy', 'Urgent'];

export default function SubmitPrayerScreen() {
  const fontsLoaded = useSaintFonts();
  const [step, setStep] = useState<'compose' | 'confirm'>('compose');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('family');
  const [urgency, setUrgency] = useState(1);
  const [share, setShare] = useState<'public' | 'private'>('public');

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
        <View style={styles.confirmRoot}>
          <View style={styles.confirmInner}>
            <View style={styles.confirmIconWrap}>
              <PrayingIcon size={40} color={THEME.pillInk} />
            </View>
            <Squiggle color={THEME.accent} w={56} />
            <Text style={styles.confirmTitle}>
              Your prayer is <Text style={styles.confirmTitleItalic}>held</Text>.
            </Text>
            <Text style={styles.confirmBody}>
              {share === 'public'
                ? "It has been placed gently before the community. Hearts you'll never meet will lift it up."
                : 'It has been offered up — held only between you and God.'}
            </Text>
            <View style={{ marginTop: 24 }}>
              <Text style={styles.confirmVerse}>
                &ldquo;Be still, and know that I am God.&rdquo;
              </Text>
              <Text style={[styles.confirmVerse, { fontSize: 12, marginTop: 4 }]}>— Psalm 46:10</Text>
            </View>
          </View>
          <PrimaryButton
            label="Return home"
            bg={THEME.cardDark}
            fg={THEME.cardDarkInk}
            onPress={() => router.dismissAll()}
            style={{ marginHorizontal: 22, marginBottom: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const submittable = text.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon size={16} color={THEME.ink} />
          </Pressable>
          <Text style={styles.title}>
            Share your <Text style={styles.titleItalic}>prayer</Text>
          </Text>
          <Text style={styles.subtitle}>What weighs on your heart today?</Text>
        </View>

        <View style={{ paddingHorizontal: 22 }}>
          {/* Textarea */}
          <View style={styles.textareaCard}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={
                'Write freely. No name, no judgment — only the open ear of heaven and the prayers of strangers who care.'
              }
              placeholderTextColor={THEME.muted}
              multiline
              maxLength={500}
              style={styles.textarea}
            />
            <View style={styles.textareaFoot}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <ShieldIcon size={11} color={THEME.muted} />
                <Text style={styles.textareaFootText}>Always anonymous</Text>
              </View>
              <Text style={styles.textareaFootText}>{text.length}/500</Text>
            </View>
          </View>

          <SectionLabel>
            Category <Text style={{ fontFamily: FONTS.body }}>(optional)</Text>
          </SectionLabel>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map(c => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[
                    styles.chip,
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
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>Weight on your heart</SectionLabel>
          <View style={styles.urgencyCard}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[0, 1, 2, 3].map(i => (
                <Pressable
                  key={i}
                  onPress={() => setUrgency(i)}
                  style={[
                    styles.urgencyBlock,
                    {
                      backgroundColor: i <= urgency ? THEME.accent : THEME.bgSoft,
                      opacity: i <= urgency ? 0.4 + 0.2 * i : 1,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.urgencyLabel}>{URGENCY_LABELS[urgency]}</Text>
          </View>

          <SectionLabel>Who receives this prayer?</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                { id: 'public', Icon: GlobeIcon, title: 'The community', desc: 'Strangers will lift it up' },
                { id: 'private', Icon: LockIcon, title: 'Just to God', desc: 'Held only between you two' },
              ] as const
            ).map(opt => {
              const active = share === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setShare(opt.id)}
                  style={[
                    styles.shareCard,
                    {
                      backgroundColor: active ? THEME.cardDark : THEME.surface,
                      borderColor: active ? THEME.cardDark : THEME.line,
                    },
                  ]}>
                  <opt.Icon size={16} color={active ? THEME.cardDarkInk : THEME.ink} />
                  <Text
                    style={[
                      styles.shareTitle,
                      { color: active ? THEME.cardDarkInk : THEME.ink },
                    ]}>
                    {opt.title}
                  </Text>
                  <Text
                    style={[
                      styles.shareDesc,
                      { color: active ? THEME.cardDarkInk : THEME.inkSoft, opacity: 0.75 },
                    ]}>
                    {opt.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            label="Offer this prayer"
            disabled={!submittable}
            onPress={() => setStep('confirm')}
            rightIcon={<ArrowIcon size={16} color="#FFF" />}
            style={{ marginTop: 28 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 36,
    color: THEME.ink,
    marginTop: 14,
    letterSpacing: -0.4,
  },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: THEME.muted,
    marginTop: 12,
    marginBottom: 22,
  },
  textareaCard: {
    backgroundColor: THEME.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  textarea: {
    minHeight: 140,
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 27,
    color: THEME.ink,
    textAlignVertical: 'top',
  },
  textareaFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.line,
  },
  textareaFootText: { fontSize: 11.5, color: THEME.muted, fontFamily: FONTS.body },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  urgencyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  urgencyBlock: { flex: 1, height: 36, borderRadius: 12 },
  urgencyLabel: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.ink,
    marginTop: 12,
  },
  shareCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareTitle: { fontFamily: FONTS.display, fontSize: 18, marginTop: 8, marginBottom: 4 },
  shareDesc: { fontFamily: FONTS.body, fontSize: 11.5, lineHeight: 16 },
  confirmRoot: { flex: 1, justifyContent: 'space-between', paddingTop: 60 },
  confirmInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  confirmIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  confirmTitle: {
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 42,
    color: THEME.ink,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  confirmTitleItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    color: THEME.accent,
  },
  confirmBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 23,
    color: THEME.inkSoft,
    textAlign: 'center',
    maxWidth: 280,
  },
  confirmVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    textAlign: 'center',
  },
});
