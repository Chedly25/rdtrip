import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Zap } from 'lucide-react'
import { useFormStore } from '../stores/formStore'
import { BudgetSelector } from './BudgetSelector'
import { CompanionSelector } from './CompanionSelector'
import { InterestSelector } from './InterestSelector'
import { TripStyleSlider } from './TripStyleSlider'
import { RouteGenerationLoading } from './RouteGenerationLoading'
import { CitySelector } from './CitySelector'
import { TripStoryInput, PersonalizationAccordion } from './personalization'
import type { TripPersonalization } from '../types'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

// Check if any personalization field has a value
function hasPersonalization(p: TripPersonalization): boolean {
  return !!(
    p.tripStory ||
    p.occasion ||
    p.travelStyle ||
    p.pace !== undefined ||
    (p.interests && p.interests.length > 0) ||
    p.diningStyle ||
    (p.dietary && p.dietary.length > 0) ||
    p.budget ||
    p.accommodation ||
    (p.accessibility && p.accessibility.length > 0) ||
    p.avoidCrowds ||
    p.preferOutdoor
  )
}

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
    totalNights,
    tripPace,
    preferences,
    personalization,
    isLoading,
    error,
    originError,
    destinationError,
    setOrigin,
    setDestination,
    setOriginError,
    setDestinationError,
    setBudget,
    setTotalNights,
    setTripPace,
    setCompanions,
    toggleInterest,
    setInterestWeight,
    setTripStyle,
    setTripStory,
    setPersonalization,
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

    if (preferences.interests.length === 0) {
      setError('Please select at least one interest')
      return
    }

    setOriginError(null)
    setDestinationError(null)
    setError(null)
    setLoading(true)
    setIsSubmitting(true)

    try {
      // Start unified route generation
      const response = await fetch('/api/generate-unified-route', {
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
          preferences,
          // Include personalization for AI-enhanced route generation
          // Send if any personalization field has a value (not just tripStory)
          personalization: hasPersonalization(personalization) ? personalization : undefined,
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
    <section id="route-form" className="relative bg-rui-white py-24">
      <div className="mx-auto max-w-5xl px-4">
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: ruiEasing }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 font-marketing text-display-2 text-rui-black lg:text-display-1">
              Plan Your Journey
            </h2>
            <p className="text-body-1 text-rui-grey-50">
              Tell us where you want to go, and we'll create a personalized route
            </p>
          </motion.div>
        )}

        {/* Show loading component when generating route */}
        {isLoading && (
          <RouteGenerationLoading
            progress={progress}
            destination={destination?.name || ''}
            preferences={preferences}
          />
        )}

        {/* Show form when not loading */}
        {!isLoading && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: ruiEasing }}
            className="space-y-6 rounded-rui-32 bg-rui-white p-8 shadow-rui-3 border border-rui-grey-10"
          >
            {/* Origin and Destination */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Origin */}
              <CitySelector
                value={origin}
                label="Starting From"
                placeholder="Enter your starting city"
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
                transition={{ duration: 0.3, ease: ruiEasing }}
                className="rounded-rui-16 bg-rui-grey-2 p-4"
              >
                <p className="text-sm text-rui-grey-50">
                  <span className="font-semibold text-rui-black">
                    {calculateDistance(origin.coordinates, destination.coordinates).toFixed(0)} km
                  </span>
                  {' '}road trip from <span className="font-semibold text-rui-black">{origin.name}</span> to <span className="font-semibold text-rui-black">{destination.name}</span>
                </p>
              </motion.div>
            )}

            {/* Trip Story - Free-form personalization */}
            <TripStoryInput
              value={personalization.tripStory}
              onChange={setTripStory}
            />

            {/* Advanced Personalization - Collapsed by default */}
            <PersonalizationAccordion
              value={{
                occasion: personalization.occasion,
                travelStyle: personalization.travelStyle,
                pace: personalization.pace,
                interests: personalization.interests,
                diningStyle: personalization.diningStyle,
                dietary: personalization.dietary,
                budget: personalization.budget,
                accommodation: personalization.accommodation,
                accessibility: personalization.accessibility,
                avoidCrowds: personalization.avoidCrowds,
                preferOutdoor: personalization.preferOutdoor,
              }}
              onChange={(data) => setPersonalization(data)}
            />

            {/* Trip Pace */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-rui-black">
                <Zap className="h-4 w-4 text-rui-grey-50" />
                Trip Pace
              </label>
              <div className="flex gap-2 p-1 bg-rui-grey-2 rounded-rui-16">
                {[
                  { id: 'leisurely', emoji: '🚶', label: 'Leisurely', sub: '2-4 cities' },
                  { id: 'balanced', emoji: '🚶‍♂️', label: 'Balanced', sub: '3-5 cities' },
                  { id: 'fast-paced', emoji: '🏃', label: 'Fast-Paced', sub: '4-7 cities' },
                ].map((pace) => (
                  <button
                    key={pace.id}
                    type="button"
                    onClick={() => setTripPace(pace.id as 'leisurely' | 'balanced' | 'fast-paced')}
                    className={`flex-1 rounded-rui-12 p-4 transition-all duration-rui-sm ease-rui-default ${
                      tripPace === pace.id
                        ? 'bg-rui-white shadow-rui-2'
                        : 'bg-transparent hover:bg-rui-white/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{pace.emoji}</div>
                    <div className="font-semibold text-rui-black text-sm">{pace.label}</div>
                    <div className="text-xs text-rui-grey-50 mt-0.5">{pace.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Duration */}
            <div className="space-y-4 rounded-rui-16 bg-rui-grey-2 p-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rui-grey-50" />
                <h3 className="text-sm font-bold text-rui-black">Trip Duration</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-rui-grey-50">How long is your trip?</span>
                  <span className="text-rui-black font-bold text-2xl">{totalNights}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={totalNights}
                  onChange={(e) => setTotalNights(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--rui-color-accent) 0%, var(--rui-color-accent) ${((totalNights - 3) / 27) * 100}%, var(--rui-color-grey-10) ${((totalNights - 3) / 27) * 100}%, var(--rui-color-grey-10) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-rui-grey-50">
                  <span>3 nights</span>
                  <span>30 nights</span>
                </div>

                {/* Days Display */}
                <div className="pt-3 border-t border-rui-grey-10">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-rui-black">
                      {totalDays} {totalDays === 1 ? 'day' : 'days'} total
                    </div>
                    <div className="text-xs text-rui-grey-50 mt-0.5">
                      AI determines optimal cities for your pace
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Who's Traveling */}
            <CompanionSelector
              selected={preferences.companions}
              onChange={setCompanions}
            />

            {/* Interests */}
            <InterestSelector
              selected={preferences.interests}
              onToggle={toggleInterest}
              onWeightChange={setInterestWeight}
            />

            {/* Trip Style */}
            <TripStyleSlider
              value={preferences.tripStyle}
              onChange={setTripStyle}
            />

            {/* Budget Selector */}
            <BudgetSelector selected={budget} onChange={setBudget} />

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: ruiEasing }}
                className="rounded-rui-12 bg-danger/10 p-4 text-sm text-danger"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="group relative w-full overflow-hidden rounded-rui-16 bg-rui-accent px-8 py-4 text-base font-semibold text-rui-white transition-all duration-rui-sm ease-rui-default hover:shadow-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              {/* State layer */}
              <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-rui-sm group-hover:opacity-10 group-disabled:group-hover:opacity-0" />

              {isLoading || isSubmitting ? (
                <span className="relative flex items-center justify-center gap-3">
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
                <span className="relative">Generate My Route</span>
              )}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  )
}
