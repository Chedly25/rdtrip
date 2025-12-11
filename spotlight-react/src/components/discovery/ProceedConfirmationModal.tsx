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
  Plane,
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
 * Premium travel document modal with solid, opaque styling.
 * No transparency - fully solid backgrounds throughout.
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
      {/* Backdrop - SOLID dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="!fixed !inset-0 !z-50 !bg-[#1a1510] !bg-opacity-90"
        style={{ backdropFilter: 'blur(12px)' }}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="
          fixed inset-4 md:inset-auto
          md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-xl md:w-full
          z-[51]
          flex flex-col
          max-h-[calc(100vh-2rem)] md:max-h-[85vh]
        "
      >
        {/* Outer glow ring */}
        <div
          className="absolute -inset-2 rounded-[32px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #C45830 0%, #D4A853 50%, #C45830 100%)',
            opacity: 0.15,
            filter: 'blur(24px)',
          }}
        />

        {/* Paper edge layer - SOLID */}
        <div
          className="absolute -inset-1 rounded-[28px]"
          style={{
            background: 'linear-gradient(160deg, #D8CCBA 0%, #C4B49C 100%)',
            boxShadow: '0 30px 80px rgba(30, 24, 16, 0.5), 0 15px 30px rgba(30, 24, 16, 0.3)',
          }}
        />

        {/* Main modal body - COMPLETELY SOLID */}
        <div
          className="relative overflow-hidden rounded-3xl flex flex-col h-full md:h-auto"
          style={{
            background: '#FAF6F1',
            boxShadow: 'inset 0 2px 0 #FFFFFF, inset 0 -2px 0 #E8DFD0, 0 0 0 1px rgba(44, 36, 23, 0.1)',
          }}
        >
          {/* Warm gradient overlay at top - subtle tint on solid bg */}
          <div
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #F5EBE0 0%, transparent 100%)',
            }}
          />

          {/* Decorative corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[#C45830] rounded-tl pointer-events-none opacity-40" />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[#C45830] rounded-tr pointer-events-none opacity-40" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[#C45830] rounded-bl pointer-events-none opacity-30" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[#C45830] rounded-br pointer-events-none opacity-30" />

          {/* Close button - SOLID background */}
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="
              absolute top-5 right-5 z-10
              w-10 h-10 rounded-full
              flex items-center justify-center
              text-[#6B5A45] hover:text-[#2C2417]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              background: '#FFFFFF',
              border: '1px solid #D4C4AC',
              boxShadow: '0 2px 8px rgba(44, 36, 23, 0.12)',
            }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6 pt-10">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Plane icon badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-4"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                    boxShadow: '0 6px 20px rgba(196, 88, 48, 0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  <Plane className="w-6 h-6 text-white transform rotate-45" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-3xl font-bold mb-2"
                style={{ color: '#2C2417', letterSpacing: '-0.02em' }}
              >
                Your journey awaits
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-3 text-sm"
              >
                <span style={{ color: '#6B5A45' }}>{dateRange}</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C45830' }} />
                <span className="font-semibold" style={{ color: '#C45830' }}>{tripSummary.travellerType}</span>
              </motion.div>

              {/* Journey path visualization */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6 mx-auto max-w-xs"
              >
                <div
                  className="flex items-center justify-between px-5 py-4 rounded-2xl"
                  style={{
                    background: '#F5EBE0',
                    border: '1px solid #E0D4C4',
                    boxShadow: 'inset 0 1px 0 #FFFFFF',
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: '#C45830', boxShadow: '0 2px 4px rgba(196,88,48,0.3)' }} />
                    <span className="text-xs mt-2 font-semibold max-w-[65px] truncate" style={{ color: '#4A3F30' }}>
                      {route.origin.name}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center px-2 gap-1">
                    <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #C45830, #D4A853)' }} />
                    {selectedCities.slice(1, -1).map((_, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: '#4A7C59', boxShadow: '0 1px 3px rgba(74,124,89,0.4)' }}
                      />
                    ))}
                    <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #D4A853, #C45830)' }} />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: '#C45830', boxShadow: '0 2px 4px rgba(196,88,48,0.3)' }} />
                    <span className="text-xs mt-2 font-semibold max-w-[65px] truncate" style={{ color: '#4A3F30' }}>
                      {route.destination.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats cards - SOLID white */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              {[
                { icon: Moon, value: stats.totalNights, label: 'nights', color: '#C45830' },
                { icon: MapPin, value: stats.totalStops, label: 'stops', color: '#4A7C59' },
                { icon: Sparkles, value: stats.hiddenGems, label: 'gems', color: '#D4A853' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E0D4C4',
                    boxShadow: '0 2px 8px rgba(44, 36, 23, 0.08), inset 0 1px 0 #FFFFFF',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: stat.color }}>
                    <stat.icon className="w-4 h-4" />
                    <span className="font-display text-2xl font-bold">{stat.value}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#8B7355' }}>{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Route list - SOLID white card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: '#6B5A45' }}
              >
                <div className="w-4 h-0.5 rounded-full" style={{ background: '#C45830' }} />
                Your Route
              </h3>

              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E0D4C4',
                  boxShadow: '0 2px 12px rgba(44, 36, 23, 0.08)',
                }}
              >
                {selectedCities.map((city, index) => (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: index < selectedCities.length - 1 ? '1px solid #F0E8DC' : 'none',
                    }}
                  >
                    {/* Number badge */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={city.isFixed ? {
                        background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 6px rgba(196, 88, 48, 0.35)',
                      } : {
                        background: '#EBF5ED',
                        color: '#4A7C59',
                        border: '1px solid #C8DCC8',
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* City name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold truncate" style={{ color: '#2C2417' }}>
                        {city.name}
                      </p>
                    </div>

                    {/* Nights pill */}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: '#FEF3EE', color: '#C45830' }}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>{city.nights ?? city.suggestedNights ?? 1}</span>
                    </div>

                    {index < selectedCities.length - 1 && (
                      <ChevronRight className="w-4 h-4" style={{ color: '#C4B8A5' }} />
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
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: '#6B5A45' }}
                >
                  <Heart className="w-3.5 h-3.5" style={{ color: '#B54A4A' }} />
                  Saved for your itinerary
                </h3>

                <div className="flex flex-wrap gap-2">
                  {favouritedPlaces.slice(0, 5).map((place) => (
                    <span
                      key={place.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: '#FDF0F0',
                        border: '1px solid #EACACA',
                        color: '#8B4A4A',
                      }}
                    >
                      {place.name}
                    </span>
                  ))}
                  {favouritedPlaces.length > 5 && (
                    <span className="px-3 py-1.5 text-xs font-medium" style={{ color: '#8B7355' }}>
                      +{favouritedPlaces.length - 5} more
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Companion message card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="p-4 rounded-xl"
              style={{
                background: '#F5EBE0',
                border: '1px solid #E0D4C4',
              }}
            >
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #FEF3EE 0%, #FDEEE6 100%)',
                    border: '1px solid #E8D4C8',
                  }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: '#C45830' }} />
                </div>
                <div>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: '#2C2417' }}>
                    {personalizedMessage}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: '#8B7355' }}>
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
                  className="mt-4 p-4 rounded-xl flex items-start gap-3"
                  style={{
                    background: '#FDF0F0',
                    border: '1px solid #EACACA',
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#B54A4A' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#B54A4A' }}>
                      Something went wrong
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6B5A45' }}>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - SOLID background */}
          <div
            className="flex-shrink-0 p-6 pt-5"
            style={{
              background: '#F0E8DC',
              borderTop: '1px solid #E0D4C4',
            }}
          >
            <div className="flex flex-col gap-3">
              {/* PRIMARY CTA BUTTON - SOLID TERRACOTTA */}
              <motion.button
                onClick={onConfirm}
                disabled={isGenerating}
                whileHover={isGenerating ? {} : { scale: 1.02, y: -2 }}
                whileTap={isGenerating ? {} : { scale: 0.98 }}
                className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-display font-bold text-lg"
                style={{
                  background: isGenerating
                    ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                    : '#C45830',
                  color: '#FFFFFF',
                  boxShadow: isGenerating
                    ? '0 4px 20px rgba(196, 88, 48, 0.3)'
                    : '0 8px 30px rgba(196, 88, 48, 0.4), 0 4px 12px rgba(196, 88, 48, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                  opacity: isGenerating ? 0.9 : 1,
                }}
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

                {/* Shimmer effect */}
                {isGenerating && (
                  <motion.div className="absolute inset-0 rounded-xl overflow-hidden">
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </motion.button>

              {/* Secondary button */}
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="w-full py-3 text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: '#6B5A45' }}
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
