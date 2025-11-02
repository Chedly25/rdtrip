import { Clock, Mountain } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';
import { URLActionButtons } from './URLActionButtons';
import { getEntityGradient } from '../../utils/gradients';

interface ScenicStopCardProps {
  stop: any;
  theme: ThemeConfig;
}

export function ScenicStopCard({ stop, theme }: ScenicStopCardProps) {
  const hasImage = stop.imageUrl;
  const gradient = getEntityGradient('scenic', stop.name);

  return (
    <div className="rounded-lg border-l-4 overflow-hidden" style={{ borderLeftColor: theme.secondary }}>
      {/* Image or Gradient Header */}
      {hasImage ? (
        <div className="relative w-full bg-gray-100" style={{ background: gradient }}>
          <img
            src={stop.imageUrl}
            alt={stop.name}
            className="w-full h-56 object-contain"
            onError={(e) => {
              const target = e.currentTarget.parentElement;
              if (target) {
                target.innerHTML = `
                  <div class="h-56 flex items-center justify-center" style="background: ${gradient}">
                    <svg class="h-10 w-10 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div
          className="relative h-56 w-full flex items-center justify-center"
          style={{ background: gradient }}
        >
          <Mountain className="h-10 w-10 text-white opacity-40" />
        </div>
      )}

      {/* Content */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h6 className="font-semibold text-gray-900">{stop.name}</h6>
              {stop.type && (
                <span className="mt-0.5 inline-block text-xs text-gray-500">{stop.type}</span>
              )}
            </div>
            {stop.duration && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{stop.duration}</span>
              </div>
            )}
          </div>

          {stop.description && (
            <p className="mt-2 text-sm text-gray-700">{stop.description}</p>
          )}

          {stop.coordinates && (
            <div className="mt-2 text-xs text-gray-500">
              📍 {typeof stop.coordinates === 'string'
                ? stop.coordinates
                : `${stop.coordinates.lat}, ${stop.coordinates.lng}`}
            </div>
          )}

          {stop.tip && (
            <div className="mt-2 flex items-start gap-1 text-xs text-gray-600">
              <span className="flex-shrink-0">💡</span>
              <span>{stop.tip}</span>
            </div>
          )}

          {/* URL Action Buttons */}
          <URLActionButtons urls={stop.urls} compact />
        </div>
      </div>
    </div>
  );
}
