import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

interface SmoothSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function SmoothSection({ children, className = '', delay = 0 }: SmoothSectionProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing
      }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
