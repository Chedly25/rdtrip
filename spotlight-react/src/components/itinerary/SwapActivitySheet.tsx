/**
 * SwapActivitySheet
 *
 * WI-5.6: Bottom sheet for swapping an activity with alternatives
 *
 * Shows:
 * - Current activity being replaced
 * - Alternative suggestions based on time slot and category
 * - Similar places nearby
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeftRight,
  MapPin,
  Star,
  ChevronRight,
  Loader2,
  Gem,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import type { ItineraryPlace, PlaceActivity } from '../../services/itinerary';

interface SwapActivitySheetProps {
  isOpen: boolean;
  activity: PlaceActivity | null;
  alternatives: ItineraryPlace[];
  isLoading: boolean;
  onClose: () => void;
  onSwap: (newPlace: ItineraryPlace) => void;
  onRefresh: () => void;
}

export function SwapActivitySheet({
  isOpen,
  activity,
  alternatives,
  isLoading,
  onClose,
  onSwap,
  onRefresh,
}: SwapActivitySheetProps) {
  const [selectedPlace, setSelectedPlace] = useState<ItineraryPlace | null>(null);

  if (!activity) return null;

  const handleSwap = () => {
    if (selectedPlace) {
      onSwap(selectedPlace);
      setSelectedPlace(null);
    }
  };

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold text-stone-900"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Swap Activity
                    </h2>
                    <p className="text-sm text-stone-500">
                      Find a better fit for this slot
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
            <div className="px-6 py-4 bg-stone-50/50 border-b border-stone-100 flex-shrink-0">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Currently scheduled
              </p>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200">
                {activity.place.photoUrl ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                    <img
                      src={activity.place.photoUrl}
                      alt={activity.place.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-stone-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-stone-900 truncate">
                    {activity.place.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <span className="capitalize">{activity.place.category.replace('_', ' ')}</span>
                    {activity.startTime && (
                      <>
                        <span>•</span>
                        <span>{activity.startTime}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Alternatives header */}
            <div className="px-6 py-3 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-medium text-stone-700">
                Alternatives ({alternatives.length})
              </p>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Alternatives list */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-terracotta mb-3" />
                  <p className="text-stone-600">Finding alternatives...</p>
                </div>
              ) : alternatives.length > 0 ? (
                <div className="space-y-3">
                  {alternatives.map((place) => (
                    <AlternativeCard
                      key={place.placeId}
                      place={place}
                      isSelected={selectedPlace?.placeId === place.placeId}
                      onSelect={() => setSelectedPlace(
                        selectedPlace?.placeId === place.placeId ? null : place
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <ArrowLeftRight className="w-8 h-8 text-stone-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    No alternatives found
                  </h3>
                  <p className="text-sm text-stone-500 max-w-xs">
                    Try refreshing or adjusting your preferences to find more options.
                  </p>
                </div>
              )}
            </div>

            {/* Footer with swap button */}
            {selectedPlace && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="px-6 py-4 border-t border-stone-100 flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-500">Swap with</p>
                    <p className="font-semibold text-stone-900 truncate">{selectedPlace.name}</p>
                  </div>
                  <button
                    onClick={handleSwap}
                    className="px-6 py-3 bg-gradient-to-r from-terracotta to-terracotta/90 text-white rounded-xl font-medium shadow-lg shadow-terracotta/20 flex items-center gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Swap
                  </button>
                </div>
              </motion.div>
            )}

            {/* Safe area padding */}
            <div className="h-safe-bottom flex-shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Alternative card component
function AlternativeCard({
  place,
  isSelected,
  onSelect,
}: {
  place: ItineraryPlace;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
        ${isSelected
          ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta/20'
          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
        }
      `}
    >
      {/* Selection indicator */}
      <div
        className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${isSelected
            ? 'border-terracotta bg-terracotta'
            : 'border-stone-300'
          }
        `}
      >
        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
      </div>

      {/* Photo */}
      {place.photoUrl ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-stone-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-stone-900 truncate">{place.name}</h4>
          {place.hiddenGemScore && place.hiddenGemScore > 0.5 && (
            <Gem className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <span className="capitalize">{place.category.replace('_', ' ')}</span>
          {place.rating && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {place.rating.toFixed(1)}
              </span>
            </>
          )}
        </div>
        {place.description && (
          <p className="text-xs text-stone-400 truncate mt-0.5">{place.description}</p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        className={`w-5 h-5 transition-colors ${isSelected ? 'text-terracotta' : 'text-stone-400'}`}
      />
    </motion.button>
  );
}
