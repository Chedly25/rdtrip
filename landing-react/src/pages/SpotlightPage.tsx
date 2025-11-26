import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Map as MapIcon, List, ArrowLeft, Share2, Download, Loader2 } from 'lucide-react'

// Lazy load heavy components for code splitting
const MapView = lazy(() => import('../components/map/MapView').then(m => ({ default: m.MapView })))
const FloatingSidebar = lazy(() => import('../components/map/FloatingSidebar').then(m => ({ default: m.FloatingSidebar })))
const ItineraryView = lazy(() => import('../components/itinerary/ItineraryView').then(m => ({ default: m.ItineraryView })))

type ViewMode = 'map' | 'itinerary'

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

interface City {
  name: string
  country?: string
  coordinates: [number, number]
  nights?: number
  image?: string
  description?: string
  highlights?: string[]
}

interface Activity {
  id: string
  name: string
  type: 'activity' | 'restaurant' | 'scenic'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  duration?: number
  image?: string
  description?: string
  price?: string
  rating?: number
  difficulty?: 'easy' | 'moderate' | 'challenging'
  coordinates?: [number, number]
}

interface DayPlan {
  day: number
  date?: string
  city: string
  activities: Activity[]
}

export default function SpotlightPage() {
  const { routeId } = useParams()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [itinerary, setItinerary] = useState<DayPlan[]>([])

  // Load route data
  useEffect(() => {
    // Try to load from localStorage first
    const storedData = localStorage.getItem('spotlightData')

    if (storedData) {
      try {
        const data = JSON.parse(storedData)

        // Build cities array from origin + waypoints + destination
        const allCities: City[] = []

        // Add origin
        if (data.origin?.name && data.origin?.coordinates) {
          allCities.push({
            name: data.origin.name,
            country: data.origin.country,
            coordinates: data.origin.coordinates,
            nights: 0, // Origin is starting point
            description: 'Starting point'
          })
        }

        // Add waypoints (cities)
        if (data.cities && Array.isArray(data.cities)) {
          data.cities.forEach((city: City) => {
            if (city.name && city.coordinates) {
              allCities.push(city)
            }
          })
        }

        // Add destination
        if (data.destination?.name && data.destination?.coordinates) {
          allCities.push({
            name: data.destination.name,
            country: data.destination.country,
            coordinates: data.destination.coordinates,
            nights: data.destination.nights || 2,
            description: 'Final destination'
          })
        }

        setCities(allCities)

        // Generate simple itinerary from cities
        const generatedItinerary: DayPlan[] = []
        let dayCounter = 1

        allCities.forEach((city) => {
          const nights = city.nights || 1
          for (let i = 0; i < Math.max(1, nights); i++) {
            generatedItinerary.push({
              day: dayCounter++,
              city: city.name,
              activities: [] // Activities would need to be populated separately
            })
          }
        })

        setItinerary(generatedItinerary)
      } catch (error) {
        console.error('Error parsing spotlight data:', error)
      }
    } else if (routeId) {
      // Fetch from API if not in localStorage
      fetchRouteData(routeId)
    }
  }, [routeId])

  const fetchRouteData = async (id: string) => {
    try {
      const response = await fetch(`/api/routes/${id}`)
      if (!response.ok) throw new Error('Failed to fetch route')

      const data = await response.json()
      // Transform and set data
      setCities(data.cities || [])
      setItinerary(data.itinerary || [])
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

  const handleActivityClick = (activity: Activity) => {
    if (activity.coordinates) {
      setViewMode('map')
      // TODO: Zoom to activity location on map
    }
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Check out my route!',
        text: 'I created this amazing travel itinerary',
        url: window.location.href
      })
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality (PDF, etc.)
    console.log('Export functionality coming soon')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-40">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          {/* Center: View Toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('map')}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg
                font-semibold text-sm transition-all duration-200
                ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>
            <button
              onClick={() => setViewMode('itinerary')}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg
                font-semibold text-sm transition-all duration-200
                ${
                  viewMode === 'itinerary'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <List className="w-4 h-4" />
              Itinerary
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 h-screen">
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="map-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full relative"
              >
                {/* Floating Sidebar */}
                {cities.length > 0 && (
                  <FloatingSidebar
                    cities={cities}
                    selectedCity={selectedCity}
                    onCitySelect={setSelectedCity}
                  />
                )}

                {/* Map */}
                <MapView
                  cities={cities}
                  selectedCity={selectedCity}
                  onCitySelect={setSelectedCity}
                />
              </motion.div>
            ) : (
              <motion.div
                key="itinerary-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <ItineraryView
                  itinerary={itinerary}
                  onActivityClick={handleActivityClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  )
}
