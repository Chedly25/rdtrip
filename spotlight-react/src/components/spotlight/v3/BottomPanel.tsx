import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { TripSummaryCard, type BudgetBreakdown } from './TripSummaryCard';
import { CityCard } from './CityCard';
import { Button } from '../../ui';
import AddCityLandmarkModal from '../v2/AddCityLandmarkModal';

interface BottomPanelProps {
  onCityDetailsClick?: (cityIndex: number) => void;
  budget?: BudgetBreakdown | null;
}

const BottomPanel = ({ onCityDetailsClick, budget }: BottomPanelProps) => {
  const {
    route,
    selectedCityIndex,
    setSelectedCity,
    getCityName,
    reorderCities,
    updateCityNights,
    isAddingLandmark,
    setIsAddingLandmark,
  } = useSpotlightStoreV2();

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!route) return null;

  const totalNights = route.cities.reduce((sum, city) => sum + (city.nights || 0), 0);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt((active.id as string).replace('city-', ''));
      const newIndex = parseInt((over.id as string).replace('city-', ''));
      reorderCities(oldIndex, newIndex);

      if (selectedCityIndex === oldIndex) {
        setSelectedCity(newIndex);
      } else if (selectedCityIndex !== null) {
        if (oldIndex < selectedCityIndex && newIndex >= selectedCityIndex) {
          setSelectedCity(selectedCityIndex - 1);
        } else if (oldIndex > selectedCityIndex && newIndex <= selectedCityIndex) {
          setSelectedCity(selectedCityIndex + 1);
        }
      }
    }

    setActiveId(null);
  };

  const handleNightsChange = (cityIndex: number, nights: number) => {
    const city = route?.cities[cityIndex];
    if (city) {
      const cityName = getCityName(city.city);
      updateCityNights(cityName, nights);
    }
  };

  const activeCityIndex = activeId ? parseInt(activeId.replace('city-', '')) : null;
  const activeCity = activeCityIndex !== null ? route.cities[activeCityIndex] : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
      {/* Add City Modal */}
      <AddCityLandmarkModal
        isOpen={isAddingLandmark}
        onClose={() => setIsAddingLandmark(false)}
      />

      {/* Bottom Panel Container */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.15, 0.5, 0.5, 1] }}
        className="bg-gradient-to-t from-white via-white/95 to-transparent pb-6 pt-16"
      >
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex gap-6">
            {/* Left: Trip Summary Card */}
            <TripSummaryCard
              citiesCount={route.cities.length}
              totalNights={totalNights}
              budget={budget}
              tripPace="balanced"
            />

            {/* Right: City Cards Carousel */}
            <div className="flex-1 min-w-0 relative">
              {/* Add City FAB */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute -top-4 right-0 z-10"
              >
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => setIsAddingLandmark(true)}
                  className="w-12 h-12 rounded-full shadow-rui-3"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Carousel */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={route.cities.map((_, index) => `city-${index}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {route.cities.map((city, index) => {
                      const cityName = getCityName(city.city);
                      const country = typeof city.city === 'object' ? city.city.country : undefined;

                      return (
                        <CityCard
                          key={`city-${index}`}
                          id={`city-${index}`}
                          cityName={cityName}
                          country={country}
                          index={index}
                          nights={city.nights || 0}
                          activitiesCount={city.activities?.length || 0}
                          restaurantsCount={city.restaurants?.length || 0}
                          isSelected={selectedCityIndex === index}
                          onSelect={() => setSelectedCity(index === selectedCityIndex ? null : index)}
                          onNightsChange={(nights) => handleNightsChange(index, nights)}
                          onViewDetails={() => onCityDetailsClick?.(index)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeId && activeCity && activeCityIndex !== null ? (
                    <div className="w-72 bg-white rounded-rui-24 shadow-rui-4 overflow-hidden opacity-90">
                      <div className="h-36 bg-rui-grey-5 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-rui-2">
                          <span className="text-emphasis-2 text-rui-black">{activeCityIndex + 1}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-heading-3 text-rui-black">{getCityName(activeCity.city)}</h3>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { BottomPanel };
export type { BottomPanelProps };
