import { motion } from 'framer-motion'
import { MapPin, Calendar, Route } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

export function RouteOverview() {
  const { waypoints } = useSpotlightStore()
  const { routeData } = useRouteDataStore()

  // Get theme colors based on agent type
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  const stats = [
    {
      icon: MapPin,
      number: waypoints.length,
      label: 'Stops',
    },
    {
      icon: Calendar,
      number: Math.ceil(waypoints.length * 1.5),
      label: 'Days',
    },
    {
      icon: Route,
      number: '~450',
      label: 'km',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Route Overview</h2>
        <p className="mt-2 text-gray-600">
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
              className="relative overflow-hidden rounded-xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
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
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
