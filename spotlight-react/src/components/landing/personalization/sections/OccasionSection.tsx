/**
 * Occasion Section
 *
 * Lets users specify the occasion for their trip.
 * Helps personalize the route with appropriate experiences.
 *
 * Options: Honeymoon, Anniversary, Birthday, Graduation, Retirement,
 *          Babymoon, Reunion, Solo Adventure, Girls/Guys Trip, Family, Just Because
 */

import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Check,
  Wine,
  Cake,
  GraduationCap,
  Sunrise,
  Baby,
  Users,
  Backpack,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TripOccasion } from '../../../../types'
import { SectionHeader } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Occasion options with icons
const OCCASION_OPTIONS: {
  id: TripOccasion
  label: string
  icon: LucideIcon
}[] = [
  { id: 'honeymoon', label: 'Honeymoon', icon: Heart },
  { id: 'anniversary', label: 'Anniversary', icon: Wine },
  { id: 'birthday', label: 'Birthday', icon: Cake },
  { id: 'graduation', label: 'Graduation', icon: GraduationCap },
  { id: 'retirement', label: 'Retirement', icon: Sunrise },
  { id: 'babymoon', label: 'Babymoon', icon: Baby },
  { id: 'reunion', label: 'Reunion', icon: Users },
  { id: 'solo-adventure', label: 'Solo Adventure', icon: Backpack },
  { id: 'girls-trip', label: 'Girls Trip', icon: Users },
  { id: 'guys-trip', label: 'Guys Trip', icon: Users },
  { id: 'family-vacation', label: 'Family Vacation', icon: Users },
  { id: 'just-because', label: 'Just Because', icon: Sparkles },
]

interface OccasionSectionProps {
  value?: TripOccasion
  onChange: (occasion: TripOccasion | undefined) => void
  className?: string
}

export function OccasionSection({
  value,
  onChange,
  className = '',
}: OccasionSectionProps) {
  const sectionId = useId()

  const handleSelect = (occasionId: TripOccasion) => {
    onChange(value === occasionId ? undefined : occasionId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: editorialEasing }}
      className={className}
      role="group"
      aria-labelledby={`${sectionId}-label`}
    >
      <SectionHeader
        icon={Heart}
        title="What's the occasion?"
        subtitle="Help us set the mood"
        isCompleted={!!value}
      />

      {/* Occasion pills */}
      <div
        className="mt-4 flex flex-wrap gap-1.5 sm:gap-2"
        role="radiogroup"
        aria-label="Trip occasion options"
      >
        {OCCASION_OPTIONS.map((occasion, index) => {
          const Icon = occasion.icon
          return (
            <motion.button
              key={occasion.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.025, ...springTransition }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(occasion.id)}
              role="radio"
              aria-checked={value === occasion.id}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[13px]"
              style={{
                background: value === occasion.id
                  ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                  : '#F5F0E8',
                color: value === occasion.id ? '#FFFBF5' : '#5C4D3D',
                border: value === occasion.id ? 'none' : '1px solid #E5DDD0',
                boxShadow: value === occasion.id
                  ? '0 4px 12px rgba(196, 88, 48, 0.25)'
                  : 'none',
                // @ts-expect-error CSS variable
                '--tw-ring-color': '#C45830',
              }}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>{occasion.label}</span>
              <AnimatePresence>
                {value === occasion.id && (
                  <motion.span
                    initial={{ scale: 0, width: 0 }}
                    animate={{ scale: 1, width: 'auto' }}
                    exit={{ scale: 0, width: 0 }}
                    transition={springTransition}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* Selected occasion highlight */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: editorialEasing }}
            className="mt-3 overflow-hidden"
          >
            <div
              className="rounded-xl p-3 text-center sm:p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.08) 0%, rgba(212, 168, 83, 0.08) 100%)',
                border: '1px solid rgba(196, 88, 48, 0.15)',
              }}
            >
              <p className="text-xs sm:text-sm" style={{ color: '#5C4D3D' }}>
                We'll curate experiences perfect for your{' '}
                <span className="font-semibold" style={{ color: '#C45830' }}>
                  {OCCASION_OPTIONS.find((o) => o.id === value)?.label.toLowerCase()}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default OccasionSection
