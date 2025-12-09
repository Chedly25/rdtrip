import { useState, useEffect, useRef } from 'react'

const API_BASE = 'https://rdtrip-4d4035861576.herokuapp.com'

interface CityDetail {
  cityName: string
  country: string
  tagline: string
  mainImageUrl: string | null
  rating: number
  recommendedDuration: string
  whyVisit: string
  bestFor: string[]
  highlights: Array<{
    name: string
    description: string
    duration: string
    rating: number
    type: string
  }>
  restaurants: Array<{
    name: string
    cuisine: string
    priceRange: string
    description: string
    rating: number
    specialty: string
    imageUrl?: string
    website?: string
    googleMapsUrl?: string
    address?: string
    reviewCount?: number
    tripAdvisorRating?: number
    badges?: string[]
  }>
  accommodations: Array<{
    areaName: string
    description: string
    priceFrom: string
    bestFor: string
    imageUrl?: string
    bookingUrl?: string
    hotelExample?: string
    rating?: number
    reviewCount?: number
    badges?: string[]
  }>
  parking: {
    info: string
    difficulty: string
  } | null
  environmentalZones: {
    hasRestrictions: boolean
    type: string
    description: string
    advice: string
  } | null
  bestTimeToVisit: {
    ideal: string
    reasoning: string
    avoid: string
  } | null
  eventsFestivals: Array<{
    name: string
    month: string
    description: string
    imageUrl?: string
    website?: string
    ticketUrl?: string
    dates?: string
    popularity?: string
    badges?: string[]
  }>
  localTips: string[]
  warnings: string[]
  weatherOverview: string
  coordinates: {
    latitude: number
    longitude: number
  } | null
}

interface AsyncCityDetailsState {
  data: CityDetail | null
  quickData: CityDetail | null // Phase 1 data
  loading: boolean
  error: string | null
  progress: number
  message: string
  phase: 'quick' | 'complete' | null // Track which phase we're in
}

// Rotating loading messages - engaging and informative
const LOADING_MESSAGES = [
  { message: '🔍 Discovering hidden gems in the city...', minProgress: 0 },
  { message: '🏛️ Analyzing top landmarks and attractions...', minProgress: 10 },
  { message: '🍽️ Finding the best restaurants for you...', minProgress: 20 },
  { message: '🏨 Searching for perfect accommodations...', minProgress: 30 },
  { message: '🎉 Checking out local events and festivals...', minProgress: 40 },
  { message: '💡 Gathering insider tips from locals...', minProgress: 50 },
  { message: '🚗 Analyzing parking and transportation options...', minProgress: 60 },
  { message: '🌤️ Checking weather patterns and best times to visit...', minProgress: 70 },
  { message: '📸 Finding beautiful images for your journey...', minProgress: 80 },
  { message: '✨ Putting the final touches together...', minProgress: 90 }
]

export function useAsyncCityDetails(cityName: string, country?: string, isOpen?: boolean) {
  const [state, setState] = useState<AsyncCityDetailsState>({
    data: null,
    quickData: null,
    loading: false,
    error: null,
    progress: 0,
    message: '',
    phase: null
  })

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messageRotationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentJobIdRef = useRef<string | null>(null)
  const pollingFailuresRef = useRef<number>(0)
  const MAX_POLLING_FAILURES = 3

  // Get appropriate loading message based on progress
  const getLoadingMessage = (progress: number): string => {
    for (let i = LOADING_MESSAGES.length - 1; i >= 0; i--) {
      if (progress >= LOADING_MESSAGES[i].minProgress) {
        return LOADING_MESSAGES[i].message
      }
    }
    return LOADING_MESSAGES[0].message
  }

  // Cleanup function
  const cleanup = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (messageRotationRef.current) {
      clearInterval(messageRotationRef.current)
      messageRotationRef.current = null
    }
    currentJobIdRef.current = null
    pollingFailuresRef.current = 0
  }

  // Poll job status with retry logic
  const pollJobStatus = async (jobId: string) => {
    console.log(`📡 [useAsyncCityDetails] Polling job: ${jobId}`)

    try {
      const response = await fetch(`${API_BASE}/api/cities/details/job/${jobId}`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout for polling requests
      })

      console.log(`📡 [useAsyncCityDetails] Poll response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`📡 [useAsyncCityDetails] Poll result:`, result)

      // Reset failure counter on successful poll
      pollingFailuresRef.current = 0

      if (!result.success) {
        // Job not found or failed
        console.warn(`⚠️  [useAsyncCityDetails] Job failed or not found`)
        cleanup()
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to load city details',
          message: ''
        }))
        return
      }

      // Update progress and message
      const progress = result.progress || 0
      const message = getLoadingMessage(progress)

      console.log(`📊 [useAsyncCityDetails] Progress: ${progress}%, Message: ${message}, Status: ${result.status}`)

      // ========== PHASE DETECTION ==========
      // Check if we got Phase 1 (quick) data
      if (result.status === 'processing' && result.data && progress >= 40 && progress < 90) {
        console.log(`🚀 [useAsyncCityDetails] Phase 1 (Quick) data received! Showing partial content...`)
        setState(prev => ({
          ...prev,
          quickData: result.data,
          loading: false, // CRITICAL: Exit loading state so content shows!
          phase: 'quick',
          progress,
          message: '✨ Loading detailed information...'
        }))
        // Keep polling for Phase 2
        return
      }

      // Check if job is complete (Phase 2 done)
      if (result.status === 'complete' && result.data) {
        console.log(`✅ [useAsyncCityDetails] Phase 2 (Complete) - Job fully complete!`)
        cleanup()
        setState({
          data: result.data,
          quickData: null, // Clear quick data once we have full data
          loading: false,
          error: null,
          progress: 100,
          message: 'Complete!',
          phase: 'complete'
        })
      } else if (result.status === 'failed') {
        console.error(`❌ [useAsyncCityDetails] Job failed:`, result.error)
        cleanup()
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to generate city details',
          message: '',
          phase: null
        }))
      } else {
        // Still processing (Phase 1 not done yet or between phases)
        console.log(`⏳ [useAsyncCityDetails] Job still processing (progress: ${progress}%), will poll again in 2s`)
        setState(prev => ({
          ...prev,
          progress,
          message
        }))
      }
      // Otherwise keep polling (status is 'processing')
    } catch (error: any) {
      console.error('❌ [useAsyncCityDetails] Polling error:', error)
      pollingFailuresRef.current++

      // If we've failed too many times, give up
      if (pollingFailuresRef.current >= MAX_POLLING_FAILURES) {
        console.error(`❌ [useAsyncCityDetails] Too many polling failures (${MAX_POLLING_FAILURES}), giving up`)
        cleanup()
        setState(prev => ({
          ...prev,
          loading: false,
          error: '🌐 Connection lost. Please check your internet and try again.',
          message: ''
        }))
      } else {
        // Otherwise, just log and continue polling (will retry on next interval)
        console.warn(`⚠️  [useAsyncCityDetails] Polling failure ${pollingFailuresRef.current}/${MAX_POLLING_FAILURES}, will retry...`)
      }
    }
  }

  // Start async city details generation
  const startAsyncGeneration = async () => {
    console.log(`🎬 [useAsyncCityDetails] Starting async generation for: ${cityName}${country ? `, ${country}` : ''}`)

    try {
      console.log('📊 [useAsyncCityDetails] Setting initial loading state...')
      setState({
        data: null,
        quickData: null,
        loading: true,
        error: null,
        progress: 0,
        message: getLoadingMessage(0),
        phase: null
      })

      console.log(`🌐 [useAsyncCityDetails] Calling API: POST ${API_BASE}/api/cities/details/async`)

      // Call the async endpoint
      const response = await fetch(`${API_BASE}/api/cities/details/async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cityName, country })
      })

      console.log(`📥 [useAsyncCityDetails] Got response status: ${response.status}`)

      const result = await response.json()
      console.log(`📦 [useAsyncCityDetails] Response data:`, result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to start city details generation')
      }

      // Check if cached (instant return)
      if (result.cached && result.data) {
        console.log(`✅ [useAsyncCityDetails] Cache HIT! Loading instantly. Timing:`, result.timing)
        setState({
          data: result.data,
          quickData: null,
          loading: false,
          error: null,
          progress: 100,
          message: 'Loaded from cache!',
          phase: 'complete'
        })
        return
      }

      // Not cached - start polling
      const jobId = result.jobId
      currentJobIdRef.current = jobId

      console.log(`🚀 [useAsyncCityDetails] Cache MISS - Started background job: ${jobId}`)
      console.log(`⏱️  [useAsyncCityDetails] Setting up polling every 2 seconds...`)

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        if (currentJobIdRef.current === jobId) {
          console.log(`🔄 [useAsyncCityDetails] Polling job status...`)
          pollJobStatus(jobId)
        }
      }, 2000)

      // Immediately poll once
      console.log(`🔄 [useAsyncCityDetails] Immediate first poll...`)
      pollJobStatus(jobId)

    } catch (error: any) {
      console.error('❌ [useAsyncCityDetails] Error starting async generation:', error)
      setState({
        data: null,
        quickData: null,
        loading: false,
        error: error.message || 'Failed to load city information',
        progress: 0,
        message: '',
        phase: null
      })
    }
  }

  // Retry function
  const retry = () => {
    cleanup()
    startAsyncGeneration()
  }

  // Effect to start generation when modal opens
  useEffect(() => {
    console.log(`🔌 [useAsyncCityDetails] Effect triggered - isOpen: ${isOpen}, cityName: ${cityName}, country: ${country}`)

    if (isOpen && cityName) {
      console.log(`▶️  [useAsyncCityDetails] Modal is open, starting generation...`)
      startAsyncGeneration()
    } else {
      console.log(`⏸️  [useAsyncCityDetails] Modal closed or no city name, skipping...`)
    }

    // Cleanup on unmount or when modal closes
    return () => {
      console.log(`🧹 [useAsyncCityDetails] Cleaning up...`)
      cleanup()
    }
  }, [isOpen, cityName, country])

  return {
    data: state.data,
    quickData: state.quickData,
    loading: state.loading,
    error: state.error,
    progress: state.progress,
    message: state.message,
    phase: state.phase,
    retry
  }
}
