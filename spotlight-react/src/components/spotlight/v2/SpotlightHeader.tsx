import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ArrowLeft,
  Share2,
  Download,
  Navigation,
  Bookmark,
  Check,
  Copy,
} from 'lucide-react';
import { Button, Badge } from '../../ui';
import { AuthButton } from '../../auth';

interface SpotlightHeaderProps {
  onGenerateItinerary?: () => void;
  onSave?: () => void;
}

const SpotlightHeader = ({ onGenerateItinerary, onSave }: SpotlightHeaderProps) => {
  const navigate = useNavigate();
  const { route, getCityName } = useSpotlightStoreV2();
  const { isAuthenticated } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!route) return null;

  const originName = getCityName(route.origin);
  const destinationName = getCityName(route.destination);
  const totalNights = route.cities.reduce((sum, city) => sum + (city.nights || 0), 0);

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
    setShowExportMenu(false);
  };

  const handleExportWaze = () => {
    const url = `https://waze.com/ul?q=${encodeURIComponent(destinationName)}&navigate=yes`;
    window.open(url, '_blank');
    setShowExportMenu(false);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${originName} to ${destinationName} Route`,
          text: `Check out this road trip from ${originName} to ${destinationName}!`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.15, 0.5, 0.5, 1] }}
      className="absolute top-0 left-0 right-0 z-50 h-14 bg-rui-white/95 backdrop-blur-xl border-b border-rui-grey-10"
    >
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Back button and route info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="h-9 px-2.5 rounded-rui-12 bg-rui-grey-5 hover:bg-rui-grey-10 flex items-center gap-1.5 transition-colors duration-rui-sm"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4 text-rui-black" />
            {/* Waycraft Icon */}
            <svg
              viewBox="0 0 48 40"
              className="h-5 w-auto"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="waycraft-header-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C45830" />
                  <stop offset="50%" stopColor="#D4A853" />
                  <stop offset="100%" stopColor="#E8C547" />
                </linearGradient>
              </defs>
              <path
                d="M4 8 L4 32 Q4 36 8 36 L12 36 Q16 36 18 32 L24 16 L30 32 Q32 36 36 36 L40 36 Q44 36 44 32 L44 8"
                fill="none"
                stroke="url(#waycraft-header-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M42 4 L43 7 L46 8 L43 9 L42 12 L41 9 L38 8 L41 7 Z"
                fill="#D4A853"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="font-marketing text-heading-3 text-rui-black">
              {originName} <span className="text-rui-accent">→</span> {destinationName}
            </h1>
            <Badge variant="secondary" size="sm">
              {route.cities.length} cities
            </Badge>
            <Badge variant="outline" size="sm">
              {totalNights} nights
            </Badge>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Save Button - Smart auth-aware */}
          {onSave && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isAuthenticated) {
                    onSave();
                  } else {
                    setShowLoginPrompt(true);
                  }
                }}
                className="gap-1.5"
              >
                <Bookmark className="w-4 h-4" />
                Save
              </Button>

              {/* Login prompt tooltip */}
              <AnimatePresence>
                {showLoginPrompt && !isAuthenticated && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLoginPrompt(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl shadow-lg z-50"
                      style={{
                        background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)',
                        boxShadow: '0 10px 40px rgba(44, 36, 23, 0.15), 0 0 0 1px rgba(44, 36, 23, 0.05)'
                      }}
                    >
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: '#2C2417' }}
                      >
                        Sign in to save your trip
                      </p>
                      <p
                        className="text-xs mb-3"
                        style={{ color: '#8B7355' }}
                      >
                        Create an account to save routes and access them from any device.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowLoginPrompt(false)}
                          className="flex-1 py-2 px-3 text-xs font-medium rounded-xl transition-colors"
                          style={{
                            color: '#8B7355',
                            background: '#F5F0E8'
                          }}
                        >
                          Maybe later
                        </button>
                      </div>
                      {/* Arrow pointing up */}
                      <div
                        className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                        style={{ background: '#FFFBF5' }}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Share Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="relative"
            aria-label="Share route"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </Button>

          {/* Export Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-label="Export options"
            >
              <Download className="w-4 h-4" />
            </Button>

            <AnimatePresence>
              {showExportMenu && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.15, 0.5, 0.5, 1] }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-rui-16 shadow-rui-3 border border-rui-grey-10 overflow-hidden z-50"
                  >
                    <div className="py-1">
                      <button
                        onClick={handleExportGoogleMaps}
                        className="w-full px-4 py-2.5 text-left text-body-2 text-rui-black hover:bg-rui-grey-5 flex items-center gap-3 transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-rui-grey-50" />
                        Google Maps
                      </button>
                      <button
                        onClick={handleExportWaze}
                        className="w-full px-4 py-2.5 text-left text-body-2 text-rui-black hover:bg-rui-grey-5 flex items-center gap-3 transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-rui-grey-50" />
                        Waze
                      </button>
                      <div className="h-px bg-rui-grey-10 my-1" />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-body-2 text-rui-black hover:bg-rui-grey-5 flex items-center gap-3 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-rui-grey-50" />
                        Copy Link
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Generate Itinerary CTA */}
          {onGenerateItinerary && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerateItinerary}
              className="ml-2"
            >
              Generate Itinerary
            </Button>
          )}

          {/* Auth Button - Sign in/Profile */}
          <div className="ml-2 border-l border-rui-grey-10 pl-3">
            <AuthButton variant="compact" />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default SpotlightHeader;
