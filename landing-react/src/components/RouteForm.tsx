import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Users } from 'lucide-react'
import { useFormStore } from '../stores/formStore'
import { BudgetSelector } from './BudgetSelector'
import { AgentSelector } from './AgentSelector'

export function RouteForm() {
  const {
    origin,
    destination,
    stops,
    budget,
    agents,
    isLoading,
    error,
    setOrigin,
    setDestination,
    setStops,
    setBudget,
    setAgents,
    setLoading,
    setError,
  } = useFormStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // Submit to backend API
      const response = await fetch('/api/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          stops,
          budget,
          agents,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate route')
      }

      const data = await response.json()

      // Store the route data and redirect to spotlight
      localStorage.setItem('spotlightData', JSON.stringify(data))
      window.location.href = `/spotlight.html?routeId=${data.id}`
    } catch (err) {
      console.error('Route generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate route')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <section id="route-form" className="relative bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto max-w-4xl px-4">
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
      </div>
    </section>
  )
}
