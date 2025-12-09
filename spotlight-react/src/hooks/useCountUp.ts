import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

interface UseCountUpOptions {
  start?: number
  end: number
  duration?: number
  delay?: number
  suffix?: string
  prefix?: string
}

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  suffix = '',
  prefix = ''
}: UseCountUpOptions) {
  const [count, setCount] = useState(start)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = Date.now() + delay
    const endTime = startTime + duration

    const tick = () => {
      const now = Date.now()

      if (now < startTime) {
        requestAnimationFrame(tick)
        return
      }

      if (now >= endTime) {
        setCount(end)
        return
      }

      const progress = (now - startTime) / duration
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setCount(current)
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isInView, start, end, duration, delay])

  return { ref, count, display: `${prefix}${count}${suffix}` }
}
