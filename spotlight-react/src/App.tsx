import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SpotlightV2 from './components/spotlight/v2/SpotlightV2'
import { ItineraryGenerationPage } from './components/itinerary/ItineraryGenerationPage'
import { TodayView } from './components/today/TodayView'
import { AgentProvider } from './contexts/AgentProvider'
import { AgentChatBubble } from './components/agent/AgentChatBubble'
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename="/spotlight-new">
        <AgentProvider>
          <Routes>
            <Route path="/generate" element={<ItineraryGenerationPage />} />
            <Route path="/today" element={<TodayView />} />
            <Route path="*" element={<SpotlightV2 />} />
          </Routes>

          {/* AI Agent - Available everywhere except TodayView (has its own chat) */}
          <AgentChatBubble />
          <AgentModal />
        </AgentProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
