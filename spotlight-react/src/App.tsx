import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import SpotlightV2 from './components/spotlight/v2/SpotlightV2'
import { ItineraryGenerationPage } from './components/itinerary/ItineraryGenerationPage'
import { TodayView } from './components/today/TodayView'
import { NewTripPage } from './components/entry/NewTripPage'
import { DiscoveryPhaseContainer } from './components/discovery'
import { AgentProvider } from './contexts/AgentProvider'
import { CompanionProvider } from './contexts/CompanionProvider'
import { AuthProvider } from './contexts/AuthContext'
import { AgentModal } from './components/agent/AgentModal'

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
    return <SpotlightV2 />;
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
              <Routes>
                {/* New simplified entry flow - default for new trips */}
                <Route path="/new" element={<NewTripPage />} />

                {/* Discovery phase - explore suggested cities before itinerary */}
                <Route path="/discover" element={<DiscoveryPhaseContainer />} />

                {/* Route generation progress */}
                <Route path="/generate" element={<ItineraryGenerationPage />} />

                {/* Today view for active trips */}
                <Route path="/today" element={<TodayView />} />

                {/* Spotlight view for existing routes (requires ?routeId=xxx) */}
                <Route path="/spotlight" element={<SpotlightV2 />} />

                {/* Smart handler: shows route if param exists, else redirects to /new */}
                <Route path="/" element={<SmartRouteHandler />} />
                <Route path="*" element={<SmartRouteHandler />} />
              </Routes>

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
