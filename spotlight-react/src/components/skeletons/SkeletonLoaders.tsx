/**
 * SkeletonLoaders - Beautiful Loading States
 * Phase 6.1: Shimmer effect skeleton screens
 */

import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    
    repeat: Infinity,
  },
};

const shimmerGradient = `
  linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  )
`;

/** Skeleton for City Cards */
export const CityCardSkeleton = () => (
  <div className="flex-shrink-0 w-80 bg-white rounded-2xl overflow-hidden shadow-lg">
    {/* Image skeleton */}
    <motion.div
      className="h-48 bg-gray-200 relative overflow-hidden"
      {...shimmer}
      style={{
        backgroundImage: shimmerGradient,
        backgroundSize: '200% 100%',
      }}
    />

    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-gray-200 rounded-full" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>

      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

/** Skeleton for Itinerary Items */
export const ItineraryItemSkeleton = () => (
  <div className="p-4 border-b border-gray-200 space-y-3">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
    <div className="space-y-2 pl-13">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-4/5" />
    </div>
  </div>
);

/** Skeleton for Map */
export const MapSkeleton = () => (
  <motion.div
    className="w-full h-full bg-gray-100 flex items-center justify-center relative overflow-hidden"
    {...shimmer}
    style={{
      backgroundImage: shimmerGradient,
      backgroundSize: '200% 100%',
    }}
  >
    <div className="text-gray-400 text-center">
      <div className="text-6xl mb-4">🗺️</div>
      <p className="text-sm font-medium">Loading map...</p>
    </div>
  </motion.div>
);

/** Skeleton for Chat Messages */
export const ChatMessageSkeleton = () => (
  <div className="p-3 space-y-2">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-gray-200 rounded-full" />
      <div className="h-4 bg-gray-200 rounded w-24" />
    </div>
    <div className="ml-10 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

/** Skeleton for Expense Items */
export const ExpenseItemSkeleton = () => (
  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
    <div className="flex-1 space-y-2">
      <div className="h-5 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
    <div className="h-6 bg-gray-200 rounded w-20" />
  </div>
);

/** Skeleton for Task Items */
export const TaskItemSkeleton = () => (
  <div className="p-3 border-b border-gray-200 flex items-center gap-3">
    <div className="h-5 w-5 bg-gray-200 rounded" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

/** Generic Spinner */
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <motion.div
      className={`${sizes[size]} border-4 border-gray-200 border-t-primary-500 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        
        repeat: Infinity,
      }}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    />
  );
};
