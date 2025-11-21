import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'wave'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 relative overflow-hidden'

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
    none: ''
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    >
      {animation === 'wave' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
    </div>
  )
}

// Pre-built skeleton patterns
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-white rounded-xl border border-gray-200 ${className}`}>
      <Skeleton variant="rectangular" className="w-full h-40 mb-4" />
      <Skeleton className="w-3/4 mb-2" />
      <Skeleton className="w-full mb-2" />
      <Skeleton className="w-5/6" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" className="w-20 h-8" />
        <Skeleton variant="rectangular" className="w-20 h-8" />
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton className="w-1/2 mb-2" />
            <Skeleton className="w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TimelineSkeleton({ days = 3, className = '' }: { days?: number; className?: string }) {
  return (
    <div className={`space-y-16 ${className}`}>
      {Array.from({ length: days }).map((_, i) => (
        <div key={i} className="relative">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="flex-1">
              <Skeleton className="w-32 mb-2" />
              <Skeleton className="w-48" />
            </div>
          </div>
          <div className="ml-24 grid grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}
