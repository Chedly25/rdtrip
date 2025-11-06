import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { DayCardV2 } from './DayCardV2';
import { DayNavigator } from './DayNavigator';
import { DensitySelector } from './DensitySelector';
import { BudgetSummary } from './BudgetSummary';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { MapSidebar } from './MapSidebar';
import { ExportMenu } from './ExportMenu';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { getCityCoordinates } from '../../utils/geocoding';
import { Printer } from 'lucide-react';

type DensityMode = 'compact' | 'comfortable' | 'spacious';

interface ItineraryTimelineProps {
  itinerary: any;
  agentType: string;
}

interface MapLocation {
  id: string;
  name: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'scenic';
  coordinates: [number, number];
  color: string;
  time?: string;
  day?: number;
}

export function ItineraryTimeline({ itinerary, agentType }: ItineraryTimelineProps) {
  const { setItinerary, getEffectiveItinerary } = useItineraryStore();
  const [activeDay, setActiveDay] = useState(1);
  const [density, setDensity] = useState<DensityMode>('compact');
  const [showMap, setShowMap] = useState(false);
  const [activeLocationId, setActiveLocationId] = useState<string | undefined>();

  // Initialize the store with itinerary data
  useEffect(() => {
    if (itinerary?.id) {
      setItinerary(itinerary.id, itinerary, itinerary.customizations || {});
    }
  }, [itinerary?.id, setItinerary]);

  // Get the effective itinerary (original + customizations)
  const effectiveItinerary = getEffectiveItinerary() || itinerary;
  const { dayStructure, activities, restaurants, accommodations, scenicStops, practicalInfo, weather, events, budget } = effectiveItinerary;

  // Track scroll position to update active day
  useEffect(() => {
    const handleScroll = () => {
      const dayElements = dayStructure?.days?.map((day: any) =>
        document.getElementById(`day-${day.day}`)
      );

      if (!dayElements) return;

      const scrollPos = window.scrollY + 200;

      for (let i = dayElements.length - 1; i >= 0; i--) {
        const element = dayElements[i];
        if (element && element.offsetTop <= scrollPos) {
          setActiveDay(i + 1);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dayStructure]);

  if (!itinerary) return null;

  // Build map locations from itinerary data
  const mapLocations: MapLocation[] = useMemo(() => {
    const locations: MapLocation[] = [];
    let locationId = 0;

    dayStructure?.days?.forEach((day: any) => {
      const cityCoords = getCityCoordinates(day.location || day.overnight);

      if (!cityCoords) return;

      // Add activities
      const dayActivities = activities
        ?.filter((a: any) => a.day === day.day)
        .flatMap((a: any) => a.activities || []) || [];

      dayActivities.forEach((activity: any, index: number) => {
        locations.push({
          id: `activity-${day.day}-${locationId++}`,
          name: activity.name,
          type: 'activity',
          coordinates: [cityCoords.lng + (index * 0.01), cityCoords.lat + (index * 0.01)], // Slight offset for multiple items
          color: '#3B82F6',
          day: day.day
        });
      });

      // Add restaurants
      const dayRestaurants = restaurants
        ?.filter((r: any) => r.day === day.day)
        .flatMap((r: any) => {
          if (r.meals) {
            return Object.entries(r.meals).map(([mealType, restaurant]: [string, any]) => ({
              ...restaurant,
              meal: mealType
            }));
          }
          return [];
        }) || [];

      dayRestaurants.forEach((restaurant: any, index: number) => {
        locations.push({
          id: `restaurant-${day.day}-${locationId++}`,
          name: restaurant.name,
          type: 'restaurant',
          coordinates: [cityCoords.lng - (index * 0.01), cityCoords.lat + (index * 0.01)],
          color: '#F59E0B',
          time: restaurant.meal,
          day: day.day
        });
      });

      // Add accommodation
      const accommodation = accommodations?.find((h: any) => h.night === day.day);
      if (accommodation) {
        locations.push({
          id: `accommodation-${day.day}-${locationId++}`,
          name: accommodation.name || 'Accommodation',
          type: 'accommodation',
          coordinates: [cityCoords.lng, cityCoords.lat - 0.01],
          color: '#8B5CF6',
          day: day.day
        });
      }
    });

    return locations;
  }, [dayStructure, activities, restaurants, accommodations]);

  return (
    <div className="space-y-8">
      {/* Day Navigator - Sticky */}
      {dayStructure?.days && dayStructure.days.length > 0 && (
        <DayNavigator
          days={dayStructure.days}
          activeDay={activeDay}
          onDayClick={setActiveDay}
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Itinerary</h2>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-sm text-gray-500">
              {dayStructure?.days?.length || 0} days • Tailored for {agentType}
            </p>
            <AutoSaveIndicator />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Map toggle temporarily disabled - will be re-enabled when map coordinates are fixed */}
          {/* <button
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors no-print ${
              showMap
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showMap ? <X className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button> */}
          <DensitySelector value={density} onChange={setDensity} />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 no-print"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <ExportMenu itinerary={effectiveItinerary} agentType={agentType} />
        </div>
      </div>

      {/* Budget Summary */}
      {budget && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BudgetSummary budget={budget} />
        </motion.div>
      )}

      {/* Main Content - Two Column Layout when Map is Shown */}
      <div className={showMap ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {/* Map Sidebar */}
        {showMap && (
          <div className="lg:order-2">
            <MapSidebar
              locations={mapLocations}
              activeLocationId={activeLocationId}
              onLocationClick={setActiveLocationId}
              onClose={() => setShowMap(false)}
              isOpen={showMap}
            />
          </div>
        )}

        {/* Days Timeline */}
        <div className={`space-y-6 ${showMap ? 'lg:order-1' : ''}`}>
          {dayStructure?.days?.map((day: any) => {
            // Process restaurants to add meal type
            const dayRestaurants = restaurants
              ?.filter((r: any) => r.day === day.day)
              .flatMap((r: any) => {
                if (r.meals) {
                  return Object.entries(r.meals).map(([mealType, restaurant]: [string, any]) => ({
                    ...restaurant,
                    meal: mealType
                  }));
                }
                return [];
              }) || [];

            return (
              <DayCardV2
                key={day.day}
                day={day}
                activities={
                  activities
                    ?.filter((a: any) => a.day === day.day)
                    .flatMap((a: any) => a.activities || []) || []
                }
                restaurants={dayRestaurants}
                accommodation={accommodations?.find((h: any) => h.night === day.day)}
                scenicStops={
                  scenicStops?.filter((s: any) => s.day === day.day) || []
                }
                practicalInfo={practicalInfo?.find((p: any) => p.city === day.overnight)}
                weather={weather?.find((w: any) => w.day === day.day)}
                events={
                  events
                    ?.filter((e: any) => e.day === day.day)
                    .flatMap((e: any) => e.events || []) || []
                }
                agentType={agentType}
                density={density}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
