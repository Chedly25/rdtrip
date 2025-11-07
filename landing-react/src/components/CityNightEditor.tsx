import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

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

  return (
    <div className="city-night-editor">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        {/* Decrease Button */}
        <button
          onClick={() => handleChange(nights - 1)}
          disabled={nights <= minNights || loading || disabled}
          className="flex-shrink-0 rounded-full p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
          style={{
            backgroundColor: nights > minNights ? themeColor : '#d1d5db',
            color: 'white'
          }}
          title={nights === 0 ? 'Remove from route' : 'Decrease nights'}
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Display */}
        <div className="flex flex-col items-center min-w-[100px]">
          <motion.span
            key={nights}
            initial={{ scale: 1.2, color: themeColor }}
            animate={{ scale: 1, color: '#111827' }}
            className="text-2xl font-bold"
          >
            {nights}
          </motion.span>
          <span className="text-xs text-gray-600 font-medium">
            {nights === 0 ? 'Pass through' : nights === 1 ? 'night' : 'nights'}
          </span>
        </div>

        {/* Increase Button */}
        <button
          onClick={() => handleChange(nights + 1)}
          disabled={nights >= maxNights || loading || disabled}
          className="flex-shrink-0 rounded-full p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
          style={{
            backgroundColor: nights < maxNights ? themeColor : '#d1d5db',
            color: 'white'
          }}
          title="Increase nights"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Loading Spinner */}
        {loading && (
          <div className="ml-2">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
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
          className="mt-2 text-xs text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
