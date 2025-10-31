import { motion } from 'framer-motion'
import { GlassCard } from '../ui/GlassCard'
import { Clock, Heart, Sparkles, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import type { Waypoint } from '../../types'

interface CityCardNewProps {
  city: Waypoint
  index: number
  onSwap?: () => void
  onDelete?: () => void
  isAlternative?: boolean
}

export function CityCardNew({
  city,
  index,
  onSwap,
  isAlternative = false
}: CityCardNewProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Calculate card height based on content
  const hasImage = Boolean(city.imageUrl)
  const activityCount = city.activities?.length || 0
  const shouldBeTall = hasImage && activityCount > 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <GlassCard className="group overflow-hidden">
        {/* Image Section - Variable Height */}
        {city.imageUrl && (
          <div className={`
            relative overflow-hidden
            ${shouldBeTall ? 'h-64' : 'h-48'}
          `}>
            {/* Skeleton while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* Actual Image */}
            <img
              src={city.imageUrl}
              alt={city.name}
              className={`
                w-full h-full object-cover
                transition-all duration-700
                ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}
                group-hover:scale-110
              `}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Quick Actions - Top Right */}
            <div className="absolute top-3 right-3 flex gap-2">
              <motion.button
                className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                />
              </motion.button>

              {onSwap && (
                <motion.button
                  className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onSwap}
                >
                  <ArrowUpDown className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </div>

            {/* City Name Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-2xl font-bold text-white mb-1">
                {city.name}
              </h3>
              {city.duration && (
                <div className="flex items-center gap-2 text-white/90">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{city.duration}</span>
                </div>
              )}
            </div>

            {/* Order Badge */}
            {!isAlternative && (
              <div className="absolute top-3 left-3">
                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center font-bold text-gray-900">
                  {index + 1}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-5">
          {/* If no image, show title here */}
          {!city.imageUrl && (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {city.name}
              </h3>
              {city.duration && (
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{city.duration}</span>
                </div>
              )}
            </>
          )}

          {/* Activities */}
          {city.activities && city.activities.length > 0 && (
            <div className="space-y-2">
              {city.activities.slice(0, isAlternative ? 2 : 3).map((activity, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + i * 0.03 }}
                >
                  <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 line-clamp-2">
                    {activity}
                  </span>
                </motion.div>
              ))}

              {city.activities.length > 3 && !isAlternative && (
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  +{city.activities.length - 3} more
                </button>
              )}
            </div>
          )}

          {/* Alternative Badge */}
          {isAlternative && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Alternative
              </span>
              <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                Swap →
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
