import { MapPin, Clock, DollarSign, Star } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';
import { getEntityGradient } from '../../utils/gradients';

interface ActivityCardProps {
  activity: any;
  theme: ThemeConfig;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const hasImage = activity.imageUrl;
  const gradient = getEntityGradient('activity', activity.name);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md">
      {/* Image or Gradient Header */}
      {hasImage ? (
        <div className="relative w-full" style={{ background: gradient }}>
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="w-full h-auto max-h-96 object-cover"
            style={{
              minHeight: '200px',
              maxHeight: '384px'
            }}
            onError={(e) => {
              // Fallback to gradient if image fails to load
              const target = e.currentTarget.parentElement;
              if (target) {
                target.innerHTML = `
                  <div class="h-64 flex items-center justify-center" style="background: ${gradient}">
                    <svg class="h-12 w-12 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
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
          <MapPin className="h-12 w-12 text-white opacity-40" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
          <h5 className="font-semibold text-gray-900">{activity.name}</h5>
          <p className="mt-1 text-sm text-gray-600">{activity.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {activity.timeSlot && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.timeSlot}</span>
              </div>
            )}
            {activity.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.duration}</span>
              </div>
            )}
            {activity.cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{activity.cost}</span>
              </div>
            )}
            {activity.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{activity.rating}</span>
              </div>
            )}
          </div>

          {activity.whyVisit && (
            <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs italic text-gray-600">
              "{activity.whyVisit}"
            </div>
          )}

          {activity.tips && (
            <div className="mt-2 text-xs text-gray-500">
              💡 {activity.tips}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
