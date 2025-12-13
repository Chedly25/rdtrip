import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, MapPin, ArrowRight, Sparkles, Plus, Map } from 'lucide-react';
import type { DiscoveryRoute, TripSummary } from '../../stores/discoveryStore';
import { useDiscoveryStore } from '../../stores/discoveryStore';

interface DiscoveryHeaderProps {
  tripSummary: TripSummary | null;
  route: DiscoveryRoute | null;
  onBack: () => void;
  onProceed: () => void;
  onPlanTrip?: () => void;
  onAddCity: () => void;
  isDesktop: boolean;
  isPlanningLoading?: boolean;
}

/**
 * DiscoveryHeader
 *
 * Floating header showing trip summary and navigation.
 * Displays: origin → destination, dates, traveller count, selected cities count.
 */
export function DiscoveryHeader({
  tripSummary,
  route,
  onBack,
  onProceed,
  onPlanTrip,
  onAddCity,
  isDesktop,
  isPlanningLoading = false,
}: DiscoveryHeaderProps) {
  const getSelectedCities = useDiscoveryStore((state) => state.getSelectedCities);
  const getTotalSelectedNights = useDiscoveryStore((state) => state.getTotalSelectedNights);

  const selectedCount = getSelectedCities().length;
  const totalNights = getTotalSelectedNights();

  // Format date range
  const formatDateRange = () => {
    if (!tripSummary) return '';
    const start = tripSummary.startDate;
    const end = tripSummary.endDate;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Format traveller type
  const formatTravellerType = () => {
    if (!tripSummary) return '';
    const map: Record<string, string> = {
      solo: 'Solo',
      couple: 'Couple',
      family: 'Family',
      friends: 'Friends',
      group: 'Group',
    };
    return map[tripSummary.travellerType] || tripSummary.travellerType;
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`
        absolute top-0 left-0 right-0 z-30
        ${isDesktop ? 'right-[380px]' : ''}
      `}
    >
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Glass card - warm cream with visible border for contrast */}
          <div
            className="
              bg-rui-cream/95 backdrop-blur-xl
              rounded-2xl md:rounded-3xl
              shadow-lg shadow-rui-black/10
              border border-rui-grey-20
              overflow-hidden
            "
          >
            {/* Main row */}
            <div className="flex items-center gap-3 p-3 md:p-4">
              {/* Back button */}
              <button
                onClick={onBack}
                className="
                  flex-shrink-0 w-10 h-10 rounded-xl
                  bg-rui-grey-5 hover:bg-rui-grey-10
                  flex items-center justify-center
                  transition-colors duration-200
                "
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-rui-grey-60" />
              </button>

              {/* Trip route summary */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Origin */}
                  <span className="font-display font-semibold text-rui-black truncate">
                    {route?.origin.name || '...'}
                  </span>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-rui-accent flex-shrink-0" />

                  {/* Destination */}
                  <span className="font-display font-semibold text-rui-black truncate">
                    {route?.destination.name || '...'}
                  </span>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-1 text-body-3 text-rui-grey-50">
                  {/* Dates */}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateRange()}
                  </span>

                  {/* Travellers */}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {formatTravellerType()}
                  </span>
                </div>
              </div>

              {/* Desktop: Action buttons */}
              {isDesktop && (
                <div className="flex items-center gap-2">
                  {/* Plan Your Trip button */}
                  {onPlanTrip && (
                    <motion.button
                      onClick={onPlanTrip}
                      disabled={isPlanningLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="
                        flex-shrink-0 flex items-center gap-2
                        px-5 py-2.5 rounded-xl
                        bg-rui-grey-5 border border-rui-grey-20
                        text-rui-black
                        font-body font-semibold text-body-2
                        hover:bg-rui-grey-10 hover:border-rui-grey-30
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                      "
                    >
                      {isPlanningLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-rui-grey-40 border-t-rui-accent rounded-full"
                        />
                      ) : (
                        <Map className="w-4 h-4" />
                      )}
                      <span>Plan Your Trip</span>
                    </motion.button>
                  )}

                  {/* Generate Itinerary button */}
                  <motion.button
                    onClick={onProceed}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      flex-shrink-0 flex items-center gap-2
                      px-5 py-2.5 rounded-xl
                      bg-rui-accent text-white
                      font-body font-semibold text-body-2
                      shadow-lg shadow-rui-accent/25
                      hover:shadow-xl hover:shadow-rui-accent/30
                      transition-shadow duration-200
                    "
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Itinerary</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Selection summary bar */}
            <div
              className="
                flex items-center justify-between
                px-4 py-2.5
                bg-rui-accent/5 border-t border-rui-accent/10
              "
            >
              <div className="flex items-center gap-4 text-body-3">
                {/* Selected cities */}
                <span className="flex items-center gap-1.5 text-rui-accent font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedCount} {selectedCount === 1 ? 'city' : 'cities'} selected
                </span>

                {/* Night allocation */}
                <span className="text-rui-grey-50 hidden sm:inline">
                  {totalNights} {totalNights === 1 ? 'night' : 'nights'} allocated
                  {tripSummary && totalNights !== tripSummary.totalNights && (
                    <span className="text-warning ml-1">
                      ({tripSummary.totalNights - totalNights} remaining)
                    </span>
                  )}
                </span>

                {/* Add city button */}
                <button
                  onClick={onAddCity}
                  className="
                    flex items-center gap-1
                    px-2.5 py-1 rounded-full
                    bg-rui-accent/10 text-rui-accent
                    text-body-3 font-medium
                    hover:bg-rui-accent/20
                    transition-colors duration-200
                  "
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add stop</span>
                </button>
              </div>

              {/* Mobile: Compact proceed button */}
              {!isDesktop && (
                <button
                  onClick={onProceed}
                  className="
                    flex items-center gap-1.5
                    text-body-3 font-semibold text-rui-accent
                    hover:text-rui-accent/80 transition-colors
                  "
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
