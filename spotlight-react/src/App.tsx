/**
 * App.tsx
 *
 * Main application component with routing and providers.
 * WI-11.2: Added page transitions between major phases.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Route, Navigate, useSearchParams } from 'react-router-dom'
import SpotlightV2 from './components/spotlight/v2/SpotlightV2'
import { ItineraryGenerationPage } from './components/itinerary/ItineraryGenerationPage'
import { TodayView } from './components/today/TodayView'
import { NewTripPage } from './components/entry/NewTripPage'
import { DiscoveryPhaseContainer } from './components/discovery'
import { AgentProvider } from './contexts/AgentProvider'
import { CompanionProvider } from './contexts/CompanionProvider'
import { AuthProvider } from './contexts/AuthContext'
import { AgentModal } from './components/agent/AgentModal'
import { AnimatedRoutes, PageTransition } from './components/transitions'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

/**
 * Smart Route Handler
 * Shows SpotlightV2 if there's a routeId param, otherwise redirects to new trip form
 */
function SmartRouteHandler() {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');
  const itineraryId = searchParams.get('itinerary');

  // If there's a routeId or itinerary param, show SpotlightV2
  if (routeId || itineraryId) {
    return (
      <PageTransition variant="scale">
        <SpotlightV2 />
      </PageTransition>
    );
  }

  // Otherwise redirect to the new trip entry form
  return <Navigate to="/new" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router basename="/spotlight-new">
          <AgentProvider>
            <CompanionProvider>
              <AnimatedRoutes>
                {/* Entry Phase - New trip creation form */}
                <Route
                  path="/new"
                  element={
                    <PageTransition variant="fade">
                      <NewTripPage />
                    </PageTransition>
                  }
                />

                {/* Discovery Phase - Explore suggested cities */}
                <Route
                  path="/discover"
                  element={
                    <PageTransition variant="slideRight">
                      <DiscoveryPhaseContainer />
                    </PageTransition>
                  }
                />

                {/* Generation Phase - AI itinerary creation */}
                <Route
                  path="/generate"
                  element={
                    <PageTransition variant="slideRight">
                      <ItineraryGenerationPage />
                    </PageTransition>
                  }
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

                {/* Spotlight View - Route planning & editing */}
                <Route
                  path="/spotlight"
                  element={
                    <PageTransition variant="scale">
                      <SpotlightV2 />
                    </PageTransition>
                  }
                />

                {/* Smart handler: shows route if param exists, else redirects to /new */}
                <Route path="/" element={<SmartRouteHandler />} />
                <Route path="*" element={<SmartRouteHandler />} />
              </AnimatedRoutes>

              {/* AI Agent Modal - Available for full-screen agent interactions */}
              <AgentModal />
            </CompanionProvider>
          </AgentProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
