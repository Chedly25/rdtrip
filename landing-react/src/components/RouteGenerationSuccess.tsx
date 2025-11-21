import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

interface RouteGenerationSuccessProps {
  destination: string
  onViewResults: () => void
}

export function RouteGenerationSuccess({ destination, onViewResults }: RouteGenerationSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-2xl mx-auto p-12 bg-white rounded-3xl shadow-2xl border border-gray-100 text-center"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.1,
          type: 'spring',
          stiffness: 200,
          damping: 15
        }}
        className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gray-900 rounded-full"
      >
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </motion.div>

      {/* Sparkles Animation */}
      <div className="relative mb-8">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, Math.cos((i * Math.PI * 2) / 8) * 60],
              y: [0, Math.sin((i * Math.PI * 2) / 8) * 60],
            }}
            transition={{
              duration: 1,
              delay: 0.2 + i * 0.05,
              ease: 'easeOut'
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-4 h-4 text-gray-900" />
          </motion.div>
        ))}
      </div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          Your route is ready!
        </h2>
        <p className="text-base text-gray-600 mb-8">
          We've crafted the perfect itinerary for your trip to {destination}
        </p>

        {/* CTA Button */}
        <motion.button
          onClick={onViewResults}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          View Your Route
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Confetti Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: Math.random() * 100 + '%', opacity: 1 }}
            animate={{
              y: ['0%', '120%'],
              opacity: [1, 0],
              rotate: [0, Math.random() * 360]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'easeIn'
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#171717', '#404040', '#737373', '#A3A3A3'][Math.floor(Math.random() * 4)],
              left: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
