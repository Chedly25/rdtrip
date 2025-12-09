import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowRight, Sparkles } from 'lucide-react';
import { LocationInput } from './LocationInput';
import { DateRangePicker } from './DateRangePicker';
import { TravellerTypeChips } from './TravellerTypeChips';
import { useEntryFormAnalytics } from '../../hooks/useEntryFormAnalytics';
import type { CityData, TravellerType, EntryFormData, EntryFormErrors } from './types';
import { calculateNights } from './types';

interface SimplifiedEntryFormProps {
  onSubmit: (data: EntryFormData) => void;
  isLoading?: boolean;
}

export function SimplifiedEntryForm({ onSubmit, isLoading = false }: SimplifiedEntryFormProps) {
  // Form state
  const [origin, setOrigin] = useState<CityData | null>(null);
  const [destination, setDestination] = useState<CityData | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [travellerType, setTravellerType] = useState<TravellerType>('couple');
  const [errors, setErrors] = useState<EntryFormErrors>({});

  // Analytics
  const { trackFieldFocus, trackFieldComplete, trackFormComplete } = useEntryFormAnalytics();

  // Track field completion when values change
  const prevValuesRef = useRef({ origin, destination, startDate, endDate });

  useEffect(() => {
    const prev = prevValuesRef.current;

    // Track origin completion
    if (origin && !prev.origin) {
      trackFieldComplete('origin');
    }

    // Track destination completion
    if (destination && !prev.destination) {
      trackFieldComplete('destination');
    }

    // Track dates completion (both start and end must be set)
    if (startDate && endDate && (!prev.startDate || !prev.endDate)) {
      trackFieldComplete('dates');
    }

    // Update ref
    prevValuesRef.current = { origin, destination, startDate, endDate };
  }, [origin, destination, startDate, endDate, trackFieldComplete]);

  // Validation
  const validate = (): boolean => {
    const newErrors: EntryFormErrors = {};

    if (!origin) {
      newErrors.origin = 'Please select where you\'re starting from';
    }

    if (!destination) {
      newErrors.destination = 'Please select your destination';
    }

    if (origin && destination) {
      // Check if same city
      if (origin.name === destination.name && origin.country === destination.country) {
        newErrors.destination = 'Destination must be different from origin';
      }

      // Check distance (basic check - could be enhanced)
      const distance = calculateDistance(origin.coordinates, destination.coordinates);
      if (distance < 50) {
        newErrors.destination = `Too close! (${Math.round(distance)} km). Pick a city at least 50 km away.`;
      }
      if (distance > 3000) {
        newErrors.destination = `Too far! (${Math.round(distance)} km). Max 3,000 km for road trips.`;
      }
    }

    if (!startDate || !endDate) {
      newErrors.dates = 'Please select your travel dates';
    } else {
      const nights = calculateNights(startDate, endDate);
      if (nights < 2) {
        newErrors.dates = 'Trip must be at least 2 nights';
      }
      if (nights > 30) {
        newErrors.dates = 'Trip cannot exceed 30 nights';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Track successful form completion
    if (origin && destination && startDate && endDate) {
      const distance = calculateDistance(origin.coordinates, destination.coordinates);
      trackFormComplete({
        travellerType,
        tripDurationNights: calculateNights(startDate, endDate),
        distanceKm: distance,
        waypointsAdded: 0, // Simplified form has no waypoints
      });
    }

    onSubmit({
      origin,
      destination,
      startDate,
      endDate,
      travellerType,
    });
  };

  // Check if form is complete (for submit button state)
  const isComplete = origin && destination && startDate && endDate;

  return (
    <div className="min-h-screen flex flex-col bg-rui-grey-2">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-rui-white">
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(196, 88, 48, 0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-lg mx-auto px-6 pt-16 pb-10 text-center">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-16 h-16 rounded-full bg-rui-accent/10 mx-auto mb-6 flex items-center justify-center"
          >
            <Compass className="w-8 h-8 text-rui-accent" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="font-display text-display-3 text-rui-black mb-3"
          >
            Plan your adventure
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="text-body-1 text-rui-grey-50"
          >
            Tell us where and when. We'll handle the rest.
          </motion.p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 max-w-lg mx-auto w-full px-6 py-8"
      >
        {/* Journey line connecting origin and destination */}
        <div className="relative">
          {/* Visual journey line */}
          <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-gradient-to-b from-rui-accent via-rui-grey-10 to-rui-accent z-0" style={{ height: 'calc(100% - 4rem)' }} />

          {/* Origin */}
          <div className="relative mb-6">
            <LocationInput
              value={origin}
              onChange={setOrigin}
              placeholder="Paris, London, Rome..."
              label="Starting from"
              error={errors.origin}
              icon="origin"
              onInputFocus={() => trackFieldFocus('origin')}
            />
          </div>

          {/* Destination */}
          <div className="relative mb-8">
            <LocationInput
              value={destination}
              onChange={setDestination}
              placeholder="Barcelona, Amsterdam, Berlin..."
              label="Going to"
              error={errors.destination}
              icon="destination"
              onInputFocus={() => trackFieldFocus('destination')}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="mb-8">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            error={errors.dates}
            onPickerOpen={() => trackFieldFocus('dates')}
          />
        </div>

        {/* Traveller type */}
        <div className="mb-10">
          <TravellerTypeChips
            value={travellerType}
            onChange={setTravellerType}
            onChipFocus={() => trackFieldFocus('traveller_type')}
          />
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading || !isComplete}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full flex items-center justify-center gap-3 py-4 px-6 rounded-rui-16
            font-body font-semibold text-body-1
            transition-all duration-rui-sm
            ${isComplete
              ? 'bg-rui-accent text-rui-white shadow-accent hover:shadow-rui-4'
              : 'bg-rui-grey-10 text-rui-grey-50 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Crafting your journey...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Start Planning</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        {/* Helper text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-body-3 text-rui-grey-50 mt-4"
        >
          Our AI will discover hidden gems along your route
        </motion.p>
      </motion.form>
    </div>
  );
}

// Haversine formula for distance calculation
function calculateDistance(coords1: [number, number], coords2: [number, number]): number {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type { EntryFormData };
