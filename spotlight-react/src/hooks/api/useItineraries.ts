/**
 * Itineraries API Hooks
 *
 * WI-12.2: React Query hooks for itinerary operations
 *
 * Provides typed hooks for CRUD operations on itineraries using Supabase.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  getTripItinerary,
  upsertItineraryDay,
  type Itinerary,
  type ItineraryInsert,
  type ItineraryUpdate,
  type ItineraryActivity,
} from '../../lib/supabase';
import { ApiError, supabaseErrorToApiError } from '../../services/api/errors';
import { withRateLimit, RATE_LIMITS } from '../../services/api/rateLimit';

// ============================================================================
// Query Keys
// ============================================================================

export const itineraryKeys = {
  all: ['itineraries'] as const,
  lists: () => [...itineraryKeys.all, 'list'] as const,
  list: (tripId: string) => [...itineraryKeys.lists(), tripId] as const,
  details: () => [...itineraryKeys.all, 'detail'] as const,
  detail: (id: string) => [...itineraryKeys.details(), id] as const,
  day: (tripId: string, dayNumber: number) =>
    [...itineraryKeys.list(tripId), 'day', dayNumber] as const,
};

// ============================================================================
// Rate-Limited Functions
// ============================================================================

const rateLimitedGetItinerary = withRateLimit(
  getTripItinerary,
  'itineraries:list',
  RATE_LIMITS.standard
);

const rateLimitedUpsertDay = withRateLimit(
  upsertItineraryDay,
  'itineraries:upsert',
  RATE_LIMITS.standard
);

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get full itinerary for a trip
 *
 * @example
 * const { data: itinerary, isLoading } = useItinerary(tripId);
 */
export function useItinerary(tripId: string | null | undefined) {
  return useQuery({
    queryKey: itineraryKeys.list(tripId!),
    queryFn: async () => {
      try {
        return await rateLimitedGetItinerary(tripId!);
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw supabaseErrorToApiError(error as { code?: string; message?: string });
      }
    },
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get a specific day's itinerary
 *
 * @example
 * const { data: day } = useItineraryDay(tripId, 1);
 */
export function useItineraryDay(
  tripId: string | null | undefined,
  dayNumber: number
) {
  const { data: itinerary, ...rest } = useItinerary(tripId);

  const day = Array.isArray(itinerary)
    ? itinerary.find((d: Itinerary) => d.day_number === dayNumber)
    : undefined;

  return {
    data: day,
    ...rest,
  };
}

/**
 * Get today's itinerary based on trip's current day
 */
export function useTodayItinerary(
  tripId: string | null | undefined,
  currentDay: number
) {
  return useItineraryDay(tripId, currentDay);
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Upsert an itinerary day
 *
 * @example
 * const upsertDay = useUpsertItineraryDay();
 * await upsertDay.mutateAsync({
 *   trip_id: 'xxx',
 *   day_number: 1,
 *   city_id: 'paris',
 *   city_name: 'Paris',
 *   morning_activities: [...],
 * });
 */
export function useUpsertItineraryDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itinerary: ItineraryInsert) => {
      try {
        return await rateLimitedUpsertDay(itinerary);
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw supabaseErrorToApiError(error as { code?: string; message?: string });
      }
    },
    onSuccess: (updatedDay: Itinerary) => {
      // Invalidate the trip's itinerary
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.list(updatedDay.trip_id),
      });
    },
  });
}

/**
 * Update a specific itinerary day
 */
export function useUpdateItineraryDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      tripId,
      updates,
    }: {
      itineraryId: string;
      tripId: string;
      updates: ItineraryUpdate;
    }) => {
      const { data, error } = await supabase
        .from('itineraries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itineraryId)
        .select()
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }
      return { ...data, tripId } as Itinerary & { tripId: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.list(result.tripId),
      });
    },
  });
}

/**
 * Delete an itinerary day
 */
export function useDeleteItineraryDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      tripId,
    }: {
      itineraryId: string;
      tripId: string;
    }) => {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', itineraryId);

      if (error) {
        throw supabaseErrorToApiError(error);
      }
      return { itineraryId, tripId };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.list(tripId),
      });
    },
  });
}

/**
 * Mark an activity as completed
 *
 * @example
 * const markComplete = useMarkActivityComplete();
 * await markComplete.mutateAsync({
 *   tripId: 'xxx',
 *   itineraryId: 'yyy',
 *   activityId: 'zzz',
 * });
 */
export function useMarkActivityComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      itineraryId,
      activityId,
    }: {
      tripId: string;
      itineraryId: string;
      activityId: string;
    }) => {
      // First get current completed activities
      const { data: current, error: fetchError } = await supabase
        .from('itineraries')
        .select('completed_activities')
        .eq('id', itineraryId)
        .single();

      if (fetchError) {
        throw supabaseErrorToApiError(fetchError);
      }

      const completedActivities = (current.completed_activities || []) as string[];
      if (!completedActivities.includes(activityId)) {
        completedActivities.push(activityId);
      }

      const { data, error } = await supabase
        .from('itineraries')
        .update({ completed_activities: completedActivities })
        .eq('id', itineraryId)
        .select()
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }

      return { ...data, tripId } as Itinerary & { tripId: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.list(result.tripId),
      });
    },
  });
}

/**
 * Unmark an activity as completed
 */
export function useUnmarkActivityComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      itineraryId,
      activityId,
    }: {
      tripId: string;
      itineraryId: string;
      activityId: string;
    }) => {
      const { data: current, error: fetchError } = await supabase
        .from('itineraries')
        .select('completed_activities')
        .eq('id', itineraryId)
        .single();

      if (fetchError) {
        throw supabaseErrorToApiError(fetchError);
      }

      const completedActivities = ((current.completed_activities || []) as string[]).filter(
        (id) => id !== activityId
      );

      const { data, error } = await supabase
        .from('itineraries')
        .update({ completed_activities: completedActivities })
        .eq('id', itineraryId)
        .select()
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }

      return { ...data, tripId } as Itinerary & { tripId: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.list(result.tripId),
      });
    },
  });
}

/**
 * Reorder activities within a time slot
 */
export function useReorderActivities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      itineraryId,
      timeSlot,
      activities,
    }: {
      tripId: string;
      itineraryId: string;
      timeSlot: 'morning_activities' | 'afternoon_activities' | 'evening_activities';
      activities: ItineraryActivity[];
    }) => {
      const { data, error } = await supabase
        .from('itineraries')
        .update({
          [timeSlot]: activities,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itineraryId)
        .select()
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }

      return { ...data, tripId } as Itinerary & { tripId: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.list(result.tripId),
      });
    },
  });
}

/**
 * Add user notes to a day
 */
export function useAddDayNotes() {
  const updateDay = useUpdateItineraryDay();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      tripId,
      notes,
    }: {
      itineraryId: string;
      tripId: string;
      notes: string;
    }) => {
      return updateDay.mutateAsync({
        itineraryId,
        tripId,
        updates: { user_notes: notes },
      });
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate itinerary completion percentage
 */
export function calculateItineraryProgress(itinerary: Itinerary[]): number {
  if (!itinerary.length) return 0;

  let totalActivities = 0;
  let completedActivities = 0;

  itinerary.forEach((day) => {
    const dayActivities = [
      ...(day.morning_activities || []),
      ...(day.afternoon_activities || []),
      ...(day.evening_activities || []),
    ];

    totalActivities += dayActivities.length;
    completedActivities += (day.completed_activities || []).length;
  });

  if (totalActivities === 0) return 0;
  return Math.round((completedActivities / totalActivities) * 100);
}

/**
 * Get all activities for a day flattened
 */
export function getAllDayActivities(day: Itinerary): ItineraryActivity[] {
  return [
    ...(day.morning_activities || []),
    ...(day.afternoon_activities || []),
    ...(day.evening_activities || []),
  ];
}
