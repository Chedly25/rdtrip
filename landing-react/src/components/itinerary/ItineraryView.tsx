import { motion } from 'framer-motion'
import { Calendar, MapPin, Sunrise, Sun, Sunset, Moon } from 'lucide-react'
import { ActivityCard } from './ActivityCard'
import { RestaurantCard } from './RestaurantCard'

interface Activity {
  id: string
  name: string
  type: 'activity' | 'restaurant' | 'scenic'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  duration?: number // in minutes
  image?: string
  description?: string
  price?: string
  rating?: number
  difficulty?: 'easy' | 'moderate' | 'challenging'
  coordinates?: [number, number]
}

interface DayPlan {
  day: number
  date?: string
  city: string
  activities: Activity[]
}

interface ItineraryViewProps {
  itinerary: DayPlan[]
  onActivityClick?: (activity: Activity) => void
  className?: string
}

const timeOfDayConfig = {
  morning: {
    icon: Sunrise,
    label: 'Morning',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  afternoon: {
    icon: Sun,
    label: 'Afternoon',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  evening: {
    icon: Sunset,
    label: 'Evening',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  night: {
    icon: Moon,
    label: 'Night',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
}

export function ItineraryView({
  itinerary,
  onActivityClick,
  className = ''
}: ItineraryViewProps) {
  // Group activities by time of day
  const groupActivitiesByTime = (activities: Activity[]) => {
    const grouped: Record<string, Activity[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: []
    }

    activities.forEach((activity) => {
      grouped[activity.timeOfDay]?.push(activity)
    })

    return grouped
  }

  return (
    <div className={`max-w-4xl mx-auto py-12 px-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Your Itinerary
        </h1>
        <p className="text-lg text-gray-600">
          {itinerary.length} {itinerary.length === 1 ? 'day' : 'days'} of adventure
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="space-y-16">
        {itinerary.map((day, dayIndex) => {
          const groupedActivities = groupActivitiesByTime(day.activities)

          return (
            <motion.div
              key={`day-${day.day}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
              className="relative"
            >
              {/* Timeline Line */}
              {dayIndex < itinerary.length - 1 && (
                <div className="absolute left-8 top-24 bottom-[-4rem] w-0.5 bg-gray-200" />
              )}

              {/* Day Header */}
              <div className="flex items-center gap-4 mb-8">
                {/* Day Number Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: dayIndex * 0.1 + 0.1,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  className="relative z-10 flex-shrink-0 w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-white text-xl font-bold">{day.day}</span>
                </motion.div>

                {/* Day Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    {day.date && (
                      <span className="text-sm text-gray-600 font-medium">
                        {day.date}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-900" />
                    <h2 className="text-2xl font-bold text-gray-900">{day.city}</h2>
                  </div>
                </div>
              </div>

              {/* Activities by Time of Day */}
              <div className="ml-24 space-y-8">
                {Object.entries(groupedActivities).map(
                  ([timeOfDay, activities]) => {
                    if (activities.length === 0) return null

                    const config =
                      timeOfDayConfig[timeOfDay as keyof typeof timeOfDayConfig]
                    const Icon = config.icon

                    return (
                      <div key={`${day.day}-${timeOfDay}`}>
                        {/* Time of Day Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className={`p-2 rounded-lg ${config.bgColor}`}
                          >
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            {config.label}
                          </span>
                        </div>

                        {/* Activity Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activities.map((activity, actIndex) => {
                            if (activity.type === 'restaurant') {
                              return (
                                <RestaurantCard
                                  key={activity.id}
                                  activity={activity}
                                  onClick={() => onActivityClick?.(activity)}
                                  delay={actIndex * 0.05}
                                />
                              )
                            }

                            return (
                              <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onClick={() => onActivityClick?.(activity)}
                                delay={actIndex * 0.05}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
