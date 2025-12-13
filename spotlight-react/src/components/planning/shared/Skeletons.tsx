/**
 * Planning Skeletons
 *
 * Loading skeleton components for the planning feature.
 * Matches the Wanderlust Editorial design system.
 */

import { motion } from 'framer-motion';

// Pulse animation for skeletons (defined directly for TypeScript compatibility)
const pulseAnimation = {
  opacity: [0.4, 0.7, 0.4],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/**
 * Base skeleton with shimmer effect
 */
interface SkeletonBaseProps {
  className?: string;
}

function SkeletonBase({ className = '' }: SkeletonBaseProps) {
  return (
    <motion.div
      animate={pulseAnimation}
      className={`bg-[#E5DDD0]/60 rounded ${className}`}
    />
  );
}

/**
 * Skeleton for PlanCard suggestion
 */
export function CardSkeleton() {
  return (
    <div className="bg-[#FFFBF5] rounded-xl border border-[#E5DDD0] p-4 space-y-3">
      <div className="flex items-start gap-3">
        {/* Image placeholder */}
        <SkeletonBase className="w-20 h-20 rounded-xl flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-5 w-3/4" />
          <SkeletonBase className="h-4 w-1/2" />
          <div className="flex items-center gap-2 pt-1">
            <SkeletonBase className="h-4 w-16" />
            <SkeletonBase className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2">
        <SkeletonBase className="h-6 w-16 rounded-full" />
        <SkeletonBase className="h-6 w-20 rounded-full" />
        <SkeletonBase className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for ClusterCard
 */
export function ClusterSkeleton() {
  return (
    <div className="bg-[#FFFBF5] rounded-2xl border border-[#E5DDD0] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <SkeletonBase className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-5 w-32" />
          <SkeletonBase className="h-4 w-24" />
        </div>
        <SkeletonBase className="w-8 h-8 rounded-lg" />
      </div>

      {/* Items */}
      <div className="space-y-2">
        <PlanItemSkeleton />
        <PlanItemSkeleton />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-[#F5F0E8]">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-4 w-28" />
      </div>
    </div>
  );
}

/**
 * Skeleton for PlanItem (inside a cluster)
 */
export function PlanItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-xl">
      <SkeletonBase className="w-5 h-5 rounded" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBase className="h-4 w-2/3" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      <SkeletonBase className="w-6 h-6 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for category section header
 */
export function CategoryHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <SkeletonBase className="w-8 h-8 rounded-lg" />
        <SkeletonBase className="h-5 w-24" />
      </div>
      <SkeletonBase className="h-8 w-20 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for Companion message
 */
export function CompanionMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <SkeletonBase className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-4/5" />
        <SkeletonBase className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Skeleton for CityTab
 */
export function CityTabSkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <SkeletonBase className="w-6 h-6 rounded-full" />
      <SkeletonBase className="h-4 w-20" />
      <SkeletonBase className="h-5 w-8 rounded-full" />
    </div>
  );
}

/**
 * Full page loading skeleton for PlanningPage
 */
export function PlanningPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-[#FFFBF5]/95 border-b border-[#E5DDD0] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <SkeletonBase className="w-8 h-8 rounded-lg" />
          <div className="flex flex-col items-center">
            <SkeletonBase className="h-5 w-32 mb-1" />
            <SkeletonBase className="h-3 w-24" />
          </div>
          <div className="flex gap-2">
            <SkeletonBase className="w-20 h-8 rounded-lg" />
            <SkeletonBase className="w-24 h-8 rounded-xl" />
          </div>
        </div>
      </div>

      {/* City tabs skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5DDD0] bg-[#FFFBF5]">
        <CityTabSkeleton />
        <CityTabSkeleton />
        <CityTabSkeleton />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-[#E5DDD0] p-4 sm:p-6 space-y-4">
          <div className="mb-4">
            <SkeletonBase className="h-6 w-24 mb-1" />
            <SkeletonBase className="h-4 w-40" />
          </div>
          <ClusterSkeleton />
          <ClusterSkeleton />
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-[55%] p-4 sm:p-6 space-y-6">
          <div className="text-center mb-4">
            <SkeletonBase className="h-6 w-40 mx-auto mb-1" />
            <SkeletonBase className="h-4 w-56 mx-auto" />
          </div>

          <div className="flex gap-2 justify-center mb-6">
            <SkeletonBase className="h-8 w-16 rounded-full" />
            <SkeletonBase className="h-8 w-24 rounded-full" />
            <SkeletonBase className="h-8 w-20 rounded-full" />
          </div>

          <div className="space-y-4">
            <CategoryHeaderSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* Companion panel skeleton */}
      <div className="border-t border-[#E5DDD0] bg-[#FFFBF5] p-4">
        <div className="flex items-center gap-4">
          <SkeletonBase className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <SkeletonBase className="h-4 w-32 mb-1" />
            <SkeletonBase className="h-3 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of card skeletons for loading state
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  CardSkeleton,
  ClusterSkeleton,
  PlanItemSkeleton,
  CategoryHeaderSkeleton,
  CompanionMessageSkeleton,
  CityTabSkeleton,
  PlanningPageSkeleton,
  CardGridSkeleton,
};
