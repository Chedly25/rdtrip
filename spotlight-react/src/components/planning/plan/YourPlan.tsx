/**
 * YourPlan
 *
 * Left panel container showing the user's planned clusters.
 * Features: welcome state, cluster list, suggested areas, create button.
 *
 * Design: Wanderlust Editorial - warm, inviting, magazine-quality
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, MapPin, Clock, Footprints } from 'lucide-react';
import { ClusterCard } from './ClusterCard';
import { EmptyClusterSuggestion } from './EmptyClusterSuggestion';
import { CreateClusterModal } from './CreateClusterModal';
import { usePlanningStore } from '../../../stores/planningStore';
import type { YourPlanProps, SuggestedCluster, LatLng } from '../../../types/planning';

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
  onStartBuilding: () => void;
}

function WelcomeState({ cityName, onStartBuilding }: WelcomeStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Decorative illustration */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE] flex items-center justify-center">
          <MapPin className="w-10 h-10 text-[#C45830]" strokeWidth={1.5} />
        </div>
        {/* Floating sparkles */}
        <motion.div
          animate={{
            y: [-2, 2, -2],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-6 h-6 text-[#D4A853]" />
        </motion.div>
      </div>

      <h3 className="font-['Fraunces',serif] text-xl sm:text-2xl text-[#2C2417] font-semibold mb-3">
        Start building your {cityName || 'trip'}
      </h3>

      <p className="text-[#8B7355] font-['Satoshi',sans-serif] text-sm sm:text-base max-w-sm mb-8 leading-relaxed">
        Explore the suggestions on the right and add places to build your perfect itinerary.
        We'll organize everything by area so you can walk between spots easily.
      </p>

      <button
        onClick={onStartBuilding}
        className="
          group relative px-6 py-3
          bg-gradient-to-r from-[#C45830] to-[#D4724A]
          text-white font-['Satoshi',sans-serif] font-semibold text-sm
          rounded-xl shadow-lg shadow-[#C45830]/20
          hover:shadow-xl hover:shadow-[#C45830]/30
          hover:scale-[1.02] active:scale-[0.98]
          transition-all duration-200
        "
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create your first area
        </span>
      </button>

      {/* Subtle hint */}
      <p className="mt-6 text-xs text-[#C4B8A5] font-['Satoshi',sans-serif]">
        Or browse suggestions and we'll create areas automatically
      </p>
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
      className="flex items-center gap-4 px-4 py-3 mb-4 bg-[#FFFBF5] rounded-xl border border-[#E5DDD0]"
    >
      <div className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-lg bg-[#FEF3EE] flex items-center justify-center">
          <MapPin className="w-4 h-4 text-[#C45830]" />
        </div>
        <div>
          <span className="font-['Satoshi',sans-serif] font-semibold text-[#2C2417]">
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
          <span className="font-['Satoshi',sans-serif] font-semibold text-[#2C2417]">
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
          <span className="font-['Satoshi',sans-serif] font-semibold text-[#2C2417]">
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
}

export function YourPlan({
  cityId,
  clusters,
  unclustered,
  suggestedClusters = [],
  cityName = 'this city',
  cityCenter = { lat: 0, lng: 0 },
}: YourPlanExtendedProps) {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Store actions
  const {
    createCluster,
    removeItemFromCluster,
    moveItemToCluster,
    reorderItemsInCluster,
    renameCluster,
    deleteCluster,
  } = usePlanningStore();

  // Compute totals
  const totalItems = clusters.reduce((sum, c) => sum + c.items.length, 0) + unclustered.length;
  const totalDuration = clusters.reduce((sum, c) => sum + c.totalDuration, 0);

  // Check if empty
  const isEmpty = clusters.length === 0 && suggestedClusters.length === 0;

  const handleStartFromSuggestion = (suggestion: SuggestedCluster) => {
    createCluster(cityId, suggestion.name, suggestion.center);
  };

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

  const handleCreateCluster = (name: string, center?: LatLng) => {
    createCluster(cityId, name, center || cityCenter);
  };

  // Empty state
  if (isEmpty) {
    return (
      <>
        <WelcomeState
          cityName={cityName}
          onStartBuilding={() => setIsCreateModalOpen(true)}
        />
        <CreateClusterModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateCluster={handleCreateCluster}
          cityName={cityName}
          cityCenter={cityCenter}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {totalItems > 0 && (
        <PlanSummary
          totalItems={totalItems}
          totalDuration={totalDuration}
          clusterCount={clusters.length}
        />
      )}

      {/* Clusters and suggestions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Active clusters */}
        <AnimatePresence mode="popLayout">
          {clusters.map((cluster) => (
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

        {/* Suggested clusters (not yet started) */}
        {suggestedClusters.map((suggestion) => (
          <motion.div key={suggestion.id} variants={itemVariants}>
            <EmptyClusterSuggestion
              area={suggestion}
              onStart={() => handleStartFromSuggestion(suggestion)}
            />
          </motion.div>
        ))}

        {/* Create new area button */}
        <motion.button
          variants={itemVariants}
          onClick={() => setIsCreateModalOpen(true)}
          className="
            w-full p-4
            border-2 border-dashed border-[#E5DDD0] rounded-xl
            text-[#8B7355] font-['Satoshi',sans-serif] font-medium text-sm
            hover:border-[#C45830] hover:text-[#C45830] hover:bg-[#FEF3EE]/50
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          <Plus className="w-4 h-4" />
          Create new area
        </motion.button>
      </motion.div>

      {/* Unclustered items reminder */}
      {unclustered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-[#FEF3EE] rounded-xl border border-[#F5E6DC]"
        >
          <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif]">
            <span className="font-semibold text-[#C45830]">{unclustered.length}</span>
            {' '}saved {unclustered.length === 1 ? 'place' : 'places'} not in any area yet.
            Drag them to an area or create a new one.
          </p>
        </motion.div>
      )}

      {/* Create Cluster Modal */}
      <CreateClusterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCluster={handleCreateCluster}
        cityName={cityName}
        cityCenter={cityCenter}
      />
    </div>
  );
}

export default YourPlan;
