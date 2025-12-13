/**
 * CategorySection
 *
 * Section for a single card type (restaurants, activities, etc.)
 * Features: header with icon, 2-column grid of cards, "Show more" button.
 *
 * Design: Editorial section with clear hierarchy
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { SuggestionCard, SuggestionCardSkeleton } from './SuggestionCard';
import type { PlanCard, PlanCardType, Cluster } from '../../../types/planning';

export interface CategorySectionProps {
  type: PlanCardType;
  title: string;
  icon: React.ReactNode;
  cards: PlanCard[];
  isLoading: boolean;
  hasMore: boolean;
  onShowMore: () => void;
  onAddCard: (card: PlanCard) => void;
  clusters: Cluster[];
  addedIds: Set<string>;
}

// Calculate nearest cluster for a card
function getNearestCluster(
  card: PlanCard,
  clusters: Cluster[]
): { name: string; walkingMinutes: number } | undefined {
  if (clusters.length === 0) return undefined;

  // Use proximity data if attached to card
  const cardWithProximity = card as PlanCard & {
    proximity?: { clusterName: string; walkingMinutes: number };
  };
  if (cardWithProximity.proximity) {
    return {
      name: cardWithProximity.proximity.clusterName,
      walkingMinutes: cardWithProximity.proximity.walkingMinutes,
    };
  }

  // Calculate manually
  let nearest: { name: string; walkingMinutes: number } | undefined;
  let minDistance = Infinity;

  for (const cluster of clusters) {
    if (!cluster.center || !card.location) continue;

    // Simple distance calculation (Haversine approximation)
    const R = 6371;
    const dLat = ((cluster.center.lat - card.location.lat) * Math.PI) / 180;
    const dLng = ((cluster.center.lng - card.location.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((card.location.lat * Math.PI) / 180) *
        Math.cos((cluster.center.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const walkingMinutes = Math.round((distanceKm / 5) * 1.2 * 60);

    if (walkingMinutes < minDistance) {
      minDistance = walkingMinutes;
      nearest = {
        name: cluster.name,
        walkingMinutes,
      };
    }
  }

  return nearest;
}

export function CategorySection({
  title,
  icon,
  cards,
  isLoading,
  hasMore,
  onShowMore,
  onAddCard,
  clusters,
  addedIds,
}: CategorySectionProps) {
  const showMoreCount = 10;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-['Satoshi',sans-serif] font-semibold text-sm text-[#2C2417] uppercase tracking-wide flex items-center gap-2">
          {icon}
          {title}
          {cards.length > 0 && (
            <span className="text-[#C4B8A5] font-normal lowercase">
              ({cards.length})
            </span>
          )}
        </h4>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <SuggestionCard
                card={card}
                nearestCluster={getNearestCluster(card, clusters)}
                onAdd={() => onAddCard(card)}
                isAdded={addedIds.has(card.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading skeletons */}
        {isLoading && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <SuggestionCardSkeleton />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Empty state */}
      {cards.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <p className="text-sm text-[#C4B8A5] font-['Satoshi',sans-serif]">
            No {title.toLowerCase()} yet. Click below to generate some!
          </p>
        </motion.div>
      )}

      {/* Show more button */}
      {hasMore && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onShowMore}
          disabled={isLoading}
          className={`
            w-full py-3 rounded-xl
            border border-dashed
            ${isLoading
              ? 'border-[#E5DDD0] bg-[#FAF7F2] cursor-wait'
              : 'border-[#C4B8A5] hover:border-[#C45830] hover:bg-[#FEF3EE]/50'
            }
            text-sm font-['Satoshi',sans-serif] font-medium
            ${isLoading ? 'text-[#C4B8A5]' : 'text-[#8B7355] hover:text-[#C45830]'}
            transition-all duration-200
            flex items-center justify-center gap-2
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating {title.toLowerCase()}...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Show {showMoreCount} more {title.toLowerCase()}
            </>
          )}
        </motion.button>
      )}
    </section>
  );
}

export default CategorySection;
