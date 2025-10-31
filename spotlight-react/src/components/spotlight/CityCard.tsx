import { motion } from 'framer-motion'
import { MapPin, Trash2, GripVertical, Eye } from 'lucide-react'
import { useState } from 'react'
import type { Waypoint } from '../../types'
import { cn } from '../../lib/utils'
import { GlassCard } from '../ui/GlassCard'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

interface CityCardProps {
  waypoint: Waypoint
  onRemove?: (id: string) => void
  onClick?: () => void
  isDragging?: boolean
  index?: number
}

export function CityCard({ waypoint, onRemove, onClick, isDragging, index }: CityCardProps) {
  const { name, activities, imageUrl, isLandmark } = waypoint
  const { routeData } = useRouteDataStore()
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const activitiesToShow = activities?.slice(0, 3) || []
  const remainingCount = (activities?.length || 0) - 3

  return (
    <GlassCard
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      className={cn(
        'group relative overflow-hidden',
        isDragging && 'shadow-2xl ring-4'
      )}
      style={isDragging ? { borderColor: theme.primary } : undefined}
    >
      {/* Horizontal Layout Container */}
      <div className="flex h-44 -m-px" style={{ border: '2px solid blue' }}>
        {/* Left: Image Section (176px + 2px for borders = 178px actual) - DEBUG WITH RED BG */}
        <div
          className="relative w-44 h-44 flex-shrink-0 overflow-hidden rounded-tl-2xl rounded-bl-2xl"
          style={{ backgroundColor: 'red' }}
          ref={(el) => {
            if (el) {
              console.log(`🔍 [DEBUG ${name}] Container dimensions:`, {
                width: el.offsetWidth,
                height: el.offsetHeight,
                computedWidth: window.getComputedStyle(el).width,
                computedHeight: window.getComputedStyle(el).height
              })
            }
          }}
        >
          {imageUrl ? (
            <>
              {/* Loading Skeleton */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              )}

              {/* Actual Image - Using div wrapper for motion, img inside for proper object-fit */}
              <motion.div
                className="absolute inset-0"
                whileHover={{ scale: imageError ? 1 : 1.05 }}
                transition={{ duration: 0.4 }}
                style={{ border: '3px solid yellow' }}
              >
                <img
                  src={imageUrl}
                  alt={name}
                  className={cn(
                    "transition-opacity duration-500",
                    imageLoading ? "opacity-0" : "opacity-100"
                  )}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onLoad={(e) => {
                    console.log(`🖼️ [DEBUG ${name}] Image loaded:`, {
                      imageUrl,
                      naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                      naturalHeight: (e.target as HTMLImageElement).naturalHeight,
                      displayWidth: (e.target as HTMLImageElement).width,
                      displayHeight: (e.target as HTMLImageElement).height,
                      computedWidth: window.getComputedStyle(e.target as HTMLImageElement).width,
                      computedHeight: window.getComputedStyle(e.target as HTMLImageElement).height,
                      objectFit: window.getComputedStyle(e.target as HTMLImageElement).objectFit
                    })
                    setImageLoading(false)
                  }}
                  onError={() => {
                    console.error(`❌ [DEBUG ${name}] Failed to load image:`, imageUrl)
                    setImageError(true)
                    setImageLoading(false)
                  }}
                />
              </motion.div>

              {/* Error State - show gradient fallback */}
              {imageError && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`
                  }}
                >
                  <MapPin className="h-12 w-12 text-white/50" />
                </div>
              )}
            </>
          ) : (
            // No image URL - show gradient
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`
              }}
            >
              <MapPin className="h-12 w-12 text-white/50" />
            </div>
          )}

          {/* Order Badge */}
          {index !== undefined && (
            <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 font-bold text-gray-900 shadow-lg backdrop-blur-sm">
              {index + 1}
            </div>
          )}

          {/* Landmark Badge */}
          {isLandmark && (
            <div className="absolute bottom-3 left-3 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white shadow-lg">
              ⭐
            </div>
          )}
        </div>

        {/* Right: Content Section */}
        <div className="flex flex-1 flex-col p-4">
          {/* City Name */}
          <h3
            className="mb-3 text-xl font-bold text-gray-900 transition-colors cursor-pointer"
            style={{ color: undefined }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            onClick={onClick}
          >
            {name}
          </h3>

          {/* Activities List */}
          {activitiesToShow.length > 0 && (
            <ul className="flex-1 space-y-1.5">
              {activitiesToShow.map((activity, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <div
                    className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span className="line-clamp-1">{activity}</span>
                </motion.li>
              ))}
            </ul>
          )}

          {/* Show More + View Details */}
          <div className="mt-2 flex items-center justify-between">
            {remainingCount > 0 && (
              <button
                onClick={onClick}
                className="text-xs font-medium transition-colors hover:underline"
                style={{ color: theme.primary }}
              >
                +{remainingCount} more
              </button>
            )}

            {onClick && (
              <button
                onClick={onClick}
                className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100"
              >
                <Eye className="h-3 w-3" />
                <span>Details</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drag Handle */}
      <motion.div
        className="absolute right-3 top-3 z-10 cursor-grab rounded-lg bg-white/90 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </motion.div>

      {/* Remove Button */}
      {onRemove && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(waypoint.id)
          }}
          className="absolute right-3 bottom-3 z-10 rounded-lg bg-white/90 p-1.5 opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </motion.button>
      )}
    </GlassCard>
  )
}
