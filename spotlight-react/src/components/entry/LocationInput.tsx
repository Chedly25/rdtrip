import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Navigation, X, Clock, Crosshair } from 'lucide-react';
import type { CityData } from './types';

// localStorage key for recent searches
const RECENT_SEARCHES_KEY = 'waycraft_recent_locations';
const MAX_RECENT_SEARCHES = 5;

interface LocationInputProps {
  value: CityData | null;
  onChange: (city: CityData) => void;
  placeholder: string;
  label: string;
  error?: string;
  icon?: 'origin' | 'destination';
  /** Optional callback when input receives focus (for analytics) */
  onInputFocus?: () => void;
}

// Helper functions for recent searches
function getRecentSearches(): CityData[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(city: CityData): void {
  try {
    const recent = getRecentSearches();
    // Remove if already exists (to move to top)
    const filtered = recent.filter(
      (c) => !(c.name === city.name && c.country === city.country)
    );
    // Add to beginning and limit
    const updated = [city, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function LocationInput({
  value,
  onChange,
  placeholder,
  label,
  error,
  icon = 'origin',
  onInputFocus,
}: LocationInputProps) {
  const [input, setInput] = useState(value?.displayName || '');
  const [suggestions, setSuggestions] = useState<CityData[]>([]);
  const [recentSearches, setRecentSearches] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setInput(value.displayName);
      setSelectedCity(value);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    if (selectedCity && input === selectedCity.displayName) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchCitySuggestions(input);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [input, selectedCity]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions, recentSearches]);

  const fetchCitySuggestions = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/geocode/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.cities) {
        setSuggestions(data.cities);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch city suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySelect = useCallback((city: CityData) => {
    setSelectedCity(city);
    setInput(city.displayName);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onChange(city);
    saveRecentSearch(city);
    setRecentSearches(getRecentSearches());
  }, [onChange]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setLocationError(null);
    if (selectedCity && value !== selectedCity.displayName) {
      setSelectedCity(null);
    }
  };

  const handleClear = () => {
    setInput('');
    setSelectedCity(null);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    // Notify parent for analytics
    onInputFocus?.();

    // Show recent searches when focused with empty input
    if (!input && recentSearches.length > 0) {
      setIsOpen(true);
    } else if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Get current location using browser geolocation
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const response = await fetch('/api/geocode/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      });

      if (!response.ok) {
        throw new Error('Failed to get location name');
      }

      const data = await response.json();

      if (data.city) {
        const city: CityData = {
          name: data.city.name || data.city,
          country: data.country || '',
          coordinates: [latitude, longitude],
          displayName: data.displayName || `${data.city.name || data.city}, ${data.country || ''}`,
        };
        handleCitySelect(city);
      } else {
        throw new Error('Could not determine your city');
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError('Location access denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case err.TIMEOUT:
            setLocationError('Location request timed out');
            break;
        }
      } else {
        setLocationError('Could not get your location');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && (suggestions.length > 0 || recentSearches.length > 0)) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    const items = suggestions.length > 0 ? suggestions : recentSearches;
    // Account for "Use current location" option at index 0
    const hasCurrentLocationOption = !input;
    const totalItems = hasCurrentLocationOption ? items.length + 1 : items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (hasCurrentLocationOption && highlightedIndex === 0) {
            handleGetCurrentLocation();
          } else {
            const itemIndex = hasCurrentLocationOption ? highlightedIndex - 1 : highlightedIndex;
            if (items[itemIndex]) {
              handleCitySelect(items[itemIndex]);
            }
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      const item = items[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const IconComponent = icon === 'origin' ? Navigation : MapPin;
  const showRecentSearches = isOpen && !input && recentSearches.length > 0;
  const showSuggestions = isOpen && suggestions.length > 0;
  const showNoResults = isOpen && !isLoading && input.length >= 2 && suggestions.length === 0;
  const showCurrentLocationOption = isOpen && !input;

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-[100]' : 'z-auto'}`}
    >
      {/* Label */}
      <label className="block text-body-3 font-medium text-rui-grey-50 mb-2 uppercase tracking-wide">
        {label}
      </label>

      {/* Input container */}
      <div className="relative group">
        {/* Icon */}
        <div
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-rui-sm
            ${selectedCity
              ? 'bg-rui-accent text-rui-white'
              : 'bg-rui-grey-5 text-rui-grey-50 group-focus-within:bg-rui-accent/10 group-focus-within:text-rui-accent'
            }
          `}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="location-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `location-option-${highlightedIndex}` : undefined}
          role="combobox"
          className={`
            w-full pl-16 pr-12 py-4 text-heading-3 font-display
            bg-rui-white rounded-rui-16
            border-2 transition-all duration-rui-sm
            placeholder:text-rui-grey-20 placeholder:font-body
            focus:outline-none focus:ring-0
            ${error
              ? 'border-danger text-danger'
              : selectedCity
              ? 'border-success'
              : 'border-rui-grey-10 focus:border-rui-accent'
            }
          `}
        />

        {/* Right side indicators */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Loading indicator */}
          {(isLoading || isGettingLocation) && (
            <Loader2 className="w-5 h-5 text-rui-accent animate-spin" />
          )}

          {/* Clear button */}
          {selectedCity && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="w-6 h-6 rounded-full bg-rui-grey-10 hover:bg-rui-grey-20 flex items-center justify-center transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-rui-grey-50" />
            </button>
          )}

          {/* Success checkmark */}
          {selectedCity && !isLoading && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Error message */}
      {(error || locationError) && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-body-3 text-danger"
        >
          {error || locationError}
        </motion.p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (showRecentSearches || showSuggestions || showNoResults || showCurrentLocationOption) && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 mt-2 w-full rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.15), 0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              ref={listRef}
              id="location-listbox"
              role="listbox"
              className="max-h-80 overflow-y-auto"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              {/* Current location option - only when input is empty */}
              {showCurrentLocationOption && (
                <div className="p-2 border-b border-rui-grey-10 bg-white">
                  <button
                    type="button"
                    data-option
                    id="location-option-0"
                    role="option"
                    aria-selected={highlightedIndex === 0}
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className={`
                      w-full rounded-rui-12 px-4 py-3 text-left transition-all duration-rui-sm
                      focus:outline-none
                      ${highlightedIndex === 0 ? 'bg-rui-accent/10' : 'hover:bg-rui-grey-2'}
                      ${isGettingLocation ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                        ${highlightedIndex === 0 ? 'bg-rui-accent text-rui-white' : 'bg-rui-accent/10 text-rui-accent'}
                      `}>
                        {isGettingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Crosshair className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-rui-accent">
                          Use current location
                        </p>
                        <p className="text-body-3 text-rui-grey-50">
                          {isGettingLocation ? 'Getting your location...' : 'Tap to detect automatically'}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Recent searches */}
              {showRecentSearches && (
                <div className="p-2 bg-white">
                  <p className="px-4 py-2 text-body-3 font-medium text-rui-grey-50 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Recent
                  </p>
                  {recentSearches.map((city, index) => {
                    const optionIndex = showCurrentLocationOption ? index + 1 : index;
                    return (
                      <button
                        type="button"
                        data-option
                        id={`location-option-${optionIndex}`}
                        role="option"
                        aria-selected={highlightedIndex === optionIndex}
                        key={`recent-${city.name}-${city.country}`}
                        onClick={() => handleCitySelect(city)}
                        className={`
                          w-full rounded-rui-12 px-4 py-3 text-left transition-all duration-rui-sm
                          focus:outline-none
                          ${highlightedIndex === optionIndex ? 'bg-rui-accent/10' : 'hover:bg-rui-grey-2'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                            ${highlightedIndex === optionIndex ? 'bg-rui-accent/20' : 'bg-rui-grey-5'}
                          `}>
                            <Clock className={`w-4 h-4 ${highlightedIndex === optionIndex ? 'text-rui-accent' : 'text-rui-grey-50'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-display font-semibold text-rui-black truncate">
                              {city.name}
                            </p>
                            <p className="text-body-3 text-rui-grey-50 truncate">
                              {city.country}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search suggestions */}
              {showSuggestions && (
                <div className="p-2 bg-white">
                  {suggestions.map((city, index) => (
                    <motion.button
                      type="button"
                      data-option
                      id={`location-option-${index}`}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      key={`${city.name}-${city.country}-${index}`}
                      onClick={() => handleCitySelect(city)}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`
                        w-full rounded-rui-12 px-4 py-3 text-left transition-all duration-rui-sm
                        focus:outline-none
                        ${highlightedIndex === index ? 'bg-rui-accent/10' : 'hover:bg-rui-grey-2'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                          ${highlightedIndex === index ? 'bg-rui-accent/20' : 'bg-rui-grey-5'}
                        `}>
                          <MapPin className={`w-4 h-4 ${highlightedIndex === index ? 'text-rui-accent' : 'text-rui-grey-50'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold text-rui-black truncate">
                            {city.name}
                          </p>
                          <p className="text-body-3 text-rui-grey-50 truncate">
                            {city.country}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* No results */}
              {showNoResults && (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-rui-grey-5 mx-auto mb-3 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-rui-grey-50" />
                  </div>
                  <p className="text-body-2 text-rui-grey-50">
                    No cities found. Try a different spelling.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
