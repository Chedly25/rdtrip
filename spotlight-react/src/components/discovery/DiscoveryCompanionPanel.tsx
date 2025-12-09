import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MapPin,
  ArrowRight,
  X,
  GripVertical,
} from 'lucide-react';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import type { DiscoveryRoute, TripSummary, DiscoveryCity } from '../../stores/discoveryStore';
import { SortableCityList } from './SortableCityList';

interface DiscoveryCompanionPanelProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  isDesktop: boolean;
  isExpanded: boolean;
  onProceed: () => void;
}

// Mobile bottom sheet heights
const COLLAPSED_HEIGHT = 160;
const EXPANDED_HEIGHT = 480;

/**
 * DiscoveryCompanionPanel
 *
 * The companion interface for the discovery phase.
 * Desktop: Fixed sidebar on the right (380px)
 * Mobile: Draggable bottom sheet
 *
 * Shows suggested cities as cards and companion messages.
 */
export function DiscoveryCompanionPanel({
  route,
  tripSummary,
  isDesktop,
  isExpanded: _isExpanded, // Used for desktop sidebar, mobileExpanded for mobile
  onProceed,
}: DiscoveryCompanionPanelProps) {
  void _isExpanded; // Silence unused warning - will use for desktop state later
  const { companionMessages, toggleCitySelection } = useDiscoveryStore();

  // Get additional store actions
  const reorderCities = useDiscoveryStore((state) => state.reorderCities);
  const selectCity = useDiscoveryStore((state) => state.selectCity);

  // Mobile drag state
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const y = useMotionValue(0);
  const dragAmount = EXPANDED_HEIGHT - COLLAPSED_HEIGHT;

  const height = useTransform(
    y,
    [-dragAmount, 0],
    [EXPANDED_HEIGHT, COLLAPSED_HEIGHT]
  );

  // Handle mobile drag end
  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    const shouldExpand = info.velocity.y < -500 || info.offset.y < -dragAmount / 2;
    const shouldCollapse = info.velocity.y > 500 || info.offset.y > dragAmount / 2;

    if (shouldExpand) {
      animate(y, -dragAmount, { type: 'spring', stiffness: 300, damping: 30 });
      setMobileExpanded(true);
    } else if (shouldCollapse) {
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setMobileExpanded(false);
    } else {
      // Snap back to current state
      animate(y, mobileExpanded ? -dragAmount : 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  };

  // Get selected cities
  const getSelectedCities = useDiscoveryStore((state) => state.getSelectedCities);
  const selectedCities = getSelectedCities();

  if (isDesktop) {
    return (
      <DesktopSidebar
        route={route}
        tripSummary={tripSummary}
        companionMessages={companionMessages}
        selectedCities={selectedCities}
        selectedCityId={useDiscoveryStore.getState().selectedCityId}
        onToggleCity={toggleCitySelection}
        onReorderCities={reorderCities}
        onSelectCity={selectCity}
        onProceed={onProceed}
      />
    );
  }

  return (
    <MobileBottomSheet
      route={route}
      tripSummary={tripSummary}
      selectedCities={selectedCities}
      companionMessages={companionMessages}
      onToggleCity={toggleCitySelection}
      onProceed={onProceed}
      y={y}
      height={height}
      isExpanded={mobileExpanded}
      onDragEnd={handleDragEnd}
      onToggleExpand={() => {
        const newExpanded = !mobileExpanded;
        animate(y, newExpanded ? -dragAmount : 0, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
        setMobileExpanded(newExpanded);
      }}
    />
  );
}

// Desktop sidebar component
interface DesktopSidebarProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  companionMessages: any[];
  selectedCities: DiscoveryCity[];
  selectedCityId: string | null;
  onToggleCity: (cityId: string) => void;
  onReorderCities: (orderedCityIds: string[]) => void;
  onSelectCity: (cityId: string | null) => void;
  onProceed: () => void;
}

function DesktopSidebar({
  route,
  tripSummary: _tripSummary,
  companionMessages,
  selectedCities,
  selectedCityId,
  onToggleCity,
  onReorderCities,
  onSelectCity,
  onProceed,
}: DesktopSidebarProps) {
  void _tripSummary; // Will use for night allocation display later
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <motion.aside
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      className="
        fixed top-0 right-0 bottom-0
        w-[380px] bg-rui-cream
        border-l border-rui-grey-10
        flex flex-col
        z-20
      "
    >
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-rui-grey-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rui-accent/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-rui-accent" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-rui-black">Your Journey</h2>
            <p className="text-body-3 text-rui-grey-50">
              {selectedCities.length} stops selected
            </p>
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Companion messages */}
        {companionMessages.length > 0 && (
          <div className="p-4 border-b border-rui-grey-10">
            {companionMessages.map((msg) => (
              <div
                key={msg.id}
                className="
                  bg-rui-cream rounded-2xl p-4
                  shadow-md border border-rui-grey-20
                "
              >
                <p className="text-body-2 text-rui-black leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Selected cities list - now sortable */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body-3 font-medium text-rui-grey-50 uppercase tracking-wide">
              Your Route
            </h3>
            <p className="text-body-3 text-rui-grey-40 flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </p>
          </div>

          <SortableCityList
            cities={selectedCities}
            selectedCityId={selectedCityId}
            onReorder={onReorderCities}
            onRemoveCity={onToggleCity}
            onSelectCity={onSelectCity}
          />
        </div>

        {/* Suggested cities to add */}
        {route && route.suggestedCities.filter((c) => !c.isSelected).length > 0 && (
          <div className="p-4 border-t border-rui-grey-10">
            <h3 className="text-body-3 font-medium text-rui-grey-50 uppercase tracking-wide mb-3">
              Add More Stops
            </h3>

            <div className="space-y-2">
              {route.suggestedCities
                .filter((c) => !c.isSelected)
                .map((city) => (
                  <SuggestedCityCard
                    key={city.id}
                    city={city}
                    onAdd={() => onToggleCity(city.id)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with proceed button */}
      <div className="flex-shrink-0 p-4 border-t border-rui-grey-10 bg-white">
        <motion.button
          onClick={onProceed}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="
            w-full flex items-center justify-center gap-2
            py-4 rounded-2xl
            bg-rui-accent text-white
            font-display font-semibold
            shadow-lg shadow-rui-accent/25
            hover:shadow-xl hover:shadow-rui-accent/30
            transition-shadow duration-200
          "
        >
          <Sparkles className="w-5 h-5" />
          <span>Generate Itinerary</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.aside>
  );
}

// Mobile bottom sheet component
interface MobileBottomSheetProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  selectedCities: DiscoveryCity[];
  companionMessages: any[];
  onToggleCity: (cityId: string) => void;
  onProceed: () => void;
  y: any;
  height: any;
  isExpanded: boolean;
  onDragEnd: any;
  onToggleExpand: () => void;
}

function MobileBottomSheet({
  route,
  selectedCities,
  companionMessages,
  onToggleCity,
  onProceed,
  y,
  height,
  isExpanded,
  onDragEnd,
  onToggleExpand,
}: MobileBottomSheetProps) {
  return (
    <motion.div
      style={{ height }}
      className="
        fixed bottom-0 left-0 right-0
        bg-rui-cream rounded-t-3xl
        shadow-2xl shadow-rui-black/15
        border-t border-rui-grey-20
        z-30
        flex flex-col
      "
    >
      {/* Drag handle */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -(EXPANDED_HEIGHT - COLLAPSED_HEIGHT), bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        style={{ y }}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
      >
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-rui-grey-20" />
        </div>

        {/* Header */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-between px-5 pb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rui-accent/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-rui-accent" />
            </div>
            <span className="font-display font-semibold text-rui-black">
              {selectedCities.length} stops selected
            </span>
          </div>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-rui-grey-50" />
          ) : (
            <ChevronUp className="w-5 h-5 text-rui-grey-50" />
          )}
        </button>
      </motion.div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Companion message */}
        {companionMessages.length > 0 && (
          <div className="mb-4">
            <div className="bg-rui-accent/5 rounded-2xl p-4">
              <p className="text-body-2 text-rui-black leading-relaxed">
                {companionMessages[companionMessages.length - 1]?.content}
              </p>
            </div>
          </div>
        )}

        {/* Horizontal scroll of city cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {selectedCities.map((city, index) => (
            <CompactCityChip
              key={city.id}
              city={city}
              index={index}
              onRemove={city.isFixed ? undefined : () => onToggleCity(city.id)}
            />
          ))}
        </div>

        {/* Add more section when expanded */}
        <AnimatePresence>
          {isExpanded && route && route.suggestedCities.filter((c) => !c.isSelected).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4 pt-4 border-t border-rui-grey-10"
            >
              <h3 className="text-body-3 font-medium text-rui-grey-50 mb-3">
                Add more stops
              </h3>
              <div className="space-y-2">
                {route.suggestedCities
                  .filter((c) => !c.isSelected)
                  .map((city) => (
                    <SuggestedCityCard
                      key={city.id}
                      city={city}
                      onAdd={() => onToggleCity(city.id)}
                    />
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Proceed button */}
      <div className="flex-shrink-0 p-4 border-t border-rui-grey-10">
        <motion.button
          onClick={onProceed}
          whileTap={{ scale: 0.98 }}
          className="
            w-full flex items-center justify-center gap-2
            py-4 rounded-2xl
            bg-rui-accent text-white
            font-display font-semibold
          "
        >
          <Sparkles className="w-5 h-5" />
          <span>Generate Itinerary</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// Suggested city card
interface SuggestedCityCardProps {
  city: DiscoveryCity;
  onAdd: () => void;
}

function SuggestedCityCard({ city, onAdd }: SuggestedCityCardProps) {
  return (
    <motion.button
      onClick={onAdd}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="
        w-full flex items-center gap-3 p-3
        bg-rui-cream rounded-xl
        border border-dashed border-rui-grey-30
        hover:border-rui-accent hover:bg-rui-accent/5
        transition-all duration-200
        text-left
      "
    >
      {/* Add icon */}
      <div className="w-8 h-8 rounded-full bg-rui-grey-5 flex items-center justify-center">
        <MapPin className="w-4 h-4 text-rui-grey-50" />
      </div>

      {/* City info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-rui-black truncate">
          {city.name}
        </p>
        <p className="text-body-3 text-rui-grey-50 truncate">
          {city.placeCount} places to discover
        </p>
      </div>

      {/* Add indicator */}
      <div className="text-rui-accent text-body-3 font-medium">
        + Add
      </div>
    </motion.button>
  );
}

// Compact city chip for mobile horizontal scroll
interface CompactCityChipProps {
  city: DiscoveryCity;
  index: number;
  onRemove?: () => void;
}

function CompactCityChip({ city, index, onRemove }: CompactCityChipProps) {
  return (
    <div
      className={`
        flex-shrink-0 flex items-center gap-2
        pl-2 pr-3 py-2 rounded-full
        ${city.isFixed
          ? 'bg-rui-accent/10 border border-rui-accent/20'
          : 'bg-rui-sage/10 border border-rui-sage/20'
        }
      `}
    >
      {/* Index */}
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          text-xs font-semibold
          ${city.isFixed ? 'bg-rui-accent text-white' : 'bg-rui-sage text-white'}
        `}
      >
        {index + 1}
      </div>

      {/* Name */}
      <span className="text-body-3 font-medium text-rui-black whitespace-nowrap">
        {city.name}
      </span>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="
            w-5 h-5 rounded-full
            bg-rui-grey-10 hover:bg-danger/20
            flex items-center justify-center
            text-rui-grey-50 hover:text-danger
            transition-colors duration-200
          "
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
