import { Hotel, MapPin, Wifi, ParkingCircle, Coffee } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';
import { URLActionButtons } from './URLActionButtons';
import { getEntityGradient } from '../../utils/gradients';

interface HotelCardProps {
  hotel: any;
  theme: ThemeConfig;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const hasImage = hotel.imageUrl;
  const gradient = getEntityGradient('accommodation', hotel.name);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md">
      {/* Image or Gradient Header */}
      {hasImage ? (
        <div className="relative w-full" style={{ background: gradient }}>
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-auto max-h-96 object-cover"
            style={{
              minHeight: '200px',
              maxHeight: '384px'
            }}
            onError={(e) => {
              const target = e.currentTarget.parentElement;
              if (target) {
                target.innerHTML = `
                  <div class="h-64 flex items-center justify-center" style="background: ${gradient}">
                    <svg class="h-12 w-12 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div
          className="relative h-64 w-full flex items-center justify-center"
          style={{ background: gradient }}
        >
          <Hotel className="h-12 w-12 text-white opacity-40" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="font-semibold text-gray-900">{hotel.name}</h5>
              {hotel.type && (
                <span className="mt-1 inline-block text-xs text-gray-500">{hotel.type}</span>
              )}
            </div>
            {hotel.pricePerNight && (
              <div className="text-right">
                <div className="font-semibold text-gray-900">${hotel.pricePerNight}</div>
                <div className="text-xs text-gray-500">per night</div>
              </div>
            )}
          </div>

          {hotel.location && (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5" />
              <span>{hotel.location}</span>
            </div>
          )}

          {hotel.description && (
            <p className="mt-2 text-sm text-gray-600">{hotel.description}</p>
          )}

          {hotel.whyRecommended && (
            <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-gray-700">
              <strong>Why this location:</strong> {hotel.whyRecommended}
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hotel.amenities.map((amenity: string, index: number) => {
                const getAmenityIcon = (name: string) => {
                  if (name.toLowerCase().includes('wifi')) return <Wifi className="h-3 w-3" />;
                  if (name.toLowerCase().includes('parking')) return <ParkingCircle className="h-3 w-3" />;
                  if (name.toLowerCase().includes('breakfast')) return <Coffee className="h-3 w-3" />;
                  return null;
                };

                return (
                  <span
                    key={index}
                    className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    {getAmenityIcon(amenity)}
                    {amenity}
                  </span>
                );
              })}
            </div>
          )}

          {hotel.bookingTip && (
            <div className="mt-2 text-xs text-gray-500">
              💡 {hotel.bookingTip}
            </div>
          )}

          {/* URL Action Buttons */}
          <URLActionButtons urls={hotel.urls} compact />
        </div>
      </div>
    </div>
  );
}
