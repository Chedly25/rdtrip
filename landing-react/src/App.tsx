import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import { ErrorBoundary } from './components/ErrorBoundary'
import MyRoutes from './pages/MyRoutes'
import SharedRoute from './pages/SharedRoute'
import MarketplacePage from './pages/MarketplacePage'
import RouteDetailPage from './pages/RouteDetailPage'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function HomePage() {
  // RouteForm handles navigation to /spotlight-new/ directly after generation
  return (
    <>
      <Hero />
      <WorkflowShowcase />
      <BeforeAfterComparison />
      <DestinationShowcase />
      <RouteForm />
      <Features />
      <About />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
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
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
