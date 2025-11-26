import { motion } from 'framer-motion'
import { DollarSign, Check } from 'lucide-react'
import type { BudgetLevel } from '../types'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

const budgets: { value: BudgetLevel; label: string; icon: string; description: string }[] = [
  { value: 'budget', label: 'Budget', icon: '$', description: 'Hostels & street food' },
  { value: 'moderate', label: 'Moderate', icon: '$$', description: '3-star hotels & cafes' },
  { value: 'comfort', label: 'Comfort', icon: '$$$', description: '4-star hotels & restaurants' },
  { value: 'luxury', label: 'Luxury', icon: '$$$$', description: '5-star & fine dining' },
]

interface BudgetSelectorProps {
  selected: BudgetLevel
  onChange: (budget: BudgetLevel) => void
}

export function BudgetSelector({ selected, onChange }: BudgetSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-rui-black">
        <DollarSign className="h-4 w-4 text-rui-grey-50" />
        Budget Level
      </label>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {budgets.map((budget) => {
          const isSelected = selected === budget.value

          return (
            <motion.button
              key={budget.value}
              type="button"
              onClick={() => onChange(budget.value)}
              className={`relative rounded-rui-16 border-2 p-4 text-center transition-all duration-rui-sm ease-rui-default ${
                isSelected
                  ? 'border-rui-black bg-rui-grey-2 shadow-rui-2'
                  : 'border-rui-grey-10 bg-rui-white hover:border-rui-grey-20 hover:bg-rui-grey-2'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {/* Checkmark for selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, ease: ruiEasing }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rui-black text-rui-white shadow-rui-2"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.div>
              )}

              <div className={`mb-1 text-xl font-bold transition-colors duration-rui-sm ${
                isSelected ? 'text-rui-black' : 'text-rui-grey-50'
              }`}>
                {budget.icon}
              </div>
              <div className={`text-sm font-semibold transition-colors duration-rui-sm ${
                isSelected ? 'text-rui-black' : 'text-rui-grey-50'
              }`}>
                {budget.label}
              </div>
              <div className="text-xs text-rui-grey-50 mt-0.5">
                {budget.description}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
