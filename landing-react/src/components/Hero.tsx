import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useRef } from 'react'
import { StatsBar } from './StatsBar'
import { RecentActivity } from './RecentActivity'

// Revolut easing curve
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)

  // Parallax scroll effect like Revolut
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.5], ['0%', '20%'])

  const scrollToForm = () => {
    const formElement = document.getElementById('route-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-rui-white"
    >
      {/* Clean background - Revolut uses subtle, clean whites */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-rui-grey-2 to-white"
        style={{ y: backgroundY, scale: backgroundScale }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-32"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="w-full max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ruiEasing }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rui-accent-light text-rui-accent text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rui-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rui-accent"></span>
              </span>
              AI-Powered Trip Planning
            </span>
          </motion.div>

          {/* Main headline - Bold, impactful, Revolut style */}
          <motion.h1
            className="mb-6 font-marketing text-[2.75rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[5rem] font-extrabold text-rui-black leading-[1.05] tracking-[-0.02em]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: ruiEasing }}
          >
            Your Perfect European
            <br />
            Road Trip in 2 Minutes
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-rui-grey-50 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: ruiEasing }}
          >
            Tell us what you love. Our AI crafts one perfect route
            <br className="hidden sm:block" />
            tailored to your interests, pace, and travel style.
          </motion.p>

          {/* CTA Button - Revolut style with state layer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: ruiEasing }}
          >
            <button
              onClick={scrollToForm}
              className="group relative inline-flex items-center gap-3 rounded-full bg-rui-black px-10 py-5 text-lg font-semibold text-rui-white overflow-hidden transition-all duration-rui-sm ease-rui-default hover:shadow-rui-4 active:scale-[0.98]"
            >
              {/* State layer for hover */}
              <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-rui-sm group-hover:opacity-10" />
              <span className="relative">Start Planning</span>
              <ArrowRight className="relative h-6 w-6 transition-transform duration-rui-sm ease-rui-default group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: ruiEasing }}
          >
            <StatsBar />
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: ruiEasing }}
          >
            <RecentActivity />
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator - Revolut minimal style */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.button
          onClick={scrollToForm}
          className="flex flex-col items-center gap-2 text-rui-grey-50 hover:text-rui-black transition-colors duration-rui-sm"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs font-medium uppercase tracking-wider">Scroll</span>
          <ChevronDown className="h-5 w-5" />
        </motion.button>
      </motion.div>
    </section>
  )
}
