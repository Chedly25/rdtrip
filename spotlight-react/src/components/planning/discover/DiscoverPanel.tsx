/**
 * DiscoverPanel
 *
 * Right panel with three-tab browse experience:
 * - Activities (activity + photo_spot + experience)
 * - Restaurants (restaurant + bar + cafe)
 * - Hotels (single selection per city with optimal location recommendation)
 *
 * Design: Travel Journal Editorial - warm, tactile, magazine-quality
 * Each tab is like a chapter in a beautiful travel guide.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Utensils,
  Camera,
  Wine,
  Coffee,
  Shuffle,
  Loader2,
} from 'lucide-react';
import { BrowseTabs } from './BrowseTabs';
import { FilterBar } from './FilterBar';
import { CategorySection } from './CategorySection';
import { HotelSection } from './HotelSection';
import { usePlanningStore, selectSuggestionsForType } from '../../../stores/planningStore';
import type {
  Cluster,
  PlanCard,
  PlanCardType,
  PriceLevel,
  LatLng,
  BrowseTabId,
} from '../../../types/planning';

interface DiscoverPanelProps {
  cityId: string;
  cityName: string;
  cityCenter?: LatLng;
  clusters: Cluster[];
  requestedTab?: BrowseTabId | null; // External tab navigation (from inline tips)
}

// Activity sub-categories for the Activities tab
const activityCategories: {
  type: PlanCardType;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
}[] = [
  { type: 'activity', title: 'Activities', icon: <Sparkles className="w-4 h-4" />, iconColor: '#7C5CDB' },
  { type: 'photo_spot', title: 'Photo Spots', icon: <Camera className="w-4 h-4" />, iconColor: '#4A90A4' },
];

// Restaurant sub-categories for the Restaurants tab
const restaurantCategories: {
  type: PlanCardType;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
}[] = [
  { type: 'restaurant', title: 'Restaurants', icon: <Utensils className="w-4 h-4" />, iconColor: '#C45830' },
  { type: 'bar', title: 'Bars', icon: <Wine className="w-4 h-4" />, iconColor: '#C4507C' },
  { type: 'cafe', title: 'Cafes', icon: <Coffee className="w-4 h-4" />, iconColor: '#8B7355' },
];

export function DiscoverPanel({ cityId, cityName, cityCenter = { lat: 0, lng: 0 }, clusters, requestedTab }: DiscoverPanelProps) {
  // Active tab state
  const [activeTab, setActiveTab] = useState<BrowseTabId>('activities');

  // React to external tab navigation requests (from inline tips)
  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  // Store state and actions
  const {
    filters,
    setFilters,
    generateSuggestions,
    addItemAutoClustered,
    selectHotel,
    removeHotel,
    isGenerating,
  } = usePlanningStore();

  // Get suggestions for each type
  const restaurantSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'restaurant'));
  const activitySuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'activity'));
  const photoSpotSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'photo_spot'));
  const barSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'bar'));
  const cafeSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'cafe'));
  const hotelSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'hotel'));

  // Get selected hotel
  const selectedHotel = usePlanningStore((state) =>
    state.cityPlans[cityId]?.selectedHotel || null
  );

  // Suggestions maps for each tab
  const activitySuggestionsMap: Record<string, PlanCard[]> = useMemo(() => ({
    activity: activitySuggestions,
    photo_spot: photoSpotSuggestions,
  }), [activitySuggestions, photoSpotSuggestions]);

  const restaurantSuggestionsMap: Record<string, PlanCard[]> = useMemo(() => ({
    restaurant: restaurantSuggestions,
    bar: barSuggestions,
    cafe: cafeSuggestions,
  }), [restaurantSuggestions, barSuggestions, cafeSuggestions]);

  // Tab counts (suggestions + added items)
  const tabCounts = useMemo(() => {
    const activityCount = activitySuggestions.length + photoSpotSuggestions.length;
    const restaurantCount = restaurantSuggestions.length + barSuggestions.length + cafeSuggestions.length;
    const hotelCount = hotelSuggestions.length;
    return {
      activities: activityCount,
      restaurants: restaurantCount,
      hotels: hotelCount,
    };
  }, [activitySuggestions, photoSpotSuggestions, restaurantSuggestions, barSuggestions, cafeSuggestions, hotelSuggestions]);

  // Collect all item IDs that are already in the plan
  const addedIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.forEach((cluster) => {
      cluster.items.forEach((item) => {
        ids.add(item.id);
      });
    });
    if (selectedHotel) {
      ids.add(selectedHotel.id);
    }
    return ids;
  }, [clusters, selectedHotel]);

  // Filter suggestions by price
  const filterByPrice = useCallback((cards: PlanCard[]): PlanCard[] => {
    if (!filters.priceRange || filters.priceRange.length === 0) {
      return cards;
    }
    return cards.filter((card) => filters.priceRange!.includes(card.priceLevel));
  }, [filters.priceRange]);

  // Sort suggestions
  const sortSuggestions = useCallback((cards: PlanCard[]): PlanCard[] => {
    const sorted = [...cards];
    switch (filters.sortBy) {
      case 'proximity':
        return sorted;
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'price':
        return sorted.sort((a, b) => a.priceLevel - b.priceLevel);
      default:
        return sorted;
    }
  }, [filters.sortBy]);

  // Auto-generate initial suggestions based on active tab
  useEffect(() => {
    const generateForTab = async () => {
      if (activeTab === 'activities') {
        for (const cat of activityCategories) {
          const suggestions = activitySuggestionsMap[cat.type];
          if (suggestions.length === 0 && !isGenerating[cat.type]) {
            await generateSuggestions(cat.type, 4);
          }
        }
      } else if (activeTab === 'restaurants') {
        for (const cat of restaurantCategories) {
          const suggestions = restaurantSuggestionsMap[cat.type];
          if (suggestions.length === 0 && !isGenerating[cat.type]) {
            await generateSuggestions(cat.type, 4);
          }
        }
      } else if (activeTab === 'hotels') {
        if (hotelSuggestions.length === 0 && !isGenerating['hotel']) {
          await generateSuggestions('hotel', 3);
        }
      }
    };

    generateForTab();
  }, [activeTab, cityId]);

  // Handle adding a card to the plan (auto-clustering)
  const handleAddCard = useCallback((card: PlanCard) => {
    addItemAutoClustered(cityId, card, cityCenter);
  }, [cityId, cityCenter, addItemAutoClustered]);

  // Handle "Show more" for a category
  const handleShowMore = useCallback((type: PlanCardType) => {
    generateSuggestions(type, 6);
  }, [generateSuggestions]);

  // Handle hotel selection
  const handleSelectHotel = useCallback((hotel: PlanCard) => {
    selectHotel(cityId, hotel);
  }, [cityId, selectHotel]);

  const handleRemoveHotel = useCallback(() => {
    removeHotel(cityId);
  }, [cityId, removeHotel]);

  // Handle "Surprise me" - generate random cards for current tab
  const handleSurpriseMe = useCallback(async () => {
    if (activeTab === 'activities') {
      const types = ['activity', 'photo_spot'] as PlanCardType[];
      const randomType = types[Math.floor(Math.random() * types.length)];
      await generateSuggestions(randomType, 2);
    } else if (activeTab === 'restaurants') {
      const types = ['restaurant', 'bar', 'cafe'] as PlanCardType[];
      const randomType = types[Math.floor(Math.random() * types.length)];
      await generateSuggestions(randomType, 2);
    } else if (activeTab === 'hotels') {
      await generateSuggestions('hotel', 2);
    }
  }, [activeTab, generateSuggestions]);

  // Check if current tab is generating
  const isTabGenerating = useMemo(() => {
    if (activeTab === 'activities') {
      return activityCategories.some(c => isGenerating[c.type]);
    } else if (activeTab === 'restaurants') {
      return restaurantCategories.some(c => isGenerating[c.type]);
    } else {
      return isGenerating['hotel'] || false;
    }
  }, [activeTab, isGenerating]);

  // Tab descriptions
  const tabDescriptions: Record<BrowseTabId, string> = {
    activities: 'Discover experiences & photo spots',
    restaurants: 'Find places to eat & drink',
    hotels: 'Choose where to stay',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with city name */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4 pb-3 px-4"
      >
        <h3 className="font-['Fraunces',Georgia,serif] text-xl text-[#2C2417] font-semibold mb-1">
          Discover {cityName}
        </h3>
        <p className="text-sm text-[#8B7355] font-['Satoshi',system-ui,sans-serif]">
          {tabDescriptions[activeTab]}
        </p>
      </motion.div>

      {/* Tab navigation */}
      <BrowseTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Filter bar (not shown for hotels) */}
        {activeTab !== 'hotels' && (
          <FilterBar
            priceFilter={filters.priceRange || null}
            sortBy={filters.sortBy}
            onPriceChange={(levels) => setFilters({ priceRange: levels as PriceLevel[] | undefined })}
            onSortChange={(sort) => setFilters({ sortBy: sort })}
          />
        )}

        {/* Tab content with animation */}
        <AnimatePresence mode="wait">
          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activityCategories.map((category) => {
                const suggestions = activitySuggestionsMap[category.type] || [];
                const filtered = sortSuggestions(filterByPrice(suggestions));

                return (
                  <CategorySection
                    key={category.type}
                    type={category.type}
                    title={category.title}
                    icon={
                      <span style={{ color: category.iconColor }}>
                        {category.icon}
                      </span>
                    }
                    cards={filtered}
                    isLoading={isGenerating[category.type] || false}
                    hasMore={true}
                    onShowMore={() => handleShowMore(category.type)}
                    onAddCard={handleAddCard}
                    clusters={clusters}
                    addedIds={addedIds}
                  />
                );
              })}
            </motion.div>
          )}

          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <motion.div
              key="restaurants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {restaurantCategories.map((category) => {
                const suggestions = restaurantSuggestionsMap[category.type] || [];
                const filtered = sortSuggestions(filterByPrice(suggestions));

                return (
                  <CategorySection
                    key={category.type}
                    type={category.type}
                    title={category.title}
                    icon={
                      <span style={{ color: category.iconColor }}>
                        {category.icon}
                      </span>
                    }
                    cards={filtered}
                    isLoading={isGenerating[category.type] || false}
                    hasMore={true}
                    onShowMore={() => handleShowMore(category.type)}
                    onAddCard={handleAddCard}
                    clusters={clusters}
                    addedIds={addedIds}
                  />
                );
              })}
            </motion.div>
          )}

          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <motion.div
              key="hotels"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <HotelSection
                hotels={hotelSuggestions}
                selectedHotel={selectedHotel}
                clusters={clusters}
                isLoading={isGenerating['hotel'] || false}
                onSelectHotel={handleSelectHotel}
                onRemoveHotel={handleRemoveHotel}
                onGenerateMore={() => handleShowMore('hotel')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discover more button - refined premium design */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-6"
        >
          <motion.button
            onClick={handleSurpriseMe}
            disabled={isTabGenerating}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full py-4 px-6 rounded-2xl
              bg-[#2C2417]
              text-[#FFFBF5] font-['Satoshi',system-ui,sans-serif] font-semibold text-[15px]
              flex items-center justify-center gap-3
              shadow-sm
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-[#3D3225]
              relative overflow-hidden
            `}
          >
            {/* Subtle shimmer effect when loading */}
            {isTabGenerating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}

            {isTabGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-[18px] h-[18px]" strokeWidth={2} />
                </motion.div>
                <span>Discovering...</span>
              </>
            ) : (
              <>
                <Shuffle className="w-[18px] h-[18px]" strokeWidth={2} />
                <span>Surprise me</span>
              </>
            )}
          </motion.button>

          <p className="text-[12px] text-[#B8A99A] text-center mt-3 font-['Satoshi',system-ui,sans-serif] tracking-wide">
            {activeTab === 'activities'
              ? 'Discover unique experiences'
              : activeTab === 'restaurants'
                ? 'Find a hidden gem'
                : 'Show more options'
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default DiscoverPanel;
