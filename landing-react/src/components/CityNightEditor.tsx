import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CityNightEditorProps {
  cityName: string
  currentNights: number
  minNights?: number
  maxNights?: number
  onNightsChange: (newNights: number) => Promise<void>
  themeColor: string
  disabled?: boolean
}

export function CityNightEditor({
  cityName,
  currentNights,
  minNights = 0,
  maxNights = 7,
  onNightsChange,
  themeColor,
  disabled = false
}: CityNightEditorProps) {
  const [nights, setNights] = useState(currentNights)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (newNights: number) => {
    if (newNights < minNights || newNights > maxNights || disabled) return

    setLoading(true)
    setError(null)
    const previousNights = nights

    // Optimistic update
    setNights(newNights)

    try {
      await onNightsChange(newNights)
      console.log(`✓ Updated ${cityName} to ${newNights} nights`)
    } catch (err) {
      // Revert on error
      setNights(previousNights)
      setError('Failed to update nights')
      console.error('Night update failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const canDecrease = nights > minNights && !loading && !disabled
  const canIncrease = nights < maxNights && !loading && !disabled

  return (
    <div className="city-night-editor flex flex-col items-center">
      {/* Sleek Pill Counter */}
      <div
        className="inline-flex items-stretch rounded-full shadow-md overflow-hidden border-2 transition-all duration-300 hover:shadow-lg"
        style={{
          borderColor: `${themeColor}40`,
          backgroundColor: 'white'
        }}
      >
        {/* Decrease Button */}
        <button
          onClick={() => handleChange(nights - 1)}
          disabled={!canDecrease}
          className="px-4 py-3 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          style={{
            backgroundColor: canDecrease ? `${themeColor}15` : 'transparent',
            color: canDecrease ? themeColor : '#9ca3af',
          }}
          onMouseEnter={(e) => {
            if (canDecrease) {
              e.currentTarget.style.backgroundColor = `${themeColor}25`
            }
          }}
          onMouseLeave={(e) => {
            if (canDecrease) {
              e.currentTarget.style.backgroundColor = `${themeColor}15`
            }
          }}
          title={nights === 0 ? 'Remove from route' : 'Decrease nights'}
        >
          <Minus className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Subtle Divider */}
        <div className="w-px bg-gray-200" />

        {/* Number Display */}
        <div className="px-6 py-3 flex items-center justify-center min-w-[140px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={nights}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="flex items-baseline gap-2"
            >
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: themeColor }}
              >
                {nights}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                {nights === 0 ? 'skip' : nights === 1 ? 'night' : 'nights'}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Loading Spinner Overlay */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: themeColor, borderTopColor: 'transparent' }}
              />
            </motion.div>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="w-px bg-gray-200" />

        {/* Increase Button */}
        <button
          onClick={() => handleChange(nights + 1)}
          disabled={!canIncrease}
          className="px-4 py-3 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          style={{
            backgroundColor: canIncrease ? `${themeColor}15` : 'transparent',
            color: canIncrease ? themeColor : '#9ca3af',
          }}
          onMouseEnter={(e) => {
            if (canIncrease) {
              e.currentTarget.style.backgroundColor = `${themeColor}25`
            }
          }}
          onMouseLeave={(e) => {
            if (canIncrease) {
              e.currentTarget.style.backgroundColor = `${themeColor}15`
            }
          }}
          title="Increase nights"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-xs text-red-600 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
