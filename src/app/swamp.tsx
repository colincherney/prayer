import React from 'react';

import { EventScreen } from '@/components/winter/EventScreen';
import { SkinContext, SWAMP_SKIN } from '@/components/winter/winterUi';

/** The Swamp King's screen. */
export default function SwampScreen() {
  return (
    <SkinContext.Provider value={SWAMP_SKIN}>
      <EventScreen />
    </SkinContext.Provider>
  );
}
