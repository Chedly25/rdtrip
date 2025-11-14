import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SpotlightV2 from './components/spotlight/v2/SpotlightV2'
import { ItineraryGenerationPage } from './components/itinerary/ItineraryGenerationPage'
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
      <Router>
        <AgentProvider>
          <Routes>
            <Route path="/spotlight/generate" element={<ItineraryGenerationPage />} />
            <Route path="*" element={<SpotlightV2 />} />
          </Routes>

          {/* AI Agent - Available everywhere */}
          <AgentChatBubble />
          <AgentModal />
        </AgentProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
