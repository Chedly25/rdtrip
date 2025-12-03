/**
 * Marketplace Prompt Component - Wanderlust Editorial Design
 *
 * A beautiful, dismissible banner that introduces users to the
 * community marketplace where they can discover curated routes.
 *
 * Appears floating at top-left, below the header, with elegant
 * entry/exit animations.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, X, ArrowRight, Sparkles, Map, Star } from 'lucide-react'

const PROMPT_KEY = 'rdtrip_marketplace_prompt_dismissed'

interface MarketplacePromptProps {
  /** Delay before showing the prompt (ms) */
  delay?: number
  /** Force show for testing */
  forceShow?: boolean
  className?: string
}

export function MarketplacePrompt({
  delay = 5000,
  forceShow = false,
  className = '',
}: MarketplacePromptProps) {
  const [visible, setVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (forceShow) {
      setVisible(true)
      return
    }

    const isDismissed = localStorage.getItem(PROMPT_KEY) === 'true'
    if (isDismissed) return

    // Show after delay
    const timer = setTimeout(() => {
      setVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, forceShow])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(PROMPT_KEY, 'true')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative max-w-xs ${className}`}
        >
          {/* Main card */}
          <div
            className="rounded-2xl overflow-hidden backdrop-blur-sm"
            style={{
              background: 'linear-gradient(165deg, rgba(255, 251, 245, 0.97) 0%, rgba(250, 247, 242, 0.97) 100%)',
              boxShadow: '0 15px 40px -8px rgba(44, 36, 23, 0.2), 0 0 0 1px rgba(44, 36, 23, 0.05)',
            }}
          >
            {/* Decorative top stripe */}
            <div
              className="h-0.5"
              style={{
                background: 'linear-gradient(90deg, #D4A853 0%, #C45830 50%, #D4A853 100%)',
              }}
            />

            {/* Content */}
            <div className="p-4">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-[#2C2417]/5"
                style={{ color: '#C4B8A5' }}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with icon */}
              <div className="flex items-start gap-3 mb-3">
                <motion.div
                  animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(196, 88, 48, 0.15) 100%)',
                  }}
                >
                  <Compass className="w-5 h-5" style={{ color: '#C45830' }} />
                </motion.div>
                <div className="flex-1 pr-6">
                  <h4
                    className="text-sm font-semibold mb-0.5"
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      color: '#2C2417',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Discover Community Routes
                  </h4>
                  <p className="text-xs" style={{ color: '#8B7355' }}>
                    Explore curated itineraries from fellow travelers
                  </p>
                </div>
              </div>

              {/* Featured routes preview - mini cards */}
              <div className="flex gap-2 mb-3">
                {[
                  { name: 'Pacific Coast Highway', rating: 4.9, icon: '🌊' },
                  { name: 'Route 66 Classic', rating: 4.8, icon: '🛣️' },
                ].map((route, i) => (
                  <motion.div
                    key={route.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex-1 px-2.5 py-2 rounded-lg"
                    style={{ background: '#F5F0E8' }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs">{route.icon}</span>
                      <span
                        className="text-[10px] font-medium truncate"
                        style={{ color: '#2C2417' }}
                      >
                        {route.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-[#D4A853]" style={{ color: '#D4A853' }} />
                      <span className="text-[10px]" style={{ color: '#8B7355' }}>
                        {route.rating}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action button */}
              <motion.a
                href="/marketplace"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                  boxShadow: '0 2px 10px rgba(196, 88, 48, 0.25)',
                }}
              >
                <Map className="w-4 h-4" />
                Explore Marketplace
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.a>
            </div>

            {/* Sparkle accent */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1 -right-1 pointer-events-none"
            >
              <Sparkles className="w-4 h-4" style={{ color: '#D4A853' }} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MarketplacePrompt
