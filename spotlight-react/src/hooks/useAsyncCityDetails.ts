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
  loading: boolean
  error: string | null
  progress: number
  message: string
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
    loading: false,
    error: null,
    progress: 0,
    message: ''
  })

  const pollingIntervalRef = useRef<number | null>(null)
  const messageRotationRef = useRef<number | null>(null)
  const currentJobIdRef = useRef<string | null>(null)

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
  }

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/cities/details/job/${jobId}`)
      const result = await response.json()

      if (!result.success) {
        // Job not found or failed
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

      setState(prev => ({
        ...prev,
        progress,
        message
      }))

      // Check if job is complete
      if (result.status === 'complete' && result.data) {
        cleanup()
        setState({
          data: result.data,
          loading: false,
          error: null,
          progress: 100,
          message: 'Complete!'
        })
      } else if (result.status === 'failed') {
        cleanup()
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to generate city details',
          message: ''
        }))
      }
      // Otherwise keep polling (status is 'processing')
    } catch (error: any) {
      console.error('Polling error:', error)
      cleanup()
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error while checking status',
        message: ''
      }))
    }
  }

  // Start async city details generation
  const startAsyncGeneration = async () => {
    try {
      setState({
        data: null,
        loading: true,
        error: null,
        progress: 0,
        message: getLoadingMessage(0)
      })

      // Call the async endpoint
      const response = await fetch(`${API_BASE}/api/cities/details/async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cityName, country })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to start city details generation')
      }

      // Check if cached (instant return)
      if (result.cached && result.data) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          progress: 100,
          message: 'Loaded from cache!'
        })
        return
      }

      // Not cached - start polling
      const jobId = result.jobId
      currentJobIdRef.current = jobId

      console.log(`🚀 Started background job: ${jobId}`)

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        if (currentJobIdRef.current === jobId) {
          pollJobStatus(jobId)
        }
      }, 2000)

      // Immediately poll once
      pollJobStatus(jobId)

    } catch (error: any) {
      console.error('Error starting async generation:', error)
      setState({
        data: null,
        loading: false,
        error: error.message || 'Failed to load city information',
        progress: 0,
        message: ''
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
    if (isOpen && cityName) {
      startAsyncGeneration()
    }

    // Cleanup on unmount or when modal closes
    return () => {
      cleanup()
    }
  }, [isOpen, cityName, country])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    progress: state.progress,
    message: state.message,
    retry
  }
}
