/**
 * PageTransition
 *
 * WI-11.2: Smooth page transition component
 *
 * Wraps page content with Framer Motion animations for smooth
 * transitions between major app phases:
 * - Entry → Discovery → Generate → Spotlight → Today
 *
 * Design: Subtle, fast transitions that feel premium without being distracting
 */

import { motion, type Variants, type Transition } from 'framer-motion';
import { type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type TransitionVariant =
  | 'fade'           // Simple opacity fade
  | 'slideUp'        // Slide up from bottom (entering)
  | 'slideRight'     // Slide from right (forward navigation)
  | 'slideLeft'      // Slide from left (backward navigation)
  | 'scale'          // Scale + fade (reveal/celebration)
  | 'none';          // No animation

export interface PageTransitionProps {
  children: ReactNode;
  /** Transition style variant */
  variant?: TransitionVariant;
  /** Custom className */
  className?: string;
  /** Duration override in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
}

// ============================================================================
// Animation Variants
// ============================================================================

const transitionBase: Transition = {
  duration: 0.3,
  ease: [0.23, 1, 0.32, 1], // Smooth ease-out from design system
};

const variants: Record<TransitionVariant, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

// ============================================================================
// Component
// ============================================================================

export function PageTransition({
  children,
  variant = 'fade',
  className = '',
  duration,
  delay = 0,
}: PageTransitionProps) {
  const transition: Transition = {
    ...transitionBase,
    ...(duration !== undefined && { duration }),
    ...(delay > 0 && { delay }),
  };

  if (variant === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Pre-configured Variants for Common Use Cases
// ============================================================================

/**
 * Forward navigation transition (Entry → Discovery → Generate)
 */
export function PageTransitionForward({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <PageTransition variant="slideRight" className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Backward navigation transition
 */
export function PageTransitionBack({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <PageTransition variant="slideLeft" className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Reveal/celebration transition (Generate → Spotlight success)
 */
export function PageTransitionReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <PageTransition variant="scale" duration={0.4} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * Quick fade for utility views (Today view, etc.)
 */
export function PageTransitionFade({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <PageTransition variant="fade" duration={0.2} className={className}>
      {children}
    </PageTransition>
  );
}

export default PageTransition;
