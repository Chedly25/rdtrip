import { Navigation, Clock, Camera, Mountain } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';

interface ScenicStopCardProps {
  stop: any;
  theme: ThemeConfig;
}

export function ScenicStopCard({ stop, theme }: ScenicStopCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'viewpoint':
        return <Camera className="h-4 w-4" />;
      case 'natural wonder':
      case 'nature':
        return <Mountain className="h-4 w-4" />;
      default:
        return <Navigation className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="rounded-lg border-l-4 bg-gradient-to-r from-amber-50 to-orange-50 p-3"
      style={{ borderLeftColor: theme.secondary }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white"
          style={{ color: theme.primary }}
        >
          {getTypeIcon(stop.type)}
        </div>
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
        </div>
      </div>
    </div>
  );
}
