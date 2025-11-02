import { DollarSign, Star, Wine, UtensilsCrossed } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';
import { URLActionButtons } from './URLActionButtons';
import { getEntityGradient } from '../../utils/gradients';

interface RestaurantCardProps {
  restaurant: any;
  theme: ThemeConfig;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const hasImage = restaurant.imageUrl;
  const gradient = getEntityGradient('restaurant', restaurant.name);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md">
      {/* Image or Gradient Header */}
      {hasImage ? (
        <div className="relative w-full" style={{ background: gradient }}>
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
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
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
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
          <UtensilsCrossed className="h-12 w-12 text-white opacity-40" />
        </div>
      )}

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
