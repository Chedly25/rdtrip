import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../services/analytics';
import type { EntryFormCompletedProperties } from '../services/analytics';

type EntryFormField = 'origin' | 'destination' | 'dates' | 'traveller_type';

interface FormCompletionData {
  travellerType: string;
  tripDurationNights: number;
  distanceKm: number;
  waypointsAdded?: number;
}

interface UseEntryFormAnalyticsReturn {
  /** Call when a field receives focus */
  trackFieldFocus: (field: EntryFormField) => void;
  /** Call when a field value is set/completed */
  trackFieldComplete: (field: EntryFormField) => void;
  /** Call when form is successfully submitted */
  trackFormComplete: (data: FormCompletionData) => void;
}

/**
 * Hook for tracking entry form analytics
 *
 * Tracks:
 * - form_started: When form mounts
 * - form_field_focused: When user focuses a field
 * - form_field_completed: When user completes a field
 * - form_completed: When form is successfully submitted
 * - form_abandoned: When user leaves without completing
 *
 * @example
 * function EntryForm() {
 *   const { trackFieldFocus, trackFieldComplete, trackFormComplete } = useEntryFormAnalytics();
 *
 *   const handleSubmit = (data) => {
 *     trackFormComplete({
 *       travellerType: data.travellerType,
 *       tripDurationNights: calculateNights(data.startDate, data.endDate),
 *       distanceKm: calculateDistance(data.origin, data.destination),
 *     });
 *     // ... submit logic
 *   };
 *
 *   return (
 *     <input
 *       onFocus={() => trackFieldFocus('origin')}
 *       onChange={(e) => { if (e.target.value) trackFieldComplete('origin'); }}
 *     />
 *   );
 * }
 */
export function useEntryFormAnalytics(): UseEntryFormAnalyticsReturn {
  const startTimeRef = useRef<number>(Date.now());
  const lastActiveFieldRef = useRef<EntryFormField | null>(null);
  const completedFieldsRef = useRef<Set<EntryFormField>>(new Set());
  const formCompletedRef = useRef<boolean>(false);

  // Track form started on mount
  useEffect(() => {
    startTimeRef.current = Date.now();

    analytics.track('entry_form_started', {
      startedAt: new Date().toISOString(),
    });

    // Cleanup: track abandonment if form not completed
    return () => {
      // Don't track abandonment if form was completed
      if (formCompletedRef.current) return;

      const timeSpentMs = Date.now() - startTimeRef.current;

      analytics.track('entry_form_abandoned', {
        timeSpentMs,
        lastActiveField: lastActiveFieldRef.current,
        fieldsCompleted: Array.from(completedFieldsRef.current),
        abandonmentTrigger: 'navigation',
      });
    };
  }, []);

  // Track abandonment via beforeunload (tab/window close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formCompletedRef.current) return;

      const timeSpentMs = Date.now() - startTimeRef.current;

      // Use sendBeacon for reliable tracking on page unload
      // Fall back to regular tracking if sendBeacon not available
      const payload = {
        event: 'entry_form_abandoned',
        properties: {
          timeSpentMs,
          lastActiveField: lastActiveFieldRef.current,
          fieldsCompleted: Array.from(completedFieldsRef.current),
          abandonmentTrigger: 'beforeunload' as const,
        },
      };

      // For now, just track normally - sendBeacon would need backend endpoint
      analytics.track('entry_form_abandoned', payload.properties);
    };

    const handleVisibilityChange = () => {
      // Track when tab becomes hidden (potential abandonment)
      if (document.visibilityState === 'hidden' && !formCompletedRef.current) {
        const timeSpentMs = Date.now() - startTimeRef.current;

        analytics.track('entry_form_abandoned', {
          timeSpentMs,
          lastActiveField: lastActiveFieldRef.current,
          fieldsCompleted: Array.from(completedFieldsRef.current),
          abandonmentTrigger: 'visibilitychange',
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const trackFieldFocus = useCallback((field: EntryFormField) => {
    lastActiveFieldRef.current = field;

    const timeSinceStartMs = Date.now() - startTimeRef.current;

    analytics.track('entry_form_field_focused', {
      field,
      timeSinceStartMs,
    });
  }, []);

  const trackFieldComplete = useCallback((field: EntryFormField) => {
    // Only track first completion of each field
    if (completedFieldsRef.current.has(field)) return;

    completedFieldsRef.current.add(field);

    const timeSinceStartMs = Date.now() - startTimeRef.current;

    analytics.track('entry_form_field_completed', {
      field,
      timeSinceStartMs,
    });
  }, []);

  const trackFormComplete = useCallback((data: FormCompletionData) => {
    formCompletedRef.current = true;

    const timeToCompleteMs = Date.now() - startTimeRef.current;

    const properties: EntryFormCompletedProperties = {
      timeToCompleteMs,
      travellerType: data.travellerType,
      tripDurationNights: data.tripDurationNights,
      distanceKm: Math.round(data.distanceKm),
      waypointsAdded: data.waypointsAdded ?? 0,
    };

    analytics.track('entry_form_completed', properties);
  }, []);

  return {
    trackFieldFocus,
    trackFieldComplete,
    trackFormComplete,
  };
}
