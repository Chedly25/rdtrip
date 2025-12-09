import { motion } from 'framer-motion'
import { Compass, Landmark, UtensilsCrossed, Eye, Check } from 'lucide-react'
import type { AgentType } from '../../types'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

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
    color: '#09BE67',
    description: 'Hiking, outdoor activities, and thrilling experiences',
    image: '/images/travel_style/adventure.png',
  },
  {
    type: 'culture',
    label: 'Culture',
    icon: Landmark,
    color: '#805CF5',
    description: 'Museums, historic sites, and cultural landmarks',
    image: '/images/travel_style/culture.png',
  },
  {
    type: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    color: '#EE7A40',
    description: 'Local cuisine, restaurants, and food experiences',
    image: '/images/travel_style/food.png',
  },
  {
    type: 'hidden-gems',
    label: 'Hidden Gems',
    icon: Eye,
    color: '#00BE90',
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
      <label className="text-sm font-semibold text-rui-black">
        Select Your Travel Interests
        <span className="ml-2 text-xs font-normal text-rui-grey-50">
          (Choose at least one)
        </span>
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {agents.map((agent) => {
          const isSelected = selected.includes(agent.type)
          const Icon = agent.icon

          return (
            <motion.button
              key={agent.type}
              type="button"
              onClick={() => toggleAgent(agent.type)}
              className={`relative overflow-hidden rounded-rui-16 h-40 text-left transition-all duration-rui-sm ease-rui-default ${
                isSelected
                  ? 'ring-2 ring-rui-black ring-offset-2 shadow-rui-3'
                  : 'hover:shadow-rui-2'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-rui-lg ease-rui-default"
                style={{
                  backgroundImage: `url(${agent.image})`,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                }}
              />

              {/* Overlay */}
              <div className={`absolute inset-0 transition-all duration-rui-sm ${
                isSelected
                  ? 'bg-gradient-to-t from-black/70 via-black/30 to-black/20'
                  : 'bg-gradient-to-t from-black/80 via-black/50 to-black/30'
              }`} />

              {/* Checkmark for selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: ruiEasing }}
                  className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-rui-white shadow-rui-2"
                >
                  <Check className="h-4 w-4 text-success" strokeWidth={3} />
                </motion.div>
              )}

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-rui-8"
                    style={{ backgroundColor: `${agent.color}30` }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {agent.label}
                  </h3>
                </div>
                <p className="text-sm text-white/80 line-clamp-2">
                  {agent.description}
                </p>
              </div>

              {/* Selected border accent */}
              {isSelected && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: agent.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, ease: ruiEasing }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
