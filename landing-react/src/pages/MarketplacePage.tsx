import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Map,
  TrendingUp,
  Star,
  Sparkles
} from 'lucide-react'
import PublishedRouteCard from '../components/marketplace/PublishedRouteCard'
import type { PublishedRoute, MarketplaceFilters, MarketplaceRoutesResponse } from '../types'

export default function MarketplacePage() {
  const [routes, setRoutes] = useState<PublishedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<MarketplaceFilters>({
    style: 'all',
    duration: 'any',
    difficulty: 'any',
    season: 'any',
    sortBy: 'popular'
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const pageSize = 12

  useEffect(() => {
    fetchRoutes()
  }, [filters, page])

  useEffect(() => {
    // Reset to page 1 when search query changes
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        fetchRoutes()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        search: searchQuery,
        style: filters.style,
        duration: filters.duration,
        difficulty: filters.difficulty,
        season: filters.season,
        sortBy: filters.sortBy,
        page: page.toString(),
        pageSize: pageSize.toString()
      })

      const response = await fetch(`/api/marketplace/routes?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch marketplace routes')
      }

      const data: MarketplaceRoutesResponse = await response.json()
      setRoutes(data.routes)
      setTotal(data.total)
      setTotalPages(Math.ceil(data.total / pageSize))
    } catch (err) {
      console.error('Error fetching routes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof MarketplaceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <Map className="h-12 w-12" />
              <h1 className="text-4xl md:text-5xl font-bold">Route Marketplace</h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            >
              Discover amazing road trip routes created by travelers worldwide
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by destination, country, or keywords..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filters</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Style Filter */}
            <select
              value={filters.style}
              onChange={(e) => handleFilterChange('style', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Styles</option>
              <option value="adventure">Adventure</option>
              <option value="culture">Culture</option>
              <option value="food">Food & Wine</option>
              <option value="hidden_gems">Hidden Gems</option>
              <option value="best-overall">Best Overall</option>
            </select>

            {/* Duration Filter */}
            <select
              value={filters.duration}
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="any">Any Duration</option>
              <option value="weekend">Weekend (2-3 days)</option>
              <option value="week">Week (4-7 days)</option>
              <option value="2-weeks">2 Weeks (8-14 days)</option>
              <option value="month">Month+ (15+ days)</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="any">Any Difficulty</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </select>

            {/* Season Filter */}
            <select
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="any">Any Season</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="clones">Most Cloned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Routes'}
            </h2>
            {!loading && (
              <p className="text-sm text-gray-600 mt-1">
                {total} {total === 1 ? 'route' : 'routes'} found
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading amazing routes...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</p>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => fetchRoutes()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && routes.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">No routes found</p>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilters({
                    style: 'all',
                    duration: 'any',
                    difficulty: 'any',
                    season: 'any',
                    sortBy: 'popular'
                  })
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Route Grid */}
        {!loading && !error && routes.length > 0 && (
          <>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route) => (
                  <PublishedRouteCard key={route.id} route={route} />
                ))}
              </div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
