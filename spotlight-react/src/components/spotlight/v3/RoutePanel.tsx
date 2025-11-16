/**
 * RoutePanel - Day-by-day Itinerary
 * Phase 1: Route tab content
 *
 * Preserves ALL itinerary features:
 * - Day-by-day breakdown
 * - Add/remove cities
 * - Reorder cities (drag-and-drop)
 * - Edit city information
 * - Add landmarks and activities
 * - Export options
 */

import { type SpotlightRoute } from '../../../stores/spotlightStoreV2';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { ItineraryView } from '../../itinerary/ItineraryView';
import ExportMenu from '../v2/ExportMenu';
import { Heading, Button } from '../../design-system';
import { Plus } from 'lucide-react';

interface RoutePanelProps {
  route: SpotlightRoute | null;
  routeId: string | null;
}

const RoutePanel = ({ route, routeId }: RoutePanelProps) => {
  const { getCityName } = useSpotlightStoreV2();

  if (!route) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-6xl mb-4">🗺️</div>
          <Heading level={3} className="mb-2">No Route Loaded</Heading>
          <p className="text-gray-600">Generate a route from the homepage to get started</p>
        </div>
      </div>
    );
  }

  // Calculate total nights from cities
  const totalNights = route.cities.reduce((sum, city) => sum + city.nights, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Heading level={3}>Your Itinerary</Heading>
            <p className="text-sm text-gray-600 mt-1">
              {getCityName(route.origin)} → {getCityName(route.destination)} • {totalNights} nights
            </p>
          </div>
          <ExportMenu />
        </div>

        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Add Stop
          </Button>
          <Button variant="secondary" size="sm">
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Itinerary Content - Preserves existing ItineraryView */}
      <div className="flex-1 overflow-auto">
        {routeId ? (
          <ItineraryView itineraryId={routeId} routeData={route} />
        ) : (
          <div className="p-8 text-center text-gray-600">
            Save your trip to view full itinerary
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePanel;
