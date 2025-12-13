/**
 * Auto-Clustering Utility
 *
 * Automatically organizes plan items into geographic clusters.
 * When a user adds an item, the system determines the best cluster
 * based on proximity to existing clusters or creates a new one.
 *
 * Key rules:
 * - Items within 15 min walk of each other = same cluster
 * - Restaurants placed near activity clusters when possible
 * - New clusters named after the item's area
 */

import type { CityPlan, Cluster, PlanCard, LatLng } from '../types/planning';

// Maximum walking time (minutes) to consider items as part of the same cluster
const MAX_WALKING_MINUTES = 15;

// Types that count as "activities" for restaurant placement logic
const ACTIVITY_TYPES = ['activity', 'photo_spot', 'experience'];
const RESTAURANT_TYPES = ['restaurant', 'bar', 'cafe'];

/**
 * Calculate walking time between two points (in minutes)
 * Uses Haversine formula with average walking speed
 */
export function calculateWalkingMinutes(from: LatLng, to: LatLng): number {
  if (!from || !to || !from.lat || !to.lat) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Average walking speed: 5 km/h, add 20% for non-straight paths
  const walkingHours = (distanceKm / 5) * 1.2;
  return Math.round(walkingHours * 60);
}

/**
 * Calculate the center point of a cluster based on its items
 */
export function calculateClusterCenter(items: PlanCard[]): LatLng {
  if (items.length === 0) return { lat: 0, lng: 0 };

  const validItems = items.filter(item => item.location?.lat && item.location?.lng);
  if (validItems.length === 0) return { lat: 0, lng: 0 };

  const sumLat = validItems.reduce((sum, item) => sum + item.location.lat, 0);
  const sumLng = validItems.reduce((sum, item) => sum + item.location.lng, 0);

  return {
    lat: sumLat / validItems.length,
    lng: sumLng / validItems.length,
  };
}

/**
 * Find the best existing cluster for an item, or determine a new cluster is needed
 */
export function findBestClusterForItem(
  cityPlan: CityPlan,
  newItem: PlanCard
): { clusterId: string | null; shouldCreateNew: boolean; suggestedName: string } {
  const { clusters } = cityPlan;

  // If no item location, can't determine proximity
  if (!newItem.location?.lat || !newItem.location?.lng) {
    // Just use the first cluster or create a new one
    if (clusters.length > 0) {
      return { clusterId: clusters[0].id, shouldCreateNew: false, suggestedName: '' };
    }
    return {
      clusterId: null,
      shouldCreateNew: true,
      suggestedName: newItem.location?.area || 'New Area',
    };
  }

  // For restaurants/bars, prefer clusters with activities
  if (RESTAURANT_TYPES.includes(newItem.type)) {
    const clusterWithActivities = findBestClusterForRestaurant(clusters, newItem);
    if (clusterWithActivities) {
      return { clusterId: clusterWithActivities.id, shouldCreateNew: false, suggestedName: '' };
    }
  }

  // Find nearest cluster within walking distance
  let nearestCluster: Cluster | null = null;
  let nearestDistance = Infinity;

  for (const cluster of clusters) {
    // Calculate distance to cluster center
    const walkingTime = calculateWalkingMinutes(newItem.location, cluster.center);

    if (walkingTime <= MAX_WALKING_MINUTES && walkingTime < nearestDistance) {
      nearestDistance = walkingTime;
      nearestCluster = cluster;
    }
  }

  if (nearestCluster) {
    return { clusterId: nearestCluster.id, shouldCreateNew: false, suggestedName: '' };
  }

  // No nearby cluster - need to create a new one
  return {
    clusterId: null,
    shouldCreateNew: true,
    suggestedName: newItem.location?.area || 'New Area',
  };
}

/**
 * Find the best cluster for a restaurant based on activity presence
 */
function findBestClusterForRestaurant(
  clusters: Cluster[],
  restaurant: PlanCard
): Cluster | null {
  // Sort clusters by activity count (restaurants should be near activities)
  const clustersWithActivities = clusters
    .map(cluster => ({
      cluster,
      activityCount: cluster.items.filter(i => ACTIVITY_TYPES.includes(i.type)).length,
    }))
    .filter(c => c.activityCount > 0)
    .sort((a, b) => b.activityCount - a.activityCount);

  // Find the closest cluster with activities
  for (const { cluster } of clustersWithActivities) {
    const walkingTime = calculateWalkingMinutes(restaurant.location, cluster.center);
    if (walkingTime <= MAX_WALKING_MINUTES) {
      return cluster;
    }
  }

  return null;
}

/**
 * Generate a unique cluster ID
 */
export function generateClusterId(): string {
  return `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compute cluster statistics after modification
 */
export function computeClusterStats(cluster: Cluster): {
  totalDuration: number;
  maxWalkingDistance: number;
  center: LatLng;
} {
  const totalDuration = cluster.items.reduce((sum, item) => sum + (item.duration || 0), 0);

  // Recalculate center based on items
  const center = calculateClusterCenter(cluster.items);

  // Calculate max walking distance between any two items
  let maxWalkingDistance = 0;
  if (cluster.items.length >= 2) {
    for (let i = 0; i < cluster.items.length; i++) {
      for (let j = i + 1; j < cluster.items.length; j++) {
        const itemA = cluster.items[i];
        const itemB = cluster.items[j];
        if (itemA.location && itemB.location) {
          const walkingTime = calculateWalkingMinutes(itemA.location, itemB.location);
          maxWalkingDistance = Math.max(maxWalkingDistance, walkingTime);
        }
      }
    }
  }

  return { totalDuration, maxWalkingDistance, center };
}

/**
 * Smart ordering of items within a cluster based on best visiting sequence
 *
 * Philosophy: Create a natural flow through the day
 * 1. Outdoor activities → Morning (best light, less crowds)
 * 2. Photo spots → Morning/Golden hour
 * 3. Indoor activities/experiences → Midday (escape heat/rain)
 * 4. Cafes → Late morning or afternoon break
 * 5. Restaurants → Meal times (lunch: 12-2, dinner: 7-9)
 * 6. Bars → Evening/Night
 *
 * Secondary sort: by rating (higher rated items first within same time slot)
 */
export function orderItemsOptimally(items: PlanCard[]): PlanCard[] {
  // Time slots in order of day progression
  const timeSlots = {
    'early_morning': 0,  // 6-8 AM
    'morning': 1,        // 8-11 AM
    'late_morning': 2,   // 11 AM - 12 PM
    'lunch': 3,          // 12-2 PM
    'early_afternoon': 4, // 2-4 PM
    'afternoon': 5,      // 4-6 PM
    'golden_hour': 6,    // 6-7 PM (sunset)
    'dinner': 7,         // 7-9 PM
    'evening': 8,        // 9-11 PM
    'night': 9,          // 11 PM+
  };

  // Determine optimal time slot based on item type and bestTime
  function getTimeSlot(item: PlanCard): number {
    const bestTime = item.bestTime?.toLowerCase() || '';
    const type = item.type;
    const tags = item.tags || [];

    // If explicit bestTime is set, use it
    if (bestTime) {
      if (bestTime.includes('sunrise') || bestTime.includes('early')) return timeSlots.early_morning;
      if (bestTime.includes('morning')) return timeSlots.morning;
      if (bestTime.includes('lunch')) return timeSlots.lunch;
      if (bestTime.includes('afternoon')) return timeSlots.afternoon;
      if (bestTime.includes('sunset') || bestTime.includes('golden')) return timeSlots.golden_hour;
      if (bestTime.includes('dinner')) return timeSlots.dinner;
      if (bestTime.includes('evening')) return timeSlots.evening;
      if (bestTime.includes('night')) return timeSlots.night;
    }

    // Infer from type and tags
    const isOutdoor = tags.some(t =>
      ['outdoor', 'nature', 'park', 'garden', 'beach', 'hike', 'walk'].includes(t.toLowerCase())
    );

    switch (type) {
      case 'photo_spot':
        // Photo spots are best at golden hour or morning
        return isOutdoor ? timeSlots.morning : timeSlots.golden_hour;

      case 'activity':
      case 'experience':
        // Outdoor activities: morning; Indoor: midday
        return isOutdoor ? timeSlots.morning : timeSlots.early_afternoon;

      case 'cafe':
        // Cafes: late morning break or afternoon
        return timeSlots.late_morning;

      case 'restaurant':
        // Restaurants: default to lunch unless tagged for dinner
        if (tags.some(t => ['dinner', 'fine-dining', 'romantic'].includes(t.toLowerCase()))) {
          return timeSlots.dinner;
        }
        return timeSlots.lunch;

      case 'bar':
        // Bars: evening
        return timeSlots.evening;

      case 'hotel':
        // Hotels: end of day
        return timeSlots.night;

      default:
        return timeSlots.afternoon;
    }
  }

  return [...items].sort((a, b) => {
    const aSlot = getTimeSlot(a);
    const bSlot = getTimeSlot(b);

    // Primary sort: by time slot
    if (aSlot !== bSlot) {
      return aSlot - bSlot;
    }

    // Secondary sort: by rating (higher first)
    const aRating = a.rating || 0;
    const bRating = b.rating || 0;
    return bRating - aRating;
  });
}

/**
 * Check if items should be reordered after adding a new item
 * Only reorder if the new item is out of optimal sequence
 */
export function shouldReorderAfterAdd(items: PlanCard[], newItemIndex: number): boolean {
  if (items.length <= 1) return false;

  const optimalOrder = orderItemsOptimally(items);
  const newItem = items[newItemIndex];

  // Check if the new item is in the right position
  const optimalIndex = optimalOrder.findIndex(i => i.id === newItem.id);
  return optimalIndex !== newItemIndex;
}
