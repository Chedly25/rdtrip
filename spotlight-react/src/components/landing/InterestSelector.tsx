import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Mountain, Landmark, UtensilsCrossed, Compass } from 'lucide-react'
import { AVAILABLE_INTERESTS, type SelectedInterest, type Interest } from '../../types'

const ruiEasing = [0.15, 0.5, 0.5, 1] as const

// Category colors and icons
const categoryConfig: Record<Interest['category'], { color: string; icon: React.ElementType; label: string }> = {
  nature: { color: '#166534', icon: Mountain, label: 'Nature & Adventure' },      // Dark green
  culture: { color: '#a16207', icon: Landmark, label: 'Culture & History' },      // Dark yellow/amber
  food: { color: '#991b1b', icon: UtensilsCrossed, label: 'Food & Drink' },       // Dark red
  experience: { color: '#1e40af', icon: Compass, label: 'Experiences' }           // Dark blue
}

interface InterestSelectorProps {
  selected: SelectedInterest[]
  onToggle: (interestId: string) => void
  onWeightChange: (interestId: string, weight: number) => void
}

export function InterestSelector({ selected, onToggle, onWeightChange }: InterestSelectorProps) {
  const selectedIds = selected.map((s) => s.id)

  // Group interests by category
  const groupedInterests = AVAILABLE_INTERESTS.reduce((acc, interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = []
    }
    acc[interest.category].push(interest)
    return acc
  }, {} as Record<Interest['category'], Interest[]>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-rui-black">
          <Sparkles className="h-4 w-4 text-rui-grey-50" />
          What Do You Love?
        </label>
        <span className="text-xs text-rui-grey-50">
          {selected.length} selected
        </span>
      </div>

      <div className="space-y-4">
        {(Object.keys(groupedInterests) as Interest['category'][]).map((category) => {
          const config = categoryConfig[category]
          const Icon = config.icon
          const interests = groupedInterests[category]

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: config.color }} />
                <span className="text-xs font-semibold text-rui-grey-50 uppercase tracking-wider">
                  {config.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => {
                  const isSelected = selectedIds.includes(interest.id)
                  const selectedInterest = selected.find((s) => s.id === interest.id)

                  return (
                    <motion.button
                      key={interest.id}
                      type="button"
                      onClick={() => onToggle(interest.id)}
                      className={`group relative flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-all duration-rui-sm ease-rui-default ${
                        isSelected
                          ? 'text-white shadow-rui-2'
                          : 'bg-rui-grey-2 text-rui-black hover:bg-rui-grey-5'
                      }`}
                      style={{
                        backgroundColor: isSelected ? config.color : undefined
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2, ease: ruiEasing }}
                    >
                      <AnimatePresence mode="wait">
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <span className="font-medium">{interest.label}</span>

                      {/* Weight indicator for selected interests */}
                      {isSelected && selectedInterest && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-0.5"
                        >
                          {[1, 2, 3, 4, 5].map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onWeightChange(interest.id, w)
                              }}
                              className={`h-1.5 w-1.5 rounded-full transition-all ${
                                w <= selectedInterest.weight
                                  ? 'bg-white'
                                  : 'bg-white/30'
                              }`}
                            />
                          ))}
                        </motion.span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected interests summary with weights */}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-rui-16 bg-rui-grey-2 p-4"
        >
          <p className="mb-3 text-xs font-semibold text-rui-grey-50 uppercase tracking-wider">
            Your Priorities (tap dots to adjust)
          </p>
          <div className="flex flex-wrap gap-2">
            {selected
              .sort((a, b) => b.weight - a.weight)
              .map((item) => {
                const interest = AVAILABLE_INTERESTS.find((i) => i.id === item.id)
                if (!interest) return null

                const config = categoryConfig[interest.category]

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-full bg-rui-white px-3 py-1.5 text-sm shadow-rui-1"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium text-rui-black">{interest.label}</span>
                    <span className="text-xs text-rui-grey-50">
                      {'*'.repeat(item.weight)}
                    </span>
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
