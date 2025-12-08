import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Moon,
  Heart,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type {
  DiscoveryRoute,
  TripSummary,
  DiscoveryCity,
  DiscoveryPlace,
  InferredPreferences,
} from '../../stores/discoveryStore';

interface ProceedConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  route: DiscoveryRoute;
  tripSummary: TripSummary;
  selectedCities: DiscoveryCity[];
  favouritedPlaces: DiscoveryPlace[];
  inferredPreferences: InferredPreferences;
  isGenerating: boolean;
  error: string | null;
}

/**
 * ProceedConfirmationModal
 *
 * The commitment moment before itinerary generation.
 * Designed to feel exciting and momentous - like opening a travel journal.
 *
 * WI-1.7: Create "Proceed to Itinerary" Flow
 *
 * Design: Editorial/Magazine aesthetic with warm travel journal feel.
 * - Shows trip summary with visual route indicator
 * - Displays selected cities and nights allocation
 * - Highlights favourited places
 * - Confidence messaging from companion
 * - Clear CTA with loading state
 */
export function ProceedConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  route,
  tripSummary,
  selectedCities,
  favouritedPlaces,
  inferredPreferences,
  isGenerating,
  error,
}: ProceedConfirmationModalProps) {
  // Calculate trip stats
  const stats = useMemo(() => {
    const totalNights = selectedCities.reduce(
      (sum, city) => sum + (city.nights ?? city.suggestedNights ?? 1),
      0
    );
    const totalStops = selectedCities.length;
    const totalPlaces = selectedCities.reduce(
      (sum, city) => sum + (city.placeCount ?? 0),
      0
    );
    const hiddenGems = selectedCities.reduce(
      (sum, city) =>
        sum + (city.places?.filter((p) => p.isHiddenGem).length ?? 0),
      0
    );

    return { totalNights, totalStops, totalPlaces, hiddenGems };
  }, [selectedCities]);

  // Format date range
  const dateRange = useMemo(() => {
    const start = new Date(tripSummary.startDate);
    const end = new Date(tripSummary.endDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
  }, [tripSummary]);

  // Generate personalized message based on preferences
  const personalizedMessage = useMemo(() => {
    const messages = [
      `I'll craft a day-by-day itinerary tailored to your journey.`,
      `Based on your selections, I'll create the perfect balance of adventure and discovery.`,
      `Your ${stats.totalNights}-night adventure is about to come to life.`,
    ];

    if (favouritedPlaces.length > 0) {
      return `I've noted your ${favouritedPlaces.length} favourited ${favouritedPlaces.length === 1 ? 'place' : 'places'} and will weave ${favouritedPlaces.length === 1 ? 'it' : 'them'} into your itinerary.`;
    }

    if (inferredPreferences.prefersHiddenGems) {
      return `I can see you appreciate hidden gems – expect plenty of off-the-beaten-path discoveries.`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }, [favouritedPlaces, inferredPreferences, stats.totalNights]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-espresso/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="
          fixed inset-4 md:inset-auto
          md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-xl md:w-full
          z-50
          flex flex-col
          max-h-[calc(100vh-2rem)] md:max-h-[85vh]
        "
      >
        <div
          className="
            relative overflow-hidden
            bg-rui-cream rounded-3xl
            shadow-2xl
            flex flex-col
            h-full md:h-auto
          "
        >
          {/* Decorative header gradient */}
          <div
            className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% 0%, rgba(196, 88, 48, 0.12) 0%, transparent 70%),
                radial-gradient(ellipse 60% 40% at 80% 10%, rgba(212, 168, 83, 0.08) 0%, transparent 60%)
              `,
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="
              absolute top-4 right-4 z-10
              w-10 h-10 rounded-full
              bg-white/80 backdrop-blur-sm
              flex items-center justify-center
              text-rui-grey-50 hover:text-rui-black
              hover:bg-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-8">
            {/* Header - Route visualization */}
            <div className="text-center mb-8">
              {/* Journey line with cities */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-3 h-3 rounded-full bg-rui-accent" />
                  <span className="text-body-3 text-rui-grey-50 mt-1 max-w-[80px] truncate">
                    {route.origin.name}
                  </span>
                </motion.div>

                {/* Route dots */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex-1 flex items-center gap-1 px-2"
                >
                  {selectedCities.slice(1, -1).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="w-2 h-2 rounded-full bg-rui-sage flex-shrink-0"
                    />
                  ))}
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-rui-accent via-rui-sage to-rui-accent opacity-30" />
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-3 h-3 rounded-full bg-rui-accent" />
                  <span className="text-body-3 text-rui-grey-50 mt-1 max-w-[80px] truncate">
                    {route.destination.name}
                  </span>
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl md:text-3xl font-semibold text-rui-black mb-2"
              >
                Your journey awaits
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-body-2 text-rui-grey-60"
              >
                {dateRange} • {tripSummary.travellerType}
              </motion.p>
            </div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-rui-accent mb-1">
                  <Moon className="w-4 h-4" />
                  <span className="font-display text-2xl font-bold">
                    {stats.totalNights}
                  </span>
                </div>
                <span className="text-body-3 text-rui-grey-50">nights</span>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-rui-sage mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-display text-2xl font-bold">
                    {stats.totalStops}
                  </span>
                </div>
                <span className="text-body-3 text-rui-grey-50">stops</span>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-rui-golden mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-display text-2xl font-bold">
                    {stats.hiddenGems}
                  </span>
                </div>
                <span className="text-body-3 text-rui-grey-50">gems</span>
              </div>
            </motion.div>

            {/* Selected cities */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <h3 className="text-body-3 font-medium text-rui-grey-50 uppercase tracking-wide mb-3">
                Your Route
              </h3>

              <div className="space-y-2">
                {selectedCities.map((city, index) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    className="
                      flex items-center gap-3 p-3
                      bg-white rounded-xl
                      border border-rui-grey-10
                    "
                  >
                    {/* Index */}
                    <div
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center
                        text-xs font-bold
                        ${city.isFixed
                          ? 'bg-rui-accent text-white'
                          : 'bg-rui-sage/10 text-rui-sage'
                        }
                      `}
                    >
                      {index + 1}
                    </div>

                    {/* City info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-rui-black truncate">
                        {city.name}
                      </p>
                    </div>

                    {/* Nights */}
                    <div className="flex items-center gap-1 text-body-3 text-rui-grey-50">
                      <Moon className="w-3.5 h-3.5" />
                      <span>{city.nights ?? city.suggestedNights ?? 1}</span>
                    </div>

                    {/* Arrow to next */}
                    {index < selectedCities.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-rui-grey-20" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Favourited places */}
            {favouritedPlaces.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <h3 className="text-body-3 font-medium text-rui-grey-50 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-danger" />
                  Saved for your itinerary
                </h3>

                <div className="flex flex-wrap gap-2">
                  {favouritedPlaces.slice(0, 5).map((place) => (
                    <span
                      key={place.id}
                      className="
                        px-3 py-1.5 rounded-full
                        bg-danger/5 border border-danger/10
                        text-body-3 text-rui-grey-70
                      "
                    >
                      {place.name}
                    </span>
                  ))}
                  {favouritedPlaces.length > 5 && (
                    <span className="px-3 py-1.5 text-body-3 text-rui-grey-50">
                      +{favouritedPlaces.length - 5} more
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Companion message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="
                p-4 rounded-2xl
                bg-gradient-to-br from-rui-accent/5 to-rui-golden/5
                border border-rui-accent/10
              "
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rui-accent/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-rui-accent" />
                </div>
                <div>
                  <p className="text-body-2 text-rui-black leading-relaxed">
                    {personalizedMessage}
                  </p>
                  <p className="text-body-3 text-rui-grey-50 mt-2">
                    This usually takes about 30 seconds.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="
                    mt-4 p-4 rounded-xl
                    bg-danger/5 border border-danger/20
                    flex items-start gap-3
                  "
                >
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-body-2 font-medium text-danger">
                      Something went wrong
                    </p>
                    <p className="text-body-3 text-rui-grey-60 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer with CTAs */}
          <div className="flex-shrink-0 p-6 pt-4 border-t border-rui-grey-10 bg-white/50">
            <div className="flex flex-col gap-3">
              {/* Primary CTA */}
              <motion.button
                onClick={onConfirm}
                disabled={isGenerating}
                whileHover={isGenerating ? {} : { scale: 1.02 }}
                whileTap={isGenerating ? {} : { scale: 0.98 }}
                className={`
                  relative w-full flex items-center justify-center gap-2
                  py-4 rounded-2xl
                  font-display font-semibold text-white
                  transition-all duration-300
                  ${isGenerating
                    ? 'bg-rui-accent/70 cursor-wait'
                    : 'bg-rui-accent hover:shadow-xl hover:shadow-rui-accent/25'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating your itinerary...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate My Itinerary</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}

                {/* Shimmer effect when generating */}
                {isGenerating && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ translateX: ['0%', '200%'] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </motion.div>
                )}
              </motion.button>

              {/* Secondary action */}
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="
                  w-full py-3
                  text-body-2 text-rui-grey-60 hover:text-rui-black
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Adjust my selections
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default ProceedConfirmationModal;
