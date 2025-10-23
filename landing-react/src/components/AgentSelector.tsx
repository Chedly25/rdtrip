import { motion } from 'framer-motion'
import { Compass, Landmark, UtensilsCrossed, Eye } from 'lucide-react'
import type { AgentType } from '../types'

const agents: {
  type: AgentType
  label: string
  icon: any
  color: string
  description: string
  image: string
}[] = [
  {
    type: 'adventure',
    label: 'Adventure',
    icon: Compass,
    color: 'from-green-500 to-emerald-600',
    description: 'Hiking, outdoor activities, and thrilling experiences',
    image: '/images/travel_style/adventure.png',
  },
  {
    type: 'culture',
    label: 'Culture',
    icon: Landmark,
    color: 'from-blue-500 to-indigo-600',
    description: 'Museums, historic sites, and cultural landmarks',
    image: '/images/travel_style/culture.png',
  },
  {
    type: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-600',
    description: 'Local cuisine, restaurants, and food experiences',
    image: '/images/travel_style/food.png',
  },
  {
    type: 'hidden-gems',
    label: 'Hidden Gems',
    icon: Eye,
    color: 'from-purple-500 to-pink-600',
    description: 'Off-the-beaten-path spots and local secrets',
    image: '/images/travel_style/hidden-gem.png',
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
              className={`relative overflow-hidden rounded-xl border-2 h-48 text-left transition-all ${
                isSelected
                  ? 'border-transparent shadow-2xl ring-4 ring-purple-500 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${agent.image})` }}
              />

              {/* Overlay */}
              <div className={`absolute inset-0 transition-opacity ${
                isSelected
                  ? 'bg-black/40'
                  : 'bg-black/60 hover:bg-black/50'
              }`} />

              {/* Checkmark for selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg"
                >
                  <svg
                    className="h-5 w-5 text-green-600"
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

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {agent.label}
                  </h3>
                </div>
                <p className="text-sm text-white/90">
                  {agent.description}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
