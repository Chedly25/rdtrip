import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Star, Loader2, Navigation } from 'lucide-react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { searchPlaces, type GeocodingResult } from '../../../services/geocoding';
import { findOptimalInsertPosition } from '../../../services/mapboxRoutes';

interface AddCityLandmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCityLandmarkModal = ({ isOpen, onClose }: AddCityLandmarkModalProps) => {
  const [activeTab, setActiveTab] = useState<'city' | 'landmark'>('landmark');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GeocodingResult | null>(null);
  const [detourInfo, setDetourInfo] = useState<{
    insertAfterIndex: number;
    detourKm: number;
    detourMinutes: number;
  } | null>(null);

  const {
    route,
    addLandmark,
    updateCities,
    getCityCoordinates,
    getCityName,
    getAgentColors,
    setIsCalculatingDetour
  } = useSpotlightStoreV2();

  const agentColors = getAgentColors();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPlace(null);
      setDetourInfo(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectPlace = async (place: GeocodingResult) => {
    setSelectedPlace(place);
    setSearchResults([]);

    // Calculate detour if it's a landmark
    if (activeTab === 'landmark' && route) {
      setIsCalculating(true);
      setIsCalculatingDetour(true);

      // Get all city coordinates
      const cityCoords: [number, number][] = route.cities
        .map(city => getCityCoordinates(city.city))
        .filter((coord): coord is { lat: number; lng: number } => coord !== null)
        .map(coord => [coord.lng, coord.lat]);

      if (cityCoords.length >= 2) {
        const landmarkCoord: [number, number] = [place.coordinates.lng, place.coordinates.lat];

        const optimal = await findOptimalInsertPosition(cityCoords, landmarkCoord);

        setDetourInfo({
          insertAfterIndex: optimal.insertAfterIndex,
          detourKm: optimal.detourKm,
          detourMinutes: optimal.detourMinutes
        });
      }

      setIsCalculating(false);
      setIsCalculatingDetour(false);
    }
  };

  const handleAddLandmark = () => {
    if (!selectedPlace || !detourInfo || !route) return;

    const landmark = {
      id: `landmark-${Date.now()}`,
      name: selectedPlace.displayName,
      coordinates: selectedPlace.coordinates,
      description: '',
      detourKm: detourInfo.detourKm,
      detourMinutes: detourInfo.detourMinutes,
      insertAfterCityIndex: detourInfo.insertAfterIndex
    };

    addLandmark(landmark);
    onClose();
  };

  const handleAddCity = async () => {
    if (!selectedPlace || !route) return;

    const newCity = {
      city: {
        name: selectedPlace.name,
        country: selectedPlace.country || '',
        coordinates: selectedPlace.coordinates
      },
      coordinates: selectedPlace.coordinates,
      nights: 1,
      activities: [],
      restaurants: [],
      accommodation: [],
      agentData: {}
    };

    // Add city at the end (before destination)
    const updatedCities = [
      ...route.cities.slice(0, -1), // All cities except last
      newCity,
      route.cities[route.cities.length - 1] // Destination
    ];

    updateCities(updatedCities);
    onClose();
  };

  const handleAdd = () => {
    if (activeTab === 'landmark') {
      handleAddLandmark();
    } else {
      handleAddCity();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl mx-4 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${agentColors.primary}20, ${agentColors.secondary}20)`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Add to Route</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('landmark')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'landmark'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  background: activeTab === 'landmark'
                    ? `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                    : 'transparent'
                }}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Add Landmark
              </button>
              <button
                onClick={() => setActiveTab('city')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'city'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  background: activeTab === 'city'
                    ? `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                    : 'transparent'
                }}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Add City
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for a ${activeTab}...`}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                style={{
                  '--tw-ring-color': agentColors.accent
                } as any}
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedPlace && (
              <div className="mb-4 max-h-60 overflow-y-auto bg-slate-700 rounded-lg border border-white/10">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectPlace(result)}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {activeTab === 'landmark' ? (
                        <Star className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{result.name}</p>
                        {result.country && (
                          <p className="text-gray-400 text-sm">{result.country}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Place */}
            {selectedPlace && (
              <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {activeTab === 'landmark' ? (
                      <Star className="w-6 h-6" style={{ color: agentColors.accent }} />
                    ) : (
                      <MapPin className="w-6 h-6" style={{ color: agentColors.accent }} />
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{selectedPlace.displayName}</h3>
                      {selectedPlace.country && (
                        <p className="text-gray-400 text-sm">{selectedPlace.country}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPlace(null);
                      setDetourInfo(null);
                    }}
                    className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Detour Info */}
                {activeTab === 'landmark' && (
                  <>
                    {isCalculating ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Calculating optimal position...</span>
                      </div>
                    ) : detourInfo && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="w-4 h-4" style={{ color: agentColors.accent }} />
                          <span className="text-white">
                            Detour: <strong>+{detourInfo.detourKm.toFixed(1)} km</strong> • <strong>+{Math.round(detourInfo.detourMinutes)} min</strong>
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Will be added after {getCityName(route?.cities[detourInfo.insertAfterIndex]?.city || '')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Info Text */}
            {!selectedPlace && searchQuery.length < 2 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${agentColors.primary}20, ${agentColors.secondary}20)`
                  }}
                >
                  {activeTab === 'landmark' ? (
                    <Star className="w-8 h-8" style={{ color: agentColors.accent }} />
                  ) : (
                    <MapPin className="w-8 h-8" style={{ color: agentColors.accent }} />
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {activeTab === 'landmark'
                    ? 'Search for a landmark to add to your route'
                    : 'Search for a city to add as a waypoint'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedPlace || (activeTab === 'landmark' && (!detourInfo || isCalculating))}
              className="px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedPlace && (!isCalculating && (activeTab === 'city' || detourInfo))
                  ? `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                  : '#6b7280'
              }}
            >
              {isCalculating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </span>
              ) : (
                `Add ${activeTab === 'landmark' ? 'Landmark' : 'City'}`
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddCityLandmarkModal;
