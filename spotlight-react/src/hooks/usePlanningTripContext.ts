/**
 * usePlanningTripContext - Trip context from planning data
 *
 * Adapts the planning store data format to work with TodayView.
 * Allows users to view their planned activities during an active trip.
 */

import { useState, useEffect, useMemo } from 'react';
import { usePlanningStore } from '../stores/planningStore';
import { useGPS } from './useGPS';
import type { PlanCard, Cluster, CityPlan } from '../types/planning';

interface Activity {
  id: string;
  name: string;
  type: string;
  block?: 'morning' | 'afternoon' | 'evening';
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  duration?: number;
  description?: string;
  whyGreat?: string;
  priceLevel?: number;
  clusterId?: string;
  clusterName?: string;
}

interface DayData {
  day: number;
  cityId: string;
  cityName: string;
  location: string;
  overnight: boolean;
  activities: Activity[];
  clusters: Cluster[];
}

interface UsePlanningTripContextOptions {
  routeId?: string;
  startDate?: string;
  enableGPS?: boolean;
}

interface UsePlanningTripContextReturn {
  currentDay: number | null;
  totalDays: number;
  nextActivity: Activity | null;
  upcomingActivities: Activity[];
  distanceToNext: number | null;
  timeBlock: 'morning' | 'afternoon' | 'evening';
  progressPercent: number;
  daysCompleted: number;
  daysRemaining: number;
  isLoading: boolean;
  error: string | null;
  currentDayData: DayData | null;
  currentCityPlan: CityPlan | null;
  markActivityCompleted: (activityId: string) => void;
  skipActivity: (activityId: string) => void;
}

/**
 * Convert PlanCard to Activity format
 */
function planCardToActivity(card: PlanCard, cluster?: Cluster): Activity {
  // Determine time block based on bestTime or type
  let block: 'morning' | 'afternoon' | 'evening' | undefined;
  if (card.bestTime) {
    if (card.bestTime.toLowerCase().includes('morning') || card.bestTime.toLowerCase().includes('breakfast')) {
      block = 'morning';
    } else if (card.bestTime.toLowerCase().includes('lunch') || card.bestTime.toLowerCase().includes('afternoon')) {
      block = 'afternoon';
    } else if (card.bestTime.toLowerCase().includes('dinner') || card.bestTime.toLowerCase().includes('evening') || card.bestTime.toLowerCase().includes('sunset')) {
      block = 'evening';
    }
  }

  return {
    id: card.id,
    name: card.name,
    type: card.type,
    block,
    address: card.location?.address,
    location: card.location ? { lat: card.location.lat, lng: card.location.lng } : undefined,
    duration: card.duration,
    description: card.description,
    whyGreat: card.whyGreat,
    priceLevel: card.priceLevel,
    clusterId: cluster?.id,
    clusterName: cluster?.name,
  };
}

/**
 * Calculate walking distance between two coordinates (Haversine)
 */
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

export function usePlanningTripContext(
  options: UsePlanningTripContextOptions = {}
): UsePlanningTripContextReturn {
  const { routeId, startDate, enableGPS = true } = options;

  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [skippedActivities, setSkippedActivities] = useState<Set<string>>(new Set());

  // Planning store
  const {
    tripPlan,
    cityPlans,
    isLoading,
    error,
    loadPlan,
  } = usePlanningStore();

  // GPS
  const { location } = useGPS({ autoStart: enableGPS, trackingInterval: 60000 });

  // Load plan on mount
  useEffect(() => {
    if (routeId && !tripPlan) {
      loadPlan(routeId);
    }
  }, [routeId, tripPlan, loadPlan]);

  // Calculate current day based on start date
  const currentDay = useMemo(() => {
    if (!startDate || !tripPlan) return null;

    const start = new Date(startDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const day = daysDiff + 1;

    // Calculate total days from city nights
    const totalNights = tripPlan.cities.reduce((sum, c) => sum + (c.city.nights || 1), 0);
    if (day < 1 || day > totalNights + 1) {
      return null;
    }

    return day;
  }, [startDate, tripPlan]);

  // Determine which city we're in based on current day
  const currentCityPlan = useMemo((): CityPlan | null => {
    if (!tripPlan || currentDay === null) return null;

    let dayCounter = 0;
    for (const cityPlan of tripPlan.cities) {
      const nights = cityPlan.city.nights || 1;
      dayCounter += nights;
      if (currentDay <= dayCounter) {
        return cityPlans[cityPlan.cityId] || cityPlan;
      }
    }

    // Return last city if we're past all
    const lastCity = tripPlan.cities[tripPlan.cities.length - 1];
    return cityPlans[lastCity?.cityId] || lastCity;
  }, [tripPlan, cityPlans, currentDay]);

  // Time block
  const timeBlock = useMemo((): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }, []);

  // Convert current city plan to DayData
  const currentDayData = useMemo((): DayData | null => {
    if (!currentCityPlan || currentDay === null) return null;

    // Gather all activities from clusters
    const activities: Activity[] = [];

    for (const cluster of currentCityPlan.clusters) {
      for (const item of cluster.items) {
        activities.push(planCardToActivity(item, cluster));
      }
    }

    // Add unclustered items
    for (const item of currentCityPlan.unclustered) {
      activities.push(planCardToActivity(item));
    }

    // Sort by time block (morning first, then afternoon, then evening, then unspecified)
    const blockOrder = { morning: 0, afternoon: 1, evening: 2 };
    activities.sort((a, b) => {
      const aOrder = a.block ? blockOrder[a.block] : 3;
      const bOrder = b.block ? blockOrder[b.block] : 3;
      return aOrder - bOrder;
    });

    return {
      day: currentDay,
      cityId: currentCityPlan.cityId,
      cityName: currentCityPlan.city.name,
      location: currentCityPlan.city.name,
      overnight: true,
      activities,
      clusters: currentCityPlan.clusters,
    };
  }, [currentCityPlan, currentDay]);

  // Find next activity
  const nextActivity = useMemo((): Activity | null => {
    if (!currentDayData) return null;

    const availableActivities = currentDayData.activities.filter(
      (a) => !completedActivities.has(a.id) && !skippedActivities.has(a.id)
    );

    if (availableActivities.length === 0) return null;

    // Find activities for current time block
    const blockActivities = availableActivities.filter((a) => a.block === timeBlock);
    if (blockActivities.length > 0) {
      return blockActivities[0];
    }

    return availableActivities[0];
  }, [currentDayData, timeBlock, completedActivities, skippedActivities]);

  // Upcoming activities
  const upcomingActivities = useMemo((): Activity[] => {
    if (!currentDayData) return [];

    return currentDayData.activities
      .filter((a) => !completedActivities.has(a.id) && !skippedActivities.has(a.id))
      .slice(0, 5);
  }, [currentDayData, completedActivities, skippedActivities]);

  // Distance to next activity
  const distanceToNext = useMemo((): number | null => {
    if (!location || !nextActivity?.location) return null;

    return calculateDistance(
      location.latitude,
      location.longitude,
      nextActivity.location.lat,
      nextActivity.location.lng
    );
  }, [location, nextActivity]);

  // Progress percent
  const progressPercent = useMemo((): number => {
    if (!currentDayData || currentDayData.activities.length === 0) return 0;

    const completed = currentDayData.activities.filter((a) =>
      completedActivities.has(a.id)
    ).length;

    return Math.round((completed / currentDayData.activities.length) * 100);
  }, [currentDayData, completedActivities]);

  // Total days
  const totalDays = useMemo(() => {
    if (!tripPlan) return 0;
    return tripPlan.cities.reduce((sum, c) => sum + (c.city.nights || 1), 0);
  }, [tripPlan]);

  const daysCompleted = currentDay ? currentDay - 1 : 0;
  const daysRemaining = currentDay ? totalDays - currentDay + 1 : totalDays;

  // Actions
  const markActivityCompleted = (activityId: string) => {
    setCompletedActivities((prev) => new Set([...prev, activityId]));
    setSkippedActivities((prev) => {
      const newSet = new Set(prev);
      newSet.delete(activityId);
      return newSet;
    });
  };

  const skipActivity = (activityId: string) => {
    setSkippedActivities((prev) => new Set([...prev, activityId]));
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
    currentDayData,
    currentCityPlan,
    markActivityCompleted,
    skipActivity,
  };
}

export default usePlanningTripContext;
