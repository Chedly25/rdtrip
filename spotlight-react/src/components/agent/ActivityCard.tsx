/**
 * ActivityCard - Visual Activity Display
 *
 * Displays activity search results as beautiful cards
 * with photos, ratings, and quick actions
 */

import { MapPin, Star, ExternalLink, Phone, Clock, Euro } from 'lucide-react';

interface Activity {
  name: string;
  place_id: string;
  rating?: number;
  ratingCount?: number;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photo?: string;
  isOpenNow?: boolean;
  website?: string;
  phone?: string;
  priceLevel?: number;
  summary?: string;
  category: string;
}

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-teal-300 transition-colors">
      {/* Activity Image */}
      {activity.photo && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={activity.photo}
            alt={activity.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {activity.isOpenNow !== undefined && (
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  activity.isOpenNow
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {activity.isOpenNow ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Activity Name & Rating */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
            {activity.name}
          </h3>

          {activity.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {activity.rating.toFixed(1)}
                </span>
              </div>
              {activity.ratingCount && (
                <span className="text-xs text-gray-500">
                  ({activity.ratingCount.toLocaleString()} reviews)
                </span>
              )}
              {activity.priceLevel && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Euro className="w-4 h-4" />
                  <span className="text-sm">
                    {'€'.repeat(activity.priceLevel)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {activity.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {activity.summary}
          </p>
        )}

        {/* Address */}
        <div className="flex items-start gap-2 mb-4 text-sm text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-600" />
          <span className="line-clamp-2">{activity.address}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          {activity.website && (
            <a
              href={activity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </a>
          )}

          {activity.phone && (
            <a
              href={`tel:${activity.phone}`}
              className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
          )}

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.name)}&query_place_id=${activity.place_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors ml-auto"
          >
            <MapPin className="w-3 h-3" />
            Directions
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * ActivityGrid - Container for multiple activities
 */
interface ActivityGridProps {
  activities: Activity[];
  city: string;
  category?: string;
}

export function ActivityGrid({ activities, city, category }: ActivityGridProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">
          No {category || 'activities'} found in {city}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}s` : 'Activities'} in {city}
        </h3>
        <p className="text-sm text-gray-600">
          Found {activities.length} {activities.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activities.map((activity, index) => (
          <ActivityCard key={activity.place_id || index} activity={activity} />
        ))}
      </div>
    </div>
  );
}
