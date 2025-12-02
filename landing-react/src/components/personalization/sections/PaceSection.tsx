/**
 * Pace Section
 *
 * Lets users set their preferred trip pace from relaxed to packed.
 * Uses a beautiful slider with descriptive labels.
 *
 * Scale: 1 (Very Relaxed) to 5 (Packed Schedule)
 */

import { useId } from 'react'
import { motion } from 'framer-motion'
import { Gauge, Sunrise, Scale, Zap } from 'lucide-react'
import { SectionHeader, SliderInput } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const

// Pace labels with descriptions
const PACE_LABELS = [
  {
    value: 1,
    label: 'Very Relaxed',
    description: 'Slow mornings, lots of free time, spontaneous discoveries',
  },
  {
    value: 2,
    label: 'Relaxed',
    description: 'Leisurely pace, 1-2 planned activities per day',
  },
  {
    value: 3,
    label: 'Balanced',
    description: 'Mix of scheduled activities and downtime',
  },
  {
    value: 4,
    label: 'Active',
    description: 'Full days, multiple activities, minimal downtime',
  },
  {
    value: 5,
    label: 'Packed',
    description: 'See everything! Early starts, late finishes',
  },
]

interface PaceSectionProps {
  value?: number
  onChange: (pace: number | undefined) => void
  className?: string
}

export function PaceSection({
  value,
  onChange,
  className = '',
}: PaceSectionProps) {
  const sectionId = useId()

  // Default to balanced (3) if undefined but user interacts
  const currentValue = value ?? 3

  const handleChange = (newValue: number) => {
    onChange(newValue)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: editorialEasing }}
      className={className}
      role="group"
      aria-labelledby={`${sectionId}-label`}
    >
      <SectionHeader
        icon={Gauge}
        title="What's your ideal pace?"
        subtitle="How packed do you want your days?"
        isCompleted={value !== undefined}
      />

      {/* Slider container */}
      <div className="mt-5 sm:mt-6">
        {/* Visual pace indicator */}
        <div className="mb-4 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              animate={{
                scale: level === currentValue ? 1.2 : 1,
                opacity: level <= currentValue ? 1 : 0.3,
              }}
              transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
              className="h-2 w-6 rounded-full sm:h-2.5 sm:w-8"
              style={{
                background:
                  level <= currentValue
                    ? `linear-gradient(90deg, #C45830 ${(level / 5) * 100}%, #D4A853 100%)`
                    : '#E5DDD0',
              }}
            />
          ))}
        </div>

        {/* Slider */}
        <SliderInput
          value={currentValue}
          onChange={handleChange}
          min={1}
          max={5}
          step={1}
          labels={PACE_LABELS}
          showCurrentLabel={true}
          showLabelsBelow={false}
          ariaLabel="Trip pace"
        />

        {/* Quick select buttons */}
        <div className="mt-4 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => handleChange(1)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all hover:bg-[#F5F0E8] sm:text-[11px]"
            style={{
              color: currentValue === 1 ? '#C45830' : '#8B7355',
              background: currentValue === 1 ? 'rgba(196, 88, 48, 0.08)' : 'transparent',
            }}
          >
            <Sunrise className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Relaxed</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange(3)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all hover:bg-[#F5F0E8] sm:text-[11px]"
            style={{
              color: currentValue === 3 ? '#C45830' : '#8B7355',
              background: currentValue === 3 ? 'rgba(196, 88, 48, 0.08)' : 'transparent',
            }}
          >
            <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Balanced</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange(5)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all hover:bg-[#F5F0E8] sm:text-[11px]"
            style={{
              color: currentValue === 5 ? '#C45830' : '#8B7355',
              background: currentValue === 5 ? 'rgba(196, 88, 48, 0.08)' : 'transparent',
            }}
          >
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Packed</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default PaceSection
