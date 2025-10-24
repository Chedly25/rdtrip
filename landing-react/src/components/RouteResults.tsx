import { motion } from 'framer-motion'
import { MapPin, Clock, DollarSign, ArrowRight, Map, Mountain, Palette, UtensilsCrossed, Gem } from 'lucide-react'

interface City {
  name: string
  activities?: string[]
  image?: string
  imageUrl?: string
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
  metrics: Record<string, number>
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
  onViewMap: () => void
  onStartOver: () => void
}

const agentIcons: Record<string, any> = {
  adventure: Mountain,
  culture: Palette,
  food: UtensilsCrossed,
  'hidden-gems': Gem
}

const agentColors: Record<string, string> = {
  adventure: 'bg-green-600',
  culture: 'bg-blue-600',
  food: 'bg-red-600',
  'hidden-gems': 'bg-purple-600'
}

export function RouteResults({ routeData, onViewMap, onStartOver }: RouteResultsProps) {
  console.log('RouteResults received data:', routeData)
  console.log('agentResults:', routeData?.agentResults)

  const totalCities = routeData?.agentResults?.reduce((total, agentResult) => {
    try {
      console.log('Processing agent:', agentResult.agent)
      console.log('Recommendations:', agentResult.recommendations)
      const parsed: ParsedRecommendations = JSON.parse(agentResult.recommendations)
      console.log('Parsed recommendations:', parsed)
      return total + (parsed.waypoints?.length || 0)
    } catch (e) {
      console.error('Error parsing recommendations:', e)
      return total
    }
  }, 0) || 0

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
              {totalCities}
            </div>
            <p className="text-sm text-gray-600">Cities to explore</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-2 flex items-center gap-2 text-slate-900">
              <Clock className="h-5 w-5" />
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

        {/* Agent Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 space-y-8"
        >
          <h3 className="text-2xl font-bold text-gray-900">Your Themed Routes</h3>

          {!routeData?.agentResults || routeData.agentResults.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 p-6 text-center">
              <p className="text-yellow-800">No route data available. Please try generating your route again.</p>
            </div>
          ) : (
            routeData.agentResults.map((agentResult, agentIndex) => {
            let parsedRecs: ParsedRecommendations | null = null
            try {
              parsedRecs = JSON.parse(agentResult.recommendations)
            } catch (error) {
              console.error('Failed to parse recommendations:', error)
              return null
            }

            if (!parsedRecs) return null

            const Icon = agentIcons[agentResult.agent] || MapPin
            const colorClass = agentColors[agentResult.agent] || 'bg-slate-600'
            const cities = parsedRecs.waypoints || []

            return (
              <motion.div
                key={agentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * agentIndex }}
                className="overflow-hidden rounded-xl bg-white shadow-lg"
              >
                {/* Agent Header */}
                <div className={`${colorClass} p-6 text-white`}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8" />
                    <h4 className="text-2xl font-bold">
                      {agentResult.agentConfig.name}
                    </h4>
                  </div>
                  {parsedRecs.description && (
                    <p className="mt-3 text-sm opacity-90">
                      {parsedRecs.description}
                    </p>
                  )}
                </div>

                {/* Metrics */}
                {agentResult.metrics && Object.keys(agentResult.metrics).length > 0 && (
                  <div className="border-b border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {Object.entries(agentResult.metrics).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="mt-1 text-xl font-bold text-gray-900">
                            {typeof value === 'number' ? value.toFixed(1) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cities Grid */}
                <div className="p-6">
                  <p className="mb-4 text-sm font-semibold text-gray-600">
                    Featured Cities ({cities.length})
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {cities.slice(0, 3).map((city, cityIndex) => (
                      <div
                        key={cityIndex}
                        className="overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                      >
                        {(city.image || city.imageUrl) && (
                          <div className="h-40 w-full">
                            <img
                              src={city.image || city.imageUrl}
                              alt={city.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h5 className="mb-2 font-bold text-gray-900">
                            {city.name}
                          </h5>
                          {city.activities && city.activities.length > 0 && (
                            <ul className="space-y-1">
                              {city.activities.slice(0, 2).map((activity, actIndex) => (
                                <li
                                  key={actIndex}
                                  className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400" />
                                  <span className="line-clamp-1">{activity}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {cities.length > 3 && (
                    <p className="mt-4 text-sm text-gray-500">
                      + {cities.length - 3} more cities in this route
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })
          )}
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
