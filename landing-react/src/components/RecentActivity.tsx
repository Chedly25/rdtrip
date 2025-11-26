import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MapPin, Clock } from 'lucide-react'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

interface RecentRoute {
  destination: string | { name: string; country?: string; coordinates?: number[] }
  createdAt: string
  agents: string[]
}

interface Stats {
  recentRoutes: RecentRoute[]
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getAgentIconPath(agent: string): string {
  const icons: Record<string, string> = {
    adventure: '/images/icons/adventure_icon.png',
    culture: '/images/icons/culture_icon.png',
    food: '/images/icons/food_icon.png',
    'hidden-gems': '/images/icons/hidden_gem_icon.png'
  }
  return icons[agent] || '/images/icons/best_icon.png'
}

export function RecentActivity() {
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data: Stats = await response.json()
        if (data.recentRoutes && data.recentRoutes.length > 0) {
          setRecentRoutes(data.recentRoutes)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (recentRoutes.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recentRoutes.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [recentRoutes])

  if (isLoading) {
    return (
      <div className="h-16 w-full max-w-lg animate-pulse rounded-rui-16 bg-rui-grey-5" />
    )
  }

  if (recentRoutes.length === 0) {
    return null
  }

  const currentRoute = recentRoutes[currentIndex]

  const getDestinationName = (dest: string | { name: string; country?: string }): string => {
    if (typeof dest === 'string') return dest
    return dest.name
  }

  return (
    <div className="w-full max-w-lg">
      <div className="overflow-hidden rounded-rui-16 bg-rui-white border border-rui-grey-10 shadow-rui-1">
        <div className="px-5 py-4">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-rui-grey-50">
              Live Activity
            </p>
          </div>

          {/* Route display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: ruiEasing }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-rui-12 bg-rui-grey-2">
                  <MapPin className="h-5 w-5 text-rui-black" />
                </div>
                <div>
                  <p className="font-semibold text-rui-black text-sm">
                    Aix-en-Provence → {getDestinationName(currentRoute.destination)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-rui-grey-50">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(currentRoute.createdAt)}</span>
                    {currentRoute.agents && currentRoute.agents.length > 0 && (
                      <>
                        <span className="text-rui-grey-20">•</span>
                        <div className="flex items-center gap-1">
                          {currentRoute.agents.map((agent, idx) => (
                            <img
                              key={idx}
                              src={getAgentIconPath(agent)}
                              alt={agent}
                              className="h-4 w-4 object-contain"
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          {recentRoutes.length > 1 && (
            <div className="mt-4 flex justify-center gap-1.5">
              {recentRoutes.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-rui-sm ease-rui-default ${
                    index === currentIndex
                      ? 'w-5 bg-rui-black'
                      : 'w-1.5 bg-rui-grey-20 hover:bg-rui-grey-50'
                  }`}
                  aria-label={`View route ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
