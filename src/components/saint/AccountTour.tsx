import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Pressable } from '@/components/saint/HapticPressable';

import { OliveDove } from '@/components/pets/Dove';

import { useAppDisplay } from './appDisplay';
import { ArrowIcon, CheckIcon, PenIcon, SparkleIcon } from './Icons';
import { SafeAreaView } from './SafeArea';
import { SIMPLE_PRAYER_ACTIONS } from './SimpleHome';
import { FONTS, type Theme, useTheme, useThemedStyles } from './theme';

const slides = [
  {
    id: 'prayer',
    title: 'Pray together',
    body: 'Share a prayer request anonymously, pray for others, or join a prayer group.',
  },
  {
    id: 'nook',
    title: 'Make it yours',
    body: 'Keep a prayer journal, meet companions, and decorate your prayer nook.',
  },
  {
    id: 'simple',
    title: 'Simple mode',
    body: 'A quieter home focused on prayer requests, praying for others, and journaling.',
  },
  {
    id: 'plus',
    title: 'Saint Central+',
    body: 'The optional subscription unlocks extra scenes and decor and helps keep the community running.',
  },
] as const;

const chapel = require('@/assets/images/auth-chapel-render-web.webp');
const decor = [
  require('@/assets/images/customization-icons/optimized/potted-flower-thumb.png'),
  require('@/assets/images/customization-icons/optimized/candle-thumb.png'),
  require('@/assets/images/customization-icons/optimized/red-carpet-thumb.png'),
];

type SlideId = typeof slides[number]['id'];

function SlidePreview({ id }: { id: SlideId }) {
  const styles = useThemedStyles(makeStyles);

  if (id === 'simple') {
    return (
      <View style={styles.simplePreview} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SIMPLE_PRAYER_ACTIONS.map(({ title, Icon }) => (
          <View key={title} style={styles.simpleRow}>
            <Icon size={17} color="#365B46" />
            <Text style={styles.simpleRowText}>{title}</Text>
            <ArrowIcon size={13} color="#365B46" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={id === 'prayer' ? ['#101B35', '#334976'] : id === 'nook' ? ['#172D2B', '#375C4C'] : ['#352644', '#665074']}
      style={styles.art}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {id === 'prayer' ? (
        <Image source={chapel} contentFit="contain" style={styles.chapel} />
      ) : id === 'nook' ? (
        <View style={styles.nookArt}>
          <View style={styles.journalIcon}><PenIcon size={23} color="#F7E7BB" /></View>
          <OliveDove stage={2} size={132} animated={false} />
        </View>
      ) : (
        <View style={styles.decor}>
          {decor.map((source, index) => (
            <View key={index} style={[styles.decorTile, index === 1 && styles.centerTile]}>
              <Image source={source} contentFit="contain" style={styles.decorItem} />
            </View>
          ))}
          <View style={styles.decorSparkle}><SparkleIcon size={18} color="#F7E7BB" /></View>
        </View>
      )}
    </LinearGradient>
  );
}

export function AccountTour({ onDone, onGetPlus }: { onDone: () => void; onGetPlus: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { simple, updateDisplay } = useAppDisplay();
  const [page, setPage] = useState(0);
  const slide = slides[page];
  const first = page === 0;
  const last = page === slides.length - 1;
  const goBack = () => setPage(current => Math.max(0, current - 1));
  const advance = () => setPage(current => Math.min(slides.length - 1, current + 1));

  return (
    <Modal transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={first ? onDone : goBack}>
      <SafeAreaView style={styles.scrim} accessibilityViewIsModal>
        <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.brand}>Welcome to Saint Central</Text>
              <Pressable accessibilityRole="button" onPress={onDone} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
                <Text style={styles.buttonText}>Skip tour</Text>
              </Pressable>
            </View>
            <View accessibilityLabel={`Step ${page + 1} of ${slides.length}`} accessible style={styles.progress}>
              {slides.map(({ id }, index) => (
                <View key={id} style={[styles.segment, index <= page && styles.segmentFilled]} />
              ))}
            </View>

            <SlidePreview id={slide.id} />
            <View style={styles.copy} accessibilityLiveRegion="polite">
              <Text accessibilityRole="header" style={styles.title}>{slide.title}</Text>
              {last && <Text style={styles.free}>Prayer requests, praying for others, and journaling are free.</Text>}
              <Text style={styles.body}>{slide.body}</Text>
            </View>

            {last && (
              <Pressable accessibilityRole="button" onPress={onGetPlus}
                style={({ pressed }) => [styles.plusButton, pressed && styles.pressed]}>
                <Text style={styles.buttonText}>Get Saint Central+ now</Text>
                <ArrowIcon size={14} color={theme.inkSoft} />
              </Pressable>
            )}

            {slide.id === 'simple' && (
              <View style={styles.setting}>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitle}>Use Simple mode</Text>
                  <Text style={styles.settingHint}>{simple ? 'Change it anytime in Settings.' : 'Find it anytime in Me → Display.'}</Text>
                </View>
                <Switch accessibilityLabel="Use Simple mode" value={simple} trackColor={{ true: theme.accent }}
                  onValueChange={value => updateDisplay({ simple: value })} />
              </View>
            )}

            <View style={styles.footer}>
              {!first && (
                <Pressable accessibilityRole="button" onPress={goBack} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
                  <Text style={styles.buttonText}>Back</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" onPress={last ? onDone : advance}
                style={({ pressed }) => [styles.next, pressed && styles.pressed]}>
                <Text style={styles.nextText}>{last ? 'Get started' : 'Next'}</Text>
                {last ? <CheckIcon size={16} color={theme.cardDarkInk} /> : <ArrowIcon size={16} color={theme.cardDarkInk} />}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(10,18,36,0.74)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  panel: {
    width: '100%', maxWidth: 448, alignSelf: 'center', gap: 16, padding: 20,
    borderRadius: 24, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginVertical: -6 },
  brand: { flexShrink: 1, color: theme.ink, fontFamily: FONTS.bodySemi, fontSize: 14 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  buttonText: { flexShrink: 1, color: theme.inkSoft, fontFamily: FONTS.bodySemi, fontSize: 14 },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.line },
  segmentFilled: { backgroundColor: theme.accent },
  art: { height: 142, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chapel: { width: '100%', height: '100%' },
  nookArt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  journalIcon: {
    width: 46, height: 54, borderRadius: 9, borderWidth: 1, borderColor: '#A5A889',
    backgroundColor: '#29473F', alignItems: 'center', justifyContent: 'center',
  },
  decor: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  decorTile: {
    width: 57, height: 64, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: '#967F9F', backgroundColor: '#554061',
  },
  centerTile: { height: 80, backgroundColor: '#705474' },
  decorItem: { width: 44, height: 49 },
  decorSparkle: { position: 'absolute', right: -17, top: -7 },
  simplePreview: { gap: 5, padding: 10, borderRadius: 16, backgroundColor: '#E6EEE4' },
  simpleRow: {
    minHeight: 33, gap: 9, paddingHorizontal: 11, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: '#FDFCFA',
  },
  simpleRowText: { flex: 1, color: '#222921', fontFamily: FONTS.bodyMed, fontSize: 13 },
  copy: { gap: 7 },
  title: { color: theme.ink, fontFamily: FONTS.displaySemi, fontSize: 32, letterSpacing: -0.8 },
  body: { color: theme.inkSoft, fontFamily: FONTS.body, fontSize: 15, lineHeight: 22 },
  free: { color: theme.ink, fontFamily: FONTS.bodySemi, fontSize: 15, lineHeight: 22 },
  plusButton: {
    alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center',
    gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line,
  },
  setting: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11,
    borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.bg,
  },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { color: theme.ink, fontFamily: FONTS.bodySemi, fontSize: 14 },
  settingHint: { color: theme.inkSoft, fontFamily: FONTS.body, fontSize: 12 },
  footer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  next: {
    flex: 1, minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 14, backgroundColor: theme.cardDark,
  },
  nextText: { color: theme.cardDarkInk, fontFamily: FONTS.bodySemi, fontSize: 15 },
  pressed: { opacity: 0.72 },
});
