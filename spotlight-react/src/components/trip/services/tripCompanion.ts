/**
 * Trip Companion API Service
 *
 * Frontend API client for the Living Travel Companion features:
 * - Serendipity discoveries
 * - Smart time hints
 * - Trip moments
 * - Trip narratives
 */

const API_BASE = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

// Get auth token from localStorage
const getAuthHeader = (): { Authorization: string } | Record<string, never> => {
  const token = localStorage.getItem('waycraft_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch with auth and error handling
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// Types
export interface SerendipityCard {
  id: string;
  type: 'hidden_gem' | 'local_event' | 'photo_spot' | 'food_gem' | 'timing_tip';
  title: string;
  description?: string;
  whySpecial?: string;
  insiderTip?: string;
  bestTime?: string;
  photo?: string;
  rating?: number;
  distance?: number;
  walkingTime?: number;
  coordinates?: { lat: number; lng: number };
  serendipityScore?: number;
  source: 'google_places' | 'perplexity';
}

export interface SmartHint {
  type: 'departure' | 'crowd' | 'golden_hour' | 'weather' | 'closing';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  actionLabel?: string;
  expiresIn?: number; // minutes
}

export interface TripMoment {
  id: string;
  tripId: string;
  activityId?: string;
  activityName: string;
  momentType: 'highlight' | 'memory' | 'completed' | 'skipped' | 'discovery';
  note?: string;
  photoUrl?: string;
  rating?: number;
  coordinates?: { lat: number; lng: number };
  dayNumber: number;
  recordedAt: string;
  timeOfDay: string;
  narrativeSnippet?: string;
}

export interface TripNarrative {
  id: string;
  tripId: string;
  dayNumber: number;
  narrativeText: string;
  openingHook?: string;
  closingReflection?: string;
  keyMoments?: Array<{ time: string; snippet: string }>;
}

export interface WeatherAlternative {
  id: string;
  name: string;
  type: string;
  rating?: number;
  address?: string;
  photo?: string;
  reason: string;
}

// API Functions
export const tripCompanionApi = {
  /**
   * Discover nearby gems and hidden treasures
   */
  async getSerendipity(params: {
    tripId: string;
    lat: number;
    lng: number;
    radius?: number;
  }): Promise<{ discoveries: SerendipityCard[] }> {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      radius: (params.radius || 500).toString(),
    });

    return fetchWithAuth(
      `${API_BASE}/trip/${params.tripId}/serendipity?${searchParams}`
    );
  },

  /**
   * Get contextual smart hints for current activity
   */
  async getSmartHints(params: {
    tripId: string;
    activityId: string;
    currentTime?: string;
  }): Promise<{ hints: SmartHint[] }> {
    const searchParams = new URLSearchParams({
      activityId: params.activityId,
      currentTime: params.currentTime || new Date().toISOString(),
    });

    return fetchWithAuth(
      `${API_BASE}/trip/${params.tripId}/smart-hints?${searchParams}`
    );
  },

  /**
   * Record a trip moment (enhanced check-in)
   */
  async recordMoment(
    tripId: string,
    moment: {
      activityId?: string;
      activityName: string;
      momentType: 'highlight' | 'memory' | 'completed' | 'skipped' | 'discovery';
      note?: string;
      photo?: string;
      rating?: number;
      coordinates?: { lat: number; lng: number };
      dayNumber: number;
    }
  ): Promise<{ success: boolean; moment: TripMoment }> {
    return fetchWithAuth(`${API_BASE}/trip/${tripId}/moment`, {
      method: 'POST',
      body: JSON.stringify(moment),
    });
  },

  /**
   * Get all moments for a trip
   */
  async getMoments(
    tripId: string,
    dayNumber?: number
  ): Promise<{ moments: TripMoment[] }> {
    const params = dayNumber ? `?dayNumber=${dayNumber}` : '';
    return fetchWithAuth(`${API_BASE}/trip/${tripId}/moments${params}`);
  },

  /**
   * Get the evolving trip narrative for a day
   */
  async getNarrative(
    tripId: string,
    dayNumber?: number
  ): Promise<{ narrative: TripNarrative | null }> {
    const params = dayNumber ? `?dayNumber=${dayNumber}` : '';
    return fetchWithAuth(`${API_BASE}/trip/${tripId}/narrative${params}`);
  },

  /**
   * Get weather-aware alternatives for an activity
   */
  async getWeatherAlternatives(
    tripId: string,
    activityId: string,
    weatherCondition?: string
  ): Promise<{ alternatives: WeatherAlternative[] }> {
    const searchParams = new URLSearchParams({
      activityId,
      weatherCondition: weatherCondition || 'rain',
    });

    return fetchWithAuth(
      `${API_BASE}/trip/${tripId}/weather-alternatives?${searchParams}`
    );
  },
};

export default tripCompanionApi;
