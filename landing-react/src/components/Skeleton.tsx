/**
 * Skeleton Components - Wanderlust Editorial Design
 *
 * Beautiful loading placeholders with warm cream tones and
 * gentle wave animations that feel organic and intentional.
 */

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'wave' | 'pulse' | 'none'
  style?: React.CSSProperties
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'wave',
  style: customStyle,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded-lg h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  }

  const style: React.CSSProperties = {
    background: '#F5F0E8',
    ...customStyle,
  }
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`
        relative overflow-hidden
        ${variantClasses[variant]}
        ${animation === 'pulse' ? 'animate-pulse' : ''}
        ${className}
      `}
      style={style}
    >
      {animation === 'wave' && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.15) 50%, transparent 100%)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  )
}

/**
 * Route Card Skeleton - Matches DashboardRouteCard layout
 */
export function RouteCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(44, 36, 23, 0.08), 0 0 0 1px rgba(44, 36, 23, 0.05)',
      }}
    >
      {/* Map preview area */}
      <Skeleton variant="rectangular" className="w-full h-36" />

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <Skeleton className="w-3/4 h-5 mb-2" />
        {/* Location */}
        <Skeleton className="w-1/2 h-4 mb-4" />

        {/* Stats row */}
        <div className="flex gap-4 mb-4">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <Skeleton variant="rounded" className="w-16 h-6" />
          <Skeleton variant="rounded" className="w-20 h-6" />
          <Skeleton variant="rounded" className="w-14 h-6" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="flex-1 h-10" />
          <Skeleton variant="rounded" className="w-10 h-10" />
          <Skeleton variant="rounded" className="w-10 h-10" />
        </div>
      </div>
    </div>
  )
}

/**
 * Quick Action Card Skeleton
 */
export function QuickActionSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(245, 240, 232, 0.5) 0%, rgba(245, 240, 232, 0.8) 100%)',
        border: '1px solid rgba(139, 115, 85, 0.1)',
      }}
    >
      {/* Icon */}
      <Skeleton variant="rounded" className="w-12 h-12 mb-4" />

      {/* Title */}
      <Skeleton className="w-2/3 h-5 mb-2" />

      {/* Description */}
      <Skeleton className="w-full h-4 mb-1" />
      <Skeleton className="w-4/5 h-4 mb-4" />

      {/* CTA */}
      <Skeleton className="w-24 h-4" />
    </div>
  )
}

/**
 * Dashboard Header Skeleton
 */
export function DashboardHeaderSkeleton() {
  return (
    <header
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2C2417 0%, #3D3225 100%)',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {/* Welcome text */}
            <div
              className="h-4 w-32 rounded mb-3"
              style={{ background: 'rgba(212, 168, 83, 0.3)' }}
            />
            {/* Title */}
            <div
              className="h-10 w-64 rounded-lg mb-3"
              style={{ background: 'rgba(255, 251, 245, 0.2)' }}
            />
            {/* Stats */}
            <div
              className="h-4 w-48 rounded"
              style={{ background: 'rgba(196, 184, 165, 0.3)' }}
            />
          </div>

          {/* CTA button */}
          <div
            className="h-12 w-40 rounded-xl"
            style={{ background: 'rgba(196, 88, 48, 0.4)' }}
          />
        </div>
      </div>
    </header>
  )
}

/**
 * Routes Grid Skeleton - Multiple route cards
 */
export function RoutesGridSkeleton({
  count = 6,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <RouteCardSkeleton />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Full Dashboard Skeleton - Complete loading state
 */
export function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
      }}
    >
      <DashboardHeaderSkeleton />

      <main className="container mx-auto px-4 py-10">
        {/* Quick Actions */}
        <section className="mb-12">
          <Skeleton className="w-32 h-6 mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionSkeleton />
            <QuickActionSkeleton />
            <QuickActionSkeleton />
          </div>
        </section>

        {/* Routes Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="w-28 h-6" />
            <div className="flex gap-3">
              <Skeleton variant="rounded" className="w-40 h-9" />
              <Skeleton variant="rounded" className="w-20 h-9" />
            </div>
          </div>

          <RoutesGridSkeleton count={6} />
        </section>
      </main>
    </div>
  )
}

/**
 * Inline Content Skeleton - For text/paragraph loading
 */
export function TextBlockSkeleton({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  const widths = ['100%', '92%', '85%', '95%', '78%', '88%']

  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  )
}

/**
 * Image Skeleton with aspect ratio
 */
export function ImageSkeleton({
  aspectRatio = '16/9',
  className = '',
}: {
  aspectRatio?: string
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        aspectRatio,
        background: '#F5F0E8',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.15) 50%, transparent 100%)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Decorative icon placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-xl opacity-30"
          style={{ background: '#E8E2D9' }}
        />
      </div>
    </div>
  )
}
