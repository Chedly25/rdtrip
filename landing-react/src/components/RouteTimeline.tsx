import { motion } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'

interface City {
  name: string
  nights?: number
}

interface RouteTimelineProps {
  cities: City[]
  destination: City
  themeColor: string
}

export function RouteTimeline({ cities, destination, themeColor }: RouteTimelineProps) {
  let currentDay = 1

  return (
    <div className="route-timeline mb-8 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Your Journey Timeline</h3>

      <div className="flex flex-wrap items-center gap-4">
        {cities.map((city, index) => {
          // CRITICAL: Guard against undefined city
          if (!city || !city.name) {
            console.warn(`⚠️ RouteTimeline: Skipping invalid city at index ${index}`, city);
            return null;
          }

          const nights = city.nights || 0
          const startDay = currentDay
          const endDay = currentDay + nights - 1
          currentDay += nights

          return (
            <div key={index} className="flex items-center gap-4">
              {/* City Segment */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center min-w-[140px] rounded-lg border-2 p-3"
                style={{ borderColor: themeColor }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" style={{ color: themeColor }} />
                  <span className="font-bold text-gray-900">{city.name}</span>
                </div>
                <span className="text-xs text-gray-600">
                  Day {startDay}{nights > 1 ? `-${endDay}` : ''}
                </span>
                <span className="text-sm font-semibold" style={{ color: themeColor }}>
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
              </motion.div>

              {/* Arrow (if not last) */}
              {index < cities.length && (
                <ArrowRight className="h-6 w-6 text-gray-400" />
              )}
            </div>
          )
        })}

        {/* Destination */}
        {destination && destination.name && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: cities.length * 0.1 }}
            className="flex flex-col items-center min-w-[140px] rounded-lg border-2 p-3 bg-gradient-to-br"
            style={{
              borderColor: themeColor,
              background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}30)`
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4" style={{ color: themeColor }} />
              <span className="font-bold text-gray-900">{destination.name}</span>
            </div>
          <span className="text-xs text-gray-600">
            Day {currentDay}-{currentDay + (destination.nights || 0) - 1}
          </span>
          <span className="text-sm font-semibold" style={{ color: themeColor }}>
            {destination.nights || 0} {(destination.nights || 0) === 1 ? 'night' : 'nights'}
          </span>
          <span className="text-xs font-medium text-gray-500 mt-1">Destination</span>
        </motion.div>
        )}
      </div>

      {/* Total Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Duration:</span>
          <span className="font-bold text-gray-900">
            {cities.filter(c => c && c.nights !== undefined).reduce((sum, c) => sum + (c.nights || 0), 0) + (destination?.nights || 0)} nights
            ({cities.filter(c => c && c.nights !== undefined).reduce((sum, c) => sum + (c.nights || 0), 0) + (destination?.nights || 0) + 1} days)
          </span>
        </div>
      </div>
    </div>
  )
}
