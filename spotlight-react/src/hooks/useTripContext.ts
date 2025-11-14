/**
 * useTripContext - Smart trip state management with location awareness
 *
 * Features:
 * - Determines current day based on date and itinerary
 * - Finds next activity based on time of day
 * - Calculates progress through the day
 * - Distance to next activity/destination
 * - Context-aware recommendations
 */

import { useState, useEffect, useMemo } from 'react';
import { useGPS } from './useGPS';

interface Activity {
  name: string;
  block?: 'morning' | 'afternoon' | 'evening';
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  [key: string]: any;
}

interface DayData {
  day: number;
  location: string;
  overnight: boolean;
  activities: Activity[];
  restaurants: any[];
  accommodation?: any;
  date?: string; // ISO date for this day
}

interface TripProgress {
  currentDay: number | null;
  totalDays: number;
  nextActivity: Activity | null;
  upcomingActivities: Activity[];
  distanceToNext: number | null; // meters
  timeBlock: 'morning' | 'afternoon' | 'evening';
  progressPercent: number; // 0-100
  daysCompleted: number;
  daysRemaining: number;
}

interface UseTripContextOptions {
  itineraryId?: string;
  startDate?: string; // ISO date when trip starts
  enableGPS?: boolean;
}

interface UseTripContextReturn extends TripProgress {
  isLoading: boolean;
  error: string | null;
  itinerary: any | null;
  currentDayData: DayData | null;
  nextDayData: DayData | null;
  markActivityCompleted: (activityName: string) => void;
  skipActivity: (activityName: string) => void;
  refreshItinerary: () => Promise<void>;
}

export function useTripContext(options: UseTripContextOptions = {}): UseTripContextReturn {
  const { itineraryId, startDate, enableGPS = true } = options;

  const [itinerary, setItinerary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [skippedActivities, setSkippedActivities] = useState<Set<string>>(new Set());

  const { location } = useGPS({ autoStart: enableGPS, trackingInterval: 60000 }); // Update every minute

  // Fetch itinerary data
  const loadItinerary = async () => {
    if (!itineraryId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/itinerary/${itineraryId}`);

      if (!response.ok) {
        throw new Error('Failed to load itinerary');
      }

      const data = await response.json();
      setItinerary(data);
    } catch (err) {
      console.error('Error loading itinerary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  // Load itinerary on mount
  useEffect(() => {
    loadItinerary();
  }, [itineraryId]);

  // Calculate current day based on start date
  const currentDay = useMemo(() => {
    if (!startDate || !itinerary) return null;

    const start = new Date(startDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Day 1 is the start date, Day 2 is the next day, etc.
    const day = daysDiff + 1;

    const totalDays = Array.isArray(itinerary.dayStructure)
      ? itinerary.dayStructure.length
      : itinerary.dayStructure?.days?.length || 0;

    // Return null if before trip starts or after trip ends
    if (day < 1 || day > totalDays) {
      return null;
    }

    return day;
  }, [startDate, itinerary]);

  // Determine time block (morning/afternoon/evening)
  const timeBlock = useMemo((): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();

    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }, []);

  // Get current day data
  const currentDayData = useMemo((): DayData | null => {
    if (!itinerary || currentDay === null) return null;

    const daysArray = Array.isArray(itinerary.dayStructure)
      ? itinerary.dayStructure
      : itinerary.dayStructure?.days || [];

    const dayInfo = daysArray.find((d: any) => d.day === currentDay);
    if (!dayInfo) return null;

    // Get activities for this day
    const dayActivitiesObj = Array.isArray(itinerary.activities)
      ? itinerary.activities.find((a: any) => a.day === currentDay)
      : null;

    const activities = dayActivitiesObj?.activities || [];

    // Get restaurants for this day
    const dayRestaurantsObj = Array.isArray(itinerary.restaurants)
      ? itinerary.restaurants.find((r: any) => r.day === currentDay)
      : null;

    const restaurants = [];
    if (dayRestaurantsObj?.meals) {
      if (dayRestaurantsObj.meals.breakfast) restaurants.push(dayRestaurantsObj.meals.breakfast);
      if (dayRestaurantsObj.meals.lunch) restaurants.push(dayRestaurantsObj.meals.lunch);
      if (dayRestaurantsObj.meals.dinner) restaurants.push(dayRestaurantsObj.meals.dinner);
    }

    // Get accommodation
    const accommodation = Array.isArray(itinerary.accommodations)
      ? itinerary.accommodations.find((a: any) => a.day === currentDay)
      : undefined;

    return {
      day: currentDay,
      location: dayInfo.location,
      overnight: dayInfo.overnight,
      activities,
      restaurants,
      accommodation
    };
  }, [itinerary, currentDay]);

  // Get next day data
  const nextDayData = useMemo((): DayData | null => {
    if (!itinerary || currentDay === null) return null;

    const nextDay = currentDay + 1;
    const daysArray = Array.isArray(itinerary.dayStructure)
      ? itinerary.dayStructure
      : itinerary.dayStructure?.days || [];

    const dayInfo = daysArray.find((d: any) => d.day === nextDay);
    if (!dayInfo) return null;

    const dayActivitiesObj = Array.isArray(itinerary.activities)
      ? itinerary.activities.find((a: any) => a.day === nextDay)
      : null;

    const activities = dayActivitiesObj?.activities || [];

    return {
      day: nextDay,
      location: dayInfo.location,
      overnight: dayInfo.overnight,
      activities,
      restaurants: [],
      accommodation: undefined
    };
  }, [itinerary, currentDay]);

  // Find next activity based on time and location
  const nextActivity = useMemo((): Activity | null => {
    if (!currentDayData) return null;

    // Filter out completed and skipped activities
    const availableActivities = currentDayData.activities.filter(
      (a: Activity) => !completedActivities.has(a.name) && !skippedActivities.has(a.name)
    );

    if (availableActivities.length === 0) {
      // If no more activities today, look at tomorrow's first activity
      return nextDayData?.activities[0] || null;
    }

    // Find activities for current time block
    const blockActivities = availableActivities.filter((a: Activity) => a.block === timeBlock);

    if (blockActivities.length > 0) {
      return blockActivities[0];
    }

    // If no activities for current block, return first available
    return availableActivities[0];
  }, [currentDayData, nextDayData, timeBlock, completedActivities, skippedActivities]);

  // Get upcoming activities
  const upcomingActivities = useMemo((): Activity[] => {
    if (!currentDayData) return [];

    const availableActivities = currentDayData.activities.filter(
      (a: Activity) => !completedActivities.has(a.name) && !skippedActivities.has(a.name)
    );

    return availableActivities.slice(0, 3); // Next 3 activities
  }, [currentDayData, completedActivities, skippedActivities]);

  // Calculate distance to next activity
  const distanceToNext = useMemo((): number | null => {
    if (!location || !nextActivity?.location) return null;

    return calculateDistance(
      location.latitude,
      location.longitude,
      nextActivity.location.lat,
      nextActivity.location.lng
    );
  }, [location, nextActivity]);

  // Calculate progress through current day
  const progressPercent = useMemo((): number => {
    if (!currentDayData) return 0;

    const total = currentDayData.activities.length;
    if (total === 0) return 100;

    const completed = currentDayData.activities.filter((a: Activity) =>
      completedActivities.has(a.name)
    ).length;

    return Math.round((completed / total) * 100);
  }, [currentDayData, completedActivities]);

  // Total days
  const totalDays = useMemo(() => {
    if (!itinerary) return 0;

    const daysArray = Array.isArray(itinerary.dayStructure)
      ? itinerary.dayStructure
      : itinerary.dayStructure?.days || [];

    return daysArray.length;
  }, [itinerary]);

  // Days completed and remaining
  const daysCompleted = currentDay ? currentDay - 1 : 0;
  const daysRemaining = currentDay ? totalDays - currentDay + 1 : totalDays;

  // Mark activity as completed
  const markActivityCompleted = (activityName: string) => {
    setCompletedActivities((prev) => new Set([...prev, activityName]));
    setSkippedActivities((prev) => {
      const newSet = new Set(prev);
      newSet.delete(activityName); // Remove from skipped if it was skipped
      return newSet;
    });
  };

  // Skip activity
  const skipActivity = (activityName: string) => {
    setSkippedActivities((prev) => new Set([...prev, activityName]));
  };

  // Refresh itinerary
  const refreshItinerary = async () => {
    await loadItinerary();
  };

  return {
    currentDay,
    totalDays,
    nextActivity,
    upcomingActivities,
    distanceToNext,
    timeBlock,
    progressPercent,
    daysCompleted,
    daysRemaining,
    isLoading,
    error,
    itinerary,
    currentDayData,
    nextDayData,
    markActivityCompleted,
    skipActivity,
    refreshItinerary
  };
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
