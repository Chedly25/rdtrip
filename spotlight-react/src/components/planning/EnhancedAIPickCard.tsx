/**
 * EnhancedAIPickCard
 *
 * Premium AI recommendation card with animated gradient border,
 * contextual reasoning, and delightful micro-interactions.
 *
 * Design: Warm Editorial with a touch of magic - the AI feels
 * like a knowledgeable friend making a thoughtful suggestion.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Star,
  Clock,
  MapPin,
  Footprints,
  Plus,
  ChevronDown,
  ChevronUp,
  Gem,
  AlertTriangle,
  Heart,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Check,
} from 'lucide-react';
import { haversineDistance, CATEGORY_ICONS } from '../../utils/planningEnrichment';
import type { EnrichedPlace, Slot } from '../../types/planning';

// ============================================================================
// Slot Configuration
// ============================================================================

const SLOT_QUICK_SELECT: Record<Slot, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  morning: {
    label: 'Morning',
    icon: <Coffee className="w-3.5 h-3.5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <Sun className="w-3.5 h-3.5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-3.5 h-3.5" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-3.5 h-3.5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
};

// ============================================================================
// Props Interface
// ============================================================================

interface EnhancedAIPickCardProps {
  place: EnrichedPlace;
  reason: string;
  caveat?: string;
  anchorLocation?: { lat: number; lng: number };
  targetSlot: Slot;
  onAdd: (slot: Slot) => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function EnhancedAIPickCard({
  place,
  reason,
  caveat,
  anchorLocation,
  targetSlot,
  onAdd,
  className = '',
}: EnhancedAIPickCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Calculate distance from anchor
  const distanceInfo = useMemo(() => {
    if (!anchorLocation) return null;

    const distance = haversineDistance(
      anchorLocation.lat,
      anchorLocation.lng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    const walkingMins = Math.round(distance * 12); // ~5 km/h

    return {
      km: distance,
      walkingMins,
      label: distance < 0.3
        ? 'Just around the corner'
        : distance < 0.8
          ? `${walkingMins} min walk`
          : distance < 2
            ? `${walkingMins} min walk (${distance.toFixed(1)} km)`
            : `${distance.toFixed(1)} km away`,
    };
  }, [anchorLocation, place]);

  // Get category icon
  const categoryIcon = CATEGORY_ICONS[place.category] || '📍';

  // Handle add action
  const handleAdd = async (slot: Slot) => {
    setIsAdding(true);
    setSelectedSlot(slot);

    // Brief delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 400));

    onAdd(slot);
    setIsAdding(false);
  };

  // Quick add to target slot
  const handleQuickAdd = () => {
    handleAdd(targetSlot);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      {/* Animated gradient border */}
      <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
        <motion.div
          animate={{
            background: [
              'linear-gradient(0deg, #C45830, #F59E0B, #EC4899, #C45830)',
              'linear-gradient(90deg, #C45830, #F59E0B, #EC4899, #C45830)',
              'linear-gradient(180deg, #C45830, #F59E0B, #EC4899, #C45830)',
              'linear-gradient(270deg, #C45830, #F59E0B, #EC4899, #C45830)',
              'linear-gradient(360deg, #C45830, #F59E0B, #EC4899, #C45830)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0"
        />
      </div>

      {/* Main card */}
      <div className="relative bg-white rounded-2xl overflow-hidden">
        {/* Header with AI badge */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/30" />

          {/* Sparkle decoration */}
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
            </motion.div>
          </div>

          <div className="relative px-5 py-4">
            {/* AI Pick Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-body-3 font-medium shadow-sm">
                <Sparkles className="w-3 h-3" />
                AI Pick
              </div>
              {place.is_hidden_gem && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-body-3 font-medium">
                  <Gem className="w-3 h-3" />
                  Hidden Gem
                </div>
              )}
            </div>

            {/* Place info */}
            <div className="flex gap-4">
              {/* Photo */}
              {place.photos && place.photos.length > 0 && place.photos[0].url ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <img
                    src={place.photos[0].url}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-rui-grey-10 to-rui-grey-20 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">{categoryIcon}</span>
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-rui-black mb-1 line-clamp-1">
                  {place.name}
                </h3>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-3 text-rui-grey-60">
                  {place.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {place.rating.toFixed(1)}
                    </span>
                  )}
                  {place.price_level !== undefined && (
                    <span className="text-emerald-600">
                      {'€'.repeat(place.price_level + 1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{place.estimated_duration_mins} min
                  </span>
                </div>

                {/* Distance */}
                {distanceInfo && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-body-3 text-rui-grey-50">
                    <Footprints className="w-3.5 h-3.5" />
                    {distanceInfo.label}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning section */}
        <div className="px-5 py-4 border-t border-rui-grey-10">
          <p className="text-body-2 text-rui-grey-70 leading-relaxed">
            {reason}
          </p>

          {/* Caveat warning */}
          {caveat && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200/50"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-body-3 text-amber-800">{caveat}</p>
            </motion.div>
          )}

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-3 text-body-3 text-rui-grey-50 hover:text-rui-accent transition-colors"
          >
            {isExpanded ? (
              <>
                Less details <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                More details <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {/* Address */}
                  {place.formatted_address && (
                    <div className="flex items-start gap-2 text-body-3">
                      <MapPin className="w-4 h-4 text-rui-grey-40 flex-shrink-0 mt-0.5" />
                      <span className="text-rui-grey-60">{place.formatted_address}</span>
                    </div>
                  )}

                  {/* Vibe tags */}
                  {place.vibe_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {place.vibe_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full bg-rui-grey-5 text-body-3 text-rui-grey-60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Valid slots */}
                  <div className="flex items-center gap-2 text-body-3">
                    <span className="text-rui-grey-50">Best for:</span>
                    <div className="flex gap-1.5">
                      {place.valid_slots.map((slot) => (
                        <span
                          key={slot}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${SLOT_QUICK_SELECT[slot].bgColor} ${SLOT_QUICK_SELECT[slot].color}`}
                        >
                          {SLOT_QUICK_SELECT[slot].icon}
                          {SLOT_QUICK_SELECT[slot].label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action footer */}
        <div className="px-5 py-4 border-t border-rui-grey-10 bg-rui-grey-2">
          <div className="flex items-center gap-3">
            {/* Quick add button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickAdd}
              disabled={isAdding}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                font-medium text-body-2 transition-all
                ${isAdding && selectedSlot === targetSlot
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rui-accent text-white hover:bg-rui-accent/90 shadow-md hover:shadow-lg'
                }
              `}
            >
              {isAdding && selectedSlot === targetSlot ? (
                <>
                  <Check className="w-4 h-4" />
                  Added!
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to {SLOT_QUICK_SELECT[targetSlot].label}
                </>
              )}
            </motion.button>

            {/* Slot picker toggle */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSlotPicker(!showSlotPicker)}
                className="p-3 rounded-xl bg-rui-grey-10 text-rui-grey-60 hover:bg-rui-grey-20 hover:text-rui-black transition-colors"
                title="Choose different slot"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showSlotPicker ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Slot picker dropdown */}
              <AnimatePresence>
                {showSlotPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded-xl shadow-rui-3 border border-rui-grey-10 min-w-[160px]"
                  >
                    <p className="px-2 py-1 text-body-3 text-rui-grey-50 font-medium">
                      Add to...
                    </p>
                    {(Object.keys(SLOT_QUICK_SELECT) as Slot[]).map((slot) => {
                      const config = SLOT_QUICK_SELECT[slot];
                      const isValid = place.valid_slots.includes(slot);

                      return (
                        <button
                          key={slot}
                          onClick={() => {
                            handleAdd(slot);
                            setShowSlotPicker(false);
                          }}
                          disabled={!isValid || isAdding}
                          className={`
                            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body-2
                            transition-colors text-left
                            ${isAdding && selectedSlot === slot
                              ? 'bg-emerald-100 text-emerald-700'
                              : isValid
                                ? 'hover:bg-rui-grey-5 text-rui-grey-70'
                                : 'opacity-40 cursor-not-allowed text-rui-grey-40'
                            }
                          `}
                        >
                          <span className={`${config.color}`}>{config.icon}</span>
                          {config.label}
                          {isAdding && selectedSlot === slot && (
                            <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />
                          )}
                          {!isValid && (
                            <span className="ml-auto text-body-3 text-rui-grey-40">
                              Not ideal
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Save for later (heart) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-xl bg-rui-grey-10 text-rui-grey-40 hover:bg-rose-100 hover:text-rose-500 transition-colors"
              title="Save for later"
            >
              <Heart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Compact Version for Lists
// ============================================================================

interface CompactAIPickBadgeProps {
  className?: string;
}

export function CompactAIPickBadge({ className = '' }: CompactAIPickBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-medium ${className}`}>
      <Sparkles className="w-2.5 h-2.5" />
      AI Pick
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default EnhancedAIPickCard;
