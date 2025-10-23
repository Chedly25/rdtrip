import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigation } from './components/Navigation'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Showcase } from './components/Showcase'
import { RouteForm } from './components/RouteForm'
import { About } from './components/About'
import { Footer } from './components/Footer'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Navigation />
        <Hero />
        <Features />
        <Showcase />
        <RouteForm />
        <About />
        <Footer />
      </div>
    </QueryClientProvider>
  )
}

export default App
