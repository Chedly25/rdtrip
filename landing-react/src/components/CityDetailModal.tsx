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
  ShieldAlert,
  ExternalLink,
  Globe,
  Ticket,
  Navigation,
  BookmarkPlus,
  TrendingUp,
  Award,
  Users,
  MessageCircle
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
    imageUrl?: string
    website?: string
    googleMapsUrl?: string
    address?: string
    reviewCount?: number
    tripAdvisorRating?: number
    badges?: string[]
  }>
  accommodations: Array<{
    areaName: string
    description: string
    priceFrom: string
    bestFor: string
    imageUrl?: string
    bookingUrl?: string
    hotelExample?: string
    rating?: number
    reviewCount?: number
    badges?: string[]
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
    imageUrl?: string
    website?: string
    ticketUrl?: string
    dates?: string
    popularity?: string
    badges?: string[]
  }>
  localTips: string[]
  warnings: string[]
  weatherOverview: string
  coordinates: {
    latitude: number
    longitude: number
  } | null
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cityDetails.restaurants.map((restaurant, index) => (
                            <div
                              key={index}
                              className="group overflow-hidden bg-white border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all"
                            >
                              {/* Restaurant Image */}
                              {restaurant.imageUrl && (
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={restaurant.imageUrl}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(restaurant.name + ' food ' + restaurant.cuisine)}`
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-bold text-gray-900">{restaurant.rating}</span>
                                  </div>
                                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                                    <span className="text-xs font-bold text-gray-900">{restaurant.priceRange}</span>
                                  </div>
                                </div>
                              )}

                              <div className="p-4">
                                <h5 className="font-bold text-gray-900 mb-1">{restaurant.name}</h5>
                                <p className="text-xs text-gray-500 mb-2">{restaurant.cuisine}</p>

                                {/* Social Proof */}
                                <div className="flex items-center gap-3 mb-2">
                                  {restaurant.reviewCount && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <MessageCircle className="w-3 h-3" />
                                      <span>{restaurant.reviewCount.toLocaleString()} reviews</span>
                                    </div>
                                  )}
                                  {restaurant.tripAdvisorRating && (
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                      <Award className="w-3 h-3" />
                                      <span className="font-medium">{restaurant.tripAdvisorRating} TripAdvisor</span>
                                    </div>
                                  )}
                                </div>

                                {/* Badges */}
                                {restaurant.badges && restaurant.badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {restaurant.badges.map((badge, badgeIndex) => (
                                      <span
                                        key={badgeIndex}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full"
                                      >
                                        {badge === 'Trending' && <TrendingUp className="w-3 h-3" />}
                                        {badge === 'Popular' && <Users className="w-3 h-3" />}
                                        {badge === 'Michelin Guide' && <Award className="w-3 h-3" />}
                                        {badge}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{restaurant.description}</p>

                                {restaurant.specialty && (
                                  <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                    <p className="text-xs font-medium text-amber-900">
                                      <span className="font-bold">Specialty:</span> {restaurant.specialty}
                                    </p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mb-2">
                                  {restaurant.googleMapsUrl && (
                                    <a
                                      href={restaurant.googleMapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <Navigation className="w-3 h-3" />
                                      Directions
                                    </a>
                                  )}
                                  {restaurant.website && (
                                    <a
                                      href={restaurant.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <Globe className="w-3 h-3" />
                                      Website
                                    </a>
                                  )}
                                </div>

                                {/* Add to Itinerary Button */}
                                <button
                                  onClick={() => alert(`Adding "${restaurant.name}" to your itinerary...`)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                >
                                  <BookmarkPlus className="w-3 h-3" />
                                  Add to Itinerary
                                </button>

                                {restaurant.address && (
                                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {restaurant.address}
                                  </p>
                                )}
                              </div>
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
                              className="group overflow-hidden bg-white border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all"
                            >
                              {/* Accommodation Image */}
                              {accommodation.imageUrl && (
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={accommodation.imageUrl}
                                    alt={accommodation.areaName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(accommodation.areaName + ' ' + cityDetails.cityName + ' hotels')}`
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full">
                                    <span className="text-xs font-bold text-white flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {accommodation.priceFrom}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="p-4">
                                <h5 className="font-bold text-gray-900 mb-2">{accommodation.areaName}</h5>

                                {/* Social Proof */}
                                <div className="flex items-center gap-3 mb-2">
                                  {accommodation.rating && (
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                      <Star className="w-3 h-3 fill-green-600" />
                                      <span className="font-bold">{accommodation.rating}/10</span>
                                    </div>
                                  )}
                                  {accommodation.reviewCount && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <MessageCircle className="w-3 h-3" />
                                      <span>{accommodation.reviewCount.toLocaleString()} reviews</span>
                                    </div>
                                  )}
                                </div>

                                {/* Badges */}
                                {accommodation.badges && accommodation.badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {accommodation.badges.map((badge, badgeIndex) => (
                                      <span
                                        key={badgeIndex}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                      >
                                        {badge === 'Popular' && <Users className="w-3 h-3" />}
                                        {badge === 'Great Value' && <DollarSign className="w-3 h-3" />}
                                        {badge === 'Best Location' && <MapPin className="w-3 h-3" />}
                                        {badge}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{accommodation.description}</p>

                                <div
                                  className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                                  style={{
                                    backgroundColor: `${themeColor}20`,
                                    color: themeColor
                                  }}
                                >
                                  {accommodation.bestFor}
                                </div>

                                {accommodation.hotelExample && (
                                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                    <Hotel className="w-3 h-3" />
                                    Try: {accommodation.hotelExample}
                                  </p>
                                )}

                                {/* Action Button */}
                                {accommodation.bookingUrl && (
                                  <a
                                    href={accommodation.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center px-4 py-2 mb-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                                  >
                                    <span className="flex items-center justify-center gap-2">
                                      <ExternalLink className="w-4 h-4" />
                                      Check Availability
                                    </span>
                                  </a>
                                )}

                                {/* Add to Itinerary Button */}
                                <button
                                  onClick={() => alert(`Adding "${accommodation.areaName}" to your itinerary...`)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                >
                                  <BookmarkPlus className="w-3 h-3" />
                                  Add to Itinerary
                                </button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cityDetails.eventsFestivals.map((event, index) => (
                            <div
                              key={index}
                              className="group overflow-hidden bg-white border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all"
                            >
                              {/* Event Image */}
                              {event.imageUrl && (
                                <div className="relative h-40 overflow-hidden">
                                  <img
                                    src={event.imageUrl}
                                    alt={event.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(event.name + ' festival ' + cityDetails.cityName)}`
                                    }}
                                  />
                                  {(event.month || event.dates) && (
                                    <div className="absolute top-2 right-2 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full">
                                      <span className="text-xs font-bold text-white flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {event.dates || event.month}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="p-4">
                                <h5 className="font-bold text-gray-900 mb-2">{event.name}</h5>

                                {/* Badges */}
                                {event.badges && event.badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {event.badges.map((badge, badgeIndex) => (
                                      <span
                                        key={badgeIndex}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                                      >
                                        {badge === 'Trending' && <TrendingUp className="w-3 h-3" />}
                                        {badge === 'Sold Out Often' && <Users className="w-3 h-3" />}
                                        {badge === 'Annual Tradition' && <Award className="w-3 h-3" />}
                                        {badge}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{event.description}</p>

                                {/* Popularity */}
                                {event.popularity && (
                                  <div className="mb-3 flex items-center gap-1 text-xs text-purple-600">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="font-medium">{event.popularity} Popularity</span>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mb-2">
                                  {event.ticketUrl && (
                                    <a
                                      href={event.ticketUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <Ticket className="w-3 h-3" />
                                      Get Tickets
                                    </a>
                                  )}
                                  {event.website && (
                                    <a
                                      href={event.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <Globe className="w-3 h-3" />
                                      Learn More
                                    </a>
                                  )}
                                </div>

                                {/* Add to Itinerary Button */}
                                <button
                                  onClick={() => alert(`Adding "${event.name}" to your itinerary...`)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                >
                                  <BookmarkPlus className="w-3 h-3" />
                                  Add to Itinerary
                                </button>
                              </div>
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
