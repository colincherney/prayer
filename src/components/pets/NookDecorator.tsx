import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { CloseIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { itemProductId, owns, sceneProductId, stripUnowned, unownedInNook } from '@/lib/store';

import { CosmeticIcon, CosmeticKind } from './CosmeticIcon';
import { NookStats, NookView } from './Nook';
import { NOOK_H, NOOK_W } from './NookScene';
import { Lighting, NookState, ROWS, SCENES, SlotId, toggleItem } from './nookData';
import { PipStage } from './PipLamb';
import { PetId } from './registry';
import { useNookTransition } from './useNookTransition';

type Props = {
  nook: NookState;
  owned: ReadonlySet<string>;
  stats: NookStats;
  lighting: Lighting;
  petId: PetId;
  stage: PipStage;
  onSave: (nook: NookState) => Promise<void>;
  onClose: () => void;
  onBrowse: (destination: '/store' | '/quests') => void;
};

type Category = 'scene' | SlotId;
type Choice = {
  id: string;
  name: string;
  kind: CosmeticKind;
  available: boolean;
  selected: boolean;
};

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'scene', label: 'Scenes' },
  ...ROWS.map(row => ({ id: row.slot, label: row.label })),
];

/** A separate workspace keeps the Me page quiet and the room visible while choosing decor. */
export function NookDecorator({ nook, owned, stats, lighting, petId, stage, onSave, onClose, onBrowse }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(nook);
  const [category, setCategory] = useState<Category>('scene');
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { motionStyle, dismiss } = useNookTransition(onClose, true);
  const availableHeight = height - insets.top - insets.bottom;
  const previewHeight = Math.min(300, Math.max(100, availableHeight - 520), availableHeight * 0.34);
  const previewWidth = Math.min(width - 44, previewHeight * NOOK_W / NOOK_H);
  const previewing = unownedInNook(draft, owned).length > 0;
  const earnedPreview = ROWS.flatMap(row => row.items).find(
    item => item.earned && draft.items.includes(item.id) && !owns(owned, itemProductId(item.id)),
  );
  const choices: Choice[] = category === 'scene'
    ? SCENES.map(scene => ({
      id: scene.id,
      name: scene.name,
      kind: 'scene',
      available: !scene.locked || owns(owned, sceneProductId(scene.id)),
      selected: draft.scene === scene.id,
    }))
    : (ROWS.find(row => row.slot === category)?.items ?? []).map(item => ({
      id: item.id,
      name: item.name,
      kind: 'item',
      available: !item.locked || owns(owned, itemProductId(item.id)),
      selected: draft.items.includes(item.id),
    }));
  const visibleChoices = choices.filter(choice => showAll || choice.available || choice.selected);

  const save = async () => {
    if (saving || previewing) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      dismiss();
    } catch {
      setError('Your changes could not be saved. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => { if (!saving) dismiss(); }}>
      <Animated.View style={[styles.root, motionStyle]}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
          <View style={styles.workspace}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>MAKE YOURSELF AT HOME</Text>
                <Text accessibilityRole="header" style={styles.title}>Decorate your nook</Text>
              </View>
              <Pressable
                onPress={() => dismiss()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Cancel decorating"
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <CloseIcon size={20} color={theme.ink} />
              </Pressable>
            </View>

            <View style={styles.preview}>
              <NookView
                nook={draft}
                stats={stats}
                lighting={lighting}
                petId={petId}
                stage={stage}
                width={previewWidth}
                compact
                editable={!saving}
                onMoveItem={(id, offset) => setDraft(current => current.items.includes(id)
                  ? { ...current, offsets: { ...current.offsets, [id]: offset } }
                  : current)}
              />
              <View style={styles.previewCaption}>
                <Text accessibilityLiveRegion="polite" style={styles.hint}>
                  {previewing ? 'Preview only · unlock or remove previews to save.' : 'Hold a piece in your nook to move it.'}
                </Text>
                <Pressable
                  onPress={() => setDraft(current => ({ ...current, offsets: {} }))}
                  disabled={saving || Object.keys(draft.offsets).length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Reset decor positions"
                  style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
                  <Text style={[styles.textLink, Object.keys(draft.offsets).length === 0 && styles.muted]}>Reset positions</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.catalog}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categories}
                contentContainerStyle={styles.categoryContent}>
                {CATEGORIES.map(tab => (
                  <Pressable
                    key={tab.id}
                    onPress={() => setCategory(tab.id)}
                    disabled={saving}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: category === tab.id }}
                    style={[styles.category, category === tab.id && styles.categorySelected]}>
                    <Text style={[styles.categoryText, category === tab.id && styles.categoryTextSelected]}>{tab.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.collectionHeader}>
                <View style={styles.filters}>
                  {[{ label: 'My collection', all: false }, { label: 'Explore all', all: true }].map(filter => (
                    <Pressable
                      key={filter.label}
                      onPress={() => setShowAll(filter.all)}
                      disabled={saving}
                      accessibilityRole="button"
                      accessibilityState={{ selected: showAll === filter.all }}
                      style={[styles.filter, showAll === filter.all && styles.filterSelected]}>
                      <Text style={[styles.filterText, showAll === filter.all && styles.filterTextSelected]}>{filter.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={() => dismiss(() => onBrowse('/store'))}
                  disabled={saving}
                  accessibilityRole="link"
                  style={styles.storeLink}>
                  <Text style={styles.textLink}>Store</Text>
                </Pressable>
              </View>

              <FlatList
                key={`${category}-${showAll}`}
                data={visibleChoices}
                numColumns={2}
                keyExtractor={choice => choice.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.gridRow}
                ListHeaderComponent={previewing ? (
                  <View style={styles.previewNotice}>
                    <Text accessibilityLiveRegion="polite" style={styles.noticeText}>
                      {earnedPreview ? `${earnedPreview.name}: ${earnedPreview.earned}.` : 'Some choices are previews. Unlock them or remove previews to save.'}
                    </Text>
                    <View style={styles.noticeActions}>
                      <Pressable
                        onPress={() => setDraft(current => stripUnowned(current, owned, nook))}
                        accessibilityRole="button"
                        style={styles.noticeAction}>
                        <Text style={styles.textLink}>Remove previews</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => dismiss(() => onBrowse(earnedPreview ? '/quests' : '/store'))}
                        accessibilityRole="link"
                        style={styles.noticeAction}>
                        <Text style={styles.textLink}>{earnedPreview ? 'View quests' : 'Unlock in store'}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : undefined}
                renderItem={({ item: choice }) => (
                  <Pressable
                    onPress={() => setDraft(current => category === 'scene'
                      ? { ...current, scene: SCENES.find(scene => scene.id === choice.id)!.id }
                      : toggleItem(current, choice.id))}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={`${choice.name}. ${choice.selected ? (choice.available ? 'In your nook' : 'Previewing') : (choice.available ? 'Add to nook' : 'Preview only')}`}
                    accessibilityState={{ selected: choice.selected }}
                    style={({ pressed }) => [styles.card, choice.selected && styles.cardSelected, pressed && styles.pressed]}>
                    <View style={styles.cardArt}>
                      <CosmeticIcon kind={choice.kind} id={choice.id} size={46} />
                      {choice.selected ? (
                        <View style={styles.check}>
                          <Svg width={12} height={12} viewBox="0 0 12 12">
                            <Path d="M2.5 6 L5 8.5 L9.5 3.5" stroke={theme.accentInk} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </Svg>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardName}>{choice.name}</Text>
                    <Text style={[styles.cardStatus, choice.selected && styles.selectedText]}>
                      {!choice.available ? (choice.selected ? 'Previewing' : 'Preview only') : choice.selected ? 'In your nook' : 'Tap to add'}
                    </Text>
                  </Pressable>
                )}
              />
            </View>

            <View style={styles.footer}>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <View style={styles.footerActions}>
                <Pressable
                  onPress={() => dismiss()}
                  disabled={saving}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  disabled={saving || previewing}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: saving || previewing, busy: saving }}
                  style={({ pressed }) => [styles.saveButton, (saving || previewing) && styles.disabled, pressed && styles.pressed]}>
                  {saving ? <ActivityIndicator size="small" color={theme.accentInk} /> : <Text style={styles.saveText}>Save changes</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  safe: { flex: 1 },
  workspace: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { fontFamily: FONTS.bodySemi, fontSize: 9, letterSpacing: 1.8, color: theme.accent, marginBottom: 4 },
  title: { fontFamily: FONTS.displaySemi, fontSize: 29, lineHeight: 34, color: theme.ink },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.bgSoft, alignItems: 'center', justifyContent: 'center' },
  preview: { alignItems: 'center', paddingHorizontal: 22 },
  previewCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', columnGap: 12, paddingVertical: 4 },
  hint: { fontFamily: FONTS.body, fontSize: 11, color: theme.inkSoft },
  reset: { minHeight: 32, justifyContent: 'center' },
  textLink: { fontFamily: FONTS.bodySemi, fontSize: 12, color: theme.accent },
  muted: { color: theme.muted },
  catalog: { flex: 1, minHeight: 0 },
  categories: { flexGrow: 0, flexShrink: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
  categoryContent: { paddingHorizontal: 22, gap: 22 },
  category: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  categorySelected: { borderBottomColor: theme.accent },
  categoryText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.inkSoft },
  categoryTextSelected: { color: theme.accent },
  collectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 10, gap: 8 },
  filters: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: theme.bgSoft },
  filter: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 9 },
  filterSelected: { backgroundColor: theme.surface },
  filterText: { fontFamily: FONTS.body, fontSize: 11, color: theme.inkSoft },
  filterTextSelected: { fontFamily: FONTS.bodySemi, color: theme.ink },
  storeLink: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  grid: { paddingHorizontal: 22, paddingBottom: 16, gap: 10 },
  gridRow: { gap: 10 },
  card: { flex: 1, maxWidth: '50%', padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.surface },
  cardSelected: { borderColor: theme.accent, backgroundColor: theme.pillBg },
  cardArt: { height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  check: { position: 'absolute', right: 0, top: 0, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent },
  cardName: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 17, color: theme.ink },
  cardStatus: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 15, color: theme.inkSoft, marginTop: 3 },
  selectedText: { color: theme.accent },
  pressed: { opacity: 0.75 },
  footer: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  footerActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { minWidth: 88, minHeight: 48, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.line, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.inkSoft },
  saveButton: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center' },
  saveText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: theme.accentInk },
  disabled: { opacity: 0.45 },
  previewNotice: { backgroundColor: theme.pillBg, borderRadius: 14, paddingHorizontal: 12, paddingTop: 10, marginBottom: 10 },
  noticeText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, color: theme.pillInk },
  noticeActions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  noticeAction: { minHeight: 40, justifyContent: 'center' },
  error: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: theme.accent, marginBottom: 10 },
});
