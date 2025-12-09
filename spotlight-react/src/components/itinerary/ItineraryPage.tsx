/**
 * ItineraryPage
 *
 * A beautiful, immersive itinerary experience following the Wanderlust Editorial design.
 * Replaces the old 9-agent visualizer with elegant loading states and editorial day cards.
 *
 * Design: Warm cream palette, terracotta accents, Fraunces serif, rich micro-interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  Check,
  AlertCircle,
  Share2,
  Download,
  Compass,
  Coffee,
  Star,
  Utensils,
  Hotel,
  Camera,
  Sun,
  Moon,
  Route,
  Gem
} from 'lucide-react';
import { useItineraryGeneration } from '../../hooks/useItineraryGeneration';
import { useSpotlightStoreV2 } from '../../stores/spotlightStoreV2';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { EditorialDayCard } from './editorial/EditorialDayCard';

// Poetic loading messages that rotate
const loadingMessages = [
  { text: "Discovering hidden gems along your route...", icon: Compass },
  { text: "Finding the perfect morning espresso spots...", icon: Coffee },
  { text: "Curating authentic local experiences...", icon: Star },
  { text: "Selecting restaurants with character...", icon: Utensils },
  { text: "Choosing stays with soul...", icon: Hotel },
  { text: "Planning golden hour photo stops...", icon: Camera },
  { text: "Mapping the scenic detours...", icon: MapPin },
  { text: "Crafting your perfect mornings...", icon: Sun },
  { text: "Planning enchanting evenings...", icon: Moon },
];

type PageState = 'ready' | 'generating' | 'complete' | 'error';

export function ItineraryPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('ready');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  // Stores
  const { route } = useSpotlightStoreV2();
  const { tripSummary, route: discoveryRoute } = useDiscoveryStore();

  // Generation hook
  const {
    generate,
    itinerary,
    isGenerating,
    progress,
    error,
    reset
  } = useItineraryGeneration();

  // Rotate loading messages
  useEffect(() => {
    if (pageState === 'generating') {
      const interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [pageState]);

  // Timer for elapsed time
  useEffect(() => {
    if (pageState === 'generating' && startTimeRef.current) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pageState]);

  // Auto-start generation when page loads
  useEffect(() => {
    if (!hasStartedRef.current && route && !itinerary) {
      hasStartedRef.current = true;
      handleStartGeneration();
    }
  }, [route, itinerary]);

  // Handle generation state changes
  useEffect(() => {
    if (isGenerating) {
      setPageState('generating');
    } else if (error) {
      setPageState('error');
    } else if (itinerary) {
      setPageState('complete');
    }
  }, [isGenerating, error, itinerary]);

  // Start generation
  const handleStartGeneration = useCallback(async () => {
    if (!route) {
      console.error('❌ No route data available');
      return;
    }

    setPageState('generating');
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    // Helper to safely extract city name
    const getCityInfo = (cityData: string | { name: string; country?: string }) => {
      if (typeof cityData === 'string') {
        return { name: cityData, country: '' };
      }
      return { name: cityData.name, country: cityData.country || '' };
    };

    // Build routeData from spotlight route
    const routeData = {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      waypoints: (route.cities || []).map(city => {
        const cityInfo = getCityInfo(city.city);
        return {
          city: cityInfo.name,
          name: cityInfo.name,
          country: cityInfo.country,
          coordinates: city.coordinates ? [city.coordinates.lat, city.coordinates.lng] : [0, 0],
          nights: city.nights || 0
        };
      }),
      agent: route.agent,
      nightAllocations: route.nightAllocations || {}
    };

    const preferences = {
      travelStyle: route.agent,
      budget: route.budget,
      agentType: route.agent
    };

    console.log('🚀 Starting itinerary generation with:', { routeData, preferences });

    try {
      await generate(routeData, preferences);
    } catch (err) {
      console.error('Generation failed:', err);
      setPageState('error');
    }
  }, [route, generate]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate trip stats
  const totalNights = route?.cities?.reduce((sum, city) => sum + (city.nights || 0), 0) || tripSummary?.totalNights || 0;
  const totalCities = route?.cities?.length || 0;

  // Helper to safely get city name from string or CityObject
  const getCityName = (city: string | { name: string } | undefined | null): string => {
    if (!city) return '';
    if (typeof city === 'string') return city;
    return city.name || '';
  };

  const originName = getCityName(route?.origin) || discoveryRoute?.origin.name || '';
  const destName = getCityName(route?.destination) || discoveryRoute?.destination.name || '';

  const currentMessage = loadingMessages[currentMessageIndex];
  const MessageIcon = currentMessage.icon;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Decorative Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Warm gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(196, 88, 48, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(212, 168, 83, 0.04) 0%, transparent 50%)'
          }}
        />
        {/* Subtle grain texture */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-[#FFFBF5]/95 backdrop-blur-md border-b border-[#E8DFD3]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 text-[#8B7355] hover:text-[#2C2417] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Back to Discovery</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center shadow-lg shadow-[#C45830]/20">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif text-lg text-[#2C2417] font-semibold">
                  Your Itinerary
                </h1>
                <p className="text-xs text-[#8B7355]">
                  {originName} → {destName}
                </p>
              </div>
            </div>

            {/* Actions - show when complete */}
            {pageState === 'complete' && (
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full bg-[#F5F0E8] hover:bg-[#E8DFD3] transition-colors">
                  <Share2 className="w-4 h-4 text-[#8B7355]" />
                </button>
                <button className="p-2 rounded-full bg-[#F5F0E8] hover:bg-[#E8DFD3] transition-colors">
                  <Download className="w-4 h-4 text-[#8B7355]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Generating State */}
          {pageState === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[70vh] flex flex-col items-center justify-center"
            >
              {/* Main Loading Animation */}
              <div className="text-center mb-12">
                {/* Animated Orb */}
                <div className="relative w-40 h-40 mx-auto mb-10">
                  {/* Outer rotating ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[#C45830]/30"
                  />

                  {/* Middle pulsing ring */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-3 rounded-full bg-gradient-to-br from-[#C45830]/15 to-[#D4A853]/15"
                  />

                  {/* Inner rotating ring (opposite direction) */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-6 rounded-full border border-[#D4A853]/50"
                  />

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center shadow-2xl shadow-[#C45830]/30"
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>

                  {/* Floating particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [-15, 15, -15],
                        x: [Math.sin(i * 45) * 8, Math.sin(i * 45 + 180) * 8, Math.sin(i * 45) * 8],
                        opacity: [0.2, 0.6, 0.2],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 3 + i * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.25
                      }}
                      className="absolute w-2.5 h-2.5 rounded-full bg-[#D4A853]"
                      style={{
                        top: `${15 + Math.sin(i * 45) * 35}%`,
                        left: `${15 + Math.cos(i * 45) * 35}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-serif text-3xl text-[#2C2417] font-semibold mb-3"
                >
                  Crafting Your Journey
                </motion.h2>

                {/* Rotating Message */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-3 mb-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                      <MessageIcon className="w-6 h-6 text-[#C45830]" />
                    </div>
                    <p className="text-lg text-[#8B7355] max-w-md">
                      {currentMessage.text}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="w-full max-w-md mx-auto space-y-3">
                  <div className="relative h-3 bg-[#E8DFD3] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentComplete}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C45830] to-[#D4A853] rounded-full"
                    />
                    {/* Shimmer effect */}
                    <motion.div
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8B7355]">
                      {progress.currentAgent || 'Preparing your journey...'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8B7355]">
                        {formatTime(elapsedTime)}
                      </span>
                      <span className="font-semibold text-[#C45830]">
                        {progress.percentComplete}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-md bg-white rounded-3xl border border-[#E8DFD3] shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg text-[#2C2417] font-semibold">
                    {originName} → {destName}
                  </h3>
                  <div className="flex items-center gap-1 text-[#8B7355]">
                    <Route className="w-4 h-4" />
                    <span className="text-sm">{totalCities} stops</span>
                  </div>
                </div>

                <div className="flex items-center justify-around text-center">
                  <div>
                    <div className="text-3xl font-serif font-semibold text-[#2C2417]">
                      {totalCities}
                    </div>
                    <div className="text-xs text-[#8B7355] uppercase tracking-wide mt-1">
                      Cities
                    </div>
                  </div>

                  <div className="w-px h-12 bg-[#E8DFD3]" />

                  <div>
                    <div className="text-3xl font-serif font-semibold text-[#2C2417]">
                      {totalNights}
                    </div>
                    <div className="text-xs text-[#8B7355] uppercase tracking-wide mt-1">
                      Nights
                    </div>
                  </div>

                  <div className="w-px h-12 bg-[#E8DFD3]" />

                  <div>
                    <div className="text-3xl font-serif font-semibold text-[#2C2417]">
                      {totalNights + 1}
                    </div>
                    <div className="text-xs text-[#8B7355] uppercase tracking-wide mt-1">
                      Days
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-[#8B7355] mt-4 pt-4 border-t border-[#E8DFD3]">
                  This usually takes 1-2 minutes
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Complete State */}
          {pageState === 'complete' && itinerary && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Success Header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4A7C59] to-[#6B9F7A] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#4A7C59]/30"
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </motion.div>

                <h2 className="font-serif text-3xl text-[#2C2417] font-semibold mb-2">
                  Your Itinerary is Ready
                </h2>
                <p className="text-[#8B7355] max-w-md mx-auto">
                  {totalNights + 1} days of carefully curated experiences from {originName} to {destName}
                </p>
              </motion.div>

              {/* Trip Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-6 mb-10 p-4 bg-white rounded-2xl border border-[#E8DFD3]"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C45830]" />
                  <span className="text-sm text-[#2C2417] font-medium">{totalNights + 1} Days</span>
                </div>
                <div className="w-px h-5 bg-[#E8DFD3]" />
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C45830]" />
                  <span className="text-sm text-[#2C2417] font-medium">{totalCities} Cities</span>
                </div>
                <div className="w-px h-5 bg-[#E8DFD3]" />
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-[#D4A853]" />
                  <span className="text-sm text-[#2C2417] font-medium">
                    {itinerary.activities?.length || 0} Activities
                  </span>
                </div>
              </motion.div>

              {/* Day Cards */}
              <div className="space-y-6">
                {(() => {
                  const ds = itinerary.dayStructure as any;
                  const days = Array.isArray(ds) ? ds : (ds?.days || []);
                  return days;
                })().map((day: any, index: number) => (
                  <EditorialDayCard
                    key={day.dayNumber || index}
                    day={{
                      date: day.date,
                      city: day.city?.name || day.city || '',
                      dayNumber: day.dayNumber || index + 1,
                      activities: day.activities ? {
                        morning: day.activities.filter((a: any) => a.timeOfDay === 'morning'),
                        afternoon: day.activities.filter((a: any) => a.timeOfDay === 'afternoon'),
                        evening: day.activities.filter((a: any) => a.timeOfDay === 'evening'),
                      } : undefined,
                      restaurants: day.restaurants ? {
                        breakfast: day.restaurants.filter((r: any) => r.mealType === 'breakfast'),
                        lunch: day.restaurants.filter((r: any) => r.mealType === 'lunch'),
                        dinner: day.restaurants.filter((r: any) => r.mealType === 'dinner'),
                      } : undefined,
                      theme: day.theme,
                      themeSubtitle: day.themeSubtitle,
                      themeIcon: day.themeIcon,
                    }}
                    dayNumber={day.dayNumber || index + 1}
                    activities={day.activities || itinerary.activities?.filter((a: any) => a.dayNumber === (index + 1)) || []}
                    restaurants={day.restaurants || itinerary.restaurants?.filter((r: any) => r.dayNumber === (index + 1)) || []}
                    accommodation={day.accommodation || itinerary.accommodations?.[index]}
                    scenicStops={day.scenicStops || itinerary.scenicStops?.filter((s: any) => s.dayNumber === (index + 1)) || []}
                  />
                ))}
              </div>

              {/* Bottom CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-center"
              >
                <p className="text-[#8B7355] mb-4">
                  Ready to start your adventure?
                </p>
                <button
                  onClick={() => {
                    // Navigate to active trip or save
                    navigate(`/route/${route?.id || 'new'}?itinerary=${itinerary.id}`);
                  }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C45830] to-[#D4A853] text-white font-semibold rounded-full shadow-lg shadow-[#C45830]/30 hover:shadow-xl hover:shadow-[#C45830]/40 transition-all hover:scale-105"
                >
                  <Compass className="w-5 h-5" />
                  Start Trip
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Error State */}
          {pageState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-h-[60vh] flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>

              <h2 className="font-serif text-2xl text-[#2C2417] font-semibold mb-3">
                Something went wrong
              </h2>

              <p className="text-[#8B7355] max-w-md mb-8">
                {error || 'We couldn\'t generate your itinerary. This might be a temporary issue.'}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    reset();
                    setPageState('ready');
                    hasStartedRef.current = false;
                    handleStartGeneration();
                  }}
                  className="px-6 py-3 bg-[#C45830] text-white font-semibold rounded-full hover:bg-[#A84828] transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/discover')}
                  className="px-6 py-3 bg-[#F5F0E8] text-[#2C2417] font-semibold rounded-full hover:bg-[#E8DFD3] transition-colors"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Ready State (fallback) */}
          {pageState === 'ready' && !itinerary && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[60vh] flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <h2 className="font-serif text-2xl text-[#2C2417] font-semibold mb-3">
                Ready to Create Your Itinerary
              </h2>

              <p className="text-[#8B7355] max-w-md mb-8">
                We'll craft a personalized day-by-day plan with activities, restaurants, and hidden gems.
              </p>

              <button
                onClick={handleStartGeneration}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C45830] to-[#D4A853] text-white font-semibold rounded-full shadow-lg shadow-[#C45830]/30 hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Generate Itinerary
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default ItineraryPage;
