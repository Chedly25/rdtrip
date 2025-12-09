import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Calendar, TrendingUp, Award, Users } from 'lucide-react'
import type { PublishedRoute } from '../../../types'

interface PublishedRouteCardProps {
  route: PublishedRoute
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  challenging: 'bg-red-100 text-red-700'
}

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging'
}

export default function PublishedRouteCard({ route }: PublishedRouteCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/marketplace/${route.slug}`)
  }

  // Format duration
  const formatDuration = (days: number) => {
    if (days === 1) return '1 day'
    if (days <= 7) return `${days} days`
    if (days <= 14) return `${Math.floor(days / 7)} ${days <= 7 ? 'week' : 'weeks'}`
    return `${days} days`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer group relative"
    >
      {/* Featured Badge */}
      {route.featured && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Award className="h-3 w-3" />
            Featured
          </div>
        </div>
      )}

      {/* Premium Badge */}
      {route.isPremium && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Star className="h-3 w-3" />
            Premium
          </div>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        {route.coverImageUrl ? (
          <img
            src={route.coverImageUrl}
            alt={route.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Cities overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 text-white text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">
              {route.citiesVisited.slice(0, 3).join(' • ')}
              {route.citiesVisited.length > 3 && ` +${route.citiesVisited.length - 3} more`}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {route.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {route.description}
        </p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDuration(route.durationDays)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{route.citiesVisited.length} cities</span>
          </div>
        </div>

        {/* Difficulty & Style */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${DIFFICULTY_COLORS[route.difficultyLevel]}`}>
            {DIFFICULTY_LABELS[route.difficultyLevel]}
          </span>
          {route.primaryStyle && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">
              {route.primaryStyle.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {route.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {route.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                +{route.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-900">
                {route.rating > 0 ? route.rating.toFixed(1) : 'New'}
              </span>
              {route.reviewCount > 0 && (
                <span className="text-xs text-gray-500">({route.reviewCount})</span>
              )}
            </div>

            {/* Clones */}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-700">{route.cloneCount}</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{route.viewCount}</span>
            </div>
          </div>

          {/* Author */}
          {route.authorName && (
            <div className="flex items-center gap-2">
              {route.authorAvatar ? (
                <img
                  src={route.authorAvatar}
                  alt={route.authorName}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                  {route.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-600 truncate max-w-[100px]">
                {route.authorName}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
