import { motion } from 'framer-motion'
import { Map, MapPin, Hotel, Calendar } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TableOfContentsProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const sections = [
  { id: 'overview', label: 'Route Overview', icon: Map },
  { id: 'cities', label: 'Cities & Highlights', icon: MapPin },
  { id: 'stay-dine', label: 'Stay & Dine', icon: Hotel },
  { id: 'itinerary', label: 'Detailed Itinerary', icon: Calendar },
]

export function TableOfContents({ activeSection, onSectionChange }: TableOfContentsProps) {
  return (
    <nav className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Navigate Route</h3>
      <ul className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <li key={section.id}>
              <button
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'group relative w-full rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500 to-purple-500"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2.5">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.label}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
