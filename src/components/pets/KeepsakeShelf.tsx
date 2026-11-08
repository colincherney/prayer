import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS, Theme, useThemedStyles } from '@/components/saint/theme';
import { saveToCloud } from '@/lib/cloudProgress';
import { LOCAL_KEYS, readLocal, writeLocal } from '@/lib/localCache';
import { TRINKET_ORDER, TrinketStatus } from '@/lib/trinkets';

import { RARITY_COLOR, TrinketArt } from './Trinket';
import { TRINKET_INFO, TrinketId } from './trinketArt';

const SLOT_COUNT = 5;
const ART = 46;
const HOP = 14;
const PILL_MS = 1500;
const PILL_W = 180;
const LOCKED_MESSAGE = 'Complete more quests';
const RARITIES = ['legendary', 'epic', 'rare', 'common'] as const;
type RarityFilter = 'all' | (typeof RARITIES)[number];
const FILTERS: RarityFilter[] = ['all', ...RARITIES];

type Props = {
  trinkets: TrinketStatus[];
  onOpen: () => void;
};

/** The keepsakes you chose to show, in the order you chose them. Kept on this device, like the nook. */
function useShelfPicks() {
  const [picks, setPicks] = useState<TrinketId[]>(() => {
    const saved = readLocal<unknown>(LOCAL_KEYS.shelfPicks);
    return Array.isArray(saved) ? saved.filter((id): id is TrinketId => id in TRINKET_INFO) : [];
  });
  const toggle = (id: TrinketId) => {
    const next = picks.includes(id) ? picks.filter(pick => pick !== id) : [...picks, id];
    if (next.length > SLOT_COUNT) return;
    setPicks(next);
    writeLocal(LOCAL_KEYS.shelfPicks, next).catch(() => {});
    saveToCloud('shelf_picks', next);
  };
  return { picks, toggle };
}

function KeepsakePicker({ earned, picks, onToggle, onClose }: {
  earned: TrinketStatus[];
  picks: TrinketId[];
  onToggle: (id: TrinketId) => void;
  onClose: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<RarityFilter>('all');
  const rarityOf = (t: TrinketStatus) => TRINKET_INFO[t.id].rarity;
  const shown = earned
    .filter(t => filter === 'all' || rarityOf(t) === filter)
    .sort((a, b) => RARITIES.indexOf(rarityOf(a)) - RARITIES.indexOf(rarityOf(b)));
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close keepsake picker" style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} accessibilityViewIsModal>
        <View style={styles.sheetHeading}>
          <Text accessibilityRole="header" style={styles.sheetTitle}>Your shelf</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={styles.editText}>Done</Text>
          </Pressable>
        </View>
        <Text style={styles.sheetNote}>
          {picks.length} of {SLOT_COUNT} chosen. {picks.length ? 'Tap one to take it off.' : 'Until you choose, your newest show.'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(option => (
            <Pressable key={option} onPress={() => setFilter(option)} accessibilityRole="button"
              accessibilityState={{ selected: filter === option }} style={[styles.filter, filter === option && styles.filterOn]}>
              <Text style={[styles.filterText, filter === option && styles.filterTextOn]}>{option}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView style={styles.pickerList} contentContainerStyle={styles.pickerGrid}>
          {shown.length ? shown.map(t => {
            const place = picks.indexOf(t.id);
            const full = place < 0 && picks.length >= SLOT_COUNT;
            const rarity = rarityOf(t);
            return (
              <Pressable key={t.id} onPress={() => onToggle(t.id)} disabled={full} accessibilityRole="checkbox"
                accessibilityLabel={`${TRINKET_INFO[t.id].name}, ${rarity}`} accessibilityState={{ checked: place >= 0, disabled: full }}
                style={[styles.tile, { borderColor: place >= 0 ? RARITY_COLOR[rarity] : 'transparent' }, full && styles.tileFull]}>
                <TrinketArt id={t.id} size={54} animated={false} />
                <Text numberOfLines={2} style={styles.tileName}>{TRINKET_INFO[t.id].name}</Text>
                <Text style={[styles.tileRarity, { color: RARITY_COLOR[rarity] }]}>{rarity}</Text>
                {place >= 0 ? (
                  <View style={[styles.tileBadge, { backgroundColor: RARITY_COLOR[rarity] }]}>
                    <Text style={styles.tileBadgeText}>{place + 1}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }) : (
            <Text style={styles.sheetNote}>{filter === 'all' ? 'You haven\'t earned any keepsakes yet.' : `You haven't earned any ${filter} keepsakes yet.`}</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Slot({ trinket, onTap, onLongPress }: { trinket?: TrinketStatus; onTap: () => void; onLongPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const hop = useSharedValue(0);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.get() }] }));
  const earned = !!trinket?.earned;
  const onPress = () => {
    if (earned && !reducedMotion) {
      hop.set(withSequence(
        withTiming(-HOP, { duration: 130, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 7, stiffness: 190 }),
      ));
    }
    onTap();
  };
  const label = !trinket
    ? 'Empty keepsake slot'
    : `${TRINKET_INFO[trinket.id].name}, ${earned ? 'keepsake' : 'not earned yet'}`;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={label} style={styles.card}>
      {trinket ? (
        <>
          <Animated.View style={hopStyle}>
            <TrinketArt id={trinket.id} size={ART} animated={false} dim={!earned} />
          </Animated.View>
          <Text style={[styles.number, !earned && styles.numberLocked]}>
            {String(TRINKET_ORDER.indexOf(trinket.id) + 1).padStart(3, '0')}
          </Text>
        </>
      ) : null}
    </Pressable>
  );
}

/** A row of keepsake cards: what you've earned, then faded previews of what's still to come. */
export function KeepsakeShelf({ trinkets, onOpen }: Props) {
  const styles = useThemedStyles(makeStyles);
  const earned = trinkets.filter(t => t.earned);
  const locked = trinkets.filter(t => !t.earned);
  const { picks, toggle } = useShelfPicks();
  const [picking, setPicking] = useState(false);
  const chosen = picks.flatMap(id => earned.find(t => t.id === id) ?? []);
  const shown = chosen.length
    ? [...chosen, ...locked].slice(0, SLOT_COUNT)
    : [...earned.slice(-SLOT_COUNT), ...locked]
      .slice(0, SLOT_COUNT)
      .sort((a, b) => TRINKET_ORDER.indexOf(a.id) - TRINKET_ORDER.indexOf(b.id));
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => shown[index]);

  const [pill, setPill] = useState<{ slot: number; text: string } | null>(null);
  const pillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (pillTimer.current) clearTimeout(pillTimer.current);
  }, []);
  const showPill = (slot: number, text: string) => {
    setPill({ slot, text });
    AccessibilityInfo.announceForAccessibility(text);
    if (pillTimer.current) clearTimeout(pillTimer.current);
    pillTimer.current = setTimeout(() => setPill(null), PILL_MS);
  };
  // The end slots hug the sides so a long name stays on the screen.
  const pillPosition = !pill
    ? null
    : pill.slot === 0
      ? { left: 0, alignItems: 'flex-start' as const }
      : pill.slot === SLOT_COUNT - 1
        ? { right: 0, alignItems: 'flex-end' as const }
        : { left: `${((pill.slot + 0.5) / SLOT_COUNT) * 100}%` as const, marginLeft: -PILL_W / 2, alignItems: 'center' as const };

  return (
    <Pressable onLongPress={onOpen} accessible={false}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>Keepsakes</Text>
        <View style={styles.headingActions}>
          <Pressable onPress={() => setPicking(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Choose which keepsakes to show">
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onOpen} hitSlop={10} accessibilityRole="link"
            accessibilityLabel={`Keepsakes, ${earned.length} of ${trinkets.length} collected. Open your trinket shelf.`} style={styles.count}>
            <Text style={styles.countText}>{earned.length} / {trinkets.length}</Text>
          </Pressable>
        </View>
      </View>
      <View>
        <View style={styles.cards}>
          {slots.map((trinket, index) => (
            <Slot key={trinket?.id ?? `empty-${index}`} trinket={trinket} onLongPress={onOpen}
              onTap={() => showPill(index, trinket?.earned ? TRINKET_INFO[trinket.id].name : LOCKED_MESSAGE)} />
          ))}
        </View>
        {pill && pillPosition ? (
          <View pointerEvents="none" style={[styles.pillRow, pillPosition]}>
            <View style={styles.pill}>
              <Text numberOfLines={1} style={styles.pillText}>{pill.text}</Text>
            </View>
          </View>
        ) : null}
      </View>
      {picking ? <KeepsakePicker earned={earned} picks={picks} onToggle={toggle} onClose={() => setPicking(false)} /> : null}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headingActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editText: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 18, color: theme.accent },
  title: { fontFamily: FONTS.display, fontSize: 16, lineHeight: 22, color: theme.ink },
  count: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: theme.accent },
  countText: { fontFamily: FONTS.bodySemi, fontSize: 11, lineHeight: 16, fontVariant: ['lining-nums'], color: theme.accent },
  cards: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, height: 82, paddingBottom: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'flex-end' },
  number: { fontFamily: FONTS.display, fontSize: 12, lineHeight: 16, fontVariant: ['lining-nums'], color: theme.accent },
  numberLocked: { color: theme.muted },
  pillRow: { position: 'absolute', top: -28, width: PILL_W },
  pill: { maxWidth: PILL_W, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: '#F2E9D8' },
  pillText: { fontFamily: FONTS.bodyBold, fontSize: 12, lineHeight: 16, color: '#1A2230' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', paddingHorizontal: 22, paddingTop: 18, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: theme.surface },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 28, color: theme.ink },
  sheetNote: { marginTop: 4, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: theme.inkSoft },
  filters: { flexGrow: 0, marginTop: 12 },
  filterRow: { gap: 8 },
  filter: { minHeight: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: theme.line, justifyContent: 'center' },
  filterOn: { borderColor: theme.accent, backgroundColor: theme.accent },
  filterText: { fontFamily: FONTS.bodySemi, fontSize: 12, textTransform: 'capitalize', color: theme.ink },
  filterTextOn: { color: theme.accentInk },
  pickerList: { marginTop: 12 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  tile: { width: '31%', minHeight: 116, padding: 6, borderRadius: 14, borderWidth: 2, backgroundColor: theme.bgSoft, alignItems: 'center' },
  tileFull: { opacity: 0.45 },
  tileName: { fontFamily: FONTS.display, fontSize: 11, lineHeight: 14, color: theme.ink, textAlign: 'center' },
  tileRarity: { marginTop: 1, fontFamily: FONTS.bodySemi, fontSize: 10, lineHeight: 13, textTransform: 'capitalize' },
  tileBadge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tileBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 10, lineHeight: 13, fontVariant: ['lining-nums'], color: '#1A2230' },
});
