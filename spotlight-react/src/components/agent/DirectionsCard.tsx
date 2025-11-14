/**
 * DirectionsCard - Visual Directions Display
 *
 * Displays navigation directions with distance, duration, and mode
 */

import { Navigation, Clock, MapPin, Car, } from 'lucide-react';

interface DirectionsData {
  from: string;
  to: string;
  distance: number; // in km
  duration: number; // in minutes
  mode: 'driving' | 'walking' | 'cycling' | 'transit';
  summary?: string;
}

interface DirectionsCardProps {
  data: DirectionsData;
}

export function DirectionsCard({ data }: DirectionsCardProps) {
  const { from, to, distance, duration, mode, summary } = data;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
          <Navigation className="w-5 h-5 text-teal-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Directions</h3>
      </div>

      {/* Route */}
      <div className="space-y-4 mb-6">
        {/* From */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">From</div>
            <div className="text-sm font-semibold text-gray-900">{from}</div>
          </div>
        </div>

        {/* Connecting line */}
        <div className="ml-3 border-l-2 border-dashed border-gray-300 h-8" />

        {/* To */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">To</div>
            <div className="text-sm font-semibold text-gray-900">{to}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
        <div>
          <div className="flex items-center gap-1 text-gray-600 mb-1">
            <Car className="w-4 h-4" />
            <span className="text-xs">Mode</span>
          </div>
          <div className="text-sm font-semibold text-gray-900 capitalize">{mode}</div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-gray-600 mb-1">
            <Navigation className="w-4 h-4" />
            <span className="text-xs">Distance</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Duration</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {duration < 60 ? `${duration} min` : `${Math.round(duration / 60)}h ${duration % 60}min`}
          </div>
        </div>
      </div>

      {/* Summary/Notes */}
      {summary && (
        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
          {summary}
        </div>
      )}

      {/* Action */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        Open in Google Maps
      </a>
    </div>
  );
}
