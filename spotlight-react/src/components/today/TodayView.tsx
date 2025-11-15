/**
 * TodayView - Mobile-optimized "Today" view for active trips
 *
 * Features:
 * - GPS-aware location tracking
 * - Current day progress visualization
 * - Context-aware quick actions
 * - Location-aware AI chat
 * - Real-time updates
 * - Mobile-first design
 */

import { motion } from 'framer-motion';
import { MapPin, Wifi, WifiOff, Loader2, Calendar, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGPS } from '../../hooks/useGPS';
import { useTripContext } from '../../hooks/useTripContext';
import { DayProgress } from './DayProgress';
import { QuickActions } from './QuickActions';
import { ModalInput } from '../agent/ModalInput';
import { ChatHistoryPanel } from '../agent/ChatHistoryPanel';
import { ProactiveNotifications } from '../notifications/ProactiveNotifications';

export function TodayView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('itinerary');
  const startDate = searchParams.get('startDate'); // ISO date when trip started

  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);

  // GPS tracking
  const {
    location,
    isTracking,
    error: gpsError,
    permissionState,
    startTracking
  } = useGPS({
    autoStart: true,
    enableHighAccuracy: true,
    trackingInterval: 30000 // Update every 30 seconds
  });

  // Trip context
  const {
    currentDay,
    totalDays,
    nextActivity,
    distanceToNext,
    timeBlock,
    progressPercent,
    daysCompleted,
    daysRemaining,
    isLoading,
    error: tripError,
    currentDayData,
    markActivityCompleted,
    skipActivity
  } = useTripContext({
    itineraryId: itineraryId || undefined,
    startDate: startDate || undefined,
    enableGPS: true
  });

  // Request GPS permission on mount if not granted
  useEffect(() => {
    if (permissionState === 'prompt') {
      const timer = setTimeout(() => {
        const confirmed = confirm('Enable location services to get directions and nearby recommendations?');
        if (confirmed) {
          startTracking();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [permissionState, startTracking]);

  // Send context to AI when location or day changes
  useEffect(() => {
    if (location && currentDay && nextActivity) {
      console.log('📍 Location context updated:', {
        city: location.city,
        day: currentDay,
        nextActivity: nextActivity.name
      });
    }
  }, [location, currentDay, nextActivity]);

  // Handle activity completion
  const handleMarkCompleted = (activity: any) => {
    setCompletedActivities(prev => new Set([...prev, activity.name]));
    markActivityCompleted(activity.name);
  };

  // Handle activity skip
  const handleSkipActivity = (activity: any) => {
    skipActivity(activity.name);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-gray-900 text-lg font-medium">Loading your trip...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (tripError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
            <p className="text-gray-600 mb-6">{tripError}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not on trip yet
  if (!currentDay) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Trip Not Started</h2>
          <p className="text-gray-600 mb-2">Your adventure hasn't begun yet!</p>
          <p className="text-sm text-gray-500 mb-6">
            Days until trip: {totalDays > 0 ? Math.abs(daysCompleted) : 'Unknown'}
          </p>
          <button
            onClick={() => navigate(`/?itinerary=${itineraryId}`)}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
          >
            View Full Itinerary
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-safe">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* GPS status */}
            <div className="flex items-center gap-2">
              {isTracking ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">GPS Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <WifiOff className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">GPS Off</span>
                </div>
              )}
            </div>
          </div>

          {/* Current location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {location?.city || currentDayData?.location || 'Unknown Location'}
              </h1>
              <p className="text-sm text-gray-600">
                Day {currentDay} of {totalDays} • {daysRemaining} days left
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* GPS Error Banner */}
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
          >
            <p className="text-sm text-yellow-800">{gpsError}</p>
            <button
              onClick={startTracking}
              className="mt-2 text-sm font-medium text-yellow-700 underline"
            >
              Enable GPS
            </button>
          </motion.div>
        )}

        {/* Proactive AI Notifications */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <ProactiveNotifications itineraryId={itineraryId} />
        </motion.div>

        {/* Quick Actions */}
        <QuickActions
          nextActivity={nextActivity}
          currentLocation={location}
          distanceToNext={distanceToNext}
          timeBlock={timeBlock}
          onMarkCompleted={handleMarkCompleted}
          onSkipActivity={handleSkipActivity}
        />

        {/* Day Progress */}
        {currentDayData && (
          <DayProgress
            dayNumber={currentDay}
            location={currentDayData.location}
            activities={currentDayData.activities}
            completedActivities={completedActivities}
            currentTimeBlock={timeBlock}
            progressPercent={progressPercent}
          />
        )}

        {/* AI Chat Toggle */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowChat(!showChat)}
          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-2xl p-4 shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">💬 Ask AI Assistant</span>
            <span className="text-sm opacity-90">
              {showChat ? 'Hide' : 'Show'} Chat
            </span>
          </div>
        </motion.button>

        {/* Contextual Chat */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Chat messages */}
            <div className="h-96 overflow-y-auto">
              <ChatHistoryPanel />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200">
              <ModalInput />
            </div>

            {/* Context info */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                ℹ️ AI knows you're in {location?.city || 'your current location'}, on Day {currentDay}, heading to {nextActivity?.name || 'your next activity'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
