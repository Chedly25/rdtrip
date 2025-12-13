/**
 * App.tsx
 *
 * Unified application combining landing page and trip planning features.
 * Clean URL structure:
 *   /                    Landing page
 *   /discover            Discovery phase
 *   /generate            Generation phase
 *   /route/:id           Route view (SpotlightV2)
 *   /today               Active trip view
 *   /my-routes           User's saved routes
 *   /shared/:token       Shared route view
 *   /marketplace         Route marketplace
 *   /marketplace/:slug   Individual marketplace route
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Lazy-loaded app phase components for better performance
const SpotlightV2 = lazy(() => import('./components/spotlight/v2/SpotlightV2'))
const ItineraryGenerationPage = lazy(() => import('./components/itinerary/ItineraryGenerationPage').then(m => ({ default: m.ItineraryGenerationPage })))
const ItineraryPage = lazy(() => import('./components/itinerary/ItineraryPage').then(m => ({ default: m.ItineraryPage })))
const TodayView = lazy(() => import('./components/today/TodayView').then(m => ({ default: m.TodayView })))
const DiscoveryPhaseContainer = lazy(() => import('./components/discovery').then(m => ({ default: m.DiscoveryPhaseContainer })))
import { AgentProvider } from './contexts/AgentProvider'
import { CompanionProvider } from './contexts/CompanionProvider'
import { AuthProvider } from './contexts/AuthContext'
import { IdeasBoardProvider } from './contexts/IdeasBoardContext'
import { AgentModal } from './components/agent/AgentModal'
import { IdeasBoardPanel } from './components/agent/IdeasBoard'
import { ActionConfirmation } from './components/agent/ActionConfirmation'
import { PageTransition } from './components/transitions'
import { ErrorBoundary } from './components/ErrorBoundary'

// Landing page components
import { Navigation } from './components/landing/Navigation'
import { Hero } from './components/landing/Hero'
import { DestinationShowcase } from './components/landing/DestinationShowcase'
import { Features } from './components/landing/Features'
import { About } from './components/landing/About'
import { Footer } from './components/landing/Footer'

// Entry form - Simplified 4-input form (WI-0.1)
import { NewTripPage } from './components/entry/NewTripPage'

// Lazy-loaded pages for better performance
const MyRoutes = lazy(() => import('./pages/MyRoutes'))
const SharedRoute = lazy(() => import('./pages/SharedRoute'))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
const RouteDetailPage = lazy(() => import('./pages/RouteDetailPage'))
const PlanningPage = lazy(() => import('./pages/PlanningPage'))

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

/**
 * Landing Page - Full marketing experience with SimplifiedEntryForm
 * Includes: Hero, Simplified Form (4 inputs), DestinationShowcase, Features, About, Footer
 * The simplified form replaces the old complex RouteForm (WI-0.1)
 */
function LandingPage() {
  return (
    <>
      <Navigation />
      <Hero />
      <section id="route-form" className="py-16 bg-rui-grey-2">
        <div className="max-w-lg mx-auto px-6">
          <NewTripPage />
        </div>
      </section>
      <DestinationShowcase />
      <Features />
      <About />
      <Footer />
    </>
  )
}

/**
 * Route View Handler
 * Handles /route/:id URLs for viewing routes
 *
 * IMPORTANT: Routes with discovery-* IDs redirect to /discover
 * These are ephemeral discovery session IDs, not persisted routes
 */
function RouteViewHandler() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const itineraryId = searchParams.get('itinerary')

  // Redirect discovery-* routes back to discovery phase
  // These IDs are ephemeral session IDs from the new discovery flow
  if (id?.startsWith('discovery-')) {
    return <Navigate to="/discover" replace />
  }

  // Pass route ID via URL search params for SpotlightV2 compatibility
  if (id) {
    return (
      <PageTransition variant="scale">
        <SpotlightV2 routeId={id} itineraryId={itineraryId || undefined} />
      </PageTransition>
    )
  }

  return <Navigate to="/" replace />
}

/**
 * Legacy Route Handler
 * Handles old /spotlight-new URLs with query params and redirects to clean URLs
 */
function LegacyRouteHandler() {
  const [searchParams] = useSearchParams()
  const routeId = searchParams.get('routeId')
  const itineraryId = searchParams.get('itinerary')

  if (routeId) {
    const newUrl = `/route/${routeId}${itineraryId ? `?itinerary=${itineraryId}` : ''}`
    return <Navigate to={newUrl} replace />
  }

  return <Navigate to="/" replace />
}

/**
 * Loading fallback for lazy-loaded components
 */
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rui-grey-2">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-rui-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-rui-grey-50 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AgentProvider>
              <IdeasBoardProvider>
                <CompanionProvider>
                  <div className="min-h-screen">
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      {/* Landing Page - Root */}
                      <Route path="/" element={<LandingPage />} />

                      {/* User's Saved Routes */}
                      <Route
                        path="/my-routes"
                        element={
                          <>
                            <Navigation />
                            <MyRoutes />
                            <Footer />
                          </>
                        }
                      />

                      {/* Shared Route View */}
                      <Route
                        path="/shared/:token"
                        element={
                          <>
                            <Navigation />
                            <SharedRoute />
                            <Footer />
                          </>
                        }
                      />

                      {/* Marketplace */}
                      <Route
                        path="/marketplace"
                        element={
                          <>
                            <Navigation />
                            <MarketplacePage />
                            <Footer />
                          </>
                        }
                      />

                      {/* Marketplace Route Detail */}
                      <Route
                        path="/marketplace/:slug"
                        element={
                          <>
                            <Navigation />
                            <RouteDetailPage />
                            <Footer />
                          </>
                        }
                      />

                      {/* === App Phase Routes (no Navigation/Footer) === */}

                      {/* Discovery Phase - Explore suggested cities */}
                      <Route
                        path="/discover"
                        element={
                          <PageTransition variant="slideRight">
                            <DiscoveryPhaseContainer />
                          </PageTransition>
                        }
                      />

                      {/* Planning Phase - Build trip itinerary with clusters */}
                      <Route
                        path="/plan/:routeId"
                        element={
                          <PageTransition variant="slideRight">
                            <PlanningPage />
                          </PageTransition>
                        }
                      />

                      {/* Generation Phase - AI itinerary creation (Legacy) */}
                      <Route
                        path="/generate"
                        element={
                          <PageTransition variant="slideRight">
                            <ItineraryGenerationPage />
                          </PageTransition>
                        }
                      />

                      {/* NEW Itinerary Page - Beautiful editorial experience */}
                      <Route
                        path="/itinerary"
                        element={
                          <PageTransition variant="scale">
                            <ItineraryPage />
                          </PageTransition>
                        }
                      />

                      {/* Route View - Clean URL with route ID */}
                      <Route
                        path="/route/:id"
                        element={<RouteViewHandler />}
                      />

                      {/* Today View - Active trip GPS-aware view */}
                      <Route
                        path="/today"
                        element={
                          <PageTransition variant="slideUp">
                            <TodayView />
                          </PageTransition>
                        }
                      />

                      {/* Legacy: Handle old /spotlight-new URLs */}
                      <Route path="/spotlight-new" element={<LegacyRouteHandler />} />
                      <Route path="/spotlight-new/*" element={<LegacyRouteHandler />} />

                      {/* Legacy: Handle old /spotlight URLs */}
                      <Route path="/spotlight" element={<LegacyRouteHandler />} />

                      {/* Catch-all: Redirect to landing page */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </div>

                  {/* AI Agent Modal - Available for full-screen agent interactions */}
                  <AgentModal />

                  {/* Ideas Board - Vintage scrapbook for agent recommendations */}
                  <IdeasBoardPanel />

                  {/* Action Confirmation Toast - Shows when agent modifies itinerary */}
                  <ActionConfirmation />
                </CompanionProvider>
              </IdeasBoardProvider>
            </AgentProvider>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
