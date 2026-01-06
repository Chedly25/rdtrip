/**
 * AddPanel - Premium Travel Journal Edition
 *
 * Refined sidebar for adding activities with proper contrast and premium styling.
 * Warm tones, elegant typography, tactile interactions.
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
      geometry: place.coordinates
        ? { location: { lat: place.coordinates.lat, lng: place.coordinates.lng } }
        : undefined,
      photos: place.photoUrl ? [{ url: place.photoUrl }] : undefined,
    }));
  }, [route, cityName]);

  // Get already placed place IDs
  const placedIds = getAllPlacedPlaceIds();

  // Filter and sort places
  const filteredPlaces = useMemo(() => {
    if (!targetSlot) return [];

    let places = availablePlaces
      .filter((p) => !placedIds.has(p.place_id))
      .filter((p) => p.valid_slots.includes(targetSlot))
      .filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               p.vibe_tags.some((t) => t.toLowerCase().includes(q));
      })
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

    places.sort((a, b) => {
      const aOptimal = a.best_slot === targetSlot ? 1 : 0;
      const bOptimal = b.best_slot === targetSlot ? 1 : 0;
      if (aOptimal !== bOptimal) return bOptimal - aOptimal;

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

      return (b.rating || 0) - (a.rating || 0);
    });

    return places;
  }, [availablePlaces, targetSlot, searchQuery, filters, placedIds, anchor]);

  // AI Pick
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

  const handleAdd = useCallback((place: EnrichedPlace) => {
    if (!targetSlot) return;
    addItem(place, targetDayIndex, targetSlot, 'user');
  }, [addItem, targetDayIndex, targetSlot]);

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
        className="fixed inset-0 bg-rui-black/40 backdrop-blur-sm z-40"
        onClick={closeAddPanel}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-br from-rui-white via-rui-cream to-rui-white shadow-rui-4 z-50 flex flex-col border-l-2 border-rui-accent/20"
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')]" />

        {/* Header */}
        <div className="relative flex-shrink-0 border-b-2 border-rui-accent/20 bg-gradient-to-b from-rui-white/80 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <h2 className="font-display text-2xl text-rui-black font-semibold tracking-tight">
                Add to {SLOT_LABELS[targetSlot]}
              </h2>
              <p className="text-body-2 text-rui-grey-60 mt-1 font-medium">
                {formatDate(currentDay?.date)} · {cityName}
              </p>
            </div>
            <motion.button
              onClick={closeAddPanel}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-rui-grey-5 border border-rui-grey-10 text-rui-grey-60 hover:bg-rui-accent/10 hover:border-rui-accent/30 hover:text-rui-accent transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Anchor */}
          {anchor && anchorName && (
            <div className="px-5 pb-4 flex items-center gap-2 text-body-2 text-rui-grey-70">
              <MapPin className="w-4 h-4 text-rui-accent" />
              <span>Near: <strong className="text-rui-black font-semibold">{anchorName}</strong></span>
            </div>
          )}

          {/* Search */}
          <div className="px-5 pb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rui-grey-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-rui-grey-10 bg-white text-body-2 text-rui-black placeholder:text-rui-grey-40 focus:outline-none focus:ring-2 focus:ring-rui-accent/30 focus:border-rui-accent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-body-2 font-semibold
                border-2 transition-all
                ${showFilters
                  ? 'bg-rui-accent/10 border-rui-accent/30 text-rui-accent shadow-accent/10 shadow-md'
                  : 'bg-white border-rui-grey-10 text-rui-grey-70 hover:border-rui-accent/20 hover:bg-rui-grey-2 shadow-sm'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters(filters) && (
                <span className="w-2 h-2 rounded-full bg-rui-accent" />
              )}
            </motion.button>

            {hasActiveFilters(filters) && (
              <button
                onClick={resetFilters}
                className="text-body-2 font-medium text-rui-grey-60 hover:text-rui-accent transition-colors"
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
                className="overflow-hidden border-t-2 border-rui-grey-10"
              >
                <FilterPanel filters={filters} setFilters={setFilters} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto">
          {/* AI Pick */}
          {aiPick && (
            <div className="p-5 border-b-2 border-rui-grey-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-emphasis-1 text-rui-black font-semibold">AI Pick</span>
              </div>
              <AIPickCard
                place={aiPick.place}
                reason={aiPick.reason}
                onAdd={handleAddAIPick}
              />
            </div>
          )}

          {/* Results */}
          <div className="p-5">
            <p className="text-body-2 text-rui-grey-70 font-medium mb-4">
              {filteredPlaces.length > 0
                ? `${filteredPlaces.length} ${filteredPlaces.length === 1 ? 'option' : 'options'}`
                : 'No places match your filters'
              }
            </p>

            <div className="space-y-3">
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
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rui-grey-5 flex items-center justify-center">
                  <Search className="w-8 h-8 text-rui-grey-40" />
                </div>
                <p className="text-body-1 text-rui-grey-70 font-medium mb-2">
                  No matching places
                </p>
                <button
                  onClick={resetFilters}
                  className="text-body-2 text-rui-accent font-semibold hover:underline"
                >
                  Clear filters to see all
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
  const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].url : null;
  const priceDisplay = formatPriceLevel(place.price_level);

  return (
    <motion.div
      className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-amber-300/50 shadow-md"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-start gap-3 mb-4">
        {/* Photo Thumbnail or Icon */}
        {photoUrl ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border border-amber-200 flex-shrink-0">
            <img
              src={photoUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-full h-full items-center justify-center bg-amber-100" style={{ display: 'none' }}>
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-xl text-rui-black font-semibold leading-tight">
            {place.name}
          </h4>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-body-2 text-rui-grey-70 font-medium">
            {place.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {place.rating.toFixed(1)}
              </span>
            )}
            {priceDisplay && <span className="text-rui-grey-60">{priceDisplay}</span>}
            <span className="flex items-center gap-1 text-rui-grey-60">
              <Clock className="w-3.5 h-3.5" />
              ~{place.estimated_duration_mins} min
            </span>
          </div>
          <p className="mt-3 text-body-2 text-amber-900 font-medium italic leading-relaxed">
            "{reason}"
          </p>
        </div>
      </div>

      <motion.button
        onClick={onAdd}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-body-1 font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
        Add to plan
      </motion.button>
    </motion.div>
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
  const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].url : null;
  const priceDisplay = formatPriceLevel(place.price_level);

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
    <motion.div
      className="flex items-center gap-3 p-4 rounded-xl border-2 border-rui-grey-10 bg-white hover:border-rui-accent/30 hover:shadow-md transition-all"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Photo Thumbnail or Icon */}
      {photoUrl ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm border border-slate-200 flex-shrink-0">
          <img
            src={photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="w-full h-full items-center justify-center bg-slate-100" style={{ display: 'none' }}>
            <MapPin className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-slate-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-body-1 text-rui-black font-semibold truncate">
            {place.name}
          </h4>
          {place.is_hidden_gem && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-amber-600" />
            </span>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-body-3 text-rui-grey-60 font-medium">
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

      <motion.button
        onClick={onAdd}
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-rui-grey-5 border-2 border-rui-grey-10 text-rui-grey-60 hover:bg-rui-accent hover:border-rui-accent hover:text-white transition-all flex items-center justify-center shadow-sm"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </motion.button>
    </motion.div>
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
    <div className="p-5 space-y-5 bg-rui-grey-2/30">
      {/* Type */}
      <div>
        <label className="text-body-2 text-rui-black font-semibold mb-3 block">Type</label>
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
        <label className="text-body-2 text-rui-black font-semibold mb-3 block">Price</label>
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
        <label className="text-body-2 text-rui-black font-semibold mb-3 block">
          Minimum Rating: {filters.min_rating > 0 ? `${filters.min_rating}+` : 'Any'}
        </label>
        <input
          type="range"
          min="0"
          max="4.5"
          step="0.5"
          value={filters.min_rating}
          onChange={(e) => setFilters({ min_rating: parseFloat(e.target.value) })}
          className="w-full h-2 bg-rui-grey-10 rounded-lg accent-rui-accent cursor-pointer"
        />
      </div>

      {/* Vibe */}
      <div>
        <label className="text-body-2 text-rui-black font-semibold mb-3 block">Vibe</label>
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
      <label className="flex items-center gap-3 cursor-pointer bg-white rounded-xl p-3 border-2 border-rui-grey-10 hover:border-amber-300/50 transition-all">
        <input
          type="checkbox"
          checked={filters.show_hidden_gems_only}
          onChange={(e) => setFilters({ show_hidden_gems_only: e.target.checked })}
          className="w-5 h-5 rounded border-2 border-rui-grey-30 text-amber-500 focus:ring-amber-500 cursor-pointer"
        />
        <span className="text-body-2 text-rui-black font-semibold">Hidden gems only</span>
        <Sparkles className="w-4 h-4 text-amber-500 ml-auto" />
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
    <motion.button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-body-3 font-semibold border-2
        transition-all duration-200
        ${isActive
          ? 'bg-rui-accent text-white border-rui-accent shadow-md'
          : 'bg-white text-rui-grey-70 border-rui-grey-10 hover:border-rui-accent/30 hover:bg-rui-grey-2'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
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
