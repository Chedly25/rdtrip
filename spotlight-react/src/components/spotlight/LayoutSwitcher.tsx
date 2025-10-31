import { motion } from 'framer-motion'
import { Monitor, Maximize2, Presentation } from 'lucide-react'
import { useLayout } from '../../contexts/LayoutContext'

const modes = [
  {
    id: 'focus' as const,
    icon: Monitor,
    label: 'Focus',
    description: 'Balanced view for route planning'
  },
  {
    id: 'planning' as const,
    icon: Maximize2,
    label: 'Planning',
    description: 'Wide sidebar for detailed editing'
  },
  {
    id: 'presentation' as const,
    icon: Presentation,
    label: 'Present',
    description: 'Full map for presentations'
  }
]

export function LayoutSwitcher() {
  const { mode, switchMode } = useLayout()

  return (
    <motion.div
      className="fixed top-24 right-6 z-40"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex gap-2 rounded-2xl bg-white/95 backdrop-blur-lg p-2 shadow-premium border border-gray-200">
        {modes.map((m) => {
          const Icon = m.icon
          const isActive = mode === m.id

          return (
            <motion.button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl
                transition-all duration-200 font-medium text-sm
                ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={m.description}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500"
                  layoutId="active-layout-mode"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{m.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Description tooltip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-center"
      >
        <p className="text-xs text-gray-500">
          {modes.find((m) => m.id === mode)?.description}
        </p>
      </motion.div>
    </motion.div>
  )
}
