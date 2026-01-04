import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar } from 'lucide-react'
import { fetchCityImage } from '../../services/cityImages'

interface Activity {
  name?: string
  activity?: string
  difficulty?: number
}

interface City {
  name: string
  city?: string  // New format from RouteDiscoveryAgentV2
  country?: string
  nights?: number  // Number of nights allocated to this city (optional for user-added/alternative cities)
  activities?: (string | Activity)[]
  image?: string
  imageUrl?: string
  description?: string
}

interface CityCardProps {
  city: City
  index: number
  themeColor: string
  showThemeBadges?: boolean
  themes?: string[]
  onClick?: () => void
}

const themeNames: Record<string, string> = {
  adventure: 'Adventure',
  culture: 'Culture',
  food: 'Food',
  'hidden-gems': 'Hidden Gems'
}

export function CityCard({ city, index, showThemeBadges = false, themes = [], onClick }: CityCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(city.image || city.imageUrl || null)
  const [loading, setLoading] = useState(!city.image && !city.imageUrl)
  const [showFallback, setShowFallback] = useState(false)

  // Handle both old format (name) and new format (city)
  const cityName = city.name || city.city || 'Unknown'

  // Handle both activities and highlights fields
  const cityActivities: (string | Activity)[] = city.activities || (city as any).highlights || []
  const cityDescription: string = city.description || (city as any).why || ''

  useEffect(() => {
    // If we don't have an image, fetch using smart fallback chain
    if (!city.image && !city.imageUrl && cityName && cityName !== 'Unknown') {
      let mounted = true

      fetchCityImage(cityName, city.country).then((url) => {
        if (mounted) {
          if (url) {
            setImageUrl(url)
          } else {
            setShowFallback(true)
          }
          setLoading(false)
        }
      })

      return () => {
        mounted = false
      }
    }
  }, [cityName, city.image, city.imageUrl, city.country])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className="group overflow-hidden rounded-2xl bg-white border border-gray-200 transition-all duration-300 ease-smooth hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    >
      {/* City Image */}
      <div className="relative h-56 w-full overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-gray-900" />
          </div>
        ) : imageUrl && !showFallback ? (
          <>
            <img
              src={imageUrl}
              alt={cityName}
              className="h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-105"
              onError={() => setShowFallback(true)}
            />
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* City Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-xl font-bold text-gray-900 tracking-tight">
            {cityName}
          </h4>

          {/* Duration Badge */}
          {city.nights !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">
              <Calendar className="h-3.5 w-3.5" />
              <span>{city.nights}n</span>
            </div>
          )}
        </div>

        {/* Theme Badges for Best Overall */}
        {showThemeBadges && themes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {themes.map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700"
              >
                {themeNames[theme] || theme}
              </span>
            ))}
          </div>
        )}

        {cityDescription && (
          <p className="mb-4 text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {cityDescription}
          </p>
        )}

        {cityActivities && cityActivities.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Highlights
            </p>
            <ul className="space-y-2">
              {cityActivities.filter(a => a).slice(0, 3).map((activity, actIndex) => {
                const activityText = typeof activity === 'string'
                  ? activity
                  : (activity as Activity).name || (activity as Activity).activity || 'Activity'

                return (
                  <li
                    key={actIndex}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-900" />
                    <span className="leading-relaxed">{activityText}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}
