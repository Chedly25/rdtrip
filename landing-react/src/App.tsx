import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigation } from './components/Navigation'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Showcase } from './components/Showcase'
import { RouteForm } from './components/RouteForm'
import { RouteResults } from './components/RouteResults'
import { About } from './components/About'
import { Footer } from './components/Footer'
import './App.css'

const queryClient = new QueryClient()

function App() {
  const [routeData, setRouteData] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  const handleRouteGenerated = (data: any) => {
    setRouteData(data)
    setShowResults(true)
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleViewMap = () => {
    if (routeData) {
      localStorage.setItem('spotlightData', JSON.stringify(routeData))
      window.location.href = `/spotlight.html?routeId=${routeData.id || Date.now()}`
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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Navigation />
        {!showResults ? (
          <>
            <Hero />
            <RouteForm onRouteGenerated={handleRouteGenerated} />
            <Features />
            <Showcase />
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
        <Footer />
      </div>
    </QueryClientProvider>
  )
}

export default App
