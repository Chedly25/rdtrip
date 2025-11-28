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
    setIsCalculatingDetour
  } = useSpotlightStoreV2();

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
      const results = await searchPlaces(searchQuery, activeTab);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Add to Route</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('landmark')}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'landmark'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Landmark
              </button>
              <button
                onClick={() => setActiveTab('city')}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'city'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                City
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for a ${activeTab}...`}
                className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedPlace && (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectPlace(result)}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {result.photoUrl && activeTab === 'landmark' ? (
                        <img
                          src={result.photoUrl}
                          alt={result.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          {activeTab === 'landmark' ? (
                            <Star className="w-5 h-5 text-neutral-400" />
                          ) : (
                            <MapPin className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-900 font-medium truncate">{result.name}</p>
                        {result.country && (
                          <p className="text-neutral-500 text-sm">{result.country}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Place */}
            {selectedPlace && (
              <div className="mt-4 bg-neutral-50 rounded-xl overflow-hidden">
                {/* Photo header for landmarks */}
                {selectedPlace.photoUrl && activeTab === 'landmark' && (
                  <img
                    src={selectedPlace.photoUrl}
                    alt={selectedPlace.name}
                    className="w-full h-32 object-cover"
                  />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0">
                        {activeTab === 'landmark' ? (
                          <Star className="w-5 h-5 text-white" />
                        ) : (
                          <MapPin className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-neutral-900 font-semibold">{selectedPlace.displayName}</h3>
                        {selectedPlace.country && (
                          <p className="text-neutral-500 text-sm">{selectedPlace.country}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlace(null);
                        setDetourInfo(null);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Detour Info */}
                  {activeTab === 'landmark' && (
                    <>
                      {isCalculating ? (
                        <div className="flex items-center gap-2 text-neutral-400 mt-4 pt-4 border-t border-neutral-200">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Calculating optimal position...</span>
                        </div>
                      ) : detourInfo && (
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <div className="flex items-center gap-2 text-sm">
                            <Navigation className="w-4 h-4 text-neutral-500" />
                            <span className="text-neutral-700">
                              Detour: <span className="font-semibold text-neutral-900">+{detourInfo.detourKm.toFixed(1)} km</span> · <span className="font-semibold text-neutral-900">+{Math.round(detourInfo.detourMinutes)} min</span>
                            </span>
                          </div>
                          <p className="text-neutral-500 text-xs mt-1.5">
                            Will be added after {getCityName(route?.cities[detourInfo.insertAfterIndex]?.city || '')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!selectedPlace && searchQuery.length < 2 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-neutral-100">
                  {activeTab === 'landmark' ? (
                    <Star className="w-7 h-7 text-neutral-400" />
                  ) : (
                    <MapPin className="w-7 h-7 text-neutral-400" />
                  )}
                </div>
                <p className="text-neutral-500 text-sm">
                  {activeTab === 'landmark'
                    ? 'Search for a landmark to add to your route'
                    : 'Search for a city to add as a waypoint'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedPlace || (activeTab === 'landmark' && (!detourInfo || isCalculating))}
              className="flex-1 px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800"
            >
              {isCalculating ? (
                <span className="flex items-center justify-center gap-2">
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
