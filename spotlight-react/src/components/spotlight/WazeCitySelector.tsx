import { motion, AnimatePresence } from 'framer-motion'
import { X, Navigation } from 'lucide-react'
import type { Waypoint } from '../../types'

interface WazeCitySelectorProps {
  waypoints: Waypoint[]
  isOpen: boolean
  onClose: () => void
}

export function WazeCitySelector({ waypoints, isOpen, onClose }: WazeCitySelectorProps) {
  const handleCityClick = (waypoint: Waypoint) => {
    if (waypoint?.coordinates) {
      const url = `https://www.waze.com/ul?ll=${waypoint.coordinates.lat},${waypoint.coordinates.lng}&navigate=yes`
      window.open(url, '_blank')
      onClose()
    }
  }

  const getCityType = (waypoint: Waypoint, index: number) => {
    if (waypoint.id === 'origin') return 'Origin'
    if (waypoint.id === 'destination') return 'Destination'
    if (waypoint.isLandmark) return 'Landmark'
    // For middle cities, calculate their stop number (excluding origin)
    const stopNumber = waypoints
      .slice(0, index)
      .filter(wp => wp.id !== 'origin').length
    return `Stop ${stopNumber}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[85vh] overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-2xl m-4">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Navigate to which city? 🚗
                  </h2>
                  <p className="text-sm text-gray-600">
                    Waze doesn't support multi-stop routes. Choose one destination.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* City Grid - Scrollable */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {waypoints.map((waypoint, index) => {
                    const cityType = getCityType(waypoint, index)

                    return (
                      <motion.button
                        key={waypoint.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCityClick(waypoint)}
                        className="relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-0 text-left group"
                      >
                        {/* Image */}
                        {waypoint.imageUrl && (
                          <div className="w-full h-40 overflow-hidden">
                            <img
                              src={waypoint.imageUrl}
                              alt={waypoint.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}

                        {/* No image fallback */}
                        {!waypoint.imageUrl && (
                          <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                            <Navigation className="w-12 h-12 text-blue-400" />
                          </div>
                        )}

                        {/* City Type Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm
                            ${cityType === 'Origin' ? 'bg-green-500/90 text-white' :
                              cityType === 'Destination' ? 'bg-red-500/90 text-white' :
                              cityType === 'Landmark' ? 'bg-purple-500/90 text-white' :
                              'bg-blue-500/90 text-white'}
                          `}>
                            {cityType}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          {/* City Name */}
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {waypoint.name}
                          </h3>

                          {/* Navigate Button */}
                          <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold group-hover:text-blue-700 transition-colors">
                            <Navigation className="w-4 h-4" />
                            <span>Navigate in Waze</span>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-200 pointer-events-none" />
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-start gap-3 text-sm">
                  <div className="text-2xl">💡</div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Tip: Need the full multi-stop route?
                    </p>
                    <p className="text-gray-600">
                      Use "Export to Google Maps" instead - it supports all your cities, landmarks, and stops in one route!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
