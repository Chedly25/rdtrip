/**
 * Trips API Hooks
 *
 * WI-12.2: React Query hooks for trip operations
 *
 * Provides typed hooks for CRUD operations on trips using Supabase.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  getUserTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getCurrentUser,
  type Trip,
  type TripInsert,
  type TripUpdate,
  type TripStatus,
} from '../../lib/supabase';
import { ApiError, API_ERROR_CODES, supabaseErrorToApiError } from '../../services/api/errors';
import {
  withRateLimit,
  RATE_LIMITS,
} from '../../services/api/rateLimit';

// ============================================================================
// Query Keys
// ============================================================================

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: { userId?: string; status?: TripStatus }) =>
    [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
};

// ============================================================================
// Rate-Limited Functions
// ============================================================================

const rateLimitedGetTrips = withRateLimit(
  getUserTrips,
  'trips:list',
  RATE_LIMITS.standard
);

const rateLimitedGetTrip = withRateLimit(
  getTrip,
  'trips:get',
  RATE_LIMITS.standard
);

const rateLimitedCreateTrip = withRateLimit(
  createTrip,
  'trips:create',
  RATE_LIMITS.heavy
);

const rateLimitedUpdateTrip = withRateLimit(
  updateTrip,
  'trips:update',
  RATE_LIMITS.standard
);

const rateLimitedDeleteTrip = withRateLimit(
  deleteTrip,
  'trips:delete',
  RATE_LIMITS.heavy
);

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all trips for current user
 *
 * @example
 * const { data: trips, isLoading } = useTrips();
 * const { data: activeTrips } = useTrips({ status: 'active' });
 */
export function useTrips(options?: {
  status?: TripStatus;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: tripKeys.list({ status: options?.status }),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      try {
        return await rateLimitedGetTrips(user.id, {
          status: options?.status,
          limit: options?.limit,
        });
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw supabaseErrorToApiError(error as { code?: string; message?: string });
      }
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Get a single trip by ID
 *
 * @example
 * const { data: trip, isLoading } = useTrip(tripId);
 */
export function useTrip(tripId: string | null | undefined) {
  return useQuery({
    queryKey: tripKeys.detail(tripId!),
    queryFn: async () => {
      try {
        const trip = await rateLimitedGetTrip(tripId!);
        if (!trip) {
          throw new ApiError(API_ERROR_CODES.NOT_FOUND, 'Trip not found');
        }
        return trip;
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
 * Get trip by share token (for public trips)
 */
export function useSharedTrip(shareToken: string | null | undefined) {
  return useQuery({
    queryKey: ['trips', 'shared', shareToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('share_token', shareToken!)
        .eq('is_public', true)
        .is('deleted_at', null)
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }
      return data as Trip;
    },
    enabled: !!shareToken,
    staleTime: 10 * 60 * 1000, // 10 minutes for shared trips
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new trip
 *
 * @example
 * const createTrip = useCreateTrip();
 * await createTrip.mutateAsync({
 *   origin: 'Paris',
 *   destination: 'Rome',
 *   traveller_type: 'couple',
 * });
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: Omit<TripInsert, 'user_id'>) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      try {
        return await rateLimitedCreateTrip({
          ...trip,
          user_id: user.id,
        });
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw supabaseErrorToApiError(error as { code?: string; message?: string });
      }
    },
    onSuccess: (newTrip: Trip) => {
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      // Optionally set the new trip in cache
      queryClient.setQueryData(tripKeys.detail(newTrip.id), newTrip);
    },
  });
}

/**
 * Update an existing trip
 *
 * @example
 * const updateTrip = useUpdateTrip();
 * await updateTrip.mutateAsync({
 *   tripId: 'xxx',
 *   updates: { name: 'Summer Adventure' },
 * });
 */
export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      updates,
    }: {
      tripId: string;
      updates: TripUpdate;
    }) => {
      try {
        return await rateLimitedUpdateTrip(tripId, updates);
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw supabaseErrorToApiError(error as { code?: string; message?: string });
      }
    },
    onSuccess: (updatedTrip: Trip) => {
      // Update the specific trip in cache
      queryClient.setQueryData(tripKeys.detail(updatedTrip.id), updatedTrip);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

/**
 * Delete a trip (soft delete)
 *
 * @example
 * const deleteTrip = useDeleteTrip();
 * await deleteTrip.mutateAsync(tripId);
 */
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      try {
        await rateLimitedDeleteTrip(tripId);
        return tripId;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw supabaseErrorToApiError(error as { code?: string; message?: string });
      }
    },
    onSuccess: (tripId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

/**
 * Update trip status
 *
 * @example
 * const updateStatus = useUpdateTripStatus();
 * await updateStatus.mutateAsync({ tripId: 'xxx', status: 'active' });
 */
export function useUpdateTripStatus() {
  const updateTrip = useUpdateTrip();

  return useMutation({
    mutationFn: async ({
      tripId,
      status,
    }: {
      tripId: string;
      status: TripStatus;
    }) => {
      const updates: TripUpdate = { status };

      // Add timestamps based on status
      if (status === 'active') {
        updates.trip_started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.trip_completed_at = new Date().toISOString();
      }

      return updateTrip.mutateAsync({ tripId, updates });
    },
  });
}

/**
 * Generate or update share token
 */
export function useShareTrip() {
  const updateTrip = useUpdateTrip();

  return useMutation({
    mutationFn: async ({
      tripId,
      isPublic,
    }: {
      tripId: string;
      isPublic: boolean;
    }) => {
      const updates: TripUpdate = {
        is_public: isPublic,
        share_token: isPublic ? crypto.randomUUID() : null,
      };

      return updateTrip.mutateAsync({ tripId, updates });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get active trip (if any)
 */
export function useActiveTrip() {
  return useTrips({
    status: 'active',
    limit: 1,
  });
}

/**
 * Check if user has any trips
 */
export function useHasTrips() {
  const { data: trips, isLoading } = useTrips({ limit: 1 });

  return {
    hasTrips: Array.isArray(trips) && trips.length > 0,
    isLoading,
  };
}

/**
 * Prefetch a trip (for navigation optimization)
 */
export function usePrefetchTrip() {
  const queryClient = useQueryClient();

  return (tripId: string) => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(tripId),
      queryFn: () => rateLimitedGetTrip(tripId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
