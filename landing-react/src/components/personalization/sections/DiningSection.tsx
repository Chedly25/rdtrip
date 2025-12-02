/**
 * Dining Section
 *
 * Lets users set their dining preferences: style and dietary requirements.
 * Features visual cards for dining style and pill toggles for dietary.
 *
 * Dining styles: Street Food, Casual, Mix, Fine Dining
 * Dietary: Vegetarian, Vegan, Gluten-free, Halal, Kosher, Dairy-free
 */

import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Utensils,
  Check,
  Store,
  Coffee,
  UtensilsCrossed,
  Sparkles,
  Salad,
  Leaf,
  Wheat,
  CircleDot,
  Star,
  Milk,
  Nut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DiningStyle } from '../../../types'
import { SectionHeader, OptionPill } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Dining style options
const DINING_STYLES: {
  id: DiningStyle
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    id: 'street',
    label: 'Street Food',
    description: 'Markets & stalls',
    icon: Store,
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Local restaurants',
    icon: Coffee,
  },
  {
    id: 'mix',
    label: 'Mix',
    description: 'Variety is key',
    icon: UtensilsCrossed,
  },
  {
    id: 'fine',
    label: 'Fine Dining',
    description: 'Special experiences',
    icon: Sparkles,
  },
]

// Dietary options
const DIETARY_OPTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'vegetarian', label: 'Vegetarian', icon: Salad },
  { id: 'vegan', label: 'Vegan', icon: Leaf },
  { id: 'gluten-free', label: 'Gluten-free', icon: Wheat },
  { id: 'halal', label: 'Halal', icon: CircleDot },
  { id: 'kosher', label: 'Kosher', icon: Star },
  { id: 'dairy-free', label: 'Dairy-free', icon: Milk },
  { id: 'nut-free', label: 'Nut-free', icon: Nut },
]

interface DiningSectionProps {
  diningStyle?: DiningStyle
  dietary?: string[]
  onDiningStyleChange: (style: DiningStyle | undefined) => void
  onDietaryChange: (dietary: string[] | undefined) => void
  className?: string
}

export function DiningSection({
  diningStyle,
  dietary = [],
  onDiningStyleChange,
  onDietaryChange,
  className = '',
}: DiningSectionProps) {
  const sectionId = useId()

  const handleDiningStyleSelect = (styleId: DiningStyle) => {
    onDiningStyleChange(diningStyle === styleId ? undefined : styleId)
  }

  const handleDietaryToggle = (dietId: string) => {
    const current = dietary || []
    const updated = current.includes(dietId)
      ? current.filter((d) => d !== dietId)
      : [...current, dietId]
    onDietaryChange(updated.length > 0 ? updated : undefined)
  }

  const isCompleted = !!diningStyle || (dietary && dietary.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: editorialEasing }}
      className={className}
      role="group"
      aria-labelledby={`${sectionId}-label`}
    >
      <SectionHeader
        icon={Utensils}
        title="Dining preferences"
        subtitle="What kind of food experiences do you prefer?"
        isCompleted={isCompleted}
      />

      {/* Dining Style Grid */}
      <div className="mt-4">
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-wider sm:text-xs"
          style={{ color: '#8B7355' }}
        >
          Dining style
        </p>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          role="radiogroup"
          aria-label="Dining style options"
        >
          {DINING_STYLES.map((style, index) => (
            <motion.button
              key={style.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05, ...springTransition }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleDiningStyleSelect(style.id)}
              role="radio"
              aria-checked={diningStyle === style.id}
              className="relative flex flex-col items-center gap-1 rounded-2xl p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:gap-1.5 sm:p-4"
              style={{
                background: diningStyle === style.id
                  ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                  : '#F5F0E8',
                color: diningStyle === style.id ? '#FFFBF5' : '#5C4D3D',
                boxShadow: diningStyle === style.id
                  ? '0 4px 16px rgba(196, 88, 48, 0.25)'
                  : 'none',
                // @ts-expect-error CSS variable
                '--tw-ring-color': '#C45830',
              }}
            >
              <style.icon
                className="h-6 w-6 sm:h-8 sm:w-8"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold sm:text-sm">{style.label}</span>
              <span
                className="text-[10px] sm:text-[11px]"
                style={{
                  color: diningStyle === style.id ? 'rgba(255,251,245,0.8)' : '#8B7355',
                }}
              >
                {style.description}
              </span>

              {/* Selection indicator */}
              <AnimatePresence>
                {diningStyle === style.id && (
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

      {/* Dietary Requirements */}
      <div className="mt-5">
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-wider sm:text-xs"
          style={{ color: '#8B7355' }}
        >
          Dietary requirements
        </p>
        <div
          className="flex flex-wrap gap-1.5 sm:gap-2"
          role="group"
          aria-label="Dietary requirements"
        >
          {DIETARY_OPTIONS.map((diet, index) => (
            <motion.div
              key={diet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.03, ...springTransition }}
            >
              <OptionPill
                label={diet.label}
                icon={diet.icon}
                isSelected={dietary?.includes(diet.id) || false}
                onClick={() => handleDietaryToggle(diet.id)}
                size="sm"
              />
            </motion.div>
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
                {diningStyle && (
                  <>
                    Prioritizing{' '}
                    <span className="font-semibold" style={{ color: '#C45830' }}>
                      {DINING_STYLES.find((s) => s.id === diningStyle)?.label.toLowerCase()}
                    </span>{' '}
                    experiences
                  </>
                )}
                {diningStyle && dietary && dietary.length > 0 && ' • '}
                {dietary && dietary.length > 0 && (
                  <>
                    Filtering for{' '}
                    <span className="font-semibold" style={{ color: '#C45830' }}>
                      {dietary.map((d) => DIETARY_OPTIONS.find((opt) => opt.id === d)?.label.toLowerCase()).join(', ')}
                    </span>{' '}
                    options
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

export default DiningSection
