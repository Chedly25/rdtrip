/**
 * Section Header
 *
 * Consistent header component for personalization sections.
 * Features an icon, title, optional subtitle, and completion indicator.
 *
 * Design: Warm editorial style with terracotta accent
 */

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  isCompleted?: boolean
  className?: string
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  isCompleted = false,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2.5">
        <motion.div
          animate={{
            scale: isCompleted ? [1, 1.1, 1] : 1,
            rotate: isCompleted ? [0, -5, 5, 0] : 0,
          }}
          transition={{ duration: 0.4, ease: editorialEasing }}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9"
          style={{
            background: isCompleted
              ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
              : '#F5F0E8',
          }}
        >
          <Icon
            className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
            style={{ color: isCompleted ? '#FFFBF5' : '#C45830' }}
            aria-hidden="true"
          />
        </motion.div>
        <div>
          <h4
            className="text-sm font-semibold leading-tight sm:text-[15px]"
            style={{
              color: '#2C2417',
              fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
            }}
          >
            {title}
          </h4>
          {subtitle && (
            <p
              className="mt-0.5 text-[11px] leading-tight sm:text-xs"
              style={{ color: '#8B7355' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Completion indicator */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isCompleted ? 1 : 0,
          opacity: isCompleted ? 1 : 0,
        }}
        transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
        className="flex items-center gap-1 rounded-full px-2 py-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
        }}
      >
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: '#C45830' }}
        />
        <span
          className="text-[10px] font-medium sm:text-[11px]"
          style={{ color: '#C45830' }}
        >
          Set
        </span>
      </motion.div>
    </div>
  )
}

export default SectionHeader
