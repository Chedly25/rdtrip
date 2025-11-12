import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import {
  ArrowLeft,
  Download,
  Share2,
  MapPin,
  Navigation
} from 'lucide-react';
import { useState } from 'react';

const SpotlightHeader = () => {
  const navigate = useNavigate();
  const { route, getCityName, getAgentColors } = useSpotlightStoreV2();
  const [showExportMenu, setShowExportMenu] = useState(false);
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

  const handleExportPDF = async () => {
    // TODO: Implement PDF export in Phase 5
    console.log('PDF export not yet implemented');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(route, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route-${originName}-to-${destinationName}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      className="absolute top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Back button and route info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: agentColors.accent }} />
              {originName} → {destinationName}
            </h1>
            <p className="text-sm text-gray-400">
              {route.cities.length} {route.cities.length === 1 ? 'city' : 'cities'} •{' '}
              {route.landmarks.length} {route.landmarks.length === 1 ? 'landmark' : 'landmarks'}
            </p>
          </div>
        </div>

        {/* Right: Export and share buttons */}
        <div className="flex items-center gap-3">
          {/* Google Maps Export */}
          <button
            onClick={handleExportGoogleMaps}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2 text-sm"
            title="Open in Google Maps"
          >
            <Navigation className="w-4 h-4" />
            Google Maps
          </button>

          {/* Waze Export */}
          <button
            onClick={handleExportWaze}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2 text-sm"
            title="Open in Waze"
          >
            <Navigation className="w-4 h-4" />
            Waze
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-sm"
              style={{
                background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => {
                    handleExportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors text-sm"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors text-sm"
                >
                  Export as JSON
                </button>
              </motion.div>
            )}
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            aria-label="Share route"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default SpotlightHeader;
