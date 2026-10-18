import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmeticIcon } from '@/components/pets/CosmeticIcon';
import { NookView } from '@/components/pets/Nook';
import { DEFAULT_NOOK, ITEM_META, lightingForHour, NookState } from '@/components/pets/nookData';
import { NOOK_H, NOOK_W } from '@/components/pets/NookScene';
import { BackIcon } from '@/components/saint/Icons';
import { FONTS, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { usePetChoice } from '@/lib/pet';
import { formatPrice, owns, PLUS_PRODUCT, Product, useStore } from '@/lib/store';

const NO_STATS = { offered: 0, shared: 0, sent: 0, received: 0 };

/** A nook that shows off a product: scenes get a bare nook, decor goes in its spot, the bundle shows the Sanctuary set. */
function showcaseNook(product: Product): NookState {
  const base: NookState = { scene: DEFAULT_NOOK.scene, items: [...DEFAULT_NOOK.items], offsets: {} };
  if (product.kind === 'bundle') {
    return { scene: 'chapel', items: ['cushion', 'censer', 'plant', 'glass', 'mobile'], offsets: {} };
  }
  const id = product.id.split(':')[1];
  if (product.kind === 'scene') return { ...base, scene: id as NookState['scene'] };
  // Show decor in a calm scene so the piece stands out; stained glass looks best in the chapel. A piece that
  // would sit on the same spot as a default item replaces it.
  const meta = ITEM_META[id];
  const items = base.items.filter(existing => ITEM_META[existing]?.slot !== meta?.slot);
  return { scene: id === 'glass' ? 'chapel' : base.scene, items: [...items, id], offsets: {} };
}

type RowProps = { product: Product; owned: boolean; onOpen: () => void };

function ProductRow({ product, owned, onOpen }: RowProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${owned ? 'owned' : formatPrice(product)}. Opens details.`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={styles.swatch}>
        <CosmeticIcon kind={product.kind} id={product.id.split(':')[1] ?? product.id} size={34} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{product.name}</Text>
        <Text style={styles.rowSub}>
          {product.group ? `${product.group} · ` : ''}
          {product.kind === 'scene' ? 'Scene' : product.kind === 'bundle' ? 'Every cosmetic' : 'Decor'}
        </Text>
      </View>
      {owned ? (
        <Text style={styles.owned}>Owned</Text>
      ) : (
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{formatPrice(product)}</Text>
        </View>
      )}
    </Pressable>
  );
}

type DetailProps = {
  product: Product | null;
  owned: boolean;
  busy: boolean;
  /** Anonymous sessions can look at the store but need an account before buying. */
  needsAccount: boolean;
  onClose: () => void;
  onBuy: (p: Product) => void;
  onCreateAccount: () => void;
};

/** Full-screen window for one product: a live preview in a nook, what it is, and the buy button. */
function ProductDetail({ product, owned, busy, needsAccount, onClose, onBuy, onCreateAccount }: DetailProps) {
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width: sw, height: sh } = useWindowDimensions();
  const { petId } = usePetChoice();
  // Leave room for the header, the text block and the button under the preview.
  const maxH = sh - insets.top - insets.bottom - 290;
  const previewW = Math.max(180, Math.min(sw - 44, maxH * (NOOK_W / NOOK_H)));

  return (
    <Modal
      visible={product !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      supportedOrientations={['portrait']}
      onRequestClose={onClose}>
      {/* Tapping the margin around the content (the edges of the screen) closes the window. */}
      <Pressable
        onPress={onClose}
        accessible={false}
        style={[styles.detail, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        {/* This view swallows touches so taps on the content itself don't close it. */}
        <View style={styles.detailContent} onStartShouldSetResponder={() => true}>
        <View style={styles.detailTop}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.backBtn}>
            <Text style={styles.closeX}>{'×'}</Text>
          </Pressable>
        </View>
        {product ? (
          <>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <NookView
                nook={showcaseNook(product)}
                stats={NO_STATS}
                lighting={lightingForHour(new Date().getHours())}
                petId={petId}
                stage={2}
                width={previewW}
              />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailKind}>
                {product.kind === 'bundle' ? 'SAINT CENTRAL+' : product.kind === 'scene' ? 'SCENE' : (product.group ?? 'DECOR').toUpperCase()}
              </Text>
              <Text style={styles.detailName}>{product.name}</Text>
              <Text style={styles.detailBlurb}>
                {product.kind === 'bundle'
                  ? 'Support us, the Saint Central team. Get every scene and decor piece, plus anything we add later. Praying and growing your companion always stay free.'
                  : product.kind === 'scene'
                    ? 'A new backdrop for your nook. Cosmetic only; it never changes how your companion grows.'
                    : 'A piece for your nook. Cosmetic only; it never changes how your companion grows.'}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {owned ? (
              <View style={[styles.detailBtn, styles.detailBtnOwned]}>
                <Text style={styles.detailOwnedText}>{product.kind === 'bundle' ? 'You are subscribed' : 'You own this'}</Text>
              </View>
            ) : needsAccount ? (
              <>
                <Text style={styles.accountNote}>
                  Purchases need an account so you never lose what you buy, even if you change phones.
                </Text>
                <Pressable
                  onPress={onCreateAccount}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.detailBtn, pressed && { opacity: 0.75 }]}>
                  <Text style={styles.detailBtnText}>Create an account to buy</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => onBuy(product)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`Buy ${product.name} for ${formatPrice(product)}`}
                style={({ pressed }) => [styles.detailBtn, (pressed || busy) && { opacity: 0.75 }]}>
                {busy ? (
                  <ActivityIndicator color={THEME.accentInk} />
                ) : (
                  <Text style={styles.detailBtnText}>
                    {product.kind === 'bundle' ? 'Get Saint Central+' : 'Buy'} · {formatPrice(product)}
                  </Text>
                )}
              </Pressable>
            )}
          </>
        ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

export default function StoreScreen() {
  const fontsLoaded = useSaintFonts();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { catalog, owned, loaded, buying, buy, refresh } = useStore();
  const { isGuest } = useAuth();
  const [selected, setSelected] = useState<Product | null>(null);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  const onBuy = async (product: Product) => {
    const result = await buy(product.id);
    if (!result.ok) Alert.alert('Saint Central+', result.message);
  };

  const bundle = catalog.find(p => p.id === PLUS_PRODUCT);
  const scenes = catalog.filter(p => p.kind === 'scene');
  const items = catalog.filter(p => p.kind === 'item');
  const hasPlus = owned.has(PLUS_PRODUCT);

  const renderRow = (p: Product) => (
    <ProductRow key={p.id} product={p} owned={owns(owned, p.id)} onOpen={() => setSelected(p)} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <BackIcon size={15} color={THEME.ink} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={styles.title}>
            Nook <Text style={styles.titleItalic}>store</Text>
          </Text>
          <Text style={styles.subtitle}>
            Cosmetics for your nook. Praying and growing your companion always stay free.
          </Text>
        </View>

        {isGuest ? (
          <Pressable
            onPress={() => router.push('/createAccount')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.accountBanner, pressed && { opacity: 0.85 }]}>
            <Text style={styles.accountBannerTitle}>Create an account to buy</Text>
            <Text style={styles.accountBannerBody}>
              Purchases are tied to your account, so you never lose them. Your prayers and companion come along.
            </Text>
          </Pressable>
        ) : null}

        {bundle ? (
          <Pressable
            onPress={() => setSelected(bundle)}
            accessibilityRole="button"
            accessibilityLabel="Saint Central+, every scene and decor piece. Opens details."
            style={({ pressed }) => [styles.bundle, pressed && { opacity: 0.9 }]}>
            <Text style={styles.bundleTag}>SAINT CENTRAL+</Text>
            <Text style={styles.bundleTitle}>Every scene and decor piece</Text>
            <Text style={styles.bundleBody}>
              Support us, the Saint Central team. Unlock every scene and decor piece now, and anything we add later.
            </Text>
            <View style={styles.bundleBtn}>
              <Text style={styles.bundleBtnText}>
                {hasPlus ? 'You are subscribed. Thank you!' : `See Saint Central+ · ${formatPrice(bundle)}`}
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Text style={styles.section}>SCENES</Text>
        <View style={styles.list}>{scenes.map(renderRow)}</View>

        <Text style={styles.section}>DECOR</Text>
        <View style={styles.list}>{items.map(renderRow)}</View>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Pressable onPress={refresh} accessibilityRole="button" style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Text style={styles.restore}>{loaded ? 'Restore purchases' : 'Loading…'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ProductDetail
        product={selected}
        owned={selected ? owns(owned, selected.id) : false}
        busy={selected !== null && buying === selected.id}
        needsAccount={isGuest}
        onClose={() => setSelected(null)}
        onBuy={onBuy}
        onCreateAccount={() => {
          setSelected(null);
          router.push('/createAccount');
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  topRow: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { color: THEME.ink, fontSize: 24, lineHeight: 26 },
  title: { fontFamily: FONTS.display, fontSize: 40, lineHeight: 44, color: THEME.ink, marginTop: 14 },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.muted, marginTop: 8 },
  bundle: {
    marginHorizontal: 22,
    marginTop: 22,
    padding: 18,
    borderRadius: 22,
    backgroundColor: THEME.cardDark,
    gap: 6,
  },
  bundleTag: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.6, color: THEME.accent },
  bundleTitle: { fontFamily: FONTS.displaySemi, fontSize: 22, color: THEME.cardDarkInk },
  bundleBody: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: THEME.cardDarkInk, opacity: 0.8 },
  bundleBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleBtnText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: THEME.accentInk },
  section: {
    marginTop: 26,
    marginBottom: 10,
    paddingHorizontal: 22,
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    letterSpacing: 1.6,
    color: THEME.accent,
  },
  list: { paddingHorizontal: 22, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  swatch: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: THEME.bgSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { fontFamily: FONTS.bodySemi, fontSize: 15, color: THEME.ink },
  rowSub: { fontFamily: FONTS.body, fontSize: 12, color: THEME.muted, marginTop: 2 },
  pricePill: {
    minWidth: 64,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: THEME.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.pillInk },
  owned: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.accent, paddingHorizontal: 8 },
  restore: { fontFamily: FONTS.bodySemi, fontSize: 13, letterSpacing: 0.4, color: THEME.accent },

  accountBanner: {
    marginHorizontal: 22,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: THEME.pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    gap: 4,
  },
  accountBannerTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: THEME.pillInk },
  accountBannerBody: { fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 18, color: THEME.pillInk, opacity: 0.85 },
  accountNote: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: THEME.muted, textAlign: 'center', marginBottom: 12 },
  detail: { flex: 1, backgroundColor: THEME.bg, paddingHorizontal: 22 },
  detailContent: { flex: 1 },
  detailTop: { flexDirection: 'row', justifyContent: 'flex-start' },
  detailBody: { marginTop: 18, gap: 6 },
  detailKind: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.6, color: THEME.accent },
  detailName: { fontFamily: FONTS.displaySemi, fontSize: 30, lineHeight: 34, color: THEME.ink },
  detailBlurb: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: THEME.muted },
  detailBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnOwned: { backgroundColor: THEME.pillBg },
  detailBtnText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: THEME.accentInk },
  detailOwnedText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: THEME.pillInk },
});
