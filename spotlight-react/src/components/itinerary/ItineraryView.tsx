import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Calendar, MapPin, Users, DollarSign, PlusCircle } from 'lucide-react';
import { DayCardV2 } from './DayCardV2';
import { BudgetSummary } from './BudgetSummary';
import { ChatSidebar } from '../agent/ChatSidebar';
import { ProactiveNotifications } from '../notifications/ProactiveNotifications';
import { PollCard } from '../collaboration/PollCard';
import { CreatePollModal } from '../collaboration/CreatePollModal';
import type { TripPoll } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ItineraryViewProps {
  itineraryId: string;
  routeData?: any; // Optional route context for back navigation
}

export function ItineraryView({ itineraryId, routeData }: ItineraryViewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Polling state
  const [polls, setPolls] = useState<TripPoll[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollsLoading, setPollsLoading] = useState(false);

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('rdtrip_user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      } catch (e) {
        console.warn('Failed to parse user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadItinerary();
  }, [itineraryId]);

  // Listen for itinerary updates from agent (replaceActivity, addActivity, etc.)
  useEffect(() => {
    const handleItineraryUpdate = () => {
      console.log('🔄 [ItineraryView] Received itinerary_updated event, refreshing silently...');
      // Use silent refresh to avoid showing loading spinner
      silentRefreshItinerary();
    };

    window.addEventListener('itinerary_updated', handleItineraryUpdate);
    return () => window.removeEventListener('itinerary_updated', handleItineraryUpdate);
  }, [itineraryId]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 Loading itinerary:', itineraryId);
      const response = await fetch(`/api/itinerary/${itineraryId}`);

      if (!response.ok) {
        throw new Error('Failed to load itinerary');
      }

      const data = await response.json();
      console.log('✅ Itinerary loaded:', data);
      setItinerary(data);
    } catch (err) {
      console.error('❌ Error loading itinerary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh - updates data without showing loading spinner
  const silentRefreshItinerary = async () => {
    try {
      console.log('🔄 Silently refreshing itinerary:', itineraryId);
      const response = await fetch(`/api/itinerary/${itineraryId}`);

      if (!response.ok) {
        console.warn('⚠️ Silent refresh failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('✅ Itinerary silently updated');
      setItinerary(data); // Update data without touching loading state
    } catch (err) {
      console.error('❌ Silent refresh error:', err);
      // Don't set error state - just log it
    }
  };

  // Load polls for this route
  const loadPolls = async () => {
    if (!itinerary?.routeId) return;

    try {
      setPollsLoading(true);
      const response = await fetch(`/api/routes/${itinerary.routeId}/polls?status=active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPolls(data.polls || []);
      }
    } catch (err) {
      console.error('Error loading polls:', err);
    } finally {
      setPollsLoading(false);
    }
  };

  // Load polls when itinerary loads
  useEffect(() => {
    if (itinerary?.routeId) {
      loadPolls();
    }
  }, [itinerary?.routeId]);

  // Handle poll created
  const handlePollCreated = (newPoll: TripPoll) => {
    setPolls(prev => [newPoll, ...prev]);
  };

  // Handle poll closed
  const handlePollClosed = (pollId: string) => {
    setPolls(prev => prev.filter(p => p.id !== pollId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-900 text-lg">Loading your itinerary...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <p className="text-red-600 text-lg mb-4">{error || 'Itinerary not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const { dayStructure, activities, restaurants, accommodations, scenicStops, practicalInfo, weather, events, budget } = itinerary;

  // dayStructure can be EITHER an array OR an object with .days property
  const daysArray = Array.isArray(dayStructure) ? dayStructure : (Array.isArray(dayStructure?.days) ? dayStructure.days : []);

  // Extract city information for TripDurationPanel with SAFE array validation
  const cities = daysArray.map((day: any) => ({
    name: day.location,
    nights: day.overnight ? 1 : 0,
    country: '' // TODO: Extract from route data if available
  }));

  // Group data by day with SAFE array operations - handles NESTED structure
  const getDayData = (dayNumber: number) => {
    // Activities are nested: [{day: 1, activities: [...]}, ...]
    const dayActivitiesObj = Array.isArray(activities) ? activities.find((a: any) => a.day === dayNumber) : null;
    const dayActivities = dayActivitiesObj?.activities && Array.isArray(dayActivitiesObj.activities) ? dayActivitiesObj.activities : [];

    // Restaurants are nested: [{day: 1, meals: {breakfast: {}, lunch: {}, dinner: {}}}, ...]
    const dayRestaurantsObj = Array.isArray(restaurants) ? restaurants.find((r: any) => r.day === dayNumber) : null;
    const dayRestaurants = [];
    if (dayRestaurantsObj?.meals) {
      if (dayRestaurantsObj.meals.breakfast) dayRestaurants.push(dayRestaurantsObj.meals.breakfast);
      if (dayRestaurantsObj.meals.lunch) dayRestaurants.push(dayRestaurantsObj.meals.lunch);
      if (dayRestaurantsObj.meals.dinner) dayRestaurants.push(dayRestaurantsObj.meals.dinner);
    }

    const dayAccommodation = Array.isArray(accommodations) ? accommodations.find((a: any) => a.day === dayNumber) : undefined;
    const dayScenicStops = Array.isArray(scenicStops) ? scenicStops.filter((s: any) => s.day === dayNumber) : [];
    const dayPracticalInfo = Array.isArray(practicalInfo) ? practicalInfo.find((p: any) => p.day === dayNumber) : undefined;
    const dayWeather = Array.isArray(weather) ? weather.find((w: any) => w.day === dayNumber) : undefined;
    const dayEvents = Array.isArray(events) ? events.filter((e: any) => e.day === dayNumber) : [];

    return {
      activities: dayActivities,
      restaurants: dayRestaurants,
      accommodation: dayAccommodation,
      scenicStops: dayScenicStops,
      practicalInfo: dayPracticalInfo,
      weather: dayWeather,
      events: dayEvents
    };
  };

  const totalDays = daysArray.length;
  const totalNights = cities.reduce((sum: number, city: any) => sum + city.nights, 0);

  // Calculate TOTAL counts (activities/restaurants are nested by day)
  const totalActivities = Array.isArray(activities)
    ? activities.reduce((sum, dayObj) => sum + (Array.isArray(dayObj?.activities) ? dayObj.activities.length : 0), 0)
    : 0;
  const totalRestaurants = Array.isArray(restaurants)
    ? restaurants.reduce((sum, dayObj) => {
        const meals = dayObj?.meals;
        let count = 0;
        if (meals?.breakfast) count++;
        if (meals?.lunch) count++;
        if (meals?.dinner) count++;
        return sum + count;
      }, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full Width */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => routeData ? navigate(-1) : navigate('/')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Your Detailed Itinerary
                </h1>
                <p className="text-sm text-gray-600">
                  {totalDays} {totalDays === 1 ? 'day' : 'days'} • {totalNights} {totalNights === 1 ? 'night' : 'nights'}
                </p>
              </div>
            </div>

            {/* Right: Quick stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">{totalActivities} activities</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-gray-700">{totalRestaurants} restaurants</span>
              </div>
              {budget && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">€{budget.estimatedTotal || 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Responsive Split Layout */}
      <div className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto">
        {/* Left: Itinerary Content - Full width on mobile, 65% on desktop */}
        <div className="flex-1 px-4 md:px-6 py-6 md:py-8 overflow-y-auto">
          <div className="space-y-6 md:space-y-8">
            {/* Budget Summary */}
            {budget && (
              <BudgetSummary budget={budget} />
            )}

            {/* Proactive AI Notifications */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <ProactiveNotifications itineraryId={itineraryId} />
            </div>

            {/* Polling Section */}
            {itinerary?.routeId && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Group Decisions</h3>
                    <p className="text-sm text-gray-600">Vote on activities, restaurants, and more</p>
                  </div>
                  <button
                    onClick={() => setShowCreatePoll(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Poll
                  </button>
                </div>

                {/* Polls List */}
                {pollsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-gray-600 mt-2">Loading polls...</p>
                  </div>
                ) : polls.length > 0 ? (
                  <div className="space-y-4">
                    {polls.map(poll => (
                      <PollCard
                        key={poll.id}
                        poll={poll}
                        routeId={itinerary.routeId}
                        currentUserId={currentUserId || undefined}
                        onVote={() => loadPolls()}
                        onClose={handlePollClosed}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No active polls yet. Create one to get group decisions!</p>
                  </div>
                )}
              </div>
            )}

            {/* Day Cards */}
            <div className="space-y-6">
              {daysArray.map((day: any) => {
                const dayData = getDayData(day.day);
                return (
                  <DayCardV2
                    key={day.day}
                    day={day}
                    activities={dayData.activities}
                    restaurants={dayData.restaurants}
                    accommodation={dayData.accommodation}
                    scenicStops={dayData.scenicStops}
                    practicalInfo={dayData.practicalInfo}
                    weather={dayData.weather}
                    events={dayData.events}
                    agentType="best-overall" // TODO: Get from route data if available
                    density="compact"
                    routeId={itinerary.routeId}
                    currentUserId={currentUserId || undefined}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {daysArray.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No itinerary data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Assistant Sidebar - Bottom on mobile, 35% sidebar on desktop */}
        <div className="w-full lg:w-[35%] lg:min-w-[350px] lg:max-w-[500px]">
          <ChatSidebar />
        </div>
      </div>

      {/* Create Poll Modal */}
      {showCreatePoll && itinerary?.routeId && (
        <CreatePollModal
          routeId={itinerary.routeId}
          onClose={() => setShowCreatePoll(false)}
          onPollCreated={handlePollCreated}
        />
      )}
    </div>
  );
}
