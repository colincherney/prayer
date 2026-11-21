import React from 'react';

import { EventScreen } from '@/components/winter/EventScreen';
import { SkinContext, WINTER_SKIN } from '@/components/winter/winterUi';

/** The Long Winter's screen. */
export default function WinterScreen() {
  return (
    <SkinContext.Provider value={WINTER_SKIN}>
      <EventScreen />
    </SkinContext.Provider>
  );
}
