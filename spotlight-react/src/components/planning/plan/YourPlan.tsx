/**
 * YourPlan
 *
 * Left panel showing the user's planned clusters.
 * Now with browse-first UX: no manual cluster creation, system auto-organizes.
 *
 * Features:
 * - Browse-first empty state (encourages exploring suggestions)
 * - Auto-organized clusters by area
 * - Summary stats
 * - Inline companion tips (contextual, helpful suggestions)
 * - Drag-and-drop reordering (future)
 *
 * Design: Wanderlust Editorial - warm, inviting, magazine-quality
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Footprints, ArrowRight, Sparkles } from 'lucide-react';
import { ClusterCard } from './ClusterCard';
import { InlineTipStack } from '../shared/InlineTip';
import { useCompanionTips } from '../../../hooks/useCompanionTips';
import { usePlanningStore } from '../../../stores/planningStore';
import type { YourPlanProps, LatLng, CityPlan } from '../../../types/planning';

// Animation variants for staggered reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

interface WelcomeStateProps {
  cityName?: string;
}

/**
 * Browse-first empty state
 * Encourages users to explore suggestions rather than manually create clusters
 */
function BrowseFirstEmptyState({ cityName }: WelcomeStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Decorative illustration */}
      <div className="relative mb-8">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FEF3EE] via-[#F5F0FF] to-[#EEF6F8] flex items-center justify-center shadow-lg shadow-[#2C2417]/5"
        >
          <MapPin className="w-12 h-12 text-[#C45830]" strokeWidth={1.5} />
        </motion.div>
        {/* Floating sparkles */}
        <motion.div
          animate={{
            y: [-4, 4, -4],
            rotate: [0, 15, 0],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-6 h-6 text-[#D4A853]" />
        </motion.div>
        <motion.div
          animate={{
            y: [4, -4, 4],
            rotate: [0, -10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-2 -left-2"
        >
          <Sparkles className="w-4 h-4 text-[#7C5CDB]" />
        </motion.div>
      </div>

      <h3 className="font-['Fraunces',Georgia,serif] text-2xl text-[#2C2417] font-semibold mb-4">
        Your {cityName || 'Trip'} Plan
      </h3>

      <p className="text-[#8B7355] font-['Satoshi',system-ui,sans-serif] text-base max-w-sm mb-2 leading-relaxed">
        Browse activities on the right and tap{' '}
        <span className="inline-flex items-center gap-1 text-[#C45830] font-semibold">
          + Add to Plan
        </span>{' '}
        to build your itinerary.
      </p>

      <p className="text-[#C4B8A5] font-['Satoshi',system-ui,sans-serif] text-sm max-w-sm leading-relaxed">
        We'll automatically organize everything by area so you can walk between spots easily.
      </p>

      {/* Arrow pointing to suggestions */}
      <motion.div
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-8 flex items-center gap-2 text-[#C45830]"
      >
        <span className="text-sm font-medium font-['Satoshi',system-ui,sans-serif]">
          Start exploring
        </span>
        <ArrowRight className="w-5 h-5" />
      </motion.div>
    </motion.div>
  );
}

interface PlanSummaryProps {
  totalItems: number;
  totalDuration: number;
  clusterCount: number;
}

function PlanSummary({ totalItems, totalDuration, clusterCount }: PlanSummaryProps) {
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  const durationText = hours > 0
    ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
    : `${minutes}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-4 py-3 mb-4 bg-[#FFFBF5] rounded-xl border border-[#E5DDD0] shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-lg bg-[#FEF3EE] flex items-center justify-center">
          <MapPin className="w-4 h-4 text-[#C45830]" />
        </div>
        <div>
          <span className="font-['Satoshi',system-ui,sans-serif] font-semibold text-[#2C2417]">
            {totalItems}
          </span>
          <span className="text-[#8B7355] ml-1">
            {totalItems === 1 ? 'place' : 'places'}
          </span>
        </div>
      </div>

      <div className="w-px h-6 bg-[#E5DDD0]" />

      <div className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-lg bg-[#F0F7F4] flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#4A7C59]" />
        </div>
        <div>
          <span className="font-['Satoshi',system-ui,sans-serif] font-semibold text-[#2C2417]">
            {durationText}
          </span>
          <span className="text-[#8B7355] ml-1">total</span>
        </div>
      </div>

      <div className="w-px h-6 bg-[#E5DDD0]" />

      <div className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-lg bg-[#EEF6F8] flex items-center justify-center">
          <Footprints className="w-4 h-4 text-[#4A90A4]" />
        </div>
        <div>
          <span className="font-['Satoshi',system-ui,sans-serif] font-semibold text-[#2C2417]">
            {clusterCount}
          </span>
          <span className="text-[#8B7355] ml-1">
            {clusterCount === 1 ? 'area' : 'areas'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface YourPlanExtendedProps extends YourPlanProps {
  cityName?: string;
  cityCenter?: LatLng;
  nights?: number;
  onScrollToTab?: (tab: 'restaurants' | 'hotels' | 'activities') => void;
}

export function YourPlan({
  cityId,
  clusters,
  unclustered,
  cityName = 'this city',
  nights = 1,
  onScrollToTab,
}: YourPlanExtendedProps) {
  // Dismissed tips state
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  // Store actions and state
  const {
    removeItemFromCluster,
    moveItemToCluster,
    reorderItemsInCluster,
    renameCluster,
    deleteCluster,
    cityPlans,
  } = usePlanningStore();

  // Get the full city plan for tips
  const cityPlan = cityPlans[cityId] as CityPlan | undefined;

  // Generate contextual tips
  const allTips = useCompanionTips(cityPlan || null, { maxTips: 3, nights });

  // Filter out dismissed tips
  const visibleTips = allTips.filter(tip => !dismissedTips.has(tip.id));

  // Handle tip dismissal
  const handleDismissTip = useCallback((tipId: string) => {
    setDismissedTips(prev => new Set([...prev, tipId]));
  }, []);

  // Handle tip actions
  const handleTipAction = useCallback((actionType: string) => {
    switch (actionType) {
      case 'scroll_to_restaurants':
        onScrollToTab?.('restaurants');
        break;
      case 'scroll_to_hotels':
        onScrollToTab?.('hotels');
        break;
      default:
        break;
    }
  }, [onScrollToTab]);

  // Compute totals
  const totalItems = clusters.reduce((sum, c) => sum + c.items.length, 0) + unclustered.length;
  const totalDuration = clusters.reduce((sum, c) => sum + c.totalDuration, 0);

  // Check if empty (no clusters with items)
  const isEmpty = clusters.length === 0 || (clusters.every(c => c.items.length === 0) && unclustered.length === 0);

  const handleRemoveItem = (clusterId: string, itemId: string) => {
    removeItemFromCluster(cityId, clusterId, itemId);
  };

  const handleRenameCluster = (clusterId: string, name: string) => {
    renameCluster(cityId, clusterId, name);
  };

  const handleDeleteCluster = (clusterId: string) => {
    deleteCluster(cityId, clusterId);
  };

  const handleMoveItem = (clusterId: string, itemId: string, toClusterId: string) => {
    moveItemToCluster(cityId, clusterId, toClusterId, itemId);
  };

  const handleReorderItems = (clusterId: string, reorderedItems: typeof clusters[0]['items']) => {
    reorderItemsInCluster(cityId, clusterId, reorderedItems);
  };

  // Empty state - encourage browsing
  if (isEmpty) {
    return <BrowseFirstEmptyState cityName={cityName} />;
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {totalItems > 0 && (
        <PlanSummary
          totalItems={totalItems}
          totalDuration={totalDuration}
          clusterCount={clusters.filter(c => c.items.length > 0).length}
        />
      )}

      {/* Inline Companion Tips */}
      {visibleTips.length > 0 && (
        <InlineTipStack
          tips={visibleTips}
          onDismiss={handleDismissTip}
          onAction={handleTipAction}
        />
      )}

      {/* Clusters */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Active clusters with items */}
        <AnimatePresence mode="popLayout">
          {clusters
            .filter(cluster => cluster.items.length > 0)
            .map((cluster) => (
              <motion.div
                key={cluster.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <ClusterCard
                  cluster={cluster}
                  onRemoveItem={(itemId) => handleRemoveItem(cluster.id, itemId)}
                  onRename={(name) => handleRenameCluster(cluster.id, name)}
                  onDelete={() => handleDeleteCluster(cluster.id)}
                  allClusters={clusters}
                  onMoveItem={(itemId, toClusterId) => handleMoveItem(cluster.id, itemId, toClusterId)}
                  onReorderItems={(reorderedItems) => handleReorderItems(cluster.id, reorderedItems)}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>

      {/* Unclustered items reminder */}
      {unclustered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-[#FEF3EE] rounded-xl border border-[#F5E6DC]"
        >
          <p className="text-sm text-[#8B7355] font-['Satoshi',system-ui,sans-serif]">
            <span className="font-semibold text-[#C45830]">{unclustered.length}</span>
            {' '}saved {unclustered.length === 1 ? 'place' : 'places'} not organized yet.
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default YourPlan;
