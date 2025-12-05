import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Compass, MapPin, Users, Receipt } from 'lucide-react';
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
import { PersonalizationBadge } from '../v2/PersonalizationBadge';
import { CollaborationEmptyState, ExpensesEmptyState } from '../../onboarding';

// Tab types for the bottom sheet
type BottomSheetTab = 'route' | 'collaborate' | 'expenses';

// Companion panel width for desktop layout
const COMPANION_PANEL_WIDTH = 340;

interface BottomSheetProps {
  onCityDetailsClick?: (cityIndex: number) => void;
}

// Card height: 120px image + ~56px content = 176px
// Header: ~50px, drag handle area: ~28px, padding: ~16px
// Total needed for collapsed: ~270px
const COLLAPSED_HEIGHT = 280;
const EXPANDED_HEIGHT = 560;

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
  const [activeTab, setActiveTab] = useState<BottomSheetTab>('route');
  const [hasSeenCollabTab, setHasSeenCollabTab] = useState(() =>
    localStorage.getItem('rdtrip_seen_collab_tab') === 'true'
  );
  const [hasSeenExpensesTab, setHasSeenExpensesTab] = useState(() =>
    localStorage.getItem('rdtrip_seen_expenses_tab') === 'true'
  );
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

  // Handle tab switching
  const handleTabChange = (tab: BottomSheetTab) => {
    setActiveTab(tab);
    // Mark tab as seen to hide "NEW" badge
    if (tab === 'collaborate' && !hasSeenCollabTab) {
      localStorage.setItem('rdtrip_seen_collab_tab', 'true');
      setHasSeenCollabTab(true);
    }
    if (tab === 'expenses' && !hasSeenExpensesTab) {
      localStorage.setItem('rdtrip_seen_expenses_tab', 'true');
      setHasSeenExpensesTab(true);
    }
    // Auto-expand when switching tabs
    if (!isExpanded) {
      setIsExpanded(true);
      animate(y, -280, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  // Tab configuration
  const tabs: Array<{ id: BottomSheetTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'route', label: 'Route', icon: <MapPin className="w-4 h-4" /> },
    { id: 'collaborate', label: 'Collaborate', icon: <Users className="w-4 h-4" />, badge: !hasSeenCollabTab ? 'NEW' : undefined },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" />, badge: !hasSeenExpensesTab ? 'NEW' : undefined },
  ];

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
        <div className="h-full flex flex-col pt-6">
          {/* Header: Trip Summary + Tabs - Editorial style */}
          <div className="px-5 pb-4">
            {/* Top row: Route info and controls - clean single line */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Left section: Route with visual separator */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Route text */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[15px] text-[#2C2417] truncate max-w-[120px] sm:max-w-none">
                    {originName}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#C45830] flex-shrink-0" />
                  <span className="font-semibold text-[15px] text-[#2C2417] truncate max-w-[120px] sm:max-w-none">
                    {destinationName}
                  </span>
                </div>

                {/* Vertical divider */}
                <div className="hidden sm:block w-px h-5 bg-[#E5DDD0]" />

                {/* Stats pills - inline with route */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 bg-[#F5F0E8] rounded-full text-[11px] font-medium text-[#8B7355]">
                    {route.cities.length} stops
                  </span>
                  <span className="px-2.5 py-1 bg-[#F5F0E8] rounded-full text-[11px] font-medium text-[#8B7355]">
                    {totalNights} nights
                  </span>
                </div>
              </div>

              {/* Right section: Personalization badge + Expand */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Personalization badge - only show if no intro banner is active */}
                {route.personalization && !route.personalizedIntro?.headline && (
                  <PersonalizationBadge personalization={route.personalization} />
                )}

                {/* Expand indicator */}
                <motion.button
                  onClick={toggleExpanded}
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#8B7355] hover:bg-[#E8DFD3] hover:text-[#C45830] transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </motion.button>
              </div>
            </div>

            {/* Tab bar - Clean segmented control style */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#F5F0E8]/80 rounded-xl backdrop-blur-sm" data-tour="bottom-sheet-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-white text-[#2C2417] shadow-sm'
                      : 'text-[#8B7355] hover:text-[#2C2417] hover:bg-white/60'
                    }
                  `}
                  data-tour={tab.id === 'collaborate' ? 'collaborate-button' : undefined}
                >
                  <span className={`transition-colors ${activeTab === tab.id ? 'text-[#C45830]' : ''}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {/* NEW badge - positioned inline for cleaner look */}
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                      }}
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Route Tab Content */}
            {activeTab === 'route' && (
              <motion.div
                key="route-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
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
                      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide scroll-smooth snap-x">
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
                          className="flex-shrink-0 w-[180px] h-[176px] rounded-2xl border-2 border-dashed border-[#D4C4B0] bg-[#FAF7F2]/50 flex flex-col items-center justify-center gap-3 text-[#8B7355] hover:border-[#C45830] hover:text-[#C45830] hover:bg-[#FFF8F5] transition-all duration-200 snap-start group"
                        >
                          <div className="w-11 h-11 rounded-full bg-[#F5F0E8] flex items-center justify-center group-hover:bg-[#FEF3EE] transition-colors">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-[13px] font-medium">Add City</span>
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
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="flex-1 px-5 pb-6 overflow-hidden"
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
                      <div className="h-full flex flex-col items-center justify-center text-center py-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F5F0E8] to-[#E8DFD3] flex items-center justify-center mb-3 shadow-sm">
                          <Compass className="w-6 h-6 text-[#C45830]" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#2C2417] mb-1.5">
                          Explore Your Journey
                        </h3>
                        <p className="text-[13px] text-[#8B7355] max-w-[220px] leading-relaxed">
                          Tap a destination card to view details and customize your stay
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Collaborate Tab Content */}
            {activeTab === 'collaborate' && (
              <motion.div
                key="collaborate-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <CollaborationEmptyState
                  onAction={() => {
                    // TODO: Open invite collaborator modal
                    console.log('Open invite modal');
                  }}
                />
              </motion.div>
            )}

            {/* Expenses Tab Content */}
            {activeTab === 'expenses' && (
              <motion.div
                key="expenses-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <ExpensesEmptyState
                  onAction={() => {
                    // TODO: Open add expense modal
                    console.log('Open add expense modal');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export { BottomSheet };
export type { BottomSheetProps };
