/**
 * HotelCard - Hotel Search Results Display
 *
 * Shows hotel options with ratings, prices, and booking links
 */

import { Hotel, Star, MapPin, ExternalLink, DollarSign } from 'lucide-react';

interface HotelData {
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  bookingLink: string;
  photoReference?: string;
}

interface HotelSearchData {
  success: boolean;
  city: string;
  priceLevel?: string;
  hotels: HotelData[];
  count: number;
  message?: string;
  error?: string;
}

interface HotelCardProps {
  data: HotelSearchData;
}

export function HotelCard({ data }: HotelCardProps) {
  if (!data.success) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Hotel className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Hotel Search Failed</h3>
            <p className="text-sm text-red-600">{data.error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { city, priceLevel, hotels } = data;

  const getPriceLevelDisplay = (level?: number) => {
    if (!level) return 'Price not available';
    return '€'.repeat(level);
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
          <Hotel className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Hotels in {city}</h3>
          <p className="text-sm text-gray-600">
            {hotels.length} {priceLevel ? `${priceLevel} ` : ''}option{hotels.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Hotel List */}
      <div className="space-y-4">
        {hotels.map((hotel, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl p-4 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
          >
            {/* Hotel Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">{hotel.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{hotel.address}</span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-3">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-gray-900">{hotel.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-600">({hotel.userRatingsTotal})</span>
              </div>

              {/* Price Level */}
              {hotel.priceLevel && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {getPriceLevelDisplay(hotel.priceLevel)}
                  </span>
                </div>
              )}
            </div>

            {/* Booking Button */}
            <a
              href={hotel.bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Prices and availability may vary. Check with hotels directly for best rates.
        </p>
      </div>
    </div>
  );
}
