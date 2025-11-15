/**
 * useAutoSave Hook
 * Phase 3: Navigation Redesign - Auto-Save & Route Persistence
 *
 * Auto-saves route data to the server after 2 seconds of inactivity
 */

import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

export function useAutoSave(
  tripId: string | null,
  routeData: any,
  enabled: boolean = true
) {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedDataRef = useRef<string | null>(null);

  // Debounced save function
  const debouncedSave = useRef(
    debounce(async (tripId: string, data: any) => {
      try {
        setIsSaving(true);
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`/api/my-trips/${tripId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            route_data: data
          })
        });

        if (response.ok) {
          const now = new Date().toISOString();
          setLastSaved(now);
          lastSavedDataRef.current = JSON.stringify(data);
          console.log('✅ Auto-saved at', now);

          // Show toast notification
          showToast('Changes saved automatically');
        } else {
          console.error('Auto-save failed:', response.statusText);
          showToast('Failed to save changes', 'error');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        showToast('Failed to save changes', 'error');
      } finally {
        setIsSaving(false);
      }
    }, 2000) // 2 second debounce
  ).current;

  useEffect(() => {
    if (!enabled || !tripId || !routeData) return;

    // Don't save if data hasn't changed
    const currentDataHash = JSON.stringify(routeData);
    if (currentDataHash === lastSavedDataRef.current) return;

    // Trigger debounced save
    debouncedSave(tripId, routeData);

    return () => {
      debouncedSave.cancel();
    };
  }, [tripId, routeData, enabled, debouncedSave]);

  return {
    lastSaved,
    isSaving
  };
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity ${
    type === 'success'
      ? 'bg-gray-900 text-white'
      : 'bg-red-600 text-white'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
