import { motion } from 'framer-motion'
import { Clock, Star, DollarSign } from 'lucide-react'

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

interface RestaurantCardProps {
  activity: Activity
  onClick?: () => void
  delay?: number
}

export function RestaurantCard({ activity, onClick, delay = 0 }: RestaurantCardProps) {
  // Convert price string to number of dollar signs
  const getPriceLevel = (price?: string): number => {
    if (!price) return 2
    return price.length
  }

  const priceLevel = getPriceLevel(activity.price)

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
      className="group w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-left transition-all duration-200 hover:border-gray-300"
    >
      {/* Restaurant Image */}
      {activity.image && (
        <div className="relative w-full h-32 overflow-hidden bg-gray-100">
          <motion.img
            src={activity.image}
            alt={activity.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Rating Badge */}
          {activity.rating && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 shadow-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {activity.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Restaurant Content */}
      <div className="p-4">
        {/* Restaurant Name */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {activity.name}
        </h3>

        {/* Restaurant Meta */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {activity.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {activity.duration < 60
                    ? `${activity.duration}min`
                    : `${Math.floor(activity.duration / 60)}h`}
                </span>
              </div>
            )}

            {/* Rating Stars */}
            {activity.rating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(activity.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Level */}
          <div className="flex items-center">
            {[...Array(4)].map((_, i) => (
              <DollarSign
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < priceLevel ? 'text-gray-900' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
        )}
      </div>

      {/* Hover Effect Border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  )
}
