import { useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { DropItem, loadNewDrops, markDropsSeen } from '@/lib/drops';
import { setOverlayBusy, useOtherOverlayBusy } from '@/lib/overlays';
import { useWinterEvent } from '@/lib/winterEvent';

import { DropShowcase } from './DropShowcase';

// Opens "What's new" once, on the home screen, when something has dropped since this account last looked. It waits
// for the winter intro and any celebration to finish first. Checks again when the (dev) date changes.

export function DropGate() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  return userId ? <Gate key={userId} userId={userId} /> : null;
}

function Gate({ userId }: { userId: string }) {
  const segments = useSegments();
  const { state, today, devToday } = useWinterEvent();
  const [found, setFound] = useState<{ day: string; items: DropItem[] } | null>(null);
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const othersBusy = useOtherOverlayBusy('drops');
  const onHome = segments[0] === '(tabs)' && segments.length === 1;
  const winterLoaded = state !== null;

  useEffect(() => {
    // Wait for the event (its start is a drop day too) so everything new shows in one go.
    if (!winterLoaded) return;
    let cancelled = false;
    loadNewDrops(userId, today, state, __DEV__ ? devToday : null)
      .then(items => {
        if (!cancelled) setFound({ day: today, items });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // state is read for the event's start date; reloading on today/devToday/winterLoaded is enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, today, devToday, winterLoaded]);

  // A beat after reaching home, so the winter intro (which opens straight away) always goes first.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!onHome) return;
    const t = setTimeout(() => setArmed(true), 1200);
    return () => clearTimeout(t);
  }, [onHome]);

  const items = found && found.day === today && closedFor !== today ? found.items : [];
  const show = items.length > 0 && onHome && armed && !othersBusy;

  useEffect(() => {
    setOverlayBusy('drops', show);
    return () => setOverlayBusy('drops', false);
  }, [show]);

  return (
    <DropShowcase
      items={show ? items : []}
      onDone={() => {
        markDropsSeen(userId, items.map(i => i.key)).catch(() => {});
        setClosedFor(today);
      }}
    />
  );
}
