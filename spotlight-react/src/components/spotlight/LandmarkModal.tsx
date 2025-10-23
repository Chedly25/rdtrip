import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

interface LandmarkModalProps {
  landmark: {
    name: string
    lat: number
    lng: number
    type?: string
    description?: string
    city?: string
  } | null
  onClose: () => void
  onAdd: (landmark: any) => void
}

export function LandmarkModal({ landmark, onClose, onAdd }: LandmarkModalProps) {
  const { routeData } = useRouteDataStore()
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  if (!landmark) return null

  const iconMap: Record<string, string> = {
    monument: '🗼',
    historic: '🏰',
    cultural: '🎭',
    natural: '🏔️',
  }

  const icon = iconMap[landmark.type || ''] || '⭐'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div
            className="mb-4 inline-flex rounded-full p-4 text-4xl"
            style={{
              background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`,
            }}
          >
            <span className="drop-shadow-lg">{icon}</span>
          </div>

          {/* Content */}
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{landmark.name}</h2>

          {landmark.city && (
            <p className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {landmark.city}
            </p>
          )}

          {landmark.description && (
            <p className="mb-6 text-gray-700">{landmark.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                onAdd(landmark)
                onClose()
              }}
              className="flex-1 gap-2"
              style={{
                background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
              }}
            >
              <Plus className="h-4 w-4" />
              Add to Route
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
