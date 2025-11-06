import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Users, Calendar } from 'lucide-react'
import { useFormStore } from '../stores/formStore'
import { BudgetSelector } from './BudgetSelector'
import { AgentSelector } from './AgentSelector'
import { RouteGenerationLoading } from './RouteGenerationLoading'

interface RouteFormProps {
  onRouteGenerated?: (data: any) => void
}

export function RouteForm({ onRouteGenerated }: RouteFormProps) {
  const {
    origin,
    destination,
    stops,
    budget,
    agents,
    nightsOnRoad,
    nightsAtDestination,
    isLoading,
    error,
    setOrigin,
    setDestination,
    setStops,
    setBudget,
    setAgents,
    setNightsOnRoad,
    setNightsAtDestination,
    setLoading,
    setError,
  } = useFormStore()

  // Calculate total duration
  const totalNights = nightsOnRoad + nightsAtDestination
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

    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both origin and destination')
      return
    }

    if (agents.length === 0) {
      setError('Please select at least one travel interest')
      return
    }

    setError(null)
    setLoading(true)
    setIsSubmitting(true)

    try {
      // Start route generation job
      const response = await fetch('/api/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          stops,
          budget,
          agents,
          nightsOnRoad,
          nightsAtDestination,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start route generation')
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
            destination={destination}
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
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="h-4 w-4 text-green-500" />
                Starting Point
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g., Paris, France"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Navigation className="h-4 w-4 text-red-500" />
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Barcelona, Spain"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Number of Stops */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="h-4 w-4" />
              Number of Stops: <span className="text-slate-900 font-bold">{stops}</span>
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={stops}
              onChange={(e) => setStops(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              style={{
                background: `linear-gradient(to right, #1e293b 0%, #1e293b ${((stops - 1) / 7) * 100}%, #e5e7eb ${((stops - 1) / 7) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 stop</span>
              <span>8 stops</span>
            </div>
          </div>

          {/* Trip Duration */}
          <div className="space-y-6 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Trip Duration</h3>
            </div>

            {/* Nights on Road */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
                <span>Nights traveling from {origin || 'origin'} to {destination || 'destination'}</span>
                <span className="text-purple-600 font-bold text-lg">{nightsOnRoad} nights</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={nightsOnRoad}
                onChange={(e) => setNightsOnRoad(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                style={{
                  background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(nightsOnRoad / 30) * 100}%, #e5e7eb ${(nightsOnRoad / 30) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 nights (direct trip)</span>
                <span>30 nights (epic journey)</span>
              </div>
            </div>

            {/* Nights at Destination */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
                <span>Nights staying at {destination || 'destination'}</span>
                <span className="text-blue-600 font-bold text-lg">{nightsAtDestination} nights</span>
              </label>
              <input
                type="range"
                min="0"
                max="14"
                value={nightsAtDestination}
                onChange={(e) => setNightsAtDestination(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(nightsAtDestination / 14) * 100}%, #e5e7eb ${(nightsAtDestination / 14) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 nights (just passing through)</span>
                <span>14 nights (extended stay)</span>
              </div>
            </div>

            {/* Total Display */}
            <div className="mt-4 pt-4 border-t-2 border-purple-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total Trip Duration:</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalNights} {totalNights === 1 ? 'night' : 'nights'}
                  </div>
                  <div className="text-sm text-gray-600">
                    ({totalDays} {totalDays === 1 ? 'day' : 'days'})
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
