import { DollarSign, Star, Wine } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';
import { URLActionButtons } from './URLActionButtons';

interface RestaurantCardProps {
  restaurant: any;
  theme: ThemeConfig;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md">
      {/* Content */}
      <div className="p-4">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="font-semibold text-gray-900">{restaurant.name}</h5>
              {restaurant.mealType && (
                <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {restaurant.mealType}
                </span>
              )}
            </div>
            {restaurant.priceRange && (
              <div className="flex items-center gap-0.5 text-gray-600">
                {Array.from({ length: restaurant.priceRange }).map((_, i) => (
                  <DollarSign key={i} className="h-3.5 w-3.5" />
                ))}
              </div>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-600">{restaurant.cuisine}</p>

          {restaurant.description && (
            <p className="mt-1 text-sm text-gray-500">{restaurant.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {restaurant.location && (
              <span>{restaurant.location}</span>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{restaurant.rating}</span>
              </div>
            )}
          </div>

          {restaurant.signature && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-orange-50 p-2 text-xs">
              <Wine className="h-3.5 w-3.5 flex-shrink-0 text-orange-600" />
              <span className="text-gray-700">
                <strong>Must-try:</strong> {restaurant.signature}
              </span>
            </div>
          )}

          {restaurant.reservationTip && (
            <div className="mt-2 text-xs text-gray-500">
              💡 {restaurant.reservationTip}
            </div>
          )}

          {/* URL Action Buttons */}
          <URLActionButtons urls={restaurant.urls} compact />
        </div>
      </div>
    </div>
  );
}
