import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, DollarSign, ArrowRight, Map, Save, RefreshCw, Share2, Plus, Sparkles, Undo, RotateCcw, Mountain, Landmark, UtensilsCrossed, Compass, Star, Calendar, TrendingUp, Award, Globe, Info } from 'lucide-react'
import { CityCard } from './CityCard'
import { BudgetDisplay } from './BudgetDisplay'
import { useAuth } from '../contexts/AuthContext'
import SaveRouteModal from './SaveRouteModal'
import ShareRouteModal from './ShareRouteModal'
import CityActionModal from './CityActionModal'
import CityDetailModal from './CityDetailModal'
import Toast, { type ToastType } from './Toast'
import { getPositionDescription } from '../utils/routeOptimization'

interface Activity {
  name?: string
  activity?: string
  difficulty?: number
}

interface City {
  name: string
  city?: string  // New format from RouteDiscoveryAgentV2
  activities?: (string | Activity)[]
  image?: string
  imageUrl?: string
  description?: string
  why?: string  // RouteDiscoveryAgentV2 uses 'why' instead of 'description'
  highlights?: string[]  // RouteDiscoveryAgentV2 uses 'highlights' instead of 'activities'
  themes?: string[]
  themesDisplay?: string
  coordinates?: [number, number] // [lat, lng]
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

export function RouteResults({ routeData, onStartOver }: RouteResultsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [savedRouteId, setSavedRouteId] = useState<string | undefined>(routeData.id)
  const savedRouteIdRef = useRef<string | undefined>(routeData.id) // Keep ref in sync with state
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [viewCount] = useState(0)
  const [showCityActionModal, setShowCityActionModal] = useState(false)
  const [selectedAlternativeCity, setSelectedAlternativeCity] = useState<City | null>(null)
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number>(0)
  const [showCityDetailModal, setShowCityDetailModal] = useState(false)
  const [selectedCityForDetails, setSelectedCityForDetails] = useState<{ name: string; country?: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const { token, isAuthenticated } = useAuth()

  // Budget calculation state
  const [budgets, setBudgets] = useState<Record<string, any>>({})
  const [budgetLoading, setBudgetLoading] = useState(true)

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

  // Calculate budgets for all agents on mount
  useEffect(() => {
    async function calculateBudgets() {
      setBudgetLoading(true)

      const budgetPromises = routeData.agentResults.map(async (agentResult) => {
        try {
          const parsedRecs = JSON.parse(agentResult.recommendations)

          // Estimate duration: 1.5 days per city (rounded up)
          const waypointsCount = parsedRecs.waypoints?.length || 0
          const estimatedDuration = Math.max(2, Math.ceil(waypointsCount * 1.5))

          const response = await fetch('/api/calculate-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route: parsedRecs,
              tripDetails: {
                duration: estimatedDuration,
                travelers: 2, // Default to 2 travelers
                budgetLevel: routeData.budget || 'mid',
                preferences: { agent: agentResult.agent }
              }
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error(`Budget calc failed for ${agentResult.agent}:`, errorData)
            return {
              agent: agentResult.agent,
              budget: errorData.fallback || { summary: { total: 0, perPerson: 0, confidence: 'error' }, error: true }
            }
          }

          const budgetData = await response.json()
          return { agent: agentResult.agent, budget: budgetData }

        } catch (error) {
          console.error(`Budget calc error for ${agentResult.agent}:`, error)
          return {
            agent: agentResult.agent,
            budget: { summary: { total: 0, perPerson: 0, confidence: 'error' }, error: true }
          }
        }
      })

      const results = await Promise.all(budgetPromises)

      const budgetsByAgent: Record<string, any> = {}
      results.forEach(({ agent, budget }) => {
        budgetsByAgent[agent] = budget
      })

      setBudgets(budgetsByAgent)
      setBudgetLoading(false)
    }

    if (routeData.agentResults.length > 0) {
      calculateBudgets()
    }
  }, [routeData])

  // Open modal for city action
  const handleOpenCityAction = (city: City, agentIndex: number) => {
    setSelectedAlternativeCity(city)
    setCurrentAgentIndex(agentIndex)
    setShowCityActionModal(true)
  }

  // Open city detail modal
  const handleOpenCityDetails = (cityName: string, country?: string) => {
    setSelectedCityForDetails({ name: cityName, country })
    setShowCityDetailModal(true)
  }

  // Add city at specific position
  const handleAddCity = (position: number, cityWithCoordinates: City) => {
    const agentResult = routeData.agentResults[currentAgentIndex]
    let parsedRecs: ParsedRecommendations | null = null
    try {
      parsedRecs = JSON.parse(agentResult.recommendations)
    } catch (error) {
      console.error('Failed to parse recommendations:', error)
      return
    }

    // Ensure waypoints is always an array (not an object)
    const rawWaypoints = parsedRecs?.waypoints
    const originalWaypoints = Array.isArray(rawWaypoints) ? rawWaypoints : []
    const currentWaypoints = modifiedWaypoints[currentAgentIndex] || originalWaypoints

    // Get human-readable position description
    const positionDesc = getPositionDescription(position, currentWaypoints)

    // Save to history before making changes
    setHistory(prev => [
      ...prev,
      {
        agentIndex: currentAgentIndex,
        previousWaypoints: [...currentWaypoints],
        action: `Added ${cityWithCoordinates.name} ${positionDesc} (optimal position)`,
        timestamp: Date.now()
      }
    ])

    const updatedWaypoints = [...currentWaypoints]
    // Insert city (with coordinates) at the specified position
    updatedWaypoints.splice(position, 0, cityWithCoordinates)

    setModifiedWaypoints(prev => ({
      ...prev,
      [currentAgentIndex]: updatedWaypoints
    }))

    // Show success toast with position information
    setToast({
      message: `✓ Added ${cityWithCoordinates.name} ${positionDesc}`,
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

    // Ensure waypoints is always an array (not an object)
    const rawWaypoints = parsedRecs?.waypoints
    const originalWaypoints = Array.isArray(rawWaypoints) ? rawWaypoints : []
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
    console.log('[DEBUG] handleSaveRoute START - name:', name, 'token exists:', !!token)

    if (!token) {
      throw new Error('You must be logged in to save routes')
    }

    // Get enriched route data with modifications
    const enrichedRouteData = getEnrichedRouteData()
    console.log('[DEBUG] Enriched route data prepared, origin:', enrichedRouteData.origin, 'dest:', enrichedRouteData.destination)

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

    console.log('[DEBUG] Fetch response received - status:', response.status, 'ok:', response.ok)

    if (!response.ok) {
      const error = await response.json()
      console.error('[DEBUG] Save failed:', error)
      throw new Error(error.error || 'Failed to save route')
    }

    const savedRoute = await response.json()
    console.log('[DEBUG] Parsed response - savedRoute:', savedRoute, 'id:', savedRoute.id)

    // API returns { message: '...', route: { id: '...' } }
    const routeId = savedRoute.route?.id || savedRoute.id
    console.log('[DEBUG] Extracted routeId:', routeId)

    setSavedRouteId(routeId)
    savedRouteIdRef.current = routeId // Also update ref immediately
    console.log('[DEBUG] Set state and ref - ref is now:', savedRouteIdRef.current)

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)

    console.log('[DEBUG] handleSaveRoute RETURNING:', routeId)
    return routeId
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

    // Navigate directly to spotlight-new (don't call onViewMap which would overwrite localStorage)
    window.location.href = `/spotlight-new/?routeId=${routeData.id || Date.now()}&agent=${agent || 'adventure'}`
  }

  const handleShareClick = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to share routes')
      return
    }

    console.log('[DEBUG] handleShareClick START - ref:', savedRouteIdRef.current, 'state:', savedRouteId)

    // If route isn't saved yet, save it first
    if (!savedRouteIdRef.current) {
      console.log('[DEBUG] Route not saved, saving now...')
      try {
        const routeId = await handleSaveRoute(`${routeData.origin} to ${routeData.destination}`)
        console.log('[DEBUG] Save completed, routeId:', routeId, 'ref after save:', savedRouteIdRef.current)
        // Both state and ref are updated in handleSaveRoute
      } catch (error) {
        console.error('Error saving route before sharing:', error)
        alert('Please save the route first before sharing')
        return
      }
    }

    console.log('[DEBUG] Opening share modal - ref:', savedRouteIdRef.current, 'state:', savedRouteId)
    setShowShareModal(true)
  }

  const handleShareRoute = async (): Promise<{ shareUrl: string; shareToken: string }> => {
    // Use ref to get the most current value, even if state hasn't updated yet
    const currentRouteId = savedRouteIdRef.current || savedRouteId
    console.log('[DEBUG] handleShareRoute - currentRouteId:', currentRouteId, 'ref:', savedRouteIdRef.current, 'state:', savedRouteId)

    if (!currentRouteId) {
      throw new Error('Route must be saved before sharing')
    }

    const response = await fetch(`/api/routes/${currentRouteId}/share`, {
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

            // Transform RouteDiscoveryAgentV2 format to CityCard format
            const transformCity = (city: any) => {
              const transformed = {
                ...city,
                name: city.name || city.city,  // Normalize name
                description: city.description || city.why,  // Map 'why' to 'description'
                activities: city.activities || city.highlights || [],  // Map 'highlights' to 'activities'
              }

              // DEBUG: Log transformation
              console.log(`🔄 RouteResults transformCity - ${transformed.name}:`, {
                beforeTransform: {
                  hasName: !!city.name,
                  hasCity: !!city.city,
                  hasDescription: !!city.description,
                  hasWhy: !!city.why,
                  hasActivities: !!city.activities,
                  hasHighlights: !!city.highlights,
                  highlightsLength: Array.isArray(city.highlights) ? city.highlights.length : 0,
                  activitiesLength: Array.isArray(city.activities) ? city.activities.length : 0
                },
                afterTransform: {
                  name: transformed.name,
                  hasDescription: !!transformed.description,
                  descriptionPreview: transformed.description?.substring(0, 50),
                  hasActivities: !!transformed.activities,
                  activitiesLength: Array.isArray(transformed.activities) ? transformed.activities.length : 0,
                  activitiesPreview: Array.isArray(transformed.activities) ? transformed.activities.slice(0, 2) : []
                }
              })

              return transformed
            }

            // Use modified waypoints if available, otherwise use original (and transform)
            // Ensure waypoints is always an array
            const rawWaypoints = parsedRecs.waypoints
            const originalWaypoints = Array.isArray(rawWaypoints) ? rawWaypoints : []
            const rawCities = modifiedWaypoints[index] || originalWaypoints
            const cities = rawCities.map(transformCity)

            // Ensure alternatives is always an array
            const rawAlternatives = parsedRecs.alternatives
            const alternatives = (Array.isArray(rawAlternatives) ? rawAlternatives : []).map(transformCity)

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

                {/* Theme Insights */}
                {agentResult.metrics && Object.keys(agentResult.metrics).length > 0 && (
                  <div className="rounded-xl bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5" style={{ color: theme.color }} />
                      <h3 className="text-lg font-bold text-gray-900">
                        Why This Route?
                      </h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(agentResult.metrics).map(([key, value]) => {
                        const displayValue = String(value)
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

                        // Get icon based on key name
                        const getIcon = () => {
                          const keyLower = key.toLowerCase()
                          if (keyLower.includes('terrain') || keyLower.includes('activities') || keyLower.includes('difficulty')) return Mountain
                          if (keyLower.includes('heritage') || keyLower.includes('architecture') || keyLower.includes('historical')) return Landmark
                          if (keyLower.includes('culinary') || keyLower.includes('dish') || keyLower.includes('dining') || keyLower.includes('budget')) return UtensilsCrossed
                          if (keyLower.includes('discover') || keyLower.includes('authentic') || keyLower.includes('secret')) return Compass
                          if (keyLower.includes('highlight')) return Star
                          if (keyLower.includes('season') || keyLower.includes('time')) return Calendar
                          if (keyLower.includes('balance') || keyLower.includes('diversity') || keyLower.includes('route')) return TrendingUp
                          if (keyLower.includes('experience')) return Award
                          return Globe
                        }
                        const IconComponent = getIcon()

                        return (
                          <div
                            key={key}
                            className="group relative overflow-hidden rounded-lg border p-3 transition-all hover:shadow-md"
                            style={{ borderColor: theme.color + '30' }}
                          >
                            <div className="flex items-start gap-2">
                              <IconComponent
                                className="mt-0.5 h-4 w-4 flex-shrink-0"
                                style={{ color: theme.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.color }}>
                                  {label}
                                </p>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  {displayValue}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Budget Display */}
                <BudgetDisplay
                  budgetData={budgets[agentResult.agent]}
                  loading={budgetLoading}
                  themeColor={theme.color}
                />

                {/* Cities */}
                <div>
                  <h3 className="mb-6 text-2xl font-bold text-gray-900">
                    Cities & Highlights ({cities.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cities.map((city, cityIndex) => {
                      // Handle both old format (name) and new format (city)
                      const cityName = city.name || city.city || 'Unknown'

                      // Check if this city was added by user (not in original waypoints)
                      const isUserAdded = modifiedWaypoints[index] && parsedRecs?.waypoints &&
                        !parsedRecs.waypoints.some((origCity: City) =>
                          (origCity.name || origCity.city) === cityName
                        )

                      return (
                        <div key={cityIndex} className="relative">
                          <CityCard
                            city={city}
                            index={cityIndex}
                            themeColor={theme.color}
                            showThemeBadges={agentResult.agent === 'best-overall'}
                            themes={city.themes || []}
                            onClick={() => handleOpenCityDetails(cityName)}
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
                            onClick={() => handleOpenCityDetails(altCity.name)}
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
                  const rawWaypoints = parsedRecs.waypoints
                  const originalWaypoints = Array.isArray(rawWaypoints) ? rawWaypoints : []
                  return modifiedWaypoints[currentAgentIndex] || originalWaypoints
                } catch {
                  return []
                }
              })()
            }
            originCoords={
              (() => {
                const agentResult = routeData.agentResults[currentAgentIndex]
                try {
                  const parsedRecs: ParsedRecommendations = JSON.parse(agentResult.recommendations)
                  if (parsedRecs.origin?.latitude && parsedRecs.origin?.longitude) {
                    return [parsedRecs.origin.latitude, parsedRecs.origin.longitude] as [number, number]
                  }
                } catch {
                  // Fall through to undefined
                }
                return undefined
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

        {/* City Detail Modal */}
        {selectedCityForDetails && (
          <CityDetailModal
            isOpen={showCityDetailModal}
            onClose={() => {
              setShowCityDetailModal(false)
              setSelectedCityForDetails(null)
            }}
            cityName={selectedCityForDetails.name}
            country={selectedCityForDetails.country}
            themeColor={agentThemes[routeData.agentResults[activeTab]?.agent]?.color || '#055948'}
            onAddToRoute={() => {
              if (selectedCityForDetails) {
                const agentIndex = activeTab
                handleOpenCityAction({ name: selectedCityForDetails.name, activities: [] }, agentIndex)
              }
            }}
          />
        )}
      </div>
    </section>
  )
}
