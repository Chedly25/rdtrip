import { motion } from 'framer-motion'
import { MapPin, Trash2, GripVertical } from 'lucide-react'
import type { Waypoint } from '../../types'
import { cn } from '../../lib/utils'
import { GlassCard } from '../ui/GlassCard'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

interface CityCardProps {
  waypoint: Waypoint
  onRemove?: (id: string) => void
  onClick?: () => void
  isDragging?: boolean
}

export function CityCard({ waypoint, onRemove, onClick, isDragging }: CityCardProps) {
  const { name, activities, imageUrl, isLandmark } = waypoint
  const { routeData } = useRouteDataStore()
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  return (
    <GlassCard
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      className={cn(
        'group',
        isDragging && 'shadow-2xl ring-4'
      )}
      style={isDragging ? { borderColor: theme.primary } : undefined}
    >
      {/* Drag Handle */}
      <motion.div
        className="absolute right-3 top-3 z-10 cursor-grab rounded-lg bg-white/90 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </motion.div>

      {/* Remove Button */}
      {onRemove && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(waypoint.id)
          }}
          className="absolute left-3 top-3 z-10 rounded-lg bg-white/90 p-2 opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="h-5 w-5 text-red-500" />
        </motion.button>
      )}

      {/* Image Container */}
      <div
        className="relative h-72 w-full overflow-hidden"
        style={{
          background: imageUrl
            ? undefined
            : `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`
        }}
      >
        {imageUrl ? (
          <motion.img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="h-16 w-16 text-white/50" />
          </div>
        )}

        {isLandmark && (
          <div className="absolute bottom-4 left-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            ⭐ Landmark
          </div>
        )}
      </div>

      {/* Content */}
      <div
        onClick={onClick}
        className="cursor-pointer p-6"
      >
        <h3
          className="mb-4 text-2xl font-bold text-gray-900 transition-colors"
          style={{
            color: undefined
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          {name}
        </h3>

        {activities && activities.length > 0 && (
          <ul className="space-y-2">
            {activities.slice(0, 3).map((activity, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <div
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <span>{activity}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  )
}
