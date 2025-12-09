/**
 * Accessibility Section
 *
 * Lets users specify accessibility needs and comfort preferences.
 * Features toggle cards for various physical considerations.
 *
 * Options: Limited mobility, wheelchair access, young children,
 *          frequent rests, avoid stairs, AC preference
 */

import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Accessibility, Sun, Users, Check } from 'lucide-react'
import { SectionHeader, ToggleCard } from '../shared'

const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Accessibility options
const ACCESSIBILITY_OPTIONS = [
  {
    id: 'limited-mobility',
    label: 'Limited mobility',
    description: 'Minimize walking distances',
    emoji: '🚶',
  },
  {
    id: 'wheelchair',
    label: 'Wheelchair accessible',
    description: 'Accessible venues only',
    emoji: '♿',
  },
  {
    id: 'with-children',
    label: 'With young children',
    description: 'Family-friendly venues',
    emoji: '👨‍👩‍👧',
  },
  {
    id: 'frequent-rests',
    label: 'Need frequent rests',
    description: 'Built-in breaks & rest spots',
    emoji: '🪑',
  },
  {
    id: 'avoid-stairs',
    label: 'Avoid stairs',
    description: 'Elevators & flat routes',
    emoji: '🚫',
  },
  {
    id: 'needs-ac',
    label: 'Prefer AC venues',
    description: 'Climate-controlled spaces',
    emoji: '❄️',
  },
]

// Additional preferences
const ADDITIONAL_PREFERENCES = [
  {
    id: 'avoid-crowds',
    label: 'Avoid crowds',
    description: 'Quieter times & hidden spots',
    icon: Users,
    type: 'avoidCrowds' as const,
  },
  {
    id: 'prefer-outdoor',
    label: 'Prefer outdoor',
    description: 'Open-air experiences',
    icon: Sun,
    type: 'preferOutdoor' as const,
  },
]

interface AccessibilitySectionProps {
  accessibility?: string[]
  avoidCrowds?: boolean
  preferOutdoor?: boolean
  onAccessibilityChange: (accessibility: string[] | undefined) => void
  onAvoidCrowdsChange: (value: boolean | undefined) => void
  onPreferOutdoorChange: (value: boolean | undefined) => void
  className?: string
}

export function AccessibilitySection({
  accessibility = [],
  avoidCrowds = false,
  preferOutdoor = false,
  onAccessibilityChange,
  onAvoidCrowdsChange,
  onPreferOutdoorChange,
  className = '',
}: AccessibilitySectionProps) {
  const sectionId = useId()

  const handleAccessibilityToggle = (optionId: string) => {
    const current = accessibility || []
    const updated = current.includes(optionId)
      ? current.filter((a) => a !== optionId)
      : [...current, optionId]
    onAccessibilityChange(updated.length > 0 ? updated : undefined)
  }

  const isAccessibilitySelected = (optionId: string) =>
    accessibility?.includes(optionId) || false

  const isCompleted =
    (accessibility && accessibility.length > 0) || avoidCrowds || preferOutdoor

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: editorialEasing }}
      className={className}
      role="group"
      aria-labelledby={`${sectionId}-label`}
    >
      <SectionHeader
        icon={Accessibility}
        title="Accessibility & comfort"
        subtitle="Let us know your needs"
        isCompleted={isCompleted}
      />

      {/* Accessibility options */}
      <div className="mt-4">
        <div className="space-y-2 sm:space-y-2.5">
          {ACCESSIBILITY_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.04, duration: 0.3, ease: editorialEasing }}
            >
              <ToggleCard
                label={option.label}
                description={option.description}
                isSelected={isAccessibilitySelected(option.id)}
                onClick={() => handleAccessibilityToggle(option.id)}
                variant="horizontal"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional preferences */}
      <div className="mt-5">
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-wider sm:text-xs"
          style={{ color: '#8B7355' }}
        >
          Additional preferences
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {ADDITIONAL_PREFERENCES.map((pref, index) => (
            <motion.button
              key={pref.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05, ...springTransition }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (pref.type === 'avoidCrowds') {
                  onAvoidCrowdsChange(!avoidCrowds ? true : undefined)
                } else {
                  onPreferOutdoorChange(!preferOutdoor ? true : undefined)
                }
              }}
              aria-pressed={pref.type === 'avoidCrowds' ? avoidCrowds : preferOutdoor}
              className="relative flex items-center gap-2.5 rounded-xl p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:gap-3 sm:p-4"
              style={{
                background:
                  (pref.type === 'avoidCrowds' ? avoidCrowds : preferOutdoor)
                    ? 'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)'
                    : '#F5F0E8',
                border:
                  (pref.type === 'avoidCrowds' ? avoidCrowds : preferOutdoor)
                    ? '2px solid #C45830'
                    : '2px solid transparent',
                // @ts-expect-error CSS variable
                '--tw-ring-color': '#C45830',
              }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                style={{
                  background:
                    (pref.type === 'avoidCrowds' ? avoidCrowds : preferOutdoor)
                      ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                      : '#FFFBF5',
                }}
              >
                <pref.icon
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  style={{
                    color:
                      (pref.type === 'avoidCrowds' ? avoidCrowds : preferOutdoor)
                        ? '#FFFBF5'
                        : '#C45830',
                  }}
                />
              </div>
              <div className="flex-1 text-left">
                <p
                  className="text-xs font-semibold sm:text-sm"
                  style={{ color: '#2C2417' }}
                >
                  {pref.label}
                </p>
                <p
                  className="text-[10px] sm:text-[11px]"
                  style={{ color: '#8B7355' }}
                >
                  {pref.description}
                </p>
              </div>

              {/* Check indicator */}
              <AnimatePresence>
                {(pref.type === 'avoidCrowds' ? avoidCrowds : preferOutdoor) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={springTransition}
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full sm:h-6 sm:w-6"
                    style={{
                      background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                    }}
                  >
                    <Check
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      style={{ color: '#FFFBF5' }}
                      strokeWidth={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
                <span className="font-semibold" style={{ color: '#C45830' }}>
                  We'll tailor your route
                </span>{' '}
                {accessibility && accessibility.length > 0 && (
                  <>
                    with{' '}
                    {accessibility
                      .slice(0, 2)
                      .map((id) => ACCESSIBILITY_OPTIONS.find((o) => o.id === id)?.label.toLowerCase())
                      .join(', ')}
                    {accessibility.length > 2 && ` +${accessibility.length - 2} more`} in mind
                  </>
                )}
                {accessibility && accessibility.length > 0 && (avoidCrowds || preferOutdoor) && ', '}
                {avoidCrowds && 'avoiding crowds'}
                {avoidCrowds && preferOutdoor && ' and '}
                {preferOutdoor && 'prioritizing outdoor spaces'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AccessibilitySection
