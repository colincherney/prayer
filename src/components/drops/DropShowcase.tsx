import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Modal, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pressable } from '@/components/saint/HapticPressable';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg from 'react-native-svg';

import { COLLECTION_SCENES } from '@/components/pets/collectionData';
import { collectionDecor } from '@/components/pets/collectionDecor';
import { COLLECTION_DECOR_ART } from '@/components/pets/collectionDecorArt';
import { RARITY_COLOR, TrinketArt } from '@/components/pets/Trinket';
import { TRINKET_INFO, TrinketId } from '@/components/pets/trinketArt';
import { COMPANION_INFO } from '@/components/pets/companionInfo';
import { NOOK_H, NOOK_W, NookScale, SceneBackdrop } from '@/components/pets/NookScene';
import { getPet, Pet, PetId } from '@/components/pets/registry';
import { ChristmasScene } from '@/components/saint/ChristmasScene';
import { MONTHLY_SCENES } from '@/components/saint/monthlyScenes';
import { MonthlyRoomName } from '@/components/saint/monthlyRooms';
import { PRAYER_ROOM_LABELS, PrayerRoomName } from '@/components/saint/prayerRoom';
import { FONTS, mixColors } from '@/components/saint/theme';
import { ThanksgivingScene } from '@/components/saint/ThanksgivingScene';
import { BelovedScene } from '@/components/saint/BelovedScene';
import { SwampKingScene } from '@/components/saint/SwampKingScene';
import { WinterLordScene } from '@/components/saint/WinterLordScene';
import type { DropItem } from '@/lib/drops';
import { shortDate } from '@/lib/winterEvent';

// "What's new": everything that just dropped, one at a time, with one button ("Next", then "Done" on the last).
// Only the item on screen is drawn, so only one piece of art is ever animating.

const INK = '#FBF4E6';
const SOFT = 'rgba(251,244,230,0.74)';
const GOLD = '#E9C46A';

/** The home scene art for a wallpaper that can drop on a date. */
function RoomScene({ room }: { room: PrayerRoomName }) {
  if (room === 'christmas') return <ChristmasScene />;
  if (room === 'thanksgiving') return <ThanksgivingScene />;
  if (room === 'winter') return <WinterLordScene />;
  if (room === 'swamp') return <SwampKingScene />;
  if (room === 'beloved') return <BelovedScene />;
  if (room in MONTHLY_SCENES) return React.createElement(MONTHLY_SCENES[room as MonthlyRoomName]);
  return null;
}

export function copyFor(item: DropItem): { label: string; title: string; body: string; hue: string } {
  if (item.kind === 'pet') {
    const pet = getPet(item.id as PetId);
    const hue = COMPANION_INFO[pet.id].hue;
    if (pet.id === 'frostLord') {
      return { label: 'NEW COMPANION', title: 'Snowcap', body: 'Pray through the Long Winter to grow him into the Frost Mage, then crown the Frost Lord.', hue };
    }
    if (pet.id === 'beloved') {
      return { label: 'NEW COMPANION', title: 'The Cherub', body: 'Pray through February to grow her into the Muse, then awaken The Beloved, with her neon Seraph form to switch to.', hue };
    }
    if (pet.id === 'vesper') {
      return { label: 'NEW COMPANION', title: 'Vesper', body: 'Pray through the spring to grow him into the Fen Warden, then crown the Old King of the fen.', hue };
    }
    return { label: 'NEW COMPANION', title: `${pet.name} the ${pet.species}`, body: `${pet.tagline} Find ${pet.name} in Prayer Pals.`, hue };
  }
  if (item.kind === 'room') {
    const room = item.id as PrayerRoomName;
    const body = room === 'winter'
      ? 'The whole app turns to winter for the Long Winter, through the end of January.'
      : room === 'beloved'
      ? 'The whole app goes to the rose garden for the Beloved, through February.'
      : room === 'swamp'
      ? 'The whole app goes down to the fen for the Swamp King, through May 1.'
      : 'A new home screen to pray in. Pick it any time in Customize.';
    return { label: 'NEW HOME WALLPAPER', title: PRAYER_ROOM_LABELS[room], body, hue: '#1F2A44' };
  }
  if (item.kind === 'trinket') {
    const info = TRINKET_INFO[item.id as TrinketId];
    return { label: 'NEW KEEPSAKE', title: info?.name ?? 'A new keepsake', body: `Earn it for your shelf: ${info?.goal ?? 'see Keepsakes'}.`, hue: RARITY_COLOR[info?.rarity ?? 'common'] };
  }
  if (item.kind === 'item') {
    return { label: 'NEW NOOK DECORATION', title: collectionDecor(item.id)?.name ?? 'A new decoration', body: 'A new piece to make your prayer nook your own. Find it when you decorate your Nook.', hue: '#5A4A3A' };
  }
  const scene = COLLECTION_SCENES.find(s => s.id === item.id);
  return { label: 'NEW NOOK SCENE', title: scene?.name ?? 'A new nook scene', body: 'A new backdrop for your prayer nook. Find it in your Nook.', hue: mixColors(scene?.bg ?? '#3A4860', '#0F1834', 0.55) };
}

/** A nook decoration on its own, from its 120x120 art tile. */
export function DecorArt({ id, size }: { id: string; size: number }) {
  const Art = COLLECTION_DECOR_ART[id];
  if (!Art) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Art />
    </Svg>
  );
}

function Art({ item, maxHeight }: { item: DropItem; maxHeight: number }) {
  if (item.kind === 'pet') {
    const pet = getPet(item.id as PetId);
    const size = Math.min(230, maxHeight * 0.72);
    return (
      <View style={{ alignItems: 'center' }}>
        <Pet id={pet.id} stage={1} size={size} />
        <View style={styles.stages}>
          {([1, 2, 3] as const).map(stage => (
            <View key={stage} style={styles.stage}>
              <Pet id={pet.id} stage={stage} size={46} animated={false} />
              <Text numberOfLines={1} style={styles.stageName}>{pet.stages[stage - 1]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }
  if (item.kind === 'room') {
    const h = Math.min(440, maxHeight);
    return (
      <View style={[styles.phone, { height: h, width: (h * 390) / 844 }]}>
        <RoomScene room={item.id as PrayerRoomName} />
      </View>
    );
  }
  if (item.kind === 'trinket') {
    return (
      <View style={styles.pedestal}>
        <TrinketArt id={item.id as TrinketId} size={Math.min(220, maxHeight * 0.8)} />
      </View>
    );
  }
  if (item.kind === 'item') {
    return (
      <View style={styles.pedestal}>
        <DecorArt id={item.id} size={Math.min(230, maxHeight * 0.8)} />
      </View>
    );
  }
  const scene = COLLECTION_SCENES.find(s => s.id === item.id);
  const px = Math.min(0.78, maxHeight / NOOK_H);
  return (
    <View style={[styles.nook, { width: NOOK_W * px, height: NOOK_H * px, backgroundColor: scene?.bg ?? '#3A4860' }]}>
      <NookScale.Provider value={px}>
        <SceneBackdrop scene={item.id as never} bg={scene?.bg ?? '#3A4860'} />
      </NookScale.Provider>
    </View>
  );
}

export function DropShowcase({ items, onDone }: { items: DropItem[]; onDone: () => void }) {
  return (
    <Modal visible={items.length > 0} animationType="fade" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onDone}>
      {items.length > 0 ? <Body items={items} onDone={onDone} /> : null}
    </Modal>
  );
}

function Body({ items, onDone }: { items: DropItem[]; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const item = items[Math.min(index, items.length - 1)];
  const copy = copyFor(item);
  const last = index >= items.length - 1;
  // Room for the art between the header and the words (the words and button take about 250 dp).
  const artMax = height - insets.top - insets.bottom - 330;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[mixColors(copy.hue, '#0B1230', 0.35), '#0B1230']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.kicker}>WHAT&apos;S NEW · {shortDate(item.day).toUpperCase()}</Text>
        {items.length > 1 ? (
          <View style={styles.dots} accessibilityLabel={`${index + 1} of ${items.length}`}>
            {items.map((it, i) => <View key={it.key} style={[styles.dot, i === index && styles.dotOn]} />)}
          </View>
        ) : null}
      </View>

      <Animated.View key={`art-${item.key}`} entering={FadeIn.duration(450)} style={styles.artArea}>
        <Art item={item} maxHeight={artMax} />
      </Animated.View>

      <Animated.View key={`copy-${item.key}`} entering={FadeInDown.duration(400)} style={[styles.copy, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.label}>{copy.label}</Text>
        <Text accessibilityRole="header" style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <Pressable
          onPress={() => (last ? onDone() : setIndex(i => i + 1))}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}>
          <Text style={styles.ctaText}>{last ? 'Done' : 'Next'}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1230' },
  header: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  kicker: { fontFamily: FONTS.bodySemi, fontSize: 12, letterSpacing: 2.4, color: '#BFE6FF' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(251,244,230,0.25)' },
  dotOn: { backgroundColor: GOLD, width: 18 },
  artArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  phone: { borderRadius: 26, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(251,244,230,0.85)', backgroundColor: '#0B1230' },
  nook: { borderRadius: 22, overflow: 'hidden' },
  pedestal: { padding: 18, borderRadius: 999, backgroundColor: 'rgba(251,244,230,0.07)', alignItems: 'center', justifyContent: 'center' },
  stages: { flexDirection: 'row', gap: 14, marginTop: 10 },
  stage: { alignItems: 'center', width: 76 },
  stageName: { fontFamily: FONTS.body, fontSize: 11, color: SOFT, marginTop: 2 },
  copy: { paddingHorizontal: 24, gap: 8 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 12, letterSpacing: 2, color: GOLD, textAlign: 'center' },
  title: { fontFamily: FONTS.displaySemi, fontSize: 30, lineHeight: 36, color: INK, textAlign: 'center' },
  body: { fontFamily: FONTS.body, fontSize: 15.5, lineHeight: 22, color: SOFT, textAlign: 'center', marginBottom: 10 },
  cta: { height: 54, borderRadius: 27, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONTS.bodyBold, fontSize: 18, color: '#0F1834' },
});
