import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, TrendingUp, Calendar } from 'lucide-react'
import { sampleRoute } from '../data/sampleRoute'

interface SampleRouteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SampleRouteModal({ isOpen, onClose }: SampleRouteModalProps) {
  if (!isOpen) return null

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
                  <div className="relative z-10">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-3xl">{sampleRoute.agent.icon}</span>
                      <span className="text-sm font-semibold uppercase tracking-wide text-white/90">
                        {sampleRoute.agent.name}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                      {sampleRoute.origin.name} → {sampleRoute.destination.name}
                    </h2>
                    <p className="mt-2 text-white/90">
                      {sampleRoute.agent.focus}
                    </p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute right-6 top-6 rounded-lg bg-white/20 p-2 text-white transition-all hover:bg-white/30"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
                  {/* Quick Stats */}
                  <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Distance</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{sampleRoute.totalDistance} km</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Driving</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{sampleRoute.estimatedDuration.split(' ')[0]}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Stops</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{sampleRoute.waypoints.length}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Duration</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">3 days</div>
                    </div>
                  </div>

                  {/* Route Waypoints */}
                  <div className="mb-8">
                    <h3 className="mb-4 text-xl font-bold text-gray-900">Your Route</h3>
                    <div className="space-y-4">
                      {/* Origin */}
                      <div className="flex items-start gap-4 rounded-lg border-2 border-green-500 bg-green-50 p-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">
                          A
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{sampleRoute.origin.name}</h4>
                          <p className="text-sm text-gray-600">{sampleRoute.origin.description}</p>
                        </div>
                      </div>

                      {/* Waypoints */}
                      {sampleRoute.waypoints.map((waypoint, index) => (
                        <div key={index} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-700">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-gray-900">{waypoint.name}</h4>
                                <p className="text-sm text-gray-600">{waypoint.description}</p>
                              </div>
                              <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                {waypoint.duration}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {waypoint.activities.slice(0, 3).map((activity, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-green-500" />
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}

                      {/* Destination */}
                      <div className="flex items-start gap-4 rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                          B
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{sampleRoute.destination.name}</h4>
                          <p className="text-sm text-gray-600">{sampleRoute.destination.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-8">
                    <h3 className="mb-4 text-xl font-bold text-gray-900">Route Highlights</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {sampleRoute.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alternative Cities */}
                  {sampleRoute.alternatives && sampleRoute.alternatives.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-4 text-xl font-bold text-gray-900">Alternative Stops</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {sampleRoute.alternatives.map((alt, index) => (
                          <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h4 className="mb-1 font-bold text-gray-900">{alt.name}</h4>
                            <p className="mb-2 text-sm text-gray-600">{alt.description}</p>
                            <p className="text-xs text-gray-500">Why visit: {alt.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center">
                    <p className="mb-4 text-lg font-semibold text-gray-900">
                      Want a custom route like this?
                    </p>
                    <p className="mb-4 text-sm text-gray-600">
                      Generate your personalized route in 2 minutes with 4 different AI agents
                    </p>
                    <button
                      onClick={() => {
                        onClose()
                        document.getElementById('route-form')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition-all hover:bg-slate-800"
                    >
                      Create My Route
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
