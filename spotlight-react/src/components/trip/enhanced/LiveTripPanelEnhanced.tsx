/**
 * LiveTripPanelEnhanced - Your Living Travel Companion
 *
 * The main orchestrator that brings together all enhanced trip components
 * into a cohesive, immersive experience. This replaces the boring checklist
 * with a dynamic, story-driven journey.
 *
 * Design Direction: "Wanderlust Field Notes"
 * - Time-aware theming that shifts throughout the day
 * - Full-bleed hero moments with parallax
 * - Serendipity discoveries nearby
 * - Smart contextual hints
 * - Evolving trip narrative
 *
 * Typography: Playfair Display (headers), Lora (narrative)
 * Motion: Spring animations, staggered reveals, parallax
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Compass,
  Calendar,
  ChevronDown,
  Pause,
  Play,
  X,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { TimeThemeProvider, useTimeTheme } from '../hooks/useTimeOfDay';
import { NowHeroCard } from './NowHeroCard';
import { SerendipityCarousel } from './SerendipityCarousel';
import { SmartTimeHint } from './SmartTimeHint';
import { MomentCapture } from './MomentCapture';
import { TripStorySnippet } from './TripStorySnippet';
import { WeatherAwareCard } from './WeatherAwareCard';
import tripCompanionApi from '../services/tripCompanion';
import type {
  SerendipityCard,
  SmartHint,
  TripMoment,
  TripNarrative,
  WeatherAlternative,
} from '../services/tripCompanion';

// Import type from TodayView for activity structure
import type { TimeSlot } from '../TodayView';

// Ambient background that shifts with time of day
const AmbientBackground: React.FC = () => {
  const { theme, timeOfDay, isNight } = useTimeTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms]"
        style={{ background: theme.background }}
      />

      {/* Atmospheric orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{
          background: `${theme.primary}15`,
          top: '-200px',
          right: '-100px',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{
          background: `${theme.secondary}10`,
          bottom: '-100px',
          left: '-50px',
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Night stars effect */}
      {isNight && (
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Dawn/dusk sun rays */}
      {(timeOfDay === 'dawn' || timeOfDay === 'evening') && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[300px]"
          style={{
            background: `radial-gradient(ellipse at center bottom, ${theme.accent}30 0%, transparent 60%)`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      )}
    </div>
  );
};

// Floating time indicator
const TimeIndicator: React.FC<{ dayNumber: number; totalDays: number }> = ({
  dayNumber,
  totalDays,
}) => {
  const { theme, timeDescription, timeOfDay } = useTimeTheme();

  const TimeIcon = timeOfDay === 'night' ? Moon : Sun;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl"
      style={{
        background: `${theme.cardBg}E6`,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.shadow,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `${theme.primary}20` }}
      >
        <TimeIcon className="w-4 h-4" style={{ color: theme.primary }} />
      </div>

      <div className="flex flex-col">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: theme.textMuted }}
        >
          Day {dayNumber} of {totalDays}
        </span>
        <span
          className="text-sm font-semibold capitalize"
          style={{ color: theme.textPrimary }}
        >
          {timeDescription}
        </span>
      </div>
    </motion.div>
  );
};

// Upcoming activities preview
const UpcomingPreview: React.FC<{
  activities: TimeSlot[];
  onActivityClick: (activity: TimeSlot) => void;
}> = ({ activities, onActivityClick }) => {
  const { theme, isNight } = useTimeTheme();
  const upcoming = activities.filter(
    (a) => a.status === 'upcoming' || a.status === undefined
  ).slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4" style={{ color: theme.textMuted }} />
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: theme.textMuted }}
        >
          Coming Up
        </h3>
      </div>

      <div className="space-y-2">
        {upcoming.map((activity, index) => (
          <motion.button
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onActivityClick(activity)}
            className="w-full p-3 rounded-xl flex items-center gap-3 text-left"
            style={{
              background: isNight ? 'rgba(42, 36, 56, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              border: `1px solid ${theme.cardBorder}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${theme.primary}15` }}
            >
              <span className="text-xs font-bold" style={{ color: theme.primary }}>
                {activity.time.split(':')[0]}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="font-medium text-sm truncate"
                style={{ color: theme.textPrimary }}
              >
                {activity.title}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: theme.textMuted }}
              >
                {activity.location || activity.time}
              </p>
            </div>

            <ChevronDown
              className="w-4 h-4 -rotate-90 flex-shrink-0"
              style={{ color: theme.textMuted }}
            />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Main props interface
interface LiveTripPanelEnhancedProps {
  tripId: string;
  routeId: string;
  activities: TimeSlot[];
  dayNumber: number;
  totalDays: number;
  cityName: string;
  isActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onClose?: () => void;
  onNavigate?: (activity: TimeSlot) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

// Inner component (uses theme context)
const LiveTripPanelInner: React.FC<LiveTripPanelEnhancedProps> = ({
  tripId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  routeId: _routeId,
  activities,
  dayNumber,
  totalDays,
  cityName,
  isActive,
  isPaused,
  onPause,
  onResume,
  onClose,
  onNavigate,
  userLocation,
  className = '',
}) => {
  const { theme } = useTimeTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });

  // State
  const [currentActivity, setCurrentActivity] = useState<TimeSlot | null>(null);
  const [discoveries, setDiscoveries] = useState<SerendipityCard[]>([]);
  const [smartHints, setSmartHints] = useState<SmartHint[]>([]);
  const [moments, setMoments] = useState<TripMoment[]>([]);
  const [narrative, setNarrative] = useState<TripNarrative | null>(null);
  const [isLoadingDiscoveries, setIsLoadingDiscoveries] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [showMomentCapture, setShowMomentCapture] = useState(false);
  const [activityForMoment, setActivityForMoment] = useState<TimeSlot | null>(null);
  const [weatherAlternatives, setWeatherAlternatives] = useState<WeatherAlternative[]>([]);
  const [weatherCondition, setWeatherCondition] = useState<'rain' | 'heavy_rain' | 'snow' | 'wind' | 'storm' | 'cloudy' | null>(null);
  const [showWeatherCard, setShowWeatherCard] = useState(false);

  // Header parallax
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 20]);

  // Find current activity
  useEffect(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Find activity that's current based on time
    const current = activities.find((a) => {
      if (a.status === 'current') return true;
      // Parse time and check if we're within the activity window
      const [hours, minutes] = a.time.split(':').map(Number);
      const activityTime = hours * 60 + minutes;
      const nextActivity = activities[activities.indexOf(a) + 1];
      const nextTime = nextActivity
        ? parseInt(nextActivity.time.split(':')[0]) * 60 +
          parseInt(nextActivity.time.split(':')[1])
        : activityTime + 60; // Default 1 hour window

      return currentTime >= activityTime && currentTime < nextTime;
    });

    setCurrentActivity(current || activities.find((a) => a.status === 'upcoming') || null);
  }, [activities]);

  // Fetch serendipity discoveries
  const fetchDiscoveries = useCallback(async () => {
    if (!userLocation || !tripId) return;

    setIsLoadingDiscoveries(true);
    try {
      const result = await tripCompanionApi.getSerendipity({
        tripId,
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 500,
      });
      setDiscoveries(result.discoveries || []);
    } catch (error) {
      console.error('[LiveTripPanelEnhanced] Failed to fetch discoveries:', error);
    } finally {
      setIsLoadingDiscoveries(false);
    }
  }, [tripId, userLocation]);

  // Fetch smart hints for current activity
  const fetchSmartHints = useCallback(async () => {
    if (!currentActivity || !tripId) return;

    try {
      const result = await tripCompanionApi.getSmartHints({
        tripId,
        activityId: currentActivity.id,
      });
      setSmartHints(result.hints || []);
    } catch (error) {
      console.error('[LiveTripPanelEnhanced] Failed to fetch hints:', error);
    }
  }, [tripId, currentActivity]);

  // Fetch moments and narrative
  const fetchMomentsAndNarrative = useCallback(async () => {
    if (!tripId) return;

    try {
      const [momentsResult, narrativeResult] = await Promise.all([
        tripCompanionApi.getMoments(tripId, dayNumber),
        tripCompanionApi.getNarrative(tripId, dayNumber),
      ]);
      setMoments(momentsResult.moments || []);
      setNarrative(narrativeResult.narrative);
    } catch (error) {
      console.error('[LiveTripPanelEnhanced] Failed to fetch moments/narrative:', error);
    }
  }, [tripId, dayNumber]);

  // Fetch weather alternatives when weather hint appears
  const fetchWeatherAlternatives = useCallback(async (condition: string) => {
    if (!currentActivity || !tripId) return;

    try {
      const result = await tripCompanionApi.getWeatherAlternatives(
        tripId,
        currentActivity.id,
        condition
      );
      if (result.alternatives && result.alternatives.length > 0) {
        setWeatherAlternatives(result.alternatives);
        setWeatherCondition(condition as typeof weatherCondition);
        setShowWeatherCard(true);
      }
    } catch (error) {
      console.error('[LiveTripPanelEnhanced] Failed to fetch weather alternatives:', error);
    }
  }, [tripId, currentActivity]);

  // Handle weather alternative selection
  const handleSelectWeatherAlternative = useCallback((alternative: WeatherAlternative) => {
    // Navigate to the alternative or add to itinerary
    if (onNavigate && alternative) {
      const syntheticSlot: TimeSlot = {
        id: alternative.id,
        time: 'Now',
        title: alternative.name,
        type: (alternative.type === 'transport' ? 'transit' : alternative.type) as 'restaurant' | 'hotel' | 'scenic' | 'activity' | 'transit' | 'free',
        status: 'upcoming',
        location: alternative.address,
        photo: alternative.photo,
      };
      onNavigate(syntheticSlot);
    }
    setShowWeatherCard(false);
    setWeatherAlternatives([]);
  }, [onNavigate]);

  // Initial data fetch
  useEffect(() => {
    fetchDiscoveries();
    fetchMomentsAndNarrative();
  }, [fetchDiscoveries, fetchMomentsAndNarrative]);

  // Fetch hints when current activity changes
  useEffect(() => {
    fetchSmartHints();
  }, [fetchSmartHints]);

  // Handle check-in / moment capture
  const handleCheckin = useCallback((activity: TimeSlot) => {
    setActivityForMoment(activity);
    setShowMomentCapture(true);
  }, []);

  // Submit moment
  const handleMomentCapture = useCallback(
    async (data: {
      activityName: string;
      momentType: 'highlight' | 'memory' | 'completed' | 'skipped';
      rating?: number;
      note?: string;
      photo?: string;
      dayNumber: number;
      skipReason?: string;
    }) => {
      if (!tripId || !activityForMoment) return;

      try {
        await tripCompanionApi.recordMoment(tripId, {
          activityId: activityForMoment.id,
          activityName: data.activityName,
          momentType: data.momentType,
          note: data.note,
          photo: data.photo,
          rating: data.rating,
          coordinates: userLocation,
          dayNumber: data.dayNumber,
        });

        // Refresh moments and narrative
        setIsGeneratingNarrative(true);
        await fetchMomentsAndNarrative();
        setIsGeneratingNarrative(false);

        setShowMomentCapture(false);
        setActivityForMoment(null);
      } catch (error) {
        console.error('[LiveTripPanelEnhanced] Failed to record moment:', error);
      }
    },
    [tripId, activityForMoment, userLocation, dayNumber, fetchMomentsAndNarrative]
  );

  // Handle serendipity card click
  const handleDiscoveryClick = useCallback((card: SerendipityCard) => {
    // Navigate to the discovery or show details
    if (card.coordinates && onNavigate) {
      // Create a synthetic TimeSlot for navigation
      const syntheticSlot: TimeSlot = {
        id: card.id,
        time: card.bestTime || 'Now',
        title: card.title,
        type: 'scenic',
        status: 'upcoming',
        location: card.title,
        coordinates: card.coordinates,
      };
      onNavigate(syntheticSlot);
    }
  }, [onNavigate]);

  // Handle hint action
  const handleHintAction = useCallback((hint: SmartHint) => {
    if (hint.type === 'departure' && currentActivity && onNavigate) {
      onNavigate(currentActivity);
    } else if (hint.type === 'weather' && currentActivity) {
      // Fetch weather alternatives when a weather hint action is triggered
      fetchWeatherAlternatives('rain');
    }
  }, [currentActivity, onNavigate, fetchWeatherAlternatives]);

  return (
    <div
      className={`relative h-full flex flex-col overflow-hidden ${className}`}
      style={{ background: theme.background }}
    >
      {/* Ambient background */}
      <AmbientBackground />

      {/* Sticky header with blur */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40 px-4 py-3"
        style={{
          opacity: headerOpacity,
          backdropFilter: `blur(${headerBlur}px)`,
          background: `${theme.cardBg}90`,
          borderBottom: `1px solid ${theme.cardBorder}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5" style={{ color: theme.primary }} />
            <span className="font-semibold" style={{ color: theme.textPrimary }}>
              {cityName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isActive && !isPaused && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPause}
                className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{
                  background: `${theme.primary}15`,
                  color: theme.primary,
                }}
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Pause</span>
              </motion.button>
            )}

            {isPaused && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onResume}
                className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{
                  background: theme.primary,
                  color: 'white',
                }}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Resume</span>
              </motion.button>
            )}

            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `${theme.textMuted}15`,
                }}
              >
                <X className="w-4 h-4" style={{ color: theme.textMuted }} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Top spacing for hero */}
        <div className="h-4" />

        {/* Time indicator */}
        <div className="px-4 mb-4 flex justify-center">
          <TimeIndicator dayNumber={dayNumber} totalDays={totalDays} />
        </div>

        {/* Smart Hints */}
        {smartHints.length > 0 && (
          <SmartTimeHint
            hints={smartHints}
            onAction={handleHintAction}
            onDismiss={(hint) =>
              setSmartHints((prev) => prev.filter((h) => h !== hint))
            }
          />
        )}

        {/* Weather Alternatives Card */}
        {showWeatherCard && currentActivity && weatherCondition && (
          <WeatherAwareCard
            condition={weatherCondition}
            originalActivity={{
              id: currentActivity.id,
              name: currentActivity.title,
              type: currentActivity.type,
            }}
            alternatives={weatherAlternatives}
            onSelectAlternative={handleSelectWeatherAlternative}
            onDismiss={() => {
              setShowWeatherCard(false);
              setWeatherAlternatives([]);
            }}
            onKeepOriginal={() => {
              setShowWeatherCard(false);
              setWeatherAlternatives([]);
            }}
          />
        )}

        {/* Now Hero Card - Current Activity */}
        {currentActivity && (
          <NowHeroCard
            activity={{
              id: currentActivity.id,
              name: currentActivity.title,
              type: currentActivity.type as 'restaurant' | 'hotel' | 'scenic' | 'activity' | 'transport',
              duration: typeof currentActivity.duration === 'number' ? `${currentActivity.duration} min` : '60 min',
              address: currentActivity.location || currentActivity.title,
              photo: currentActivity.photo,
              whyYoureHere: currentActivity.description,
              coordinates: currentActivity.coordinates,
            }}
            onNavigate={() => currentActivity && onNavigate?.(currentActivity)}
            onCaptureMoment={() => handleCheckin(currentActivity)}
          />
        )}

        {/* Serendipity Carousel */}
        <SerendipityCarousel
          discoveries={discoveries}
          loading={isLoadingDiscoveries}
          onCardClick={handleDiscoveryClick}
          onShuffle={fetchDiscoveries}
        />

        {/* Trip Story Snippet */}
        <TripStorySnippet
          narrative={narrative}
          dayNumber={dayNumber}
          momentCount={moments.length}
          isGenerating={isGeneratingNarrative}
        />

        {/* Upcoming Activities */}
        <UpcomingPreview
          activities={activities}
          onActivityClick={(activity) => handleCheckin(activity)}
        />

        {/* Bottom padding for safe area */}
        <div className="h-24" />
      </div>

      {/* Floating refresh button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          fetchDiscoveries();
          fetchSmartHints();
          fetchMomentsAndNarrative();
        }}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center z-30"
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          boxShadow: `0 4px 20px ${theme.primary}40`,
        }}
      >
        <RefreshCw className="w-5 h-5 text-white" />
      </motion.button>

      {/* Moment Capture Modal */}
      <AnimatePresence>
        {showMomentCapture && activityForMoment && (
          <MomentCapture
            isOpen={showMomentCapture}
            onClose={() => {
              setShowMomentCapture(false);
              setActivityForMoment(null);
            }}
            activity={{
              id: activityForMoment.id,
              name: activityForMoment.title,
              type: activityForMoment.type,
              photo: activityForMoment.photo,
            }}
            dayNumber={dayNumber}
            onCapture={handleMomentCapture}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Main export - wraps with theme provider
export const LiveTripPanelEnhanced: React.FC<LiveTripPanelEnhancedProps> = (props) => {
  return (
    <TimeThemeProvider>
      <LiveTripPanelInner {...props} />
    </TimeThemeProvider>
  );
};

export default LiveTripPanelEnhanced;
