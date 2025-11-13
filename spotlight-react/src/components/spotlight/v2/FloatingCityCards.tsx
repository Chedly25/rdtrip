import { motion } from 'framer-motion';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { MapPin, Moon, Plus, GripVertical, Star, X } from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import AddCityLandmarkModal from './AddCityLandmarkModal';
import { fetchCityImageCached } from '../../../services/wikipedia';
import { getLandmarkImagePath } from '../../../services/landmarks';
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
  const [cityImage, setCityImage] = useState<string | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `city-${index}` });

  // Fetch Wikipedia image for the city
  useEffect(() => {
    const loadImage = async () => {
      const imageUrl = await fetchCityImageCached(cityName);
      setCityImage(imageUrl);
    };
    loadImage();
  }, [cityName]);

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
      className={`flex-shrink-0 w-56 p-3 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-md ${
        isSelected
          ? 'ring-2 shadow-xl scale-105 bg-white/95'
          : 'bg-white/75 hover:bg-white/85 hover:shadow-lg'
      } ${isDragging ? 'shadow-2xl' : ''}`}
      style={{
        ...style,
        ...(isSelected ? { '--tw-ring-color': agentColors.accent } as any : {})
      }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded bg-white/80 hover:bg-white transition-colors shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </div>

      <div onClick={onCityClick}>
        {/* City Image - Smaller */}
        {cityImage && (
          <div className="w-full h-20 mb-2 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={cityImage}
              alt={cityName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* City header - More compact */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{
                background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
              }}
            >
              {index + 1}
            </div>
            <h3 className="text-gray-900 font-semibold text-base">{cityName}</h3>
          </div>
        </div>

        {/* City info - More compact */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Moon className="w-3 h-3" />
            <span>{city.nights} {city.nights === 1 ? 'night' : 'nights'}</span>
          </div>

          {city.activities && city.activities.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{city.activities.length} activities</span>
            </div>
          )}
        </div>

        {/* Expand indicator - Hidden for more compact design */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-gray-200"
          >
            <p className="text-gray-500 text-xs">Click to view details</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Landmark Card Component (smaller, non-draggable)
interface LandmarkCardProps {
  landmark: any;
  agentColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onRemove: () => void;
}

const LandmarkCard = ({ landmark, agentColors, onRemove }: LandmarkCardProps) => {
  const [landmarkImage, setLandmarkImage] = useState<string | null>(null);

  // Fetch Wikipedia image for the landmark
  useEffect(() => {
    const loadImage = async () => {
      // First try to fetch from Wikipedia (real photos)
      const imageUrl = await fetchCityImageCached(landmark.name);
      if (imageUrl) {
        setLandmarkImage(imageUrl);
        return;
      }

      // If Wikipedia fails, fall back to local landmark icons
      const localImagePath = getLandmarkImagePath(landmark.name);
      if (localImagePath) {
        setLandmarkImage(localImagePath);
      }
    };
    loadImage();
  }, [landmark.name]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-shrink-0 w-44 p-2 rounded-lg bg-white/60 backdrop-blur-sm shadow-md relative"
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-md"
      >
        <X className="w-3 h-3 text-white" />
      </button>

      {/* Landmark Image */}
      {landmarkImage && (
        <div className="w-full h-16 mb-2 rounded overflow-hidden bg-gray-100">
          <img
            src={landmarkImage}
            alt={landmark.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Landmark info */}
      <div className="flex items-start gap-2">
        <Star
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          style={{ color: agentColors.accent }}
          fill={agentColors.accent}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-gray-900 font-semibold text-sm truncate">
            {landmark.name}
          </h4>
          {landmark.detourKm && landmark.detourMinutes && (
            <p className="text-gray-500 text-xs">
              +{landmark.detourKm.toFixed(0)} km • +{Math.round(landmark.detourMinutes)} min
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FloatingCityCards = () => {
  const {
    route,
    selectedCityIndex,
    setSelectedCity,
    isAddingLandmark,
    setIsAddingLandmark,
    getCityName,
    getAgentColors,
    reorderCities,
    removeLandmark
  } = useSpotlightStoreV2();

  const agentColors = getAgentColors();
  const [activeId, setActiveId] = useState<string | null>(null);

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
      {/* Add City/Landmark Modal */}
      <AddCityLandmarkModal
        isOpen={isAddingLandmark}
        onClose={() => setIsAddingLandmark(false)}
      />

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
          {/* Transparent minimal container */}
          <div className="p-3">
            {/* Info text - smaller and more subtle */}
            <p className="text-white/80 text-xs mb-2 flex items-center gap-1 drop-shadow-lg">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
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
                  {route.cities.map((city, cityIndex) => {
                    const cityName = getCityName(city.city);
                    const isSelected = selectedCityIndex === cityIndex;

                    // Find landmarks that should be inserted after this city
                    const landmarksAfterCity = route.landmarks.filter(
                      landmark => landmark.insertAfterCityIndex === cityIndex
                    );

                    return (
                      <Fragment key={`city-group-${cityIndex}`}>
                        {/* City Card */}
                        <SortableCityCard
                          key={`city-${cityIndex}`}
                          city={city}
                          index={cityIndex}
                          isSelected={isSelected}
                          agentColors={agentColors}
                          cityName={cityName}
                          onCityClick={() => handleCityClick(cityIndex)}
                        />

                        {/* Landmark Cards after this city */}
                        {landmarksAfterCity.map((landmark) => (
                          <LandmarkCard
                            key={`landmark-${landmark.id}`}
                            landmark={landmark}
                            agentColors={agentColors}
                            onRemove={() => removeLandmark(landmark.id)}
                          />
                        ))}
                      </Fragment>
                    );
                  })}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeId && activeCity && activeCityIndex !== null ? (
                  <div
                    className="w-56 p-3 rounded-xl shadow-2xl cursor-grabbing bg-white/95 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{
                          background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                        }}
                      >
                        {activeCityIndex + 1}
                      </div>
                      <h3 className="text-gray-900 font-semibold text-base">
                        {getCityName(activeCity.city)}
                      </h3>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FloatingCityCards;
