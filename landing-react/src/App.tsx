import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigation } from './components/Navigation'
import { Hero } from './components/Hero'
import { AgentShowcase } from './components/AgentShowcase'
import { Features } from './components/Features'
import { RouteForm } from './components/RouteForm'
import { RouteResults } from './components/RouteResults'
import { About } from './components/About'
import { Footer } from './components/Footer'
import MyRoutes from './pages/MyRoutes'
import SharedRoute from './pages/SharedRoute'
import './App.css'

const queryClient = new QueryClient()

function HomePage() {
  const location = useLocation()
  const [routeData, setRouteData] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  // Handle route data passed from MyRoutes page
  useEffect(() => {
    if (location.state?.routeData) {
      setRouteData(location.state.routeData)
      setShowResults(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.state])

  const handleRouteGenerated = (data: any) => {
    setRouteData(data)
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
      window.location.href = `/spotlight.html?routeId=${routeData.id || Date.now()}&agent=${agent || 'adventure'}`
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
          <AgentShowcase />
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
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
