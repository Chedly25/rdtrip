import { motion, useInView } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Route, Sparkles } from 'lucide-react'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

interface Stats {
  totalRoutes: number
  routesToday: number
  routesThisWeek: number
}

// Animated counter component
function AnimatedCounter({
  value,
  suffix = '',
  duration = 2000
}: {
  value: number | string
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)
  const hasAnimated = useRef(false)

  const numericValue = typeof value === 'string' ? parseInt(value) || 0 : value

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = Date.now()
    const endTime = startTime + duration

    const tick = () => {
      const now = Date.now()

      if (now >= endTime) {
        setDisplayValue(numericValue)
        return
      }

      const progress = (now - startTime) / duration
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(numericValue * eased)
      setDisplayValue(current)
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isInView, numericValue, duration])

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  )
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
      value: stats.totalRoutes,
      suffix: '+',
      label: 'total planned',
    },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: index * 0.15,
            ease: ruiEasing
          }}
          className="group"
        >
          <motion.div
            className="flex items-center gap-3 rounded-rui-16 bg-rui-grey-2 px-5 py-3 transition-all duration-300 ease-rui-default hover:bg-rui-white hover:shadow-rui-2"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-rui-12 bg-rui-white shadow-rui-1"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
            >
              <item.icon className="h-5 w-5 text-rui-black" />
            </motion.div>
            <div className="text-left">
              <div className="text-2xl font-bold text-rui-black leading-tight tabular-nums">
                <AnimatedCounter
                  value={item.value}
                  suffix={item.suffix || ''}
                  duration={1500}
                />
              </div>
              <div className="text-xs text-rui-grey-50 font-medium">
                {item.label}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
