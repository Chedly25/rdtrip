import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpotlightPage } from './components/spotlight/SpotlightPage'
import { useSpotlightStore } from './stores/spotlightStore'
import type { Waypoint } from './types'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Mock data for testing
const mockWaypoints: Waypoint[] = [
  {
    id: '1',
    name: 'Sarlat-la-Canéda',
    order: 0,
    activities: [
      'Hike in the Aveyron Gorges',
      'Visit the local Sunday market',
      'Explore medieval architecture'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
  },
  {
    id: '2',
    name: 'Lyon',
    order: 1,
    activities: [
      'Traboules walking tour',
      'Fine dining in Bouchons',
      'Visit Basilica of Notre-Dame'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800',
  },
  {
    id: '3',
    name: 'Annecy',
    order: 2,
    activities: [
      'Lake cruise',
      'Old town exploration',
      'Mountain paragliding'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=800',
  },
]

function AppContent() {
  const { setWaypoints } = useSpotlightStore()

  useEffect(() => {
    // Load mock data on mount
    setWaypoints(mockWaypoints)
  }, [setWaypoints])

  return <SpotlightPage />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
