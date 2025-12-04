/**
 * Offline Manager - Traveler's Safety Net
 *
 * A service and hook for managing offline data during trips.
 * Caches trip data to IndexedDB and syncs when back online.
 *
 * Design: "Prepared Traveler" - reliable, trustworthy, always ready
 *
 * Features:
 * - IndexedDB storage for trip data
 * - Automatic sync when online
 * - Pending actions queue
 * - Storage estimation
 * - Online/offline detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for offline data
export interface OfflineTripData {
  tripId: string;
  downloadedAt: string;
  expiresAt: string;
  data: {
    route: unknown;
    itinerary: unknown;
    currentDay: number;
    cities: Array<{
      name: string;
      activities: unknown[];
    }>;
  };
  size: number; // bytes
}

export interface PendingAction {
  id: string;
  type: 'checkin' | 'note' | 'photo' | 'rating';
  payload: unknown;
  timestamp: string;
  retries: number;
}

export interface OfflineState {
  isOnline: boolean;
  isDownloaded: boolean;
  lastSyncAt: string | null;
  pendingActions: PendingAction[];
  storageUsed: number;
  storageAvailable: number;
  downloadProgress: number;
  isSyncing: boolean;
  isDownloading: boolean;
}

// IndexedDB database name and version
const DB_NAME = 'rdtrip-offline';
const DB_VERSION = 1;
const STORE_NAME = 'trip-data';
const PENDING_STORE = 'pending-actions';

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Trip data store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tripId' });
      }

      // Pending actions store
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = db.createObjectStore(PENDING_STORE, { keyPath: 'id' });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Get trip data from IndexedDB
const getTripData = async (tripId: string): Promise<OfflineTripData | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(tripId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

// Save trip data to IndexedDB
const saveTripData = async (data: OfflineTripData): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Delete trip data from IndexedDB
const deleteTripData = async (tripId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(tripId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Get pending actions
const getPendingActions = async (): Promise<PendingAction[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PENDING_STORE, 'readonly');
    const store = transaction.objectStore(PENDING_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};

// Add pending action
const addPendingAction = async (action: PendingAction): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PENDING_STORE, 'readwrite');
    const store = transaction.objectStore(PENDING_STORE);
    const request = store.put(action);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Remove pending action
const removePendingAction = async (actionId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PENDING_STORE, 'readwrite');
    const store = transaction.objectStore(PENDING_STORE);
    const request = store.delete(actionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Estimate storage
const getStorageEstimate = async (): Promise<{ used: number; available: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  }
  return { used: 0, available: 0 };
};

// Custom hook for offline management
export const useOfflineManager = (tripId: string | null) => {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isDownloaded: false,
    lastSyncAt: null,
    pendingActions: [],
    storageUsed: 0,
    storageAvailable: 0,
    downloadProgress: 0,
    isSyncing: false,
    isDownloading: false,
  });

  const syncInProgress = useRef(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      if (!tripId) return;

      try {
        const [tripData, pending, storage] = await Promise.all([
          getTripData(tripId),
          getPendingActions(),
          getStorageEstimate(),
        ]);

        setState((s) => ({
          ...s,
          isDownloaded: !!tripData,
          lastSyncAt: tripData?.downloadedAt || null,
          pendingActions: pending,
          storageUsed: storage.used,
          storageAvailable: storage.available,
        }));
      } catch (error) {
        console.error('Failed to load offline state:', error);
      }
    };

    loadState();
  }, [tripId]);

  // Download trip for offline use
  const downloadTrip = useCallback(
    async (tripData: OfflineTripData['data'], onProgress?: (progress: number) => void) => {
      if (!tripId) return;

      setState((s) => ({ ...s, isDownloading: true, downloadProgress: 0 }));

      try {
        // Simulate download progress (in real app, this would track actual data fetching)
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((r) => setTimeout(r, 100));
          setState((s) => ({ ...s, downloadProgress: i }));
          onProgress?.(i);
        }

        const offlineData: OfflineTripData = {
          tripId,
          downloadedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          data: tripData,
          size: JSON.stringify(tripData).length,
        };

        await saveTripData(offlineData);

        const storage = await getStorageEstimate();

        setState((s) => ({
          ...s,
          isDownloaded: true,
          isDownloading: false,
          downloadProgress: 100,
          lastSyncAt: offlineData.downloadedAt,
          storageUsed: storage.used,
        }));
      } catch (error) {
        console.error('Failed to download trip:', error);
        setState((s) => ({ ...s, isDownloading: false, downloadProgress: 0 }));
        throw error;
      }
    },
    [tripId]
  );

  // Delete offline data
  const deleteOfflineData = useCallback(async () => {
    if (!tripId) return;

    try {
      await deleteTripData(tripId);
      const storage = await getStorageEstimate();

      setState((s) => ({
        ...s,
        isDownloaded: false,
        lastSyncAt: null,
        storageUsed: storage.used,
      }));
    } catch (error) {
      console.error('Failed to delete offline data:', error);
      throw error;
    }
  }, [tripId]);

  // Queue action for sync
  const queueAction = useCallback(
    async (type: PendingAction['type'], payload: unknown) => {
      const action: PendingAction = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        timestamp: new Date().toISOString(),
        retries: 0,
      };

      await addPendingAction(action);
      setState((s) => ({
        ...s,
        pendingActions: [...s.pendingActions, action],
      }));

      // Try to sync immediately if online
      if (state.isOnline) {
        syncPendingActions();
      }
    },
    [state.isOnline]
  );

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (syncInProgress.current || !state.isOnline || state.pendingActions.length === 0) {
      return;
    }

    syncInProgress.current = true;
    setState((s) => ({ ...s, isSyncing: true }));

    try {
      for (const action of state.pendingActions) {
        try {
          // In real app, this would call the API
          // await api.syncAction(action);
          await new Promise((r) => setTimeout(r, 500)); // Simulate API call

          await removePendingAction(action.id);
          setState((s) => ({
            ...s,
            pendingActions: s.pendingActions.filter((a) => a.id !== action.id),
          }));
        } catch {
          // Update retry count
          const updatedAction = { ...action, retries: action.retries + 1 };
          await addPendingAction(updatedAction);
        }
      }

      setState((s) => ({
        ...s,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
      }));
    } finally {
      syncInProgress.current = false;
    }
  }, [state.isOnline, state.pendingActions]);

  // Auto-sync when coming online
  useEffect(() => {
    if (state.isOnline && state.pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [state.isOnline, syncPendingActions, state.pendingActions.length]);

  // Get cached trip data
  const getCachedTrip = useCallback(async (): Promise<OfflineTripData['data'] | null> => {
    if (!tripId) return null;

    try {
      const data = await getTripData(tripId);
      if (data && new Date(data.expiresAt) > new Date()) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [tripId]);

  return {
    ...state,
    downloadTrip,
    deleteOfflineData,
    queueAction,
    syncPendingActions,
    getCachedTrip,
  };
};

export default useOfflineManager;
