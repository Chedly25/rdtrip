import { motion } from 'framer-motion'
import { MapPin, Clock, DollarSign, ArrowRight, Map } from 'lucide-react'

interface Waypoint {
  name: string
  activities?: string[]
  imageUrl?: string
}

interface RouteData {
  id?: string
  origin: string
  destination: string
  waypoints: Waypoint[]
  distance?: number
  duration?: number
  budget?: string
  agents?: string[]
}

interface RouteResultsProps {
  routeData: RouteData
  onViewMap: () => void
  onStartOver: () => void
}

export function RouteResults({ routeData, onViewMap, onStartOver }: RouteResultsProps) {
  const allWaypoints = routeData.waypoints || []

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Your Perfect Route
          </h2>
          <p className="text-lg text-gray-600">
            From {routeData.origin} to {routeData.destination}
          </p>
        </motion.div>

        {/* Route Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-2 flex items-center gap-2 text-slate-900">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Stops
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {allWaypoints.length}
            </div>
            <p className="text-sm text-gray-600">Cities to explore</p>
          </div>

          {routeData.distance && (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Distance
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(routeData.distance / 1000)} km
              </div>
              <p className="text-sm text-gray-600">Total travel distance</p>
            </div>
          )}

          {routeData.budget && (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Budget
                </span>
              </div>
              <div className="text-3xl font-bold capitalize text-gray-900">
                {routeData.budget}
              </div>
              <p className="text-sm text-gray-600">Travel style</p>
            </div>
          )}
        </motion.div>

        {/* Waypoints List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 space-y-6"
        >
          <h3 className="text-2xl font-bold text-gray-900">Your Itinerary</h3>

          <div className="space-y-4">
            {allWaypoints.map((waypoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="overflow-hidden rounded-xl bg-white shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  {waypoint.imageUrl && (
                    <div className="h-48 w-full md:h-auto md:w-64">
                      <img
                        src={waypoint.imageUrl}
                        alt={waypoint.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold">
                        {index + 1}
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900">
                        {waypoint.name}
                      </h4>
                    </div>

                    {waypoint.activities && waypoint.activities.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-gray-600">
                          Things to do:
                        </p>
                        <ul className="space-y-2">
                          {waypoint.activities.slice(0, 3).map((activity, actIndex) => (
                            <li
                              key={actIndex}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-900" />
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <button
            onClick={onViewMap}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl"
          >
            <Map className="h-5 w-5" />
            View Interactive Map
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            onClick={onStartOver}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            Plan a Different Route
          </button>
        </motion.div>
      </div>
    </section>
  )
}
