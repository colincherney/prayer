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

import { ScreenHeader } from '@/components/saint/Common';
import { CheckIcon, HeartIcon, PrayingIcon } from '@/components/saint/Icons';
import { FONTS, THEME } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';

type PrayerRequest = {
  id: number;
  category: 'Family' | 'Grief' | 'Work' | 'Health' | 'Gratitude' | 'Faith';
  urgency: 0 | 1 | 2 | 3;
  prayedCount: number;
  age: string;
  text: string;
  location: string;
};

const SAMPLE_REQUESTS: PrayerRequest[] = [
  {
    id: 1,
    category: 'Family',
    urgency: 2,
    prayedCount: 47,
    age: '12m ago',
    text:
      "My mother starts chemotherapy on Monday. Please pray for her strength, for the doctors' hands, and for our family's faith to hold steady.",
    location: 'Anonymous · Ohio',
  },
  {
    id: 2,
    category: 'Grief',
    urgency: 3,
    prayedCount: 128,
    age: '2h ago',
    text:
      "Lost my brother last week. The silence in our home is so loud. I'm trying to keep faith but I'm so tired.",
    location: 'Anonymous · Texas',
  },
  {
    id: 3,
    category: 'Work',
    urgency: 1,
    prayedCount: 19,
    age: '4h ago',
    text:
      "Job interview tomorrow morning. I've been unemployed for seven months. Please pray for clarity and peace.",
    location: 'Anonymous · Oregon',
  },
  {
    id: 4,
    category: 'Health',
    urgency: 2,
    prayedCount: 73,
    age: '6h ago',
    text:
      'Awaiting biopsy results this week. Praying for healing and for the courage to accept whatever comes.',
    location: 'Anonymous · Florida',
  },
  {
    id: 5,
    category: 'Gratitude',
    urgency: 0,
    prayedCount: 211,
    age: '1d ago',
    text:
      "Thank you Lord — daughter's surgery went well. Sharing this so others can take heart in their own waiting.",
    location: 'Anonymous · Illinois',
  },
  {
    id: 6,
    category: 'Family',
    urgency: 2,
    prayedCount: 34,
    age: '1d ago',
    text:
      "My marriage feels like it's slipping. Pray for both of us — for tenderness, patience, and the will to choose love again.",
    location: 'Anonymous · Vermont',
  },
];

const CATEGORY_COLOR: Record<PrayerRequest['category'], string> = {
  Health: '#C8643C',
  Family: '#7B8A6B',
  Grief: '#5C6B8A',
  Work: '#A8865C',
  Gratitude: '#D4A857',
  Faith: '#7A5C8A',
};

const CategoryDot: React.FC<{ category: PrayerRequest['category'] }> = ({ category }) => (
  <View
    style={{
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: CATEGORY_COLOR[category],
      marginRight: 8,
    }}
  />
);

const UrgencyDots: React.FC<{ urgency: number; color: string }> = ({ urgency, color }) => (
  <View style={{ flexDirection: 'row', gap: 3 }}>
    {[0, 1, 2].map(i => (
      <View
        key={i}
        style={{
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: i < urgency ? color : THEME.muted,
          opacity: i < urgency ? 1 : 0.18,
        }}
      />
    ))}
  </View>
);

const PrayCard: React.FC<{
  req: PrayerRequest;
  prayedLocally: boolean;
  onPrayed: (id: number) => void;
  noteSent: boolean;
  onSendNote: (id: number) => void;
}> = ({ req, prayedLocally, onPrayed, noteSent, onSendNote }) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.metaRow}>
          <CategoryDot category={req.category} />
          <Text style={styles.metaText}>
            {req.category.toUpperCase()} · {req.age.toUpperCase()}
          </Text>
        </View>
        <UrgencyDots urgency={req.urgency} color={THEME.accent} />
      </View>

      <Text style={styles.body}>&ldquo;{req.text}&rdquo;</Text>
      <Text style={styles.attribution}>— {req.location}</Text>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <PrayingIcon size={14} color={THEME.muted} />
          <Text style={styles.countText}>
            <Text style={{ fontFamily: FONTS.bodySemi, color: THEME.ink }}>
              {req.prayedCount + (prayedLocally ? 1 : 0)}
            </Text>{' '}
            have prayed
          </Text>
        </View>
        <Pressable
          onPress={() => !prayedLocally && onPrayed(req.id)}
          style={[
            styles.prayBtn,
            { backgroundColor: prayedLocally ? THEME.accent : THEME.bgSoft },
          ]}>
          {prayedLocally ? (
            <CheckIcon size={14} color="#FFF" />
          ) : (
            <PrayingIcon size={14} color={THEME.ink} />
          )}
          <Text
            style={{
              fontFamily: FONTS.bodySemi,
              fontSize: 13,
              color: prayedLocally ? '#FFF' : THEME.ink,
            }}>
            {prayedLocally ? 'Prayed' : 'I prayed'}
          </Text>
        </Pressable>
      </View>

      {!noteSent && !noteOpen && (
        <Pressable onPress={() => setNoteOpen(true)} style={styles.noteCta}>
          <HeartIcon size={13} color={THEME.inkSoft} />
          <Text style={styles.noteCtaText}>Send anonymous encouragement</Text>
        </Pressable>
      )}
      {noteOpen && !noteSent && (
        <View style={styles.noteBox}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="A short word of hope, anonymously…"
            placeholderTextColor={THEME.muted}
            multiline
            maxLength={140}
            style={styles.noteInput}
          />
          <View style={styles.noteFooter}>
            <Text style={styles.noteCounter}>{note.length}/140</Text>
            <Pressable
              onPress={() => {
                if (note.trim()) {
                  onSendNote(req.id);
                  setNoteOpen(false);
                }
              }}
              disabled={!note.trim()}
              style={[
                styles.sendNoteBtn,
                { backgroundColor: note.trim() ? THEME.accent : THEME.line },
              ]}>
              <Text style={styles.sendNoteText}>Send anonymously</Text>
            </Pressable>
          </View>
        </View>
      )}
      {noteSent && (
        <View style={styles.noteSent}>
          <CheckIcon size={13} color={THEME.pillInk} />
          <Text style={styles.noteSentText}>Your encouragement was delivered.</Text>
        </View>
      )}
    </View>
  );
};

export default function PrayForOthersScreen() {
  const fontsLoaded = useSaintFonts();
  const [prayedIds, setPrayedIds] = useState<Record<number, boolean>>({});
  const [notesSent, setNotesSent] = useState<Record<number, boolean>>({});

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const totalPrayers = SAMPLE_REQUESTS.reduce((a, b) => a + b.prayedCount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Pray for Others"
          subtitle={`${SAMPLE_REQUESTS.length} requests · ${totalPrayers} prayers offered`}
          onBack={() => router.back()}
        />
        <View style={{ paddingHorizontal: 22, gap: 14 }}>
          {SAMPLE_REQUESTS.map(req => (
            <PrayCard
              key={req.id}
              req={req}
              prayedLocally={!!prayedIds[req.id]}
              onPrayed={id => setPrayedIds(p => ({ ...p, [id]: true }))}
              noteSent={!!notesSent[req.id]}
              onSendNote={id => setNotesSent(s => ({ ...s, [id]: true }))}
            />
          ))}
          <Text style={styles.endVerse}>
            &ldquo;Bear one another&apos;s burdens, and so fulfill the law of Christ.&rdquo; — Galatians 6:2
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    shadowColor: '#1F2A44',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: THEME.muted,
  },
  body: {
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 29,
    color: THEME.ink,
    marginTop: 18,
    marginBottom: 16,
  },
  attribution: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12.5,
    color: THEME.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.line,
    marginTop: 18,
    marginBottom: 16,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  countText: { fontSize: 12, color: THEME.inkSoft, fontFamily: FONTS.body },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  noteCta: {
    marginTop: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.line,
    borderStyle: 'dashed',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noteCtaText: { fontSize: 12, color: THEME.inkSoft, fontFamily: FONTS.body },
  noteBox: {
    marginTop: 12,
    backgroundColor: THEME.bg,
    borderRadius: 14,
    padding: 14,
  },
  noteInput: {
    minHeight: 60,
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.ink,
    textAlignVertical: 'top',
  },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  noteCounter: { fontSize: 11, color: THEME.muted, fontFamily: FONTS.body },
  sendNoteBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
  sendNoteText: { color: '#FFF', fontFamily: FONTS.bodySemi, fontSize: 12 },
  noteSent: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: THEME.pillBg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteSentText: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: THEME.pillInk,
  },
  endVerse: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: THEME.muted,
    textAlign: 'center',
    marginTop: 12,
  },
});
