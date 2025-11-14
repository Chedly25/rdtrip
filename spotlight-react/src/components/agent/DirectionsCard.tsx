/**
 * DirectionsCard - Visual Directions Display
 *
 * Displays navigation directions with distance, duration, and mode
 */

import { Navigation, Clock, MapPin, Car, AlertTriangle } from 'lucide-react';

interface RouteDetails {
  distance: {
    text: string;
    meters: number;
    km: number;
  };
  duration: {
    text: string;
    seconds: number;
    hours: number;
  };
  startAddress: string;
  endAddress: string;
  overview: string;
  warnings?: string[];
}

interface DirectionsData {
  success: boolean;
  from: string;
  to: string;
  mode: string;
  primaryRoute: RouteDetails;
  alternatives?: Array<{
    distance: { text: string; km: number };
    duration: { text: string; hours: number };
    overview: string;
  }>;
  totalRoutes?: number;
  summary?: string;
  error?: string;
}

interface DirectionsCardProps {
  data: DirectionsData;
}

export function DirectionsCard({ data }: DirectionsCardProps) {
  if (!data.success) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Directions Failed</h3>
            <p className="text-sm text-red-600">{data.error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { from, to, mode, primaryRoute, alternatives = [] } = data;

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
            {primaryRoute.distance.text}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Duration</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {primaryRoute.duration.text}
          </div>
        </div>
      </div>

      {/* Route Overview */}
      {primaryRoute.overview && (
        <div className="mb-4 p-3 bg-teal-50 rounded-xl">
          <p className="text-xs font-semibold text-teal-700 mb-1">Recommended Route</p>
          <p className="text-sm text-gray-700">{primaryRoute.overview}</p>
        </div>
      )}

      {/* Warnings */}
      {primaryRoute.warnings && primaryRoute.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-700 mb-1">Warnings</p>
              {primaryRoute.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-gray-700">{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alternative Routes */}
      {alternatives.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-700 mb-2">Alternative Routes</p>
          <div className="space-y-2">
            {alternatives.map((alt, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{alt.overview}</span>
                <span className="text-gray-600">{alt.distance.text} • {alt.duration.text}</span>
              </div>
            ))}
          </div>
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
