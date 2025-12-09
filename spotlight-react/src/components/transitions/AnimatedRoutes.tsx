/**
 * AnimatedRoutes
 *
 * WI-11.2: Route-level animation wrapper
 *
 * Wraps React Router's Routes component with Framer Motion's AnimatePresence
 * to enable smooth page transitions between routes.
 *
 * Usage:
 * Replace <Routes> with <AnimatedRoutes> in App.tsx
 *
 * Architecture Decision:
 * - Uses location.pathname as key for AnimatePresence
 * - mode="wait" ensures exit animation completes before enter
 * - Each route can specify its own transition variant via PageTransition
 */

import { type ReactNode } from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export interface AnimatedRoutesProps {
  children: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * AnimatedRoutes
 *
 * Wraps Routes with AnimatePresence for page transitions.
 * The location key changes on navigation, triggering exit/enter animations.
 */
export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {children}
      </Routes>
    </AnimatePresence>
  );
}

export default AnimatedRoutes;
