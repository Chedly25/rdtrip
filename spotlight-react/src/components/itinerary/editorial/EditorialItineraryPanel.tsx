/**
 * Editorial Itinerary Panel
 *
 * A beautiful slide-in panel that houses the entire itinerary experience
 * within the Spotlight view. Follows the Wanderlust Editorial design system.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Calendar,
  MapPin,
  ChevronRight,
  Sun,
  Moon,
  Utensils,
  Hotel,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { useItineraryGeneration } from '../../../hooks/useItineraryGeneration';
import { EditorialDayCard } from './EditorialDayCard';
import { EditorialLoadingScreen } from './EditorialLoadingScreen';

interface EditorialItineraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type PanelState = 'trigger' | 'generating' | 'complete' | 'error';

export const EditorialItineraryPanel = ({ isOpen, onClose }: EditorialItineraryPanelProps) => {
  const [panelState, setPanelState] = useState<PanelState>('trigger');
  const { route, getCityName } = useSpotlightStoreV2();

  const {
    generate,
    itinerary,
    isGenerating,
    progress,
    error,
    reset
  } = useItineraryGeneration();

  // Handle generation state changes
  useEffect(() => {
    if (isGenerating) {
      setPanelState('generating');
    } else if (error) {
      setPanelState('error');
    } else if (itinerary) {
      setPanelState('complete');
    }
  }, [isGenerating, error, itinerary]);

  // Reset when panel closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay before resetting to allow exit animation
      const timer = setTimeout(() => {
        setPanelState('trigger');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleStartGeneration = useCallback(async () => {
    if (!route) return;

    setPanelState('generating');

    // Build route data for generation
    const routeData = {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      waypoints: (route.cities || []).map(city => {
        const cityInfo = typeof city.city === 'string'
          ? { name: city.city, country: '' }
          : city.city;
        const coords = city.coordinates || { lat: 0, lng: 0 };

        return {
          city: cityInfo.name,
          name: cityInfo.name,
          country: cityInfo.country || '',
          coordinates: [coords.lat, coords.lng],
          nights: city.nights || 1
        };
      }),
      agent: route.agent || 'best-overall',
      nightAllocations: route.nightAllocations || {}
    };

    const preferences = {
      travelStyle: route.agent || 'best-overall',
      budget: route.budget || 'mid',
      agentType: route.agent || 'best-overall'
    };

    try {
      await generate(routeData, preferences);
    } catch (err) {
      console.error('Generation failed:', err);
      setPanelState('error');
    }
  }, [route, generate]);

  const handleRetry = useCallback(() => {
    reset();
    setPanelState('trigger');
  }, [reset]);

  // Calculate trip stats
  const totalNights = route?.cities?.reduce((sum, city) => sum + (city.nights || 0), 0) || 0;
  const totalCities = route?.cities?.length || 0;
  const originName = route?.origin ? getCityName(route.origin) : '';
  const destName = route?.destination ? getCityName(route.destination) : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#2C2417]/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#FFFBF5] shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b border-[#E8DFD3] bg-[#FFFBF5]/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-[#2C2417] font-semibold">
                      Your Itinerary
                    </h2>
                    <p className="text-sm text-[#8B7355]">
                      {originName} → {destName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-[#F5F0E8] hover:bg-[#E8DFD3] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[#2C2417]" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {panelState === 'trigger' && (
                  <TriggerContent
                    key="trigger"
                    totalNights={totalNights}
                    totalCities={totalCities}
                    originName={originName}
                    destName={destName}
                    onStart={handleStartGeneration}
                  />
                )}

                {panelState === 'generating' && (
                  <EditorialLoadingScreen
                    key="loading"
                    progress={progress}
                    totalCities={totalCities}
                    totalNights={totalNights}
                  />
                )}

                {panelState === 'complete' && itinerary && (
                  <ItineraryContent
                    key="complete"
                    itinerary={itinerary}
                  />
                )}

                {panelState === 'error' && (
                  <ErrorContent
                    key="error"
                    error={error}
                    onRetry={handleRetry}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Trigger Content - The initial "Generate" screen
const TriggerContent = ({
  totalNights,
  totalCities,
  originName,
  destName,
  onStart
}: {
  totalNights: number;
  totalCities: number;
  originName: string;
  destName: string;
  onStart: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
    className="p-6 space-y-6"
  >
    {/* Hero Section */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2C2417] to-[#4A3F2F] p-8 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C45830]/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4A853]/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#D4A853]" />
          <span className="text-sm font-medium text-[#D4A853]">AI-Powered Planning</span>
        </div>

        <h3 className="font-serif text-3xl font-semibold mb-3">
          Create Your Perfect Itinerary
        </h3>

        <p className="text-white/70 text-base leading-relaxed mb-6">
          Our AI will craft a detailed day-by-day plan with activities, restaurants,
          and accommodations tailored to your journey.
        </p>

        {/* Trip Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D4A853]" />
            <span className="text-sm">{totalCities} stops</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#D4A853]" />
            <span className="text-sm">{totalNights} nights</span>
          </div>
        </div>

        <button
          onClick={onStart}
          className="group w-full py-4 px-6 bg-[#C45830] hover:bg-[#B04726] rounded-2xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          Generate My Itinerary
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>

    {/* What You'll Get */}
    <div className="space-y-4">
      <h4 className="font-serif text-lg text-[#2C2417] font-semibold">
        What's Included
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Sun, label: 'Daily Activities', desc: 'Curated experiences' },
          { icon: Utensils, label: 'Restaurants', desc: 'Local favorites' },
          { icon: Hotel, label: 'Accommodations', desc: 'Handpicked stays' },
          { icon: Clock, label: 'Time Blocks', desc: 'Optimal scheduling' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="p-4 rounded-2xl bg-[#F5F0E8] border border-[#E8DFD3]"
          >
            <item.icon className="w-5 h-5 text-[#C45830] mb-2" />
            <div className="font-medium text-[#2C2417] text-sm">{item.label}</div>
            <div className="text-xs text-[#8B7355]">{item.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Journey Preview */}
    <div className="space-y-3">
      <h4 className="font-serif text-lg text-[#2C2417] font-semibold">
        Your Journey
      </h4>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E8DFD3] shadow-sm">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C45830]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#C45830]" />
          </div>
          <div>
            <div className="text-xs text-[#8B7355] uppercase tracking-wide">Start</div>
            <div className="font-medium text-[#2C2417]">{originName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#C45830] to-[#D4A853]" />
          <ChevronRight className="w-4 h-4 text-[#C45830]" />
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#D4A853] to-[#C45830]" />
        </div>

        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="text-right">
            <div className="text-xs text-[#8B7355] uppercase tracking-wide">End</div>
            <div className="font-medium text-[#2C2417]">{destName}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#D4A853]/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-[#D4A853]" />
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Itinerary Content - The final view with day cards
const ItineraryContent = ({ itinerary }: { itinerary: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
    className="p-6 space-y-6"
  >
    {/* Success Header */}
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#4A7C59]/10 to-[#4A7C59]/5 border border-[#4A7C59]/20">
      <div className="w-12 h-12 rounded-full bg-[#4A7C59] flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-serif text-lg text-[#2C2417] font-semibold">
          Your Itinerary is Ready!
        </h3>
        <p className="text-sm text-[#8B7355]">
          {itinerary.dayStructure?.length || 0} days of adventure await
        </p>
      </div>
    </div>

    {/* Day Cards */}
    <div className="space-y-4">
      {itinerary.dayStructure?.map((day: any, index: number) => (
        <EditorialDayCard
          key={day.date || index}
          day={day}
          dayNumber={index + 1}
          activities={itinerary.activities?.[day.city] || []}
          restaurants={itinerary.restaurants?.[day.city] || []}
        />
      ))}
    </div>
  </motion.div>
);

// Error Content
const ErrorContent = ({
  error,
  onRetry
}: {
  error: string | null;
  onRetry: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
    className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center"
  >
    <div className="w-16 h-16 rounded-full bg-[#B54A4A]/10 flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-[#B54A4A]" />
    </div>

    <h3 className="font-serif text-xl text-[#2C2417] font-semibold mb-2">
      Something went wrong
    </h3>

    <p className="text-[#8B7355] mb-6 max-w-sm">
      {error || 'We couldn\'t generate your itinerary. Please try again.'}
    </p>

    <button
      onClick={onRetry}
      className="px-6 py-3 bg-[#C45830] hover:bg-[#B04726] text-white rounded-xl font-medium transition-colors"
    >
      Try Again
    </button>
  </motion.div>
);

export default EditorialItineraryPanel;
