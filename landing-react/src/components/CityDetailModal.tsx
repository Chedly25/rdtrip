import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MapPin,
  Clock,
  Star,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { useAsyncCityDetails } from '../hooks/useAsyncCityDetails'

// Traveler type mapping to brand colors and icons
const travelerTypeMapping: Record<string, { color: string; icon: string; label: string }> = {
  'adventure': { color: '#055948', icon: '/images/icons/adventure_icon.png', label: 'Adventure Seekers' },
  'adventurer': { color: '#055948', icon: '/images/icons/adventure_icon.png', label: 'Adventure Seekers' },
  'adventure seeker': { color: '#055948', icon: '/images/icons/adventure_icon.png', label: 'Adventure Seekers' },
  'culture': { color: '#a87600', icon: '/images/icons/culture_icon.png', label: 'Culture Lovers' },
  'history': { color: '#a87600', icon: '/images/icons/culture_icon.png', label: 'History Buffs' },
  'history buff': { color: '#a87600', icon: '/images/icons/culture_icon.png', label: 'History Buffs' },
  'culture lover': { color: '#a87600', icon: '/images/icons/culture_icon.png', label: 'Culture Lovers' },
  'food': { color: '#650411', icon: '/images/icons/food_icon.png', label: 'Food Lovers' },
  'foodie': { color: '#650411', icon: '/images/icons/food_icon.png', label: 'Food Lovers' },
  'food lover': { color: '#650411', icon: '/images/icons/food_icon.png', label: 'Food Lovers' },
  'hidden': { color: '#081d5b', icon: '/images/icons/hidden_gem_icon.png', label: 'Off-the-beaten-path' },
  'hidden gem': { color: '#081d5b', icon: '/images/icons/hidden_gem_icon.png', label: 'Off-the-beaten-path' },
  'offbeat': { color: '#081d5b', icon: '/images/icons/hidden_gem_icon.png', label: 'Off-the-beaten-path' }
}

function parseTravelerType(bestFor: string[]): Array<{ color: string; icon: string; label: string }> {
  const result: Array<{ color: string; icon: string; label: string }> = []
  const seen = new Set<string>()

  for (const item of bestFor) {
    const itemLower = item.toLowerCase().trim()
    for (const [key, value] of Object.entries(travelerTypeMapping)) {
      if (itemLower.includes(key) && !seen.has(value.label)) {
        result.push(value)
        seen.add(value.label)
        break
      }
    }
  }

  return result
}

interface CityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cityName: string
  country?: string
  onAddToRoute?: () => void
  themeColor?: string
}

export default function CityDetailModal({
  isOpen,
  onClose,
  cityName,
  country,
  onAddToRoute,
  themeColor = '#055948'
}: CityDetailModalProps) {
  // Use the async hook - we only need quick data for this preview
  const {
    data: cityDetails,
    quickData,
    loading,
    error,
    progress,
    message,
    retry
  } = useAsyncCityDetails(cityName, country, isOpen)

  // Use whichever data is available (full or quick)
  const displayData = cityDetails || quickData

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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col">
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
                  <div className="flex items-center justify-center min-h-[500px] p-8">
                    <div className="text-center max-w-md w-full">
                      {/* Animated Logo/Icon */}
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="mx-auto mb-6"
                      >
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                          style={{ backgroundColor: `${themeColor}15` }}
                        >
                          <Loader2
                            className="w-10 h-10 animate-spin"
                            style={{ color: themeColor }}
                          />
                        </div>
                      </motion.div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Loading city preview...
                          </span>
                          <span className="text-sm font-bold" style={{ color: themeColor }}>
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: themeColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Rotating Message */}
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={message}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="text-gray-600 text-base"
                        >
                          {message}
                        </motion.p>
                      </AnimatePresence>
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
                        onClick={retry}
                        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {!loading && !error && displayData && (
                  <div className="p-6 space-y-6">
                    {/* Hero Section */}
                    <div className="space-y-4">
                      {/* Hero Image */}
                      {displayData.mainImageUrl ? (
                        <div className="relative h-64 rounded-xl overflow-hidden">
                          <img
                            src={displayData.mainImageUrl}
                            alt={displayData.cityName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide broken image and show gradient fallback
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="absolute inset-0 flex items-center justify-center" style="background: linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}40 100%)">
                                    <div class="text-center">
                                      <div style="color: ${themeColor}; width: 64px; height: 64px; margin: 0 auto 8px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                      </div>
                                      <p class="text-2xl font-bold text-gray-800">${displayData.cityName}</p>
                                    </div>
                                  </div>
                                `
                              }
                            }}
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
                            <p className="text-2xl font-bold text-gray-800">{displayData.cityName}</p>
                          </div>
                        </div>
                      )}

                      {/* Tagline and Quick Stats */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{displayData.cityName}</h3>
                          <p className="text-lg text-gray-600 italic">{displayData.tagline}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {displayData.recommendedDuration}
                            </span>
                          </div>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            {renderStars(displayData.rating)}
                          </div>
                        </div>
                      </div>

                      {/* Best For Tags with Brand Icons */}
                      {displayData.bestFor && displayData.bestFor.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {parseTravelerType(displayData.bestFor).map((travelerType, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                              style={{
                                backgroundColor: `${travelerType.color}15`,
                                color: travelerType.color,
                                border: `2px solid ${travelerType.color}40`
                              }}
                            >
                              <img
                                src={travelerType.icon}
                                alt={travelerType.label}
                                className="w-5 h-5 object-contain"
                                style={{ filter: 'none' }}
                              />
                              {travelerType.label}
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
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Why Visit {displayData.cityName}?</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {displayData.whyVisit}
                      </p>
                    </div>

                    {/* Environmental Zones Warning (if applicable) */}
                    {displayData.environmentalZones?.hasRestrictions && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-amber-900 mb-1">
                              {displayData.environmentalZones.type}
                            </h5>
                            <p className="text-sm text-amber-800 mb-2">
                              {displayData.environmentalZones.description}
                            </p>
                            <p className="text-sm text-amber-700 font-medium">
                              💡 {displayData.environmentalZones.advice}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Highlights */}
                    {displayData.highlights && displayData.highlights.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">
                          Top Highlights ({displayData.highlights.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayData.highlights.map((highlight, index) => (
                            <div
                              key={index}
                              className="group overflow-hidden bg-white border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all"
                            >
                              {/* Highlight with gradient background */}
                              <div className="relative h-40 overflow-hidden" style={{
                                background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}30 100%)`
                              }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Star className="w-16 h-16 opacity-40" style={{ color: themeColor }} />
                                </div>
                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-bold text-gray-900">{highlight.rating}</span>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                                  <span className="text-xs font-medium text-gray-900 capitalize">{highlight.type}</span>
                                </div>
                              </div>

                              <div className="p-4">
                                <h5 className="font-bold text-gray-900 mb-2">{highlight.name}</h5>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{highlight.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {highlight.duration}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings (Important only) */}
                    {displayData.warnings && displayData.warnings.length > 0 && (
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-bold text-red-900 mb-3">Important to Know</h5>
                            <ul className="space-y-2">
                              {displayData.warnings.map((warning, index) => (
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
              {!loading && !error && displayData && onAddToRoute && (
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
