/**
 * Budget Section
 *
 * Lets users set their budget comfort level and accommodation preferences.
 * Features visual cards with price tier indicators.
 *
 * Budget: Budget, Mid-range, Luxury
 * Accommodation: Budget, Mid, Luxury, Unique stays
 */

import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Bed, Check, Building, Home, Castle, Tent } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PersonalizationBudget, AccommodationStyle } from '../../../types'
import { SectionHeader } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Budget options
const BUDGET_OPTIONS: {
  id: PersonalizationBudget
  label: string
  description: string
  priceIndicator: string
}[] = [
  {
    id: 'budget',
    label: 'Budget-Friendly',
    description: 'Smart spending, great value',
    priceIndicator: '$',
  },
  {
    id: 'mid',
    label: 'Mid-Range',
    description: 'Balance of comfort & value',
    priceIndicator: '$$',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Premium experiences, no limits',
    priceIndicator: '$$$',
  },
]

// Accommodation options
const ACCOMMODATION_OPTIONS: {
  id: AccommodationStyle
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    id: 'budget',
    label: 'Budget',
    description: 'Hostels, basic hotels',
    icon: Building,
  },
  {
    id: 'mid',
    label: 'Comfortable',
    description: '3-4 star hotels, nice Airbnbs',
    icon: Home,
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: '5-star hotels, premium stays',
    icon: Castle,
  },
  {
    id: 'unique',
    label: 'Unique',
    description: 'Boutique, unusual stays',
    icon: Tent,
  },
]

interface BudgetSectionProps {
  budget?: PersonalizationBudget
  accommodation?: AccommodationStyle
  onBudgetChange: (budget: PersonalizationBudget | undefined) => void
  onAccommodationChange: (accommodation: AccommodationStyle | undefined) => void
  className?: string
}

export function BudgetSection({
  budget,
  accommodation,
  onBudgetChange,
  onAccommodationChange,
  className = '',
}: BudgetSectionProps) {
  const sectionId = useId()

  const handleBudgetSelect = (budgetId: PersonalizationBudget) => {
    onBudgetChange(budget === budgetId ? undefined : budgetId)
  }

  const handleAccommodationSelect = (accId: AccommodationStyle) => {
    onAccommodationChange(accommodation === accId ? undefined : accId)
  }

  const isCompleted = !!budget || !!accommodation

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: editorialEasing }}
      className={className}
      role="group"
      aria-labelledby={`${sectionId}-label`}
    >
      <SectionHeader
        icon={Wallet}
        title="Budget & accommodation"
        subtitle="Set your comfort level"
        isCompleted={isCompleted}
      />

      {/* Budget Level */}
      <div className="mt-4">
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-wider sm:text-xs"
          style={{ color: '#8B7355' }}
        >
          Budget comfort
        </p>
        <div
          className="grid grid-cols-3 gap-2 sm:gap-3"
          role="radiogroup"
          aria-label="Budget level options"
        >
          {BUDGET_OPTIONS.map((option, index) => (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.05, ...springTransition }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBudgetSelect(option.id)}
              role="radio"
              aria-checked={budget === option.id}
              className="relative flex flex-col items-center gap-1 rounded-2xl p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:gap-2 sm:p-4"
              style={{
                background: budget === option.id
                  ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                  : '#F5F0E8',
                color: budget === option.id ? '#FFFBF5' : '#5C4D3D',
                boxShadow: budget === option.id
                  ? '0 4px 16px rgba(196, 88, 48, 0.25)'
                  : 'none',
                // @ts-expect-error CSS variable
                '--tw-ring-color': '#C45830',
              }}
            >
              {/* Price indicator */}
              <span
                className="text-lg font-bold sm:text-xl"
                style={{
                  color: budget === option.id ? '#FFFBF5' : '#C45830',
                  fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
                }}
              >
                {option.priceIndicator}
              </span>
              <span className="text-[11px] font-semibold sm:text-xs">{option.label}</span>
              <span
                className="hidden text-[10px] leading-tight sm:block sm:text-[11px]"
                style={{
                  color: budget === option.id ? 'rgba(255,251,245,0.8)' : '#8B7355',
                }}
              >
                {option.description}
              </span>

              {/* Selection indicator */}
              <AnimatePresence>
                {budget === option.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={springTransition}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full sm:h-6 sm:w-6"
                    style={{ background: '#FFFBF5' }}
                  >
                    <Check
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      style={{ color: '#C45830' }}
                      strokeWidth={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Accommodation Preference */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Bed className="h-3.5 w-3.5" style={{ color: '#8B7355' }} />
          <p
            className="text-[11px] font-medium uppercase tracking-wider sm:text-xs"
            style={{ color: '#8B7355' }}
          >
            Accommodation style
          </p>
        </div>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          role="radiogroup"
          aria-label="Accommodation style options"
        >
          {ACCOMMODATION_OPTIONS.map((option, index) => (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + index * 0.05, ...springTransition }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAccommodationSelect(option.id)}
              role="radio"
              aria-checked={accommodation === option.id}
              className="flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:p-3"
              style={{
                background: accommodation === option.id
                  ? 'linear-gradient(180deg, #FEF3EE 0%, #FFFBF5 100%)'
                  : '#F5F0E8',
                border: accommodation === option.id
                  ? '2px solid #C45830'
                  : '2px solid transparent',
                // @ts-expect-error CSS variable
                '--tw-ring-color': '#C45830',
              }}
            >
              <option.icon
                className="h-5 w-5 sm:h-6 sm:w-6"
                aria-hidden="true"
              />
              <span
                className="text-[11px] font-semibold sm:text-xs"
                style={{ color: accommodation === option.id ? '#C45830' : '#5C4D3D' }}
              >
                {option.label}
              </span>
              <span
                className="hidden text-[9px] leading-tight text-center sm:block sm:text-[10px]"
                style={{ color: '#8B7355' }}
              >
                {option.description}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: editorialEasing }}
            className="mt-4 overflow-hidden"
          >
            <div
              className="rounded-xl p-3 sm:p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.06) 0%, rgba(212, 168, 83, 0.06) 100%)',
                border: '1px solid rgba(196, 88, 48, 0.12)',
              }}
            >
              <p className="text-xs sm:text-sm" style={{ color: '#5C4D3D' }}>
                {budget && (
                  <>
                    <span className="font-semibold" style={{ color: '#C45830' }}>
                      {BUDGET_OPTIONS.find((b) => b.id === budget)?.label}
                    </span>{' '}
                    recommendations
                  </>
                )}
                {budget && accommodation && ' with '}
                {accommodation && (
                  <>
                    <span className="font-semibold" style={{ color: '#C45830' }}>
                      {ACCOMMODATION_OPTIONS.find((a) => a.id === accommodation)?.label.toLowerCase()}
                    </span>{' '}
                    stays
                  </>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BudgetSection
