import { motion } from 'framer-motion'
import { MapPin, Calendar, Star, Trash2, Eye, Share2, Users } from 'lucide-react'

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
}

interface SavedRouteCardProps {
  route: SavedRoute
  onView: (route: SavedRoute) => void
  onToggleFavorite: (routeId: string, isFavorite: boolean) => void
  onDelete: (routeId: string) => void
  onShare: (routeId: string) => void
}

const agentColors: Record<string, string> = {
  adventure: '#055948',
  culture: '#a87600',
  food: '#650411',
  'hidden-gems': '#081d5b'
}

const agentNames: Record<string, string> = {
  adventure: 'Adventure',
  culture: 'Culture',
  food: 'Food',
  'hidden-gems': 'Hidden Gems'
}

export default function SavedRouteCard({ route, onView, onToggleFavorite, onDelete, onShare }: SavedRouteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{route.name}</h3>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{route.origin} → {route.destination}</span>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(route.id, !route.isFavorite)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Star
              className={`h-5 w-5 ${
                route.isFavorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-400 hover:text-yellow-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Route Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Stops</p>
            <p className="text-lg font-semibold text-gray-900">{route.stops}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Budget</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{route.budget}</p>
          </div>
        </div>

        {/* Travel Themes */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Travel Themes</p>
          <div className="flex flex-wrap gap-2">
            {route.selectedAgents.map((agent) => (
              <span
                key={agent}
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: agentColors[agent] || '#6b7280' }}
              >
                {agentNames[agent] || agent}
              </span>
            ))}
          </div>
        </div>

        {/* Date & Public Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(route.createdAt)}</span>
          </div>
          {route.isPublic && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <Users className="h-3 w-3" />
              <span>Public</span>
              {route.viewCount !== undefined && route.viewCount > 0 && (
                <span className="ml-1 text-green-600">· {route.viewCount} views</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onView(route)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Route
          </button>
          <button
            onClick={() => onShare(route.id)}
            className="px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            title="Share route"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(route.id)}
            className="px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
            title="Delete route"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
