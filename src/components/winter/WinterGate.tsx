import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { setOverlayBusy, useOtherOverlayBusy } from '@/lib/overlays';
import { EventId, markEventSeen, refreshEvent, useEvent, useEvents, WINTER_EVENT_ID } from '@/lib/winterEvent';

import { EvolutionMoment } from './EvolutionMoment';
import { IntroClip } from './IntroClip';
import { SKINS, SkinContext, useSkin } from './winterUi';

// For whichever event is running, plays its intro clip once per account (never again on any device: the account
// remembers, and this phone caches it so it never flashes on a slow network), then shows any evolution celebration
// that's waiting. Only on the home screen, so it never interrupts sign-in or a prayer opened from a link or
// notification. Each event has its own "seen", so watching the winter clip doesn't count as watching the next one.

// The Long Winter kept its original key.
const introKey = (id: EventId, userId: string) => (id === WINTER_EVENT_ID ? `winter.introSeen.${userId}` : `event.introSeen.${id}.${userId}`);

export function WinterGate() {
  const { session } = useAuth();
  const { liveId } = useEvents();
  const userId = session?.user?.id;
  if (!userId || !liveId) return null;
  // Keyed by account and event, so switching either starts fresh.
  return (
    <SkinContext.Provider value={SKINS[liveId]}>
      <Gate key={`${userId}-${liveId}`} userId={userId} />
    </SkinContext.Provider>
  );
}

function Gate({ userId }: { userId: string }) {
  const skin = useSkin();
  const segments = useSegments();
  const { state, phase } = useEvent(skin.id);
  /** This phone's copy of "seen": null while it's being read. */
  const [cachedSeen, setCachedSeen] = useState<boolean | null>(null);
  /** Playback started (or the still showed) this session, so the clip stays up even once the account says seen. */
  const [introStarted, setIntroStarted] = useState(false);
  const [introClosed, setIntroClosed] = useState(false);
  const [momentDone, setMomentDone] = useState(0);

  useEffect(() => {
    refreshEvent(skin.id, true);
    AsyncStorage.getItem(introKey(skin.id, userId)).then(v => setCachedSeen(v === '1')).catch(() => setCachedSeen(false));
  }, [userId, skin.id]);

  const progress = state?.progress ?? null;
  const on = !!state?.event.is_active;
  const live = on && phase === 'live';
  const onHome = segments[0] === '(tabs)' && segments.length === 1; // the home tab is '(tabs)' with nothing after it
  const onEventScreen = (segments[0] as string) === skin.route.slice(1);
  const seenOnAccount = !!progress?.intro_seen_at;

  // The account says seen but this phone didn't know: remember it here too.
  useEffect(() => {
    if (seenOnAccount && cachedSeen === false && !introStarted) AsyncStorage.setItem(introKey(skin.id, userId), '1').catch(() => {});
  }, [seenOnAccount, cachedSeen, introStarted, userId, skin.id]);

  // Takes turns with "What's new": whichever opened first finishes before the other starts.
  const othersBusy = useOtherOverlayBusy('winter');
  const showIntro = !introClosed && (introStarted || (!othersBusy && live && onHome && cachedSeen === false && !!progress && !seenOnAccount));

  const pending = progress && progress.stage_unlocked > progress.stage_seen ? progress.stage_unlocked : 0;
  const introFirst = live && cachedSeen === false && !seenOnAccount && !introClosed;
  // Celebrations only while the event runs: once it ends nothing about it pops up.
  const showMoment = live && !showIntro && !introFirst && !othersBusy && pending > momentDone && (onHome || onEventScreen);

  useEffect(() => {
    setOverlayBusy('winter', showIntro || showMoment);
    return () => setOverlayBusy('winter', false);
  }, [showIntro, showMoment]);

  const markIntroSeen = () => {
    if (introStarted) return;
    setIntroStarted(true);
    AsyncStorage.setItem(introKey(skin.id, userId), '1').catch(() => {});
    markEventSeen(skin.id, 'intro').catch(() => {});
  };

  const closeIntro = (thenOpenEvent: boolean) => {
    markIntroSeen();
    setIntroClosed(true);
    if (thenOpenEvent) router.push(skin.route);
  };

  return (
    <>
      <IntroClip visible={showIntro} mode="auto" onStarted={markIntroSeen} onBegin={() => closeIntro(true)} onClose={() => closeIntro(false)} />
      <EvolutionMoment
        visible={showMoment}
        stage={pending}
        onDone={() => {
          setMomentDone(pending);
          markEventSeen(skin.id, 'stage', pending).catch(() => {});
        }}
      />
    </>
  );
}
