import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimplifiedEntryForm, calculateNights } from './index';
import type { EntryFormData } from './types';

/**
 * NewTripPage
 *
 * Entry point for creating a new trip. Uses the SimplifiedEntryForm
 * and handles the route generation flow.
 */
export function NewTripPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: EntryFormData) => {
    if (!data.origin || !data.destination || !data.startDate || !data.endDate) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate total nights from dates
      const totalNights = calculateNights(data.startDate, data.endDate);

      // Store discovery data in sessionStorage for the discovery phase
      const discoveryData = {
        origin: {
          name: data.origin.name,
          country: data.origin.country,
          coordinates: data.origin.coordinates,
        },
        destination: {
          name: data.destination.name,
          country: data.destination.country,
          coordinates: data.destination.coordinates,
        },
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        totalNights,
        travellerType: data.travellerType,
      };

      sessionStorage.setItem('discoveryData', JSON.stringify(discoveryData));

      // Navigate to discovery phase
      navigate('/discover');
    } catch (err) {
      console.error('Navigation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rui-grey-2">
      <SimplifiedEntryForm onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full mx-auto px-6">
          <div className="bg-danger text-white px-6 py-4 rounded-rui-16 shadow-rui-4 flex items-center justify-between">
            <span className="text-body-2">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-white/70 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
