import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, DollarSign, ArrowRight, Map, Save, RefreshCw, Share2, Plus, Sparkles, Undo, RotateCcw } from 'lucide-react'
import { CityCard } from './CityCard'
import { useAuth } from '../contexts/AuthContext'
import SaveRouteModal from './SaveRouteModal'
import ShareRouteModal from './ShareRouteModal'
import CityActionModal from './CityActionModal'
import Toast, { type ToastType } from './Toast'
import { getPositionDescription } from '../utils/routeOptimization'

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
  coordinates?: [number, number] // [lng, lat]
}

interface ParsedRecommendations {
  waypoints: City[]
  alternatives?: City[]
  description?: string
  origin?: { name: string; latitude: number; longitude: number }
  destination?: { name: string; latitude: number; longitude: number }
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
  'best-overall': { color: '#064d51', icon: '/images/icons/best_icon.png' },
  adventure: { color: '#055948', icon: '/images/icons/adventure_icon.png' },
  culture: { color: '#a87600', icon: '/images/icons/culture_icon.png' },
  food: { color: '#650411', icon: '/images/icons/food_icon.png' },
  'hidden-gems': { color: '#081d5b', icon: '/images/icons/hidden_gem_icon.png' }
}

export function RouteResults({ routeData, onViewMap, onStartOver }: RouteResultsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [savedRouteId, setSavedRouteId] = useState<string | undefined>(routeData.id)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [viewCount] = useState(0)
  const [showCityActionModal, setShowCityActionModal] = useState(false)
  const [selectedAlternativeCity, setSelectedAlternativeCity] = useState<City | null>(null)
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number>(0)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const { token, isAuthenticated } = useAuth()

  // State to manage modified waypoints per agent (for adding/replacing cities)
  const [modifiedWaypoints, setModifiedWaypoints] = useState<Record<number, City[]>>({})

  // History tracking for undo/redo
  type HistoryEntry = {
    agentIndex: number
    previousWaypoints: City[]
    action: string
    timestamp: number
  }
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showChangeHistory, setShowChangeHistory] = useState(false)

  // Open modal for city action
  const handleOpenCityAction = (city: City, agentIndex: number) => {
    setSelectedAlternativeCity(city)
    setCurrentAgentIndex(agentIndex)
    setShowCityActionModal(true)
  }

  // Add city at specific position
  const handleAddCity = (position: number) => {
    if (!selectedAlternativeCity) return

    const agentResult = routeData.agentResults[currentAgentIndex]
    let parsedRecs: ParsedRecommendations | null = null
    try {
      parsedRecs = JSON.parse(agentResult.recommendations)
    } catch (error) {
      console.error('Failed to parse recommendations:', error)
      return
    }

    const originalWaypoints = parsedRecs?.waypoints || []
    const currentWaypoints = modifiedWaypoints[currentAgentIndex] || originalWaypoints

    // Get human-readable position description
    const positionDesc = getPositionDescription(position, currentWaypoints)

    // Save to history before making changes
    setHistory(prev => [
      ...prev,
      {
        agentIndex: currentAgentIndex,
        previousWaypoints: [...currentWaypoints],
        action: `Added ${selectedAlternativeCity.name} ${positionDesc} (optimal position)`,
        timestamp: Date.now()
      }
    ])

    const updatedWaypoints = [...currentWaypoints]
    // Insert city at the specified position
    updatedWaypoints.splice(position, 0, selectedAlternativeCity)

    setModifiedWaypoints(prev => ({
      ...prev,
      [currentAgentIndex]: updatedWaypoints
    }))

    // Show success toast with position information
    setToast({
      message: `✓ Added ${selectedAlternativeCity.name} ${positionDesc}`,
      type: 'success'
    })
    setTimeout(() => setToast(null), 4000)
  }

  // Replace city at specific index
  const handleReplaceCity = (cityIndexToReplace: number) => {
    if (!selectedAlternativeCity) return

    const agentResult = routeData.agentResults[currentAgentIndex]
    let parsedRecs: ParsedRecommendations | null = null
    try {
      parsedRecs = JSON.parse(agentResult.recommendations)
    } catch (error) {
      console.error('Failed to parse recommendations:', error)
      return
    }

    const originalWaypoints = parsedRecs?.waypoints || []
    const currentWaypoints = modifiedWaypoints[currentAgentIndex] || originalWaypoints
    const updatedWaypoints = [...currentWaypoints]
    const replacedCity = updatedWaypoints[cityIndexToReplace]

    // Save to history before making changes
    setHistory(prev => [
      ...prev,
      {
        agentIndex: currentAgentIndex,
        previousWaypoints: [...currentWaypoints],
        action: `Replaced ${replacedCity?.name} with ${selectedAlternativeCity.name}`,
        timestamp: Date.now()
      }
    ])

    // Replace the city at the specified index
    updatedWaypoints[cityIndexToReplace] = selectedAlternativeCity

    setModifiedWaypoints(prev => ({
      ...prev,
      [currentAgentIndex]: updatedWaypoints
    }))

    // Show success toast
    setToast({
      message: `${replacedCity?.name} replaced with ${selectedAlternativeCity.name}!`,
      type: 'success'
    })
    setTimeout(() => setToast(null), 3000)
  }

  // Undo last change
  const handleUndo = () => {
    if (history.length === 0) return

    const lastChange = history[history.length - 1]

    // Restore previous waypoints
    setModifiedWaypoints(prev => ({
      ...prev,
      [lastChange.agentIndex]: lastChange.previousWaypoints
    }))

    // Remove last history entry
    setHistory(prev => prev.slice(0, -1))

    // Show toast
    setToast({
      message: 'Change undone!',
      type: 'success'
    })
    setTimeout(() => setToast(null), 2000)
  }

  // Reset to original AI recommendations
  const handleResetToOriginal = () => {
    if (Object.keys(modifiedWaypoints).length === 0) {
      setToast({
        message: 'No changes to reset',
        type: 'info'
      })
      setTimeout(() => setToast(null), 2000)
      return
    }

    // Clear all modifications
    setModifiedWaypoints({})
    setHistory([])

    // Show toast
    setToast({
      message: 'Route reset to original AI recommendations!',
      type: 'success'
    })
    setTimeout(() => setToast(null), 3000)
  }

  // Create enriched route data with modifications
  const getEnrichedRouteData = () => {
    const enrichedAgentResults = routeData.agentResults.map((agentResult, index) => {
      // If this agent has modified waypoints, update its recommendations
      if (modifiedWaypoints[index]) {
        try {
          const parsedRecs = JSON.parse(agentResult.recommendations)
          const enrichedRecs = {
            ...parsedRecs,
            waypoints: modifiedWaypoints[index],
            originalWaypoints: parsedRecs.waypoints, // Keep original for reference
            modified: true
          }
          return {
            ...agentResult,
            recommendations: JSON.stringify(enrichedRecs)
          }
        } catch (error) {
          console.error('Failed to enrich agent data:', error)
          return agentResult
        }
      }
      return agentResult
    })

    return {
      ...routeData,
      agentResults: enrichedAgentResults
    }
  }

  const handleSaveRoute = async (name: string) => {
    if (!token) {
      throw new Error('You must be logged in to save routes')
    }

    // Get enriched route data with modifications
    const enrichedRouteData = getEnrichedRouteData()

    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        origin: enrichedRouteData.origin,
        destination: enrichedRouteData.destination,
        stops: enrichedRouteData.totalStops || enrichedRouteData.agentResults?.length || 0,
        budget: enrichedRouteData.budget || 'budget',
        selectedAgents: enrichedRouteData.agentResults?.map(r => r.agent) || [],
        routeData: enrichedRouteData
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save route')
    }

    const savedRoute = await response.json()
    setSavedRouteId(savedRoute.id)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)

    return savedRoute.id
  }

  // Wrapper for View Map that includes modifications
  const handleViewMapWithModifications = (agent?: string) => {
    // Get enriched route data with modifications
    const enrichedRouteData = getEnrichedRouteData()

    // Store enriched data in localStorage so spotlight can use it
    const dataToStore = agent
      ? {
          ...enrichedRouteData,
          agentResults: enrichedRouteData.agentResults.filter((ar: any) => ar.agent === agent),
          agent: agent
        }
      : enrichedRouteData

    localStorage.setItem('spotlightData', JSON.stringify(dataToStore))

    // Call the original onViewMap which will navigate to spotlight
    onViewMap(agent)
  }

  const handleShareClick = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to share routes')
      return
    }

    // If route isn't saved yet, save it first
    if (!savedRouteId) {
      try {
        const routeId = await handleSaveRoute(`${routeData.origin} to ${routeData.destination}`)
        setSavedRouteId(routeId)
      } catch (error) {
        console.error('Error saving route before sharing:', error)
        alert('Please save the route first before sharing')
        return
      }
    }

    setShowShareModal(true)
  }

  const handleShareRoute = async (): Promise<{ shareUrl: string; shareToken: string }> => {
    if (!savedRouteId) {
      throw new Error('Route must be saved before sharing')
    }

    const response = await fetch(`/api/routes/${savedRouteId}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to generate share link')
    }

    const data = await response.json()
    setShareToken(data.shareToken)
    setIsPublic(true)

    return { shareUrl: data.shareUrl, shareToken: data.shareToken }
  }

  const handleStopSharing = async () => {
    if (!savedRouteId) return

    const response = await fetch(`/api/routes/${savedRouteId}/share`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to stop sharing')
    }

    setShareToken(null)
    setIsPublic(false)
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
              const isModified = modifiedWaypoints[index] !== undefined
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`relative flex items-center gap-3 rounded-xl px-6 py-4 font-semibold shadow-md transition-all ${
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
                  {isModified && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        activeTab === index
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span className="font-bold">Modified</span>
                    </motion.div>
                  )}
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
            // Use modified waypoints if available, otherwise use original
            const cities = modifiedWaypoints[index] || parsedRecs.waypoints || []
            const alternatives = parsedRecs.alternatives || []

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
                    {cities.map((city, cityIndex) => {
                      // Check if this city was added by user (not in original waypoints)
                      const isUserAdded = modifiedWaypoints[index] && parsedRecs?.waypoints &&
                        !parsedRecs.waypoints.some((origCity: City) => origCity.name === city.name)

                      return (
                        <div key={cityIndex} className="relative">
                          <CityCard
                            city={city}
                            index={cityIndex}
                            themeColor={theme.color}
                            showThemeBadges={agentResult.agent === 'best-overall'}
                            themes={city.themes || []}
                          />
                          {isUserAdded && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-lg"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Added by you</span>
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Alternative Cities */}
                {alternatives.length > 0 && (
                  <div className="mt-12">
                    <div className="mb-6 flex items-center gap-3">
                      <RefreshCw className="h-6 w-6" style={{ color: theme.color }} />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Alternative Cities ({alternatives.length})
                      </h3>
                    </div>
                    <p className="mb-6 text-gray-600">
                      These cities were also considered for your route. Click "Add to Route" to customize your journey.
                    </p>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {alternatives.map((altCity, altIndex) => (
                        <div key={altIndex} className="relative">
                          <CityCard
                            city={altCity}
                            index={altIndex}
                            themeColor={theme.color}
                            showThemeBadges={agentResult.agent === 'best-overall'}
                            themes={altCity.themes || []}
                          />
                          {/* Add to Route Button */}
                          <div className="mt-4">
                            <button
                              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
                              style={{ backgroundColor: theme.color }}
                              onClick={() => handleOpenCityAction(altCity, index)}
                            >
                              <Plus className="h-5 w-5" />
                              Add to Route
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Map Button for this theme */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleViewMapWithModifications(agentResult.agent)}
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

        {/* Undo/Reset Controls */}
        {(history.length > 0 || Object.keys(modifiedWaypoints).length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {history.length > 0 && (
              <button
                onClick={handleUndo}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-orange-500 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition-all hover:bg-orange-50 hover:shadow-md"
              >
                <Undo className="h-4 w-4" />
                Undo Last Change
              </button>
            )}

            {Object.keys(modifiedWaypoints).length > 0 && (
              <button
                onClick={handleResetToOriginal}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Original
              </button>
            )}

            {/* Change history summary */}
            {history.length > 0 && (
              <button
                onClick={() => setShowChangeHistory(!showChangeHistory)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
              >
                {history.length} change{history.length !== 1 ? 's' : ''} made
                <span className="text-xs">{showChangeHistory ? '▲' : '▼'}</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Change History List */}
        <AnimatePresence>
          {showChangeHistory && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-bold text-gray-700">Change History</h4>
                <div className="space-y-2">
                  {history.slice().reverse().map((entry, index) => (
                    <div
                      key={entry.timestamp}
                      className="flex items-start gap-3 rounded-md bg-white p-3 text-sm"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                        {history.length - index}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.action}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <button
            onClick={() => handleViewMapWithModifications()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl"
          >
            <Map className="h-5 w-5" />
            View Complete Route on Map
            <ArrowRight className="h-5 w-5" />
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={() => setShowSaveModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl disabled:opacity-50"
                disabled={saveSuccess}
              >
                <Save className="h-5 w-5" />
                {saveSuccess ? 'Saved!' : 'Save Route'}
              </button>

              <button
                onClick={handleShareClick}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-teal-700 hover:shadow-xl"
              >
                <Share2 className="h-5 w-5" />
                Share Route
              </button>
            </>
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

        {/* Share Route Modal */}
        <ShareRouteModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          routeName={`${routeData.origin} to ${routeData.destination}`}
          shareToken={shareToken}
          isPublic={isPublic}
          viewCount={viewCount}
          onShare={handleShareRoute}
          onStopSharing={handleStopSharing}
        />

        {/* City Action Modal */}
        {selectedAlternativeCity && (
          <CityActionModal
            isOpen={showCityActionModal}
            onClose={() => setShowCityActionModal(false)}
            selectedCity={selectedAlternativeCity}
            currentRoute={
              (() => {
                const agentResult = routeData.agentResults[currentAgentIndex]
                try {
                  const parsedRecs = JSON.parse(agentResult.recommendations)
                  return modifiedWaypoints[currentAgentIndex] || parsedRecs.waypoints || []
                } catch {
                  return []
                }
              })()
            }
            agentTheme={{
              color: agentThemes[routeData.agentResults[currentAgentIndex]?.agent]?.color || '#055948',
              name: routeData.agentResults[currentAgentIndex]?.agentConfig?.name || 'Route'
            }}
            onAddCity={handleAddCity}
            onReplaceCity={handleReplaceCity}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </section>
  )
}
