import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Zap } from 'lucide-react'
import { useFormStore } from '../stores/formStore'
import { BudgetSelector } from './BudgetSelector'
import { AgentSelector } from './AgentSelector'
import { RouteGenerationLoading } from './RouteGenerationLoading'
import { CitySelector } from './CitySelector'

// Helper function for distance calculation (Haversine formula)
function calculateDistance(coords1: [number, number], coords2: [number, number]): number {
  const [lat1, lon1] = coords1
  const [lat2, lon2] = coords2

  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

interface RouteFormProps {
  onRouteGenerated?: (data: any) => void
}

export function RouteForm({ onRouteGenerated }: RouteFormProps) {
  const {
    origin,
    destination,
    budget,
    agents,
    totalNights,
    tripPace,
    isLoading,
    error,
    originError,
    destinationError,
    setOrigin,
    setDestination,
    setOriginError,
    setDestinationError,
    setBudget,
    setAgents,
    setTotalNights,
    setTripPace,
    setLoading,
    setError,
  } = useFormStore()

  // Calculate total duration
  const totalDays = totalNights + 1

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    currentAgent: null as string | null,
    percentComplete: 0,
    estimatedTimeRemaining: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate origin and destination are selected
    if (!origin) {
      setOriginError('Please select a starting city')
      return
    }

    if (!destination) {
      setDestinationError('Please select a destination city')
      return
    }

    // Calculate distance
    const distance = calculateDistance(origin.coordinates, destination.coordinates)

    // Validate distance constraints
    if (distance < 50) {
      setDestinationError(`Destination too close to origin (${Math.round(distance)} km). Minimum distance is 50 km.`)
      return
    }

    if (distance > 3000) {
      setDestinationError(`Destination too far from origin (${Math.round(distance)} km). Maximum distance is 3,000 km for road trips.`)
      return
    }

    if (agents.length === 0) {
      setError('Please select at least one travel interest')
      return
    }

    setOriginError(null)
    setDestinationError(null)
    setError(null)
    setLoading(true)
    setIsSubmitting(true)

    try {
      // Start route generation job with NEW nights-based endpoint
      const response = await fetch('/api/generate-route-nights-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: {
            name: origin.name,
            country: origin.country,
            coordinates: origin.coordinates
          },
          destination: {
            name: destination.name,
            country: destination.country,
            coordinates: destination.coordinates
          },
          totalNights,
          tripPace,
          budget,
          agents,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start route generation')
      }

      const { jobId } = await response.json()
      console.log('Job started:', jobId)

      // Poll for job status
      const pollInterval = 2000 // Poll every 2 seconds
      const maxAttempts = 120 // Max 4 minutes (120 * 2s)
      let attempts = 0

      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('Route generation timed out. Please try again with fewer stops.')
        }

        attempts++

        const statusResponse = await fetch(`/api/route-status/${jobId}`)
        if (!statusResponse.ok) {
          throw new Error('Failed to check route status')
        }

        const statusData = await statusResponse.json()
        console.log('Job status:', statusData)

        // Update progress state
        if (statusData.progress) {
          setProgress({
            total: statusData.progress.total || 0,
            completed: statusData.progress.completed || 0,
            currentAgent: statusData.progress.currentAgent || null,
            percentComplete: statusData.progress.percentComplete || 0,
            estimatedTimeRemaining: statusData.progress.estimatedTimeRemaining || 0
          })
        }

        if (statusData.status === 'completed') {
          // Job completed successfully
          if (onRouteGenerated) {
            onRouteGenerated(statusData.route)
          } else {
            // Fallback: redirect directly if no callback provided
            localStorage.setItem('spotlightData', JSON.stringify(statusData.route))
            window.location.href = `/spotlight-new/?routeId=${statusData.route.id}`
          }
          setLoading(false)
          setIsSubmitting(false)
        } else if (statusData.status === 'failed') {
          // Job failed
          throw new Error(statusData.error || 'Route generation failed')
        } else {
          // Still processing, poll again
          setTimeout(pollStatus, pollInterval)
        }
      }

      // Start polling
      await pollStatus()

    } catch (err) {
      console.error('Route generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate route')
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <section id="route-form" className="relative bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto max-w-4xl px-4">
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Plan Your Journey
            </h2>
            <p className="text-lg text-gray-600">
              Tell us where you want to go, and we'll create a personalized route just for you
            </p>
          </motion.div>
        )}

        {/* Show loading component when generating route */}
        {isLoading && (
          <RouteGenerationLoading
            progress={progress}
            destination={destination?.name || ''}
            agents={agents}
          />
        )}

        {/* Show form when not loading */}
        {!isLoading && (
          <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 rounded-2xl bg-white p-8 shadow-xl"
        >
          {/* Origin and Destination */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Origin */}
            <CitySelector
              value={origin}
              label="Starting From"
              placeholder="Enter your starting city (e.g., Berlin, Paris, Rome)"
              onCitySelect={setOrigin}
              error={originError}
            />

            {/* Destination */}
            <CitySelector
              value={destination}
              label="Destination"
              placeholder="Where do you want to go?"
              onCitySelect={setDestination}
              error={destinationError}
            />
          </div>

          {/* Distance indicator */}
          {origin && destination && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg bg-blue-50 p-4 border border-blue-200"
            >
              <p className="text-sm text-blue-900">
                <span className="font-medium">
                  {calculateDistance(origin.coordinates, destination.coordinates).toFixed(0)} km
                </span>
                {' '}road trip from <span className="font-medium">{origin.name}</span> to <span className="font-medium">{destination.name}</span>
              </p>
            </motion.div>
          )}

          {/* Trip Pace */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Zap className="h-4 w-4 text-purple-600" />
              Trip Pace
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTripPace('leisurely')}
                className={`rounded-lg border-2 p-4 transition-all ${
                  tripPace === 'leisurely'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-1">🚶</div>
                <div className="font-semibold text-gray-900">Leisurely</div>
                <div className="text-xs text-gray-500 mt-1">2-4 cities, deeper stays</div>
              </button>
              <button
                type="button"
                onClick={() => setTripPace('balanced')}
                className={`rounded-lg border-2 p-4 transition-all ${
                  tripPace === 'balanced'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-1">🚶‍♂️</div>
                <div className="font-semibold text-gray-900">Balanced</div>
                <div className="text-xs text-gray-500 mt-1">3-5 cities, mixed pace</div>
              </button>
              <button
                type="button"
                onClick={() => setTripPace('fast-paced')}
                className={`rounded-lg border-2 p-4 transition-all ${
                  tripPace === 'fast-paced'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-1">🏃</div>
                <div className="font-semibold text-gray-900">Fast-Paced</div>
                <div className="text-xs text-gray-500 mt-1">4-7 cities, see more</div>
              </button>
            </div>
          </div>

          {/* Trip Duration */}
          <div className="space-y-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Total Trip Duration</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
                <span>How long is your trip?</span>
                <span className="text-purple-600 font-bold text-2xl">{totalNights} nights</span>
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={totalNights}
                onChange={(e) => setTotalNights(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                style={{
                  background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((totalNights - 3) / 27) * 100}%, #e5e7eb ${((totalNights - 3) / 27) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>3 nights (weekend)</span>
                <span>30 nights (epic adventure)</span>
              </div>

              {/* Days Display */}
              <div className="mt-3 text-center">
                <div className="text-xl font-bold text-gray-900">
                  = {totalDays} {totalDays === 1 ? 'day' : 'days'} total
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  AI will determine optimal cities based on your pace
                </div>
              </div>
            </div>
          </div>

          {/* Budget Selector */}
          <BudgetSelector selected={budget} onChange={setBudget} />

          {/* Agent Selector */}
          <AgentSelector selected={agents} onChange={setAgents} />

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={!isLoading && !isSubmitting ? { scale: 1.01 } : undefined}
            whileTap={!isLoading && !isSubmitting ? { scale: 0.99 } : undefined}
          >
            {isLoading || isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Your Route...
              </span>
            ) : (
              'Generate My Route'
            )}
          </motion.button>
        </motion.form>
        )}
      </div>
    </section>
  )
}
