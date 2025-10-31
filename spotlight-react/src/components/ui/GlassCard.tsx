import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils/cn'

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  hover?: boolean
  blur?: 'sm' | 'md' | 'lg' | 'xl'
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  blur = 'md',
  ...props
}: GlassCardProps) {
  const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white/70',
        blurMap[blur],
        'border border-white/30',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
        hover && 'transition-all duration-300 hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.25)] hover:bg-white/80',
        className
      )}
      whileHover={hover ? { y: -2 } : undefined}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  )
}
