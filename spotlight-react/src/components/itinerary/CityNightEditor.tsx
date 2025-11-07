import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

interface CityNightEditorProps {
  cityName: string
  currentNights: number
  minNights?: number
  maxNights?: number
  onNightsChange: (newNights: number) => Promise<void>
  themeColor?: string
  disabled?: boolean
  label?: string
}

export function CityNightEditor({
  cityName,
  currentNights,
  minNights = 1,
  maxNights = 14,
  onNightsChange,
  themeColor = '#064d51',
  disabled = false,
  label = 'Regenerate full schedule'
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
      console.log(`✓ Regenerated ${cityName} schedule for ${newNights} nights`)
    } catch (err) {
      // Revert on error
      setNights(previousNights)
      setError('Failed to regenerate schedule')
      console.error('Schedule regeneration failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="city-night-editor">
      <div className="flex items-center gap-3 p-4 border-2 rounded-xl bg-white shadow-sm">
        {/* Decrease Button */}
        <button
          onClick={() => handleChange(nights - 1)}
          disabled={nights <= minNights || loading || disabled}
          className="flex-shrink-0 rounded-full p-2.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 hover:shadow-md"
          style={{
            backgroundColor: nights > minNights ? themeColor : '#d1d5db',
            color: 'white'
          }}
          title="Decrease nights"
        >
          <Minus className="h-5 w-5" />
        </button>

        {/* Display */}
        <div className="flex flex-col items-center min-w-[120px]">
          <motion.span
            key={nights}
            initial={{ scale: 1.2, color: themeColor }}
            animate={{ scale: 1, color: '#111827' }}
            className="text-3xl font-bold"
          >
            {nights}
          </motion.span>
          <span className="text-sm text-gray-600 font-semibold">
            {nights === 1 ? 'night' : 'nights'}
          </span>
          {label && (
            <span className="text-xs text-gray-500 mt-1">
              {label}
            </span>
          )}
        </div>

        {/* Increase Button */}
        <button
          onClick={() => handleChange(nights + 1)}
          disabled={nights >= maxNights || loading || disabled}
          className="flex-shrink-0 rounded-full p-2.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 hover:shadow-md"
          style={{
            backgroundColor: nights < maxNights ? themeColor : '#d1d5db',
            color: 'white'
          }}
          title="Increase nights"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Loading Spinner */}
        {loading && (
          <div className="ml-3">
            <div
              className="h-6 w-6 animate-spin rounded-full border-3 border-t-transparent"
              style={{ borderColor: themeColor, borderTopColor: 'transparent' }}
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 font-medium"
        >
          {error}
        </motion.p>
      )}

      {/* Info Message */}
      {loading && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-gray-600"
        >
          Regenerating activities, hotels, and restaurants for {nights} {nights === 1 ? 'night' : 'nights'}...
        </motion.p>
      )}
    </div>
  )
}
