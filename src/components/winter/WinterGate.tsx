import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { setOverlayBusy, useOtherOverlayBusy } from '@/lib/overlays';
import { markWinterSeen, refreshWinter, useWinterEvent } from '@/lib/winterEvent';

import { EvolutionMoment } from './EvolutionMoment';
import { IntroClip } from './IntroClip';

// Plays "Face the Winter Lord" once per account (never again on any device: the account remembers, and this phone
// caches it so it never flashes on a slow network), then shows any evolution celebration that's waiting. Only on the
// home screen, so it never interrupts sign-in or a prayer opened from a link or notification.

const introKey = (userId: string) => `winter.introSeen.${userId}`;

export function WinterGate() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  // Keyed by account, so switching accounts starts fresh.
  return userId ? <Gate key={userId} userId={userId} /> : null;
}

function Gate({ userId }: { userId: string }) {
  const segments = useSegments();
  const { state, phase } = useWinterEvent();
  /** This phone's copy of "seen": null while it's being read. */
  const [cachedSeen, setCachedSeen] = useState<boolean | null>(null);
  /** Playback started (or the still showed) this session, so the clip stays up even once the account says seen. */
  const [introStarted, setIntroStarted] = useState(false);
  const [introClosed, setIntroClosed] = useState(false);
  const [momentDone, setMomentDone] = useState(0);

  useEffect(() => {
    refreshWinter(true);
    AsyncStorage.getItem(introKey(userId)).then(v => setCachedSeen(v === '1')).catch(() => setCachedSeen(false));
  }, [userId]);

  const progress = state?.progress ?? null;
  const on = !!state?.event.is_active;
  const live = on && phase === 'live';
  const onHome = segments[0] === '(tabs)' && segments.length === 1; // the home tab is '(tabs)' with nothing after it
  const seenOnAccount = !!progress?.intro_seen_at;

  // The account says seen but this phone didn't know: remember it here too.
  useEffect(() => {
    if (seenOnAccount && cachedSeen === false && !introStarted) AsyncStorage.setItem(introKey(userId), '1').catch(() => {});
  }, [seenOnAccount, cachedSeen, introStarted, userId]);

  // Takes turns with "What's new": whichever opened first finishes before the other starts.
  const othersBusy = useOtherOverlayBusy('winter');
  const showIntro = !introClosed && (introStarted || (!othersBusy && live && onHome && cachedSeen === false && !!progress && !seenOnAccount));

  const pending = progress && progress.stage_unlocked > progress.stage_seen ? progress.stage_unlocked : 0;
  const introFirst = live && cachedSeen === false && !seenOnAccount && !introClosed;
  const showMoment = on && !showIntro && !introFirst && !othersBusy && pending > momentDone && (onHome || segments[0] === 'winter');

  useEffect(() => {
    setOverlayBusy('winter', showIntro || showMoment);
    return () => setOverlayBusy('winter', false);
  }, [showIntro, showMoment]);

  const markIntroSeen = () => {
    if (introStarted) return;
    setIntroStarted(true);
    AsyncStorage.setItem(introKey(userId), '1').catch(() => {});
    markWinterSeen('intro').catch(() => {});
  };

  const closeIntro = (thenOpenEvent: boolean) => {
    markIntroSeen();
    setIntroClosed(true);
    if (thenOpenEvent) router.push('/winter');
  };

  return (
    <>
      <IntroClip visible={showIntro} mode="auto" onStarted={markIntroSeen} onBegin={() => closeIntro(true)} onClose={() => closeIntro(false)} />
      <EvolutionMoment
        visible={showMoment}
        stage={pending}
        onDone={() => {
          setMomentDone(pending);
          markWinterSeen('stage', pending).catch(() => {});
        }}
      />
    </>
  );
}
