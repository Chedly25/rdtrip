/**
 * Trip Service - Trip in Progress Mode API
 *
 * Phase 2: Real-time trip tracking, check-ins, and location updates
 */

import type { TimeSlot } from '../components/trip/TodayView';

// Use empty string fallback for production (same-origin requests)
// localhost fallback only used in development when VITE_API_URL is not set
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

// Get auth token from localStorage
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Error handling
class TripApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'TripApiError';
  }
}

async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new TripApiError(
      response.status,
      errorData.error || `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// ==================== Trip Types ====================

export interface ActiveTrip {
  id: string;
  route_id: string;
  itinerary_id?: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  current_day: number;
  current_city_index: number;
  last_location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp: string;
    city?: string;
    country?: string;
    address?: string;
  };
  last_location_update?: string;
  started_at: string;
  paused_at?: string;
  completed_at?: string;
  stats: TripStats;
  origin_city?: string;
  destination_city?: string;
  route_data?: unknown;
  itinerary_content?: unknown;
}

export interface TripStats {
  distance_traveled: number;
  photos_captured: number;
  checkins_complete: number;
  total_checkins: number;
}

export interface TodayData {
  activities: TimeSlot[];
  day: number;
  totalDays: number;
  city: string;
  date?: string;
}

export interface TripProgress {
  tripId: string;
  currentDay: number;
  totalDays: number;
  currentCityIndex: number;
  cities: Array<{
    name: string;
    country?: string;
    dates?: string;
  }>;
  stats: {
    distanceTraveled: number;
    photosCaptures: number;
    checkinsComplete: number;
    totalCheckins: number;
  };
  photos: Array<{
    url: string;
    city: string;
    caption?: string;
  }>;
}

export interface CheckinData {
  activityId?: string;
  activityName: string;
  activityType?: string;
  dayNumber?: number;
  locationName?: string;
  coordinates?: { lat: number; lng: number };
  photoUrls?: string[];
  note?: string;
  rating?: number;
  mood?: string;
  weather?: string;
  status?: 'completed' | 'skipped';
}

export interface Checkin extends CheckinData {
  id: string;
  trip_id: string;
  user_id: string;
  checked_in_at: string;
  created_at: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  city?: string;
  country?: string;
  address?: string;
}

// ==================== Trip API Functions ====================

/**
 * Start a new trip or resume existing
 */
export async function startTrip(
  routeId: string,
  itineraryId?: string
): Promise<{ success: boolean; tripId: string; trip: ActiveTrip; isNew: boolean; resumed: boolean }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${routeId}/start`, {
    method: 'POST',
    body: JSON.stringify({ itineraryId }),
  });
}

/**
 * Get user's currently active trip
 */
export async function getActiveTrip(): Promise<{ hasActiveTrip: boolean; trip: ActiveTrip | null }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/active`);
}

/**
 * Get trip by ID
 */
export async function getTripById(tripId: string): Promise<{ trip: ActiveTrip }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}`);
}

/**
 * Get today's activities for a trip
 */
export async function getTodayActivities(tripId: string): Promise<TodayData> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/today`);
}

/**
 * Get trip progress dashboard data
 */
export async function getTripProgress(tripId: string): Promise<TripProgress> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/progress`);
}

/**
 * Update trip location (GPS tracking)
 */
export async function updateTripLocation(
  tripId: string,
  locationData: LocationData
): Promise<{ success: boolean }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/location`, {
    method: 'POST',
    body: JSON.stringify(locationData),
  });
}

/**
 * Create a check-in
 */
export async function createCheckin(
  tripId: string,
  checkinData: CheckinData
): Promise<{ success: boolean; checkin: Checkin }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/checkin`, {
    method: 'POST',
    body: JSON.stringify(checkinData),
  });
}

/**
 * Get check-ins for a trip
 */
export async function getCheckins(
  tripId: string,
  options?: { dayNumber?: number; limit?: number }
): Promise<{ checkins: Checkin[] }> {
  const params = new URLSearchParams();
  if (options?.dayNumber) params.set('dayNumber', options.dayNumber.toString());
  if (options?.limit) params.set('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/trip/${tripId}/checkins${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth(url);
}

/**
 * Advance to the next day
 */
export async function advanceDay(tripId: string): Promise<{ success: boolean; currentDay: number }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/advance-day`, {
    method: 'POST',
  });
}

/**
 * Pause the trip
 */
export async function pauseTrip(tripId: string): Promise<{ success: boolean; trip: ActiveTrip }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/pause`, {
    method: 'POST',
  });
}

/**
 * Complete the trip
 */
export async function completeTrip(tripId: string): Promise<{ success: boolean; trip: ActiveTrip }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/complete`, {
    method: 'POST',
  });
}

/**
 * Update trip statistics
 */
export async function updateTripStats(
  tripId: string,
  stats: Partial<TripStats>
): Promise<{ success: boolean; stats: TripStats }> {
  return fetchWithAuth(`${API_BASE_URL}/trip/${tripId}/stats`, {
    method: 'POST',
    body: JSON.stringify(stats),
  });
}

// ==================== Utility Functions ====================

/**
 * Check if user has an active trip
 */
export async function hasActiveTrip(): Promise<boolean> {
  try {
    const result = await getActiveTrip();
    return result.hasActiveTrip;
  } catch {
    return false;
  }
}

/**
 * Get trip status label
 */
export function getTripStatusLabel(status: ActiveTrip['status']): string {
  switch (status) {
    case 'active':
      return 'In Progress';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate trip progress percentage
 */
export function calculateTripProgress(currentDay: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.min(100, Math.round((currentDay / totalDays) * 100));
}
