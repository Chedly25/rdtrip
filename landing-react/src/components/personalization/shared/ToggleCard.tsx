/**
 * Toggle Card
 *
 * A card-style toggle option for accessibility and other checkbox-like selections.
 * Features smooth spring animations and warm editorial styling.
 *
 * Design: Cream background, terracotta accent ring when selected
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 500, damping: 30 }
const editorialEasing = [0.25, 0.1, 0.25, 1] as const

interface ToggleCardProps {
  label: string
  description?: string
  icon?: LucideIcon
  isSelected: boolean
  onClick: () => void
  variant?: 'default' | 'compact' | 'horizontal'
  className?: string
  disabled?: boolean
}

export function ToggleCard({
  label,
  description,
  icon: Icon,
  isSelected,
  onClick,
  variant = 'default',
  className = '',
  disabled = false,
}: ToggleCardProps) {
  // Variant-specific classes
  const variantClasses = {
    default: 'flex-col items-center text-center p-4 sm:p-5',
    compact: 'flex-row items-center gap-3 p-3 sm:p-3.5',
    horizontal: 'flex-row items-center gap-3 p-3 sm:p-4',
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={springTransition}
      aria-pressed={isSelected}
      className={`
        relative flex rounded-2xl transition-all
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2
        ${variantClasses[variant]}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        background: isSelected
          ? 'linear-gradient(180deg, #FEF3EE 0%, #FFFBF5 100%)'
          : '#F5F0E8',
        border: isSelected ? '2px solid #C45830' : '2px solid transparent',
        boxShadow: isSelected
          ? '0 4px 16px rgba(196, 88, 48, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        // @ts-expect-error CSS variable
        '--tw-ring-color': '#C45830',
      }}
    >
      {/* Checkbox indicator for horizontal/compact variants */}
      {(variant === 'horizontal' || variant === 'compact') && (
        <div
          className={`
            flex flex-shrink-0 items-center justify-center rounded-md
            border-2 transition-all
            ${variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'}
          `}
          style={{
            borderColor: isSelected ? '#C45830' : '#D4C4B0',
            background: isSelected
              ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
              : 'transparent',
          }}
        >
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={springTransition}
              >
                <Check
                  className={variant === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'}
                  style={{ color: '#FFFBF5' }}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Icon for default variant */}
      {variant === 'default' && Icon && (
        <motion.div
          animate={{
            scale: isSelected ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.3, ease: editorialEasing }}
          className="mb-2 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14"
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
              : '#FFFBF5',
            boxShadow: isSelected
              ? '0 4px 12px rgba(196, 88, 48, 0.2)'
              : '0 2px 8px rgba(44, 36, 23, 0.08)',
          }}
        >
          <Icon
            className="h-6 w-6 sm:h-7 sm:w-7"
            style={{ color: isSelected ? '#FFFBF5' : '#C45830' }}
            aria-hidden="true"
          />
        </motion.div>
      )}

      {/* Content */}
      <div
        className={`
          flex-1 min-w-0
          ${variant === 'default' ? 'text-center' : 'text-left'}
        `}
      >
        <p
          className={`
            font-semibold leading-tight
            ${variant === 'compact' ? 'text-xs sm:text-[13px]' : 'text-sm sm:text-[15px]'}
          `}
          style={{
            color: '#2C2417',
            fontFamily: variant === 'default'
              ? "var(--font-display, 'Fraunces', Georgia, serif)"
              : 'inherit',
          }}
        >
          {label}
        </p>
        {description && (
          <p
            className={`
              mt-0.5 leading-snug
              ${variant === 'compact' ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'}
            `}
            style={{ color: '#8B7355' }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Selection indicator for default variant */}
      {variant === 'default' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isSelected ? 1 : 0,
            opacity: isSelected ? 1 : 0,
          }}
          transition={springTransition}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full sm:h-6 sm:w-6"
          style={{
            background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
          }}
        >
          <Check
            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
            style={{ color: '#FFFBF5' }}
            strokeWidth={3}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </motion.button>
  )
}

export default ToggleCard
