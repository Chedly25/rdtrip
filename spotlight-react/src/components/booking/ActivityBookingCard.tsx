/**
 * ActivityBookingCard
 *
 * WI-10.3: Activity/tour booking integration component
 *
 * Design Philosophy:
 * - RELEVANT - Only show for bookable activities, not random upsells
 * - CONTEXTUAL - Matches the activity being viewed
 * - HELPFUL - Like a friend suggesting a tour, not an ad
 * - ELEGANT - Warm travel journal aesthetic
 *
 * Visual Design:
 * - Sage green accents (activities/experiences theme)
 * - Ticket-like feel with subtle dashed borders
 * - Partner attribution tasteful, not prominent
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Calendar,
  Users,
  ExternalLink,
  X,
  ChevronRight,
  Sparkles,
  MapPin,
} from 'lucide-react';
import type { BookingLink, BookingOptions, ActivityBookingContext } from '../../services/booking';
import {
  generateActivityOptions,
  trackBookingClick,
  createPlaceDetailsSource,
  createItinerarySource,
  PARTNER_INFO,
} from '../../services/booking';

// ============================================================================
// Types
// ============================================================================

export interface ActivityBookingCardProps {
  /** City name */
  cityName: string;
  /** Country */
  country?: string;
  /** Activity/place name */
  activityName?: string;
  /** Activity category for better matching */
  category?: string;
  /** Activity date */
  date?: Date;
  /** Number of participants */
  participants?: number;
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
          ? 'bg-gradient-to-r from-sage to-sage/90 text-white shadow-lg shadow-sage/20 hover:shadow-xl hover:shadow-sage/30'
          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        }
      `}
    >
      <Ticket className="w-4 h-4" />
      <span>{link.cta}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ActivityBookingCard({
  cityName,
  country,
  activityName,
  category,
  date,
  participants = 2,
  sourceContext,
  variant = 'default',
  dismissible = true,
  onDismiss,
  className = '',
}: ActivityBookingCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Format display values
  const dateStr = formatDate(date);

  // Generate booking options
  const context: ActivityBookingContext = {
    cityName,
    country,
    activityName,
    category,
    date,
    participants,
  };

  const options: BookingOptions = generateActivityOptions(context);

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
          bg-gradient-to-r from-emerald-50/80 to-sage/10
          border border-sage/30 rounded-xl
          ${className}
        `}
      >
        <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
          <Ticket className="w-4 h-4 text-sage" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">
            {activityName ? `Book ${activityName}` : `Tours in ${cityName}`}
          </p>
          <p className="text-xs text-stone-500">
            {participants} {participants === 1 ? 'person' : 'people'}
            {dateStr && ` • ${dateStr}`}
          </p>
        </div>
        <motion.button
          onClick={() => handleBookingClick(options.primary!)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1.5 bg-sage text-white text-sm font-medium rounded-lg shadow-sm"
        >
          Book
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
          bg-emerald-50 hover:bg-emerald-100
          border border-sage/30 rounded-full
          text-sm text-stone-700
          transition-colors duration-200
          ${className}
        `}
      >
        <Ticket className="w-4 h-4 text-sage" />
        <span>{activityName ? 'Book this' : 'Find tours'}</span>
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
        bg-gradient-to-br from-emerald-50/90 via-sage/5 to-emerald-50/80
        border border-sage/30
        shadow-sm
        ${className}
      `}
    >
      {/* Decorative ticket perforation pattern */}
      <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-center gap-2 opacity-20">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-sage" />
        ))}
      </div>

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

      <div className="relative p-5 pl-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/80 border border-sage/30 flex items-center justify-center shadow-sm">
            <Ticket className="w-5 h-5 text-sage" />
          </div>
          <div className="flex-1">
            <h4
              className="text-lg font-semibold text-stone-800"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {activityName ? `Book ${activityName}` : `Discover ${cityName}`}
            </h4>
            <p className="text-sm text-stone-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {country || 'Tours, activities & experiences'}
            </p>
          </div>
        </div>

        {/* Activity details */}
        <div className="flex items-center gap-4 mb-4 py-3 px-4 bg-white/50 rounded-xl border border-sage/20">
          {dateStr && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>{dateStr}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Users className="w-4 h-4 text-stone-400" />
            <span>{participants} {participants === 1 ? 'person' : 'people'}</span>
          </div>
          {category && (
            <>
              <div className="flex-1" />
              <span className="text-sm font-medium text-sage capitalize">
                {category.replace('_', ' ')}
              </span>
            </>
          )}
        </div>

        {/* Helpful tip */}
        <div className="flex items-start gap-2 mb-4 text-sm text-stone-600">
          <Sparkles className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
          <p className="italic">
            {activityName
              ? 'Skip the line with advance booking'
              : `Find unique experiences and tours in ${cityName}`
            }
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
              <div className="mt-4 pt-4 border-t border-sage/20 space-y-2">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                  Also available on
                </p>
                {options.alternatives.map((alt) => (
                  <motion.button
                    key={alt.partner}
                    onClick={() => handleBookingClick(alt)}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/80 border border-transparent hover:border-sage/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${PARTNER_INFO[alt.partner as keyof typeof PARTNER_INFO]?.brandColor}15`,
                        }}
                      >
                        <Ticket
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

export default ActivityBookingCard;
