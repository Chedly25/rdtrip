import { motion } from 'framer-motion'
import { User, Users, Heart, Baby, UserPlus } from 'lucide-react'
import type { TravelCompanion } from '../types'

const ruiEasing = [0.15, 0.5, 0.5, 1] as const

const companions: {
  type: TravelCompanion
  label: string
  icon: React.ElementType
  description: string
}[] = [
  {
    type: 'solo',
    label: 'Solo',
    icon: User,
    description: 'Just me'
  },
  {
    type: 'couple',
    label: 'Couple',
    icon: Heart,
    description: 'Romantic trip'
  },
  {
    type: 'family-young-kids',
    label: 'Family',
    icon: Baby,
    description: 'With young kids'
  },
  {
    type: 'family-teens',
    label: 'Family',
    icon: Users,
    description: 'With teens'
  },
  {
    type: 'friends',
    label: 'Friends',
    icon: Users,
    description: 'Group trip'
  },
  {
    type: 'group',
    label: 'Group',
    icon: UserPlus,
    description: 'Large group'
  }
]

interface CompanionSelectorProps {
  selected: TravelCompanion
  onChange: (companion: TravelCompanion) => void
}

export function CompanionSelector({ selected, onChange }: CompanionSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-rui-black">
        <Users className="h-4 w-4 text-rui-grey-50" />
        Who's Traveling?
      </label>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {companions.map((companion) => {
          const isSelected = selected === companion.type
          const Icon = companion.icon

          return (
            <motion.button
              key={companion.type}
              type="button"
              onClick={() => onChange(companion.type)}
              className={`relative flex flex-col items-center gap-1 rounded-rui-16 p-3 transition-all duration-rui-sm ease-rui-default ${
                isSelected
                  ? 'bg-rui-black text-white shadow-rui-2'
                  : 'bg-rui-grey-2 text-rui-black hover:bg-rui-grey-5'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: ruiEasing }}
            >
              <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-rui-grey-50'}`} />
              <span className="text-xs font-semibold">{companion.label}</span>
              <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-rui-grey-50'}`}>
                {companion.description}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
