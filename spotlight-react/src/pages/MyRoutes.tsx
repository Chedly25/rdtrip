/**
 * My Routes Dashboard - Wanderlust Editorial Design
 *
 * A beautiful, magazine-style dashboard that showcases the user's trips,
 * quick actions, and surfaces collaboration/marketplace features.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Loader2,
  AlertCircle,
  Compass,
  Users,
  Star,
  Calendar,
  Grid3X3,
  List,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { QuickActionCard, DashboardRouteCard, EmptyRoutesState } from '../components/landing/dashboard'
import ShareRouteModal from '../components/landing/ShareRouteModal'

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
  shareToken?: string | null
  viewCount?: number
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  hasItinerary?: boolean
  expenseCount?: number
  totalNights?: number
}

type FilterType = 'all' | 'favorites' | 'with-itinerary' | 'shared'

const warmEasing = [0.23, 1, 0.32, 1] as const

export default function MyRoutes() {
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuth()
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedRouteForShare, setSelectedRouteForShare] = useState<SavedRoute | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
          Authorization: `Bearer ${token}`,
        },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite status')
      }

      setRoutes(
        routes.map((route) =>
          route.id === routeId ? { ...route, isFavorite } : route
        )
      )
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
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete route')
      }

      setRoutes(routes.filter((route) => route.id !== routeId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete route:', err)
    }
  }

  const handleViewRoute = (route: SavedRoute) => {
    // Navigate to spotlight with route data
    window.location.href = `/spotlight-new/?routeId=${route.id}`
  }

  const handleOpenShareModal = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    if (route) {
      setSelectedRouteForShare(route)
      setShareModalOpen(true)
    }
  }

  const handleShareRoute = async (): Promise<{
    shareUrl: string
    shareToken: string
  }> => {
    if (!selectedRouteForShare) {
      throw new Error('No route selected')
    }

    const response = await fetch(
      `/api/routes/${selectedRouteForShare.id}/share`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to share route')
    }

    const data = await response.json()

    setRoutes(
      routes.map((route) =>
        route.id === selectedRouteForShare.id
          ? { ...route, isPublic: true, shareToken: data.shareToken }
          : route
      )
    )

    setSelectedRouteForShare({
      ...selectedRouteForShare,
      isPublic: true,
      shareToken: data.shareToken,
    })

    return {
      shareUrl: data.shareUrl,
      shareToken: data.shareToken,
    }
  }

  const handleStopSharing = async () => {
    if (!selectedRouteForShare) return

    const response = await fetch(
      `/api/routes/${selectedRouteForShare.id}/share`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to stop sharing')
    }

    setRoutes(
      routes.map((route) =>
        route.id === selectedRouteForShare.id
          ? { ...route, isPublic: false, shareToken: null }
          : route
      )
    )

    setSelectedRouteForShare({
      ...selectedRouteForShare,
      isPublic: false,
      shareToken: null,
    })
  }

  // Filter routes based on selected filter
  const filteredRoutes = routes.filter((route) => {
    switch (filter) {
      case 'favorites':
        return route.isFavorite
      case 'with-itinerary':
        return route.hasItinerary || route.routeData?.itinerary
      case 'shared':
        return route.isPublic
      default:
        return true
    }
  })

  // Stats
  const favoriteCount = routes.filter((r) => r.isFavorite).length
  const sharedCount = routes.filter((r) => r.isPublic).length

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
      }}
    >
      {/* Header */}
      <header
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2C2417 0%, #3D3225 100%)',
        }}
      >
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative gradient accent */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(196, 88, 48, 0.4) 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: warmEasing }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium mb-2"
                style={{ color: '#D4A853' }}
              >
                Welcome back, {user?.displayName || 'Traveler'}
              </motion.p>
              <h1
                className="text-4xl md:text-5xl font-semibold mb-3"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  color: '#FFFBF5',
                  letterSpacing: '-0.03em',
                }}
              >
                Your Journeys
              </h1>
              <p className="text-base" style={{ color: '#C4B8A5' }}>
                {routes.length} {routes.length === 1 ? 'route' : 'routes'} saved
                {favoriteCount > 0 && ` · ${favoriteCount} favorites`}
                {sharedCount > 0 && ` · ${sharedCount} shared`}
              </p>
            </div>

            <motion.a
              href="/#route-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(196, 88, 48, 0.4)',
              }}
            >
              <Compass className="w-5 h-5" />
              Plan New Trip
            </motion.a>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        {/* Quick Actions */}
        {!isLoading && routes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2
              className="text-lg font-semibold mb-5"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                color: '#2C2417',
                letterSpacing: '-0.01em',
              }}
            >
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={MapPin}
                title="Plan New Trip"
                description="Create a personalized road trip with AI-powered recommendations"
                href="/#route-form"
                color="terracotta"
              />
              <QuickActionCard
                icon={Users}
                title="Shared With Me"
                description="View trips that friends have shared with you"
                href="/shared"
                color="sage"
                badge="Coming Soon"
              />
              <QuickActionCard
                icon={Compass}
                title="Explore Routes"
                description="Browse community trip ideas and get inspired"
                href="/marketplace"
                color="golden"
              />
            </div>
          </motion.section>
        )}

        {/* Routes Section */}
        <section>
          {/* Section Header with Filters */}
          {!isLoading && routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            >
              <h2
                className="text-xl font-semibold"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  color: '#2C2417',
                  letterSpacing: '-0.01em',
                }}
              >
                Your Routes
              </h2>

              <div className="flex items-center gap-3">
                {/* Filter Pills */}
                <div
                  className="flex gap-1 p-1 rounded-xl"
                  style={{ background: '#F5F0E8' }}
                >
                  {[
                    { id: 'all', label: 'All', icon: null },
                    { id: 'favorites', label: 'Favorites', icon: Star },
                    { id: 'with-itinerary', label: 'With Itinerary', icon: Calendar },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id as FilterType)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filter === f.id
                          ? 'bg-white shadow-sm'
                          : 'hover:bg-white/50'
                      }`}
                      style={{
                        color: filter === f.id ? '#2C2417' : '#8B7355',
                      }}
                    >
                      {f.icon && <f.icon className="w-3.5 h-3.5" />}
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div
                  className="flex gap-1 p-1 rounded-lg"
                  style={{ background: '#F5F0E8' }}
                >
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                    }`}
                    style={{ color: viewMode === 'grid' ? '#2C2417' : '#8B7355' }}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : ''
                    }`}
                    style={{ color: viewMode === 'list' ? '#2C2417' : '#8B7355' }}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content States */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="h-10 w-10" style={{ color: '#C45830' }} />
              </motion.div>
              <p className="mt-4 text-sm" style={{ color: '#8B7355' }}>
                Loading your journeys...
              </p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(196, 88, 48, 0.1)' }}
              >
                <AlertCircle className="h-8 w-8" style={{ color: '#C45830' }} />
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: '#2C2417' }}>
                Something went wrong
              </p>
              <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
                {error}
              </p>
              <button
                onClick={fetchRoutes}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                }}
              >
                Try Again
              </button>
            </motion.div>
          ) : routes.length === 0 ? (
            <EmptyRoutesState onCreateRoute={() => navigate('/')} />
          ) : filteredRoutes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-lg" style={{ color: '#8B7355' }}>
                No routes match this filter
              </p>
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-sm font-medium"
                style={{ color: '#C45830' }}
              >
                Clear filter
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 max-w-3xl mx-auto'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {filteredRoutes.map((route, index) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <DashboardRouteCard
                      route={route}
                      onView={handleViewRoute}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDelete}
                      onShare={handleOpenShareModal}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Toast */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl z-50"
            style={{
              background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
              color: 'white',
            }}
          >
            <p className="font-medium">Click delete again to confirm</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Route Modal */}
      {selectedRouteForShare && (
        <ShareRouteModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          routeId={selectedRouteForShare.id}
          routeName={selectedRouteForShare.name}
          shareToken={selectedRouteForShare.shareToken}
          isPublic={selectedRouteForShare.isPublic}
          viewCount={selectedRouteForShare.viewCount}
          onShare={handleShareRoute}
          onStopSharing={handleStopSharing}
        />
      )}
    </div>
  )
}
