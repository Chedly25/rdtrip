import { Reorder, useDragControls, AnimatePresence } from 'framer-motion';
import { GripVertical, Moon, X, MapPin, Star } from 'lucide-react';
import type { DiscoveryCity } from '../../stores/discoveryStore';

interface SortableCityListProps {
  cities: DiscoveryCity[];
  onReorder: (reorderedCityIds: string[]) => void;
  onRemoveCity: (cityId: string) => void;
  onSelectCity?: (cityId: string) => void;
  selectedCityId?: string | null;
}

/**
 * SortableCityList
 *
 * A drag-and-drop reorderable list of cities for the discovery phase.
 * Origin and destination (fixed cities) cannot be reordered.
 * Middle cities can be dragged to reorder the route.
 *
 * Design decisions:
 * - Uses Framer Motion Reorder for smooth drag animations
 * - Grip handle on the left for clear drag affordance
 * - Fixed cities (origin/destination) have locked appearance
 * - Connection line between cities shows route flow
 * - Mobile-first touch targets
 */
export function SortableCityList({
  cities,
  onReorder,
  onRemoveCity,
  onSelectCity,
  selectedCityId,
}: SortableCityListProps) {
  // Separate fixed and reorderable cities
  const origin = cities.find((c) => c.isFixed && c.id === 'origin');
  const destination = cities.find((c) => c.isFixed && c.id === 'destination');
  const middleCities = cities.filter((c) => !c.isFixed);

  // Handle reorder of middle cities
  const handleReorder = (reorderedMiddle: DiscoveryCity[]) => {
    const newOrder = reorderedMiddle.map((c) => c.id);
    onReorder(newOrder);
  };

  return (
    <div className="space-y-1">
      {/* Origin (fixed, not draggable) */}
      {origin && (
        <FixedCityItem
          city={origin}
          position="origin"
          isSelected={selectedCityId === origin.id}
          onClick={() => onSelectCity?.(origin.id)}
          hasConnectionBelow={middleCities.length > 0 || !!destination}
        />
      )}

      {/* Reorderable middle cities */}
      {middleCities.length > 0 && (
        <Reorder.Group
          axis="y"
          values={middleCities}
          onReorder={handleReorder}
          className="space-y-1"
        >
          <AnimatePresence mode="popLayout">
            {middleCities.map((city, index) => (
              <DraggableCityItem
                key={city.id}
                city={city}
                index={index + 1} // +1 because origin is 0
                isSelected={selectedCityId === city.id}
                onClick={() => onSelectCity?.(city.id)}
                onRemove={() => onRemoveCity(city.id)}
                hasConnectionBelow={
                  index < middleCities.length - 1 || !!destination
                }
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Destination (fixed, not draggable) */}
      {destination && (
        <FixedCityItem
          city={destination}
          position="destination"
          isSelected={selectedCityId === destination.id}
          onClick={() => onSelectCity?.(destination.id)}
          hasConnectionBelow={false}
        />
      )}
    </div>
  );
}

// Fixed city item (origin/destination)
interface FixedCityItemProps {
  city: DiscoveryCity;
  position: 'origin' | 'destination';
  isSelected: boolean;
  onClick?: () => void;
  hasConnectionBelow: boolean;
}

function FixedCityItem({
  city,
  position,
  isSelected,
  onClick,
  hasConnectionBelow,
}: FixedCityItemProps) {
  return (
    <div className="relative">
      {/* Connection line */}
      {hasConnectionBelow && (
        <div className="absolute left-5 top-14 w-0.5 h-4 bg-rui-grey-15" />
      )}

      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 p-3
          bg-white rounded-xl
          border-2 transition-all duration-200
          text-left
          ${isSelected
            ? 'border-rui-accent shadow-md shadow-rui-accent/10'
            : 'border-rui-grey-10 hover:border-rui-grey-20'
          }
        `}
      >
        {/* Fixed indicator (no grip, can't drag) */}
        <div className="w-6 flex items-center justify-center text-rui-grey-20">
          {position === 'origin' ? (
            <MapPin className="w-4 h-4" />
          ) : (
            <Star className="w-4 h-4" />
          )}
        </div>

        {/* Index badge */}
        <div
          className="
            w-8 h-8 rounded-full flex items-center justify-center
            text-body-3 font-semibold
            bg-rui-accent text-white
          "
        >
          {position === 'origin' ? '1' : '•'}
        </div>

        {/* City info */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-rui-black truncate">
            {city.name}
          </p>
          <p className="text-body-3 text-rui-grey-50 truncate">
            {position === 'origin' ? 'Starting point' : 'Destination'}
          </p>
        </div>

        {/* Nights badge */}
        <div className="flex items-center gap-1 text-body-3 text-rui-grey-50">
          <Moon className="w-3.5 h-3.5" />
          <span>{city.nights ?? city.suggestedNights ?? 1}</span>
        </div>
      </button>
    </div>
  );
}

// Draggable city item (middle stops)
interface DraggableCityItemProps {
  city: DiscoveryCity;
  index: number;
  isSelected: boolean;
  onClick?: () => void;
  onRemove: () => void;
  hasConnectionBelow: boolean;
}

function DraggableCityItem({
  city,
  index,
  isSelected,
  onClick,
  onRemove,
  hasConnectionBelow,
}: DraggableCityItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={city}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        zIndex: 50,
      }}
      className="relative"
    >
      {/* Connection line */}
      {hasConnectionBelow && (
        <div className="absolute left-5 top-14 w-0.5 h-4 bg-rui-grey-15 pointer-events-none" />
      )}

      <div
        className={`
          flex items-center gap-2 p-3
          bg-white rounded-xl
          border-2 transition-all duration-200
          ${isSelected
            ? 'border-rui-accent shadow-md shadow-rui-accent/10'
            : 'border-rui-grey-10 hover:border-rui-grey-20'
          }
        `}
      >
        {/* Drag handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="
            w-6 flex items-center justify-center
            cursor-grab active:cursor-grabbing
            text-rui-grey-30 hover:text-rui-grey-50
            touch-none
          "
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Clickable area for selection */}
        <button
          onClick={onClick}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          {/* Index badge */}
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              text-body-3 font-semibold
              ${city.isSelected
                ? 'bg-rui-sage/10 text-rui-sage'
                : 'bg-rui-grey-5 text-rui-grey-50'
              }
            `}
          >
            {index + 1}
          </div>

          {/* City info */}
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-rui-black truncate">
              {city.name}
            </p>
            <p className="text-body-3 text-rui-grey-50 truncate">
              {city.description || city.country}
            </p>
          </div>

          {/* Nights badge */}
          <div className="flex items-center gap-1 text-body-3 text-rui-grey-50">
            <Moon className="w-3.5 h-3.5" />
            <span>{city.nights ?? city.suggestedNights ?? 1}</span>
          </div>
        </button>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            w-8 h-8 rounded-full
            bg-rui-grey-5 hover:bg-danger/10
            flex items-center justify-center
            text-rui-grey-40 hover:text-danger
            transition-colors duration-200
          "
          aria-label={`Remove ${city.name} from trip`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default SortableCityList;
