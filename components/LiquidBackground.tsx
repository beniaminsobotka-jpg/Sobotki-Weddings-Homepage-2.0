import React from 'react';
import { LiquidCanvas } from './three/LiquidCanvas';
import type { LiquidVariant } from './three/liquidScene';

// One WebGL shader replaces the three blurred, blended CSS orbs that used to repaint every frame.
export const LiquidBackground: React.FC<{ variant?: LiquidVariant }> = ({ variant = 'paper' }) => (
  <LiquidCanvas variant={variant} />
);
