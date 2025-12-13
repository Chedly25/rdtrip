/**
 * useCompanionTips
 *
 * Generates contextual, helpful tips based on the current city plan.
 * Tips appear inline in the plan panel, replacing the separate companion panel.
 *
 * Tip philosophy: Be a helpful travel-savvy friend, not a robotic assistant.
 * - Celebrate wins ("Perfect morning planned!")
 * - Gently warn about issues ("That's quite a walk...")
 * - Suggest improvements ("You'll need lunch nearby")
 */

import { useMemo } from 'react';
import type { CityPlan, Cluster, PlanCard, LatLng } from '../types/planning';

// ============================================
// Types
// ============================================

export type TipType =
  | 'cluster_complete'   // Area has good coverage
  | 'far_item'           // Item is far from others in cluster
  | 'missing_meal'       // Long activity block without food
  | 'too_packed'         // Too many hours for available time
  | 'hotel_suggestion'   // Hotel is far from activities
  | 'great_start'        // Encouragement for first items
  | 'walkable_day';      // Everything is close together

export interface CompanionTip {
  id: string;
  type: TipType;
  message: string;
  subtext?: string;
  clusterId?: string;
  action?: {
    label: string;
    actionType: 'scroll_to_restaurants' | 'scroll_to_hotels' | 'dismiss';
  };
  dismissible: boolean;
  priority: number; // Higher = more important
}

// ============================================
// Constants
// ============================================

const ACTIVITY_TYPES = ['activity', 'photo_spot', 'experience'];
const RESTAURANT_TYPES = ['restaurant', 'bar', 'cafe'];

// Walking time thresholds (minutes)
const MAX_COMFORTABLE_WALK = 15;
const FAR_WALK_THRESHOLD = 25;

// Duration thresholds (minutes)
const NEEDS_MEAL_DURATION = 180; // 3 hours
const TOO_PACKED_DURATION = 480; // 8 hours

// ============================================
// Utility Functions
// ============================================

function calculateWalkingMinutes(from: LatLng, to: LatLng): number {
  if (!from?.lat || !to?.lat) return Infinity;

  const R = 6371;
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

  return Math.round((distanceKm / 5) * 1.2 * 60);
}

function calculateOptimalHotelArea(clusters: Cluster[]): LatLng | null {
  if (clusters.length === 0) return null;

  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;

  for (const cluster of clusters) {
    if (!cluster.center?.lat) continue;
    const weight = cluster.items.length + (cluster.totalDuration / 60);
    totalWeight += weight;
    weightedLat += cluster.center.lat * weight;
    weightedLng += cluster.center.lng * weight;
  }

  if (totalWeight === 0) return null;

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
  };
}

function generateTipId(type: TipType, context: string): string {
  return `${type}-${context}-${Date.now()}`;
}

// ============================================
// Tip Generation Logic
// ============================================

function checkClusterComplete(cluster: Cluster): CompanionTip | null {
  const hasActivities = cluster.items.some(i => ACTIVITY_TYPES.includes(i.type));
  const hasFood = cluster.items.some(i => RESTAURANT_TYPES.includes(i.type));
  const goodDuration = cluster.totalDuration >= 120 && cluster.totalDuration <= 300;
  const goodCount = cluster.items.length >= 3;

  if (hasActivities && hasFood && goodDuration && goodCount) {
    const hours = Math.round(cluster.totalDuration / 60 * 10) / 10;
    return {
      id: generateTipId('cluster_complete', cluster.id),
      type: 'cluster_complete',
      message: `${cluster.name} looks perfect!`,
      subtext: `${cluster.items.length} spots, ~${hours}h — a great half-day`,
      clusterId: cluster.id,
      dismissible: true,
      priority: 2,
    };
  }

  return null;
}

function checkMissingMeal(cluster: Cluster): CompanionTip | null {
  const hasRestaurant = cluster.items.some(i => RESTAURANT_TYPES.includes(i.type));
  const hasActivities = cluster.items.some(i => ACTIVITY_TYPES.includes(i.type));
  const longEnoughToNeedFood = cluster.totalDuration >= NEEDS_MEAL_DURATION;

  if (hasActivities && !hasRestaurant && longEnoughToNeedFood) {
    return {
      id: generateTipId('missing_meal', cluster.id),
      type: 'missing_meal',
      message: `You'll need a meal near ${cluster.name}`,
      subtext: `${Math.round(cluster.totalDuration / 60)}h of activities without food`,
      clusterId: cluster.id,
      action: {
        label: 'Find restaurants',
        actionType: 'scroll_to_restaurants',
      },
      dismissible: true,
      priority: 4,
    };
  }

  return null;
}

function checkFarItem(cluster: Cluster): CompanionTip | null {
  if (cluster.items.length < 2) return null;

  // Check if any item is far from the cluster center
  for (const item of cluster.items) {
    if (!item.location) continue;
    const walkingTime = calculateWalkingMinutes(item.location, cluster.center);

    if (walkingTime >= FAR_WALK_THRESHOLD) {
      return {
        id: generateTipId('far_item', `${cluster.id}-${item.id}`),
        type: 'far_item',
        message: `${item.name} is quite far`,
        subtext: `${walkingTime} min walk from other spots in ${cluster.name}`,
        clusterId: cluster.id,
        dismissible: true,
        priority: 3,
      };
    }
  }

  return null;
}

function checkTooPacked(clusters: Cluster[], nights: number = 1): CompanionTip | null {
  const totalDuration = clusters.reduce((sum, c) => sum + c.totalDuration, 0);
  const availableTime = nights * TOO_PACKED_DURATION; // 8h per day is reasonable

  if (totalDuration > availableTime) {
    const hours = Math.round(totalDuration / 60);
    return {
      id: generateTipId('too_packed', 'total'),
      type: 'too_packed',
      message: `That's a packed schedule!`,
      subtext: `${hours}h of activities for ${nights} ${nights === 1 ? 'night' : 'nights'} — you might want to prioritize`,
      dismissible: true,
      priority: 3,
    };
  }

  return null;
}

function checkHotelSuggestion(
  selectedHotel: PlanCard | null | undefined,
  clusters: Cluster[]
): CompanionTip | null {
  if (!selectedHotel?.location || clusters.length === 0) return null;

  const optimalArea = calculateOptimalHotelArea(clusters);
  if (!optimalArea) return null;

  const hotelDistance = calculateWalkingMinutes(selectedHotel.location, optimalArea);

  if (hotelDistance > 20) {
    // Find the closest cluster to suggest
    let closestCluster = clusters[0];
    let minDistance = Infinity;

    for (const cluster of clusters) {
      const dist = calculateWalkingMinutes(selectedHotel.location, cluster.center);
      if (dist < minDistance) {
        minDistance = dist;
        closestCluster = cluster;
      }
    }

    return {
      id: generateTipId('hotel_suggestion', selectedHotel.id),
      type: 'hotel_suggestion',
      message: `Your hotel is ${hotelDistance} min from most activities`,
      subtext: closestCluster
        ? `Consider staying closer to ${closestCluster.name}`
        : 'You might want to reconsider the location',
      action: {
        label: 'See hotel options',
        actionType: 'scroll_to_hotels',
      },
      dismissible: true,
      priority: 2,
    };
  }

  return null;
}

function checkGreatStart(clusters: Cluster[]): CompanionTip | null {
  const totalItems = clusters.reduce((sum, c) => sum + c.items.length, 0);

  if (totalItems >= 1 && totalItems <= 3) {
    return {
      id: generateTipId('great_start', 'first'),
      type: 'great_start',
      message: `Great start!`,
      subtext: `Keep adding spots — we'll organize them by area automatically`,
      dismissible: true,
      priority: 1,
    };
  }

  return null;
}

function checkWalkableDay(clusters: Cluster[]): CompanionTip | null {
  if (clusters.length < 2) return null;

  // Check if all clusters are within walking distance of each other
  let allWalkable = true;

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const distance = calculateWalkingMinutes(clusters[i].center, clusters[j].center);
      if (distance > MAX_COMFORTABLE_WALK) {
        allWalkable = false;
        break;
      }
    }
    if (!allWalkable) break;
  }

  if (allWalkable) {
    return {
      id: generateTipId('walkable_day', 'all'),
      type: 'walkable_day',
      message: `Everything's walkable!`,
      subtext: `All your areas are within 15 min of each other`,
      dismissible: true,
      priority: 1,
    };
  }

  return null;
}

// ============================================
// Main Hook
// ============================================

export function useCompanionTips(
  cityPlan: CityPlan | null,
  options?: {
    maxTips?: number;
    nights?: number;
  }
): CompanionTip[] {
  const { maxTips = 2, nights = 1 } = options || {};

  return useMemo(() => {
    if (!cityPlan) return [];

    const tips: CompanionTip[] = [];
    const { clusters, selectedHotel } = cityPlan;

    // Skip if no content
    if (clusters.length === 0 || clusters.every(c => c.items.length === 0)) {
      return [];
    }

    // Check each cluster
    for (const cluster of clusters) {
      if (cluster.items.length === 0) continue;

      // Missing meal tip (high priority)
      const missingMealTip = checkMissingMeal(cluster);
      if (missingMealTip) tips.push(missingMealTip);

      // Far item warning
      const farItemTip = checkFarItem(cluster);
      if (farItemTip) tips.push(farItemTip);

      // Cluster complete celebration
      const completeTip = checkClusterComplete(cluster);
      if (completeTip) tips.push(completeTip);
    }

    // Global checks
    const packedTip = checkTooPacked(clusters, nights);
    if (packedTip) tips.push(packedTip);

    const hotelTip = checkHotelSuggestion(selectedHotel, clusters);
    if (hotelTip) tips.push(hotelTip);

    const walkableTip = checkWalkableDay(clusters);
    if (walkableTip) tips.push(walkableTip);

    const startTip = checkGreatStart(clusters);
    if (startTip && tips.length === 0) tips.push(startTip);

    // Sort by priority (higher first) and limit
    return tips
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxTips);
  }, [cityPlan, maxTips, nights]);
}

export default useCompanionTips;
