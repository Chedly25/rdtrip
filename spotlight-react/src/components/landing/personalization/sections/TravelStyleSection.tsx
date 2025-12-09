/**
 * Travel Style Section
 *
 * Lets users choose their travel style: how they prefer to experience destinations.
 * Single-select with visual card options.
 *
 * Options: Explorer, Relaxer, Culture Seeker, Adventurer, Foodie
 */

import { useId } from 'react'
import { motion } from 'framer-motion'
import { Compass, Coffee, Landmark, Mountain, Utensils } from 'lucide-react'
import type { TravelStyle } from '../../../../types'
import { SectionHeader, ToggleCard } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Travel style options with icons and descriptions
const TRAVEL_STYLES: {
  id: TravelStyle
  label: string
  description: string
  icon: typeof Compass
}[] = [
  {
    id: 'explorer',
    label: 'Explorer',
    description: 'Cover ground, see everything',
    icon: Compass,
  },
  {
    id: 'relaxer',
    label: 'Relaxer',
    description: 'Slow pace, deep experiences',
    icon: Coffee,
  },
  {
    id: 'culture',
    label: 'Culture Seeker',
    description: 'Museums, history, arts',
    icon: Landmark,
  },
  {
    id: 'adventurer',
    label: 'Adventurer',
    description: 'Active, outdoors, thrills',
    icon: Mountain,
  },
  {
    id: 'foodie',
    label: 'Foodie',
    description: 'Culinary experiences first',
    icon: Utensils,
  },
]

interface TravelStyleSectionProps {
  value?: TravelStyle
  onChange: (style: TravelStyle | undefined) => void
  className?: string
}

export function TravelStyleSection({
  value,
  onChange,
  className = '',
}: TravelStyleSectionProps) {
  const sectionId = useId()

  const handleSelect = (styleId: TravelStyle) => {
    // Toggle off if already selected
    onChange(value === styleId ? undefined : styleId)
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
        icon={Compass}
        title="How do you like to travel?"
        subtitle="Choose the style that fits you best"
        isCompleted={!!value}
      />

      {/* Style cards grid */}
      <div
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
        role="radiogroup"
        aria-label="Travel style options"
      >
        {TRAVEL_STYLES.map((style, index) => (
          <motion.div
            key={style.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.1 + index * 0.05,
              ...springTransition,
            }}
          >
            <ToggleCard
              label={style.label}
              description={style.description}
              icon={style.icon}
              isSelected={value === style.id}
              onClick={() => handleSelect(style.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Selected style highlight */}
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
              Your route will prioritize{' '}
              <span className="font-semibold" style={{ color: '#C45830' }}>
                {TRAVEL_STYLES.find((s) => s.id === value)?.label.toLowerCase()}
              </span>{' '}
              experiences
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default TravelStyleSection
