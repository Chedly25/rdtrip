import { motion } from 'framer-motion'
import { MapPin, Calendar, Route } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'

export function RouteOverview() {
  const { waypoints } = useSpotlightStore()

  const stats = [
    {
      icon: MapPin,
      number: waypoints.length,
      label: 'Stops',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      number: Math.ceil(waypoints.length * 1.5),
      label: 'Days',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Route,
      number: '~450',
      label: 'km',
      color: 'from-orange-500 to-red-500',
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
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
              <div className="relative">
                <div className={`mb-2 inline-flex rounded-lg bg-gradient-to-br ${stat.color} p-2`}>
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
