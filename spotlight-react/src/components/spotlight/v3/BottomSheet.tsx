import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';
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
import { CompactCityCard } from './CompactCityCard';
import { SelectedCityPanel } from './SelectedCityPanel';
import { getCityHighlight } from '../../../utils/cityHighlights';
import AddCityLandmarkModal from '../v2/AddCityLandmarkModal';

interface BottomSheetProps {
  onCityDetailsClick?: (cityIndex: number) => void;
}

const COLLAPSED_HEIGHT = 200;
const EXPANDED_HEIGHT = 480;

const BottomSheet = ({ onCityDetailsClick }: BottomSheetProps) => {
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Motion values for drag
  const y = useMotionValue(0);
  const height = useTransform(
    y,
    [-280, 0],
    [EXPANDED_HEIGHT, COLLAPSED_HEIGHT]
  );

  // Drag sensors for reordering cards
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

  // Auto-expand when a city is selected
  useEffect(() => {
    if (selectedCityIndex !== null && !isExpanded) {
      setIsExpanded(true);
      animate(y, -280, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [selectedCityIndex]);

  if (!route) return null;

  const totalNights = route.cities.reduce((sum, city) => sum + (city.nights || 0), 0);
  const originName = getCityName(route.origin);
  const destinationName = getCityName(route.destination);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldExpand = info.velocity.y < -500 || (isExpanded ? info.offset.y < 50 : info.offset.y < -80);

    if (shouldExpand) {
      setIsExpanded(true);
      animate(y, -280, { type: 'spring', stiffness: 300, damping: 30 });
    } else {
      setIsExpanded(false);
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      // Deselect city when collapsing
      if (selectedCityIndex !== null) {
        setSelectedCity(null);
      }
    }
  };

  const toggleExpanded = () => {
    if (isExpanded) {
      setIsExpanded(false);
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setSelectedCity(null);
    } else {
      setIsExpanded(true);
      animate(y, -280, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  // Card drag handlers
  const handleCardDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt((active.id as string).replace('city-', ''));
      const newIndex = parseInt((over.id as string).replace('city-', ''));
      reorderCities(oldIndex, newIndex);

      // Update selected index
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
  const selectedCity = selectedCityIndex !== null ? route.cities[selectedCityIndex] : null;

  return (
    <>
      {/* Add City Modal */}
      <AddCityLandmarkModal
        isOpen={isAddingLandmark}
        onClose={() => setIsAddingLandmark(false)}
      />

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        style={{ height }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
      >
        {/* Drag Handle */}
        <motion.div
          drag="y"
          dragConstraints={{ top: -280, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ y }}
          className="absolute inset-x-0 top-0 h-8 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="flex justify-center pt-3">
            <div
              onClick={toggleExpanded}
              className="w-10 h-1 bg-neutral-300 rounded-full hover:bg-neutral-400 transition-colors"
            />
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="h-full flex flex-col pt-6">
          {/* Header: Trip Summary */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-neutral-900">
                {originName}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
              <span className="font-semibold text-neutral-900">
                {destinationName}
              </span>
              <span className="text-neutral-400 mx-1">·</span>
              <span className="text-neutral-500">
                {route.cities.length} cities
              </span>
              <span className="text-neutral-400 mx-1">·</span>
              <span className="text-neutral-500">
                {totalNights} nights
              </span>
            </div>

            {/* Expand indicator */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-neutral-400"
            >
              <ChevronRight className="w-5 h-5 rotate-90" />
            </motion.div>
          </div>

          {/* City Cards Carousel */}
          <div className="px-5 pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleCardDragStart}
              onDragEnd={handleCardDragEnd}
            >
              <SortableContext
                items={route.cities.map((_, index) => `city-${index}`)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x">
                  {route.cities.map((city, index) => {
                    const cityName = getCityName(city.city);
                    const country = typeof city.city === 'object' ? city.city.country : undefined;
                    const highlight = getCityHighlight(cityName, city, country);

                    return (
                      <div key={`city-${index}`} className="snap-start">
                        <CompactCityCard
                          id={`city-${index}`}
                          cityName={cityName}
                          country={country}
                          index={index}
                          nights={city.nights || 0}
                          highlight={highlight}
                          hasActivities={(city.activities?.length || 0) > 0}
                          isSelected={selectedCityIndex === index}
                          onSelect={() => setSelectedCity(index === selectedCityIndex ? null : index)}
                        />
                      </div>
                    );
                  })}

                  {/* Add City Button - matches card height */}
                  <button
                    onClick={() => setIsAddingLandmark(true)}
                    className="flex-shrink-0 w-[60px] h-[132px] rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors snap-start"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeId && activeCity && activeCityIndex !== null ? (
                  <div className="w-[140px] bg-white rounded-xl shadow-xl overflow-hidden opacity-90">
                    <div className="h-[80px] bg-neutral-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-neutral-400">{activeCityIndex + 1}</span>
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate">
                        {getCityName(activeCity.city)}
                      </h3>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Selected City Panel (visible when expanded) */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="flex-1 px-5 pb-5 overflow-hidden"
            >
              {selectedCity && selectedCityIndex !== null ? (
                <SelectedCityPanel
                  city={selectedCity}
                  cityIndex={selectedCityIndex}
                  onNightsChange={(nights) => handleNightsChange(selectedCityIndex, nights)}
                  onViewDetails={() => onCityDetailsClick?.(selectedCityIndex)}
                  onClose={() => setSelectedCity(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                  Select a city to see details
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export { BottomSheet };
export type { BottomSheetProps };
