/**
 * AlternativesPanel
 *
 * WI-5.7: Display alternatives for an itinerary slot with swipeable cards
 *
 * Design: Travel Journal aesthetic with editorial card layout
 * - Horizontal swipeable cards for quick browsing
 * - Reason badges (hidden gem, similar, variety)
 * - One-tap swap functionality
 * - Preference score indicators
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gem,
  Star,
  Heart,
  Sparkles,
  ArrowLeftRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
} from 'lucide-react';
import type { AlternativePlace, AlternativeReason } from '../../services/itinerary';

// ============================================================================
// Types
// ============================================================================

interface AlternativesPanelProps {
  /** Alternatives to display */
  alternatives: AlternativePlace[];
  /** Loading state */
  isLoading?: boolean;
  /** Selected alternative ID */
  selectedId?: string | null;
  /** Callback when alternative is selected */
  onSelect: (alternative: AlternativePlace) => void;
  /** Callback to swap immediately */
  onSwap?: (alternative: AlternativePlace) => void;
  /** Callback to refresh alternatives */
  onRefresh?: () => void;
  /** Display mode */
  mode?: 'horizontal' | 'vertical';
  /** Show section headers for similar/variety */
  showSections?: boolean;
}

// ============================================================================
// Reason Configuration
// ============================================================================

const REASON_CONFIG: Record<
  AlternativeReason,
  {
    label: string;
    icon: typeof Gem;
    gradient: string;
    textColor: string;
  }
> = {
  hidden_gem: {
    label: 'Hidden Gem',
    icon: Gem,
    gradient: 'from-amber-400 to-amber-500',
    textColor: 'text-white',
  },
  similar: {
    label: 'Similar',
    icon: ArrowLeftRight,
    gradient: 'from-sky-400 to-sky-500',
    textColor: 'text-white',
  },
  variety: {
    label: 'Try Different',
    icon: Sparkles,
    gradient: 'from-violet-400 to-purple-500',
    textColor: 'text-white',
  },
  highly_rated: {
    label: 'Top Rated',
    icon: Star,
    gradient: 'from-rose-400 to-rose-500',
    textColor: 'text-white',
  },
  preference_match: {
    label: 'Your Style',
    icon: Heart,
    gradient: 'from-terracotta to-terracotta/80',
    textColor: 'text-white',
  },
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Reason badge
 */
function ReasonBadge({ reason }: { reason: AlternativeReason }) {
  const config = REASON_CONFIG[reason];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        bg-gradient-to-r ${config.gradient} ${config.textColor}
        shadow-sm
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Score indicator with visual bar
 */
function ScoreIndicator({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full bg-gradient-to-r from-terracotta to-gold rounded-full"
        />
      </div>
      <span className="text-xs font-medium text-stone-600 w-8">
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

/**
 * Horizontal swipeable alternative card
 */
function AlternativeCardHorizontal({
  alternative,
  isSelected,
  onSelect,
  onSwap,
}: {
  alternative: AlternativePlace;
  isSelected: boolean;
  onSelect: () => void;
  onSwap?: () => void;
}) {
  const { place, reason, preferenceScore, isHiddenGem } = alternative;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative flex-shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${isSelected
          ? 'ring-2 ring-terracotta ring-offset-2 shadow-xl shadow-terracotta/20'
          : 'shadow-lg hover:shadow-xl'
        }
      `}
    >
      {/* Image */}
      <div className="relative h-40 bg-stone-100">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <MapPin className="w-12 h-12 text-stone-300" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Reason badge */}
        <div className="absolute top-3 left-3">
          <ReasonBadge reason={reason} />
        </div>

        {/* Hidden gem sparkle */}
        {isHiddenGem && (
          <motion.div
            className="absolute top-3 right-3"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-8 h-8 rounded-full bg-amber-400/90 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Gem className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4
            className="text-lg font-bold text-white leading-tight line-clamp-2"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {place.name}
          </h4>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-stone-500 capitalize px-2 py-1 bg-stone-100 rounded-full">
            {place.category.replace('_', ' ')}
          </span>
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-stone-700">
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Score indicator */}
        <ScoreIndicator score={preferenceScore} label="Match" />

        {/* Quick swap button */}
        {onSwap && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onSwap();
            }}
            className={`
              w-full mt-3 py-2.5 rounded-xl font-medium text-sm
              flex items-center justify-center gap-2 transition-all
              ${isSelected
                ? 'bg-terracotta text-white shadow-lg shadow-terracotta/30'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }
            `}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" />
                Swap Now
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                Quick Swap
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="selection-ring"
          className="absolute inset-0 rounded-2xl border-2 border-terracotta pointer-events-none"
        />
      )}
    </motion.div>
  );
}

/**
 * Vertical list alternative card
 */
function AlternativeCardVertical({
  alternative,
  isSelected,
  onSelect,
  onSwap,
}: {
  alternative: AlternativePlace;
  isSelected: boolean;
  onSelect: () => void;
  onSwap?: () => void;
}) {
  const { place, reason, preferenceScore, isHiddenGem } = alternative;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`
        relative flex items-stretch gap-3 p-3 rounded-xl cursor-pointer
        transition-all duration-200 border-2
        ${isSelected
          ? 'border-terracotta bg-terracotta/5 shadow-lg shadow-terracotta/10'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md'
        }
      `}
    >
      {/* Image */}
      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-stone-300" />
          </div>
        )}

        {/* Hidden gem indicator */}
        {isHiddenGem && (
          <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <Gem className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Reason badge */}
          <div className="mb-1.5">
            <ReasonBadge reason={reason} />
          </div>

          {/* Name */}
          <h4
            className="font-semibold text-stone-900 leading-tight line-clamp-1"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {place.name}
          </h4>

          {/* Category & Rating */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-stone-500 capitalize">
              {place.category.replace('_', ' ')}
            </span>
            {place.rating && (
              <span className="flex items-center gap-0.5 text-xs">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="font-medium text-stone-600">
                  {place.rating.toFixed(1)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Match score bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-terracotta to-gold rounded-full transition-all"
              style={{ width: `${preferenceScore * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-stone-500">
            {Math.round(preferenceScore * 100)}%
          </span>
        </div>
      </div>

      {/* Quick action */}
      {onSwap && (
        <div className="flex items-center flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onSwap();
            }}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all
              ${isSelected
                ? 'bg-terracotta text-white shadow-md shadow-terracotta/30'
                : 'bg-stone-100 text-stone-500 hover:bg-terracotta hover:text-white'
              }
            `}
          >
            {isSelected ? (
              <Check className="w-5 h-5" />
            ) : (
              <ArrowLeftRight className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Section header for similar/variety groups
 */
function SectionHeader({
  title,
  icon: Icon,
  count,
}: {
  title: string;
  icon: typeof Sparkles;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta/20 to-gold/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-terracotta" />
      </div>
      <h3
        className="text-sm font-semibold text-stone-700"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {title}
      </h3>
      <span className="text-xs text-stone-400">({count})</span>
    </div>
  );
}

/**
 * Loading state
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta/20 to-gold/20 flex items-center justify-center mb-4"
      >
        <Sparkles className="w-6 h-6 text-terracotta" />
      </motion.div>
      <p className="text-stone-600 font-medium">Finding alternatives...</p>
      <p className="text-sm text-stone-400 mt-1">
        Based on your preferences and this time slot
      </p>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <ArrowLeftRight className="w-8 h-8 text-stone-400" />
      </div>
      <h3
        className="text-lg font-semibold text-stone-900 mb-2"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        No alternatives found
      </h3>
      <p className="text-sm text-stone-500 max-w-xs mb-4">
        We couldn't find any alternatives for this slot. Try refreshing or
        adjusting your preferences.
      </p>
      {onRefresh && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRefresh}
          className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-medium flex items-center gap-2 hover:bg-stone-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AlternativesPanel({
  alternatives,
  isLoading = false,
  selectedId,
  onSelect,
  onSwap,
  onRefresh,
  mode = 'horizontal',
  showSections = true,
}: AlternativesPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Split into similar and variety if showing sections
  const similarAlternatives = alternatives.filter((a) => a.isSameCategory);
  const varietyAlternatives = alternatives.filter((a) => !a.isSameCategory);

  // Check scroll position for arrows
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll);
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [alternatives]);

  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Empty state
  if (alternatives.length === 0) {
    return <EmptyState onRefresh={onRefresh} />;
  }

  // Horizontal mode - swipeable cards
  if (mode === 'horizontal') {
    return (
      <div className="relative">
        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-terracotta" />
            <span className="text-sm font-medium text-stone-700">
              {alternatives.length} alternatives found
            </span>
          </div>
          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Scroll container */}
        <div className="relative group">
          {/* Left arrow */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => scrollTo('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:text-terracotta transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <AnimatePresence mode="popLayout">
              {alternatives.map((alt) => (
                <AlternativeCardHorizontal
                  key={alt.place.placeId}
                  alternative={alt}
                  isSelected={selectedId === alt.place.placeId}
                  onSelect={() => onSelect(alt)}
                  onSwap={onSwap ? () => onSwap(alt) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Right arrow */}
          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => scrollTo('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:text-terracotta transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Vertical mode - list with optional sections
  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-terracotta" />
          <span className="text-sm font-medium text-stone-700">
            {alternatives.length} alternatives found
          </span>
        </div>
        {onRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta/80 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
        )}
      </div>

      {showSections ? (
        <>
          {/* Similar section */}
          {similarAlternatives.length > 0 && (
            <div>
              <SectionHeader
                title="Similar Options"
                icon={ArrowLeftRight}
                count={similarAlternatives.length}
              />
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {similarAlternatives.map((alt) => (
                    <AlternativeCardVertical
                      key={alt.place.placeId}
                      alternative={alt}
                      isSelected={selectedId === alt.place.placeId}
                      onSelect={() => onSelect(alt)}
                      onSwap={onSwap ? () => onSwap(alt) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Variety section */}
          {varietyAlternatives.length > 0 && (
            <div>
              <SectionHeader
                title="Try Something Different"
                icon={Sparkles}
                count={varietyAlternatives.length}
              />
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {varietyAlternatives.map((alt) => (
                    <AlternativeCardVertical
                      key={alt.place.placeId}
                      alternative={alt}
                      isSelected={selectedId === alt.place.placeId}
                      onSelect={() => onSelect(alt)}
                      onSwap={onSwap ? () => onSwap(alt) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      ) : (
        /* All alternatives without sections */
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {alternatives.map((alt) => (
              <AlternativeCardVertical
                key={alt.place.placeId}
                alternative={alt}
                isSelected={selectedId === alt.place.placeId}
                onSelect={() => onSelect(alt)}
                onSwap={onSwap ? () => onSwap(alt) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Hook for using alternatives
// ============================================================================

export interface UseAlternativesOptions {
  /** Current activity */
  currentActivity: import('../../services/itinerary').PlaceActivity | null;
  /** Time slot */
  slot: import('../../services/itinerary').TimeSlot;
  /** City coordinates */
  cityCoordinates: import('../../services/hiddenGems').Coordinates;
  /** City name */
  cityName?: string;
  /** User preferences */
  preferences: import('../../services/preferences').UserPreferences;
  /** Place IDs already in itinerary */
  excludePlaceIds?: string[];
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

export function useAlternatives(options: UseAlternativesOptions) {
  const [alternatives, setAlternatives] = useState<AlternativePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchAlternatives = async () => {
    if (!options.currentActivity) return;

    setIsLoading(true);
    setError(null);

    try {
      const { getAlternatives } = await import('../../services/itinerary');
      const result = await getAlternatives({
        currentActivity: options.currentActivity,
        slot: options.slot,
        cityCoordinates: options.cityCoordinates,
        cityName: options.cityName,
        preferences: options.preferences,
        excludePlaceIds: options.excludePlaceIds,
      });
      setAlternatives(result.all);
    } catch (err) {
      console.error('Failed to fetch alternatives:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alternatives');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoFetch && options.currentActivity) {
      fetchAlternatives();
    }
  }, [options.currentActivity?.place.placeId, options.slot]);

  const selectAlternative = (alt: AlternativePlace) => {
    setSelectedId((prev) =>
      prev === alt.place.placeId ? null : alt.place.placeId
    );
  };

  const getSelected = (): AlternativePlace | null => {
    return alternatives.find((a) => a.place.placeId === selectedId) || null;
  };

  return {
    alternatives,
    isLoading,
    error,
    selectedId,
    selectedAlternative: getSelected(),
    fetchAlternatives,
    selectAlternative,
    setSelectedId,
    refresh: fetchAlternatives,
  };
}
