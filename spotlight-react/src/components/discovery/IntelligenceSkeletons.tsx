/**
 * IntelligenceSkeletons
 *
 * Beautiful skeleton loading states for all intelligence components.
 * These provide visual feedback during data loading and create
 * a smooth transition to the actual content.
 *
 * Design Philosophy:
 * - Warm, subtle shimmer animation
 * - Accurate layout representation
 * - Calming visual rhythm
 * - Accessible (reduced motion support)
 */

import { motion } from 'framer-motion';

// =============================================================================
// Base Shimmer Component
// =============================================================================

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Shimmer({ className = '', children, style }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-animation" />
      {children}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-animation {
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .shimmer-animation {
            animation: none;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// Skeleton Primitives
// =============================================================================

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLine({ width = '100%', height = '1rem', className = '' }: SkeletonLineProps) {
  return (
    <Shimmer
      className={`bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({ size = '2.5rem', className = '' }: { size?: string; className?: string }) {
  return (
    <Shimmer
      className={`bg-gray-200 rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonRect({
  width = '100%',
  height = '6rem',
  rounded = 'xl',
  className = '',
}: {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <Shimmer
      className={`bg-gray-200 rounded-${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

// =============================================================================
// City Intelligence Card Skeleton
// =============================================================================

export function CityIntelligenceCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border-2 border-transparent shadow-lg bg-white overflow-hidden"
    >
      {/* Header image skeleton */}
      <div className="relative h-36">
        <Shimmer className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Title skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <SkeletonLine width="60%" height="1.5rem" className="mb-2 bg-white/30" />
          <div className="flex gap-3">
            <SkeletonLine width="4rem" height="1rem" className="bg-white/30" />
            <SkeletonLine width="5rem" height="1rem" className="bg-white/30" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4">
        {/* Story hook */}
        <div className="mb-4">
          <SkeletonLine width="90%" height="0.875rem" className="mb-2" />
          <SkeletonLine width="100%" height="0.875rem" className="mb-1" />
          <SkeletonLine width="70%" height="0.875rem" />
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-3">
          <SkeletonLine width="5rem" height="0.75rem" />
          <SkeletonLine width="4rem" height="0.75rem" />
          <SkeletonLine width="3.5rem" height="0.75rem" />
        </div>

        {/* Expand button */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <SkeletonLine width="8rem" height="1rem" className="mx-auto" />
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Detail View Skeleton
// =============================================================================

export function DetailViewSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <div className="relative h-80">
        <Shimmer className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <SkeletonLine width="4rem" height="1.5rem" className="mb-4 bg-white/30 rounded-full" />
          <SkeletonLine width="50%" height="2.5rem" className="mb-3 bg-white/30" />
          <SkeletonLine width="80%" height="1rem" className="mb-1 bg-white/30" />
          <SkeletonLine width="60%" height="1rem" className="bg-white/30" />
        </div>
      </div>

      {/* Navigation skeleton */}
      <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10">
        <div className="flex gap-3 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <SkeletonLine key={i} width="5rem" height="2rem" className="rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="max-w-4xl mx-auto p-8 space-y-12">
        {/* Match score section */}
        <section>
          <SkeletonLine width="8rem" height="1.25rem" className="mb-6" />
          <div className="flex items-center gap-8">
            <SkeletonCircle size="7rem" />
            <div className="flex-1 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonLine width="60%" height="0.875rem" />
                  <SkeletonLine width="3rem" height="1.5rem" className="rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Time blocks section */}
        <section>
          <SkeletonLine width="10rem" height="1.25rem" className="mb-6" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonRect key={i} height="8rem" className="rounded-2xl" />
            ))}
          </div>
        </section>

        {/* Clusters section */}
        <section>
          <SkeletonLine width="9rem" height="1.25rem" className="mb-6" />
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <SkeletonCircle size="2.5rem" />
                  <div className="flex-1">
                    <SkeletonLine width="40%" height="1rem" className="mb-1" />
                    <SkeletonLine width="60%" height="0.75rem" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => (
                    <SkeletonRect key={j} height="4rem" className="rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// =============================================================================
// Agent Status Skeleton
// =============================================================================

export function AgentStatusSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
          <SkeletonCircle size="2rem" />
          <div className="flex-1">
            <SkeletonLine width="60%" height="0.75rem" className="mb-1" />
            <SkeletonLine width="40%" height="0.625rem" />
          </div>
          <SkeletonLine width="3rem" height="1.25rem" className="rounded-full" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Sidebar Skeleton
// =============================================================================

export function SidebarSkeleton() {
  return (
    <div className="w-80 h-full bg-white/95 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <SkeletonCircle size="2.5rem" />
          <div className="flex-1">
            <SkeletonLine width="50%" height="1rem" className="mb-1" />
            <SkeletonLine width="30%" height="0.75rem" />
          </div>
        </div>

        {/* Progress bar */}
        <SkeletonLine width="100%" height="0.375rem" className="mt-4 rounded-full" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <SkeletonLine width="6rem" height="0.625rem" className="mb-2" />

        {/* City cards */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <SkeletonCircle size="1.5rem" />
              <div className="flex-1">
                <SkeletonLine width="60%" height="0.875rem" className="mb-1" />
                <SkeletonLine width="40%" height="0.625rem" />
              </div>
            </div>
            <SkeletonLine width="100%" height="0.25rem" className="mt-3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Progress Panel Skeleton
// =============================================================================

export function ProgressPanelSkeleton() {
  return (
    <div className="max-w-md w-full bg-white/95 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <SkeletonCircle size="3rem" />
          <div className="flex-1">
            <SkeletonLine width="60%" height="1rem" className="mb-1" />
            <div className="flex gap-2">
              <SkeletonLine width="4rem" height="0.75rem" />
              <SkeletonLine width="2.5rem" height="0.75rem" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <SkeletonLine width="100%" height="0.375rem" className="mt-3 rounded-full" />

        {/* Agent dots */}
        <div className="flex items-center gap-2 mt-3">
          <SkeletonLine width="1rem" height="0.875rem" />
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <SkeletonCircle key={i} size="0.375rem" />
            ))}
          </div>
          <SkeletonLine width="4rem" height="0.625rem" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Cluster Map Overlay Skeleton
// =============================================================================

export function ClusterMapOverlaySkeleton() {
  return (
    <div className="w-72 bg-white/95 rounded-2xl shadow-xl border border-white/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <SkeletonCircle size="2.25rem" />
        <div className="flex-1">
          <SkeletonLine width="60%" height="0.875rem" className="mb-1" />
          <SkeletonLine width="40%" height="0.625rem" />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <SkeletonLine key={i} width="4rem" height="1.75rem" className="rounded-lg" />
        ))}
      </div>

      {/* Cluster list */}
      <div className="border-t border-gray-100">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <SkeletonCircle size="2rem" />
            <div className="flex-1">
              <SkeletonLine width="70%" height="0.875rem" className="mb-1" />
              <SkeletonLine width="50%" height="0.625rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Hidden Gems Skeleton
// =============================================================================

export function HiddenGemsSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonLine width="8rem" height="1.25rem" className="mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
          <div className="flex items-start gap-3">
            <SkeletonCircle size="2.5rem" />
            <div className="flex-1">
              <SkeletonLine width="50%" height="1rem" className="mb-2" />
              <SkeletonLine width="90%" height="0.75rem" className="mb-1" />
              <SkeletonLine width="70%" height="0.75rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Time Blocks Skeleton
// =============================================================================

export function TimeBlocksSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-3">
            <SkeletonCircle size="1.5rem" />
            <SkeletonLine width="60%" height="0.875rem" />
          </div>
          <SkeletonLine width="2rem" height="1.5rem" className="mb-2" />
          <SkeletonLine width="80%" height="0.625rem" className="mb-1" />
          <SkeletonLine width="60%" height="0.625rem" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Match Score Skeleton
// =============================================================================

export function MatchScoreSkeleton() {
  return (
    <div className="flex items-center gap-8">
      {/* Score ring */}
      <div className="relative">
        <SkeletonCircle size="7rem" />
        <div className="absolute inset-0 flex items-center justify-center">
          <SkeletonLine width="2.5rem" height="1.5rem" />
        </div>
      </div>

      {/* Reasons */}
      <div className="flex-1 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonCircle size="0.5rem" />
            <SkeletonLine width="70%" height="0.875rem" />
            <SkeletonLine width="2.5rem" height="1.25rem" className="rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export const Skeletons = {
  CityIntelligenceCard: CityIntelligenceCardSkeleton,
  DetailView: DetailViewSkeleton,
  AgentStatus: AgentStatusSkeleton,
  Sidebar: SidebarSkeleton,
  ProgressPanel: ProgressPanelSkeleton,
  ClusterMapOverlay: ClusterMapOverlaySkeleton,
  HiddenGems: HiddenGemsSkeleton,
  TimeBlocks: TimeBlocksSkeleton,
  MatchScore: MatchScoreSkeleton,
};

export default Skeletons;
