import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, ChevronRight, Menu, X } from 'lucide-react'

interface City {
  name: string
  country?: string
  coordinates: [number, number]
  nights?: number
  image?: string
  description?: string
  highlights?: string[]
}

interface FloatingSidebarProps {
  cities: City[]
  selectedCity?: City | null
  onCitySelect: (city: City) => void
  className?: string
}

export function FloatingSidebar({
  cities,
  selectedCity,
  onCitySelect,
  className = ''
}: FloatingSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden absolute top-6 left-6 z-50 p-3 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all"
        aria-label="Toggle route sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || true) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={`
              absolute top-6 bottom-6
              left-6 lg:left-6
              w-[calc(100%-3rem)] sm:w-96
              max-w-md
              bg-white/90 backdrop-blur-xl
              border border-gray-200/50
              rounded-2xl
              shadow-2xl
              overflow-hidden
              flex flex-col
              ${!isOpen ? 'hidden lg:flex' : ''}
              ${className}
            `}
            role="navigation"
            aria-label="Route cities"
          >
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Your Route
        </h2>
        <p className="text-sm text-gray-600">
          {cities.length} {cities.length === 1 ? 'city' : 'cities'} • {' '}
          {cities.reduce((sum, city) => sum + (city.nights || 0), 0)} nights total
        </p>
      </div>

      {/* City List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Custom scrollbar */}
        <style>{`
          .city-list::-webkit-scrollbar {
            width: 6px;
          }
          .city-list::-webkit-scrollbar-track {
            background: transparent;
          }
          .city-list::-webkit-scrollbar-thumb {
            background: #d4d4d4;
            border-radius: 3px;
          }
          .city-list::-webkit-scrollbar-thumb:hover {
            background: #a3a3a3;
          }
        `}</style>

        <div className="city-list space-y-2">
          {cities.map((city, index) => {
            const isActive = selectedCity?.name === city.name

            return (
              <motion.button
                key={`sidebar-city-${city.name}-${index}`}
                onClick={() => onCitySelect(city)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                className={`
                  w-full p-4 rounded-xl text-left
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gray-900 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md'
                  }
                `}
              >
                {/* City Number Badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`
                    flex-shrink-0 w-8 h-8 rounded-full
                    flex items-center justify-center
                    font-bold text-sm
                    transition-colors
                    ${
                      isActive
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-900 text-white'
                    }
                  `}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* City Name */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`
                        font-semibold text-base truncate
                        ${isActive ? 'text-white' : 'text-gray-900'}
                      `}
                      >
                        {city.name}
                      </h3>
                      <ChevronRight
                        className={`
                        flex-shrink-0 w-4 h-4
                        ${isActive ? 'text-white' : 'text-gray-400'}
                      `}
                      />
                    </div>

                    {/* City Info */}
                    <div
                      className={`
                      flex items-center gap-3 text-xs
                      ${isActive ? 'text-gray-300' : 'text-gray-600'}
                    `}
                    >
                      {city.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{city.country}</span>
                        </div>
                      )}
                      {city.nights !== undefined && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {city.nights} {city.nights === 1 ? 'night' : 'nights'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* City Highlights */}
                    {!isActive && city.highlights && city.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {city.highlights.slice(0, 2).map((highlight, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {highlight}
                          </span>
                        ))}
                        {city.highlights.length > 2 && (
                          <span className="px-2 py-0.5 text-gray-500 text-xs">
                            +{city.highlights.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected City Image Preview */}
                {isActive && city.image && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 rounded-lg overflow-hidden"
                  >
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-32 object-cover"
                    />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-6 border-t border-gray-200/50 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide font-semibold">
              Total Distance
            </p>
            <p className="text-lg font-bold text-gray-900">
              {Math.round(
                cities.reduce((sum, city, i) => {
                  if (i === 0) return sum
                  const prev = cities[i - 1]
                  const distance = calculateDistance(
                    prev.coordinates[1],
                    prev.coordinates[0],
                    city.coordinates[1],
                    city.coordinates[0]
                  )
                  return sum + distance
                }, 0)
              )}{' '}
              km
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide font-semibold">
              Total Nights
            </p>
            <p className="text-lg font-bold text-gray-900">
              {cities.reduce((sum, city) => sum + (city.nights || 0), 0)}
            </p>
          </div>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
