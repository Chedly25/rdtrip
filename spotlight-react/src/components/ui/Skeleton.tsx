import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gray-200 rounded-lg ${className}`}
      style={style}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${100 - (i * 15)}%` }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="p-6">
      <Skeleton className="h-48 mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <SkeletonText lines={2} />
    </div>
  )
}
