/**
 * DiscoverPanel
 *
 * Right panel showing suggestions for activities, restaurants, etc.
 * Features: FilterBar, NearbySection, CategorySections, Surprise me button.
 *
 * Design: Editorial card grid with warm tones, magazine-quality presentation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Utensils,
  Camera,
  Wine,
  Shuffle,
  Loader2,
} from 'lucide-react';
import { FilterBar } from './FilterBar';
import { NearbySection } from './NearbySection';
import { CategorySection } from './CategorySection';
import { CreateClusterModal } from '../plan/CreateClusterModal';
import { usePlanningStore, selectSuggestionsForType } from '../../../stores/planningStore';
import type { Cluster, PlanCard, PlanCardType, PriceLevel, LatLng } from '../../../types/planning';

interface DiscoverPanelProps {
  cityId: string;
  cityName: string;
  cityCenter?: LatLng;
  clusters: Cluster[];
}

// Category configuration
const categories: {
  type: PlanCardType;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
}[] = [
  { type: 'restaurant', title: 'Restaurants', icon: <Utensils className="w-4 h-4" />, iconColor: '#C45830' },
  { type: 'activity', title: 'Activities', icon: <Sparkles className="w-4 h-4" />, iconColor: '#7C5CDB' },
  { type: 'photo_spot', title: 'Photo Spots', icon: <Camera className="w-4 h-4" />, iconColor: '#4A90A4' },
  { type: 'bar', title: 'Bars & Cafes', icon: <Wine className="w-4 h-4" />, iconColor: '#C4507C' },
];

export function DiscoverPanel({ cityId, cityName, cityCenter = { lat: 0, lng: 0 }, clusters }: DiscoverPanelProps) {
  // Modal state for creating new cluster
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingCard, setPendingCard] = useState<PlanCard | null>(null);

  // Store state and actions
  const {
    filters,
    setFilters,
    generateSuggestions,
    addItemToCluster,
    createCluster,
    isGenerating,
  } = usePlanningStore();

  // Get suggestions for each type
  const restaurantSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'restaurant'));
  const activitySuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'activity'));
  const photoSpotSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'photo_spot'));
  const barSuggestions = usePlanningStore((state) => selectSuggestionsForType(state, 'bar'));

  const suggestionsMap: Record<string, PlanCard[]> = useMemo(() => ({
    restaurant: restaurantSuggestions,
    activity: activitySuggestions,
    photo_spot: photoSpotSuggestions,
    bar: barSuggestions,
  }), [restaurantSuggestions, activitySuggestions, photoSpotSuggestions, barSuggestions]);

  // Collect all item IDs that are already in the plan
  const addedIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.forEach((cluster) => {
      cluster.items.forEach((item) => {
        ids.add(item.id);
      });
    });
    return ids;
  }, [clusters]);

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
        // Already sorted by proximity from backend
        return sorted;
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'price':
        return sorted.sort((a, b) => a.priceLevel - b.priceLevel);
      default:
        return sorted;
    }
  }, [filters.sortBy]);

  // Get nearby suggestions (within 10 min walk)
  const nearbySuggestions = useMemo(() => {
    if (clusters.length === 0) return [];

    const allSuggestions = [
      ...restaurantSuggestions,
      ...activitySuggestions,
      ...photoSpotSuggestions,
      ...barSuggestions,
    ];

    return allSuggestions.filter((card) => {
      const cardWithProximity = card as PlanCard & {
        proximity?: { isNear: boolean; walkingMinutes: number };
      };
      return cardWithProximity.proximity?.isNear || (cardWithProximity.proximity?.walkingMinutes ?? Infinity) <= 10;
    });
  }, [clusters, restaurantSuggestions, activitySuggestions, photoSpotSuggestions, barSuggestions]);

  // Auto-generate initial suggestions on mount
  useEffect(() => {
    const generateInitial = async () => {
      // Generate 4 cards for each category if empty
      for (const category of categories) {
        const suggestions = suggestionsMap[category.type];
        if (suggestions.length === 0 && !isGenerating[category.type]) {
          await generateSuggestions(category.type, 4);
        }
      }
    };

    generateInitial();
  }, [cityId]); // Re-run when city changes

  // Handle adding a card to the plan
  const handleAddCard = useCallback((card: PlanCard, clusterId?: string) => {
    if (clusterId) {
      // Add to specific cluster
      addItemToCluster(cityId, clusterId, card);
    } else if (clusters.length > 0) {
      // Fallback: add to first cluster if no clusterId provided
      addItemToCluster(cityId, clusters[0].id, card);
    } else {
      // No clusters exist, open modal to create one first
      setPendingCard(card);
      setIsCreateModalOpen(true);
    }
  }, [cityId, clusters, addItemToCluster]);

  // Handle opening create cluster modal (from dropdown)
  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // Handle creating cluster from modal
  const handleCreateCluster = useCallback((name: string, center?: LatLng) => {
    const newClusterId = createCluster(cityId, name, center || cityCenter);
    // If there was a pending card, add it to the new cluster
    if (pendingCard && newClusterId) {
      addItemToCluster(cityId, newClusterId, pendingCard);
      setPendingCard(null);
    }
  }, [cityId, cityCenter, createCluster, addItemToCluster, pendingCard]);

  // Handle "Show more" for a category
  const handleShowMore = useCallback((type: PlanCardType) => {
    generateSuggestions(type, 10);
  }, [generateSuggestions]);

  // Handle "Surprise me" - generate random cards across all types
  const handleSurpriseMe = useCallback(async () => {
    // Generate 1 card for 3 random categories
    const shuffled = [...categories].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const category of shuffled) {
      await generateSuggestions(category.type, 1);
    }
  }, [generateSuggestions]);

  // Check if any category is generating
  const isAnyGenerating = Object.values(isGenerating).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h3 className="font-['Fraunces',serif] text-xl text-[#2C2417] font-semibold mb-1">
          Discover {cityName}
        </h3>
        <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif]">
          Browse suggestions or generate more options
        </p>
      </motion.div>

      {/* Filter bar */}
      <FilterBar
        priceFilter={filters.priceRange || null}
        sortBy={filters.sortBy}
        onPriceChange={(levels) => setFilters({ priceRange: levels as PriceLevel[] | undefined })}
        onSortChange={(sort) => setFilters({ sortBy: sort })}
      />

      {/* Nearby section (only if user has clusters with items) */}
      {clusters.length > 0 && clusters.some((c) => c.items.length > 0) && (
        <NearbySection
          cards={filterByPrice(nearbySuggestions)}
          onAddCard={handleAddCard}
          addedIds={addedIds}
        />
      )}

      {/* Category sections */}
      <div className="space-y-8">
        {categories.map((category) => {
          const suggestions = suggestionsMap[category.type] || [];
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
              onCreateCluster={handleOpenCreateModal}
              clusters={clusters}
              addedIds={addedIds}
            />
          );
        })}
      </div>

      {/* Surprise me button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-4 border-t border-[#E5DDD0]"
      >
        <button
          onClick={handleSurpriseMe}
          disabled={isAnyGenerating}
          className={`
            w-full py-4 rounded-xl
            bg-gradient-to-r from-[#7C5CDB] to-[#C45830]
            text-white font-['Satoshi',sans-serif] font-semibold text-base
            flex items-center justify-center gap-2
            shadow-lg shadow-[#7C5CDB]/20
            hover:shadow-xl hover:shadow-[#7C5CDB]/30
            hover:scale-[1.01] active:scale-[0.99]
            transition-all duration-200
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
        >
          {isAnyGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Shuffle className="w-5 h-5" />
              Surprise me!
            </>
          )}
        </button>
        <p className="text-xs text-[#C4B8A5] text-center mt-2 font-['Satoshi',sans-serif]">
          Generate 3 random suggestions across all categories
        </p>
      </motion.div>

      {/* Create Cluster Modal */}
      <CreateClusterModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPendingCard(null);
        }}
        onCreateCluster={handleCreateCluster}
        cityName={cityName}
        cityCenter={cityCenter}
      />
    </div>
  );
}

export default DiscoverPanel;
