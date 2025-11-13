import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink, Phone } from 'lucide-react';

interface CompactRestaurantCardProps {
  restaurant: any;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  onSelect?: (restaurant: any) => void;
  isSelected?: boolean;
}

export function CompactRestaurantCard({ restaurant, mealType, onSelect, isSelected = false }: CompactRestaurantCardProps) {
  // Extract photo URL with fallback
  const photo = restaurant.photos?.[0];
  const photoUrl = typeof photo === 'string' ? photo :
    photo?.url || restaurant.primaryPhoto?.url || restaurant.primaryPhoto || null;

  // Google Maps link helper
  const getGoogleMapsLink = () => {
    if (restaurant.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`;
    } else if (restaurant.coordinates?.lat && restaurant.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`;
    } else if (restaurant.name) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`;
    }
    return null;
  };

  const mapsLink = getGoogleMapsLink();

  // Get meal badge
  const getMealBadge = () => {
    const meal = mealType || restaurant.meal;
    const mealColors: Record<string, { bg: string; text: string; icon: string }> = {
      breakfast: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🍳' },
      lunch: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🥗' },
      dinner: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🍽️' }
    };

    return meal ? mealColors[meal] : { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🍴' };
  };

  const mealBadge = getMealBadge();

  // Price level indicator
  const getPriceIndicator = () => {
    const priceLevel = restaurant.priceLevel || restaurant.price_level;
    if (!priceLevel) return null;
    return '$'.repeat(priceLevel);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect?.(restaurant)}
      className={`
        relative bg-white rounded-lg overflow-hidden border-2 transition-all cursor-pointer
        w-[180px] h-[240px] flex flex-col
        ${isSelected ? 'border-orange-500 shadow-lg' : 'border-gray-200 hover:border-orange-300'}
      `}
    >
      {/* Image */}
      {photoUrl && (
        <div className="relative h-[90px] w-full overflow-hidden bg-gray-100">
          <img
            src={photoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Meal badge overlay */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${mealBadge.bg} ${mealBadge.text}`}>
              {mealBadge.icon} {mealType || restaurant.meal || 'Meal'}
            </span>
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1">
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
          {restaurant.name}
        </h5>

        {/* Rating + Price */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
          {restaurant.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
            </div>
          )}

          {getPriceIndicator() && (
            <div className="flex items-center gap-0.5 text-green-600 font-medium">
              {getPriceIndicator()}
            </div>
          )}
        </div>

        {/* Cuisine type */}
        {restaurant.cuisineType && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">
            {restaurant.cuisineType}
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
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title="Open in Google Maps"
            >
              <MapPin className="w-3.5 h-3.5" />
            </a>
          )}

          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
              title="Visit website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
              title="Call"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
