import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { NookDecorator } from '@/components/pets/NookDecorator';
import { Nook } from '@/components/pets/Nook';
import { KeepsakeShelf } from '@/components/pets/KeepsakeShelf';
import { ALCOVE_SILL_H, MEDALLION_RISE, NookAlcove } from '@/components/pets/NookAlcove';
import {
  DEFAULT_NOOK,
  lightingForHour,
  migrateNook,
  NookState,
} from '@/components/pets/nookData';
import {
  ArrowIcon,
  BellIcon,
  PrayingIcon,
  SparkleIcon,
  StarIcon,
  UserIcon,
} from '@/components/saint/Icons';
import { Squiggle } from '@/components/saint/Common';
import { PageAmbience } from '@/components/saint/PageAmbience';
import { FONTS, mixColors, Theme, useTheme, useThemedStyles } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { saveToCloud, useCloudVersion } from '@/lib/cloudProgress';
import { afterLaunch } from '@/lib/launch';
import { LOCAL_KEYS, readForUser, readLocal, writeForUser, writeLocal } from '@/lib/localCache';
import { supabase } from '@/lib/supabase';
import { usePetProgress } from '@/lib/pet';
import { stripUnowned, useOwned } from '@/lib/store';
import { useTrinkets } from '@/lib/trinkets';

const TAB_BAR_SPACE = 92;
/** Space between the header and the top of the medallion. */
const MEDALLION_TOP_GAP = 4;
const ARCH_TOP = MEDALLION_TOP_GAP + MEDALLION_RISE;
const PAGE_MARGIN = 24;
/** Room for an Inter button label, its icon, and padding before the actions stack. */
const ACTION_MIN_WIDTH = 156;
/** Height of the title row: its top padding and the gear. */
const HEADER_H = 52;
const ARCH_MARGIN = 30;
/** The arch's height for its width, about 400dp on a 390x844 screen. This shape shows the scene's full width. */
const ARCH_RATIO = 400 / 330;
/** Below this the arch stops shrinking and the page scrolls instead. */
const MIN_ARCH = 220;
/** Keepsakes and buttons, used until they have been measured. */
const BELOW_ESTIMATE = 186;
const TILE_PITCH = 18;
const TILES_W = 230;
const TILES_H = 380;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CORNER_TILES_STYLE = { position: 'absolute', right: 0, bottom: 0 } as const;

/** Keep press feedback on the UI thread, just like the scene's pet animations. */
function NookButton({ children, style, disabled, ...props }: Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const feedback = useAnimatedStyle(() => ({
    opacity: 1 - pressed.get() * 0.22,
    transform: [{ scale: reducedMotion ? 1 : 1 - pressed.get() * 0.025 }],
  }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...props}
      disabled={disabled}
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled }}
      onPressIn={() => pressed.set(withTiming(1, { duration: reducedMotion ? 0 : 120 }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: reducedMotion ? 0 : 180 }))}
      style={[style, feedback, disabled && { opacity: 0.45 }]}>
      {children}
    </AnimatedPressable>
  );
}

function GearIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Svg>
  );
}

/** A quiet grid of soft tiles and one diagonal streak in the bottom right corner, fading out toward the page. */
function CornerTiles({ color }: { color: string }) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={CORNER_TILES_STYLE}>
      <Svg width={TILES_W} height={TILES_H}>
        <Defs>
          <Pattern id="meTiles" width={TILE_PITCH} height={TILE_PITCH} patternUnits="userSpaceOnUse">
            <Rect x={3} y={3} width={TILE_PITCH - 6} height={TILE_PITCH - 6} rx={3} fill={color} fillOpacity={0.09} />
          </Pattern>
          <RadialGradient id="meTilesFade" cx="100%" cy="100%" r="100%">
            <Stop offset="0.35" stopColor="#fff" />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="meStreak" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.2} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
          <Mask id="meTilesMask" maskUnits="userSpaceOnUse" x={0} y={0} width={TILES_W} height={TILES_H}>
            <Rect width={TILES_W} height={TILES_H} fill="url(#meTilesFade)" />
          </Mask>
        </Defs>
        <Rect width={TILES_W} height={TILES_H} fill="url(#meTiles)" mask="url(#meTilesMask)" />
        <Path d={`M${TILES_W + 4} 40 L${TILES_W - 130} ${TILES_H - 30}`} stroke="url(#meStreak)" strokeWidth={3} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

function StreakFlame({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2c1 4 6 7 6 13a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5 0 2 1 3 2 3 1-3-1-6 1-9.5Z" fill="#E8832E" />
      <Path d="M12 13c.6 1.6 2.6 2.6 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.6 1.6-2.6 2.6-4.6Z" fill="#F7C84A" />
    </Svg>
  );
}

type Stats = {
  offered: number;
  shared: number;
  sent: number;
  received: number;
};

/** Starts the screen over when progress (the nook, shelf picks) arrives from the account, e.g. on a new phone. */
export default function MeScreen() {
  const cloudVersion = useCloudVersion();
  return <MeContent key={cloudVersion} />;
}

function MeContent() {
  const fontsLoaded = useSaintFonts();
  const { theme, name: themeName } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { session, isGuest, signOut } = useAuth();
  // Stats still feed the nook scene (web level) and the decorator.
  const [stats, setStats] = useState<Stats>(
    () => readForUser<Stats>(LOCAL_KEYS.nookStats, session?.user.id) ?? { offered: 0, shared: 0, sent: 0, received: 0 },
  );

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      // The saved counts show first; the refresh waits until the app has settled after launch.
      const cancel = afterLaunch(async () => {
        try {
          const userId = session.user.id;
          const [offered, shared, sent, received] = await Promise.all([
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
          ]);
          if (cancelled) return;
          const next = {
            offered: offered.count ?? 0,
            shared: shared.count ?? 0,
            sent: sent.count ?? 0,
            received: received.count ?? 0,
          };
          setStats(next);
          writeForUser(LOCAL_KEYS.nookStats, userId, next);
        } catch (e) {
          console.warn('Me stats failed', e);
        }
      });
      return () => {
        cancel();
        cancelled = true;
      };
    }, [session]),
  );

  const [deleting, setDeleting] = useState(false);
  const { petId, name: petName, progress: petProgress } = usePetProgress();
  const { width: screenW, height: screenH, fontScale } = useWindowDimensions();
  const { trinkets, currentStreak } = useTrinkets();
  const keepsakes = useMemo(() => trinkets.filter(t => t.earned).map(t => t.id), [trinkets]);
  const pageW = Math.min(screenW, 500);
  const actionSizing = { flexBasis: ACTION_MIN_WIDTH * fontScale };
  const frameW = pageW - ARCH_MARGIN * 2;
  const [measuredH, setViewportH] = useState(0);
  // Sized from the screen until it's measured, so the arch is right on the first frame instead of popping in.
  const viewportH = measuredH || screenH - insets.top - HEADER_H;
  const [belowH, setBelowH] = useState(BELOW_ESTIMATE);
  // The arch gives up height first, so everything fits without scrolling for as long as it can.
  const archH = Math.max(
    MIN_ARCH,
    Math.min(frameW * ARCH_RATIO, viewportH - TAB_BAR_SPACE - ARCH_TOP - ALCOVE_SILL_H - belowH),
  );
  const [storedNook, setNook] = useState<NookState>(() => {
    const saved = readLocal(LOCAL_KEYS.nook);
    return saved ? migrateNook(saved) : DEFAULT_NOOK;
  });
  const lighting = useMemo(() => lightingForHour(new Date().getHours()), []);
  const { owned, loaded: ownedLoaded } = useOwned();
  const nook = useMemo(
    () => ownedLoaded ? stripUnowned(storedNook, owned, DEFAULT_NOOK) : storedNook,
    [storedNook, ownedLoaded, owned],
  );
  const [decorating, setDecorating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  // Wait for what you own to load before removing cosmetics whose ownership has expired.
  useEffect(() => {
    if (!ownedLoaded) return;
    if (JSON.stringify(nook) === JSON.stringify(storedNook)) return;
    saveToCloud('nook', nook);
    writeLocal(LOCAL_KEYS.nook, nook)
      .then(() => setNook(current => current === storedNook ? nook : current))
      .catch(() => {});
  }, [nook, storedNook, ownedLoaded]);
  const saveNook = async (next: NookState) => {
    await writeLocal(LOCAL_KEYS.nook, next);
    saveToCloud('nook', next);
    setNook(next);
  };

  const go = (path: Parameters<typeof router.push>[0]) => {
    setSettingsOpen(false);
    router.push(path);
  };

  const onSignOut = async () => {
    setSettingsOpen(false);
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
            setSettingsOpen(false);
            await signOut();
            setDeleting(false);
            router.replace('/auth');
          },
        },
      ],
    );
  };

  if (!fontsLoaded) return <View style={styles.safe} />;

  return (
    // Padding from the insets, not a SafeAreaView: that one first draws under the status bar, then drops into place.
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <CornerTiles color={theme.ink} />
      {decorating ? null : <PageAmbience name={themeName} />}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text accessibilityRole="header" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.title}>
            Saint <Text style={styles.titleAccent}>Central</Text>
          </Text>
          <Squiggle color={theme.accent} w={140} waves={11} />
        </View>
        <View style={styles.headerMeta}>
          <View style={styles.streak}>
            <StreakFlame />
            <Text style={styles.metaText}>{currentStreak} day streak</Text>
          </View>
        </View>
        <NookButton onPress={() => setSettingsOpen(true)} accessibilityLabel="Settings and account. Always anonymous."
          hitSlop={6} style={styles.gear}>
          <GearIcon size={20} color={theme.ink} />
        </NookButton>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} alwaysBounceVertical={false}
        onLayout={e => setViewportH(e.nativeEvent.layout.height)}>
        <View style={[styles.page, { width: pageW }]}>
          <NookAlcove frameWidth={frameW} archHeight={archH} screenWidth={screenW} cloudColor={mixColors(theme.surface, theme.accent, 0.25)}
            sparkleColor={theme.accent}
            greeting="Stay a while. Pray with me?">
            {sceneW => (
              <Nook nook={nook} stats={stats} lighting={lighting} petId={petId} stage={petProgress.stage} width={sceneW} compact immersive />
            )}
          </NookAlcove>
          <View style={styles.below}>
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(600)}
              onLayout={e => setBelowH(e.nativeEvent.layout.height)} style={styles.content}>
              <KeepsakeShelf trinkets={trinkets} onOpen={() => router.push('/trinkets')} />
              <View style={styles.actions}>
                <NookButton onPress={() => setDecorating(true)} disabled={!ownedLoaded}
                  accessibilityLabel="Decorate your Prayer Nook" style={[styles.action, actionSizing, styles.primaryAction]}>
                  <SparkleIcon size={17} color={theme.accent} />
                  <Text style={styles.primaryActionText}>Make it yours</Text>
                </NookButton>
                <NookButton onPress={() => router.push('/customization')} accessibilityRole="link"
                  accessibilityLabel="Open customizations" style={[styles.action, actionSizing]}>
                  <Text style={styles.actionText}>Customizations</Text>
                </NookButton>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <Pressable accessibilityLabel="Close settings" style={styles.backdrop} onPress={() => setSettingsOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.sheetHeading}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Settings & account</Text>
            <NookButton onPress={() => setSettingsOpen(false)} accessibilityLabel="Close" style={styles.sheetClose}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </NookButton>
          </View>
          <NookButton onPress={() => go('/notificationSettings')} accessibilityRole="link" style={styles.settingsRow}>
            <BellIcon size={18} color={theme.inkSoft} />
            <View style={styles.linkCopy}>
              <Text style={styles.rowTitle}>Notifications</Text>
              <Text style={styles.rowNote}>Notes, updates, and your daily reminder.</Text>
            </View>
            <ArrowIcon size={15} color={theme.inkSoft} />
          </NookButton>
          <NookButton onPress={() => go('/customization')} accessibilityRole="link" style={styles.settingsRow}>
            <SparkleIcon size={18} color={theme.inkSoft} />
            <View style={styles.linkCopy}>
              <Text style={styles.rowTitle}>Appearance</Text>
              <Text style={styles.rowNote}>Your theme and app icon.</Text>
            </View>
            <ArrowIcon size={15} color={theme.inkSoft} />
          </NookButton>
          <NookButton onPress={() => go('/pets')} accessibilityRole="link" style={styles.settingsRow}>
            <UserIcon size={18} color={theme.inkSoft} />
            <View style={styles.linkCopy}>
              <Text style={styles.rowTitle}>Companions</Text>
              <Text style={styles.rowNote}>Choose who walks with you and see how they grow.</Text>
            </View>
            <ArrowIcon size={15} color={theme.inkSoft} />
          </NookButton>
          <NookButton onPress={() => go('/trinkets')} accessibilityRole="link" style={styles.settingsRow}>
            <StarIcon size={18} color={theme.inkSoft} />
            <View style={styles.linkCopy}>
              <Text style={styles.rowTitle}>Keepsakes</Text>
              <Text style={styles.rowNote}>{keepsakes.length} collected · your trinket shelf</Text>
            </View>
            <ArrowIcon size={15} color={theme.inkSoft} />
          </NookButton>
          <NookButton onPress={() => go('/store')} accessibilityRole="link" style={styles.settingsRow}>
            <SparkleIcon size={18} color={theme.inkSoft} />
            <View style={styles.linkCopy}>
              <Text style={styles.rowTitle}>Store</Text>
              <Text style={styles.rowNote}>New scenes and decor for your Prayer Nook.</Text>
            </View>
            <ArrowIcon size={15} color={theme.inkSoft} />
          </NookButton>
          <NookButton onPress={() => go('/myPrayers')} accessibilityRole="link" style={styles.settingsRow}>
            <PrayingIcon size={18} color={theme.inkSoft} />
            <View style={styles.linkCopy}>
              <Text style={styles.rowTitle}>Your prayer calendar</Text>
              <Text style={styles.rowNote}>{stats.offered} prayers offered · {stats.shared} shared</Text>
            </View>
            <ArrowIcon size={15} color={theme.inkSoft} />
          </NookButton>
          {isGuest ? (
            <View style={styles.guestNotice}>
              <Text style={styles.guestNoticeText}>You&apos;re here anonymously. Create an account to keep your prayers and progress safe when you sign out.</Text>
              <NookButton onPress={() => go('/createAccount')} style={styles.guestButton}>
                <Text style={styles.textLinkText}>Keep your little corner</Text>
                <ArrowIcon size={14} color={theme.accent} />
              </NookButton>
            </View>
          ) : null}
          <NookButton onPress={onSignOut} style={styles.accountButton}><Text style={styles.rowTitle}>Sign out</Text></NookButton>
          {session?.user?.email ? <Text style={styles.accountEmail}>Signed in as {session.user.email}</Text> : null}
          <NookButton onPress={onDeleteAccount} disabled={deleting} style={styles.accountButton}>
            {deleting ? <ActivityIndicator size="small" color={theme.accent} /> : <Text style={styles.deleteText}>Delete account</Text>}
          </NookButton>
        </View>
      </Modal>

      {decorating ? (
        <NookDecorator petName={petName} nook={nook} owned={owned} stats={stats} lighting={lighting} petId={petId} stage={petProgress.stage}
          onSave={saveNook} onClose={() => setDecorating(false)}
          onBrowse={destination => { setDecorating(false); router.push(destination); }} />
      ) : null}
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: TAB_BAR_SPACE },
  page: { flex: 1, alignSelf: 'center', paddingTop: ARCH_TOP },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingLeft: PAGE_MARGIN, paddingRight: 16 },
  headerMeta: { flex: 1, minWidth: 0, gap: 1 },
  titleBlock: { flexShrink: 1, gap: 1, overflow: 'hidden' },
  title: { fontFamily: FONTS.display, fontSize: 26, lineHeight: 32, color: theme.ink },
  titleAccent: { color: theme.accent },
  metaText: { flexShrink: 1, fontFamily: FONTS.bodyBold, fontSize: 10.5, lineHeight: 15, letterSpacing: 1, textTransform: 'uppercase', fontVariant: ['lining-nums'], color: theme.inkSoft },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  gear: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgSoft, borderWidth: 1, borderColor: theme.line },
  below: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: PAGE_MARGIN, paddingTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  action: { flexGrow: 1, flexShrink: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryAction: { backgroundColor: mixColors(theme.surface, theme.accent, 0.16) },
  primaryActionText: { fontFamily: FONTS.bodySemi, fontSize: 16, lineHeight: 22, textAlign: 'center', color: theme.ink, flexShrink: 1 },
  actionText: { fontFamily: FONTS.bodySemi, fontSize: 16, lineHeight: 22, textAlign: 'center', color: theme.ink, flexShrink: 1 },
  // Settings sheet
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 10, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: theme.surface },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.line, marginBottom: 12 },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  sheetTitle: { flex: 1, fontFamily: FONTS.display, fontSize: 22, lineHeight: 28, color: theme.ink },
  sheetClose: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgSoft },
  sheetCloseText: { fontSize: 14, color: theme.ink },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
  linkCopy: { flex: 1 },
  rowTitle: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 20, color: theme.ink },
  rowNote: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: theme.inkSoft, marginTop: 3 },
  textLinkText: { fontFamily: FONTS.bodySemi, fontSize: 11, color: theme.accent },
  guestNotice: { marginTop: 12, padding: 16, backgroundColor: theme.bgSoft, borderRadius: 16 },
  guestNoticeText: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: theme.inkSoft },
  guestButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingTop: 8 },
  accountButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  accountEmail: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 16, color: theme.inkSoft, textAlign: 'center' },
  deleteText: { fontFamily: FONTS.body, fontSize: 11, color: theme.isDark ? '#D8AA9E' : '#A8402F' },
});
