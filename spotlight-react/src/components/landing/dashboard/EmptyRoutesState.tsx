/**
 * Empty Routes State - Wanderlust Editorial Design
 *
 * Beautiful empty state when user has no routes yet.
 * Guides them to create their first trip.
 */

import { motion } from 'framer-motion'
import { Map, Compass, ArrowRight, Sparkles } from 'lucide-react'

interface EmptyRoutesStateProps {
  onCreateRoute: () => void
}

export function EmptyRoutesState({ onCreateRoute }: EmptyRoutesStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Decorative illustration */}
      <div className="relative mb-8">
        {/* Main circle with compass */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.15) 100%)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Compass className="w-14 h-14" style={{ color: '#C45830' }} strokeWidth={1.25} />
          </motion.div>
        </motion.div>

        {/* Floating accents */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute -top-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #C49A48 100%)' }}
        >
          <Map className="w-5 h-5 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-1 -left-3 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6B8E7B 0%, #5A7D6A 100%)' }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl md:text-3xl font-semibold mb-3"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: '#2C2417',
          letterSpacing: '-0.02em',
        }}
      >
        Your Adventure Awaits
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-base max-w-md mb-8 leading-relaxed"
        style={{ color: '#8B7355' }}
      >
        Create your first road trip and discover amazing destinations along the way.
        We'll help you plan every stop, find hidden gems, and make memories that last.
      </motion.p>

      {/* Features preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3 mb-8"
      >
        {[
          { icon: '🗺️', text: 'AI-planned routes' },
          { icon: '🏨', text: 'Hotel suggestions' },
          { icon: '🍽️', text: 'Restaurant picks' },
          { icon: '✨', text: 'Hidden gems' },
        ].map((feature) => (
          <span
            key={feature.text}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{
              background: '#F5F0E8',
              color: '#5A5347',
            }}
          >
            <span>{feature.icon}</span>
            {feature.text}
          </span>
        ))}
      </motion.div>

      {/* CTA Button */}
      <motion.button
        onClick={onCreateRoute}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
          boxShadow: '0 8px 30px rgba(196, 88, 48, 0.35)',
        }}
      >
        <Compass className="w-5 h-5" />
        Plan Your First Trip
        <ArrowRight className="w-4 h-4" />
      </motion.button>

      {/* Subtle hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-xs"
        style={{ color: '#C4B8A5' }}
      >
        Takes about 2-4 minutes to generate
      </motion.p>
    </motion.div>
  )
}
