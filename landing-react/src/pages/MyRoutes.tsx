import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Map, Loader2, AlertCircle, PlusCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SavedRouteCard from '../components/SavedRouteCard'

interface SavedRoute {
  id: string
  userId: string
  name: string
  origin: string
  destination: string
  stops: number
  budget: string
  selectedAgents: string[]
  routeData: any
  isFavorite: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function MyRoutes() {
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuth()
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    fetchRoutes()
  }, [isAuthenticated, navigate])

  const fetchRoutes = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/routes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch routes')
      }

      const data = await response.json()
      setRoutes(data.routes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (routeId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFavorite })
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite status')
      }

      setRoutes(routes.map(route =>
        route.id === routeId ? { ...route, isFavorite } : route
      ))
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleDelete = async (routeId: string) => {
    if (deleteConfirm !== routeId) {
      setDeleteConfirm(routeId)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete route')
      }

      setRoutes(routes.filter(route => route.id !== routeId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete route:', err)
    }
  }

  const handleViewRoute = (route: SavedRoute) => {
    // Navigate to route view - we'll implement this by passing the route data back to the main app
    navigate('/', { state: { routeData: route.routeData } })
  }

  const favoriteRoutes = routes.filter(r => r.isFavorite)
  const regularRoutes = routes.filter(r => !r.isFavorite)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">My Routes</h1>
              <p className="text-slate-300">
                {routes.length} {routes.length === 1 ? 'route' : 'routes'} saved
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              Create New Route
            </button>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg text-gray-600">{error}</p>
              <button
                onClick={fetchRoutes}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : routes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No routes yet</h2>
            <p className="text-gray-600 mb-6">Start planning your first adventure!</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              Create Your First Route
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Favorite Routes */}
            {favoriteRoutes.length > 0 && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"
                >
                  <span className="text-yellow-500">★</span>
                  Favorite Routes
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {favoriteRoutes.map((route) => (
                      <SavedRouteCard
                        key={route.id}
                        route={route}
                        onView={handleViewRoute}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* All Routes */}
            {regularRoutes.length > 0 && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-gray-900 mb-6"
                >
                  {favoriteRoutes.length > 0 ? 'All Routes' : 'Your Routes'}
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {regularRoutes.map((route) => (
                      <SavedRouteCard
                        key={route.id}
                        route={route}
                        onView={handleViewRoute}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl"
          >
            <p className="font-medium">Click delete again to confirm</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
