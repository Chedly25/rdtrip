import { motion } from 'framer-motion'
import { Compass, Landmark, UtensilsCrossed, Eye } from 'lucide-react'
import type { AgentType } from '../types'

const agents: {
  type: AgentType
  label: string
  icon: any
  color: string
  description: string
}[] = [
  {
    type: 'adventure',
    label: 'Adventure',
    icon: Compass,
    color: 'from-green-500 to-emerald-600',
    description: 'Hiking, outdoor activities, and thrilling experiences',
  },
  {
    type: 'culture',
    label: 'Culture',
    icon: Landmark,
    color: 'from-blue-500 to-indigo-600',
    description: 'Museums, historic sites, and cultural landmarks',
  },
  {
    type: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-600',
    description: 'Local cuisine, restaurants, and food experiences',
  },
  {
    type: 'hidden-gems',
    label: 'Hidden Gems',
    icon: Eye,
    color: 'from-purple-500 to-pink-600',
    description: 'Off-the-beaten-path spots and local secrets',
  },
]

interface AgentSelectorProps {
  selected: AgentType[]
  onChange: (agents: AgentType[]) => void
}

export function AgentSelector({ selected, onChange }: AgentSelectorProps) {
  const toggleAgent = (agent: AgentType) => {
    if (selected.includes(agent)) {
      // Don't allow deselecting if it's the last one
      if (selected.length === 1) return
      onChange(selected.filter((a) => a !== agent))
    } else {
      onChange([...selected, agent])
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        Select Your Travel Interests
        <span className="ml-2 text-xs font-normal text-gray-500">
          (Choose at least one)
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {agents.map((agent) => {
          const isSelected = selected.includes(agent.type)
          const Icon = agent.icon

          return (
            <motion.button
              key={agent.type}
              onClick={() => toggleAgent(agent.type)}
              className={`relative overflow-hidden rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? 'border-transparent shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              style={
                isSelected
                  ? {
                      background: `linear-gradient(135deg, ${agent.color.replace('from-', '').replace(' to-', ', ')})`,
                    }
                  : undefined
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Checkmark for selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm"
                >
                  <svg
                    className="h-5 w-5 text-white"
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

              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-white/20' : 'bg-gradient-to-br ' + agent.color
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-white'}`} />
                </div>

                <div className="flex-1">
                  <h3
                    className={`mb-1 text-lg font-bold ${
                      isSelected ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {agent.label}
                  </h3>
                  <p
                    className={`text-sm ${
                      isSelected ? 'text-white/90' : 'text-gray-600'
                    }`}
                  >
                    {agent.description}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
