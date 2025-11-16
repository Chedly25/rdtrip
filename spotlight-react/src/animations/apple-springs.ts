/**
 * Apple Spring Presets
 * Phase 0: Animation System
 *
 * Based on research: Apple uses three preset spring animations
 * Source: CSS Spring Easing Generator (Apple defaults)
 */

import type { Transition } from 'framer-motion';

export interface SpringPreset {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Apple Spring Presets
 *
 * - smooth: Gentle, relaxed motion (good for large panels, modals)
 * - snappy: Quick, responsive (good for buttons, small elements, macOS app opening)
 * - bouncy: Playful, energetic (good for success states, celebrations)
 */
export const appleSpring = {
  /**
   * Smooth: Gentle, relaxed motion
   * Use for: Large panels, full-screen modals, page transitions
   */
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  },

  /**
   * Snappy: Quick, responsive
   * Use for: Buttons, dropdowns, tooltips, macOS app opening
   */
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },

  /**
   * Bouncy: Playful, energetic
   * Use for: Success animations, celebrations, playful interactions
   */
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 25,
    mass: 0.5,
  },
};

/**
 * GPU-Accelerated Properties
 *
 * ✅ ALWAYS ANIMATE (60fps guaranteed):
 * - transform (scale, translateX, translateY, translateZ, rotate)
 * - opacity
 * - filter (blur - use sparingly)
 *
 * ❌ NEVER ANIMATE (causes jank, layout thrashing):
 * - width, height
 * - top, left, right, bottom
 * - margin, padding
 * - border-width
 * - font-size
 */
export const gpuAccelerated = {
  properties: ['transform', 'opacity', 'filter'] as const,
  avoidProperties: [
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
    'border-width',
    'font-size',
  ] as const,
};

/**
 * Duration Presets (milliseconds)
 * Based on Apple HIG and research
 */
export const duration = {
  instant: 0,
  fast: 150,
  base: 200,
  slow: 300,
  deliberate: 500,
};

/**
 * Create a spring transition with duration cap
 * Useful for ensuring animations don't run too long
 */
export function springWithDuration(
  preset: keyof typeof appleSpring,
  maxDuration?: number
): Transition {
  return {
    ...appleSpring[preset],
    ...(maxDuration && { duration: maxDuration / 1000 }), // Convert to seconds
  };
}
