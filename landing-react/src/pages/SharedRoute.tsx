import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, MapPin, Calendar, Users, Sparkles, ArrowRight } from 'lucide-react'
import { RouteResults } from '../components/RouteResults'

interface SharedRouteData {
  id: string
  name: string
  origin: string
  destination: string
  stops: number
  budget: string
  selectedAgents: string[]
  routeData: any
  createdAt: string
  creator: {
    name: string
  }
  viewCount: number
}

export default function SharedRoute() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [route, setRoute] = useState<SharedRouteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid share link')
      setIsLoading(false)
      return
    }

    fetchSharedRoute()
  }, [token])

  const fetchSharedRoute = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(`/api/shared/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This route is no longer available or has been made private')
        }
        throw new Error('Failed to load shared route')
      }

      const data = await response.json()
      setRoute(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewMap = (agent?: string) => {
    if (route) {
      const dataToStore = agent
        ? {
            ...route.routeData,
            agentResults: route.routeData.agentResults.filter((ar: any) => ar.agent === agent),
            agent: agent
          }
        : route.routeData

      localStorage.setItem('spotlightData', JSON.stringify(dataToStore))
      window.location.href = `/spotlight-new/?routeId=${route.id}&agent=${agent || 'adventure'}`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading shared route...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Route Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Create Your Own Route
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const agentNames: Record<string, string> = {
    adventure: 'Adventure',
    culture: 'Culture',
    food: 'Food',
    'hidden-gems': 'Hidden Gems'
  }

  const agentColors: Record<string, string> = {
    adventure: '#055948',
    culture: '#a87600',
    food: '#650411',
    'hidden-gems': '#081d5b'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Shared badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              Shared Route · {route.viewCount} {route.viewCount === 1 ? 'view' : 'views'}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{route.name}</h1>

            <div className="flex items-center justify-center gap-6 text-slate-300 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{route.origin} → {route.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{route.stops} stops</span>
              </div>
            </div>

            {/* Travel themes */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {route.selectedAgents.map((agent) => (
                <span
                  key={agent}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: agentColors[agent] || '#6b7280' }}
                >
                  {agentNames[agent] || agent}
                </span>
              ))}
            </div>

            <p className="text-slate-400 text-sm">
              Created by {route.creator.name}
            </p>
          </motion.div>
        </div>
      </div>

      {/* CTA Banner - Sticky at top when scrolling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky top-16 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <div>
                <p className="font-semibold">Love this route?</p>
                <p className="text-sm text-indigo-100">Create your own personalized route in minutes</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              Create My Route
            </button>
          </div>
        </div>
      </motion.div>

      {/* Route Results */}
      <div className="pt-8">
        <RouteResults
          routeData={route.routeData}
          onViewMap={handleViewMap}
          onStartOver={() => navigate('/')}
        />
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 to-slate-800 text-white"
      >
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to plan your perfect trip?</h2>
            <p className="text-slate-300 text-lg mb-8">
              Join thousands of travelers using Waycraft to craft personalized journeys powered by AI
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
              Start Planning Free
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-slate-400 text-sm mt-4">No credit card required · Takes 2 minutes</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
