import { motion } from 'framer-motion';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { MapPin, Moon, Plus, GripVertical } from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable City Card Component
interface SortableCityCardProps {
  city: any;
  index: number;
  isSelected: boolean;
  agentColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  cityName: string;
  onCityClick: () => void;
}

const SortableCityCard = ({
  city,
  index,
  isSelected,
  agentColors,
  cityName,
  onCityClick
}: SortableCityCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `city-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex-shrink-0 w-64 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-2 shadow-lg scale-105'
          : 'hover:bg-white/5'
      } ${isDragging ? 'shadow-2xl' : ''}`}
      style={{
        ...style,
        background: isSelected
          ? `linear-gradient(135deg, ${agentColors.primary}40, ${agentColors.secondary}40)`
          : 'transparent',
        ...(isSelected ? { '--tw-ring-color': agentColors.accent } as any : {})
      }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div onClick={onCityClick}>
        {/* City header */}
        <div className="flex items-center justify-between mb-3 pl-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
              }}
            >
              {index + 1}
            </div>
            <h3 className="text-white font-semibold text-lg">{cityName}</h3>
          </div>
        </div>

        {/* City info */}
        <div className="flex items-center gap-4 text-sm text-gray-300 pl-6">
          <div className="flex items-center gap-1">
            <Moon className="w-4 h-4" />
            <span>{city.nights} {city.nights === 1 ? 'night' : 'nights'}</span>
          </div>

          {city.activities && city.activities.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{city.activities.length} activities</span>
            </div>
          )}
        </div>

        {/* Expand indicator */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 pt-3 border-t border-white/10 pl-6"
          >
            <p className="text-gray-400 text-xs">Click to view details</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const FloatingCityCards = () => {
  const {
    route,
    selectedCityIndex,
    setSelectedCity,
    setIsAddingLandmark,
    getCityName,
    getAgentColors,
    reorderCities
  } = useSpotlightStoreV2();

  const agentColors = getAgentColors();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrollPosition] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!route) return null;

  const handleCityClick = (index: number) => {
    setSelectedCity(index === selectedCityIndex ? null : index);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt((active.id as string).replace('city-', ''));
      const newIndex = parseInt((over.id as string).replace('city-', ''));

      // Reorder cities in store
      reorderCities(oldIndex, newIndex);

      // Update selected city index if needed
      if (selectedCityIndex === oldIndex) {
        setSelectedCity(newIndex);
      } else if (selectedCityIndex !== null) {
        // Adjust selection if it's affected by the reorder
        if (oldIndex < selectedCityIndex && newIndex >= selectedCityIndex) {
          setSelectedCity(selectedCityIndex - 1);
        } else if (oldIndex > selectedCityIndex && newIndex <= selectedCityIndex) {
          setSelectedCity(selectedCityIndex + 1);
        }
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Get the currently dragged city for the overlay
  const activeCityIndex = activeId ? parseInt(activeId.replace('city-', '')) : null;
  const activeCity = activeCityIndex !== null ? route.cities[activeCityIndex] : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 pb-8">
      {/* Floating Add Button (FAB) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => setIsAddingLandmark(true)}
        className="absolute right-8 -top-20 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
        style={{
          background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
        }}
        title="Add City or Landmark"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      {/* City Cards Container */}
      <div className="max-w-screen-2xl mx-auto px-8">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          {/* Glass morphism container */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Info text */}
            <p className="text-gray-400 text-xs mb-4 flex items-center gap-2">
              <GripVertical className="w-3 h-3" />
              Drag cards to reorder cities
            </p>

            {/* Horizontal scrollable city cards with drag-and-drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={route.cities.map((_, index) => `city-${index}`)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {route.cities.map((city, index) => {
                    const cityName = getCityName(city.city);
                    const isSelected = selectedCityIndex === index;

                    return (
                      <SortableCityCard
                        key={`city-${index}`}
                        city={city}
                        index={index}
                        isSelected={isSelected}
                        agentColors={agentColors}
                        cityName={cityName}
                        onCityClick={() => handleCityClick(index)}
                      />
                    );
                  })}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeId && activeCity && activeCityIndex !== null ? (
                  <div
                    className="w-64 p-4 rounded-xl shadow-2xl cursor-grabbing"
                    style={{
                      background: `linear-gradient(135deg, ${agentColors.primary}60, ${agentColors.secondary}60)`,
                      backdropFilter: 'blur(12px)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                        }}
                      >
                        {activeCityIndex + 1}
                      </div>
                      <h3 className="text-white font-semibold text-lg">
                        {getCityName(activeCity.city)}
                      </h3>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Scroll indicator if needed */}
            {route.cities.length > 4 && (
              <div className="flex justify-center mt-4 gap-1">
                {Array.from({ length: Math.ceil(route.cities.length / 4) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      background: i === Math.floor(scrollPosition / 4)
                        ? agentColors.accent
                        : 'rgba(255, 255, 255, 0.2)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FloatingCityCards;
