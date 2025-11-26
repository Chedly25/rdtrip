import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Route, Sparkles } from 'lucide-react'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

interface Stats {
  totalRoutes: number
  routesToday: number
  routesThisWeek: number
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats>({ totalRoutes: 0, routesToday: 0, routesThisWeek: 0 })
  const [isLoading, setIsLoading] = useState(true)

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
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 w-36 animate-pulse rounded-rui-16 bg-rui-grey-5" />
        ))}
      </div>
    )
  }

  if (stats.totalRoutes === 0) {
    return null
  }

  const statItems = [
    {
      icon: Sparkles,
      value: stats.routesToday,
      label: 'routes today',
    },
    {
      icon: Route,
      value: `${stats.totalRoutes}+`,
      label: 'total planned',
    },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1, ease: ruiEasing }}
          className="group"
        >
          <div className="flex items-center gap-3 rounded-rui-16 bg-rui-grey-2 px-5 py-3 transition-all duration-rui-sm ease-rui-default hover:bg-rui-grey-5 hover:shadow-rui-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-rui-12 bg-rui-white shadow-rui-1">
              <item.icon className="h-5 w-5 text-rui-black" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-rui-black leading-tight">
                {item.value}
              </div>
              <div className="text-xs text-rui-grey-50 font-medium">
                {item.label}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
