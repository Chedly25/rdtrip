import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  const scrollToForm = () => {
    const formElement = document.getElementById('route-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative h-[70vh] w-full overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/video 2.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl"
        >
          <motion.h1
            className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Plan Your Perfect
            <br />
            <span className="text-white">
              Road Trip Adventure
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 text-lg text-gray-200 md:text-xl lg:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            AI-powered route planning with personalized stops, activities, and hidden gems
            tailored to your travel style
          </motion.p>

          <motion.button
            onClick={scrollToForm}
            className="group inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Planning
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/60"
          >
            <svg
              className="h-6 w-6"
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
