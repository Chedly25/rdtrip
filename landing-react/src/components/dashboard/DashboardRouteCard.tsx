/**
 * Dashboard Route Card - Wanderlust Editorial Design
 *
 * Rich route cards with map preview placeholders, collaboration indicators,
 * and beautiful editorial styling.
 */

import { motion } from 'framer-motion'
import {
  MapPin,
  Star,
  Calendar,
  Users,
  Receipt,
  Eye,
  Share2,
  Trash2,
  CalendarDays,
} from 'lucide-react'

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
  // Enhanced fields (may be undefined)
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  hasItinerary?: boolean
  expenseCount?: number
  totalNights?: number
}

interface DashboardRouteCardProps {
  route: SavedRoute
  onView: (route: SavedRoute) => void
  onToggleFavorite: (routeId: string, isFavorite: boolean) => void
  onDelete: (routeId: string) => void
  onShare: (routeId: string) => void
  showOwner?: boolean
  ownerName?: string
}

const interestColors: Record<string, string> = {
  adventure: '#C45830',
  culture: '#D4A853',
  food: '#8B7355',
  'hidden-gems': '#5B6E8C',
  nature: '#6B8E7B',
  history: '#A67B5B',
  art: '#9B7BB8',
  nightlife: '#4A5D7B',
}

const interestLabels: Record<string, string> = {
  adventure: 'Adventure',
  culture: 'Culture',
  food: 'Food & Dining',
  'hidden-gems': 'Hidden Gems',
  nature: 'Nature',
  history: 'History',
  art: 'Art & Museums',
  nightlife: 'Nightlife',
}

export function DashboardRouteCard({
  route,
  onView,
  onToggleFavorite,
  onDelete,
  onShare,
  showOwner,
  ownerName,
}: DashboardRouteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Calculate total nights from routeData if available
  const totalNights = route.totalNights || route.routeData?.cities?.reduce(
    (sum: number, city: any) => sum + (city.nights || 0),
    0
  ) || route.stops

  // Get cities count
  const citiesCount = route.routeData?.cities?.length || route.stops

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-2xl overflow-hidden transition-shadow duration-300"
      style={{
        boxShadow: '0 4px 20px rgba(44, 36, 23, 0.08), 0 0 0 1px rgba(44, 36, 23, 0.05)',
      }}
    >
      {/* Map Preview Placeholder */}
      <div
        className="relative h-36 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE8E0 100%)',
        }}
      >
        {/* Decorative route line */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 400 150"
          preserveAspectRatio="none"
        >
          <path
            d="M 20 120 Q 100 40, 200 75 T 380 30"
            fill="none"
            stroke="#C45830"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
          {/* Origin dot */}
          <circle cx="20" cy="120" r="6" fill="#C45830" />
          {/* Destination dot */}
          <circle cx="380" cy="30" r="6" fill="#D4A853" />
          {/* Intermediate stops */}
          <circle cx="120" cy="55" r="4" fill="#8B7355" opacity="0.6" />
          <circle cx="240" cy="70" r="4" fill="#8B7355" opacity="0.6" />
        </svg>

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Favorite star - top left */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(route.id, !route.isFavorite)
          }}
          className="absolute top-3 left-3 p-2 rounded-xl backdrop-blur-sm transition-all hover:scale-110"
          style={{
            background: route.isFavorite
              ? 'linear-gradient(135deg, #D4A853 0%, #C49A48 100%)'
              : 'rgba(255, 255, 255, 0.85)',
          }}
        >
          <Star
            className={`w-4 h-4 ${
              route.isFavorite ? 'fill-white text-white' : 'text-[#8B7355]'
            }`}
          />
        </button>

        {/* Collaborators - top right */}
        {route.collaborators && route.collaborators.length > 0 && (
          <div className="absolute top-3 right-3 flex -space-x-2">
            {route.collaborators.slice(0, 3).map((collaborator, i) => (
              <div
                key={collaborator.id}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${
                    ['#C45830', '#D4A853', '#6B8E7B'][i % 3]
                  } 0%, ${['#B54A2A', '#C49A48', '#5A7D6A'][i % 3]} 100%)`,
                  zIndex: 3 - i,
                }}
              >
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {route.collaborators.length > 3 && (
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
                style={{
                  background: '#F5F0E8',
                  color: '#8B7355',
                  zIndex: 0,
                }}
              >
                +{route.collaborators.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Public badge */}
        {route.isPublic && (
          <div
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
            style={{
              background: 'rgba(107, 142, 123, 0.9)',
              color: 'white',
            }}
          >
            <Users className="w-3 h-3" />
            <span>Public</span>
            {route.viewCount !== undefined && route.viewCount > 0 && (
              <span className="opacity-80">· {route.viewCount}</span>
            )}
          </div>
        )}

        {/* Owner badge (for shared routes) */}
        {showOwner && ownerName && (
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#8B7355',
            }}
          >
            <span>by {ownerName}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Route name and location */}
        <div className="mb-3">
          <h3
            className="text-lg font-semibold mb-1 line-clamp-1"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              color: '#2C2417',
              letterSpacing: '-0.02em',
            }}
          >
            {route.name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#8B7355' }}>
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">
              {route.origin} → {route.destination}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#5A5347' }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: '#C45830' }} />
            <span className="font-medium">{citiesCount}</span>
            <span style={{ color: '#8B7355' }}>cities</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#5A5347' }}>
            <CalendarDays className="w-3.5 h-3.5" style={{ color: '#D4A853' }} />
            <span className="font-medium">{totalNights}</span>
            <span style={{ color: '#8B7355' }}>nights</span>
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {route.hasItinerary && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(196, 88, 48, 0.1)',
                color: '#C45830',
              }}
            >
              <Calendar className="w-3 h-3" />
              Itinerary
            </span>
          )}
          {route.collaborators && route.collaborators.length > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(107, 142, 123, 0.1)',
                color: '#5A7D6A',
              }}
            >
              <Users className="w-3 h-3" />
              {route.collaborators.length} collaborator{route.collaborators.length > 1 ? 's' : ''}
            </span>
          )}
          {route.expenseCount !== undefined && route.expenseCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(139, 115, 85, 0.1)',
                color: '#6B5B4F',
              }}
            >
              <Receipt className="w-3 h-3" />
              {route.expenseCount} expense{route.expenseCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Interest tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {route.selectedAgents.slice(0, 3).map((agent) => (
            <span
              key={agent}
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${interestColors[agent] || '#8B7355'}15`,
                color: interestColors[agent] || '#8B7355',
              }}
            >
              {interestLabels[agent] || agent}
            </span>
          ))}
          {route.selectedAgents.length > 3 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: '#F5F0E8',
                color: '#8B7355',
              }}
            >
              +{route.selectedAgents.length - 3}
            </span>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => onView(route)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
              boxShadow: '0 2px 8px rgba(196, 88, 48, 0.25)',
            }}
          >
            <Eye className="w-4 h-4" />
            View Route
          </motion.button>

          <motion.button
            onClick={() => onShare(route.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl transition-colors"
            style={{
              border: '1px solid #E8E2D9',
              color: '#8B7355',
            }}
          >
            <Share2 className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={() => onDelete(route.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl transition-colors hover:bg-red-50"
            style={{
              border: '1px solid #E8E2D9',
              color: '#C45830',
            }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Date */}
        <div
          className="mt-3 pt-3 text-xs flex items-center gap-1.5"
          style={{
            borderTop: '1px solid #F5F0E8',
            color: '#C4B8A5',
          }}
        >
          <Calendar className="w-3 h-3" />
          Created {formatDate(route.createdAt)}
        </div>
      </div>
    </motion.div>
  )
}
