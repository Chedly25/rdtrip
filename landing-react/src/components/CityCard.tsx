import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { getWikipediaImage } from '../utils/wikipedia'

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
}

interface CityCardProps {
  city: City
  index: number
  themeColor: string
  showThemeBadges?: boolean
  themes?: string[]
  onClick?: () => void
}

const themeColors: Record<string, string> = {
  adventure: '#055948',
  culture: '#a87600',
  food: '#650411',
  'hidden-gems': '#081d5b'
}

const themeNames: Record<string, string> = {
  adventure: 'Adventure',
  culture: 'Culture',
  food: 'Food',
  'hidden-gems': 'Hidden Gems'
}

export function CityCard({ city, index, themeColor, showThemeBadges = false, themes = [], onClick }: CityCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(city.image || city.imageUrl || null)
  const [loading, setLoading] = useState(!city.image && !city.imageUrl)
  const [showFallback, setShowFallback] = useState(false)

  // Handle both old format (name) and new format (city)
  const cityName = city.name || city.city || 'Unknown'

  // Handle both activities and highlights fields
  const cityActivities: (string | Activity)[] = city.activities || (city as any).highlights || []
  const cityDescription: string = city.description || (city as any).why || ''

  // DEBUG: Log city data to diagnose highlights issue
  console.log(`🔍 CityCard DEBUG - ${cityName}:`, {
    hasActivities: !!city.activities,
    activitiesType: Array.isArray(city.activities) ? 'array' : typeof city.activities,
    activitiesLength: Array.isArray(city.activities) ? city.activities.length : 0,
    hasHighlights: !!(city as any).highlights,
    highlightsType: Array.isArray((city as any).highlights) ? 'array' : typeof (city as any).highlights,
    highlightsLength: Array.isArray((city as any).highlights) ? (city as any).highlights.length : 0,
    hasDescription: !!city.description,
    hasWhy: !!(city as any).why,
    computedActivitiesLength: cityActivities.length,
    computedDescription: cityDescription.substring(0, 50) + '...',
    rawCity: city
  })

  useEffect(() => {
    // If we don't have an image, fetch from Wikipedia
    if (!city.image && !city.imageUrl && cityName && cityName !== 'Unknown') {
      let mounted = true

      getWikipediaImage(cityName, 800).then((url) => {
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
  }, [cityName, city.image, city.imageUrl])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
    >
      {/* City Image */}
      <div className="relative h-64 w-full overflow-hidden">
        {loading ? (
          <div
            className="flex h-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`
            }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        ) : imageUrl && !showFallback ? (
          <img
            src={imageUrl}
            alt={cityName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setShowFallback(true)}
          />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`
            }}
          >
            <MapPin className="h-16 w-16 text-white/50" />
          </div>
        )}
      </div>

      {/* City Content */}
      <div className="p-6">
        <h4
          className="mb-3 text-2xl font-bold transition-colors"
          style={{ color: themeColor }}
        >
          {cityName}
        </h4>

        {/* Theme Badges for Best Overall */}
        {showThemeBadges && themes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {themes.map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: themeColors[theme] || '#6b7280' }}
              >
                {themeNames[theme] || theme}
              </span>
            ))}
          </div>
        )}

        {cityDescription && (
          <p className="mb-4 text-sm text-gray-600 line-clamp-2">
            {cityDescription}
          </p>
        )}

        {cityActivities && cityActivities.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Highlights
            </p>
            <ul className="space-y-2">
              {cityActivities.slice(0, 3).map((activity, actIndex) => {
                const activityText = typeof activity === 'string'
                  ? activity
                  : (activity as Activity).name || (activity as Activity).activity || 'Activity'

                return (
                  <li
                    key={actIndex}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <div
                      className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                    <span>{activityText}</span>
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
