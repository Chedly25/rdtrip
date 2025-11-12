import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  Users,
  Copy,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Award,
  Mountain
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { RouteDetailResponse } from '../types'

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700 border-green-300',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  challenging: 'bg-red-100 text-red-700 border-red-300'
}

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging'
}

export default function RouteDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuth()

  const [data, setData] = useState<RouteDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchRouteDetail()
    }
  }, [slug])

  const fetchRouteDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/marketplace/routes/${slug}`, { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch route details')
      }

      const routeData: RouteDetailResponse = await response.json()
      setData(routeData)
    } catch (err) {
      console.error('Error fetching route detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to load route')
    } finally {
      setLoading(false)
    }
  }

  const handleClone = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      setCloning(true)

      const response = await fetch(`/api/marketplace/routes/${slug}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to clone route')
      }

      const result = await response.json()

      // Navigate to the cloned route in spotlight view
      navigate(`/spotlight/${result.clonedRouteId}`)
    } catch (err) {
      console.error('Error cloning route:', err)
      alert('Failed to clone route. Please try again.')
    } finally {
      setCloning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading route details...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Failed to load route</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  const { route, reviews, isClonedByUser } = data

  const formatDuration = (days: number) => {
    if (days === 1) return '1 day'
    if (days <= 7) return `${days} days`
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    if (remainingDays === 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    return `${weeks}w ${remainingDays}d`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Cover Image */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-purple-600">
        {route.coverImageUrl ? (
          <>
            <img
              src={route.coverImageUrl}
              alt={route.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-32 w-32 text-white opacity-30" />
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/marketplace')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Marketplace</span>
        </button>

        {/* Badges */}
        <div className="absolute top-6 right-6 flex gap-2">
          {route.featured && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg">
              <Award className="h-4 w-4" />
              Featured
            </div>
          )}
          {route.isPremium && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg">
              <Star className="h-4 w-4" />
              Premium
            </div>
          )}
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              {route.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 text-white/90"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{route.citiesVisited.length} cities</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{formatDuration(route.durationDays)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="h-5 w-5" />
                <span>{DIFFICULTY_LABELS[route.difficultyLevel]}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Route</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {route.description}
              </p>
            </div>

            {/* Cities */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cities on This Route</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {route.citiesVisited.map((city, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {route.rating > 0 ? route.rating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-gray-600">
                    ({route.reviewCount} {route.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No reviews yet. Be the first to review this route!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {review.userAvatar ? (
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {review.userName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{review.userName}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <p className="font-semibold text-gray-900 mb-1">{review.title}</p>
                      )}
                      <p className="text-gray-700">{review.comment}</p>
                      {review.traveledWith && (
                        <p className="text-sm text-gray-500 mt-2">
                          Traveled with: <span className="capitalize">{review.traveledWith}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Clone CTA */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <button
                  onClick={handleClone}
                  disabled={cloning || isClonedByUser}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    isClonedByUser
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-1'
                  }`}
                >
                  {cloning ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Cloning...
                    </>
                  ) : isClonedByUser ? (
                    <>
                      <Copy className="h-5 w-5" />
                      Already Cloned
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Use This Route
                    </>
                  )}
                </button>
                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Sign in to clone this route
                  </p>
                )}
              </div>

              {/* Route Details */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-900 mb-4">Route Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(route.durationDays)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Distance</span>
                    <span className="font-semibold text-gray-900">
                      {route.totalDistanceKm.toFixed(0)} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Countries</span>
                    <span className="font-semibold text-gray-900">
                      {route.countriesVisited.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Difficulty</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${DIFFICULTY_COLORS[route.difficultyLevel]}`}>
                      {DIFFICULTY_LABELS[route.difficultyLevel]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Best Season</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {route.bestSeason?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Style</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {route.primaryStyle?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-900 mb-4">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Views</span>
                    <span className="ml-auto font-semibold text-gray-900">
                      {route.viewCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Times Used</span>
                    <span className="ml-auto font-semibold text-gray-900">
                      {route.cloneCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-600">Rating</span>
                    <span className="ml-auto font-semibold text-gray-900">
                      {route.rating > 0 ? route.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Author */}
              {route.authorName && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Created By</h3>
                  <div className="flex items-center gap-3">
                    {route.authorAvatar ? (
                      <img
                        src={route.authorAvatar}
                        alt={route.authorName}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
                        {route.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{route.authorName}</p>
                      <p className="text-sm text-gray-600">Route Creator</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
