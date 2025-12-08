import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  MapPin,
  Plus,
  Loader2,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import type { DiscoveryRoute } from '../../stores/discoveryStore';

interface CitySearchResult {
  name: string;
  country: string;
  coordinates: [number, number]; // [lat, lng]
  displayName: string;
}

interface AddCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCity: (city: {
    name: string;
    country: string;
    coordinates: { lat: number; lng: number };
    isSelected: boolean;
    suggestedNights: number;
    distanceFromRoute?: number;
  }) => void;
  route: DiscoveryRoute | null;
}

/**
 * Calculate the perpendicular distance from a point to a line segment (route)
 * Returns distance in kilometers
 */
function calculateDistanceFromRoute(
  point: { lat: number; lng: number },
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number {
  // Haversine formula for distance between two points
  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Distance from point to origin
  const distToOrigin = haversineDistance(
    point.lat,
    point.lng,
    origin.lat,
    origin.lng
  );

  // Distance from point to destination
  const distToDest = haversineDistance(
    point.lat,
    point.lng,
    destination.lat,
    destination.lng
  );

  // Distance from origin to destination (route length)
  const routeLength = haversineDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  // If the point is beyond the route endpoints, return distance to nearest endpoint
  if (distToOrigin > routeLength && distToDest > routeLength) {
    return Math.min(distToOrigin, distToDest);
  }

  // Approximate perpendicular distance using triangle area method
  // Area = 0.5 * base * height, so height = 2 * Area / base
  const s = (distToOrigin + distToDest + routeLength) / 2; // Semi-perimeter
  const area = Math.sqrt(
    Math.max(0, s * (s - distToOrigin) * (s - distToDest) * (s - routeLength))
  ); // Heron's formula
  const perpendicularDistance = (2 * area) / routeLength;

  return Math.round(perpendicularDistance);
}

/**
 * AddCityModal
 *
 * Modal for searching and adding custom cities to the trip.
 * Features warm editorial aesthetic matching Waycraft design.
 *
 * Design decisions:
 * - Bottom sheet on mobile, centered modal on desktop
 * - City search with debounced autocomplete
 * - Shows distance from route with warning if far off
 * - Encouraging UX - makes adding stops feel easy and fun
 */
export function AddCityModal({
  isOpen,
  onClose,
  onAddCity,
  route,
}: AddCityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingCityId, setAddingCityId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closing
      setSearchQuery('');
      setResults([]);
      setIsLoading(false);
      setAddingCityId(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchCities(searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const fetchCities = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/geocode/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.cities) {
        setResults(data.cities);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCity = useCallback(
    async (city: CitySearchResult) => {
      if (!route) return;

      setAddingCityId(city.displayName);

      // Calculate distance from route
      const cityCoords = {
        lat: city.coordinates[0],
        lng: city.coordinates[1],
      };
      const distanceFromRoute = calculateDistanceFromRoute(
        cityCoords,
        route.origin.coordinates,
        route.destination.coordinates
      );

      // Simulate a brief delay for UX (feels more intentional)
      await new Promise((resolve) => setTimeout(resolve, 300));

      onAddCity({
        name: city.name,
        country: city.country,
        coordinates: cityCoords,
        isSelected: true,
        suggestedNights: 1,
        distanceFromRoute,
      });

      // Reset and close
      setAddingCityId(null);
      onClose();
    },
    [route, onAddCity, onClose]
  );

  // Calculate distance for display
  const getDistanceInfo = (city: CitySearchResult) => {
    if (!route) return null;

    const cityCoords = {
      lat: city.coordinates[0],
      lng: city.coordinates[1],
    };
    const distance = calculateDistanceFromRoute(
      cityCoords,
      route.origin.coordinates,
      route.destination.coordinates
    );

    return {
      distance,
      isFarOff: distance > 100, // Consider >100km as "far off route"
    };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="
          fixed bottom-0 left-0 right-0
          md:bottom-auto md:top-1/2 md:left-1/2
          md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-lg md:w-full md:mx-4
          z-50
          max-h-[85vh] md:max-h-[70vh]
        "
      >
        <div
          className="
            bg-white rounded-t-3xl md:rounded-3xl
            shadow-2xl
            overflow-hidden
            flex flex-col
            max-h-[85vh] md:max-h-[70vh]
          "
        >
          {/* Header */}
          <div className="flex-shrink-0 p-5 pb-0">
            {/* Drag handle (mobile) */}
            <div className="w-10 h-1 bg-rui-grey-15 rounded-full mx-auto mb-4 md:hidden" />

            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-rui-black">
                  Add a stop
                </h2>
                <p className="text-body-3 text-rui-grey-50 mt-0.5">
                  Search for cities to add to your route
                </p>
              </div>
              <button
                onClick={onClose}
                className="
                  w-10 h-10 rounded-full
                  bg-rui-grey-5 hover:bg-rui-grey-10
                  flex items-center justify-center
                  transition-colors duration-200
                "
              >
                <X className="w-5 h-5 text-rui-grey-60" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rui-grey-40">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-rui-accent" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cities..."
                className="
                  w-full pl-12 pr-4 py-4
                  bg-rui-grey-5 rounded-xl
                  text-body-1 font-body text-rui-black
                  placeholder:text-rui-grey-30
                  border-2 border-transparent
                  focus:outline-none focus:border-rui-accent focus:bg-white
                  transition-all duration-200
                "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-rui-grey-40 hover:text-rui-grey-60"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-5 pt-4">
            {/* Empty state - no search yet */}
            {!searchQuery && results.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-rui-accent/10 mx-auto mb-4 flex items-center justify-center">
                  <Navigation className="w-7 h-7 text-rui-accent" />
                </div>
                <p className="text-body-1 text-rui-grey-60 mb-1">
                  Discover new stops
                </p>
                <p className="text-body-3 text-rui-grey-40">
                  Add cities that interest you along your route
                </p>
              </div>
            )}

            {/* No results state */}
            {searchQuery.length >= 2 && !isLoading && results.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-rui-grey-5 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-rui-grey-30" />
                </div>
                <p className="text-body-1 text-rui-grey-60 mb-1">
                  No cities found
                </p>
                <p className="text-body-3 text-rui-grey-40">
                  Try a different spelling or search
                </p>
              </div>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {results.map((city, index) => {
                    const distanceInfo = getDistanceInfo(city);
                    const isAdding = addingCityId === city.displayName;

                    return (
                      <motion.div
                        key={`${city.name}-${city.country}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.03 }}
                        className="
                          group relative
                          bg-white rounded-xl
                          border border-rui-grey-10 hover:border-rui-accent/30
                          shadow-sm hover:shadow-md
                          transition-all duration-200
                          overflow-hidden
                        "
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Icon */}
                          <div
                            className="
                              flex-shrink-0 w-12 h-12 rounded-xl
                              bg-rui-grey-5 group-hover:bg-rui-accent/10
                              flex items-center justify-center
                              transition-colors duration-200
                            "
                          >
                            <MapPin className="w-5 h-5 text-rui-grey-50 group-hover:text-rui-accent transition-colors" />
                          </div>

                          {/* City info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-rui-black truncate">
                              {city.name}
                            </p>
                            <p className="text-body-3 text-rui-grey-50 truncate">
                              {city.country}
                            </p>

                            {/* Distance indicator */}
                            {distanceInfo && (
                              <div
                                className={`
                                  flex items-center gap-1 mt-1
                                  text-body-3
                                  ${distanceInfo.isFarOff ? 'text-warning' : 'text-rui-grey-40'}
                                `}
                              >
                                {distanceInfo.isFarOff && (
                                  <AlertTriangle className="w-3 h-3" />
                                )}
                                <span>
                                  {distanceInfo.distance > 0
                                    ? `~${distanceInfo.distance}km from route`
                                    : 'On route'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Add button */}
                          <motion.button
                            onClick={() => handleAddCity(city)}
                            disabled={isAdding}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              flex-shrink-0
                              w-10 h-10 rounded-xl
                              flex items-center justify-center
                              transition-all duration-200
                              ${isAdding
                                ? 'bg-rui-accent text-white'
                                : 'bg-rui-accent/10 text-rui-accent hover:bg-rui-accent hover:text-white'
                              }
                            `}
                          >
                            {isAdding ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>

                        {/* Far off route warning banner */}
                        {distanceInfo?.isFarOff && (
                          <div className="px-3 py-2 bg-warning/5 border-t border-warning/10">
                            <p className="text-body-3 text-warning">
                              This city is quite far from your direct route. Adding it will increase your travel time.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex-shrink-0 px-5 py-4 bg-rui-grey-2 border-t border-rui-grey-10">
            <p className="text-body-3 text-rui-grey-50 text-center">
              Cities you add will appear on the map and can be removed anytime
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default AddCityModal;
