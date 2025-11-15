import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Navigation,
  Calendar
} from 'lucide-react';
import ExportMenu from './ExportMenu';

interface SpotlightHeaderProps {
  onGenerateItinerary?: () => void;
  lastSaved?: string | null;
  isSaving?: boolean;
}

const SpotlightHeader = ({ onGenerateItinerary, lastSaved, isSaving }: SpotlightHeaderProps) => {
  const navigate = useNavigate();
  const { route, getCityName, getAgentColors } = useSpotlightStoreV2();
  const agentColors = getAgentColors();

  if (!route) return null;

  const originName = getCityName(route.origin);
  const destinationName = getCityName(route.destination);

  const handleExportGoogleMaps = () => {
    const waypoints = route.cities
      .map(city => getCityName(city.city))
      .filter(name => name !== originName && name !== destinationName);

    let url = `https://www.google.com/maps/dir/${encodeURIComponent(originName)}`;

    waypoints.forEach(city => {
      url += `/${encodeURIComponent(city)}`;
    });

    url += `/${encodeURIComponent(destinationName)}`;

    window.open(url, '_blank');
  };

  const handleExportWaze = () => {
    // Waze only supports start and end, so use destination
    const url = `https://waze.com/ul?q=${encodeURIComponent(destinationName)}&navigate=yes`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${originName} to ${destinationName} Route`,
          text: `Check out this road trip route from ${originName} to ${destinationName}!`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Route link copied to clipboard!');
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Back button and route info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: agentColors.accent }} />
              {originName} → {destinationName}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                {route.cities.length} {route.cities.length === 1 ? 'city' : 'cities'} •{' '}
                {route.landmarks.length} {route.landmarks.length === 1 ? 'landmark' : 'landmarks'}
              </p>
              {/* Auto-save indicator */}
              {(lastSaved || isSaving) && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {isSaving ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      Saving...
                    </>
                  ) : lastSaved ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                      Saved {formatRelativeTime(lastSaved)}
                    </>
                  ) : null}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Export and share buttons */}
        <div className="flex items-center gap-3">
          {/* Google Maps Export */}
          <button
            onClick={handleExportGoogleMaps}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-2 text-sm"
            title="Open in Google Maps"
          >
            <Navigation className="w-4 h-4" />
            Google Maps
          </button>

          {/* Waze Export */}
          <button
            onClick={handleExportWaze}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-2 text-sm"
            title="Open in Waze"
          >
            <Navigation className="w-4 h-4" />
            Waze
          </button>

          {/* Generate Itinerary Button */}
          {onGenerateItinerary && (
            <button
              onClick={onGenerateItinerary}
              className="px-4 py-2 rounded-lg border-2 border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 text-white transition-colors flex items-center gap-2 text-sm font-medium"
              title="Generate detailed day-by-day itinerary with 9 AI agents"
            >
              <Calendar className="w-4 h-4" />
              Generate Itinerary
            </button>
          )}

          {/* Export Menu */}
          <ExportMenu />

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            aria-label="Share route"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default SpotlightHeader;
