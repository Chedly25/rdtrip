/**
 * Skeleton
 *
 * WI-11.4: Updated with RUI design tokens
 *
 * Base skeleton components for loading states.
 * Use the transitions/LoadingStates for more advanced patterns.
 */

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-rui-grey-10 rounded-rui-8 ${className}`}
      style={style}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      // Shimmer gradient
      initial={{
        background: 'linear-gradient(90deg, var(--rui-grey-5) 0%, var(--rui-grey-10) 50%, var(--rui-grey-5) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

/**
 * Multi-line text skeleton
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton with image, title, and text
 */
export function SkeletonCard() {
  return (
    <div className="p-rui-24 bg-rui-white rounded-rui-16 border border-rui-grey-10">
      <Skeleton className="h-48 mb-4 rounded-rui-12" />
      <Skeleton className="h-6 w-3/4 mb-3" />
      <SkeletonText lines={2} />
    </div>
  );
}
