/**
 * RestaurantBookingCard
 *
 * WI-10.4: Restaurant booking integration component
 *
 * Design Philosophy:
 * - HIGH VALUE - Restaurant bookings are valuable, make it smooth
 * - CONTEXTUAL - Shows meal time, party size, restaurant name
 * - WARM - Rose/amber palette for dining vibes
 * - TIMELY - Shows appropriate time suggestions
 *
 * Visual Design:
 * - Warm rose/amber gradient for dining atmosphere
 * - Elegant table reservation feel
 * - Party size and time prominently shown
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Calendar,
  Users,
  ExternalLink,
  X,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import type { BookingLink, BookingOptions, RestaurantBookingContext } from '../../services/booking';
import {
  generateRestaurantOptions,
  trackBookingClick,
  createPlaceDetailsSource,
  createItinerarySource,
  PARTNER_INFO,
} from '../../services/booking';

// ============================================================================
// Types
// ============================================================================

export interface RestaurantBookingCardProps {
  /** City name */
  cityName: string;
  /** Country */
  country?: string;
  /** Restaurant name */
  restaurantName: string;
  /** Reservation date */
  date?: Date;
  /** Reservation time (24h format, e.g., "19:00") */
  time?: string;
  /** Party size */
  partySize?: number;
  /** Meal type for context */
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  /** Context for tracking */
  sourceContext: {
    type: 'place_details' | 'itinerary' | 'companion';
    tripId?: string;
    cityId?: string;
    placeId?: string;
    dayNumber?: number;
  };
  /** Visual variant */
  variant?: 'default' | 'compact' | 'inline';
  /** Whether to show dismiss button */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(date?: Date): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getDefaultTimeForMeal(mealType?: 'breakfast' | 'lunch' | 'dinner'): string {
  switch (mealType) {
    case 'breakfast': return '09:00';
    case 'lunch': return '12:30';
    case 'dinner': return '19:30';
    default: return '19:00';
  }
}

function getMealLabel(mealType?: 'breakfast' | 'lunch' | 'dinner'): string {
  switch (mealType) {
    case 'breakfast': return 'Breakfast';
    case 'lunch': return 'Lunch';
    case 'dinner': return 'Dinner';
    default: return 'Reservation';
  }
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Partner badge - shows booking partner tastefully
 */
function PartnerBadge({ partner }: { partner: string }) {
  const info = PARTNER_INFO[partner as keyof typeof PARTNER_INFO];
  if (!info) return null;

  return (
    <span
      className="text-[10px] font-medium tracking-wide uppercase opacity-60"
      style={{ color: info.brandColor }}
    >
      via {info.name}
    </span>
  );
}

/**
 * Booking link button
 */
function BookingButton({
  link,
  onClick,
  variant = 'primary',
}: {
  link: BookingLink;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative flex items-center justify-center gap-2
        px-5 py-3 rounded-xl
        font-medium text-sm
        transition-all duration-300
        ${isPrimary
          ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30'
          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        }
      `}
    >
      <UtensilsCrossed className="w-4 h-4" />
      <span>{link.cta}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RestaurantBookingCard({
  cityName,
  country,
  restaurantName,
  date,
  time,
  partySize = 2,
  mealType,
  sourceContext,
  variant = 'default',
  dismissible = true,
  onDismiss,
  className = '',
}: RestaurantBookingCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Format display values
  const dateStr = formatDate(date);
  const reservationTime = time || getDefaultTimeForMeal(mealType);
  const timeStr = formatTime(reservationTime);
  const mealLabel = getMealLabel(mealType);

  // Generate booking options
  const context: RestaurantBookingContext = {
    cityName,
    country,
    restaurantName,
    date,
    time: reservationTime,
    partySize,
  };

  const options: BookingOptions = generateRestaurantOptions(context);

  // Handle booking click
  const handleBookingClick = useCallback((link: BookingLink) => {
    const source = sourceContext.type === 'place_details'
      ? createPlaceDetailsSource(
          sourceContext.tripId || '',
          sourceContext.placeId || ''
        )
      : createItinerarySource(
          sourceContext.tripId || '',
          sourceContext.cityId || '',
          sourceContext.dayNumber || 1
        );

    trackBookingClick(link, source);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [sourceContext]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Don't render if dismissed or no options
  if (isDismissed || !options.primary) {
    return null;
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          relative flex items-center gap-3 p-3
          bg-gradient-to-r from-rose-50/80 to-amber-50/60
          border border-rose-200/50 rounded-xl
          ${className}
        `}
      >
        <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
          <UtensilsCrossed className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">
            {restaurantName}
          </p>
          <p className="text-xs text-stone-500">
            {partySize} {partySize === 1 ? 'guest' : 'guests'}
            {timeStr && ` • ${timeStr}`}
          </p>
        </div>
        <motion.button
          onClick={() => handleBookingClick(options.primary!)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1.5 bg-rose-500 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          Reserve
        </motion.button>
      </motion.div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <motion.button
        onClick={() => handleBookingClick(options.primary!)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-rose-50 hover:bg-rose-100
          border border-rose-200/60 rounded-full
          text-sm text-stone-700
          transition-colors duration-200
          ${className}
        `}
      >
        <UtensilsCrossed className="w-4 h-4 text-rose-500" />
        <span>Book a table</span>
        <ChevronRight className="w-4 h-4 text-stone-400" />
      </motion.button>
    );
  }

  // Default variant - full card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-rose-50/80
        border border-rose-200/40
        shadow-sm
        ${className}
      `}
    >
      {/* Decorative wine glass pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L35 30 L35 45 L30 50 L25 45 L25 30 Z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Dismiss button */}
      {dismissible && (
        <motion.button
          onClick={handleDismiss}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/80 border border-rose-200/50 flex items-center justify-center shadow-sm">
            <UtensilsCrossed className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1">
            <h4
              className="text-lg font-semibold text-stone-800"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {restaurantName}
            </h4>
            <p className="text-sm text-stone-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {country || cityName}
            </p>
          </div>
        </div>

        {/* Reservation details */}
        <div className="flex items-center gap-4 mb-4 py-3 px-4 bg-white/50 rounded-xl border border-rose-100">
          {dateStr && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>{dateStr}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>{timeStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Users className="w-4 h-4 text-stone-400" />
            <span>{partySize}</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm font-medium text-rose-600">
            {mealLabel}
          </span>
        </div>

        {/* Helpful tip */}
        <div className="flex items-start gap-2 mb-4 text-sm text-stone-600">
          <span className="text-base">🍷</span>
          <p className="italic">
            Reserve in advance for the best tables
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <BookingButton
            link={options.primary}
            onClick={() => handleBookingClick(options.primary!)}
            variant="primary"
          />

          {options.alternatives.length > 0 && (
            <motion.button
              onClick={() => setShowAlternatives(!showAlternatives)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 text-sm text-stone-600 hover:text-stone-800 transition-colors"
            >
              {showAlternatives ? 'Less options' : 'More options'}
            </motion.button>
          )}
        </div>

        {/* Partner attribution */}
        <div className="mt-3 flex items-center justify-between">
          <PartnerBadge partner={options.primary.partner} />
          <span className="text-[10px] text-stone-400">
            Opens in new tab
          </span>
        </div>

        {/* Alternative booking options */}
        <AnimatePresence>
          {showAlternatives && options.alternatives.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-rose-200/40 space-y-2">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                  Also available on
                </p>
                {options.alternatives.map((alt) => (
                  <motion.button
                    key={alt.partner}
                    onClick={() => handleBookingClick(alt)}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/80 border border-transparent hover:border-rose-200/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${PARTNER_INFO[alt.partner as keyof typeof PARTNER_INFO]?.brandColor}15`,
                        }}
                      >
                        <UtensilsCrossed
                          className="w-4 h-4"
                          style={{
                            color: PARTNER_INFO[alt.partner as keyof typeof PARTNER_INFO]?.brandColor,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-stone-700">
                        {PARTNER_INFO[alt.partner as keyof typeof PARTNER_INFO]?.name}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-400" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default RestaurantBookingCard;
