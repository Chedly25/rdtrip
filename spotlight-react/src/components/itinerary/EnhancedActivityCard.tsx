import { motion } from 'framer-motion';
import { Star, Clock, Timer, MapPin, ExternalLink, DollarSign, Phone } from 'lucide-react';
import { ActivityPhotoGallery } from './ActivityPhotoGallery';

interface Activity {
  id?: string;
  name: string;
  description?: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    url: string;
    thumbnail?: string;
    attribution?: string;
    width?: number;
    height?: number;
    isPrimary?: boolean;
  }>;
  formatted_address?: string;
  address?: string;
  suggested_time?: string;
  timeWindow?: { start: string; end: string };
  duration?: string;
  estimatedDuration?: number;
  price_level?: number;
  priceLevel?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  openingHours?: string;
  isOpenNow?: boolean;
  google_maps_url?: string;
  googleMapsUrl?: string;
  website?: string;
  phone_number?: string;
  phoneNumber?: string;
  types?: string[];
  category?: string;
}

interface EnhancedActivityCardProps {
  activity: Activity;
  showPhotos?: boolean;
  compact?: boolean;
}

export function EnhancedActivityCard({ activity, showPhotos = true, compact = false }: EnhancedActivityCardProps) {
  const priceLevel = activity.price_level || activity.priceLevel || 0;
  const address = activity.formatted_address || activity.address;
  const rating = activity.rating;
  const ratingsCount = activity.user_ratings_total;
  const isOpen = activity.opening_hours?.open_now ?? activity.isOpenNow;
  const mapsUrl = activity.google_maps_url || activity.googleMapsUrl;
  const website = activity.website;
  const phone = activity.phone_number || activity.phoneNumber;
  const suggestedTime = activity.suggested_time ||
    (activity.timeWindow ? `${activity.timeWindow.start} - ${activity.timeWindow.end}` : undefined);
  const duration = activity.duration ||
    (activity.estimatedDuration ? `${activity.estimatedDuration} min` : undefined);

  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        {showPhotos && activity.photos && activity.photos.length > 0 && (
          <div className="relative h-32 overflow-hidden bg-gray-100">
            <img
              src={activity.photos[0].thumbnail || activity.photos[0].url}
              alt={activity.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4">
          <h4 className="font-semibold text-gray-900 truncate">{activity.name}</h4>

          {rating && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              {ratingsCount && (
                <span className="text-xs text-gray-500">({ratingsCount})</span>
              )}
            </div>
          )}

          {suggestedTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <Clock className="w-4 h-4" />
              <span>{suggestedTime}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all"
    >
      {/* Photo Gallery */}
      {showPhotos && activity.photos && activity.photos.length > 0 && (
        <div className="p-4 pb-0">
          <ActivityPhotoGallery photos={activity.photos} activityName={activity.name} />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{activity.name}</h3>
          {address && (
            <p className="text-gray-600 mt-1 text-sm">{address}</p>
          )}
        </div>

        {/* Rating & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{rating.toFixed(1)}</span>
                {ratingsCount && (
                  <span className="text-gray-500 text-sm">({ratingsCount.toLocaleString()} reviews)</span>
                )}
              </div>
            )}

            {priceLevel > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                {Array.from({ length: priceLevel }).map((_, i) => (
                  <DollarSign key={i} className="w-4 h-4" />
                ))}
              </div>
            )}
          </div>

          {isOpen !== undefined && (
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                isOpen
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isOpen ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>

        {/* Time & Duration */}
        {(suggestedTime || duration) && (
          <div className="flex items-center gap-4 text-sm text-gray-700">
            {suggestedTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{suggestedTime}</span>
              </div>
            )}
            {duration && (
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-gray-400" />
                <span>{duration}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {activity.description && (
          <p className="text-gray-700 leading-relaxed">{activity.description}</p>
        )}

        {/* Category tags */}
        {(activity.types || activity.category) && (
          <div className="flex flex-wrap gap-2">
            {activity.types ? (
              activity.types.slice(0, 3).map((type) => (
                <span
                  key={type}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {type.replace(/_/g, ' ')}
                </span>
              ))
            ) : activity.category ? (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {activity.category}
              </span>
            ) : null}
          </div>
        )}

        {/* Opening Hours */}
        {activity.opening_hours?.weekday_text && (
          <div className="pt-4 border-t border-gray-100">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
                Opening Hours
              </summary>
              <ul className="mt-2 space-y-1 text-gray-600">
                {activity.opening_hours.weekday_text.map((day, idx) => (
                  <li key={idx}>{day}</li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <MapPin className="w-4 h-4" />
              Directions
            </a>
          )}

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </a>
          )}

          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
