/**
 * Entry Form Types
 *
 * Simplified types for the 4-input entry flow:
 * 1. Route (origin/destination)
 * 2. Dates (start/end)
 * 3. Traveller type
 */

export interface CityData {
  name: string;
  country: string;
  coordinates: [number, number]; // [lat, lng]
  displayName: string;
}

export type TravellerType = 'solo' | 'couple' | 'family' | 'friends' | 'group';

export interface EntryFormData {
  origin: CityData | null;
  destination: CityData | null;
  startDate: Date | null;
  endDate: Date | null;
  travellerType: TravellerType;
}

export interface EntryFormErrors {
  origin?: string;
  destination?: string;
  dates?: string;
}

// Calculate nights from dates
export function calculateNights(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate) return 0;
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Format date range for display
export function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return '';
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const nights = calculateNights(startDate, endDate);
  return `${start} - ${end} (${nights} ${nights === 1 ? 'night' : 'nights'})`;
}
