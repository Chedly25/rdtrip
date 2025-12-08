/**
 * ItineraryDisplay
 *
 * WI-5.5: Main component for displaying the complete trip itinerary
 *
 * Features:
 * - Full trip overview with timeline
 * - Day-by-day expandable view
 * - Activity details with photos, badges, actions
 * - Edit mode for swapping/removing activities
 * - Mobile-first responsive design
 *
 * Design: Travel Journal aesthetic
 * - Feels like YOUR trip, not a generated document
 * - Warm, personal, editable feel
 * - Clear visual hierarchy
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  List,
  Calendar,
  Sparkles,
  Download,
  Share2,
  Edit3,
  Check,
  ChevronUp,
  Filter,
  Gem,
  Heart,
  Car,
  Route,
} from 'lucide-react';
import type { Itinerary, ItineraryDay, ItineraryActivity, TimeSlot } from '../../services/itinerary';
import { ItineraryTimeline } from './ItineraryTimeline';
import { ItineraryDayCard } from './ItineraryDayCard';

// ============================================================================
// Types
// ============================================================================

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  /** Current day number if user is on the trip */
  currentDay?: number;
  /** Start date of the trip (for calculating current day) */
  tripStartDate?: Date;
  /** Enable edit mode */
  editable?: boolean;
  /** Callbacks */
  onActivityClick?: (activity: ItineraryActivity, day: ItineraryDay) => void;
  onSwapActivity?: (activity: ItineraryActivity, day: ItineraryDay) => void;
  onRemoveActivity?: (activity: ItineraryActivity, day: ItineraryDay) => void;
  onAddActivity?: (day: ItineraryDay, slot: TimeSlot) => void;
  onNavigate?: (activity: ItineraryActivity) => void;
  onExport?: () => void;
  onShare?: () => void;
}

type ViewMode = 'timeline' | 'list';
type FilterOption = 'all' | 'hidden-gems' | 'favourites' | 'travel';

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Header with trip title and quick stats
 */
function ItineraryHeader({
  itinerary,
  viewMode,
  onViewModeChange,
  isEditMode,
  onToggleEdit,
  onExport,
  onShare,
  editable,
}: {
  itinerary: Itinerary;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isEditMode: boolean;
  onToggleEdit: () => void;
  onExport?: () => void;
  onShare?: () => void;
  editable: boolean;
}) {
  const cities = itinerary.summary.cities;
  const titleText = cities.length <= 2
    ? cities.join(' → ')
    : `${cities[0]} → ... → ${cities[cities.length - 1]}`;

  return (
    <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-stone-200 p-4 sm:p-6 mb-6">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-terracotta" />
            <span className="text-xs font-medium text-terracotta uppercase tracking-wider">
              Your Itinerary
            </span>
          </div>
          <h1
            className="text-xl sm:text-2xl font-bold text-stone-900"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {titleText}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {itinerary.summary.totalDays} days • {itinerary.summary.totalNights} nights
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {editable && (
            <button
              onClick={onToggleEdit}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${isEditMode
                  ? 'bg-terracotta text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }
              `}
            >
              {isEditMode ? (
                <>
                  <Check className="w-4 h-4" />
                  Done
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => onViewModeChange('timeline')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${viewMode === 'timeline'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
              }
            `}
          >
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${viewMode === 'list'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
              }
            `}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Day List</span>
          </button>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {itinerary.summary.totalActivities} activities
          </span>
          {itinerary.summary.hiddenGemsCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <Gem className="w-4 h-4" />
              {itinerary.summary.hiddenGemsCount} gems
            </span>
          )}
          {itinerary.summary.totalDrivingDistanceKm > 0 && (
            <span className="flex items-center gap-1">
              <Car className="w-4 h-4" />
              {Math.round(itinerary.summary.totalDrivingDistanceKm)} km
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Filter bar for day list view
 */
function FilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  counts: { all: number; hiddenGems: number; favourites: number; travel: number };
}) {
  const filters: { key: FilterOption; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: 'All Days', icon: <Calendar className="w-4 h-4" />, count: counts.all },
    { key: 'hidden-gems', label: 'Hidden Gems', icon: <Gem className="w-4 h-4" />, count: counts.hiddenGems },
    { key: 'favourites', label: 'Favourites', icon: <Heart className="w-4 h-4" />, count: counts.favourites },
    { key: 'travel', label: 'Travel Days', icon: <Car className="w-4 h-4" />, count: counts.travel },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
            ${activeFilter === filter.key
              ? 'bg-terracotta text-white shadow-md'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }
          `}
        >
          {filter.icon}
          <span>{filter.label}</span>
          <span
            className={`
              px-1.5 py-0.5 rounded-full text-xs
              ${activeFilter === filter.key
                ? 'bg-white/20 text-white'
                : 'bg-stone-200 text-stone-500'
              }
            `}
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Scroll to top button
 */
function ScrollToTopButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClick}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-terracotta text-white shadow-lg shadow-terracotta/30 hover:bg-terracotta/90 transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
        <Map className="w-8 h-8 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-800 mb-2">No itinerary yet</h3>
      <p className="text-stone-500">Generate an itinerary to see your day-by-day plan</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ItineraryDisplay({
  itinerary,
  currentDay,
  tripStartDate,
  editable = true,
  onActivityClick,
  onSwapActivity,
  onRemoveActivity,
  onAddActivity,
  onNavigate,
  onExport,
  onShare,
}: ItineraryDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDay, setSelectedDay] = useState<number | undefined>(currentDay || 1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [completedActivityIds] = useState<Set<string>>(() => new Set<string>());

  const containerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<number, HTMLDivElement>>({});

  // Calculate computed current day from trip start date
  const computedCurrentDay = (() => {
    if (currentDay) return currentDay;
    if (!tripStartDate) return undefined;

    const now = new Date();
    const start = new Date(tripStartDate);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return undefined; // Trip hasn't started
    if (diffDays > itinerary.days.length) return undefined; // Trip ended
    return diffDays;
  })();

  // Track scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to selected day
  useEffect(() => {
    if (selectedDay && dayRefs.current[selectedDay]) {
      const element = dayRefs.current[selectedDay];
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDay]);

  // Filter counts
  const filterCounts = {
    all: itinerary.days.length,
    hiddenGems: itinerary.days.filter((day) =>
      [...day.slots.morning, ...day.slots.afternoon, ...day.slots.evening]
        .some((a) => a.type === 'place' && a.isHiddenGem)
    ).length,
    favourites: itinerary.days.filter((day) =>
      [...day.slots.morning, ...day.slots.afternoon, ...day.slots.evening]
        .some((a) => a.type === 'place' && a.isFavourited)
    ).length,
    travel: itinerary.days.filter((day) => day.isTravelDay).length,
  };

  // Filter days
  const filteredDays = itinerary.days.filter((day) => {
    switch (activeFilter) {
      case 'hidden-gems':
        return [...day.slots.morning, ...day.slots.afternoon, ...day.slots.evening]
          .some((a) => a.type === 'place' && a.isHiddenGem);
      case 'favourites':
        return [...day.slots.morning, ...day.slots.afternoon, ...day.slots.evening]
          .some((a) => a.type === 'place' && a.isFavourited);
      case 'travel':
        return day.isTravelDay;
      default:
        return true;
    }
  });

  // Handle scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle day selection from timeline
  const handleSelectDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setActiveFilter('all'); // Reset filter to show the selected day
  };

  // Empty state
  if (!itinerary || itinerary.days.length === 0) {
    return <EmptyState />;
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto">
      {/* Header */}
      <ItineraryHeader
        itinerary={itinerary}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isEditMode={isEditMode}
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        onExport={onExport}
        onShare={onShare}
        editable={editable}
      />

      {/* Timeline View */}
      <AnimatePresence mode="wait">
        {viewMode === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <ItineraryTimeline
              itinerary={itinerary}
              selectedDay={selectedDay}
              currentDay={computedCurrentDay}
              onSelectDay={handleSelectDay}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar (list view only) */}
      {viewMode === 'list' && (
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
      )}

      {/* Day cards */}
      <div className="space-y-4">
        {filteredDays.map((day) => (
          <div
            key={day.dayNumber}
            ref={(el) => {
              if (el) dayRefs.current[day.dayNumber] = el;
            }}
          >
            <ItineraryDayCard
              day={day}
              defaultExpanded={day.dayNumber === selectedDay || day.dayNumber === computedCurrentDay}
              isToday={day.dayNumber === computedCurrentDay}
              isCompleted={computedCurrentDay ? day.dayNumber < computedCurrentDay : false}
              completedActivityIds={completedActivityIds}
              onActivityClick={onActivityClick ? (a) => onActivityClick(a, day) : undefined}
              onSwapActivity={isEditMode && onSwapActivity ? (a) => onSwapActivity(a, day) : undefined}
              onRemoveActivity={isEditMode && onRemoveActivity ? (a) => onRemoveActivity(a, day) : undefined}
              onAddActivity={isEditMode && onAddActivity ? (_, slot) => onAddActivity(day, slot) : undefined}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </div>

      {/* Empty filter result */}
      {filteredDays.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No days match this filter</p>
          <button
            onClick={() => setActiveFilter('all')}
            className="mt-2 text-sm text-terracotta hover:underline"
          >
            Show all days
          </button>
        </div>
      )}

      {/* Scroll to top button */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />

      {/* Bottom padding for safe area */}
      <div className="h-20" />
    </div>
  );
}

export default ItineraryDisplay;
