import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, DollarSign, ArrowRight, Map } from 'lucide-react'

interface Activity {
  name?: string
  activity?: string
  difficulty?: number
}

interface City {
  name: string
  activities?: (string | Activity)[]
  image?: string
  imageUrl?: string
  description?: string
}

interface ParsedRecommendations {
  waypoints: City[]
  description?: string
}

interface AgentResult {
  agent: string
  agentConfig: {
    name: string
    color: string
    icon: string
  }
  recommendations: string
  metrics: Record<string, any>
}

interface RouteData {
  id?: string
  origin: string
  destination: string
  totalStops?: number
  budget?: string
  agentResults: AgentResult[]
}

interface RouteResultsProps {
  routeData: RouteData
  onViewMap: (agent?: string) => void
  onStartOver: () => void
}

const agentThemes: Record<string, { color: string; icon: string }> = {
  adventure: { color: '#055948', icon: '/images/icons/adventure_icon.png' },
  culture: { color: '#a87600', icon: '/images/icons/culture_icon.png' },
  food: { color: '#650411', icon: '/images/icons/food_icon.png' },
  'hidden-gems': { color: '#081d5b', icon: '/images/icons/hidden_gem_icon.png' }
}

export function RouteResults({ routeData, onViewMap, onStartOver }: RouteResultsProps) {
  const [activeTab, setActiveTab] = useState(0)

  const totalCities = routeData?.agentResults?.reduce((total, agentResult) => {
    try {
      const parsed: ParsedRecommendations = JSON.parse(agentResult.recommendations)
      return total + (parsed.waypoints?.length || 0)
    } catch {
      return total
    }
  }, 0) || 0

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto max-w-7xl px-4">
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
              {totalCities}
            </div>
            <p className="text-sm text-gray-600">Cities to explore</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-2 flex items-center gap-2 text-slate-900">
              <Map className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Themes
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {routeData.agentResults.length}
            </div>
            <p className="text-sm text-gray-600">Travel styles</p>
          </div>

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

        {/* Theme Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {routeData.agentResults.map((agentResult, index) => {
              const theme = agentThemes[agentResult.agent] || agentThemes.adventure
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-3 rounded-xl px-6 py-4 font-semibold shadow-md transition-all ${
                    activeTab === index
                      ? 'scale-105 text-white shadow-xl'
                      : 'bg-white text-gray-700 hover:shadow-lg'
                  }`}
                  style={{
                    backgroundColor: activeTab === index ? theme.color : undefined,
                  }}
                >
                  <img
                    src={theme.icon}
                    alt={agentResult.agentConfig.name}
                    className="h-6 w-6 object-contain"
                    style={{
                      filter: activeTab === index ? 'brightness(0) invert(1)' : 'none'
                    }}
                  />
                  <span>{agentResult.agentConfig.name}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Theme Content */}
        <AnimatePresence mode="wait">
          {routeData.agentResults.map((agentResult, index) => {
            if (activeTab !== index) return null

            let parsedRecs: ParsedRecommendations | null = null
            try {
              parsedRecs = JSON.parse(agentResult.recommendations)
            } catch (error) {
              console.error('Failed to parse recommendations:', error)
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-lg bg-red-50 p-6 text-center"
                >
                  <p className="text-red-800">Failed to load recommendations for this theme.</p>
                </motion.div>
              )
            }

            if (!parsedRecs) return null

            const theme = agentThemes[agentResult.agent] || agentThemes.adventure
            const cities = parsedRecs.waypoints || []

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Theme Description */}
                {parsedRecs.description && (
                  <div className="rounded-xl bg-white p-6 shadow-lg">
                    <p className="text-lg text-gray-700">{parsedRecs.description}</p>
                  </div>
                )}

                {/* Metrics */}
                {agentResult.metrics && Object.keys(agentResult.metrics).length > 0 && (
                  <div className="rounded-xl bg-white p-8 shadow-lg">
                    <h3 className="mb-6 text-xl font-bold" style={{ color: theme.color }}>
                      Theme Insights
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(agentResult.metrics).map(([key, value]) => {
                        let displayValue: string
                        if (typeof value === 'number') {
                          displayValue = value.toFixed(1)
                        } else if (typeof value === 'object' && value !== null) {
                          if (Array.isArray(value)) {
                            // Handle array of objects (like restaurants)
                            if (value.length > 0 && typeof value[0] === 'object') {
                              displayValue = value.map((item: any) => item.name || JSON.stringify(item)).join(', ')
                            } else {
                              displayValue = (value as any[]).join(', ')
                            }
                          } else {
                            // Handle nested objects
                            const entries = Object.entries(value as Record<string, any>)
                            if (entries.some(([, v]) => typeof v === 'number' && v < 100)) {
                              // Looks like percentages
                              displayValue = entries.map(([k, v]) => `${k}: ${v}%`).join(', ')
                            } else {
                              displayValue = entries.map(([k, v]) => `${k}: ${v}`).join(', ')
                            }
                          }
                        } else {
                          displayValue = String(value)
                        }

                        return (
                          <div
                            key={key}
                            className="rounded-lg border-2 p-4"
                            style={{ borderColor: theme.color + '20', backgroundColor: theme.color + '05' }}
                          >
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {displayValue}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Cities */}
                <div>
                  <h3 className="mb-6 text-2xl font-bold text-gray-900">
                    Cities & Highlights ({cities.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cities.map((city, cityIndex) => (
                      <motion.div
                        key={cityIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: cityIndex * 0.1 }}
                        className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2"
                      >
                        {/* City Image */}
                        <div className="relative h-64 w-full overflow-hidden">
                          <img
                            src={city.image || city.imageUrl || `https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&h=600&fit=crop&q=80`}
                            alt={city.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLDivElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div
                            className="hidden h-full items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${theme.color}, ${theme.color}dd)`
                            }}
                          >
                            <MapPin className="h-16 w-16 text-white/50" />
                          </div>
                        </div>

                        {/* City Content */}
                        <div className="p-6">
                          <h4
                            className="mb-3 text-2xl font-bold transition-colors"
                            style={{ color: theme.color }}
                          >
                            {city.name}
                          </h4>

                          {city.description && (
                            <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                              {city.description}
                            </p>
                          )}

                          {city.activities && city.activities.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Highlights
                              </p>
                              <ul className="space-y-2">
                                {city.activities.slice(0, 3).map((activity, actIndex) => {
                                  const activityText = typeof activity === 'string'
                                    ? activity
                                    : (activity as Activity).name || (activity as Activity).activity || 'Activity'

                                  return (
                                    <li
                                      key={actIndex}
                                      className="flex items-start gap-2 text-sm text-gray-700"
                                    >
                                      <div
                                        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                                        style={{ backgroundColor: theme.color }}
                                      />
                                      <span>{activityText}</span>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* View Map Button for this theme */}
                <div className="flex justify-center">
                  <button
                    onClick={() => onViewMap(agentResult.agent)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    style={{ backgroundColor: theme.color }}
                  >
                    <Map className="h-5 w-5" />
                    View {agentResult.agentConfig.name} Route on Map
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Global Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <button
            onClick={() => onViewMap()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl"
          >
            <Map className="h-5 w-5" />
            View Complete Route on Map
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
