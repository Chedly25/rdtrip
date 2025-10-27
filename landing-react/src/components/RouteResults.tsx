import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, DollarSign, ArrowRight, Map, Save } from 'lucide-react'
import { CityCard } from './CityCard'
import { useAuth } from '../contexts/AuthContext'
import SaveRouteModal from './SaveRouteModal'

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
  themes?: string[]
  themesDisplay?: string
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
  'best-overall': { color: '#6366f1', icon: '/images/icons/best_icon.png' },
  adventure: { color: '#055948', icon: '/images/icons/adventure_icon.png' },
  culture: { color: '#a87600', icon: '/images/icons/culture_icon.png' },
  food: { color: '#650411', icon: '/images/icons/food_icon.png' },
  'hidden-gems': { color: '#081d5b', icon: '/images/icons/hidden_gem_icon.png' }
}

export function RouteResults({ routeData, onViewMap, onStartOver }: RouteResultsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { token, isAuthenticated } = useAuth()

  const handleSaveRoute = async (name: string) => {
    if (!token) {
      throw new Error('You must be logged in to save routes')
    }

    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        origin: routeData.origin,
        destination: routeData.destination,
        stops: routeData.totalStops || routeData.agentResults?.length || 0,
        budget: routeData.budget || 'budget',
        selectedAgents: routeData.agentResults?.map(r => r.agent) || [],
        routeData: routeData
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save route')
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

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
                      <CityCard
                        key={cityIndex}
                        city={city}
                        index={cityIndex}
                        themeColor={theme.color}
                        showThemeBadges={agentResult.agent === 'best-overall'}
                        themes={city.themes || []}
                      />
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

          {isAuthenticated ? (
            <button
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl disabled:opacity-50"
              disabled={saveSuccess}
            >
              <Save className="h-5 w-5" />
              {saveSuccess ? 'Saved!' : 'Save Route'}
            </button>
          ) : (
            <button
              onClick={() => alert('Please sign in to save routes')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-indigo-600 bg-white px-8 py-4 text-lg font-semibold text-indigo-600 transition-all hover:bg-indigo-50"
            >
              <Save className="h-5 w-5" />
              Sign In to Save
            </button>
          )}

          <button
            onClick={onStartOver}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            Plan a Different Route
          </button>
        </motion.div>

        {/* Save Route Modal */}
        <SaveRouteModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveRoute}
          routeData={routeData as any}
        />
      </div>
    </section>
  )
}
