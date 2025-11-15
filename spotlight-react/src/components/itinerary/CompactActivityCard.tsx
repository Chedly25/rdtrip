import { motion } from 'framer-motion';
import { Star, Clock, MapPin, ExternalLink, Phone } from 'lucide-react';

interface CompactActivityCardProps {
  activity: any;
  onSelect?: (activity: any) => void;
  isSelected?: boolean;
}

export function CompactActivityCard({ activity, onSelect, isSelected = false }: CompactActivityCardProps) {
  // Extract photo URL with fallback (supports both 'photo' and 'photos' fields)
  const photo = activity.photos?.[0];
  const photoUrl = typeof photo === 'string' ? photo :
    photo?.url || activity.photo || activity.primaryPhoto?.url || activity.primaryPhoto || null;

  // DEBUG: Log photo information
  if (!photoUrl) {
    console.log(`📸 [CompactActivityCard] NO PHOTO for "${activity.name}"`);
    console.log('   activity.photo:', activity.photo);
    console.log('   activity.photos:', activity.photos);
    console.log('   activity.primaryPhoto:', activity.primaryPhoto);
    console.log('   Full activity:', activity);
  }

  // Google Maps link helper
  const getGoogleMapsLink = () => {
    if (activity.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${activity.place_id}`;
    } else if (activity.coordinates?.lat && activity.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${activity.coordinates.lat},${activity.coordinates.lng}`;
    } else if (activity.name) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.name)}`;
    }
    return null;
  };

  const mapsLink = getGoogleMapsLink();

  // Get activity type badge
  const getTypeBadge = () => {
    const type = activity.type || activity.place_types?.[0] || 'attraction';
    const typeColors: Record<string, { bg: string; text: string; label: string }> = {
      museum: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Museum' },
      park: { bg: 'bg-green-100', text: 'text-green-700', label: 'Park' },
      restaurant: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Food' },
      cultural: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Culture' },
      historical: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Historic' },
      outdoor: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Outdoor' },
      entertainment: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Fun' },
      shopping: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Shopping' },
      attraction: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Attraction' }
    };

    return typeColors[type] || typeColors.attraction;
  };

  const typeBadge = getTypeBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect?.(activity)}
      className={`
        relative bg-white rounded-lg overflow-hidden border-2 transition-all cursor-pointer
        w-full h-auto flex flex-col
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'}
      `}
    >
      {/* Image */}
      {photoUrl && (
        <div className="relative h-[120px] w-full overflow-hidden bg-gray-100">
          <img
            src={photoUrl}
            alt={activity.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Type badge overlay */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
              {typeBadge.label}
            </span>
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Name */}
        <h5 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
          {activity.name}
        </h5>

        {/* Rating + Duration */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
          {activity.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{activity.rating.toFixed(1)}</span>
              {activity.ratingCount && (
                <span className="text-gray-400">({activity.ratingCount})</span>
              )}
            </div>
          )}

          {activity.estimatedDuration && (
            <div className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              <span>{activity.estimatedDuration}</span>
            </div>
          )}
        </div>

        {/* Address snippet */}
        {activity.address && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-3">
            {activity.address}
          </p>
        )}

        {/* Action icons */}
        <div className="mt-auto flex items-center gap-2">
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title="Open in Google Maps"
            >
              <MapPin className="w-4 h-4" />
            </a>
          )}

          {activity.website && (
            <a
              href={activity.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
              title="Visit website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {activity.phone && (
            <a
              href={`tel:${activity.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
              title="Call"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
