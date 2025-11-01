import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Route, Sparkles } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'
import { calculateDistance } from '../../utils/routeOptimization'
import { ItineraryGenerator } from '../itinerary/ItineraryGenerator'

// Calculate total distance from waypoints
function calculateTotalDistance(waypoints: any[]): number {
  if (!waypoints || waypoints.length < 2) return 0

  let totalDistance = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = waypoints[i]
    const wp2 = waypoints[i + 1]

    if (wp1.coordinates && wp2.coordinates) {
      totalDistance += calculateDistance(
        wp1.coordinates.lat,
        wp1.coordinates.lng,
        wp2.coordinates.lat,
        wp2.coordinates.lng
      )
    }
  }

  return Math.round(totalDistance)
}

// Estimate trip duration based on distance and number of stops
function estimateTripDays(waypoints: any[], totalKm: number): number {
  if (waypoints.length === 0) return 0

  // Base formula: 1 day per city + additional days based on distance
  // Assumption: ~300km travel per day is comfortable
  const baseDays = waypoints.length
  const travelDays = Math.ceil(totalKm / 300)

  // Return the max of these two estimates
  return Math.max(baseDays, travelDays)
}

export function RouteOverview() {
  const { waypoints } = useSpotlightStore()
  const { routeData } = useRouteDataStore()
  const [showItineraryGenerator, setShowItineraryGenerator] = useState(false)

  // Get theme colors based on agent type
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  // Calculate real distance
  const totalDistance = calculateTotalDistance(waypoints)
  const estimatedDays = estimateTripDays(waypoints, totalDistance)

  const stats = [
    {
      icon: MapPin,
      number: waypoints.length,
      label: 'Stops',
    },
    {
      icon: Calendar,
      number: estimatedDays,
      label: 'Days',
    },
    {
      icon: Route,
      number: totalDistance > 0 ? totalDistance : '---',
      label: 'km',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Route Overview</h2>
        <p className="mt-2 text-sm text-gray-600">
          Explore your carefully crafted route through Europe's most captivating destinations.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-xl border-2 bg-white p-4 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderColor: theme.primary }}
            >
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`
                }}
              />
              <div className="relative">
                <div
                  className="mb-2 inline-flex rounded-lg p-2"
                  style={{
                    background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`
                  }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Generate Detailed Itinerary Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => setShowItineraryGenerator(true)}
        className="w-full rounded-xl border-2 p-6 text-center font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100"
        style={{
          backgroundColor: theme.primary,
          borderColor: theme.primary
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6" />
          <span className="text-lg">Generate Detailed Itinerary</span>
        </div>
        <p className="mt-2 text-sm opacity-90">
          AI-powered day-by-day plan with activities, restaurants, accommodations & more
        </p>
      </motion.button>

      {/* Itinerary Generator Modal */}
      {showItineraryGenerator && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <ItineraryGenerator
            routeData={{
              waypoints: waypoints.map(wp => ({
                city: wp.name,
                country: wp.country || 'France',
                coordinates: wp.coordinates
              })),
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }}
            agentType={agent}
            preferences={{
              budget: 'mid',
              travelers: 2
            }}
            onBack={() => setShowItineraryGenerator(false)}
          />
        </div>
      )}
    </div>
  )
}
