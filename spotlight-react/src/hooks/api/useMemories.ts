/**
 * Memories API Hooks
 *
 * WI-12.2: React Query hooks for memory operations
 *
 * Provides hooks for managing post-trip memories, highlights,
 * and cross-trip user memory (preferences learned over time).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  getCurrentUser,
  type Memory,
  type MemoryInsert,
  type MemoryUpdate,
  type MemoryHighlight,
  type MemoryPhoto,
  type TripStats,
} from '../../lib/supabase';
import { ApiError, API_ERROR_CODES, supabaseErrorToApiError } from '../../services/api/errors';
import { withRateLimit, RATE_LIMITS } from '../../services/api/rateLimit';

// ============================================================================
// Query Keys
// ============================================================================

export const memoryKeys = {
  all: ['memories'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (userId?: string) => [...memoryKeys.lists(), userId] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (memoryId: string) => [...memoryKeys.details(), memoryId] as const,
  forTrip: (tripId: string) => [...memoryKeys.all, 'trip', tripId] as const,
  shared: (shareToken: string) => [...memoryKeys.all, 'shared', shareToken] as const,
  userMemory: (userId: string) => [...memoryKeys.all, 'user-memory', userId] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function getMemories(userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw supabaseErrorToApiError(error);
  }

  return (data || []) as Memory[];
}

async function getMemory(memoryId: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', memoryId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw supabaseErrorToApiError(error);
  }

  return data as Memory;
}

async function getTripMemory(tripId: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('trip_id', tripId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw supabaseErrorToApiError(error);
  }

  return data as Memory;
}

async function createMemory(memory: MemoryInsert): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert(memory)
    .select()
    .single();

  if (error) {
    throw supabaseErrorToApiError(error);
  }

  return data as Memory;
}

async function updateMemory(memoryId: string, updates: MemoryUpdate): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    throw supabaseErrorToApiError(error);
  }

  return data as Memory;
}

async function deleteMemory(memoryId: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    throw supabaseErrorToApiError(error);
  }
}

// Rate-limited versions
const rateLimitedGetMemories = withRateLimit(getMemories, 'memories:list', RATE_LIMITS.standard);
const rateLimitedCreateMemory = withRateLimit(createMemory, 'memories:create', RATE_LIMITS.heavy);
const rateLimitedUpdateMemory = withRateLimit(updateMemory, 'memories:update', RATE_LIMITS.standard);

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all memories for current user
 *
 * @example
 * const { data: memories } = useMemories();
 */
export function useMemories() {
  return useQuery({
    queryKey: memoryKeys.lists(),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      return rateLimitedGetMemories(user.id);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get a single memory by ID
 *
 * @example
 * const { data: memory } = useMemory(memoryId);
 */
export function useMemory(memoryId: string | null | undefined) {
  return useQuery({
    queryKey: memoryKeys.detail(memoryId!),
    queryFn: async () => {
      const memory = await getMemory(memoryId!);
      if (!memory) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND, 'Memory not found');
      }
      return memory;
    },
    enabled: !!memoryId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get memory for a specific trip
 *
 * @example
 * const { data: memory } = useTripMemory(tripId);
 */
export function useTripMemory(tripId: string | null | undefined) {
  return useQuery({
    queryKey: memoryKeys.forTrip(tripId!),
    queryFn: () => getTripMemory(tripId!),
    enabled: !!tripId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get shared memory by token
 *
 * @example
 * const { data: memory } = useSharedMemory(shareToken);
 */
export function useSharedMemory(shareToken: string | null | undefined) {
  return useQuery({
    queryKey: memoryKeys.shared(shareToken!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('share_token', shareToken!)
        .eq('is_public', true)
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }

      // Increment view count
      await supabase
        .from('memories')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data as Memory;
    },
    enabled: !!shareToken,
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new memory for a trip
 *
 * @example
 * const createMemory = useCreateMemory();
 * await createMemory.mutateAsync({
 *   trip_id: 'xxx',
 *   trip_summary: 'Amazing trip!',
 * });
 */
export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memory: Omit<MemoryInsert, 'user_id'>) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      return rateLimitedCreateMemory({
        ...memory,
        user_id: user.id,
      });
    },
    onSuccess: (newMemory: Memory) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
      queryClient.setQueryData(memoryKeys.detail(newMemory.id), newMemory);
      queryClient.setQueryData(memoryKeys.forTrip(newMemory.trip_id), newMemory);
    },
  });
}

/**
 * Update an existing memory
 */
export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memoryId,
      updates,
    }: {
      memoryId: string;
      updates: MemoryUpdate;
    }) => {
      return rateLimitedUpdateMemory(memoryId, updates);
    },
    onSuccess: (updatedMemory: Memory) => {
      queryClient.setQueryData(memoryKeys.detail(updatedMemory.id), updatedMemory);
      queryClient.setQueryData(memoryKeys.forTrip(updatedMemory.trip_id), updatedMemory);
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
    },
  });
}

/**
 * Delete a memory
 */
export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memoryId: string) => {
      await deleteMemory(memoryId);
      return memoryId;
    },
    onSuccess: (memoryId) => {
      queryClient.removeQueries({ queryKey: memoryKeys.detail(memoryId) });
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
    },
  });
}

/**
 * Add a highlight to a memory
 */
export function useAddHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memoryId,
      highlight,
    }: {
      memoryId: string;
      highlight: MemoryHighlight;
    }) => {
      const memory = await getMemory(memoryId);
      if (!memory) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND);
      }

      const highlights = [...(memory.highlights || []), highlight];
      return updateMemory(memoryId, { highlights });
    },
    onSuccess: (updatedMemory) => {
      queryClient.setQueryData(memoryKeys.detail(updatedMemory.id), updatedMemory);
      queryClient.setQueryData(memoryKeys.forTrip(updatedMemory.trip_id), updatedMemory);
    },
  });
}

/**
 * Remove a highlight from a memory
 */
export function useRemoveHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memoryId,
      highlightIndex,
    }: {
      memoryId: string;
      highlightIndex: number;
    }) => {
      const memory = await getMemory(memoryId);
      if (!memory) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND);
      }

      const highlights = (memory.highlights || []).filter((_, i) => i !== highlightIndex);
      return updateMemory(memoryId, { highlights });
    },
    onSuccess: (updatedMemory) => {
      queryClient.setQueryData(memoryKeys.detail(updatedMemory.id), updatedMemory);
    },
  });
}

/**
 * Add a photo to a memory
 */
export function useAddPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memoryId,
      photo,
    }: {
      memoryId: string;
      photo: MemoryPhoto;
    }) => {
      const memory = await getMemory(memoryId);
      if (!memory) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND);
      }

      const photos = [...(memory.photos || []), photo];
      return updateMemory(memoryId, { photos });
    },
    onSuccess: (updatedMemory) => {
      queryClient.setQueryData(memoryKeys.detail(updatedMemory.id), updatedMemory);
    },
  });
}

/**
 * Update memory stats
 */
export function useUpdateMemoryStats() {
  const updateMemory = useUpdateMemory();

  return useMutation({
    mutationFn: async ({
      memoryId,
      stats,
    }: {
      memoryId: string;
      stats: Partial<TripStats>;
    }) => {
      const memory = await getMemory(memoryId);
      if (!memory) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND);
      }

      const updatedStats = { ...memory.stats, ...stats };
      return updateMemory.mutateAsync({
        memoryId,
        updates: { stats: updatedStats },
      });
    },
  });
}

/**
 * Share/unshare a memory
 */
export function useShareMemory() {
  const updateMemory = useUpdateMemory();

  return useMutation({
    mutationFn: async ({
      memoryId,
      isPublic,
    }: {
      memoryId: string;
      isPublic: boolean;
    }) => {
      const updates: MemoryUpdate = {
        is_public: isPublic,
        share_token: isPublic ? crypto.randomUUID() : null,
      };

      return updateMemory.mutateAsync({ memoryId, updates });
    },
  });
}

/**
 * Generate AI summary for memory
 */
export function useGenerateMemorySummary() {
  const updateMemory = useUpdateMemory();

  return useMutation({
    mutationFn: async (memoryId: string) => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';

      const response = await fetch(`${apiUrl}/memory/${memoryId}/generate-summary`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new ApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to generate summary');
      }

      const { summary } = await response.json();

      return updateMemory.mutateAsync({
        memoryId,
        updates: { ai_generated_summary: summary },
      });
    },
  });
}

// ============================================================================
// Cross-Trip Memory (Preferences learned over time)
// ============================================================================

export interface UserMemory {
  visitedCities: string[];
  favoriteCategories: string[];
  avoidCategories: string[];
  preferredPace: string;
  typicalBudget: string;
  dietaryPreferences: string[];
  accessibilityNeeds: string[];
  unfinishedBusiness: Array<{
    type: 'city' | 'place' | 'activity';
    name: string;
    reason?: string;
    mentionedAt: string;
  }>;
}

/**
 * Get user's cross-trip memory (learned preferences)
 */
export function useUserMemory() {
  return useQuery({
    queryKey: ['user-memory'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return null;

      // Get from preferences with historical sources
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .is('trip_id', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw supabaseErrorToApiError(error);
      }

      // Get all past trips for visited cities
      const { data: trips } = await supabase
        .from('trips')
        .select('selected_cities, status')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const visitedCities = new Set<string>();
      trips?.forEach((trip) => {
        const cities = trip.selected_cities as Array<{ name: string }> || [];
        cities.forEach((city) => visitedCities.add(city.name));
      });

      return {
        preferences: data,
        visitedCities: Array.from(visitedCities),
        tripCount: trips?.length || 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate memory completeness percentage
 */
export function calculateMemoryCompleteness(memory: Memory): number {
  let score = 0;
  const maxScore = 100;

  if (memory.trip_summary) score += 20;
  if (memory.ai_generated_summary) score += 10;
  if (memory.cover_photo_url) score += 15;
  if ((memory.highlights?.length || 0) >= 3) score += 20;
  if ((memory.photos?.length || 0) >= 5) score += 15;
  if (memory.stats && Object.keys(memory.stats).length >= 3) score += 20;

  return Math.min(score, maxScore);
}

/**
 * Get memory preview text
 */
export function getMemoryPreview(memory: Memory, maxLength = 100): string {
  const text = memory.trip_summary || memory.ai_generated_summary || '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
