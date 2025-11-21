import { motion } from 'framer-motion'
import { Clock, TrendingUp } from 'lucide-react'

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

interface ActivityCardProps {
  activity: Activity
  onClick?: () => void
  delay?: number
}

const difficultyConfig = {
  easy: {
    label: 'Easy',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  moderate: {
    label: 'Moderate',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  challenging: {
    label: 'Challenging',
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  }
}

export function ActivityCard({ activity, onClick, delay = 0 }: ActivityCardProps) {
  const difficultyInfo = activity.difficulty
    ? difficultyConfig[activity.difficulty]
    : null

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
      className="group w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-left transition-all duration-200 hover:border-gray-300"
    >
      {/* Activity Image */}
      {activity.image && (
        <div className="relative w-full h-32 overflow-hidden bg-gray-100">
          <motion.img
            src={activity.image}
            alt={activity.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Difficulty Badge */}
          {difficultyInfo && (
            <div className="absolute top-2 right-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${difficultyInfo.bgColor} ${difficultyInfo.color}`}
              >
                <TrendingUp className="w-3 h-3" />
                {difficultyInfo.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Activity Content */}
      <div className="p-4">
        {/* Activity Name */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {activity.name}
        </h3>

        {/* Activity Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
          {activity.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">
                {activity.duration < 60
                  ? `${activity.duration}min`
                  : `${Math.floor(activity.duration / 60)}h ${activity.duration % 60}min`}
              </span>
            </div>
          )}

          {activity.price && (
            <div className="flex items-center">
              <span className="font-semibold">{activity.price}</span>
            </div>
          )}
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
