import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigation } from './components/Navigation'
import { Hero } from './components/Hero'
import { WorkflowShowcase } from './components/WorkflowShowcase'
import { BeforeAfterComparison } from './components/BeforeAfterComparison'
import { DestinationShowcase } from './components/DestinationShowcase'
import { Features } from './components/Features'
import { RouteForm } from './components/RouteForm'
import { About } from './components/About'
import { Footer } from './components/Footer'
import MyRoutes from './pages/MyRoutes'
import SharedRoute from './pages/SharedRoute'
import MarketplacePage from './pages/MarketplacePage'
import RouteDetailPage from './pages/RouteDetailPage'
import SpotlightPage from './pages/SpotlightPage'
import './App.css'

const queryClient = new QueryClient()

/**
 * Transform route data to Spotlight format
 * Extracts cities with proper coordinate format [lng, lat] for Mapbox
 */
function transformToSpotlightFormat(data: any): {
  id: string
  cities: Array<{
    name: string
    country?: string
    coordinates: [number, number] // [lng, lat] for Mapbox
    nights?: number
    description?: string
    highlights?: string[]
    activities?: any[]
    restaurants?: any[]
    hotels?: any[]
  }>
  origin: { name: string; country?: string; coordinates: [number, number] }
  destination: { name: string; country?: string; coordinates: [number, number]; nights?: number }
  totalNights: number
  narrative?: string
} {
  const routeId = data.id || `route_${Date.now()}`

  // Handle unified format (route.waypoints)
  if (data.route && data.route.waypoints) {
    const { route, origin, destination, totalNights } = data

    // Convert coordinates from [lat, lng] to [lng, lat] for Mapbox
    const toMapboxCoords = (coords: [number, number]): [number, number] => {
      if (!coords || coords.length !== 2) return [0, 0]
      return [coords[1], coords[0]] // Swap lat/lng to lng/lat
    }

    const cities = route.waypoints.map((wp: any) => ({
      name: wp.name,
      country: wp.country,
      coordinates: toMapboxCoords(wp.coordinates),
      nights: wp.nights || 2,
      description: wp.why_this_stop || wp.description || '',
      highlights: wp.highlights || [],
      activities: wp.activities || [],
      restaurants: wp.restaurants || [],
      hotels: wp.hotels || []
    }))

    return {
      id: routeId,
      cities,
      origin: {
        name: origin.name,
        country: origin.country,
        coordinates: toMapboxCoords(origin.coordinates)
      },
      destination: {
        name: destination.name,
        country: destination.country,
        coordinates: toMapboxCoords(destination.coordinates),
        nights: route.destination?.nights || Math.ceil(totalNights * 0.2)
      },
      totalNights,
      narrative: route.narrative
    }
  }

  // Handle legacy agentResults format
  if (data.agentResults && data.agentResults.length > 0) {
    const agentResult = data.agentResults[0]
    let parsedRecs: any = {}

    try {
      parsedRecs = JSON.parse(agentResult.recommendations)
    } catch {
      parsedRecs = {}
    }

    const toMapboxCoords = (lat: number, lng: number): [number, number] => [lng, lat]

    const waypoints = Array.isArray(parsedRecs.waypoints) ? parsedRecs.waypoints : []

    const cities = waypoints.map((wp: any) => ({
      name: wp.city || wp.name,
      country: wp.country,
      coordinates: wp.coordinates
        ? [wp.coordinates[1], wp.coordinates[0]] as [number, number] // Swap if stored as [lat, lng]
        : toMapboxCoords(wp.latitude || 0, wp.longitude || 0),
      nights: wp.nights || 2,
      description: wp.why || wp.description || '',
      highlights: wp.highlights || [],
      activities: wp.activities || [],
      restaurants: wp.restaurants || [],
      hotels: wp.hotels || []
    }))

    return {
      id: routeId,
      cities,
      origin: {
        name: parsedRecs.origin?.city || parsedRecs.origin?.name || data.origin,
        country: parsedRecs.origin?.country,
        coordinates: toMapboxCoords(
          parsedRecs.origin?.latitude || 0,
          parsedRecs.origin?.longitude || 0
        )
      },
      destination: {
        name: parsedRecs.destination?.city || parsedRecs.destination?.name || data.destination,
        country: parsedRecs.destination?.country,
        coordinates: toMapboxCoords(
          parsedRecs.destination?.latitude || 0,
          parsedRecs.destination?.longitude || 0
        ),
        nights: parsedRecs.destination?.nights
      },
      totalNights: data.totalNights || waypoints.reduce((sum: number, wp: any) => sum + (wp.nights || 2), 0),
      narrative: parsedRecs.narrative
    }
  }

  // Fallback empty response
  return {
    id: routeId,
    cities: [],
    origin: { name: 'Unknown', coordinates: [0, 0] },
    destination: { name: 'Unknown', coordinates: [0, 0] },
    totalNights: 0
  }
}

function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Handle route data passed from MyRoutes page - redirect to Spotlight
  useEffect(() => {
    if (location.state?.routeData) {
      const spotlightData = transformToSpotlightFormat(location.state.routeData)
      localStorage.setItem('spotlightData', JSON.stringify(spotlightData))
      navigate(`/spotlight/${spotlightData.id}`)
    }
  }, [location.state, navigate])

  const handleRouteGenerated = (data: any) => {
    // Transform to Spotlight format and navigate directly
    const spotlightData = transformToSpotlightFormat(data)
    localStorage.setItem('spotlightData', JSON.stringify(spotlightData))
    navigate(`/spotlight/${spotlightData.id}`)
  }

  return (
    <>
      <Hero />
      <WorkflowShowcase />
      <BeforeAfterComparison />
      <DestinationShowcase />
      <RouteForm onRouteGenerated={handleRouteGenerated} />
      <Features />
      <About />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-routes" element={<MyRoutes />} />
            <Route path="/shared/:token" element={<SharedRoute />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:slug" element={<RouteDetailPage />} />
            <Route path="/spotlight/:routeId" element={<SpotlightPage />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
