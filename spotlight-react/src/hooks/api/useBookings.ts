/**
 * Bookings API Hooks
 *
 * WI-12.2: React Query hooks for booking tracking operations
 *
 * Provides hooks for tracking affiliate bookings, conversions,
 * and generating booking analytics.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  getCurrentUser,
  trackBookingClick,
  recordBookingConversion,
  type Booking,
  type BookingInsert,
  type BookingPlatform,
} from '../../lib/supabase';
import { ApiError, API_ERROR_CODES, supabaseErrorToApiError } from '../../services/api/errors';
import { withRateLimit, RATE_LIMITS } from '../../services/api/rateLimit';

// ============================================================================
// Query Keys
// ============================================================================

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters?: { tripId?: string; platform?: BookingPlatform }) =>
    [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  analytics: (userId?: string) => [...bookingKeys.all, 'analytics', userId] as const,
};

// ============================================================================
// Rate-Limited Functions
// ============================================================================

const rateLimitedTrackClick = withRateLimit(
  trackBookingClick,
  'bookings:click',
  RATE_LIMITS.standard
);

const rateLimitedRecordConversion = withRateLimit(
  recordBookingConversion,
  'bookings:conversion',
  RATE_LIMITS.heavy
);

// ============================================================================
// API Functions
// ============================================================================

async function getBookings(
  userId: string,
  options?: {
    tripId?: string;
    platform?: BookingPlatform;
    convertedOnly?: boolean;
    limit?: number;
  }
): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('clicked_at', { ascending: false });

  if (options?.tripId) {
    query = query.eq('trip_id', options.tripId);
  }

  if (options?.platform) {
    query = query.eq('platform', options.platform);
  }

  if (options?.convertedOnly) {
    query = query.not('converted_at', 'is', null);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw supabaseErrorToApiError(error);
  }

  return (data || []) as Booking[];
}

async function getBooking(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw supabaseErrorToApiError(error);
  }

  return data as Booking;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all bookings for current user
 *
 * @example
 * const { data: bookings } = useBookings();
 * const { data: tripBookings } = useBookings({ tripId: 'xxx' });
 */
export function useBookings(options?: {
  tripId?: string;
  platform?: BookingPlatform;
  convertedOnly?: boolean;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: bookingKeys.list({
      tripId: options?.tripId,
      platform: options?.platform,
    }),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      return getBookings(user.id, options);
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get bookings for a specific trip
 */
export function useTripBookings(tripId: string | null | undefined) {
  return useBookings({
    tripId: tripId || undefined,
    enabled: !!tripId,
  });
}

/**
 * Get booking by ID
 */
export function useBooking(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId!),
    queryFn: async () => {
      const booking = await getBooking(bookingId!);
      if (!booking) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND, 'Booking not found');
      }
      return booking;
    },
    enabled: !!bookingId,
  });
}

/**
 * Get booking analytics for dashboard
 */
export function useBookingAnalytics() {
  return useQuery({
    queryKey: bookingKeys.analytics(),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      const bookings = await getBookings(user.id);

      // Calculate analytics
      const totalClicks = bookings.length;
      const conversions = bookings.filter((b) => b.converted_at);
      const totalConversions = conversions.length;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      const totalRevenue = conversions.reduce(
        (sum, b) => sum + (b.conversion_value || 0),
        0
      );

      // Group by platform
      const byPlatform = bookings.reduce(
        (acc, b) => {
          acc[b.platform] = (acc[b.platform] || 0) + 1;
          return acc;
        },
        {} as Record<BookingPlatform, number>
      );

      // Group by place type
      const byPlaceType = bookings.reduce(
        (acc, b) => {
          const type = b.place_type || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentBookings = bookings.filter(
        (b) => new Date(b.clicked_at) > sevenDaysAgo
      );

      return {
        totalClicks,
        totalConversions,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalRevenue,
        byPlatform,
        byPlaceType,
        recentActivityCount: recentBookings.length,
        avgConversionValue:
          totalConversions > 0
            ? Math.round(totalRevenue / totalConversions)
            : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Track a booking click (when user clicks affiliate link)
 *
 * @example
 * const trackClick = useTrackBookingClick();
 * await trackClick.mutateAsync({
 *   place_id: 'xxx',
 *   place_name: 'Hotel Example',
 *   platform: 'booking_com',
 *   affiliate_url: 'https://...',
 * });
 */
export function useTrackBookingClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Omit<BookingInsert, 'user_id'>) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new ApiError(API_ERROR_CODES.UNAUTHORIZED);
      }

      return rateLimitedTrackClick({
        ...booking,
        user_id: user.id,
      });
    },
    onSuccess: (newBooking: Booking) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.setQueryData(bookingKeys.detail(newBooking.id), newBooking);
    },
  });
}

/**
 * Record a booking conversion
 */
export function useRecordConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      conversionValue,
      currency,
    }: {
      bookingId: string;
      conversionValue?: number;
      currency?: string;
    }) => {
      return rateLimitedRecordConversion(bookingId, conversionValue, currency);
    },
    onSuccess: (updatedBooking: Booking) => {
      queryClient.setQueryData(bookingKeys.detail(updatedBooking.id), updatedBooking);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.analytics() });
    },
  });
}

/**
 * Update booking details (e.g., add reference number)
 */
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      updates,
    }: {
      bookingId: string;
      updates: {
        booking_reference?: string;
        booking_date?: string;
        notes?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        throw supabaseErrorToApiError(error);
      }

      return data as Booking;
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(bookingKeys.detail(updatedBooking.id), updatedBooking);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Generate affiliate URL with tracking
 */
export function useAffiliateUrl() {
  const trackClick = useTrackBookingClick();

  return {
    /**
     * Open affiliate link and track the click
     */
    openWithTracking: async (params: {
      placeId: string;
      placeName: string;
      placeType?: string;
      cityName?: string;
      platform: BookingPlatform;
      baseUrl: string;
      tripId?: string;
    }) => {
      const affiliateParams = getAffiliateParams(params.platform);
      const affiliateUrl = `${params.baseUrl}${affiliateParams}`;

      // Track the click
      await trackClick.mutateAsync({
        place_id: params.placeId,
        place_name: params.placeName,
        place_type: params.placeType,
        city_name: params.cityName,
        platform: params.platform,
        affiliate_url: affiliateUrl,
        trip_id: params.tripId,
      });

      // Open in new tab
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    },

    isLoading: trackClick.isPending,
  };
}

/**
 * Get affiliate parameters for different platforms
 */
function getAffiliateParams(platform: BookingPlatform): string {
  // These would be configured with your actual affiliate IDs
  const affiliateIds: Record<BookingPlatform, string> = {
    booking_com: '?aid=YOUR_BOOKING_AID',
    getyourguide: '?partner_id=YOUR_GYG_ID',
    thefork: '?ref=YOUR_THEFORK_REF',
    viator: '?pid=YOUR_VIATOR_PID',
    airbnb: '?c=YOUR_AIRBNB_CODE',
    other: '',
  };

  return affiliateIds[platform] || '';
}

/**
 * Check if user has recent bookings for a place
 */
export function useHasRecentBooking(placeId: string | null) {
  const { data: bookings } = useBookings({ enabled: !!placeId });

  if (!placeId || !bookings) return false;

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return bookings.some(
    (b) =>
      b.place_id === placeId && new Date(b.clicked_at) > oneDayAgo
  );
}

// ============================================================================
// Platform Helpers
// ============================================================================

export const PLATFORM_INFO: Record<
  BookingPlatform,
  { name: string; icon: string; color: string }
> = {
  booking_com: {
    name: 'Booking.com',
    icon: 'hotel',
    color: '#003580',
  },
  getyourguide: {
    name: 'GetYourGuide',
    icon: 'ticket',
    color: '#FF5533',
  },
  thefork: {
    name: 'TheFork',
    icon: 'utensils',
    color: '#00A699',
  },
  viator: {
    name: 'Viator',
    icon: 'compass',
    color: '#1A1A1A',
  },
  airbnb: {
    name: 'Airbnb',
    icon: 'home',
    color: '#FF5A5F',
  },
  other: {
    name: 'Other',
    icon: 'link',
    color: '#6B7280',
  },
};

export function getPlatformInfo(platform: BookingPlatform) {
  return PLATFORM_INFO[platform] || PLATFORM_INFO.other;
}
