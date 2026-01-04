/**
 * AddPanel
 *
 * Slide-out panel for adding activities to a slot.
 * Triggered when user clicks "[+ Add to {slot}]".
 *
 * Features:
 * - AI Pick recommendation with contextual explanation
 * - Search input with filters
 * - Proximity-sorted results from anchor point
 * - Filter by type, price, duration, rating, vibe
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Filter,
  Clock,
  Star,
  MapPin,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import {
  enrichPlace,
  haversineDistance,
  formatPriceLevel,
  CATEGORY_ICONS,
} from '../../utils/planningEnrichment';
import type { EnrichedPlace, Slot, PlaceCategory, FilterState } from '../../types/planning';

// ============================================================================
// Slot Labels
// ============================================================================

const SLOT_LABELS: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

// ============================================================================
// Component
// ============================================================================

export function AddPanel() {
  const {
    addPanelState,
    closeAddPanel,
    addItem,
    filters,
    setFilters,
    resetFilters,
    getAllPlacedPlaceIds,
    tripPlan,
  } = usePlanningStore();

  const { route } = useDiscoveryStore();

  const { isOpen, targetSlot, targetDayIndex, anchor, anchorName } = addPanelState;

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get current day info
  const currentDay = tripPlan?.days[targetDayIndex];
  const cityName = currentDay?.city.name || 'this city';

  // Get all places from discovery
  const availablePlaces = useMemo(() => {
    if (!route) return [];

    const allCities = [route.origin, ...route.suggestedCities, route.destination];
    const currentCity = allCities.find((c) => c.name === cityName);

    if (!currentCity?.places) return [];

    // Convert discovery places to enriched places
    return currentCity.places.map((place) => enrichPlace({
      place_id: place.id,
      name: place.name,
      types: [place.type],
      rating: place.rating,
      user_ratings_total: place.reviewCount,
      price_level: place.priceLevel,
      geometry: currentCity.coordinates
        ? { location: { lat: currentCity.coordinates.lat, lng: currentCity.coordinates.lng } }
        : undefined,
    }));
  }, [route, cityName]);

  // Get already placed place IDs
  const placedIds = getAllPlacedPlaceIds();

  // Filter and sort places
  const filteredPlaces = useMemo(() => {
    if (!targetSlot) return [];

    let places = availablePlaces
      // Filter out already placed
      .filter((p) => !placedIds.has(p.place_id))
      // Filter by slot validity
      .filter((p) => p.valid_slots.includes(targetSlot))
      // Apply search query
      .filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               p.vibe_tags.some((t) => t.toLowerCase().includes(q));
      })
      // Apply filters
      .filter((p) => {
        if (filters.types.length > 0 && !filters.types.includes(p.category)) {
          return false;
        }
        if (filters.price_levels.length > 0 && p.price_level !== undefined && !filters.price_levels.includes(p.price_level)) {
          return false;
        }
        if (filters.min_rating > 0 && (p.rating || 0) < filters.min_rating) {
          return false;
        }
        if (filters.max_duration && p.estimated_duration_mins > filters.max_duration) {
          return false;
        }
        if (filters.vibes.length > 0 && !filters.vibes.some((v) => p.vibe_tags.includes(v))) {
          return false;
        }
        if (filters.show_hidden_gems_only && !p.is_hidden_gem) {
          return false;
        }
        return true;
      });

    // Sort by: best_slot match → proximity → rating
    places.sort((a, b) => {
      // Prioritize best_slot match
      const aOptimal = a.best_slot === targetSlot ? 1 : 0;
      const bOptimal = b.best_slot === targetSlot ? 1 : 0;
      if (aOptimal !== bOptimal) return bOptimal - aOptimal;

      // Then proximity (if we have an anchor)
      if (anchor) {
        const aDist = haversineDistance(
          anchor.lat, anchor.lng,
          a.geometry.location.lat, a.geometry.location.lng
        );
        const bDist = haversineDistance(
          anchor.lat, anchor.lng,
          b.geometry.location.lat, b.geometry.location.lng
        );
        if (Math.abs(aDist - bDist) > 0.3) return aDist - bDist;
      }

      // Then rating
      return (b.rating || 0) - (a.rating || 0);
    });

    return places;
  }, [availablePlaces, targetSlot, searchQuery, filters, placedIds, anchor]);

  // AI Pick - top recommendation
  const aiPick = useMemo(() => {
    if (filteredPlaces.length === 0) return null;

    const pick = filteredPlaces[0];
    let reason = '';

    if (pick.best_slot === targetSlot) {
      reason = `Perfect for ${SLOT_LABELS[targetSlot!].toLowerCase()} - `;
    }

    if (pick.is_hidden_gem) {
      reason += 'A local favourite most tourists miss. ';
    } else if (pick.rating && pick.rating >= 4.5) {
      reason += 'Highly rated by visitors. ';
    }

    if (anchor) {
      const distKm = haversineDistance(
        anchor.lat, anchor.lng,
        pick.geometry.location.lat, pick.geometry.location.lng
      );
      if (distKm < 0.3) {
        reason += 'Just steps from where you\'ll be.';
      } else {
        const walkMins = Math.round(distKm * 12);
        reason += `${walkMins} min walk from ${anchorName || 'your last stop'}.`;
      }
    }

    return { place: pick, reason };
  }, [filteredPlaces, targetSlot, anchor, anchorName]);

  // Handle add
  const handleAdd = useCallback((place: EnrichedPlace) => {
    if (!targetSlot) return;
    addItem(place, targetDayIndex, targetSlot, 'user');
    // Don't close panel - user might want to add more
  }, [addItem, targetDayIndex, targetSlot]);

  // Handle add AI pick
  const handleAddAIPick = useCallback(() => {
    if (!aiPick || !targetSlot) return;
    addItem(aiPick.place, targetDayIndex, targetSlot, 'ai');
  }, [aiPick, addItem, targetDayIndex, targetSlot]);

  if (!isOpen || !targetSlot) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-rui-black/30 backdrop-blur-sm z-40"
        onClick={closeAddPanel}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-rui-white shadow-rui-4 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-rui-grey-10">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <h2 className="font-display text-xl text-rui-black">
                Add to {SLOT_LABELS[targetSlot]}
              </h2>
              <p className="text-body-3 text-rui-grey-50 mt-0.5">
                {formatDate(currentDay?.date)} · {cityName}
              </p>
            </div>
            <button
              onClick={closeAddPanel}
              className="touch-target flex items-center justify-center text-rui-grey-50 hover:text-rui-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Anchor */}
          {anchor && anchorName && (
            <div className="px-4 pb-3 flex items-center gap-2 text-body-3 text-rui-grey-50">
              <MapPin className="w-3.5 h-3.5 text-rui-accent" />
              <span>Near: <strong className="text-rui-grey-70">{anchorName}</strong></span>
            </div>
          )}

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rui-grey-40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rui-grey-20 bg-rui-grey-2 text-body-2 text-rui-black placeholder:text-rui-grey-40 focus:outline-none focus:ring-2 focus:ring-rui-accent/30 focus:border-rui-accent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-3 font-medium
                transition-colors
                ${showFilters
                  ? 'bg-rui-accent/10 text-rui-accent'
                  : 'bg-rui-grey-5 text-rui-grey-60 hover:bg-rui-grey-10'
                }
              `}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters(filters) && (
                <span className="w-1.5 h-1.5 rounded-full bg-rui-accent" />
              )}
            </button>

            {hasActiveFilters(filters) && (
              <button
                onClick={resetFilters}
                className="text-body-3 text-rui-grey-50 hover:text-rui-accent transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-rui-grey-10"
              >
                <FilterPanel filters={filters} setFilters={setFilters} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* AI Pick */}
          {aiPick && (
            <div className="p-4 border-b border-rui-grey-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-emphasis-2 text-rui-black">AI Pick</span>
              </div>
              <AIPickCard
                place={aiPick.place}
                reason={aiPick.reason}
                onAdd={handleAddAIPick}
              />
            </div>
          )}

          {/* Results */}
          <div className="p-4">
            <p className="text-body-3 text-rui-grey-50 mb-3">
              {filteredPlaces.length > 0
                ? `${filteredPlaces.length} options`
                : 'No places match your filters'
              }
            </p>

            <div className="space-y-2">
              {filteredPlaces.slice(aiPick ? 1 : 0).map((place) => (
                <PlaceCard
                  key={place.place_id}
                  place={place}
                  anchor={anchor}
                  onAdd={() => handleAdd(place)}
                />
              ))}
            </div>

            {filteredPlaces.length === 0 && (
              <div className="text-center py-8">
                <p className="text-body-2 text-rui-grey-50 mb-2">
                  No matching places
                </p>
                <button
                  onClick={resetFilters}
                  className="text-body-2 text-rui-accent hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================================
// AI Pick Card
// ============================================================================

interface AIPickCardProps {
  place: EnrichedPlace;
  reason: string;
  onAdd: () => void;
}

function AIPickCard({ place, reason, onAdd }: AIPickCardProps) {
  const icon = CATEGORY_ICONS[place.category] || '📍';
  const priceDisplay = formatPriceLevel(place.price_level);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-lg text-rui-black font-medium">
            {place.name}
          </h4>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-body-3 text-rui-grey-60">
            {place.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {place.rating.toFixed(1)}
              </span>
            )}
            {priceDisplay && <span>{priceDisplay}</span>}
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              ~{place.estimated_duration_mins} min
            </span>
          </div>
          <p className="mt-2 text-body-2 text-rui-grey-60 italic">
            "{reason}"
          </p>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="mt-3 w-full py-2.5 rounded-lg bg-rui-accent text-white text-body-2 font-medium hover:bg-rui-accent/90 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add to plan
      </button>
    </div>
  );
}

// ============================================================================
// Place Card
// ============================================================================

interface PlaceCardProps {
  place: EnrichedPlace;
  anchor?: { lat: number; lng: number } | null;
  onAdd: () => void;
}

function PlaceCard({ place, anchor, onAdd }: PlaceCardProps) {
  const icon = CATEGORY_ICONS[place.category] || '📍';
  const priceDisplay = formatPriceLevel(place.price_level);

  // Calculate distance from anchor
  let distanceDisplay = '';
  if (anchor) {
    const distKm = haversineDistance(
      anchor.lat, anchor.lng,
      place.geometry.location.lat, place.geometry.location.lng
    );
    const walkMins = Math.round(distKm * 12);
    distanceDisplay = walkMins <= 1 ? 'nearby' : `${walkMins} min walk`;
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-rui-grey-10 bg-rui-white hover:border-rui-grey-20 hover:shadow-rui-1 transition-all">
      <span className="text-xl flex-shrink-0">{icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-body-1 text-rui-black font-medium truncate">
            {place.name}
          </h4>
          {place.is_hidden_gem && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            </span>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-body-3 text-rui-grey-50">
          {place.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {place.rating.toFixed(1)}
            </span>
          )}
          {priceDisplay && <span>{priceDisplay}</span>}
          {distanceDisplay && <span>{distanceDisplay}</span>}
        </div>
      </div>

      <button
        onClick={onAdd}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-rui-grey-5 text-rui-grey-60 hover:bg-rui-accent hover:text-white transition-colors flex items-center justify-center"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Filter Panel
// ============================================================================

interface FilterPanelProps {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
}

function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const typeOptions: { value: PlaceCategory; label: string }[] = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'bar', label: 'Bar' },
    { value: 'museum', label: 'Museum' },
    { value: 'landmark', label: 'Landmark' },
    { value: 'park', label: 'Park' },
    { value: 'viewpoint', label: 'Viewpoint' },
    { value: 'market', label: 'Market' },
    { value: 'shopping', label: 'Shopping' },
  ];

  const vibeOptions = [
    'romantic', 'chill', 'lively', 'local-favourite', 'family-friendly', 'instagrammable'
  ];

  const toggleType = (type: PlaceCategory) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    setFilters({ types: newTypes });
  };

  const togglePrice = (level: number) => {
    const newLevels = filters.price_levels.includes(level)
      ? filters.price_levels.filter((l) => l !== level)
      : [...filters.price_levels, level];
    setFilters({ price_levels: newLevels });
  };

  const toggleVibe = (vibe: string) => {
    const newVibes = filters.vibes.includes(vibe as any)
      ? filters.vibes.filter((v) => v !== vibe)
      : [...filters.vibes, vibe as any];
    setFilters({ vibes: newVibes });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Type */}
      <div>
        <label className="text-body-3 text-rui-grey-50 mb-2 block">Type</label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map(({ value, label }) => (
            <FilterChip
              key={value}
              label={label}
              isActive={filters.types.includes(value)}
              onClick={() => toggleType(value)}
            />
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="text-body-3 text-rui-grey-50 mb-2 block">Price</label>
        <div className="flex gap-2">
          <FilterChip
            label="Free"
            isActive={filters.price_levels.includes(0)}
            onClick={() => togglePrice(0)}
          />
          {[1, 2, 3, 4].map((level) => (
            <FilterChip
              key={level}
              label={'€'.repeat(level)}
              isActive={filters.price_levels.includes(level)}
              onClick={() => togglePrice(level)}
            />
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-body-3 text-rui-grey-50 mb-2 block">
          Minimum Rating: {filters.min_rating > 0 ? `${filters.min_rating}+` : 'Any'}
        </label>
        <input
          type="range"
          min="0"
          max="4.5"
          step="0.5"
          value={filters.min_rating}
          onChange={(e) => setFilters({ min_rating: parseFloat(e.target.value) })}
          className="w-full accent-rui-accent"
        />
      </div>

      {/* Vibe */}
      <div>
        <label className="text-body-3 text-rui-grey-50 mb-2 block">Vibe</label>
        <div className="flex flex-wrap gap-2">
          {vibeOptions.map((vibe) => (
            <FilterChip
              key={vibe}
              label={vibe.replace('-', ' ')}
              isActive={filters.vibes.includes(vibe as any)}
              onClick={() => toggleVibe(vibe)}
            />
          ))}
        </div>
      </div>

      {/* Hidden Gems Only */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.show_hidden_gems_only}
          onChange={(e) => setFilters({ show_hidden_gems_only: e.target.checked })}
          className="w-4 h-4 rounded border-rui-grey-30 text-rui-accent focus:ring-rui-accent"
        />
        <span className="text-body-2 text-rui-grey-60">Hidden gems only</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      </label>
    </div>
  );
}

// ============================================================================
// Filter Chip
// ============================================================================

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-body-3 font-medium
        transition-all duration-150
        ${isActive
          ? 'bg-rui-accent text-white'
          : 'bg-rui-grey-5 text-rui-grey-60 hover:bg-rui-grey-10'
        }
      `}
    >
      {label}
    </button>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.types.length > 0 ||
    filters.price_levels.length > 0 ||
    filters.min_rating > 0 ||
    filters.max_duration !== null ||
    filters.vibes.length > 0 ||
    filters.show_hidden_gems_only
  );
}

function formatDate(date?: Date): string {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default AddPanel;
