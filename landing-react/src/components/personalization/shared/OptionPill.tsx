/**
 * Option Pill
 *
 * A beautiful, selectable tag/pill component for single or multi-select options.
 * Features smooth spring animations and warm editorial styling.
 *
 * Design: Warm parchment background when unselected, terracotta gradient when selected
 */

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 500, damping: 30 }

interface OptionPillProps {
  label: string
  icon?: LucideIcon
  isSelected: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'icon-only' | 'with-description'
  description?: string
  showCheckmark?: boolean
  className?: string
  disabled?: boolean
}

export function OptionPill({
  label,
  icon: Icon,
  isSelected,
  onClick,
  size = 'md',
  variant = 'default',
  description,
  showCheckmark = true,
  className = '',
  disabled = false,
}: OptionPillProps) {
  // Size classes
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5 sm:px-3.5 sm:py-2 sm:text-[13px]',
    lg: 'px-4 py-2 text-sm gap-2 sm:px-5 sm:py-2.5',
  }

  // Icon size classes
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
    lg: 'h-4 w-4 sm:h-5 sm:w-5',
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={springTransition}
      aria-pressed={isSelected}
      className={`
        relative flex items-center justify-center rounded-full font-medium
        transition-all focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
          : '#F5F0E8',
        color: isSelected ? '#FFFBF5' : '#5C4D3D',
        border: isSelected ? 'none' : '1px solid #E5DDD0',
        boxShadow: isSelected
          ? '0 4px 12px rgba(196, 88, 48, 0.25), 0 2px 4px rgba(196, 88, 48, 0.15)'
          : 'none',
        // @ts-expect-error CSS variable
        '--tw-ring-color': '#C45830',
      }}
    >
      {/* Icon */}
      {Icon && (
        <Icon className={iconSizeClasses[size]} aria-hidden="true" />
      )}

      {/* Label */}
      <span className="whitespace-nowrap">{label}</span>

      {/* Description (for with-description variant) */}
      {variant === 'with-description' && description && (
        <span
          className="ml-1 text-[10px] opacity-70 sm:text-[11px]"
          style={{ color: isSelected ? '#FFFBF5' : '#8B7355' }}
        >
          {description}
        </span>
      )}

      {/* Checkmark */}
      {showCheckmark && isSelected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={springTransition}
        >
          <Check
            className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'}
            strokeWidth={3}
            aria-hidden="true"
          />
        </motion.span>
      )}
    </motion.button>
  )
}

export default OptionPill
