import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SpotlightV2 from './components/spotlight/v2/SpotlightV2'
import SpotlightV3 from './components/spotlight/v3/SpotlightV3'
import { ItineraryGenerationPage } from './components/itinerary/ItineraryGenerationPage'
import { TodayView } from './components/today/TodayView'
import { MyTripsPage } from './pages/MyTripsPage'
import { RouteProposalsPage } from './pages/RouteProposalsPage'
import { DesignSystemTest } from './pages/DesignSystemTest'
import { AgentProvider } from './contexts/AgentProvider'
import { AgentChatBubble } from './components/agent/AgentChatBubble'
import { AgentModal } from './components/agent/AgentModal'
import { GlobalNav } from './components/navigation/GlobalNav'
import { ToastProvider } from './components/toast/ToastProvider'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router basename="/spotlight-new">
          <AgentProvider>
            {/* PHASE 4: Global Navigation Bar - Always visible */}
            <GlobalNav />

            <Routes>
              <Route path="/design-system" element={<DesignSystemTest />} />
              <Route path="/v2" element={<SpotlightV2 />} />
              <Route path="/my-trips" element={<MyTripsPage />} />
              <Route path="/trips/:tripId/proposals" element={<RouteProposalsPage />} />
              <Route path="/generate" element={<ItineraryGenerationPage />} />
              <Route path="/today" element={<TodayView />} />
              {/* Default route: SpotlightV3 (Apple-Grade Redesign) */}
              <Route path="*" element={<SpotlightV3 />} />
            </Routes>

            {/* AI Agent - Available everywhere except TodayView (has its own chat) */}
            <AgentChatBubble />
            <AgentModal />
          </AgentProvider>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
