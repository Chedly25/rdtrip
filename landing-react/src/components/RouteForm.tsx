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
    <section id="route-form" className="relative bg-white py-24">
      <div className="container mx-auto max-w-4xl px-4">
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16 text-center"
          >
            <h2 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
              Plan Your Journey
            </h2>
            <p className="text-lg font-medium text-gray-600">
              Tell us where you want to go, and we'll create a personalized route
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
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-8 rounded-3xl bg-white p-10 shadow-xl border border-gray-200"
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
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-xl bg-gray-50 p-4 border border-gray-200"
            >
              <p className="text-sm font-medium text-gray-700">
                <span className="font-semibold text-gray-900">
                  {calculateDistance(origin.coordinates, destination.coordinates).toFixed(0)} km
                </span>
                {' '}road trip from <span className="font-semibold text-gray-900">{origin.name}</span> to <span className="font-semibold text-gray-900">{destination.name}</span>
              </p>
            </motion.div>
          )}

          {/* Trip Pace */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Zap className="h-4 w-4 text-gray-700" />
              Trip Pace
            </label>
            <div className="flex gap-3 p-1.5 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setTripPace('leisurely')}
                className={`flex-1 rounded-xl p-4 transition-all duration-200 ease-smooth ${
                  tripPace === 'leisurely'
                    ? 'bg-white shadow-md transform scale-[1.02]'
                    : 'bg-transparent hover:bg-white/50'
                }`}
              >
                <div className="text-2xl mb-2">🚶</div>
                <div className="font-semibold text-gray-900 text-sm">Leisurely</div>
                <div className="text-xs text-gray-600 mt-1">2-4 cities</div>
              </button>
              <button
                type="button"
                onClick={() => setTripPace('balanced')}
                className={`flex-1 rounded-xl p-4 transition-all duration-200 ease-smooth ${
                  tripPace === 'balanced'
                    ? 'bg-white shadow-md transform scale-[1.02]'
                    : 'bg-transparent hover:bg-white/50'
                }`}
              >
                <div className="text-2xl mb-2">🚶‍♂️</div>
                <div className="font-semibold text-gray-900 text-sm">Balanced</div>
                <div className="text-xs text-gray-600 mt-1">3-5 cities</div>
              </button>
              <button
                type="button"
                onClick={() => setTripPace('fast-paced')}
                className={`flex-1 rounded-xl p-4 transition-all duration-200 ease-smooth ${
                  tripPace === 'fast-paced'
                    ? 'bg-white shadow-md transform scale-[1.02]'
                    : 'bg-transparent hover:bg-white/50'
                }`}
              >
                <div className="text-2xl mb-2">🏃</div>
                <div className="font-semibold text-gray-900 text-sm">Fast-Paced</div>
                <div className="text-xs text-gray-600 mt-1">4-7 cities</div>
              </button>
            </div>
          </div>

          {/* Trip Duration */}
          <div className="space-y-5 rounded-2xl bg-gray-50 p-6 border border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-700" />
              <h3 className="text-base font-bold text-gray-900">Trip Duration</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">How long is your trip?</span>
                <span className="text-gray-900 font-bold text-3xl tracking-tight">{totalNights}</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={totalNights}
                onChange={(e) => setTotalNights(Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #0066FF 0%, #0066FF ${((totalNights - 3) / 27) * 100}%, #E5E5E5 ${((totalNights - 3) / 27) * 100}%, #E5E5E5 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>3 nights</span>
                <span>30 nights</span>
              </div>

              {/* Days Display */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-base font-semibold text-gray-900">
                    {totalDays} {totalDays === 1 ? 'day' : 'days'} total
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    AI determines optimal cities for your pace
                  </div>
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
            className="w-full rounded-2xl bg-gray-900 px-8 py-4 text-base font-semibold tracking-wide text-white shadow-lg transition-all duration-200 ease-smooth hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            whileTap={!isLoading && !isSubmitting ? { scale: 0.98 } : undefined}
          >
            {isLoading || isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
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
