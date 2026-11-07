import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  PressableProps,
  StyleProp,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { NookDecorator } from '@/components/pets/NookDecorator';
import { TrinketShelf } from '@/components/pets/Trinket';
import { Nook } from '@/components/pets/Nook';
import { petStageName } from '@/components/pets/registry';
import {
  DEFAULT_NOOK,
  isEasterSet,
  isSanctuarySet,
  lightingForHour,
  migrateNook,
  NookState,
  SCENES,
  TOD_LABELS,
  webLevelFor,
  webNextText,
} from '@/components/pets/nookData';
import {
  ArrowIcon,
  BellIcon,
  PrayingIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
} from '@/components/saint/Icons';
import { FONTS } from '@/components/saint/theme';
import { useSaintFonts } from '@/components/saint/useFonts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { usePetProgress, XP_PER_LEVEL } from '@/lib/pet';
import { stripUnowned, useOwned } from '@/lib/store';
import { relativeTime } from '@/lib/time';
import { useTrinkets } from '@/lib/trinkets';

const NOOK_KEY = 'nook.v1';
const INK = '#F2E9D8';
const SOFT = '#B2BDBB';
const ACCENT = '#BCD8BD';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const { petId, name: petName, progress: petProgress } = usePetProgress();
  const { width: screenW } = useWindowDimensions();
  const { trinkets } = useTrinkets();
  const nookW = Math.min(screenW, 500);
  const [storedNook, setNook] = useState<NookState>(DEFAULT_NOOK);
  const lighting = useMemo(() => lightingForHour(new Date().getHours()), []);
  const { owned, loaded: ownedLoaded } = useOwned();
  const [nookLoaded, setNookLoaded] = useState(false);
  const nook = useMemo(
    () => nookLoaded && ownedLoaded ? stripUnowned(storedNook, owned, DEFAULT_NOOK) : storedNook,
    [storedNook, nookLoaded, ownedLoaded, owned],
  );
  const [decorating, setDecorating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.set(event.contentOffset.y);
  });
  const sceneMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? 0 : Math.max(0, Math.min(scrollY.get() * 0.12, 48)) }],
  }));
  const growth = useSharedValue(0);
  useEffect(() => {
    growth.set(withTiming(petProgress.xpInLevel / XP_PER_LEVEL, { duration: reducedMotion ? 0 : 700 }));
  }, [growth, petProgress.xpInLevel, reducedMotion]);
  const growthStyle = useAnimatedStyle(() => ({ width: `${growth.get() * 100}%` }));
  useEffect(() => {
    AsyncStorage.getItem(NOOK_KEY)
      .then(raw => {
        if (raw) setNook(migrateNook(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => setNookLoaded(true));
  }, []);
  // Wait for both sources before removing cosmetics whose ownership has expired.
  useEffect(() => {
    if (!nookLoaded || !ownedLoaded) return;
    if (JSON.stringify(nook) === JSON.stringify(storedNook)) return;
    AsyncStorage.setItem(NOOK_KEY, JSON.stringify(nook))
      .then(() => setNook(current => current === storedNook ? nook : current))
      .catch(() => {});
  }, [nook, storedNook, nookLoaded, ownedLoaded]);
  const saveNook = async (next: NookState) => {
    await AsyncStorage.setItem(NOOK_KEY, JSON.stringify(next));
    setNook(next);
  };
  const scene = SCENES.find(scene => scene.id === nook.scene) ?? SCENES[0];
  const styles = useMemo(() => makeStyles(scene.bg), [scene.bg]);
  const earnedTrinkets = trinkets.filter(t => t.earned).map(t => t.id);
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

  if (!fontsLoaded) return <View style={styles.safe} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { width: nookW }]}>
          <View style={styles.topBar}>
            <Text accessibilityRole="header" style={styles.pageTitle}>Your nook</Text>
            <View style={styles.privacy}>
              <ShieldIcon size={12} color={SOFT} />
              <Text style={styles.privacyText}>{isGuest ? 'Anonymous session' : 'Always anonymous'}</Text>
            </View>
          </View>
          <View style={styles.hero}>
            <Animated.View style={sceneMotion}>
              <Nook nook={nook} stats={stats} lighting={lighting} petId={petId} stage={petProgress.stage} width={nookW} compact immersive />
            </Animated.View>
            <LinearGradient pointerEvents="none" colors={[scene.bg, 'transparent']} style={styles.sceneTopFade} />
            <View pointerEvents="none" style={styles.heroHeading}>
              <Text style={styles.eyebrow}>A LITTLE PEACE, TOGETHER</Text>
              <Text accessibilityRole="header" style={styles.petName}>{petName}&apos;s place</Text>
              <Text style={styles.heroSubtitle}>A quiet corner to grow with you.</Text>
            </View>
            <LinearGradient pointerEvents="none" colors={['transparent', scene.bg]} style={styles.sceneFade} />
            <View pointerEvents="none" style={styles.sceneCaption}>
              <View style={styles.presenceDot} />
              <Text style={styles.sceneCaptionText}>{scene.name} · {TOD_LABELS[lighting]}</Text>
            </View>
          </View>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(600)} style={styles.content}>
            <Text style={styles.petHint}>Tap {petName} to say hello · double tap the scene to settle in</Text>
            <View style={styles.growth}>
              <View style={styles.growthHeading}>
                <View style={styles.levelBadge}>
                  <StarIcon size={13} color={ACCENT} />
                  <Text style={styles.levelText}>Level {petProgress.level}</Text>
                </View>
                <Text style={styles.stageText}>{petStageName(petId, petProgress.stage)}</Text>
              </View>
              <View accessible accessibilityRole="progressbar"
                accessibilityLabel={`${petName}'s growth to level ${petProgress.level + 1}`}
                accessibilityValue={{ min: 0, max: XP_PER_LEVEL, now: petProgress.xpInLevel }} style={styles.growthTrack}>
                <Animated.View style={[styles.growthFill, growthStyle]} />
              </View>
              <View style={styles.growthFoot}>
                <Text style={styles.growthNote}>Every little prayer helps {petName} grow.</Text>
                <Text style={styles.xpText}>{petProgress.xpInLevel}/{XP_PER_LEVEL} XP</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <NookButton onPress={() => setDecorating(true)} disabled={!nookLoaded || !ownedLoaded}
                accessibilityLabel="Decorate your nook" style={[styles.action, styles.primaryAction]}>
                <SparkleIcon size={17} color="#1A3029" />
                <Text style={styles.primaryActionText}>Make it yours</Text>
              </NookButton>
              <NookButton onPress={() => router.push('/pets')} accessibilityRole="link"
                accessibilityLabel={`Meet your companions. Current companion: ${petName}`} style={styles.action}>
                <Text style={styles.actionText}>Companions</Text>
                <ArrowIcon size={15} color={INK} />
              </NookButton>
            </View>
            <NookButton onPress={() => router.push('/store')} accessibilityRole="link" style={styles.storeLink}>
              <Text style={styles.storeLinkText}>Find a little something for your nook</Text>
              <ArrowIcon size={13} color={SOFT} />
            </NookButton>
            {isSanctuarySet(nook) || isEasterSet(nook) ? (
              <View style={styles.setBanner}>
                <SparkleIcon size={15} color={ACCENT} />
                <Text style={styles.setBannerText}>
                  {isSanctuarySet(nook) ? 'Your sanctuary is complete. A little more golden light.' : 'Your Easter set is complete. A little more new life.'}
                </Text>
              </View>
            ) : null}
            <View style={styles.keepsakes}>
              <View style={styles.sectionHeading}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>Little keepsakes</Text>
                <NookButton onPress={() => router.push('/trinkets')} accessibilityRole="link" style={styles.textLink}>
                  <Text style={styles.textLinkText}>{earnedTrinkets.length} collected</Text>
                  <ArrowIcon size={14} color={ACCENT} />
                </NookButton>
              </View>
              <Text style={styles.sectionNote}>Small reminders of the good you&apos;ve shared.</Text>
              <View style={styles.shelf}>
                <TrinketShelf earned={earnedTrinkets} width={nookW - 48} onPress={() => router.push('/trinkets')} />
              </View>
            </View>
            <View style={styles.journey}>
              <View style={styles.sectionHeading}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>Growing together</Text>
                <Text style={styles.webLevel}>Web level {webLevel}</Text>
              </View>
              <Text style={styles.sectionNote}>{webNextText(stats.offered, webLevel)}</Text>
              <View style={styles.stats}>
                {[
                  { value: stats.offered, label: 'Prayers offered' },
                  { value: stats.shared, label: 'Requests shared' },
                  { value: stats.sent, label: 'Notes sent' },
                  { value: stats.received, label: 'Notes received' },
                ].map(stat => (
                  <View key={stat.label} style={styles.stat}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
              <NookButton onPress={() => router.push('/myPrayers')} accessibilityRole="link" style={styles.prayersLink}>
                <View style={styles.prayersIcon}><PrayingIcon size={20} color={ACCENT} /></View>
                <View style={styles.linkCopy}>
                  <Text style={styles.rowTitle}>Your prayer calendar</Text>
                  <Text style={styles.rowNote}>
                    {stats.shared === 0 ? 'Your story begins with a little prayer.' : latest ? `Last shared ${latest.age} · revisit your prayers` : 'A place to return to every prayer.'}
                  </Text>
                </View>
                <ArrowIcon size={17} color={ACCENT} />
              </NookButton>
            </View>
            <Animated.View layout={reducedMotion ? undefined : LinearTransition.duration(240)} style={styles.settings}>
              <NookButton onPress={() => setSettingsOpen(open => !open)} accessibilityLabel="Settings and account"
                accessibilityState={{ expanded: settingsOpen }} style={styles.settingsToggle}>
                <ShieldIcon size={15} color={SOFT} />
                <Text style={styles.settingsLabel}>Settings & account</Text>
                <Text style={styles.settingsChevron}>{settingsOpen ? '−' : '+'}</Text>
              </NookButton>
              {settingsOpen ? (
                <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(220)} style={styles.settingsContent}>
                  <NookButton onPress={() => router.push('/notificationSettings')} accessibilityRole="link" style={styles.settingsRow}>
                    <BellIcon size={18} color={SOFT} />
                    <View style={styles.linkCopy}>
                      <Text style={styles.rowTitle}>Notifications</Text>
                      <Text style={styles.rowNote}>Notes, updates, and your daily reminder.</Text>
                    </View>
                    <ArrowIcon size={15} color={SOFT} />
                  </NookButton>
                  <NookButton onPress={() => router.push('/customization')} accessibilityRole="link" style={styles.settingsRow}>
                    <SparkleIcon size={18} color={SOFT} />
                    <View style={styles.linkCopy}>
                      <Text style={styles.rowTitle}>Appearance</Text>
                      <Text style={styles.rowNote}>Your theme and app icon.</Text>
                    </View>
                    <ArrowIcon size={15} color={SOFT} />
                  </NookButton>
                  {isGuest ? (
                    <View style={styles.guestNotice}>
                      <Text style={styles.guestNoticeText}>You&apos;re here anonymously. Create an account to keep your prayers and progress safe when you sign out.</Text>
                      <NookButton onPress={() => router.push('/createAccount')} style={styles.guestButton}>
                        <Text style={styles.textLinkText}>Keep your little corner</Text>
                        <ArrowIcon size={14} color={ACCENT} />
                      </NookButton>
                    </View>
                  ) : null}
                  <NookButton onPress={onSignOut} style={styles.accountButton}><Text style={styles.rowTitle}>Sign out</Text></NookButton>
                  {session?.user?.email ? <Text style={styles.accountEmail}>Signed in as {session.user.email}</Text> : null}
                  <NookButton onPress={onDeleteAccount} disabled={deleting} style={styles.accountButton}>
                    {deleting ? <ActivityIndicator size="small" color={ACCENT} /> : <Text style={styles.deleteText}>Delete account</Text>}
                  </NookButton>
                </Animated.View>
              ) : null}
            </Animated.View>
            <Text style={styles.closingNote}>A little faith. A little growth. A place to belong.</Text>
          </Animated.View>
        </View>
      </Animated.ScrollView>
      {decorating ? (
        <NookDecorator nook={nook} owned={owned} stats={stats} lighting={lighting} petId={petId} stage={petProgress.stage}
          onSave={saveNook} onClose={() => setDecorating(false)}
          onBrowse={destination => { setDecorating(false); router.push(destination); }} />
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (background: string) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: background },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },
  page: { alignSelf: 'center' },
  topBar: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pageTitle: { fontFamily: FONTS.display, fontSize: 22, color: INK },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  privacyText: { fontFamily: FONTS.body, fontSize: 10, color: SOFT },
  hero: { overflow: 'hidden' },
  heroHeading: { position: 'absolute', top: 30, left: 24, right: 24, alignItems: 'center' },
  eyebrow: { fontFamily: FONTS.bodySemi, fontSize: 9, letterSpacing: 2.4, color: ACCENT, textAlign: 'center' },
  petName: { fontFamily: FONTS.display, fontSize: 46, lineHeight: 56, letterSpacing: -0.8, color: INK, textAlign: 'center', marginTop: 9 },
  heroSubtitle: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 15, lineHeight: 22, color: SOFT, textAlign: 'center', marginTop: 4 },
  sceneFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '23%' },
  sceneTopFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 40 },
  sceneCaption: { position: 'absolute', bottom: 31, left: 24, right: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  presenceDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ACCENT },
  sceneCaptionText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, color: SOFT, textAlign: 'center', flexShrink: 1 },
  content: { paddingHorizontal: 24 },
  petHint: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 18, textAlign: 'center', color: SOFT, marginTop: -14, marginBottom: 25 },
  growth: { gap: 10 },
  growthHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: INK },
  stageText: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 14, color: SOFT, flexShrink: 1, textAlign: 'right' },
  growthTrack: { height: 4, borderRadius: 4, backgroundColor: 'rgba(242,233,216,0.12)', overflow: 'hidden' },
  growthFill: { height: '100%', borderRadius: 4, backgroundColor: ACCENT },
  growthFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  growthNote: { flex: 1, fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: SOFT },
  xpText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: ACCENT },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  action: { flex: 1, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(242,233,216,0.22)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryAction: { backgroundColor: ACCENT, borderColor: ACCENT },
  primaryActionText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: '#1A3029', flexShrink: 1 },
  actionText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: INK, flexShrink: 1 },
  storeLink: { minHeight: 44, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  storeLinkText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: SOFT, flexShrink: 1 },
  setBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  setBannerText: { flex: 1, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, color: ACCENT },
  keepsakes: { paddingTop: 22, paddingBottom: 28 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 25, lineHeight: 32, color: INK, flexShrink: 1 },
  sectionNote: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: SOFT, marginTop: 5 },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  textLinkText: { fontFamily: FONTS.bodySemi, fontSize: 11, color: ACCENT },
  shelf: { paddingTop: 20 },
  journey: { paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,233,216,0.16)' },
  webLevel: { fontFamily: FONTS.body, fontSize: 10, color: ACCENT },
  stats: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 22, paddingBottom: 8, rowGap: 20 },
  stat: { width: '50%', paddingRight: 10 },
  statValue: { fontFamily: FONTS.display, fontSize: 32, lineHeight: 38, color: INK },
  statLabel: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 18, color: SOFT, marginTop: 2 },
  prayersLink: { paddingVertical: 22, flexDirection: 'row', alignItems: 'center', gap: 13 },
  prayersIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(188,216,189,0.08)' },
  linkCopy: { flex: 1 },
  rowTitle: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 20, color: INK },
  rowNote: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: SOFT, marginTop: 3 },
  settings: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(242,233,216,0.16)' },
  settingsToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62 },
  settingsLabel: { flex: 1, fontFamily: FONTS.body, fontSize: 12, color: SOFT },
  settingsChevron: { fontFamily: FONTS.body, fontSize: 23, color: SOFT },
  settingsContent: { paddingBottom: 12 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15 },
  guestNotice: { marginTop: 12, padding: 16, backgroundColor: 'rgba(242,233,216,0.05)', borderRadius: 16 },
  guestNoticeText: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: SOFT },
  guestButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingTop: 8 },
  accountButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  accountEmail: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 16, color: SOFT, textAlign: 'center' },
  deleteText: { fontFamily: FONTS.body, fontSize: 11, color: '#D8AA9E' },
  closingNote: { fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 12, lineHeight: 20, textAlign: 'center', color: SOFT, marginTop: 24 },
});
