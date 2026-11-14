import React from 'react';
import Svg from 'react-native-svg';

import { PetMotion } from './Fx';
import { PipStage } from './PipLamb';

export type PetProps = {
  stage: PipStage;
  /** Rendered width in dp; height follows the 240x260 artboard. */
  size?: number;
  /** Set false for a still pet (thumbnails). The OS reduce-motion setting also stops it. */
  animated?: boolean;
};

/** Shared 240x260 artboard every companion is drawn on. */
export function PetFrame({
  size,
  animated,
  label,
  children,
}: {
  size: number;
  animated: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <PetMotion.Provider value={animated}>
      <Svg
        viewBox="0 0 240 260"
        width={size}
        height={(size * 260) / 240}
        accessibilityRole="image"
        accessibilityLabel={label}>
        {children}
      </Svg>
    </PetMotion.Provider>
  );
}
