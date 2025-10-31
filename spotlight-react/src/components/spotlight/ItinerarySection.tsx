import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Utensils, Hotel, Clock, ChevronDown, Route } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

export function ItinerarySection() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const { routeData } = useRouteDataStore()
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  const handleGenerate = async () => {
    setIsLoading(true)
    // TODO: Call API to generate itinerary
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasLoaded(true)
  }

  // Mock itinerary data
  const mockItinerary = [
    {
      day: 1,
      location: 'Aix-en-Provence',
      date: 'Monday, May 15',
      activities: [
        { time: '09:00', title: 'Arrive in Aix-en-Provence', description: 'Check into your hotel and freshen up', icon: Hotel },
        { time: '11:00', title: 'Visit Cours Mirabeau', description: 'Stroll along the famous tree-lined avenue', icon: MapPin },
        { time: '13:00', title: 'Lunch at local bistro', description: 'Try authentic Provençal cuisine', icon: Utensils },
        { time: '15:00', title: 'Atelier Cézanne', description: 'Explore the famous painter\'s studio', icon: MapPin },
        { time: '19:00', title: 'Dinner', description: 'Enjoy dinner in the old town', icon: Utensils },
      ],
    },
    {
      day: 2,
      location: 'Drive to Lyon',
      date: 'Tuesday, May 16',
      activities: [
        { time: '08:00', title: 'Breakfast & Check-out', description: 'Start your day early', icon: Utensils },
        { time: '09:30', title: 'Drive to Lyon', description: '3 hour scenic drive through Provence', icon: MapPin },
        { time: '13:00', title: 'Arrive in Lyon', description: 'Check into hotel and lunch', icon: Hotel },
        { time: '15:00', title: 'Vieux Lyon Tour', description: 'Explore the medieval old town and traboules', icon: MapPin },
        { time: '18:00', title: 'Fourvière Basilica', description: 'Visit the stunning hilltop basilica', icon: MapPin },
      ],
    },
    {
      day: 3,
      location: 'Lyon',
      date: 'Wednesday, May 17',
      activities: [
        { time: '09:00', title: 'Les Halles de Lyon', description: 'Visit the famous food market', icon: Utensils },
        { time: '11:00', title: 'Presqu\'île District', description: 'Shopping and sightseeing', icon: MapPin },
        { time: '13:00', title: 'Bouchon Experience', description: 'Traditional Lyonnaise lunch', icon: Utensils },
        { time: '15:30', title: 'Parc de la Tête d\'Or', description: 'Relax in the beautiful urban park', icon: MapPin },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Calendar className="h-6 w-6 text-primary-500" />
          Detailed Itinerary
        </h2>
        <Button
          onClick={handleGenerate}
          isLoading={isLoading}
          disabled={isLoading}
          size="sm"
          themeColors={{ primary: theme.primary, secondary: theme.secondary }}
        >
          {isLoading ? 'Generating...' : 'Generate Day-by-Day Plan'}
        </Button>
      </div>

      {!hasLoaded ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white to-gray-50 p-12 text-center shadow-lg"
          style={{ borderColor: theme.primary }}
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
            }}
          />

          {/* Content */}
          <div className="relative">
            {/* Icons with gradient background */}
            <div className="mb-6 flex justify-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                }}
              >
                <Calendar className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                }}
              >
                <Route className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            {/* Icon badges row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 flex justify-center gap-3"
            >
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <MapPin className="h-4 w-4" style={{ color: theme.primary }} />
              </div>
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <Hotel className="h-4 w-4" style={{ color: theme.primary }} />
              </div>
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <Utensils className="h-4 w-4" style={{ color: theme.primary }} />
              </div>
            </motion.div>

            {/* Text */}
            <h3 className="mb-3 text-xl font-bold text-gray-900">Your Day-by-Day Journey Awaits</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600">
              Click <span className="font-semibold" style={{ color: theme.primary }}>"Generate Day-by-Day Plan"</span> to create a detailed itinerary with schedules, activities, and recommendations for each day of your adventure
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {mockItinerary.map((day, dayIndex) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <button
                onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 text-lg font-bold text-white">
                    {day.day}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{day.location}</h3>
                    <p className="text-sm text-gray-600">{day.date}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedDay === day.day ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </motion.div>
              </button>

              {expandedDay === day.day && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-4">
                    <div className="space-y-4">
                      {day.activities.map((activity, activityIndex) => {
                        const Icon = activity.icon
                        return (
                          <motion.div
                            key={activityIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: activityIndex * 0.05 }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                                <Clock className="h-4 w-4 text-primary-600" />
                              </div>
                              {activityIndex < day.activities.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-200" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="mb-1 text-sm font-semibold text-primary-600">{activity.time}</div>
                              <div className="mb-1 flex items-center gap-2">
                                <Icon className="h-4 w-4 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                              </div>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
