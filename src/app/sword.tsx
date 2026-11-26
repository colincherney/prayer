import React from 'react';

import { EventScreen } from '@/components/winter/EventScreen';
import { SkinContext, SWORD_SKIN } from '@/components/winter/winterUi';

/** The Sword of the Spirit (the June event) screen. */
export default function SwordScreen() {
  return (
    <SkinContext.Provider value={SWORD_SKIN}>
      <EventScreen />
    </SkinContext.Provider>
  );
}
