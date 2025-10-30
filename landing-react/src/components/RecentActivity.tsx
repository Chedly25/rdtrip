import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MapPin, Clock } from 'lucide-react'

interface RecentRoute {
  destination: string
  createdAt: string
  agents: string[]
}

interface Stats {
  recentRoutes: RecentRoute[]
}

// Helper to get time ago string
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Get agent icon path based on agent name
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

  // Fetch stats from backend
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

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate through routes every 4 seconds
  useEffect(() => {
    if (recentRoutes.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recentRoutes.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [recentRoutes])

  if (isLoading) {
    return (
      <div className="h-12 w-full max-w-md animate-pulse rounded-lg bg-white/10" />
    )
  }

  if (recentRoutes.length === 0) {
    return null
  }

  const currentRoute = recentRoutes[currentIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="w-full max-w-2xl"
    >
      <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Recent Activity
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    Aix-en-Provence → {currentRoute.destination}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(currentRoute.createdAt)}</span>
                    {currentRoute.agents && currentRoute.agents.length > 0 && (
                      <>
                        <span>•</span>
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

          {/* Dots indicator */}
          {recentRoutes.length > 1 && (
            <div className="mt-3 flex justify-center gap-1.5">
              {recentRoutes.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`View route ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
