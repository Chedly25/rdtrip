import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { Plus, ChevronRight, Compass } from 'lucide-react';
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
import { useCompanion } from '../../../contexts/CompanionProvider';

// Companion panel width for desktop layout
const COMPANION_PANEL_WIDTH = 340;

interface BottomSheetProps {
  onCityDetailsClick?: (cityIndex: number) => void;
}

const COLLAPSED_HEIGHT = 240;
const EXPANDED_HEIGHT = 520;

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

  // Get companion context for updating when city selection changes
  const { onCitySelect, isPanelExpanded: isCompanionExpanded } = useCompanion();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Track if we're on desktop for companion panel offset
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Motion values for drag
  const y = useMotionValue(0);
  const height = useTransform(
    y,
    [-280, 0],
    [EXPANDED_HEIGHT, COLLAPSED_HEIGHT]
  );
  const dragAmount = -280;

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
        style={{
          height,
          // On desktop (md+), leave space for companion panel when expanded
          right: isDesktop && isCompanionExpanded ? COMPANION_PANEL_WIDTH : 0,
        }}
        className="fixed bottom-0 left-0 z-40 bg-[#FFFBF5] rounded-t-[28px] shadow-[0_-8px_40px_rgba(44,36,23,0.15)] transition-[right] duration-300"
      >
        {/* Drag Handle */}
        <motion.div
          drag="y"
          dragConstraints={{ top: dragAmount, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ y }}
          className="absolute inset-x-0 top-0 h-8 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="flex justify-center pt-3">
            <div
              onClick={toggleExpanded}
              className="w-12 h-1.5 bg-[#D4C4B0] rounded-full hover:bg-[#C45830] transition-colors"
            />
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="h-full flex flex-col pt-7">
          {/* Header: Trip Summary - Editorial style */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Route text */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] text-[#2C2417]">
                  {originName}
                </span>
                <ChevronRight className="w-4 h-4 text-[#C45830]" />
                <span className="font-semibold text-[15px] text-[#2C2417]">
                  {destinationName}
                </span>
              </div>

              {/* Stats pills */}
              <div className="flex items-center gap-2 ml-2">
                <span className="px-2.5 py-1 bg-[#F5F0E8] rounded-full text-xs font-medium text-[#8B7355]">
                  {route.cities.length} stops
                </span>
                <span className="px-2.5 py-1 bg-[#F5F0E8] rounded-full text-xs font-medium text-[#8B7355]">
                  {totalNights} nights
                </span>
              </div>
            </div>

            {/* Expand indicator */}
            <motion.button
              onClick={toggleExpanded}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#8B7355] hover:bg-[#E8DFD3] transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
            </motion.button>
          </div>

          {/* City Cards Carousel */}
          <div className="px-5 pb-3">
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
                          onSelect={() => {
                            const newSelectedIndex = index === selectedCityIndex ? null : index;
                            setSelectedCity(newSelectedIndex);
                            // Notify companion of city selection
                            onCitySelect(newSelectedIndex !== null ? cityName : null);
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Add City Button */}
                  <button
                    onClick={() => setIsAddingLandmark(true)}
                    className="flex-shrink-0 w-[180px] h-[176px] rounded-2xl border-2 border-dashed border-[#D4C4B0] bg-[#FAF7F2] flex flex-col items-center justify-center gap-2 text-[#8B7355] hover:border-[#C45830] hover:text-[#C45830] hover:bg-[#FFF8F5] transition-all snap-start"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">Add City</span>
                  </button>
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeId && activeCity && activeCityIndex !== null ? (
                  <div className="w-[180px] bg-[#FFFBF5] rounded-2xl shadow-xl overflow-hidden opacity-90">
                    <div className="h-[120px] bg-[#F5F0E8] flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#D4C4B0]">{activeCityIndex + 1}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-[15px] font-semibold text-[#2C2417] truncate">
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
                /* Editorial Empty State */
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5F0E8] to-[#E8DFD3] flex items-center justify-center mb-4">
                    <Compass className="w-7 h-7 text-[#C45830]" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#2C2417] mb-1">
                    Explore Your Journey
                  </h3>
                  <p className="text-sm text-[#8B7355] max-w-[200px]">
                    Tap a destination card to view details and customize your stay
                  </p>
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
