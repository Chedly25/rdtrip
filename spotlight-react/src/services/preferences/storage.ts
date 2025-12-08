/**
 * Preference Storage Service
 *
 * WI-4.2: Handles remote storage and sync for user preferences
 *
 * Architecture Decisions:
 * - Debounced sync: waits 2s after last change before syncing to reduce API calls
 * - Offline-first: local store works independently, syncs when connected
 * - Merge on fetch: remote data merges with local (stated preferences win)
 * - Error resilience: sync failures don't block local operations
 *
 * Sync Strategy:
 * 1. On app load: fetch remote, merge into local store
 * 2. On preference change: update local immediately, schedule debounced sync
 * 3. On explicit save: sync immediately
 * 4. On tab focus (if stale): fetch remote and merge
 */

import { type UserPreferences } from './types';
import { mergePreferences, serializePreferences, deserializePreferences } from './operations';
import {
  usePreferencesStore,
  type PreferencesState,
} from '../../stores/preferencesStore';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

/** Debounce delay for sync (ms) */
const SYNC_DEBOUNCE_MS = 2000;

/** Stale threshold for refetching (ms) - 5 minutes */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SyncOptions {
  /** Force immediate sync, bypassing debounce */
  immediate?: boolean;
  /** Skip the merge step (just save) */
  skipMerge?: boolean;
}

// ============================================================================
// Internal State
// ============================================================================

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastFetchTime: Date | null = null;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('rdtrip_auth_token') || localStorage.getItem('token');
}

/**
 * Build headers for API requests
 */
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch preferences from remote storage
 */
export async function fetchRemotePreferences(
  tripId?: string | null
): Promise<StorageResult<UserPreferences>> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const url = tripId
      ? `${API_BASE_URL}/preferences/${tripId}`
      : `${API_BASE_URL}/preferences`;

    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(),
    });

    if (response.status === 404) {
      // No preferences stored yet - not an error
      return { success: true, data: undefined };
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { success: false, error: error.message || `HTTP ${response.status}` };
    }

    const data = await response.json();

    // Deserialize to restore Date objects
    if (data.preferences) {
      const prefs = deserializePreferences(JSON.stringify(data.preferences));
      lastFetchTime = new Date();
      return { success: true, data: prefs };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('[PreferenceStorage] Fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Save preferences to remote storage
 */
export async function saveRemotePreferences(
  preferences: UserPreferences,
  tripId?: string | null
): Promise<StorageResult<void>> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const url = tripId
      ? `${API_BASE_URL}/preferences/${tripId}`
      : `${API_BASE_URL}/preferences`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({
        preferences: JSON.parse(serializePreferences(preferences)),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { success: false, error: error.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('[PreferenceStorage] Save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Delete trip-specific preferences from remote storage
 */
export async function deleteRemotePreferences(
  tripId: string
): Promise<StorageResult<void>> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/preferences/${tripId}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { success: false, error: error.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('[PreferenceStorage] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================================
// Sync Logic
// ============================================================================

/**
 * Sync local preferences to remote
 * Called after debounce on preference changes
 */
async function performSync(tripId?: string | null): Promise<void> {
  const store = usePreferencesStore.getState();

  // Get current preferences to sync
  const prefsToSync = tripId
    ? store.tripPreferences[tripId]
    : store.globalPreferences;

  if (!prefsToSync) {
    return;
  }

  store.setSyncStatus('syncing');

  const result = await saveRemotePreferences(prefsToSync, tripId);

  if (result.success) {
    store.markSynced();
  } else {
    store.setSyncStatus('error', result.error);
  }
}

/**
 * Schedule a debounced sync
 */
export function scheduleSyncDebounced(tripId?: string | null): void {
  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Schedule new sync
  syncTimeout = setTimeout(() => {
    performSync(tripId);
    syncTimeout = null;
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Sync immediately, bypassing debounce
 */
export async function syncNow(tripId?: string | null): Promise<StorageResult<void>> {
  // Clear any pending debounced sync
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  const store = usePreferencesStore.getState();
  const prefsToSync = tripId
    ? store.tripPreferences[tripId]
    : store.globalPreferences;

  if (!prefsToSync) {
    return { success: true };
  }

  store.setSyncStatus('syncing');

  const result = await saveRemotePreferences(prefsToSync, tripId);

  if (result.success) {
    store.markSynced();
  } else {
    store.setSyncStatus('error', result.error);
  }

  return result;
}

// ============================================================================
// Load & Merge
// ============================================================================

/**
 * Load preferences from remote and merge into local store
 * Call this on app initialization and when returning to app
 */
export async function loadAndMergePreferences(
  userId: string,
  tripId?: string | null
): Promise<StorageResult<UserPreferences>> {
  const store = usePreferencesStore.getState();

  // Initialize store with user ID
  store.initialize(userId, tripId);

  // Fetch from remote
  const globalResult = await fetchRemotePreferences(null);
  const tripResult = tripId ? await fetchRemotePreferences(tripId) : null;

  // Get current local preferences
  const localGlobal = store.globalPreferences;
  const localTrip = tripId ? store.tripPreferences[tripId] : null;

  // Merge remote into local (local stated preferences take priority)
  if (globalResult.success && globalResult.data) {
    const merged = localGlobal
      ? mergePreferences(globalResult.data, localGlobal)
      : globalResult.data;
    store.mergeIntoPreferences(merged, null);
  }

  if (tripResult?.success && tripResult.data && tripId) {
    const merged = localTrip
      ? mergePreferences(tripResult.data, localTrip)
      : tripResult.data;
    store.mergeIntoPreferences(merged, tripId);
  }

  // Mark as synced since we just loaded from remote
  store.markSynced();

  // Return effective preferences
  return {
    success: true,
    data: store.getEffectivePreferences(tripId),
  };
}

/**
 * Check if we should refetch from remote (data is stale)
 */
export function isStale(): boolean {
  if (!lastFetchTime) return true;
  return Date.now() - lastFetchTime.getTime() > STALE_THRESHOLD_MS;
}

/**
 * Refresh preferences if stale
 * Call this on tab focus or periodic intervals
 */
export async function refreshIfStale(
  userId: string,
  tripId?: string | null
): Promise<void> {
  if (isStale()) {
    await loadAndMergePreferences(userId, tripId);
  }
}

// ============================================================================
// Clear Operations
// ============================================================================

/**
 * Clear trip preferences both locally and remotely
 */
export async function clearTripPreferences(tripId: string): Promise<StorageResult<void>> {
  const store = usePreferencesStore.getState();

  // Clear locally
  store.clearTripPreferences(tripId);

  // Clear remotely
  const result = await deleteRemotePreferences(tripId);

  return result;
}

// ============================================================================
// Subscription Setup
// ============================================================================

/**
 * Subscribe to preference changes and auto-sync
 * Call this once on app initialization
 */
export function setupAutoSync(): () => void {
  const unsubscribe = usePreferencesStore.subscribe(
    (state: PreferencesState, prevState: PreferencesState) => {
      // Only sync if there are unsaved changes
      if (state.syncState.hasUnsavedChanges && !prevState.syncState.hasUnsavedChanges) {
        // Check if user is authenticated before syncing
        const token = getAuthToken();
        if (token) {
          scheduleSyncDebounced(state.activeTripId);
        }
      }
    }
  );

  // Also sync on page visibility change (when user returns)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const store = usePreferencesStore.getState();
      if (store.userId && isStale()) {
        loadAndMergePreferences(store.userId, store.activeTripId);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
  };
}

// ============================================================================
// Hook: usePreferenceSync
// ============================================================================

/**
 * React hook for preference sync status and operations
 */
export function usePreferenceSync() {
  const syncState = usePreferencesStore((state: PreferencesState) => state.syncState);
  const userId = usePreferencesStore((state: PreferencesState) => state.userId);
  const activeTripId = usePreferencesStore((state: PreferencesState) => state.activeTripId);

  return {
    ...syncState,
    isOnline: navigator.onLine,
    syncNow: () => syncNow(activeTripId),
    refresh: () => userId ? loadAndMergePreferences(userId, activeTripId) : Promise.resolve(),
    isStale: isStale(),
  };
}
