/**
 * Live Trip Panel - Trip in Progress Mode
 *
 * Phase 2: The main container for trip mode, integrating:
 * - TodayView with real API data
 * - Trip progress tracking
 * - Check-in functionality
 * - GPS location tracking
 * - Navigation integration
 *
 * Design: Wanderlust Editorial - "Your Living Travel Journal"
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import type { TimeSlot } from './TodayView';
import { TripProgress } from './TripProgress';
import { CheckinModal, type CheckinData } from './CheckinModal';
import { TripActivation } from './TripActivation';
import { QuickActions } from './QuickActions';
import { NearbySheet } from './NearbySheet';
import { PlanChangeAssistant } from './PlanChangeAssistant';
import { SmartAlertsContainer, useSmartAlertsMonitor, type SmartAlert, type MonitoredActivity } from './SmartAlerts';
import { PocketLocal } from './PocketLocal';
import { useTrip } from '../../hooks/useTrip';
import { useGPS } from '../../hooks/useGPS';
import { useWeather } from '../../hooks/useWeather';
import { fetchNearbyPlaces, navigateToPlace, type NearbyPlace } from '../../services/nearby';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

type TabType = 'today' | 'progress';

interface LiveTripPanelProps {
  routeId: string;
  itineraryId?: string;
  onClose?: () => void;
  className?: string;
  /** When true, automatically starts the trip without showing the "Ready to begin?" screen */
  autoStart?: boolean;
}

export function LiveTripPanel({
  routeId,
  itineraryId,
  onClose,
  className = '',
  autoStart = false,
}: LiveTripPanelProps) {
  // Trip state from API
  const {
    trip,
    todayData,
    progress,
    loading,
    todayLoading,
    error,
    isActive,
    isPaused,
    currentDay,
    totalDays,
    start,
    pause,
    resume,
    complete,
    checkin,
    updateLocation,
  } = useTrip();

  // GPS tracking
  const {
    location: gpsLocation,
    startTracking,
    stopTracking,
  } = useGPS();

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [showActivation, setShowActivation] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(false);
  const [autoStartAttempted, setAutoStartAttempted] = useState(false);
  const [autoStartError, setAutoStartError] = useState<string | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinActivity, setCheckinActivity] = useState<TimeSlot | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<TimeSlot | null>(null);

  // Weather & Alerts state
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [affectedActivity, setAffectedActivity] = useState<TimeSlot | null>(null);

  // Weather hook - track weather at current location
  const {
    current: currentWeather,
  } = useWeather(
    gpsLocation?.latitude,
    gpsLocation?.longitude,
    {
      refreshInterval: 10 * 60 * 1000, // 10 minutes
      enableAlerts: true,
      onDisruptiveWeather: () => {
        // Find outdoor activities that might be affected (scenic = outdoor)
        const outdoorActivities = todayData?.activities?.filter(
          a => a.type === 'scenic' || a.type === 'activity'
        );
        if (outdoorActivities?.length) {
          setAffectedActivity(outdoorActivities[0]);
          setShowPlanChange(true);
        }
      },
    }
  );

  // Convert TimeSlot activities to MonitoredActivity for alerts
  const monitoredActivities: MonitoredActivity[] = (todayData?.activities || []).map(slot => ({
    id: slot.id,
    name: slot.title,
    type: slot.type === 'restaurant' ? 'restaurant'
      : slot.type === 'hotel' ? 'hotel'
      : slot.type === 'scenic' ? 'outdoor'
      : 'indoor',
    startTime: new Date(`${new Date().toDateString()} ${slot.time}`),
    location: {
      name: slot.location || slot.title,
      lat: slot.coordinates?.lat || 0,
      lng: slot.coordinates?.lng || 0,
    },
    hasReservation: slot.type === 'restaurant', // Assume restaurants have reservations
    reservationPhone: slot.phone,
  }));

  // Smart alerts monitor
  useSmartAlertsMonitor({
    weather: currentWeather,
    activities: monitoredActivities,
    userLocation: gpsLocation ? { lat: gpsLocation.latitude, lng: gpsLocation.longitude } : undefined,
    onAlert: (alert) => {
      setAlerts(prev => [...prev, alert]);
    },
    onWeatherDisruption: (activity) => {
      const slot = todayData?.activities?.find(a => a.id === activity.id);
      if (slot) {
        setAffectedActivity(slot);
        setShowPlanChange(true);
      }
    },
  });

  // Dismiss alert
  const handleDismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  // Start tracking when trip is active
  useEffect(() => {
    if (isActive && gpsLocation) {
      // Update location in backend
      updateLocation({
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracy: gpsLocation.accuracy,
        city: gpsLocation.city,
        address: gpsLocation.address,
      });
    }
  }, [isActive, gpsLocation, updateLocation]);

  // Start trip
  const handleStartTrip = useCallback(async () => {
    setAutoStartError(null);
    try {
      const newTrip = await start(routeId, itineraryId);
      if (newTrip) {
        setShowActivation(false);
        setIsAutoStarting(false);
        setAutoStartAttempted(true);
        startTracking();
      } else {
        // Trip start failed - mark as attempted to prevent infinite loop
        setIsAutoStarting(false);
        setAutoStartAttempted(true);
        setAutoStartError(error || 'Failed to start trip. Please try again or re-login.');
        console.warn('[LiveTripPanel] Trip start returned null');
      }
    } catch (err) {
      console.error('[LiveTripPanel] Failed to start trip:', err);
      setIsAutoStarting(false);
      setAutoStartAttempted(true);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start trip';
      setAutoStartError(errorMessage);
    }
  }, [routeId, itineraryId, start, startTracking, error]);

  // Auto-start trip when autoStart prop is true
  useEffect(() => {
    // Only auto-start once - check autoStartAttempted to prevent infinite loop on failure
    if (autoStart && !loading && !trip && !isAutoStarting && !autoStartAttempted) {
      console.log('[LiveTripPanel] Auto-starting trip...');
      setIsAutoStarting(true);
      handleStartTrip();
    }
  }, [autoStart, loading, trip, isAutoStarting, autoStartAttempted, handleStartTrip]);

  // Pause trip
  const handlePause = useCallback(async () => {
    await pause();
    stopTracking();
  }, [pause, stopTracking]);

  // Resume trip
  const handleResume = useCallback(async () => {
    await resume();
    startTracking();
  }, [resume, startTracking]);

  // Complete trip
  const handleComplete = useCallback(async () => {
    await complete();
    stopTracking();
  }, [complete, stopTracking]);

  // Navigation handler
  const handleNavigate = useCallback((slot: TimeSlot) => {
    if (!slot.coordinates) return;

    const { lat, lng } = slot.coordinates;
    const destination = encodeURIComponent(slot.location || slot.title);

    // Detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&q=${destination}`);
    } else if (isAndroid) {
      window.open(`geo:${lat},${lng}?q=${lat},${lng}(${destination})`);
    } else {
      // Desktop - open Google Maps
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${destination}`
      );
    }
  }, []);

  // Call handler
  const handleCall = useCallback((slot: TimeSlot) => {
    if (slot.phone) {
      window.open(`tel:${slot.phone}`);
    }
  }, []);

  // Check-in handler
  const handleCheckinStart = useCallback((slot: TimeSlot) => {
    setCheckinActivity(slot);
    setShowCheckin(true);
  }, []);

  // Submit check-in
  const handleCheckinSubmit = useCallback(
    async (data: CheckinData) => {
      if (!checkinActivity) return;

      await checkin({
        activityId: checkinActivity.id,
        activityName: data.location.name,
        activityType: checkinActivity.type,
        locationName: data.location.name,
        coordinates: data.location.coordinates,
        photoUrls: data.photo ? [data.photo] : undefined,
        note: data.note,
        mood: data.mood,
        weather: data.weather,
      });

      setShowCheckin(false);
      setCheckinActivity(null);
    },
    [checkinActivity, checkin]
  );

  // Find nearby places
  const handleFindNearby = useCallback(async (category: string) => {
    if (!gpsLocation) return;

    setNearbyLoading(true);
    setShowNearby(true);

    try {
      const result = await fetchNearbyPlaces({
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        category: category === 'all' ? undefined : category,
        radius: 2000,
        limit: 15,
      });
      setNearbyPlaces(result.places);
    } catch (error) {
      console.error('[LiveTripPanel] Failed to fetch nearby places:', error);
      setNearbyPlaces([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [gpsLocation]);

  // Navigate to nearby place
  const handleNearbyNavigate = useCallback((place: { coordinates: { lat: number; lng: number }; name: string; id: string }) => {
    navigateToPlace({
      ...place,
      distance: '',
      distanceMeters: 0,
      walkingTime: 0,
      drivingTime: 0,
      category: '',
      rating: null,
      reviewCount: null,
      priceLevel: null,
      isOpen: null,
      closingTime: null,
      photo: null,
      tags: [],
      address: null,
      matchReason: null,
    });
    setShowNearby(false);
  }, []);

  // Get context for quick actions
  const getActivityContext = useCallback((): 'restaurant' | 'hotel' | 'driving' | 'walking' | 'attraction' | 'general' => {
    if (!currentActivity) return 'general';
    switch (currentActivity.type) {
      case 'restaurant': return 'restaurant';
      case 'hotel': return 'hotel';
      case 'scenic': return 'attraction';
      default: return 'general';
    }
  }, [currentActivity]);

  // Track current activity from today data
  useEffect(() => {
    if (todayData?.activities) {
      const current = todayData.activities.find(a => a.status === 'current');
      setCurrentActivity(current || null);
    }
  }, [todayData]);

  // Show activation screen if no active trip (only when NOT auto-starting)
  if (!loading && !trip && !autoStart && !isAutoStarting) {
    return (
      <div className={`h-full flex flex-col ${className}`} style={{ background: colors.cream }}>
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
            Trip Mode
          </h2>
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          )}
        </div>

        {/* Start Trip CTA */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
              boxShadow: `0 8px 30px ${colors.terracotta}30`,
            }}
          >
            <Play className="w-10 h-10 text-white ml-1" />
          </div>

          <h3
            className="text-2xl font-serif font-medium mb-2 text-center"
            style={{ color: colors.darkBrown }}
          >
            Ready to Begin?
          </h3>
          <p className="text-center mb-8 max-w-xs" style={{ color: colors.lightBrown }}>
            Start your trip to unlock real-time tracking, check-ins, and personalized guidance.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowActivation(true)}
            className="px-8 py-4 rounded-full flex items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              boxShadow: `0 6px 20px ${colors.sage}40`,
            }}
          >
            <span className="text-white font-medium text-lg">Start Your Adventure</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Activation modal */}
        <AnimatePresence>
          {showActivation && (
            <TripActivation
              isOpen={showActivation}
              onClose={() => setShowActivation(false)}
              onActivate={handleStartTrip}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Show preparing state when auto-starting OR error state when failed
  const combinedError = autoStartError || error;
  if (!trip && (autoStart || isAutoStarting || combinedError)) {
    const hasError = !!combinedError && !isAutoStarting;

    return (
      <div className={`h-full flex flex-col ${className}`} style={{ background: colors.cream }}>
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
            Trip Mode
          </h2>
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          )}
        </div>

        {hasError ? (
          /* Error State */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                background: `${colors.terracotta}15`,
                border: `2px solid ${colors.terracotta}30`,
              }}
            >
              <AlertCircle className="w-10 h-10" style={{ color: colors.terracotta }} />
            </div>

            <h3
              className="text-xl font-serif font-medium mb-2 text-center"
              style={{ color: colors.darkBrown }}
            >
              Unable to Start Trip
            </h3>
            <p className="text-center mb-6 max-w-xs text-sm" style={{ color: colors.lightBrown }}>
              {combinedError || 'Trip tracking is not available yet. Please try again later.'}
            </p>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setAutoStartAttempted(false); // Reset to allow retry
                  setAutoStartError(null);
                  setIsAutoStarting(true);
                  handleStartTrip();
                }}
                className="px-6 py-3 rounded-full flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                  boxShadow: `0 4px 12px ${colors.sage}30`,
                }}
              >
                <span className="text-white font-medium">Try Again</span>
              </motion.button>

              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-3 rounded-full"
                  style={{
                    background: colors.warmWhite,
                    border: `1px solid ${colors.border}`,
                    color: colors.mediumBrown,
                  }}
                >
                  Close
                </motion.button>
              )}
            </div>
          </div>
        ) : (
          /* Preparing Trip State - Elegant loading with compass animation */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative"
              style={{
                background: `linear-gradient(135deg, ${colors.golden}20 0%, ${colors.terracotta}15 100%)`,
                boxShadow: `0 0 60px ${colors.golden}30`,
              }}
            >
              {/* Rotating outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${colors.golden}40` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              {/* Compass icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Play
                  className="w-10 h-10"
                  style={{ color: colors.terracotta }}
                />
              </motion.div>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-serif font-medium mb-3 text-center"
              style={{ color: colors.darkBrown }}
            >
              Preparing Your Journey
            </motion.h3>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6 max-w-xs"
              style={{ color: colors.lightBrown }}
            >
              Setting up real-time tracking, loading your itinerary, and getting everything ready...
            </motion.p>

            {/* Animated progress dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors.golden }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${className}`}
        style={{ background: colors.cream }}
      >
        <div className="flex flex-col items-center">
          <Loader2
            className="w-10 h-10 animate-spin mb-4"
            style={{ color: colors.golden }}
          />
          <p style={{ color: colors.lightBrown }}>Loading your trip...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`h-full flex items-center justify-center ${className}`}
        style={{ background: colors.cream }}
      >
        <div className="flex flex-col items-center text-center p-8">
          <AlertCircle className="w-12 h-12 mb-4" style={{ color: colors.terracotta }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.darkBrown }}>
            Something went wrong
          </h3>
          <p className="mb-4" style={{ color: colors.lightBrown }}>
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full"
            style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`} style={{ background: colors.cream }}>
      {/* Header with tabs */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-2 border-b"
        style={{ borderColor: colors.border }}
      >
        {/* Trip status and controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: isActive
                  ? colors.sage
                  : isPaused
                  ? colors.golden
                  : colors.lightBrown,
                boxShadow: isActive ? `0 0 10px ${colors.sage}60` : 'none',
              }}
            />
            <div>
              <h2 className="font-serif font-medium" style={{ color: colors.darkBrown }}>
                Day {currentDay} of {totalDays}
              </h2>
              <p className="text-xs" style={{ color: colors.lightBrown }}>
                {isActive ? 'Trip in progress' : isPaused ? 'Trip paused' : 'Trip completed'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePause}
                className="px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Pause className="w-4 h-4" style={{ color: colors.mediumBrown }} />
                <span className="text-sm" style={{ color: colors.mediumBrown }}>
                  Pause
                </span>
              </motion.button>
            ) : isPaused ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResume}
                className="px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                }}
              >
                <Play className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Resume</span>
              </motion.button>
            ) : null}

            {isActive && currentDay >= totalDays && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                className="px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenLight} 100%)`,
                }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Complete</span>
              </motion.button>
            )}

            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              >
                <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['today', 'progress'] as const).map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? colors.warmWhite : 'transparent',
                color: activeTab === tab ? colors.darkBrown : colors.lightBrown,
                border: `1px solid ${activeTab === tab ? colors.border : 'transparent'}`,
              }}
            >
              {tab === 'today' ? "Today's Plan" : 'Trip Progress'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'today' ? (
            <motion.div
              key="today"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              {todayLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.golden }} />
                </div>
              ) : (
                <PocketLocal
                  activities={todayData?.activities || []}
                  dayNumber={currentDay}
                  totalDays={totalDays}
                  cityName={todayData?.city || trip?.origin_city || 'Your City'}
                  onNavigate={(activity) => {
                    // Navigate to the selected activity using Google Maps
                    if (activity.coordinates) {
                      const { lat, lng } = activity.coordinates;
                      const name = encodeURIComponent(activity.title);
                      // Open Google Maps with destination
                      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                      const url = isIOS
                        ? `maps://maps.google.com/maps?daddr=${lat},${lng}&q=${name}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
                      window.open(url, '_blank');
                    }
                  }}
                  onActivityComplete={(activityId) => {
                    console.log('[LiveTripPanel] Activity completed:', activityId);
                    // Could call checkin API here
                  }}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              {progress ? (
                <TripProgress
                  tripData={{
                    currentDay: progress.currentDay,
                    totalDays: progress.totalDays,
                    currentCityIndex: progress.currentCityIndex,
                    cities: progress.cities,
                    stats: progress.stats,
                    photos: progress.photos,
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.golden }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      {isActive && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          {/* GPS indicator */}
          {gpsLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-full flex items-center gap-2"
              style={{
                background: `${colors.sage}15`,
                border: `1px solid ${colors.sage}30`,
              }}
            >
              <MapPin className="w-3.5 h-3.5" style={{ color: colors.sage }} />
              <span className="text-xs" style={{ color: colors.sage }}>
                {gpsLocation.city || 'Tracking location...'}
              </span>
            </motion.div>
          )}

          {/* Quick Actions FAB */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickActions(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenLight} 100%)`,
              boxShadow: `0 6px 20px ${colors.golden}40`,
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      )}

      {/* Check-in modal */}
      <CheckinModal
        isOpen={showCheckin}
        onClose={() => {
          setShowCheckin(false);
          setCheckinActivity(null);
        }}
        onSubmit={handleCheckinSubmit}
        activityName={checkinActivity?.title || ''}
        activityType={checkinActivity?.type}
        coordinates={checkinActivity?.coordinates}
      />

      {/* Quick Actions Sheet */}
      <QuickActions
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        context={getActivityContext()}
        currentActivity={currentActivity ? {
          name: currentActivity.title,
          type: currentActivity.type,
          phone: currentActivity.phone,
          coordinates: currentActivity.coordinates,
        } : undefined}
        onNavigate={currentActivity?.coordinates ? () => handleNavigate(currentActivity) : undefined}
        onCall={currentActivity?.phone ? () => handleCall(currentActivity) : undefined}
        onCheckin={() => {
          setShowQuickActions(false);
          if (currentActivity) handleCheckinStart(currentActivity);
        }}
        onFindNearby={(category) => {
          setShowQuickActions(false);
          handleFindNearby(category);
        }}
      />

      {/* Nearby Places Sheet */}
      <NearbySheet
        isOpen={showNearby}
        onClose={() => setShowNearby(false)}
        places={nearbyPlaces.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          distance: p.distance,
          walkingTime: p.walkingTime,
          drivingTime: p.drivingTime,
          rating: p.rating ?? undefined,
          reviewCount: p.reviewCount ?? undefined,
          priceLevel: p.priceLevel ?? undefined,
          isOpen: p.isOpen ?? undefined,
          closingTime: p.closingTime ?? undefined,
          photo: p.photo ?? undefined,
          tags: p.tags,
          coordinates: p.coordinates,
        }))}
        onNavigate={handleNearbyNavigate}
        onCategoryChange={(category) => handleFindNearby(category)}
        isLoading={nearbyLoading}
      />

      {/* Smart Alerts Display */}
      {alerts.length > 0 && (
        <div className="absolute top-24 left-4 right-4 z-40">
          <SmartAlertsContainer
            alerts={alerts}
            onDismiss={handleDismissAlert}
            maxVisible={2}
          />
        </div>
      )}

      {/* Plan Change Assistant Modal */}
      {currentWeather && affectedActivity && (
        <PlanChangeAssistant
          isOpen={showPlanChange}
          onClose={() => {
            setShowPlanChange(false);
            setAffectedActivity(null);
          }}
          weather={currentWeather}
          affectedActivity={{
            id: affectedActivity.id,
            name: affectedActivity.title,
            type: 'outdoor',
            time: affectedActivity.time,
            location: affectedActivity.location || affectedActivity.title,
          }}
          alternatives={[
            {
              id: 'alt-museum',
              name: 'Local Museum',
              category: 'museum',
              distance: '0.8 km',
              rating: 4.6,
              matchReason: 'Highly rated indoor attraction nearby',
            },
            {
              id: 'alt-cafe',
              name: 'Cozy Corner Cafe',
              category: 'cafe',
              distance: '0.3 km',
              rating: 4.8,
              matchReason: 'Perfect for a warm drink while waiting out the rain',
            },
            {
              id: 'alt-gallery',
              name: 'Modern Art Gallery',
              category: 'gallery',
              distance: '1.2 km',
              rating: 4.4,
              matchReason: 'Popular cultural destination',
            },
          ]}
          onAcceptAlternative={(alt) => {
            // In production, this would update the itinerary
            console.log('Accepted alternative:', alt);
            setShowPlanChange(false);
            setAffectedActivity(null);
          }}
          onKeepOriginal={() => {
            setShowPlanChange(false);
            setAffectedActivity(null);
          }}
          onPostpone={() => {
            // In production, this would reschedule the activity
            setShowPlanChange(false);
            setAffectedActivity(null);
          }}
        />
      )}
    </div>
  );
}

export default LiveTripPanel;
