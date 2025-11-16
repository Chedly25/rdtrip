/**
 * macOS-Style Transitions
 * Phase 0: Animation System
 *
 * Pre-configured animations matching macOS behavior
 * - App opening animation (scale + fade + blur)
 * - Panel slide animations
 * - Fade animations
 */

import { appleSpring, duration } from './apple-springs';
import type { Variants } from 'framer-motion';

/**
 * macOS App Opening Animation
 *
 * Used when opening apps on macOS:
 * - Starts slightly smaller (0.95) and below screen
 * - Scales to full size (1.0)
 * - Fades from 0 to 1
 * - Progressive unblur (8px → 0px)
 * - 300ms duration with snappy spring
 *
 * Usage: Agent suggestions panel, modals, large panels
 */
export const macOSOpen = {
  initial: {
    y: '100%', // Starts below screen
    opacity: 0,
    scale: 0.95, // Slightly smaller
    filter: 'blur(8px)', // Blurred
  },
  animate: {
    y: 0, // Slides to position
    opacity: 1,
    scale: 1, // Full size
    filter: 'blur(0px)', // Sharp
  },
  exit: {
    y: '100%',
    opacity: 0,
    scale: 0.95,
    filter: 'blur(8px)',
  },
  transition: {
    ...appleSpring.snappy,
    duration: 0.3, // 300ms
  },
};

/**
 * Slide from Bottom (Panel Style)
 *
 * Simpler than macOS open - no scale or blur
 * Use for: Small panels, drawers, bottom sheets
 */
export const slideFromBottom = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: '100%',
    opacity: 0,
  },
  transition: appleSpring.snappy,
};

/**
 * Slide from Right (Sidebar Style)
 *
 * Use for: Sidebars, detail panels, secondary content
 */
export const slideFromRight = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: '100%',
    opacity: 0,
  },
  transition: appleSpring.smooth,
};

/**
 * Fade Animation
 *
 * Simple opacity transition
 * Use for: Tooltips, notifications, subtle content changes
 */
export const fade = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
  transition: {
    duration: duration.base / 1000, // 200ms
  },
};

/**
 * Fade with Blur
 *
 * Opacity + progressive blur
 * Use for: Tab switching, content transitions
 */
export const fadeWithBlur = {
  initial: {
    opacity: 0,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
  },
  transition: {
    duration: duration.base / 1000, // 200ms
  },
};

/**
 * Scale In (Zoom)
 *
 * Grows from small to full size
 * Use for: Modals, popovers, dropdowns
 */
export const scaleIn = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
  },
  transition: appleSpring.snappy,
};

/**
 * Lift Effect (Hover/Focus)
 *
 * Subtle upward movement + shadow increase
 * Use for: Cards, buttons on hover
 */
export function createLiftEffect(distance: number = 8) {
  return {
    y: -distance,
    scale: 1.02,
    transition: appleSpring.snappy,
  };
}

/**
 * Press Effect (Active)
 *
 * Subtle downward press
 * Use for: Buttons, clickable cards on tap
 */
export function createPressEffect() {
  return {
    scale: 0.98,
    y: 0,
    transition: appleSpring.snappy,
  };
}

/**
 * Stagger Children Animation
 *
 * Animate list items with delay between each
 * Use for: Lists, grids, card collections
 */
export function createStaggerVariants(staggerDelay: number = 0.05): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        ...appleSpring.snappy,
        delay: i * staggerDelay,
      },
    }),
  };
}
