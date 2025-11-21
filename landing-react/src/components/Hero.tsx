import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { StatsBar } from './StatsBar'
import { RecentActivity } from './RecentActivity'

export function Hero() {
  const scrollToForm = () => {
    const formElement = document.getElementById('route-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden">
      {/* Premium Gradient Background with Animation */}
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite'
          }}
        />

        {/* Noise texture overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-5xl"
        >
          <motion.h1
            className="mb-6 text-5xl font-black leading-[1.1] tracking-tighter text-gray-900 md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            Your Perfect European
            <br />
            Road Trip in 2 Minutes
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-2xl text-lg font-medium text-gray-700 md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            AI-powered route planning with four specialized agents.
            <br className="hidden sm:block" />
            Choose your style: Adventure, Culture, Food, or Hidden Gems.
          </motion.p>

          <motion.button
            onClick={scrollToForm}
            className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-10 py-4 text-base font-semibold tracking-wide text-white shadow-primary transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            whileTap={{ scale: 0.98 }}
          >
            Generate My Route
            <ArrowRight className="h-5 w-5 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
          </motion.button>

          {/* Stats Bar */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <StatsBar />
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <RecentActivity />
          </motion.div>
        </motion.div>

        {/* Simplified scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-gray-900/40"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
