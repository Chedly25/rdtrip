import { motion } from 'framer-motion';

const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear'
    }
  }
};

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Image skeleton */}
      <motion.div
        className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
        style={{ backgroundSize: '200% 100%' }}
        variants={shimmer}
        initial="initial"
        animate="animate"
      />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <motion.div
          className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
          style={{ backgroundSize: '200% 100%' }}
          variants={shimmer}
          initial="initial"
          animate="animate"
        />

        {/* Subtitle */}
        <motion.div
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3"
          style={{ backgroundSize: '200% 100%' }}
          variants={shimmer}
          initial="initial"
          animate="animate"
        />

        {/* Meta info */}
        <div className="flex gap-4">
          <motion.div
            className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        </div>

        {/* Description lines */}
        <div className="space-y-2">
          <motion.div
            className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <motion.div
            className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="h-10 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="space-y-2">
          <motion.div
            className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
              style={{ backgroundSize: '200% 100%' }}
              variants={shimmer}
              initial="initial"
              animate="animate"
            />
          ))}
        </div>
      </div>

      {/* Day cards skeleton */}
      {[1, 2, 3].map((day) => (
        <div key={day} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Day header */}
          <div className="p-6 border-b border-gray-100">
            <div className="space-y-2">
              <motion.div
                className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
                style={{ backgroundSize: '200% 100%' }}
                variants={shimmer}
                initial="initial"
                animate="animate"
              />
              <div className="flex gap-4">
                <motion.div
                  className="h-4 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
                  style={{ backgroundSize: '200% 100%' }}
                  variants={shimmer}
                  initial="initial"
                  animate="animate"
                />
                <motion.div
                  className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
                  style={{ backgroundSize: '200% 100%' }}
                  variants={shimmer}
                  initial="initial"
                  animate="animate"
                />
              </div>
            </div>
          </div>

          {/* Day content */}
          <div className="p-6 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PhotoGallerySkeleton() {
  return (
    <div className="space-y-3">
      {/* Main photo */}
      <motion.div
        className="aspect-[16/9] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"
        style={{ backgroundSize: '200% 100%' }}
        variants={shimmer}
        initial="initial"
        animate="animate"
      />

      {/* Thumbnails */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-20 h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
            style={{ backgroundSize: '200% 100%' }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        ))}
      </div>
    </div>
  );
}
