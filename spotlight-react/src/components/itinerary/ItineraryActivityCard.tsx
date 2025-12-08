/**
 * ItineraryActivityCard
 *
 * WI-5.5: Individual activity card for itinerary display
 * WI-10.3: Activity booking integration
 *
 * Design: Travel Journal aesthetic with warm editorial palette
 * - Terracotta (#C45830), Gold (#D4A853), Sage (#4A7C59)
 * - Fraunces display font for headings
 * - Personal, editable feel - not a generated document
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  Star,
  Gem,
  Heart,
  MoreHorizontal,
  Navigation,
  Trash2,
  ArrowLeftRight,
  ChevronDown,
  Car,
  Footprints,
  Utensils,
  Coffee,
  Ticket,
} from 'lucide-react';
import type { ItineraryActivity, PlaceActivity, TravelActivity, MealActivity } from '../../services/itinerary';
import {
  generateActivityLink,
  generateRestaurantOptions,
  trackBookingClick,
  createItinerarySource,
} from '../../services/booking';

// ============================================================================
// Types
// ============================================================================

interface ItineraryActivityCardProps {
  activity: ItineraryActivity;
  /** Whether this is the current/next activity */
  isActive?: boolean;
  /** Whether the activity is completed */
  isCompleted?: boolean;
  /** Show connecting line to next activity */
  showConnector?: boolean;
  /** City name for booking links */
  cityName?: string;
  /** Trip ID for tracking */
  tripId?: string;
  /** Day number for tracking */
  dayNumber?: number;
  /** Callbacks */
  onViewDetails?: (activity: ItineraryActivity) => void;
  onSwap?: (activity: ItineraryActivity) => void;
  onRemove?: (activity: ItineraryActivity) => void;
  onNavigate?: (activity: ItineraryActivity) => void;
}

/** Place categories that typically have bookable tours */
const BOOKABLE_CATEGORIES = ['museum', 'gallery', 'landmark', 'monument', 'attraction', 'experience', 'viewpoint', 'castle', 'palace'];

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Time badge showing start time
 */
function TimeBadge({ time, isActive }: { time?: string; isActive: boolean }) {
  if (!time) return null;

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
        transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-r from-terracotta/20 to-gold/20 text-terracotta border border-terracotta/30'
          : 'bg-stone-100 text-stone-600 border border-stone-200'
        }
      `}
    >
      <Clock className="w-3 h-3" />
      <span>{time}</span>
    </div>
  );
}

/**
 * Hidden gem badge with sparkle effect
 */
function HiddenGemBadge() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      className="relative"
    >
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
        <Gem className="w-3 h-3" />
        <span>Hidden Gem</span>
      </div>
      {/* Sparkle effect */}
      <motion.div
        className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

/**
 * Favourite indicator
 */
function FavouriteBadge() {
  return (
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 border border-rose-200">
      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
    </div>
  );
}

/**
 * Duration pill
 */
function DurationPill({ minutes }: { minutes: number }) {
  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  return (
    <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
      {formatDuration(minutes)}
    </span>
  );
}

/**
 * Action menu dropdown
 */
function ActionMenu({
  onViewDetails,
  onSwap,
  onRemove,
  onNavigate,
  onBookActivity,
  isBookable,
}: {
  onViewDetails?: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
  onNavigate?: () => void;
  onBookActivity?: () => void;
  isBookable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
            >
              {onViewDetails && (
                <button
                  onClick={() => { onViewDetails(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  View details
                </button>
              )}
              {isBookable && onBookActivity && (
                <button
                  onClick={() => { onBookActivity(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-sage hover:bg-sage/5 transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  Book tickets
                </button>
              )}
              {onNavigate && (
                <button
                  onClick={() => { onNavigate(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Get directions
                </button>
              )}
              {onSwap && (
                <button
                  onClick={() => { onSwap(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Swap activity
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => { onRemove(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Activity Type Cards
// ============================================================================

/**
 * Place activity card
 */
function PlaceActivityContent({
  activity,
  isActive,
}: {
  activity: PlaceActivity;
  isActive: boolean;
}) {
  const { place } = activity;

  return (
    <div className="flex gap-3">
      {/* Photo */}
      {place.photoUrl ? (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-stone-400" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h4
          className={`
            font-semibold text-base leading-tight mb-1 line-clamp-1
            ${isActive ? 'text-stone-900' : 'text-stone-700'}
          `}
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {place.name}
        </h4>

        {/* Category & Rating */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-stone-500 capitalize">
            {place.category.replace('_', ' ')}
          </span>
          {place.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-stone-600">
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Address */}
        {place.address && (
          <p className="text-xs text-stone-400 line-clamp-1">
            {place.address}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Travel activity card
 */
function TravelActivityContent({ activity }: { activity: TravelActivity }) {
  const ModeIcon = activity.mode === 'walking' ? Footprints : Car;

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Mode icon */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage/20 to-sage/10 flex items-center justify-center">
        <ModeIcon className="w-5 h-5 text-sage" />
      </div>

      {/* Route info */}
      <div className="flex-1">
        <p className="text-sm text-stone-600">
          <span className="font-medium">{activity.from.name}</span>
          <span className="mx-2 text-stone-400">→</span>
          <span className="font-medium">{activity.to.name}</span>
        </p>
        <p className="text-xs text-stone-400">
          {activity.distanceKm.toFixed(1)} km • ~{activity.durationMinutes} min
        </p>
      </div>
    </div>
  );
}

/**
 * Meal activity card
 */
function MealActivityContent({
  activity,
  cityName,
  tripId,
  dayNumber,
}: {
  activity: MealActivity;
  cityName?: string;
  tripId?: string;
  dayNumber?: number;
}) {
  const mealIcons = {
    breakfast: Coffee,
    lunch: Utensils,
    dinner: Utensils,
  };
  const MealIcon = mealIcons[activity.mealType];

  const mealEmoji = {
    breakfast: '🥐',
    lunch: '🍽️',
    dinner: '🌙',
  };

  // Handle restaurant reservation click
  const handleReservation = useCallback(() => {
    if (!activity.suggestedPlace || !cityName) return;

    const options = generateRestaurantOptions({
      cityName,
      restaurantName: activity.suggestedPlace.name,
      partySize: 2,
    });

    if (options.primary) {
      const source = createItinerarySource(tripId || '', activity.suggestedPlace.placeId || '', dayNumber || 1);
      trackBookingClick(options.primary, source);
      window.open(options.primary.url, '_blank', 'noopener,noreferrer');
    }
  }, [activity.suggestedPlace, cityName, tripId, dayNumber]);

  const hasReservationOption = activity.suggestedPlace && cityName;

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Meal icon */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
        <MealIcon className="w-5 h-5 text-amber-600" />
      </div>

      {/* Meal info */}
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-700 capitalize">
          {mealEmoji[activity.mealType]} {activity.mealType} time
        </p>
        {activity.suggestedPlace ? (
          <p className="text-xs text-stone-500">
            Suggested: {activity.suggestedPlace.name}
          </p>
        ) : (
          <p className="text-xs text-stone-400">
            Find a great spot nearby
          </p>
        )}
      </div>

      {/* Reservation button */}
      {hasReservationOption && (
        <motion.button
          onClick={handleReservation}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            bg-rose-50 hover:bg-rose-100
            text-rose-600 text-xs font-medium
            transition-colors duration-200
          "
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Reserve</span>
        </motion.button>
      )}
    </div>
  );
}

/**
 * Free time activity card
 */
function FreeTimeActivityContent({ suggestion }: { suggestion?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-sky-50 flex items-center justify-center text-lg">
        ✨
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-700">Free time</p>
        {suggestion && (
          <p className="text-xs text-stone-500 italic">{suggestion}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ItineraryActivityCard({
  activity,
  isActive = false,
  isCompleted = false,
  showConnector = true,
  cityName,
  tripId,
  dayNumber,
  onViewDetails,
  onSwap,
  onRemove,
  onNavigate,
}: ItineraryActivityCardProps) {
  const isPlace = activity.type === 'place';
  const placeActivity = isPlace ? (activity as PlaceActivity) : null;

  // Check if this activity is bookable
  const isBookable = !!(isPlace &&
    placeActivity &&
    cityName &&
    BOOKABLE_CATEGORIES.some(cat =>
      placeActivity.place.category.toLowerCase().includes(cat)
    ));

  // Handle activity booking
  const handleBookActivity = useCallback(() => {
    if (!isBookable || !placeActivity || !cityName) return;

    const link = generateActivityLink({
      cityName,
      activityName: placeActivity.place.name,
      category: placeActivity.place.category,
    });

    const source = createItinerarySource(tripId || '', placeActivity.place.placeId, dayNumber || 1);
    trackBookingClick(link, source);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [isBookable, placeActivity, cityName, tripId, dayNumber]);

  return (
    <div className="relative">
      {/* Timeline connector */}
      {showConnector && (
        <div className="absolute left-[39px] top-[calc(100%+4px)] w-0.5 h-4 bg-gradient-to-b from-stone-300 to-stone-200" />
      )}

      {/* Main card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative rounded-2xl border transition-all duration-300
          ${isActive
            ? 'bg-gradient-to-br from-white to-amber-50/30 border-terracotta/30 shadow-lg shadow-terracotta/10'
            : isCompleted
              ? 'bg-stone-50/50 border-stone-200 opacity-60'
              : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-md'
          }
        `}
      >
        {/* Active indicator strip */}
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-terracotta to-gold" />
        )}

        <div className="p-4">
          {/* Header: Time + Badges + Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TimeBadge time={activity.startTime} isActive={isActive} />
              <DurationPill minutes={activity.durationMinutes} />
            </div>

            <div className="flex items-center gap-2">
              {placeActivity?.isHiddenGem && <HiddenGemBadge />}
              {placeActivity?.isFavourited && <FavouriteBadge />}
              <ActionMenu
                onViewDetails={onViewDetails ? () => onViewDetails(activity) : undefined}
                onSwap={onSwap ? () => onSwap(activity) : undefined}
                onRemove={onRemove ? () => onRemove(activity) : undefined}
                onNavigate={isPlace && onNavigate ? () => onNavigate(activity) : undefined}
                onBookActivity={isBookable ? handleBookActivity : undefined}
                isBookable={isBookable}
              />
            </div>
          </div>

          {/* Content based on activity type */}
          {activity.type === 'place' && (
            <PlaceActivityContent
              activity={activity as PlaceActivity}
              isActive={isActive}
            />
          )}
          {activity.type === 'travel' && (
            <TravelActivityContent activity={activity as TravelActivity} />
          )}
          {activity.type === 'meal' && (
            <MealActivityContent
              activity={activity as MealActivity}
              cityName={cityName}
              tripId={tripId}
              dayNumber={dayNumber}
            />
          )}
          {activity.type === 'free_time' && (
            <FreeTimeActivityContent suggestion={activity.suggestion} />
          )}

          {/* Completion overlay */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-sage/20 text-sage rounded-full text-sm font-medium">
                <span>✓</span>
                <span>Completed</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Styles (CSS Variables for theme colors)
// ============================================================================

// Add these to your global CSS or tailwind.config.js:
// --terracotta: #C45830
// --gold: #D4A853
// --sage: #4A7C59
