import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, MapPin, Plus, Navigation, TrendingUp, Sparkles } from 'lucide-react';
import type { Landmark } from '../../../services/landmarks';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchCityImageCached } from '../../../services/wikipedia';

interface LandmarkDetailsModalProps {
  landmark: Landmark | null;
  onClose: () => void;
}

const LandmarkDetailsModal = ({ landmark, onClose }: LandmarkDetailsModalProps) => {
  const { addLandmarkToRoute, getAgentColors, route, getCityName } = useSpotlightStoreV2();
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [landmarkImage, setLandmarkImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [detourInfo, setDetourInfo] = useState<{
    km: number;
    minutes: number;
    fromCity: string;
    toCity: string;
  } | null>(null);

  const agentColors = getAgentColors();

  // Fetch landmark image from Wikipedia
  useEffect(() => {
    if (!landmark) return;

    const loadImage = async () => {
      setImageLoading(true);
      try {
        // Try fetching from Wikipedia using landmark name
        const imageUrl = await fetchCityImageCached(landmark.name);
        if (imageUrl) {
          setLandmarkImage(imageUrl);
        } else if (landmark.image_url) {
          // Fallback to landmark's own image URL if available
          setLandmarkImage(landmark.image_url);
        }
      } catch (error) {
        console.error('Failed to load landmark image:', error);
        // Use landmark's image_url as fallback
        if (landmark.image_url) {
          setLandmarkImage(landmark.image_url);
        }
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [landmark]);

  // Calculate detour impact
  useEffect(() => {
    if (!landmark || !route) return;

    // Calculate which two cities this landmark would be inserted between
    const cities = route.cities;
    let bestInsertIndex = 0;
    let minDetour = Infinity;

    // Haversine distance calculation
    const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) *
        Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Find optimal insertion point
    for (let i = 0; i < cities.length - 1; i++) {
      const city1Coords = cities[i].coordinates;
      const city2Coords = cities[i + 1].coordinates;

      if (!city1Coords || !city2Coords) continue;

      const landmarkCoords = { lat: landmark.lat, lng: landmark.lng };

      // Calculate detour: city1 -> landmark -> city2 vs city1 -> city2 direct
      const directDistance = calculateDistance(city1Coords, city2Coords);
      const detourDistance =
        calculateDistance(city1Coords, landmarkCoords) +
        calculateDistance(landmarkCoords, city2Coords);

      const detourKm = detourDistance - directDistance;

      if (detourKm < minDetour) {
        minDetour = detourKm;
        bestInsertIndex = i;
      }
    }

    if (minDetour !== Infinity) {
      setDetourInfo({
        km: minDetour,
        minutes: Math.round(minDetour / 80 * 60), // Assume 80 km/h average speed
        fromCity: getCityName(cities[bestInsertIndex].city),
        toCity: getCityName(cities[bestInsertIndex + 1].city)
      });
    }
  }, [landmark, route, getCityName]);

  if (!landmark) return null;

  const handleAddToRoute = async () => {
    setIsAdding(true);
    try {
      // Add landmark to route (store will handle route recalculation)
      await addLandmarkToRoute(landmark);
      setAddSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        setAddSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to add landmark to route:', error);
      setIsAdding(false);
    }
  };

  // Generate highlights from landmark data
  const highlights = [
    landmark.type === 'historic' && '🏛️ UNESCO World Heritage Site',
    landmark.rating >= 4.5 && '⭐ Top-rated attraction',
    landmark.visit_duration >= 120 && '🎨 Allow plenty of time to explore',
    landmark.type === 'natural' && '🌿 Beautiful natural scenery',
    '📸 Perfect for photography'
  ].filter(Boolean);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Hero Image Section */}
          <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
            {imageLoading ? (
              // Loading skeleton
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            ) : landmarkImage ? (
              <>
                <img
                  src={landmarkImage}
                  alt={landmark.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Gradient overlay for better text readability */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)`
                  }}
                />
              </>
            ) : (
              // Fallback gradient if no image
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${agentColors.primary}20, ${agentColors.secondary}40)`
                }}
              />
            )}

            {/* Type badge overlay on image */}
            <div className="absolute top-4 left-4">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                }}
              >
                {landmark.type}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {landmark.name}
                </h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{landmark.city}, {landmark.country}</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${agentColors.primary}15, ${agentColors.secondary}15)`
                    }}
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {landmark.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Visit Duration */}
                {landmark.visit_duration > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {landmark.visit_duration < 60
                        ? `${landmark.visit_duration} min`
                        : `${Math.round(landmark.visit_duration / 60)} hr`
                      } visit
                    </span>
                  </div>
                )}
              </div>

              {/* Detour Impact Card */}
              {detourInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 p-4 rounded-xl border-2"
                  style={{
                    borderColor: `${agentColors.accent}40`,
                    background: `linear-gradient(135deg, ${agentColors.primary}05, ${agentColors.secondary}05)`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                      }}
                    >
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Route Impact</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-lg" style={{ color: agentColors.accent }}>
                          +{detourInfo.km.toFixed(0)} km
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-bold text-lg" style={{ color: agentColors.accent }}>
                          +{detourInfo.minutes} min
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Between <span className="font-medium">{detourInfo.fromCity}</span> → <span className="font-medium">{detourInfo.toCity}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">
                  {landmark.description || 'A must-see attraction on your European road trip! This landmark offers a unique glimpse into the region\'s history, culture, and natural beauty.'}
                </p>
              </div>

              {/* Highlights */}
              {highlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles
                      className="w-5 h-5"
                      style={{ color: agentColors.accent }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">Highlights</h3>
                  </div>
                  <ul className="space-y-2">
                    {highlights.map((highlight, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-2 text-gray-700"
                      >
                        <span className="text-sm leading-relaxed">{highlight}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </div>

          {/* Sticky Footer with Action Buttons */}
          <div className="flex-shrink-0 p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {/* Add to Route Button */}
              <button
                onClick={handleAddToRoute}
                disabled={isAdding || addSuccess}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: addSuccess
                    ? '#10b981' // Green on success
                    : `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                }}
              >
                {addSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.div>
                    Added to Route!
                  </>
                ) : isAdding ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Navigation className="w-5 h-5" />
                    </motion.div>
                    Calculating Route...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add to Route
                  </>
                )}
              </button>

              {/* View on Map Button */}
              <button
                onClick={() => {
                  // Zoom to landmark location (TODO: implement map zoom)
                  onClose();
                }}
                className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors flex items-center gap-2 shadow-sm"
              >
                <MapPin className="w-5 h-5" />
                View on Map
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default LandmarkDetailsModal;
