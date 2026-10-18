import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmeticIcon } from '@/components/pets/CosmeticIcon';
import { NOOK_H, NOOK_W } from '@/components/pets/NookScene';
import { Nook, NookView, useDoubleTap } from '@/components/pets/Nook';
import { FrameKind, NookFrameBack, NookFrameFront } from '@/components/pets/NookFrame';
import {
  DEFAULT_NOOK,
  isEasterSet,
  isSanctuarySet,
  lightingForHour,
  migrateNook,
  NookState,
  Offset,
  ROWS,
  SCENES,
  TOD_LABELS,
  toggleItem,
  webLevelFor,
  webNextText,
} from '@/components/pets/nookData';
import { Pill, SectionLabel } from '@/components/saint/Common';
import {
  ArrowIcon,
  BellIcon,
  PrayingIcon,
  ShieldIcon,
  SparkleIcon,
} from '@/components/saint/Icons';
import {
  FONTS,
  Theme,
  useTheme,
  useThemedStyles,
} from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { usePetProgress } from '@/lib/pet';
import { itemProductId, owns, sceneProductId, stripUnowned, unownedInNook, useOwned } from '@/lib/store';
import { relativeTime } from '@/lib/time';

const NOOK_KEY = 'nook.v1';
const FRAME_KEY = 'nook.frame';

type Stats = {
  offered: number;
  shared: number;
  sent: number;
  received: number;
};

type LatestPrayer = {
  age: string;
} | null;

export default function MeScreen() {
  const fontsLoaded = useSaintFonts();
  const { session, isGuest, signOut } = useAuth();
  const { theme: THEME } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [stats, setStats] = useState<Stats>({ offered: 0, shared: 0, sent: 0, received: 0 });
  const [latest, setLatest] = useState<LatestPrayer>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      (async () => {
        try {
        const userId = session.user.id;
        const [offered, shared, sent, received, latestRow] = await Promise.all([
          supabase
            .from('prayer_interactions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', 'prayed'),
          supabase
            .from('prayers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('reflections')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('reflections')
            .select('id, prayers!inner(user_id)', { count: 'exact', head: true })
            .eq('prayers.user_id', userId),
          supabase
            .from('prayers')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (cancelled) return;

        setStats({
          offered: offered.count ?? 0,
          shared: shared.count ?? 0,
          sent: sent.count ?? 0,
          received: received.count ?? 0,
        });
        setLatest(
          latestRow.data?.created_at
            ? { age: relativeTime(latestRow.data.created_at as string) }
            : null,
        );
        } catch (e) {
          console.warn('Me stats failed', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [session]),
  );

  const [deleting, setDeleting] = useState(false);
  const { petId, progress: petProgress } = usePetProgress();
  const { width: screenW } = useWindowDimensions();
  const nookW = Math.min(screenW - 44, 420);
  const [nook, setNook] = useState<NookState>(DEFAULT_NOOK);
  const lighting = useMemo(() => lightingForHour(new Date().getHours()), []);
  const { owned, loaded: ownedLoaded } = useOwned();
  // What is saved on this device. Previews of cosmetics the user does not own are shown but never land here.
  const savedNook = useRef<NookState>(DEFAULT_NOOK);
  useEffect(() => {
    AsyncStorage.getItem(NOOK_KEY)
      .then(raw => {
        if (!raw) return;
        const loadedNook = migrateNook(JSON.parse(raw));
        savedNook.current = loadedNook;
        setNook(loadedNook);
      })
      .catch(() => {});
  }, []);
  // Once we know what the user owns, drop any saved cosmetic they no longer own (for example a lapsed subscription).
  useEffect(() => {
    if (!ownedLoaded) return;
    const clean = stripUnowned(savedNook.current, owned, DEFAULT_NOOK);
    if (JSON.stringify(clean) === JSON.stringify(savedNook.current)) return;
    savedNook.current = clean;
    setNook(clean);
    AsyncStorage.setItem(NOOK_KEY, JSON.stringify(clean)).catch(() => {});
  }, [ownedLoaded, owned]);
  // The latest nook, for drag callbacks that fire after a gesture started on an older render.
  const nookRef = useRef(nook);
  useEffect(() => {
    nookRef.current = nook;
  }, [nook]);
  const onMoveItem = (id: string, offset: Offset) => {
    const current = nookRef.current;
    if (!current.items.includes(id)) return;
    updateNook({ ...current, offsets: { ...current.offsets, [id]: offset } });
  };
  const updateNook = (next: NookState) => {
    setNook(next);
    // Free and owned choices are remembered. As soon as a locked, unowned one is in the mix it is only a preview.
    if (unownedInNook(next, owned).length === 0) {
      savedNook.current = next;
      AsyncStorage.setItem(NOOK_KEY, JSON.stringify(next)).catch(() => {});
    }
  };
  // Leaving this tab (or the app reloading) throws previews away and restores the saved nook.
  useFocusEffect(
    useCallback(
      () => () => {
        setNook(savedNook.current);
      },
      [],
    ),
  );
  const previewing = unownedInNook(nook, owned).length > 0;

  // As the nook scrolls off the top, a smaller copy fades in and docks under the status bar, so cosmetics can be
  // tried on while browsing. Its fade follows the scroll position, so it eases in rather than popping.
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const nookBottom = useSharedValue(Number.POSITIVE_INFINITY);
  const [pinned, setPinned] = useState(false);
  // Double tapping anywhere on the page hides (or brings back) the pinned nook, for anyone who just wants to scroll.
  const [pinHidden, setPinHidden] = useState(false);
  const pageDoubleTap = useDoubleTap(() => {
    if (pinned) setPinHidden(h => !h);
  });
  const onNookLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    nookBottom.set(y + height);
  };
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });
  // Mount the pinned copy only while it can be seen, so the page does not run two animated nooks all the time.
  useAnimatedReaction(
    () => scrollY.value > nookBottom.value - 200,
    (now, prev) => {
      if (now !== prev) runOnJS(setPinned)(now);
    },
  );
  const pinnedStyle = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (scrollY.value - (nookBottom.value - 180)) / 110));
    return { opacity: t, transform: [{ translateY: (1 - t) * -18 }] };
  });
  const { height: screenH } = useWindowDimensions();
  const FADE_H = 40;
  // The pinned copy shows the whole nook, as big as a good share of the screen allows. The scene's own color fills
  // the space either side of it, so it reads as one wide band instead of a card.
  const pinnedH = Math.min(380, Math.round(screenH * 0.45));
  const pinnedW = Math.round(pinnedH * (NOOK_W / NOOK_H));
  // What surrounds the pinned nook, so the space either side of it is not empty. It alternates between clouds and a
  // wreath: the same one for the next two or three times the Me tab is opened, then the other one.
  const [frameKind, setFrameKind] = useState<FrameKind>('clouds');
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        let state: { kind: FrameKind; left: number } = { kind: 'wreath', left: 0 };
        try {
          const raw = await AsyncStorage.getItem(FRAME_KEY);
          if (raw) state = JSON.parse(raw);
        } catch {}
        if (state.left > 0) {
          state = { kind: state.kind, left: state.left - 1 };
        } else {
          // Time to switch; this showing counts as the first of the next run of 2 or 3.
          state = { kind: state.kind === 'clouds' ? 'wreath' : 'clouds', left: 1 + Math.floor(Math.random() * 2) };
        }
        if (cancelled) return;
        setFrameKind(state.kind);
        AsyncStorage.setItem(FRAME_KEY, JSON.stringify(state)).catch(() => {});
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );
  const webLevel = webLevelFor(stats.offered);

  const onSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your account, your prayers, the notes you sent, and the prayers others sent in response. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { data, error } = await supabase.functions.invoke('delete-account');
            if (error || data?.ok === false) {
              setDeleting(false);
              Alert.alert(
                'Could not delete account',
                error?.message || data?.error || 'Please try again in a moment.',
              );
              return;
            }
            await signOut();
            setDeleting(false);
            router.replace('/auth');
          },
        },
      ],
    );
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']} {...pageDoubleTap}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
          <Pill icon={<ShieldIcon size={11} color={THEME.pillInk} />}>
            {isGuest ? 'Anonymous session' : 'Always anonymous'}
          </Pill>
          <Text style={styles.title}>
            Your <Text style={styles.titleItalic}>walk</Text>
          </Text>
          <Text style={styles.subtitle}>A quiet record of prayers held — yours and theirs.</Text>

        </View>

        {/* Stats start at zero and fill in once the queries return, so the nook never waits on the network. */}
        {(
          <>
            <View style={{ paddingHorizontal: 22, marginTop: 20 }} onLayout={onNookLayout}>
              <Nook
                nook={nook}
                stats={stats}
                lighting={lighting}
                petId={petId}
                stage={petProgress.stage}
                width={nookW}
                editable
                onMoveItem={onMoveItem}
              />
              <View style={styles.legendRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText}>Prayer web · Level {webLevel}</Text>
                </View>
                <Text style={styles.legendText}>{TOD_LABELS[lighting]}</Text>
              </View>
              <Text style={styles.legendNext}>{webNextText(stats.offered, webLevel)}</Text>
              {isSanctuarySet(nook) ? (
                <View style={styles.setBanner}>
                  <Text style={styles.setBannerText}>Sanctuary set complete: golden light rises around your nook.</Text>
                </View>
              ) : null}
              {isEasterSet(nook) ? (
                <View style={styles.setBanner}>
                  <Text style={styles.setBannerText}>Easter set complete: lily petals drift through your nook.</Text>
                </View>
              ) : null}
            </View>

            <View style={{ paddingHorizontal: 22 }}>
              <Pressable
                onPress={() => router.push('/store')}
                accessibilityRole="button"
                accessibilityLabel="Visit the nook store"
                style={({ pressed }) => [styles.storeCard, pressed && { opacity: 0.88 }]}>
                <View style={styles.storeIcon}>
                  <CosmeticIcon kind="bundle" id="plus" size={30} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeTitle}>Visit the Nook Store</Text>
                  <Text style={styles.storeSub}>
                    New scenes and decor for your nook. Every purchase supports the Saint Central team.
                  </Text>
                </View>
                <ArrowIcon size={18} color={THEME.accent} />
              </Pressable>
              <View style={styles.decorHead}>
                <Text style={styles.decorTitle}>DECORATE YOUR NOOK</Text>
                <Pressable
                  onPress={() => router.push('/store')}
                  accessibilityRole="link"
                  hitSlop={8}
                  style={styles.storePill}>
                  <Text style={styles.storePillText}>Store</Text>
                </Pressable>
              </View>
              <Text style={styles.rowLabel}>Scene</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipScrollContent}>
                {SCENES.map(sc => (
                  <Pressable
                    key={sc.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: nook.scene === sc.id }}
                    onPress={() => updateNook({ ...nook, scene: sc.id })}
                    style={({ pressed }) => [
                      styles.chip,
                      nook.scene === sc.id && styles.chipOn,
                      pressed && styles.chipPressed,
                    ]}>
                    <CosmeticIcon kind="scene" id={sc.id} size={32} />
                    <Text style={styles.chipText}>{sc.name}</Text>
                    {sc.locked && !owns(owned, sceneProductId(sc.id)) ? <Text style={styles.lock}>{'\u{1F512}'}</Text> : null}
                  </Pressable>
                ))}
              </ScrollView>
              {ROWS.map(row => (
                <View key={row.slot}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                    contentContainerStyle={styles.chipScrollContent}>
                    {row.items.map(it => {
                      const on = nook.items.includes(it.id);
                      return (
                        <Pressable
                          key={it.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          onPress={() => updateNook(toggleItem(nook, it.id))}
                          style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.chipPressed]}>
                          <View style={{ opacity: on ? 1 : 0.6 }}>
                            <CosmeticIcon kind="item" id={it.id} size={30} />
                          </View>
                          <Text style={styles.chipText}>{it.name}</Text>
                          {it.locked && !owns(owned, itemProductId(it.id)) ? <Text style={styles.lock}>{'\u{1F512}'}</Text> : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
              {previewing ? (
                <View style={styles.previewBanner}>
                  <Text style={styles.previewText}>
                    Previewing cosmetics you don&apos;t own yet. They won&apos;t be saved.
                  </Text>
                  <Pressable onPress={() => router.push('/store')} style={styles.unlockBtn}>
                    <Text style={styles.unlockText}>Unlock</Text>
                  </Pressable>
                </View>
              ) : null}
              <Text style={styles.hint}>
                Tap to add or remove a piece, and mix as many as you like. Press and hold a piece in your nook, then drag it where you want it. Taking a piece out puts it back to its starting spot.
              </Text>
            </View>

            <SectionLabel style={{ paddingHorizontal: 22 }}>Your requests</SectionLabel>
            <View style={{ paddingHorizontal: 22 }}>
              <Pressable
                onPress={() => router.push('/myPrayers')}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                <View style={styles.ctaIcon}>
                  <PrayingIcon size={18} color={THEME.cardDarkInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>
                    {stats.shared === 0
                      ? 'No prayers yet'
                      : `${stats.shared} ${stats.shared === 1 ? 'prayer' : 'prayers'} held`}
                  </Text>
                  <Text style={styles.ctaSub}>
                    {stats.shared === 0
                      ? 'When you share one, it will be held here.'
                      : latest
                      ? `Most recent · ${latest.age} · open the calendar to revisit`
                      : 'Open to reflect on each one.'}
                  </Text>
                </View>
                <ArrowIcon size={16} color={THEME.muted} />
              </Pressable>
            </View>

            <SectionLabel style={{ paddingHorizontal: 22 }}>Settings</SectionLabel>
            <View style={{ paddingHorizontal: 22, gap: 10 }}>
              <Pressable
                onPress={() => router.push('/notificationSettings')}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                <View style={styles.ctaIcon}>
                  <BellIcon size={18} color={THEME.cardDarkInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>Notification settings</Text>
                  <Text style={styles.ctaSub}>
                    Notes, social-proof updates, and your daily reminder.
                  </Text>
                </View>
                <ArrowIcon size={16} color={THEME.muted} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/customization')}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                <View style={styles.ctaIcon}>
                  <SparkleIcon size={14} color={THEME.cardDarkInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>Customization</Text>
                  <Text style={styles.ctaSub}>Theme and app icon.</Text>
                </View>
                <ArrowIcon size={16} color={THEME.muted} />
              </Pressable>
            </View>

            <View style={styles.signOutWrap}>
              {isGuest ? (
                <View style={[styles.guestNotice, { alignSelf: 'stretch', marginTop: 0, marginBottom: 18 }]}>
                  <Text style={styles.guestNoticeText}>
                    You&apos;re signed in without an account. Signing out will mean these
                    prayers can&apos;t be reached again.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/createAccount')}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.guestBtnText}>Create an account to keep everything</Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
              {session?.user?.email ? (
                <Text style={styles.signOutFootnote}>Signed in as {session.user.email}</Text>
              ) : null}
              <Pressable
                onPress={onDeleteAccount}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  (pressed || deleting) && { opacity: 0.6 },
                ]}>
                {deleting ? (
                  <ActivityIndicator size="small" color={THEME.accent} />
                ) : (
                  <Text style={styles.deleteText}>Delete account</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </Animated.ScrollView>

      {pinned && !pinHidden ? (
        <Animated.View pointerEvents="box-none" style={[styles.pinnedWrap, { top: insets.top }, pinnedStyle]}>
          <View style={[styles.pinnedStrip, { height: pinnedH }]}>
            <Animated.View entering={FadeIn.duration(500)} pointerEvents="none" style={StyleSheet.absoluteFill}>
              <NookFrameBack kind={frameKind} width={screenW} height={pinnedH} nookW={pinnedW} nookH={pinnedH} />
            </Animated.View>
            <NookView
              compact
              bare
              nook={nook}
              stats={stats}
              lighting={lighting}
              petId={petId}
              stage={petProgress.stage}
              width={pinnedW}
            />
            <Animated.View entering={FadeIn.delay(150).duration(600)} pointerEvents="none" style={StyleSheet.absoluteFill}>
              <NookFrameFront kind={frameKind} width={screenW} height={pinnedH} nookW={pinnedW} nookH={pinnedH} />
            </Animated.View>
          </View>
          <LinearGradient
            pointerEvents="none"
            colors={[THEME.bg, `${THEME.bg}00`]}
            style={{ height: FADE_H }}
          />
        </Animated.View>
      ) : null}
      {pinned && pinHidden ? (
        <Pressable
          onPress={() => setPinHidden(false)}
          accessibilityRole="button"
          accessibilityLabel="Show the nook preview"
          style={[styles.showNookPill, { top: insets.top + 8 }]}>
          <Text style={styles.framePillText}>Show nook</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (THEME: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  title: {
    fontFamily: FONTS.display,
    fontSize: 48,
    lineHeight: 50,
    color: THEME.ink,
    marginTop: 18,
    letterSpacing: -0.6,
  },
  titleItalic: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', color: THEME.accent },
  subtitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: THEME.muted,
    marginTop: 8,
  },
  guestNotice: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: THEME.pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  guestBtn: {
    marginTop: 10,
    height: 40,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: THEME.accentInk },
  guestNoticeText: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: THEME.pillInk,
  },
  legendRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.accent },
  legendText: { fontFamily: FONTS.body, fontSize: 12, color: THEME.inkSoft },
  legendNext: { marginTop: 4, fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  setBanner: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: THEME.pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  setBannerText: { fontFamily: FONTS.body, fontSize: 13, color: THEME.pillInk },
  decorHead: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  decorTitle: { fontFamily: FONTS.bodySemi, fontSize: 11, letterSpacing: 1.6, color: THEME.accent },
  pinnedWrap: { position: 'absolute', left: 0, right: 0 },
  pinnedStrip: { alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.bg },
  showNookPill: {
    position: 'absolute',
    left: 12,
    height: 28,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(22,32,45,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  framePillText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: '#F2E9D8' },
  storeCard: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.accent,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitle: { fontFamily: FONTS.displaySemi, fontSize: 19, color: THEME.ink },
  storeSub: { fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 17, color: THEME.muted, marginTop: 3 },
  storePill: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePillText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: THEME.accentInk },
  rowLabel: { marginTop: 14, marginBottom: 8, fontFamily: FONTS.body, fontSize: 12, color: THEME.muted },
  // Each row of cosmetics scrolls sideways, so adding more never makes the page longer. The strip runs to the screen
  // edges (cancelling the page padding) so chips slide out from under the edge instead of being cut off early.
  chipScroll: { marginHorizontal: -22 },
  chipScrollContent: { paddingHorizontal: 22, gap: 8 },
  chip: {
    width: 96,
    minHeight: 78,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.line,
    alignItems: 'center',
    gap: 6,
  },
  chipOn: { borderColor: THEME.accent },
  chipPressed: { transform: [{ scale: 0.95 }] },
  chipText: { fontFamily: FONTS.body, fontSize: 11.5, lineHeight: 14, color: THEME.ink, textAlign: 'center' },
  lock: { position: 'absolute', top: 4, right: 6, fontSize: 9 },
  previewBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: THEME.pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  previewText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: THEME.pillInk },
  unlockBtn: { height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: THEME.accent, justifyContent: 'center' },
  unlockText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: THEME.accentInk },
  hint: { marginTop: 12, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: THEME.muted },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: THEME.ink,
  },
  ctaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
    lineHeight: 16,
  },

  signOutWrap: {
    paddingHorizontal: 22,
    marginTop: 32,
    alignItems: 'center',
  },
  signOutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.line,
    backgroundColor: THEME.surface,
  },
  signOutText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    letterSpacing: 0.6,
    color: THEME.ink,
  },
  signOutFootnote: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: THEME.muted,
    marginTop: 10,
  },
  deleteBtn: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12.5,
    letterSpacing: 0.5,
    color: THEME.accent,
  },
});
