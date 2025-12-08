/**
 * Booking UI Components
 *
 * Epic 10: Booking & Monetisation
 *
 * Components for integrating booking options into the app.
 * Designed to be helpful, not pushy.
 */

// WI-10.2: Hotel Booking
export { HotelBookingCard, type HotelBookingCardProps } from './HotelBookingCard';
export { useHotelBooking, type UseHotelBookingOptions, type UseHotelBookingReturn } from './useHotelBooking';

// WI-10.3: Activity Booking
export { ActivityBookingCard, type ActivityBookingCardProps } from './ActivityBookingCard';
export {
  useActivityBooking,
  isCategoryBookable,
  getAllDismissedActivities,
  clearAllDismissedActivities,
  type UseActivityBookingOptions,
  type UseActivityBookingReturn,
} from './useActivityBooking';

// WI-10.4: Restaurant Booking
export { RestaurantBookingCard, type RestaurantBookingCardProps } from './RestaurantBookingCard';
export {
  useRestaurantBooking,
  isDiningPlaceType,
  getAllDismissedRestaurants,
  clearAllDismissedRestaurants,
  type UseRestaurantBookingOptions,
  type UseRestaurantBookingReturn,
} from './useRestaurantBooking';
