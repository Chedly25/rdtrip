import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink, Phone, Wifi, Coffee, ParkingCircle, DollarSign, Hotel } from 'lucide-react';
import { ActivityPhotoGallery } from './ActivityPhotoGallery';

interface Accommodation {
  id?: string;
  name: string;
  type?: string;
  description?: string;
  rating?: number;
  user_ratings_total?: number;
  stars?: number;
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
  city?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  price_level?: number;
  priceLevel?: number;
  estimatedPrice?: string;
  amenities?: string[];
  google_maps_url?: string;
  googleMapsUrl?: string;
  website?: string;
  phone_number?: string;
  phoneNumber?: string;
  types?: string[];
}

interface EnhancedAccommodationCardProps {
  accommodation: Accommodation;
  showPhotos?: boolean;
  compact?: boolean;
}

export function EnhancedAccommodationCard({ accommodation, showPhotos = true, compact = false }: EnhancedAccommodationCardProps) {
  const priceLevel = accommodation.price_level || accommodation.priceLevel || 0;
  const address = accommodation.formatted_address || accommodation.address;
  const rating = accommodation.rating;
  const ratingsCount = accommodation.user_ratings_total;
  const mapsUrl = accommodation.google_maps_url || accommodation.googleMapsUrl;
  const website = accommodation.website;
  const phone = accommodation.phone_number || accommodation.phoneNumber;
  const stars = accommodation.stars || (rating && priceLevel ? Math.min(Math.round((rating / 5) * 5), 5) : undefined);

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (lower.includes('breakfast') || lower.includes('food')) return <Coffee className="w-4 h-4" />;
    if (lower.includes('parking')) return <ParkingCircle className="w-4 h-4" />;
    return <Hotel className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        {showPhotos && accommodation.photos && accommodation.photos.length > 0 && (
          <div className="relative h-32 overflow-hidden bg-gray-100">
            <img
              src={accommodation.photos[0].thumbnail || accommodation.photos[0].url}
              alt={accommodation.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4">
          <h4 className="font-semibold text-gray-900 truncate">{accommodation.name}</h4>
          {accommodation.type && (
            <p className="text-sm text-gray-600 mt-1">{accommodation.type}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            )}

            {stars && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-purple-500 text-purple-500" />
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
      {showPhotos && accommodation.photos && accommodation.photos.length > 0 && (
        <div className="p-4 pb-0">
          <ActivityPhotoGallery photos={accommodation.photos} activityName={accommodation.name} />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-2xl font-bold text-gray-900 flex-1">{accommodation.name}</h3>
            {stars && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-purple-500 text-purple-500" />
                ))}
              </div>
            )}
          </div>

          {accommodation.type && (
            <p className="text-lg text-gray-600">{accommodation.type}</p>
          )}

          {address && (
            <p className="text-gray-500 mt-1 text-sm">{address}</p>
          )}
        </div>

        {/* Rating & Price */}
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
              <div className="flex items-center gap-1 text-purple-600">
                {Array.from({ length: priceLevel }).map((_, i) => (
                  <DollarSign key={i} className="w-4 h-4" />
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  {priceLevel === 1 && 'Budget'}
                  {priceLevel === 2 && 'Mid-range'}
                  {priceLevel === 3 && 'Upscale'}
                  {priceLevel === 4 && 'Luxury'}
                </span>
              </div>
            )}
          </div>

          {accommodation.estimatedPrice && (
            <span className="text-lg font-semibold text-purple-600">
              {accommodation.estimatedPrice}
            </span>
          )}
        </div>

        {/* Check-in/out & Nights */}
        {(accommodation.checkIn || accommodation.nights) && (
          <div className="flex items-center gap-4 text-sm text-gray-700 p-3 bg-purple-50 rounded-lg">
            {accommodation.checkIn && accommodation.checkOut && (
              <div>
                <span className="font-medium">Check-in:</span> {accommodation.checkIn}
                <span className="mx-2">→</span>
                <span className="font-medium">Check-out:</span> {accommodation.checkOut}
              </div>
            )}
            {accommodation.nights && (
              <span className="ml-auto font-medium text-purple-700">
                {accommodation.nights} {accommodation.nights === 1 ? 'night' : 'nights'}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {accommodation.description && (
          <p className="text-gray-700 leading-relaxed">{accommodation.description}</p>
        )}

        {/* Amenities */}
        {accommodation.amenities && accommodation.amenities.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Amenities</h4>
            <div className="grid grid-cols-2 gap-2">
              {accommodation.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="text-purple-600">
                    {getAmenityIcon(amenity)}
                  </span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property types/categories */}
        {accommodation.types && accommodation.types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {accommodation.types.slice(0, 4).map((type) => (
              <span
                key={type}
                className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
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
              Visit Website
            </a>
          )}

          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              Call to Book
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
