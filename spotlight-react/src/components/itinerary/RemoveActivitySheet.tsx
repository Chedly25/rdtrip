/**
 * RemoveActivitySheet
 *
 * WI-5.6: Bottom sheet for removing an activity with options
 *
 * Options:
 * - Fill gap: Remove and shift other activities
 * - Leave free time: Replace with free time block
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { ItineraryActivity, PlaceActivity } from '../../services/itinerary';
import type { RemoveOption } from '../../hooks/useItineraryEditor';

interface RemoveActivitySheetProps {
  isOpen: boolean;
  activity: ItineraryActivity | null;
  onClose: () => void;
  onRemove: (option: RemoveOption) => void;
}

export function RemoveActivitySheet({
  isOpen,
  activity,
  onClose,
  onRemove,
}: RemoveActivitySheetProps) {
  if (!activity) return null;

  const isPlace = activity.type === 'place';
  const placeActivity = isPlace ? (activity as PlaceActivity) : null;
  const activityName = placeActivity?.place.name || 'this activity';

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold text-stone-900"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Remove Activity
                    </h2>
                    <p className="text-sm text-stone-500">
                      {activityName}
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

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Are you sure?</p>
                  <p className="text-amber-700 mt-1">
                    Choose how you'd like to handle the time slot after removal.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {/* Fill gap option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onRemove('fill-gap')}
                  className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-stone-200 hover:border-terracotta/50 hover:bg-terracotta/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-terracotta/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Clock className="w-6 h-6 text-stone-600 group-hover:text-terracotta transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900 group-hover:text-terracotta transition-colors">
                      Fill the gap
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                      Remove the activity and shift other activities to fill the time slot.
                      Your day will be more compact.
                    </p>
                  </div>
                </motion.button>

                {/* Leave free time option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onRemove('leave-free-time')}
                  className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-stone-200 hover:border-sage/50 hover:bg-sage/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-sage/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Sparkles className="w-6 h-6 text-stone-600 group-hover:text-sage transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900 group-hover:text-sage transition-colors">
                      Leave as free time
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                      Replace with a free time block. Perfect if you want flexibility
                      to explore on your own.
                    </p>
                  </div>
                </motion.button>
              </div>

              {/* Cancel button */}
              <button
                onClick={onClose}
                className="w-full py-3 text-center text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Safe area padding */}
            <div className="h-safe-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
