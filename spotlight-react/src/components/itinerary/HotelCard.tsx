import { MapPin, Wifi, ParkingCircle, Coffee } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';
import { URLActionButtons } from './URLActionButtons';

interface HotelCardProps {
  hotel: any;
  theme: ThemeConfig;
}

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md">
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
