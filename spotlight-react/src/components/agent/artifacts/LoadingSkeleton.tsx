/**
 * LoadingSkeleton - Animated loading state for artifacts
 *
 * Shows while artifact is being generated or loaded
 * Pulse animation for better UX
 */

import { motion } from 'framer-motion';

export function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Grid skeleton for activity/hotel lists - 1 col on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
          >
            {/* Image skeleton */}
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
              </div>

              {/* Distance */}
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
