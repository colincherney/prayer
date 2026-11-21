import React from 'react';

import { EventScreen } from '@/components/winter/EventScreen';
import { SkinContext, BELOVED_SKIN } from '@/components/winter/winterUi';

/** The Beloved (the Valentine event) screen. */
export default function BelovedScreen() {
  return (
    <SkinContext.Provider value={BELOVED_SKIN}>
      <EventScreen />
    </SkinContext.Provider>
  );
}
