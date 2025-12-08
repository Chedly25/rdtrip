/**
 * SwapActivitySheetEnhanced
 *
 * WI-5.7: Enhanced bottom sheet with intelligent alternatives fetching
 *
 * Improvements over WI-5.6 SwapActivitySheet:
 * - Auto-fetches alternatives using alternatives service
 * - Shows mix of similar and variety options
 * - Displays reason badges (hidden gem, similar, variety)
 * - Score indicators for preference match
 * - One-tap quick swap
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeftRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { AlternativesPanel } from './AlternativesPanel';
import {
  getAlternatives,
  type AlternativePlace,
  type PlaceActivity,
  type TimeSlot,
  type ItineraryPlace,
} from '../../services/itinerary';
import type { Coordinates } from '../../services/hiddenGems';
import type { UserPreferences } from '../../services/preferences';

// ============================================================================
// Types
// ============================================================================

interface SwapActivitySheetEnhancedProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Current activity to swap */
  activity: PlaceActivity | null;
  /** Time slot of the activity */
  slot: TimeSlot;
  /** City coordinates for fetching alternatives */
  cityCoordinates: Coordinates;
  /** City name */
  cityName?: string;
  /** User preferences for scoring */
  preferences: UserPreferences;
  /** Place IDs already in the itinerary (to exclude from alternatives) */
  excludePlaceIds?: string[];
  /** Callback when sheet is closed */
  onClose: () => void;
  /** Callback when swap is confirmed */
  onSwap: (newPlace: ItineraryPlace) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function SwapActivitySheetEnhanced({
  isOpen,
  activity,
  slot,
  cityCoordinates,
  cityName,
  preferences,
  excludePlaceIds = [],
  onClose,
  onSwap,
}: SwapActivitySheetEnhancedProps) {
  const [alternatives, setAlternatives] = useState<AlternativePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch alternatives when activity changes
  useEffect(() => {
    if (isOpen && activity) {
      fetchAlternatives();
    }
  }, [isOpen, activity?.place.placeId]);

  // Reset selection when alternatives change
  useEffect(() => {
    setSelectedId(null);
  }, [alternatives]);

  const fetchAlternatives = async () => {
    if (!activity) return;

    setIsLoading(true);
    try {
      const result = await getAlternatives({
        currentActivity: activity,
        slot,
        cityCoordinates,
        cityName,
        preferences,
        excludePlaceIds,
        limit: 12,
      });
      setAlternatives(result.all);
    } catch (error) {
      console.error('Failed to fetch alternatives:', error);
      setAlternatives([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (alt: AlternativePlace) => {
    setSelectedId((prev) =>
      prev === alt.place.placeId ? null : alt.place.placeId
    );
  };

  const handleQuickSwap = (alt: AlternativePlace) => {
    onSwap(alt.place);
    onClose();
  };

  const handleConfirmSwap = () => {
    const selected = alternatives.find((a) => a.place.placeId === selectedId);
    if (selected) {
      onSwap(selected.place);
      onClose();
    }
  };

  const selectedAlternative = alternatives.find(
    (a) => a.place.placeId === selectedId
  );

  if (!activity) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta/20 to-gold/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-terracotta" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold text-stone-900"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Find Alternatives
                    </h2>
                    <p className="text-sm text-stone-500">
                      Better options for your {slot}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current activity */}
            <div className="px-6 py-4 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-100 flex-shrink-0">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Currently scheduled
              </p>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
                {activity.place.photoUrl ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                    <img
                      src={activity.place.photoUrl}
                      alt={activity.place.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-stone-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-semibold text-stone-900 truncate"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {activity.place.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <span className="capitalize">
                      {activity.place.category.replace('_', ' ')}
                    </span>
                    {activity.startTime && (
                      <>
                        <span className="text-stone-300">•</span>
                        <span>{activity.startTime}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Alternatives panel */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AlternativesPanel
                alternatives={alternatives}
                isLoading={isLoading}
                selectedId={selectedId}
                onSelect={handleSelect}
                onSwap={handleQuickSwap}
                onRefresh={fetchAlternatives}
                mode="vertical"
                showSections={true}
              />
            </div>

            {/* Footer with confirm button */}
            <AnimatePresence>
              {selectedAlternative && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="px-6 py-4 border-t border-stone-100 bg-white flex-shrink-0"
                >
                  <div className="flex items-center gap-3">
                    {/* Selected preview */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {selectedAlternative.place.photoUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={selectedAlternative.place.photoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-stone-500">Swap with</p>
                        <p className="font-semibold text-stone-900 truncate">
                          {selectedAlternative.place.name}
                        </p>
                      </div>
                    </div>

                    {/* Confirm button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmSwap}
                      className="px-6 py-3 bg-gradient-to-r from-terracotta to-terracotta/90 text-white rounded-xl font-medium shadow-lg shadow-terracotta/20 flex items-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Confirm Swap
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Safe area padding */}
            <div className="h-safe-bottom flex-shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
