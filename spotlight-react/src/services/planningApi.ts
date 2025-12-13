/**
 * Planning API Service
 *
 * API client for the planning feature endpoints.
 */

import type {
  TripPlan,
  CityPlan,
  Cluster,
  PlanCard,
  GetPlanResponse,
  SavePlanResponse,
  GenerateCardsRequest,
  GenerateCardsResponse,
  CreateClusterRequest,
  CreateClusterResponse,
  UpdateClusterRequest,
  CompanionRequest,
  CompanionStreamEvent,
  LatLng,
} from '../types/planning';

// ============================================
// Configuration
// ============================================

const API_BASE = '/api/planning';

interface RequestOptions {
  token?: string;
}

function getHeaders(options?: RequestOptions): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  return headers;
}

// ============================================
// Start Planning (from Discovery)
// ============================================

export interface StartPlanningRequest {
  origin: {
    id?: string;
    name: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    id?: string;
    name: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  waypoints: Array<{
    id?: string;
    name: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    nights?: number;
    suggestedNights?: number;
  }>;
  startDate?: string;
  endDate?: string;
  totalNights?: number;
  travellerType?: string;
  userId?: string;
}

export interface StartPlanningResponse {
  routeId: string;
  tripPlan: TripPlan;
}

/**
 * Start planning from discovery data.
 * Creates a new route and planning state.
 */
export async function startPlanning(
  request: StartPlanningRequest,
  options?: RequestOptions
): Promise<StartPlanningResponse> {
  const response = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to start planning');
  }

  return response.json();
}

// ============================================
// Plan Operations
// ============================================

/**
 * Get planning state for a route.
 * Creates initial state if none exists.
 */
export async function getPlan(routeId: string, options?: RequestOptions): Promise<TripPlan> {
  const response = await fetch(`${API_BASE}/${routeId}`, {
    headers: getHeaders(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get plan');
  }

  const data: GetPlanResponse = await response.json();
  return data.tripPlan;
}

/**
 * Save the current plan state.
 */
export async function savePlan(
  routeId: string,
  cities: CityPlan[],
  options?: RequestOptions
): Promise<SavePlanResponse> {
  const response = await fetch(`${API_BASE}/${routeId}/save`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify({ cities }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to save plan');
  }

  return response.json();
}

// ============================================
// Card Generation
// ============================================

/**
 * Generate new suggestion cards.
 */
export async function generateCards(
  routeId: string,
  request: GenerateCardsRequest,
  options?: RequestOptions
): Promise<GenerateCardsResponse> {
  const response = await fetch(`${API_BASE}/${routeId}/generate`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to generate cards');
  }

  return response.json();
}

// ============================================
// Cluster Operations
// ============================================

/**
 * Create a new cluster.
 */
export async function createCluster(
  routeId: string,
  request: CreateClusterRequest,
  options?: RequestOptions
): Promise<CreateClusterResponse> {
  const response = await fetch(`${API_BASE}/${routeId}/clusters`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create cluster');
  }

  return response.json();
}

/**
 * Update a cluster.
 */
export async function updateCluster(
  routeId: string,
  clusterId: string,
  request: UpdateClusterRequest,
  options?: RequestOptions
): Promise<{ cluster: Cluster }> {
  const response = await fetch(`${API_BASE}/${routeId}/clusters/${clusterId}`, {
    method: 'PUT',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update cluster');
  }

  return response.json();
}

/**
 * Delete a cluster.
 */
export async function deleteCluster(
  routeId: string,
  clusterId: string,
  options?: RequestOptions
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${routeId}/clusters/${clusterId}`, {
    method: 'DELETE',
    headers: getHeaders(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete cluster');
  }

  return response.json();
}

// ============================================
// Auto-Clustering Item Operations
// ============================================

export interface AddItemRequest {
  cityId: string;
  card: PlanCard;
}

export interface AddItemResponse {
  success: boolean;
  itemId: string;
  clusterId: string;
  clusterName: string;
  isNewCluster: boolean;
}

/**
 * Add an item to the plan with auto-clustering.
 * The system automatically places the item in the best cluster
 * or creates a new one based on geographic proximity.
 */
export async function addItemAutoClustered(
  routeId: string,
  request: AddItemRequest,
  options?: RequestOptions
): Promise<AddItemResponse> {
  const response = await fetch(`${API_BASE}/${routeId}/add-item`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to add item');
  }

  return response.json();
}

export interface RemoveItemRequest {
  itemId: string;
  clusterId?: string;
}

/**
 * Remove an item from the plan.
 * Automatically handles cluster cleanup if the cluster becomes empty.
 */
export async function removeItem(
  routeId: string,
  request: RemoveItemRequest,
  options?: RequestOptions
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${routeId}/remove-item`, {
    method: 'DELETE',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to remove item');
  }

  return response.json();
}

// ============================================
// Companion
// ============================================

/**
 * Send message to companion agent.
 * Returns an async generator for SSE events.
 */
export async function* sendToCompanion(
  routeId: string,
  request: CompanionRequest,
  options?: RequestOptions
): AsyncGenerator<CompanionStreamEvent> {
  const response = await fetch(`${API_BASE}/${routeId}/companion`, {
    method: 'POST',
    headers: {
      ...getHeaders(options),
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send to companion');
  }

  // Check if response is SSE
  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('text/event-stream')) {
    // Handle SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }
          try {
            const event = JSON.parse(data) as CompanionStreamEvent;
            yield event;
          } catch (e) {
            console.error('[planningApi] Failed to parse SSE event:', data);
          }
        }
      }
    }
  } else {
    // Handle regular JSON response (fallback for Phase 1)
    const data = await response.json();
    if (data.message) {
      yield { type: 'message', content: data.message };
    }
    if (data.cards) {
      yield { type: 'cards', cards: data.cards };
    }
    if (data.actions) {
      yield { type: 'actions', actions: data.actions };
    }
    yield { type: 'done' };
  }
}

/**
 * Send message to companion (non-streaming version).
 * For simpler use cases in Phase 1.
 */
export async function sendToCompanionSimple(
  routeId: string,
  request: CompanionRequest,
  options?: RequestOptions
): Promise<{
  message: string;
  cards?: PlanCard[];
  actions?: { id: string; label: string; type: string }[];
}> {
  const response = await fetch(`${API_BASE}/${routeId}/companion`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send to companion');
  }

  return response.json();
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate walking distance between two points.
 */
export async function calculateDistance(
  from: LatLng,
  to: LatLng,
  options?: RequestOptions
): Promise<{
  walkingMinutes: number;
  transitMinutes?: number;
  drivingMinutes?: number;
}> {
  const params = new URLSearchParams({
    from: `${from.lat},${from.lng}`,
    to: `${to.lat},${to.lng}`,
  });

  const response = await fetch(`${API_BASE}/distance?${params}`, {
    headers: getHeaders(options),
  });

  if (!response.ok) {
    // Return estimate if API fails
    return { walkingMinutes: estimateWalkingTime(from, to) };
  }

  return response.json();
}

/**
 * Estimate walking time between two points (fallback).
 * Assumes average walking speed of 5 km/h.
 */
function estimateWalkingTime(from: LatLng, to: LatLng): number {
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
  const distance = R * c; // Distance in km

  // Average walking speed: 5 km/h = 12 min/km
  return Math.round(distance * 12);
}

/**
 * Enrich cards with proximity information.
 */
export function enrichCardsWithProximity(
  cards: PlanCard[],
  clusters: Cluster[]
): Array<{
  card: PlanCard;
  nearestCluster: { name: string; walkingMinutes: number } | null;
  isNearPlan: boolean;
}> {
  if (clusters.length === 0) {
    return cards.map((card) => ({
      card,
      nearestCluster: null,
      isNearPlan: false,
    }));
  }

  return cards.map((card) => {
    let nearestCluster: { name: string; walkingMinutes: number } | null = null;
    let minDistance = Infinity;

    for (const cluster of clusters) {
      // Use cluster center for distance calculation
      const distance = estimateWalkingTime(card.location, cluster.center);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCluster = {
          name: cluster.name,
          walkingMinutes: distance,
        };
      }

      // Also check individual items in cluster
      for (const item of cluster.items) {
        const itemDistance = estimateWalkingTime(card.location, item.location);
        if (itemDistance < minDistance) {
          minDistance = itemDistance;
          nearestCluster = {
            name: cluster.name,
            walkingMinutes: itemDistance,
          };
        }
      }
    }

    return {
      card,
      nearestCluster,
      isNearPlan: minDistance < 10, // Less than 10 minutes is "near"
    };
  });
}

/**
 * Sort cards by proximity to user's plan.
 */
export function sortCardsByProximity<T extends { nearestCluster: { walkingMinutes: number } | null }>(
  cards: T[]
): T[] {
  return [...cards].sort((a, b) => {
    const aMin = a.nearestCluster?.walkingMinutes ?? Infinity;
    const bMin = b.nearestCluster?.walkingMinutes ?? Infinity;
    return aMin - bMin;
  });
}
