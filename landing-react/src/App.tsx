import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigation } from './components/Navigation'
import { Hero } from './components/Hero'
import { WorkflowShowcase } from './components/WorkflowShowcase'
import { BeforeAfterComparison } from './components/BeforeAfterComparison'
import { DestinationShowcase } from './components/DestinationShowcase'
import { Features } from './components/Features'
import { RouteForm } from './components/RouteForm'
import { RouteResults } from './components/RouteResults'
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
 * Transform unified route format to legacy agentResults format
 * This allows RouteResults component to work without major changes
 */
function transformUnifiedToLegacy(data: any): any {
  // If it already has agentResults, return as-is (old format)
  if (data.agentResults && data.agentResults.length > 0) {
    return data
  }

  // Check if it's a unified format (has route.waypoints)
  if (data.route && data.route.waypoints) {
    const { route, origin, destination, totalNights, budget, preferences, id } = data

    // Build the recommendations object matching old format
    const recommendations = {
      origin: {
        city: origin.name,
        name: origin.name,
        country: origin.country,
        latitude: origin.coordinates?.[0],
        longitude: origin.coordinates?.[1]
      },
      destination: {
        city: destination.name,
        name: destination.name,
        country: destination.country,
        nights: route.destination?.nights || Math.ceil(totalNights * 0.2),
        latitude: destination.coordinates?.[0],
        longitude: destination.coordinates?.[1]
      },
      waypoints: route.waypoints.map((wp: any) => ({
        city: wp.name,
        name: wp.name,
        country: wp.country,
        nights: wp.nights || 2,
        description: wp.why_this_stop || wp.description || '',
        highlights: wp.highlights || [],
        activities: wp.activities || [],
        restaurants: wp.restaurants || [],
        hotels: wp.hotels || [],
        coordinates: wp.coordinates,
        relevance_score: wp.relevance_score,
        interest_matches: wp.interest_matches
      })),
      alternatives: [],
      narrative: route.narrative || '',
      metrics: route.metrics || {}
    }

    // Create a single "Your Route" agent result
    return {
      id,
      origin: origin.name,
      destination: destination.name,
      totalNights,
      budget,
      preferences,
      agentResults: [
        {
          agent: 'your-route',
          agentConfig: {
            name: 'Your Perfect Route',
            color: '#191C1F',
            icon: '/images/icons/best_icon.png'
          },
          recommendations: JSON.stringify(recommendations),
          metrics: route.metrics || {}
        }
      ]
    }
  }

  // Fallback: return as-is
  return data
}

function HomePage() {
  const location = useLocation()
  const [routeData, setRouteData] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  // Handle route data passed from MyRoutes page
  useEffect(() => {
    if (location.state?.routeData) {
      const transformed = transformUnifiedToLegacy(location.state.routeData)
      setRouteData(transformed)
      setShowResults(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.state])

  const handleRouteGenerated = (data: any) => {
    // Transform unified format to legacy format for RouteResults compatibility
    const transformed = transformUnifiedToLegacy(data)
    setRouteData(transformed)
    setShowResults(true)
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleViewMap = (agent?: string) => {
    if (routeData) {
      // If agent is specified, filter the route data to only that agent
      const dataToStore = agent
        ? {
            ...routeData,
            agentResults: routeData.agentResults.filter((ar: any) => ar.agent === agent),
            agent: agent // Set the primary agent
          }
        : routeData

      localStorage.setItem('spotlightData', JSON.stringify(dataToStore))
      // Use new React-based spotlight page
      window.location.href = `/spotlight/${routeData.id || Date.now()}`
    }
  }

  const handleStartOver = () => {
    setShowResults(false)
    setRouteData(null)
    setTimeout(() => {
      const formElement = document.getElementById('route-form')
      formElement?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <>
      {!showResults ? (
        <>
          <Hero />
          <WorkflowShowcase />
          <BeforeAfterComparison />
          <DestinationShowcase />
          <RouteForm onRouteGenerated={handleRouteGenerated} />
          <Features />
          <About />
        </>
      ) : (
        <div className="pt-20">
          <RouteResults
            routeData={routeData}
            onViewMap={handleViewMap}
            onStartOver={handleStartOver}
          />
        </div>
      )}
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
