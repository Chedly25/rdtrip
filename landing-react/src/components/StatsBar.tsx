import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Stats {
  totalRoutes: number
  routesToday: number
  routesThisWeek: number
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats>({ totalRoutes: 0, routesToday: 0, routesThisWeek: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        setStats(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setIsLoading(false)
      }
    }

    fetchStats()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-8">
        <div className="h-16 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="h-16 w-32 animate-pulse rounded-lg bg-white/10" />
      </div>
    )
  }

  // Don't show if no data
  if (stats.totalRoutes === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-wrap items-center justify-center gap-6 md:gap-12"
    >
      {/* Today's routes */}
      <div className="group relative">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm transition-all hover:bg-white/15">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.routesToday}
            </div>
            <div className="text-xs text-white/80">routes today</div>
          </div>
        </div>
      </div>

      {/* Total routes */}
      <div className="group relative">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm transition-all hover:bg-white/15">
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.totalRoutes}+
            </div>
            <div className="text-xs text-white/80">total routes planned</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
