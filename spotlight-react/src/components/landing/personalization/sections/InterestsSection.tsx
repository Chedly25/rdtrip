/**
 * Interests Section
 *
 * Multi-select for user interests - what draws them to destinations.
 * Organized by category with beautiful pill-style selection.
 *
 * Categories: Culture, Nature, Food & Drink, Experience
 */

import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  ChevronDown,
  Scroll,
  Palette,
  Building2,
  Frame,
  Drama,
  Leaf,
  Umbrella,
  Mountain,
  Backpack,
  UtensilsCrossed,
  Wine,
  Moon,
  ShoppingBag,
  Camera,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PersonalizationInterest } from '../../../../types'
import { SectionHeader, OptionPill } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Interest options organized by category
const INTEREST_CATEGORIES: {
  id: string
  label: string
  interests: { id: PersonalizationInterest; label: string; icon: LucideIcon }[]
}[] = [
  {
    id: 'culture',
    label: 'Culture & Arts',
    interests: [
      { id: 'history', label: 'History', icon: Scroll },
      { id: 'art', label: 'Art', icon: Palette },
      { id: 'architecture', label: 'Architecture', icon: Building2 },
      { id: 'museums', label: 'Museums', icon: Frame },
      { id: 'local-culture', label: 'Local Culture', icon: Drama },
    ],
  },
  {
    id: 'nature',
    label: 'Nature & Outdoors',
    interests: [
      { id: 'nature', label: 'Nature', icon: Leaf },
      { id: 'beaches', label: 'Beaches', icon: Umbrella },
      { id: 'mountains', label: 'Mountains', icon: Mountain },
      { id: 'adventure', label: 'Adventure', icon: Backpack },
    ],
  },
  {
    id: 'food',
    label: 'Food & Drink',
    interests: [
      { id: 'food', label: 'Food', icon: UtensilsCrossed },
      { id: 'wine', label: 'Wine', icon: Wine },
    ],
  },
  {
    id: 'experience',
    label: 'Experience',
    interests: [
      { id: 'nightlife', label: 'Nightlife', icon: Moon },
      { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
      { id: 'photography', label: 'Photography', icon: Camera },
      { id: 'wellness', label: 'Wellness', icon: Sparkles },
    ],
  },
]

// All interests flattened for easy lookup
const ALL_INTERESTS = INTEREST_CATEGORIES.flatMap((cat) => cat.interests)

interface InterestsSectionProps {
  value?: PersonalizationInterest[]
  onChange: (interests: PersonalizationInterest[] | undefined) => void
  className?: string
}

export function InterestsSection({
  value = [],
  onChange,
  className = '',
}: InterestsSectionProps) {
  const sectionId = useId()
  const [showAll, setShowAll] = useState(false)

  // Show first 8 interests by default, all when expanded
  const visibleInterests = showAll ? ALL_INTERESTS : ALL_INTERESTS.slice(0, 8)
  const hiddenCount = ALL_INTERESTS.length - 8

  const handleToggle = (interestId: PersonalizationInterest) => {
    const current = value || []
    const updated = current.includes(interestId)
      ? current.filter((i) => i !== interestId)
      : [...current, interestId]
    onChange(updated.length > 0 ? updated : undefined)
  }

  const isSelected = (interestId: PersonalizationInterest) => value?.includes(interestId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: editorialEasing }}
      className={className}
      role="group"
      aria-labelledby={`${sectionId}-label`}
    >
      <SectionHeader
        icon={Heart}
        title="What draws you to places?"
        subtitle={`Select all that apply${value && value.length > 0 ? ` • ${value.length} selected` : ''}`}
        isCompleted={value && value.length > 0}
      />

      {/* Interests grid */}
      <div
        className="mt-4 flex flex-wrap gap-1.5 sm:gap-2"
        role="group"
        aria-label="Interest options"
      >
        <AnimatePresence mode="popLayout">
          {visibleInterests.map((interest, index) => (
            <motion.div
              key={interest.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                delay: showAll ? 0 : index * 0.03,
                ...springTransition,
              }}
              layout
            >
              <OptionPill
                label={interest.label}
                icon={interest.icon}
                isSelected={isSelected(interest.id)}
                onClick={() => handleToggle(interest.id)}
                size="md"
                showCheckmark={false}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Show more/less button */}
        {hiddenCount > 0 && (
          <motion.button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:bg-[#F5F0E8] sm:text-[13px]"
            style={{ color: '#C45830' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>{showAll ? 'Show less' : `+${hiddenCount} more`}</span>
            <motion.span
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
          </motion.button>
        )}
      </div>

      {/* Selected summary */}
      <AnimatePresence>
        {value && value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: editorialEasing }}
            className="mt-3 overflow-hidden"
          >
            <div
              className="rounded-xl p-3 sm:p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.06) 0%, rgba(212, 168, 83, 0.06) 100%)',
                border: '1px solid rgba(196, 88, 48, 0.12)',
              }}
            >
              <p className="text-xs sm:text-sm" style={{ color: '#5C4D3D' }}>
                <span className="font-semibold" style={{ color: '#C45830' }}>
                  Perfect!
                </span>{' '}
                Your route will feature{' '}
                {value.slice(0, 3).map((id, i) => {
                  const interest = ALL_INTERESTS.find((int) => int.id === id)
                  return (
                    <span key={id}>
                      {interest?.label?.toLowerCase()}
                      {i < Math.min(value.length, 3) - 1 && ', '}
                    </span>
                  )
                })}
                {value.length > 3 && (
                  <span className="text-[#8B7355]">
                    {' '}and {value.length - 3} more
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default InterestsSection
