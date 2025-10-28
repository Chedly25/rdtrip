import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MapPin,
  Clock,
  Star,
  AlertTriangle,
  Plus,
  UtensilsCrossed,
  Hotel,
  DollarSign,
  ParkingCircle,
  Lightbulb,
  Calendar,
  CloudSun,
  PartyPopper,
  ShieldAlert
} from 'lucide-react'

interface CityDetail {
  cityName: string
  country: string
  tagline: string
  mainImageUrl: string | null
  rating: number
  recommendedDuration: string
  whyVisit: string
  bestFor: string[]
  highlights: Array<{
    name: string
    description: string
    duration: string
    rating: number
    type: string
  }>
  restaurants: Array<{
    name: string
    cuisine: string
    priceRange: string
    description: string
    rating: number
    specialty: string
  }>
  accommodations: Array<{
    areaName: string
    description: string
    priceFrom: string
    bestFor: string
  }>
  parking: {
    info: string
    difficulty: string
  } | null
  environmentalZones: {
    hasRestrictions: boolean
    type: string
    description: string
    advice: string
  } | null
  bestTimeToVisit: {
    ideal: string
    reasoning: string
    avoid: string
  } | null
  eventsFestivals: Array<{
    name: string
    month: string
    description: string
  }>
  localTips: string[]
  warnings: string[]
  weatherOverview: string
  coordinates: {
    latitude: number
    longitude: number
  } | null
}

interface RouteImpact {
  distanceDelta: number
  timeDelta: number
  optimalPosition: number
  original: {
    distance: number
    time: number
  }
  new: {
    distance: number
    time: number
  }
}

interface CityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cityName: string
  country?: string
  onAddToRoute?: () => void
  themeColor?: string
  currentRoute?: {
    waypoints: Array<{
      name: string
      latitude: number
      longitude: number
    }>
  }
}

export default function CityDetailModal({
  isOpen,
  onClose,
  cityName,
  country,
  onAddToRoute,
  themeColor = '#055948'
}: CityDetailModalProps) {
  const [cityDetails, setCityDetails] = useState<CityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && cityName) {
      fetchCityDetails()
    }
  }, [isOpen, cityName])

  const fetchCityDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('https://rdtrip-4d4035861576.herokuapp.com/api/cities/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cityName, country })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load city details')
      }

      setCityDetails(result.data)
    } catch (err: any) {
      console.error('Error fetching city details:', err)
      setError(err.message || 'Failed to load city information')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">{rating}</span>
      </div>
    )
  }

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-[101] flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col">
              {/* Header - Fixed */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
                style={{ borderBottomColor: `${themeColor}20` }}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" style={{ color: themeColor }} />
                  <h2 className="text-xl font-bold text-gray-900">
                    {loading ? 'Loading...' : cityName}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: `${themeColor}40`, borderTopColor: 'transparent' }}
                      />
                      <p className="text-gray-600">Loading city details...</p>
                      <p className="text-sm text-gray-400 mt-2">
                        This may take a few seconds
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center max-w-md px-6">
                      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-900 font-medium mb-2">Failed to load city details</p>
                      <p className="text-gray-600 text-sm">{error}</p>
                      <button
                        onClick={fetchCityDetails}
                        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {!loading && !error && cityDetails && (
                  <div className="p-6 space-y-8">
                    {/* Hero Section */}
                    <div className="space-y-4">
                      {/* Hero Image */}
                      {cityDetails.mainImageUrl ? (
                        <div className="relative h-64 rounded-xl overflow-hidden">
                          <img
                            src={cityDetails.mainImageUrl}
                            alt={cityDetails.cityName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="relative h-64 rounded-xl overflow-hidden flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}40 100%)`
                          }}
                        >
                          <div className="text-center">
                            <MapPin className="w-16 h-16 mx-auto mb-2" style={{ color: themeColor }} />
                            <p className="text-2xl font-bold text-gray-800">{cityDetails.cityName}</p>
                          </div>
                        </div>
                      )}

                      {/* Tagline and Quick Stats */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{cityDetails.cityName}</h3>
                          <p className="text-lg text-gray-600 italic">{cityDetails.tagline}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {cityDetails.recommendedDuration}
                            </span>
                          </div>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            {renderStars(cityDetails.rating)}
                          </div>
                        </div>
                      </div>

                      {/* Best For Tags */}
                      {cityDetails.bestFor && cityDetails.bestFor.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {cityDetails.bestFor.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: `${themeColor}15`,
                                color: themeColor
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Why Visit Section */}
                    <div
                      className="p-6 rounded-xl"
                      style={{ backgroundColor: `${themeColor}08` }}
                    >
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Why Visit {cityDetails.cityName}?</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {cityDetails.whyVisit}
                      </p>
                    </div>

                    {/* Environmental Zones Warning (if applicable) */}
                    {cityDetails.environmentalZones?.hasRestrictions && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-amber-900 mb-1">
                              {cityDetails.environmentalZones.type}
                            </h5>
                            <p className="text-sm text-amber-800 mb-2">
                              {cityDetails.environmentalZones.description}
                            </p>
                            <p className="text-sm text-amber-700 font-medium">
                              💡 {cityDetails.environmentalZones.advice}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Highlights */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">
                        Top Highlights ({cityDetails.highlights.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cityDetails.highlights.map((highlight, index) => (
                          <div
                            key={index}
                            className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 flex-1">{highlight.name}</h5>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium text-gray-600">{highlight.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{highlight.description}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className="px-2 py-1 rounded-full font-medium capitalize"
                                style={{
                                  backgroundColor: `${themeColor}10`,
                                  color: themeColor
                                }}
                              >
                                {highlight.type}
                              </span>
                              <span className="text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {highlight.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restaurants Section */}
                    {cityDetails.restaurants && cityDetails.restaurants.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <UtensilsCrossed className="w-5 h-5" style={{ color: themeColor }} />
                          <h4 className="text-lg font-bold text-gray-900">
                            Where to Eat ({cityDetails.restaurants.length})
                          </h4>
                        </div>
                        <div className="space-y-4">
                          {cityDetails.restaurants.map((restaurant, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h5>
                                  <p className="text-xs text-gray-500">{restaurant.cuisine}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-medium text-gray-600">{restaurant.rating}</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{restaurant.priceRange}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{restaurant.description}</p>
                              {restaurant.specialty && (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="font-medium text-gray-500">Specialty:</span>
                                  <span className="text-gray-700">{restaurant.specialty}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accommodations Section */}
                    {cityDetails.accommodations && cityDetails.accommodations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Hotel className="w-5 h-5" style={{ color: themeColor }} />
                          <h4 className="text-lg font-bold text-gray-900">
                            Where to Stay ({cityDetails.accommodations.length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cityDetails.accommodations.map((accommodation, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-gray-900 flex-1">{accommodation.areaName}</h5>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                  <span className="text-xs font-medium text-gray-700">{accommodation.priceFrom}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{accommodation.description}</p>
                              <div
                                className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${themeColor}10`,
                                  color: themeColor
                                }}
                              >
                                {accommodation.bestFor}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parking Information */}
                    {cityDetails.parking && (
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <ParkingCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-blue-900">Parking Information</h5>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                cityDetails.parking.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                cityDetails.parking.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {cityDetails.parking.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-blue-800">{cityDetails.parking.info}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Local Tips - Good to Know */}
                    {cityDetails.localTips && cityDetails.localTips.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="w-5 h-5" style={{ color: themeColor }} />
                          <h4 className="text-lg font-bold text-gray-900">
                            Good to Know ({cityDetails.localTips.length} tips)
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cityDetails.localTips.map((tip, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-white border-2 border-gray-100 rounded-lg"
                            >
                              <span className="text-lg flex-shrink-0">💡</span>
                              <p className="text-sm text-gray-700">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Time to Visit */}
                    {cityDetails.bestTimeToVisit && (
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-bold text-green-900 mb-2">Best Time to Visit</h5>
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs font-semibold text-green-700 uppercase">Ideal Period</span>
                                <p className="text-sm text-green-800">{cityDetails.bestTimeToVisit.ideal}</p>
                              </div>
                              {cityDetails.bestTimeToVisit.reasoning && (
                                <p className="text-sm text-green-700">{cityDetails.bestTimeToVisit.reasoning}</p>
                              )}
                              {cityDetails.bestTimeToVisit.avoid && (
                                <div>
                                  <span className="text-xs font-semibold text-green-700 uppercase">Avoid</span>
                                  <p className="text-sm text-green-800">{cityDetails.bestTimeToVisit.avoid}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Weather Overview */}
                    {cityDetails.weatherOverview && (
                      <div className="p-4 bg-sky-50 border-2 border-sky-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <CloudSun className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-bold text-sky-900 mb-2">Weather Overview</h5>
                            <p className="text-sm text-sky-800">{cityDetails.weatherOverview}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Events & Festivals */}
                    {cityDetails.eventsFestivals && cityDetails.eventsFestivals.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <PartyPopper className="w-5 h-5" style={{ color: themeColor }} />
                          <h4 className="text-lg font-bold text-gray-900">
                            Events & Festivals ({cityDetails.eventsFestivals.length})
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {cityDetails.eventsFestivals.map((event, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-gray-900 flex-1">{event.name}</h5>
                                {event.month && (
                                  <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2"
                                        style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                                    {event.month}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {cityDetails.warnings && cityDetails.warnings.length > 0 && (
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-bold text-red-900 mb-3">Important Warnings</h5>
                            <ul className="space-y-2">
                              {cityDetails.warnings.map((warning, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-600 mt-0.5">⚠️</span>
                                  <span className="text-sm text-red-800">{warning}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - Fixed Actions */}
              {!loading && !error && cityDetails && onAddToRoute && (
                <div
                  className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0"
                  style={{ borderTopColor: `${themeColor}20` }}
                >
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onAddToRoute()
                      onClose()
                    }}
                    className="px-6 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg flex items-center gap-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus className="w-4 h-4" />
                    Add to My Route
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
