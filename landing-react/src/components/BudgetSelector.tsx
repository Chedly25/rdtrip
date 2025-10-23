import { motion } from 'framer-motion'
import { DollarSign } from 'lucide-react'
import type { BudgetLevel } from '../types'

const budgets: { value: BudgetLevel; label: string; icon: string }[] = [
  { value: 'budget', label: 'Budget', icon: '$' },
  { value: 'moderate', label: 'Moderate', icon: '$$' },
  { value: 'comfort', label: 'Comfort', icon: '$$$' },
  { value: 'luxury', label: 'Luxury', icon: '$$$$' },
]

interface BudgetSelectorProps {
  selected: BudgetLevel
  onChange: (budget: BudgetLevel) => void
}

export function BudgetSelector({ selected, onChange }: BudgetSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <DollarSign className="h-4 w-4" />
        Budget Level
      </label>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {budgets.map((budget) => {
          const isSelected = selected === budget.value

          return (
            <motion.button
              key={budget.value}
              onClick={() => onChange(budget.value)}
              className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Checkmark for selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}

              <div className="mb-2 text-2xl font-bold text-purple-600">
                {budget.icon}
              </div>
              <div
                className={`text-sm font-semibold ${
                  isSelected ? 'text-purple-700' : 'text-gray-700'
                }`}
              >
                {budget.label}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
