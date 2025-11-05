import { motion } from 'framer-motion';
import { Star, Clock, MapPin, ExternalLink, Phone, Utensils, DollarSign } from 'lucide-react';
import { ActivityPhotoGallery } from './ActivityPhotoGallery';

interface Restaurant {
  id?: string;
  name: string;
  cuisine?: string;
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
  mealType?: string;
  meal_type?: string;
  suggested_time?: string;
  timeWindow?: { start: string; end: string };
  price_level?: number;
  priceLevel?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  isOpenNow?: boolean;
  google_maps_url?: string;
  googleMapsUrl?: string;
  website?: string;
  phone_number?: string;
  phoneNumber?: string;
  types?: string[];
  specialties?: string[];
}

interface EnhancedRestaurantCardProps {
  restaurant: Restaurant;
  showPhotos?: boolean;
  compact?: boolean;
}

export function EnhancedRestaurantCard({ restaurant, showPhotos = true, compact = false }: EnhancedRestaurantCardProps) {
  const priceLevel = restaurant.price_level || restaurant.priceLevel || 0;
  const address = restaurant.formatted_address || restaurant.address;
  const rating = restaurant.rating;
  const ratingsCount = restaurant.user_ratings_total;
  const isOpen = restaurant.opening_hours?.open_now ?? restaurant.isOpenNow;
  const mapsUrl = restaurant.google_maps_url || restaurant.googleMapsUrl;
  const website = restaurant.website;
  const phone = restaurant.phone_number || restaurant.phoneNumber;
  const mealType = restaurant.mealType || restaurant.meal_type;
  const suggestedTime = restaurant.suggested_time ||
    (restaurant.timeWindow ? `${restaurant.timeWindow.start} - ${restaurant.timeWindow.end}` : undefined);

  const getMealTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-700';
      case 'lunch':
        return 'bg-orange-100 text-orange-700';
      case 'dinner':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        {showPhotos && restaurant.photos && restaurant.photos.length > 0 && (
          <div className="relative h-32 overflow-hidden bg-gray-100">
            <img
              src={restaurant.photos[0].thumbnail || restaurant.photos[0].url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 truncate flex-1">{restaurant.name}</h4>
            {mealType && (
              <span className={`text-xs px-2 py-1 rounded-full ${getMealTypeColor(mealType)}`}>
                {mealType}
              </span>
            )}
          </div>

          {restaurant.cuisine && (
            <p className="text-sm text-gray-600 truncate">{restaurant.cuisine}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            )}

            {priceLevel > 0 && (
              <div className="flex items-center text-green-600">
                {Array.from({ length: priceLevel }).map((_, i) => (
                  <DollarSign key={i} className="w-3 h-3" />
                ))}
              </div>
            )}
          </div>
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
      {showPhotos && restaurant.photos && restaurant.photos.length > 0 && (
        <div className="p-4 pb-0">
          <ActivityPhotoGallery photos={restaurant.photos} activityName={restaurant.name} />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-2xl font-bold text-gray-900 flex-1">{restaurant.name}</h3>
            {mealType && (
              <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 ${getMealTypeColor(mealType)}`}>
                <Utensils className="w-4 h-4" />
                {mealType}
              </span>
            )}
          </div>

          {restaurant.cuisine && (
            <p className="text-lg text-gray-600">{restaurant.cuisine} Cuisine</p>
          )}

          {address && (
            <p className="text-gray-500 mt-1 text-sm">{address}</p>
          )}
        </div>

        {/* Rating, Price & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{rating.toFixed(1)}</span>
                {ratingsCount && (
                  <span className="text-gray-500 text-sm">({ratingsCount.toLocaleString()})</span>
                )}
              </div>
            )}

            {priceLevel > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                {Array.from({ length: priceLevel }).map((_, i) => (
                  <DollarSign key={i} className="w-4 h-4" />
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  {priceLevel === 1 && 'Budget-friendly'}
                  {priceLevel === 2 && 'Moderate'}
                  {priceLevel === 3 && 'Upscale'}
                  {priceLevel === 4 && 'Fine dining'}
                </span>
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

        {/* Suggested Time */}
        {suggestedTime && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Suggested: {suggestedTime}</span>
          </div>
        )}

        {/* Description */}
        {restaurant.description && (
          <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
        )}

        {/* Specialties */}
        {restaurant.specialties && restaurant.specialties.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {restaurant.specialties.map((specialty, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Types/Categories */}
        {restaurant.types && restaurant.types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {restaurant.types.slice(0, 4).map((type) => (
              <span
                key={type}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Opening Hours */}
        {restaurant.opening_hours?.weekday_text && (
          <div className="pt-4 border-t border-gray-100">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
                Opening Hours
              </summary>
              <ul className="mt-2 space-y-1 text-gray-600">
                {restaurant.opening_hours.weekday_text.map((day, idx) => (
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
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
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
              Reserve
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
